/**
 * Serviço de mensagens corporativas.
 * Credenciais e conexão com a Evolution permanecem no endpoint serverless.
 */
import { evolutionRequest } from '../lib/evolutionClient';
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ambipar_evolution_url');
    localStorage.removeItem('ambipar_evolution_key');
    localStorage.removeItem('ambipar_evolution_instance');
  }
} catch { /* Storage cleanup is best effort. */ }

/** Normaliza número para formato E.164 brasileiro (ex: 5519987654321). */
export function formatPhoneNumberE164(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/** Envia somente pelo backend autenticado; nunca expõe a apikey ao navegador. */
export async function sendEvolutionMessage({ phone, text }) {
  const number = formatPhoneNumberE164(phone);
  if (!number || number.length < 10) {
    throw new Error('Número de WhatsApp do condutor inválido ou incompleto (necessário DDD).');
  }
  if (!text || !text.trim()) throw new Error('O conteúdo da mensagem não pode estar vazio.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);
  try {
    const data = await evolutionRequest('sendText', controller.signal, { number, text: text.trim() });
    return {
      success: true,
      messageId: data?.key?.id || data?.id || 'enviado',
      data,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Tempo limite ao enviar pelo servidor WhatsApp.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}