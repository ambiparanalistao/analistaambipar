import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, normalizeQr, readConfig } from '../api/evolution.js';
const env = {
  EVOLUTION_API_URL: 'https://evolution.example/manager/',
  EVOLUTION_INSTANCE_NAME: 'analistalogistica',
  EVOLUTION_API_KEY: 'private-key',
  VITE_SUPABASE_URL: 'https://project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'public-key',
  EVOLUTION_ADMIN_USER_IDS: 'allowed-id',
};
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
async function run({ method = 'GET', body, authorization = 'Bearer user-token', user = { id: 'allowed-id' }, upstream, environment = env, origin } = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), ...options });
    if (String(url).includes('/auth/v1/user')) return response(user);
    return upstream ? upstream(String(url), options) : response({ instance: { state: 'open' } });
  };
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
  await createHandler({ env: environment, fetcher })({ method, body, headers: { authorization, host: 'app.example', ...(origin ? { origin } : {}) } }, res);
  return { ...res, calls };
}
test('requires a real bearer token; no upstream request without authentication', async () => {
  const r = await run({ authorization: null });
  assert.equal(r.code, 401); assert.equal(r.calls.length, 0);
});
test('does not trust user_metadata for authorization', async () => {
  const r = await run({ user: { id: 'other', user_metadata: { automation_admin: true } } });
  assert.equal(r.code,403);assert.equal(r.calls.length,2);assert.ok(!r.calls.some(c=>c.url.includes('evolution.example')));
});
test('rejects anonymous Supabase users even if ID is allowlisted', async () => {
  assert.equal((await run({ user: { id: 'allowed-id', is_anonymous: true } })).code, 403);
});
test('permits server-managed app_metadata admin', async () => {
  assert.equal((await run({ user: { id: 'other', app_metadata: { automation_admin: true } } })).code, 200);
});
test('status only reads upstream and never returns credentials', async () => {
  const r = await run();
  assert.equal(r.code, 200); assert.equal(r.body.state, 'open');
  assert.equal(r.calls[1].url, 'https://evolution.example/instance/connectionState/analistalogistica');
  assert.equal(r.calls[1].method, 'GET');
  assert.equal(r.calls[1].headers.apikey, 'private-key');
  assert.equal(r.headers['Cache-Control'], 'no-store');
  assert.ok(!JSON.stringify(r.body).includes('private-key'));
});
test('connect returns only a safe QR code and verified state', async () => {
  const r = await run({ method: 'POST', body: { action: 'connect', url: 'https://attacker.example' }, upstream: url => url.includes('/connect/') ? response({ base64: 'data:image/png;base64,YWJj', apikey: 'private-key' }) : response({ instance: { state: 'connecting' } }) });
  assert.equal(r.code, 200); assert.equal(r.body.qrCode, 'data:image/png;base64,YWJj');
  assert.ok(r.calls.every(c => !c.url.includes('attacker')));
});
test('QR normalization rejects SVG and remote URLs', () => {
  assert.equal(normalizeQr({ base64: 'data:image/svg+xml;base64,YWJj' }).qrCode, null);
  assert.equal(normalizeQr({ base64: 'https://attacker.example/qr.png' }).qrCode, null);
});
test('restart uses POST in Evolution 2.3.7', async () => {
  const r = await run({ method: 'POST', body: { action: 'restart' } });
  assert.equal(r.code, 200); assert.equal(r.calls[1].method, 'POST');
  assert.ok(r.calls[1].url.includes('/restart/'));
});
test('reconnect when disconnected calls connect without logout or restart', async () => {
  const r = await run({ method: 'POST', body: { action: 'reconnect' }, upstream: () => response({ instance: { state: 'close' } }) });
  assert.equal(r.code, 200);
  assert.ok(!r.calls.some(c => /restart|logout/.test(c.url)));
  assert.ok(r.calls.some(c => c.url.includes('/connect/')));
});
test('create uses fixed instance and WHATSAPP-BAILEYS, discarding upstream secrets', async () => {
  const r = await run({ method: 'POST', body: { action: 'create', instanceName: 'other' }, upstream: () => response({ hash: 'secret' }) });
  assert.equal(r.code, 200);
  assert.equal(JSON.parse(r.calls[1].body).instanceName, 'analistalogistica');
  assert.equal(JSON.parse(r.calls[1].body).integration, 'WHATSAPP-BAILEYS');
  assert.ok(!JSON.stringify(r.body).includes('secret'));
});
test('logout uses DELETE without deleting instance', async () => {
  const r = await run({ method: 'POST', body: { action: 'logout' } });
  assert.equal(r.calls[1].method, 'DELETE'); assert.ok(r.calls[1].url.includes('/logout/'));
  assert.equal(r.body.state, 'close');
});
test('missing key is reported without contacting Evolution', async () => {
  const r = await run({ environment: { ...env, EVOLUTION_API_KEY: '' } });
  assert.equal(r.code, 503); assert.equal(r.calls.length, 1);
});
test('rejects cross-origin mutation and invalid actions', async () => {
  assert.equal((await run({ method: 'POST', origin: 'https://evil.example', body: { action: 'logout' } })).code, 403);
  assert.equal((await run({ method: 'POST', body: { action: 'sendText' } })).code, 400);
  assert.equal((await run({ method: 'POST', body: '{invalid' })).code, 400);
});
test('sanitizes upstream errors, handles malformed JSON, timeout and unknown state', async () => {
  const denied = await run({ upstream: () => response({ key: 'private-key' }, 401) });
  assert.equal(denied.code, 502); assert.ok(!JSON.stringify(denied.body).includes('private-key'));
  assert.equal((await run({ upstream: () => ({ ok: true, json: async () => { throw Error('bad'); } }) })).code, 502);
  assert.equal((await run({ upstream: () => { throw Error('network'); } })).code, 502);
  assert.equal((await run({ upstream: () => response({ instance: {} }) })).body.state, 'unknown');
});
test('GET cannot mutate; unsupported methods rejected', async () => {
  const r = await run({ body: { action: 'logout' } });
  assert.ok(!r.calls.some(c => c.url.includes('/logout/')));
  assert.equal((await run({ method: 'DELETE' })).code, 405);
});
test('rejects unsafe URL and invalid instance configuration', () => {
  assert.throws(() => readConfig({ ...env, EVOLUTION_API_URL: 'http://unsafe.example' }));
  assert.throws(() => readConfig({ ...env, EVOLUTION_INSTANCE_NAME: '../other' }));
});

