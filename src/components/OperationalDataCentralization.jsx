import React, { useCallback, useEffect, useState } from 'react';
import { Download, Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const LOCAL_KEYS = [
  'ambipar_real_vehicles',
  'ambipar_real_drivers',
  'ambipar_real_schedules',
  'ambipar_real_schedules_v2',
  'ambipar_real_clients_v2',
  'ambipar_user_schedules_clean_v1',
  'ambipar_real_trips',
  'ambipar_real_incidents',
  'ambipar_fuel_records_v1',
  'ambipar_weekly_fuel_cycles_v8',
  'ambipar_aporte_documents_history_v8',
  'ambipar_fuel_cycle_settings_v8',
  'ambipar_fuel_is_global_v8',
  'ambipar_fuel_target_total_v8',
  'ambipar_fuel_custom_quotas_v8',
  'ambipar_audit_justified',
  'ambipar_monthly_fleet_costs_2026',
  'ambipar_monthly_costs_legacy_backup',
  'ambipar_freight_simulations',
];

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function readLocalEntries() {
  return LOCAL_KEYS.flatMap(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return [];
      return [{ key, value: JSON.parse(raw), raw }];
    } catch {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? [] : [{ key, value: raw, raw }];
      } catch {
        return [];
      }
    }
  });
}

export default function OperationalDataCentralization({ companyId, user }) {
  const [entries, setEntries] = useState(readLocalEntries);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reviewRows, setReviewRows] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewBusy, setReviewBusy] = useState('');
  const rescanLocalData = () => {
    setEntries(readLocalEntries());
    setError('');
    setMessage('Leitura local atualizada. Confira os conjuntos antes de copiar para revisão.');
  };

  const loadReviewRows = useCallback(async () => {
    if (!supabase || !companyId) { setReviewRows([]); setReviewLoading(false); return; }
    setReviewRows([]);
    setReviewLoading(true);
    const { data, error: loadError } = await supabase.from('operational_data_import_rows')
      .select('id,entity,source_key,payload,review_status,review_note,created_at')
      .eq('company_id', companyId).eq('entity', 'local_storage')
      .in('review_status', ['pendente', 'aprovado', 'rejeitado'])
      .order('created_at', { ascending: false }).limit(200);
    if (loadError) setError(loadError.message || 'Não foi possível carregar a revisão.');
    else setReviewRows(data || []);
    setReviewLoading(false);
  }, [companyId]);

  useEffect(() => { loadReviewRows(); }, [loadReviewRows]);

  async function reviewRow(row, status) {
    if (!supabase || !companyId || reviewBusy) return;
    setReviewBusy(row.id); setError(''); setMessage('');
    const review_note = status === 'rejeitado' ? 'Rejeitado na revisão pelo responsável da empresa.' : 'Aprovado na revisão pelo responsável da empresa.';
    const { error: saveError } = await supabase.from('operational_data_import_rows')
      .update({ review_status: status, review_note, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', row.id).eq('company_id', companyId).eq('review_status', 'pendente');
    if (saveError) setError(saveError.message || 'Não foi possível salvar a revisão deste registro.');
    else { setMessage(`Registro marcado como ${status === 'aprovado' ? 'aprovado' : 'rejeitado'} para revisão.`); await loadReviewRows(); }
    setReviewBusy('');
  }

  function downloadBackup() {
    const backup = { version: 1, exported_at: new Date().toISOString(), company_id: companyId, items: entries.map(({ key, value }) => ({ key, value })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-dados-operacionais-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyToDatabase() {
    if (!supabase || !companyId || !user?.id) { setError('Selecione uma empresa com sessão ativa antes de enviar.'); return; }
    if (!entries.length) { setMessage('Este navegador não contém dados locais para copiar.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const serialized = JSON.stringify(entries.map(({ key, value }) => ({ key, value })));
      const checksum = bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized)));
      const { data: batch, error: batchError } = await supabase.from('operational_data_import_batches').upsert({
        company_id: companyId, source_name: `local-storage:${user.id}`, source_checksum: checksum,
        status: 'em_revisao', counts: { local_storage_keys: entries.length }, created_by: user.id,
      }, { onConflict: 'company_id,source_name,source_checksum' }).select('id').single();
      if (batchError) throw batchError;
      const rows = entries.map(({ key, value }) => ({ company_id: companyId, batch_id: batch.id,
        entity: 'local_storage', source_key: `${user.id}:${key}`, payload: { key, value, exported_at: new Date().toISOString() },
      }));
      const { error: rowsError } = await supabase.from('operational_data_import_rows').upsert(rows,
        { onConflict: 'company_id,batch_id,entity,source_key' });
      if (rowsError) throw rowsError;
      setMessage(`${entries.length} conjuntos de dados copiados para a área de revisão privada do Supabase. Os dados originais continuam neste navegador.`);
      await loadReviewRows();
    } catch (e) {
      setError(e.message || 'Não foi possível copiar os dados locais para o Supabase.');
    } finally {
      setBusy(false);
    }
  }

  const recordCount = entries.reduce((sum, entry) => sum + (Array.isArray(entry.value) ? entry.value.length : 1), 0);
  return <section className="module-view animate-fade-in" style={{ maxWidth: 1050, margin: '0 auto' }}>
    <header style={{ marginBottom: 24 }}><p style={{ color: 'var(--text-muted)' }}>CENTRALIZAÇÃO SEGURA</p><h1>Dados locais deste navegador</h1>
      <p>Faça uma cópia de segurança e envie os registros locais para revisão da empresa no Supabase. Esta etapa não apaga nem altera o navegador.</p></header>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
      <article className="dashboard-card" style={{ flex: '1 1 220px', padding: 20 }}><strong>{entries.length}</strong><p>áreas com dados neste navegador</p></article>
      <article className="dashboard-card" style={{ flex: '1 1 220px', padding: 20 }}><strong>{recordCount}</strong><p>itens aproximados guardados localmente</p></article>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <button type="button" onClick={rescanLocalData} disabled={busy}><RefreshCw size={16}/> Atualizar leitura local</button>
      <button type="button" className="btn-primary" onClick={downloadBackup} disabled={!entries.length}><Download size={16}/> Baixar backup JSON</button>
      <button type="button" className="btn-primary" onClick={copyToDatabase} disabled={busy || !entries.length}><Database size={16}/>{busy ? ' Copiando…' : ' Copiar para revisão no Supabase'}</button>
    </div>
    {error && <p role="alert" style={{ color: 'var(--danger, #ef4444)', marginTop: 18 }}>{error}</p>}
    {message && <p role="status" style={{ marginTop: 18 }}><ShieldCheck size={16}/> {message}</p>}
    <h2 style={{ marginTop: 30 }}>Áreas verificadas</h2>
    <ul>{entries.map(({ key, value }) => <li key={key}>{key} · {Array.isArray(value) ? `${value.length} registros` : '1 conjunto de configurações'}</li>)}</ul>
    <h2 style={{ marginTop: 30 }}>Revisão por empresa</h2>
    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aprovar ou rejeitar aqui registra sua decisão no staging. A aprovação não ativa registros operacionais automaticamente; o formato ainda precisa ser validado e mapeado para a tabela correta.</p>
    {reviewLoading ? <p role="status">Carregando registros em revisão…</p> : reviewRows.length === 0 ? <p>Nenhum registro pendente de revisão para esta empresa.</p> : <div style={{ display: 'grid', gap: 12 }}>
      {reviewRows.map(row => <article key={row.id} className="dashboard-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><strong>{row.payload?.key || row.entity}</strong><p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>Status: {row.review_status} · Chave de origem: {row.source_key}</p></div>
          {row.review_status === 'pendente' && <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-primary" disabled={!!reviewBusy} onClick={() => reviewRow(row, 'aprovado')}>{reviewBusy === row.id ? 'Salvando…' : 'Aprovar revisão'}</button>
            <button type="button" disabled={!!reviewBusy} onClick={() => reviewRow(row, 'rejeitado')}>Rejeitar</button>
          </div>}
        </div>
        <details style={{ marginTop: 10 }}><summary>Conferir conteúdo copiado</summary><pre style={{ maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(row.payload?.value ?? row.payload, null, 2)}</pre></details>
      </article>)}
      {reviewRows.length === 200 && <p>Mostrando os 200 registros mais recentes; revise em lotes menores.</p>}
    </div>}
  </section>;
}
