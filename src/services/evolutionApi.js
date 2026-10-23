/**
 * Serviço de Integração com a Evolution API v2 (WhatsApp Business Gateway)
 * Gerencia autenticação, criação de instância, conexão via QR Code e disparo direto de mensagens.
 */

const STORAGE_KEYS = {
  URL: 'ambipar_evolution_api_url',
  API_KEY: 'ambipar_evolution_api_key',
  INSTANCE: 'ambipar_evolution_instance_name',
  AUTO_SEND: 'ambipar_evolution_auto_send'
};

export const DEFAULT_EVOLUTION_CONFIG = {
  serverUrl: 'https://evolution.ambipar.internal',
  apiKey: 'ambipar_cco_secure_gateway_token_2026',
  instanceName: 'ambipar-frotas-cco',
  autoSend: false
};

/**
 * Recupera as credenciais da Evolution API salvas no navegador
 */
export function getEvolutionConfig() {
  if (typeof window === 'undefined') return DEFAULT_EVOLUTION_CONFIG;
  return {
    serverUrl: localStorage.getItem(STORAGE_KEYS.URL) || DEFAULT_EVOLUTION_CONFIG.serverUrl,
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || DEFAULT_EVOLUTION_CONFIG.apiKey,
    instanceName: localStorage.getItem(STORAGE_KEYS.INSTANCE) || DEFAULT_EVOLUTION_CONFIG.instanceName,
    autoSend: localStorage.getItem(STORAGE_KEYS.AUTO_SEND) === 'true'
  };
}

/**
 * Salva as credenciais da Evolution API
 */
export function saveEvolutionConfig(config) {
  if (typeof window === 'undefined') return;
  if (config.serverUrl) localStorage.setItem(STORAGE_KEYS.URL, config.serverUrl.replace(/\/+$/, ''));
  if (config.apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim());
  if (config.instanceName) localStorage.setItem(STORAGE_KEYS.INSTANCE, config.instanceName.trim());
  if (typeof config.autoSend === 'boolean') localStorage.setItem(STORAGE_KEYS.AUTO_SEND, String(config.autoSend));
}

/**
 * Normaliza número para padrão internacional E.164 (ex: 5511999999999)
 */
export function formatPhoneNumberForEvolution(phone) {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return '';
  if (clean.startsWith('55')) return clean;
  // Se tem DDD e número (10 ou 11 dígitos), prefixa com 55
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

/**
 * Verifica o estado de conexão da instância na Evolution API
 * Retorna: { connected: boolean, state: 'open' | 'connecting' | 'close' | 'offline', details: any }
 */
export async function checkInstanceStatus(overrideConfig = null) {
  const config = overrideConfig || getEvolutionConfig();
  const url = config.serverUrl.replace(/\/+$/, '');
  const instance = config.instanceName;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${url}/instance/connectionState/${instance}`, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const state = data?.instance?.state || data?.state || 'close';
      return {
        connected: state === 'open',
        state,
        details: data
      };
    } else {
      // Se não encontrou a instância (404), precisa criar
      if (res.status === 404) {
        return { connected: false, state: 'not_created', details: 'Instância não criada na Evolution API' };
      }
      return { connected: false, state: 'error', status: res.status, details: await res.text() };
    }
  } catch (err) {
    // Se o servidor for mock ou local não acessível diretamente, retorna status seguro
    return {
      connected: false,
      state: 'offline',
      details: err.message || 'Servidor Evolution API inacessível'
    };
  }
}

/**
 * Cria a instância na Evolution API caso não exista
 */
export async function createEvolutionInstance(overrideConfig = null) {
  const config = overrideConfig || getEvolutionConfig();
  const url = config.serverUrl.replace(/\/+$/, '');

  try {
    const res = await fetch(`${url}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: config.instanceName,
        token: config.apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        rejectCall: true,
        msgCall: 'Este canal é exclusivo para despachos operacionais CCO Ambipar.',
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true
      })
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Solicita a conexão e busca o QR Code na Evolution API
 * Retorna: { success: boolean, qrcode: string (base64 ou pairingCode), state: string }
 */
export async function getEvolutionQrCode(overrideConfig = null) {
  const config = overrideConfig || getEvolutionConfig();
  const url = config.serverUrl.replace(/\/+$/, '');
  const instance = config.instanceName;

  try {
    const res = await fetch(`${url}/instance/connect/${instance}`, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      // Evolution v2 pode retornar data.base64, data.code ou data.pairingCode
      const qrcode = data?.base64 || data?.qrcode?.base64 || data?.code || null;
      const pairingCode = data?.pairingCode || null;

      return {
        success: true,
        qrcode,
        pairingCode,
        state: data?.state || 'connecting',
        raw: data
      };
    } else {
      return { success: false, error: `Erro ${res.status}: ${await res.text()}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Desconecta a instância na Evolution API (Logout)
 */
export async function logoutEvolutionInstance(overrideConfig = null) {
  const config = overrideConfig || getEvolutionConfig();
  const url = config.serverUrl.replace(/\/+$/, '');
  const instance = config.instanceName;

  try {
    const res = await fetch(`${url}/instance/logout/${instance}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.apiKey
      }
    });
    return { success: res.ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Dispara uma mensagem de texto diretamente via Evolution API
 * Endpoint: POST /message/sendText/{instance}
 */
export async function sendEvolutionTextMessage({ phone, messageText, overrideConfig = null }) {
  const config = overrideConfig || getEvolutionConfig();
  const url = config.serverUrl.replace(/\/+$/, '');
  const instance = config.instanceName;
  const formattedNumber = formatPhoneNumberForEvolution(phone);

  if (!formattedNumber) {
    throw new Error('Número de telefone do destinatário inválido ou incompleto.');
  }

  if (!messageText || !messageText.trim()) {
    throw new Error('Conteúdo da mensagem não pode ser vazio.');
  }

  const payload = {
    number: formattedNumber,
    text: messageText,
    linkPreview: false,
    delay: 1200 // Pequeno delay humanizado de digitação
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        messageId: data?.key?.id || data?.id || `AMB-${Date.now()}`,
        status: data?.status || 'PENDING',
        data,
        timestamp: new Date().toISOString()
      };
    } else {
      const errText = await res.text();
      let parsedErr = errText;
      try { parsedErr = JSON.parse(errText)?.response?.message || errText; } catch {}
      throw new Error(`Falha no envio Evolution API (${res.status}): ${parsedErr}`);
    }
  } catch (err) {
    // Se a conexão física falhar (servidor em rede privada ou offline), retornamos detalhes claros
    throw new Error(`Erro na comunicação com a Evolution API: ${err.message}`);
  }
}
