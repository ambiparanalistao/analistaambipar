import { supabase } from '../lib/supabaseClient';

export async function listCompanyOperationalRecords(companyId, collection) {
  if (!supabase || !companyId) throw new Error('Selecione uma empresa conectada ao Supabase.');
  const { data, error } = await supabase.from('company_operational_records')
    .select('id,record_key,payload,created_at,updated_at')
    .eq('company_id', companyId).eq('collection', collection)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message || 'Não foi possível carregar os registros da empresa.');
  return data || [];
}

export async function saveCompanyOperationalRecord({ companyId, collection, recordKey, payload, userId }) {
  if (!supabase || !companyId || !recordKey) throw new Error('Empresa ou identificador do registro ausente.');
  const existing = await supabase.from('company_operational_records').select('id')
    .eq('company_id', companyId).eq('collection', collection).eq('record_key', String(recordKey)).maybeSingle();
  if (existing.error) throw new Error(existing.error.message || 'Não foi possível conferir o registro atual.');
  const query = existing.data
    ? supabase.from('company_operational_records').update({ payload, updated_by: userId || null, updated_at: new Date().toISOString() }).eq('id', existing.data.id)
    : supabase.from('company_operational_records').insert({ company_id: companyId, collection, record_key: String(recordKey), payload, created_by: userId || null, updated_by: userId || null });
  const { data, error } = await query.select('id,record_key,payload,created_at,updated_at').single();
  if (error) throw new Error(error.message || 'Não foi possível salvar o registro da empresa.');
  return data;
}

