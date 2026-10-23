// Evolution API 2.3.7 — credentials and upstream requests stay on the server.
const json = (res, status, body) => res.status(status).json(body);
const failure = (status, message) => Object.assign(new Error(message), { status });
const timeout = () => AbortSignal.timeout(15000);

export function readConfig(env) {
  const raw = env.EVOLUTION_API_URL || '';
  let url;
  try { url = new URL(raw); } catch { throw failure(503, 'Configure EVOLUTION_API_URL na Vercel.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw failure(503, 'EVOLUTION_API_URL deve ser uma URL HTTPS válida.');
  }
  const instance = env.EVOLUTION_INSTANCE_NAME || '';
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(instance)) throw failure(503, 'Configure EVOLUTION_INSTANCE_NAME na Vercel.');
  return {
    base: url.href.replace(/\/manager\/?$/, '').replace(/\/$/, ''),
    instance,
    key: env.EVOLUTION_API_KEY,
    authUrl: env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    authKey: env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    allowed: (env.EVOLUTION_ADMIN_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean),
  };
}

export async function authenticate(req, config, fetcher) {
  const token = req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token) throw failure(401, 'Entre com seu usuário e senha para acessar a automação.');
  if (!config.authUrl || !config.authKey) throw failure(503, 'Configure a autenticação Supabase no servidor.');
  let response;
  try {
    response = await fetcher(new URL('/auth/v1/user', config.authUrl), {
      headers: { apikey: config.authKey, Authorization: 'Bearer ' + token },
      signal: timeout(), redirect: 'error',
    });
  } catch { throw failure(503, 'Não foi possível validar sua sessão. Tente novamente.'); }
  if (!response.ok) {
    if (response.status >= 500 || response.status === 429) throw failure(503, 'Autenticação temporariamente indisponível.');
    throw failure(401, 'Sua sessão expirou. Entre novamente.');
  }
  const user = await response.json();
  if (!user.id || user.is_anonymous) throw failure(403, 'É necessário um usuário autenticado.');
  if (!config.allowed.includes(user.id) && user.app_metadata?.automation_admin !== true) {
    throw failure(403, 'Seu usuário não tem permissão para gerenciar a conexão.');
  }
  return user;
}

export function normalizeState(data) {
  const state = data?.instance?.state ?? data?.instance?.status ?? data?.state;
  return ['open', 'close', 'connecting'].includes(state) ? state : 'unknown';
}

export function normalizeQr(data) {
  const qr = data?.base64 || data?.qrcode?.base64;
  // Only raster image data can be returned to the browser, never SVG/HTML or remote URLs.
  const valid = typeof qr === 'string' && qr.length < 1500000 &&
    /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=\r\n]+$/.test(qr);
  return { qrCode: valid ? qr : null };
}

export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return json(res, 405, { error: 'Método não permitido.' });
    }
    try {
      const config = readConfig(env);
      await authenticate(req, config, fetcher);
      if (req.method === 'POST' && req.headers.origin) {
        const origin = new URL(req.headers.origin);
        if (origin.host !== req.headers.host || !['http:', 'https:'].includes(origin.protocol)) {
          throw failure(403, 'Origem da solicitação não permitida.');
        }
      }
      const api = async (path, method = 'GET', body) => {
        if (!config.key) throw failure(503, 'Configure EVOLUTION_API_KEY como segredo na Vercel.');
        let response;
        try {
          response = await fetcher(config.base + path, {
            method, headers: { apikey: config.key, 'Content-Type': 'application/json' },
            ...(body ? { body: JSON.stringify(body) } : {}),
            redirect: 'error', signal: timeout(),
          });
        } catch { throw failure(502, 'Servidor Evolution indisponível ou tempo de resposta excedido.'); }
        if (!response.ok) {
          if (response.status === 404) throw failure(404, 'Instância não encontrada. Confira o nome ou use Criar instância.');
          if ([401, 403].includes(response.status)) throw failure(502, 'A Evolution recusou a chave configurada. Verifique EVOLUTION_API_KEY.');
          if (response.status === 429) throw failure(429, 'Muitas solicitações. Aguarde antes de tentar novamente.');
          throw failure(502, 'A Evolution não concluiu a operação. Verifique o servidor e tente novamente.');
        }
        let data;
        try { data = await response.json(); } catch { throw failure(502, 'Resposta inválida da Evolution API.'); }
        if (data?.error) throw failure(502, 'A Evolution retornou um erro. Atualize o status antes de tentar novamente.');
        return data;
      };
      const name = encodeURIComponent(config.instance);
      const status = async () => ({
        instanceName: config.instance,
        state: normalizeState(await api('/instance/connectionState/' + name)),
        checkedAt: new Date().toISOString(),
      });
      if (req.method === 'GET') return json(res, 200, await status());
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { throw failure(400, 'Solicitação inválida.'); } }
      const action = body?.action;
      if (!['connect', 'reconnect', 'restart', 'logout', 'create'].includes(action)) throw failure(400, 'Ação inválida.');
      // Each state-changing request is explicit; polling only reads status.
      if (action === 'create') {
        await api('/instance/create', 'POST', { instanceName: config.instance, integration: 'WHATSAPP-BAILEYS', qrcode: true });
        return json(res, 200, { instanceName: config.instance, state: 'unknown', checkedAt: new Date().toISOString(), message: 'Instância criada. Clique em Conectar para obter o QR Code.' });
      }
      if (action === 'logout') {
        await api('/instance/logout/' + name, 'DELETE');
        return json(res, 200, { instanceName: config.instance, state: 'close', checkedAt: new Date().toISOString() });
      }
      if (action === 'restart') {
        await api('/instance/restart/' + name, 'POST');
        return json(res, 200, await status());
      }
      if (action === 'reconnect') {
        const current = await status();
        if (current.state === 'open') {
          await api('/instance/restart/' + name, 'POST');
        }
      }
      const result = await api('/instance/connect/' + name);
      const current = await status();
      return json(res, 200, { ...current, ...(current.state === 'open' ? { qrCode: null } : normalizeQr(result)) });
    } catch (error) {
      return json(res, error.status || 500, { error: error.status ? error.message : 'Erro interno ao processar a conexão.' });
    }
  };
}
export default createHandler();
