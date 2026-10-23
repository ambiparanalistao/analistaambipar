/**
 * Serviço de Integração Direta com Evolution API v2
 * Realiza disparos de mensagens WhatsApp 100% via API (sem abrir Web ou App)
 */

export const EVOLUTION_STORAGE_KEYS = {
  SERVER_URL: 'ambipar_evolution_url',
  API_KEY: 'ambipar_evolution_key',
  INSTANCE_NAME: 'ambipar_evolution_instance'
};

export const DEFAULT_EVOLUTION_SETTINGS = {
  serverUrl: (typeof window !== 'undefined' && localStorage.getItem(EVOLUTION_STORAGE_KEYS.SERVER_URL)) || 'http://localhost:8080',
  apiKey: (typeof window !== 'undefined' && localStorage.getItem(EVOLUTION_STORAGE_KEYS.API_KEY)) || 'ambipar_evolution_secret_key',
  instanceName: (typeof window !== 'undefined' && localStorage.getItem(EVOLUTION_STORAGE_KEYS.INSTANCE_NAME)) || 'ambipar-cco'
};

/**
 * Obtém as configurações atuais da Evolution API
 */
export function getEvolutionSettings() {
  if (typeof window === 'undefined') return DEFAULT_EVOLUTION_SETTINGS;
  return {
    serverUrl: localStorage.getItem(EVOLUTION_STORAGE_KEYS.SERVER_URL) || DEFAULT_EVOLUTION_SETTINGS.serverUrl,
    apiKey: localStorage.getItem(EVOLUTION_STORAGE_KEYS.API_KEY) || DEFAULT_EVOLUTION_SETTINGS.apiKey,
    instanceName: localStorage.getItem(EVOLUTION_STORAGE_KEYS.INSTANCE_NAME) || DEFAULT_EVOLUTION_SETTINGS.instanceName
  };
}

/**
 * Salva as configurações da Evolution API no navegador
 */
export function saveEvolutionSettings(settings) {
  if (typeof window === 'undefined') return;
  if (settings.serverUrl) localStorage.setItem(EVOLUTION_STORAGE_KEYS.SERVER_URL, settings.serverUrl.replace(/\/+$/, ''));
  if (settings.apiKey) localStorage.setItem(EVOLUTION_STORAGE_KEYS.API_KEY, settings.apiKey.trim());
  if (settings.instanceName) localStorage.setItem(EVOLUTION_STORAGE_KEYS.INSTANCE_NAME, settings.instanceName.trim());
}

/**
 * Normaliza número para formato E.164 brasileiro (ex: 5519987654321)
 */
export function formatPhoneNumberE164(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Disparo Direto de Mensagem de Texto via Evolution API
 * Endpoint: POST /message/sendText/{instance}
 * Não abre WhatsApp Web nem aplicativo móvel.
 */
export async function sendEvolutionMessage({ phone, text, overrideSettings = null }) {
  const settings = overrideSettings || getEvolutionSettings();
  const baseUrl = settings.serverUrl.replace(/\/+$/, '');
  const instance = settings.instanceName;
  const formattedNumber = formatPhoneNumberE164(phone);

  if (!formattedNumber || formattedNumber.length < 10) {
    throw new Error('Número de WhatsApp do condutor inválido ou incompleto (necessário DDD).');
  }

  if (!text || !text.trim()) {
    throw new Error('O conteúdo da mensagem não pode estar vazio.');
  }

  const endpoint = `${baseUrl}/message/sendText/${instance}`;
  const payload = {
    number: formattedNumber,
    text: text,
    linkPreview: false,
    delay: 1000
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': settings.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data?.key?.id || data?.id || `EVO-${Date.now().toString().slice(-6)}`,
        data,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      const errorText = await response.text();
      let parsed = errorText;
      try {
        const jsonErr = JSON.parse(errorText);
        parsed = jsonErr?.response?.message || jsonErr?.message || errorText;
      } catch {}
      throw new Error(`Servidor Evolution API retornou status ${response.status}: ${parsed}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Tempo limite esgotado ao conectar no servidor Evolution API (${baseUrl}).`);
    }
    throw err;
  }
}
