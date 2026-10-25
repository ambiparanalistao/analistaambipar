import { supabase } from './supabaseClient';

export async function evolutionRequest(action, signal, payload = {}) {
  if (!supabase) throw new Error('Configure o Supabase e entre na sua conta.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Entre com usuário e senha. O modo demonstrativo não permite gerenciar a instância.');
  const response = await fetch('/api/evolution', {
    method: action ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + data.session.access_token,
      ...(action ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(action ? { body: JSON.stringify({ ...payload, action }) } : {}),
    cache: 'no-store', signal,
  });
  let result;
  try { result = await response.json(); } catch { throw new Error('O serviço de conexão não está disponível neste ambiente.'); }
  if (!response.ok) throw new Error(result.error || 'Não foi possível consultar a conexão.');
  return result;
}