test('released company member can manage automation without an individual allowlist',async()=>{const r=await run({user:{id:'released-user'},upstream:url=>url.includes('/rest/v1/company_members')?response([{company_id:'company'}]):response({instance:{state:'open'}})});assert.equal(r.code,200);assert.ok(r.calls.some(c=>c.url.includes('full_module_access=eq.true')));});

test('sendText requires a real authenticated user before contacting Evolution', async () => {
  const r = await run({ method: 'POST', authorization: null, body: { action: 'sendText', number: '5511999999999', text: 'Teste' } });
  assert.equal(r.code, 401);
  assert.equal(r.calls.length, 0);
});

test('sendText requires released company access and rejects invalid payloads', async () => {
  const rejected = await run({ method: 'POST', user: { id: 'unreleased-user' }, body: { action: 'sendText', number: '5511999999999', text: 'Teste' }, upstream: url => url.includes('/rest/v1/company_members') ? response([]) : response({}) });
  assert.equal(rejected.code, 403);
  assert.ok(!rejected.calls.some(call => call.url.includes('evolution.example')));
  const invalid = await run({ method: 'POST', body: { action: 'sendText', number: '12', text: 'Teste' } });
  assert.equal(invalid.code, 400);
});

test('sendText sends only through the authenticated server endpoint', async () => {
  const r = await run({ method: 'POST', body: { action: 'sendText', number: '5511999999999', text: 'Teste' }, upstream: () => response({ key: { id: 'msg-1' } }) });
  assert.equal(r.code, 200);
  const request = r.calls.find(call => call.url.includes('/message/sendText/'));
  assert.ok(request);
  assert.equal(request.headers.apikey, 'private-key');
  assert.deepEqual(JSON.parse(request.body), { number: '5511999999999', text: 'Teste', linkPreview: false, delay: 1000 });
});