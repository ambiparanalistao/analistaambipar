import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Wifi, RefreshCw, QrCode, Power, RotateCw, Plus, ShieldCheck } from 'lucide-react';
import { evolutionRequest } from '../lib/evolutionClient';
import './AutomationModule.css';

const labels = { open: 'Conectada', connecting: 'Aguardando conexão', close: 'Desconectada', unknown: 'Não verificada' };
export default function AutomationModule({ user }) {
  const [connection, setConnection] = useState({ state: 'unknown' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [automatic, setAutomatic] = useState(true);
  const [qr, setQr] = useState(null);
  const [qrExpires, setQrExpires] = useState(0);
  const [now, setNow] = useState(Date.now());
  const running = useRef(false);
  const controller = useRef(null);
  const alive = useRef(true);
  const demo = !user?.id || user.id === 'demo-analista-ambipar';

  const perform = useCallback(async (action = '') => {
    if (running.current || demo) return;
    running.current = true;
    controller.current = new AbortController();
    setBusy(action || 'status');
    setError('');
    setNotice('');
    if (action) { setQr(null); setQrExpires(0); }
    try {
      const result = await evolutionRequest(action, controller.current.signal);
      if (!alive.current) return;
      setConnection(result);
      if (result.state === 'open' || result.state === 'close') {
        setQr(null);
        setQrExpires(0);
      }
      if (result.qrCode && result.state !== 'open') {
        setQr(result.qrCode);
        setQrExpires(Date.now() + 40000);
      }
      if (result.message) setNotice(result.message);
      else if (action && result.state !== 'open') setNotice('Operação concluída. Atualize o status ou gere um novo QR Code se necessário.');
    } catch (err) {
      if (alive.current && err.name !== 'AbortError') {
        setError(err.message);
        setQr(null);
        setQrExpires(0);
        setConnection(previous => ({ ...previous, state: 'unknown' }));
      }
    } finally {
      running.current = false;
      if (alive.current) setBusy('');
    }
  }, [demo]);

  useEffect(() => {
    alive.current = true;
    perform();
    return () => { alive.current = false; controller.current?.abort(); };
  }, [perform]);
  useEffect(() => {
    if (!automatic || demo) return;
    const timer = setInterval(() => { if (document.visibilityState === 'visible') perform(); }, 15000);
    return () => clearInterval(timer);
  }, [automatic, demo, perform]);
  useEffect(() => {
    if (!qr) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [qr]);
  const qrValid = qr && qrExpires > now;
  const unavailable = Boolean(busy) || demo;
  const buttons = [
    ['connect', 'Conectar / gerar QR Code', QrCode],
    ['reconnect', 'Reconectar', RefreshCw],
    ['restart', 'Reiniciar conexão', RotateCw],
  ];
  return (
    <section className="automation-module" aria-labelledby="automation-title">
      <div className="automation-heading">
        <div><span className="automation-eyebrow">EVOLUTION API · WHATSAPP</span><h2 id="automation-title">Automação · Conexão</h2>
          <p>Conecte o WhatsApp e acompanhe a disponibilidade da instância.</p></div>
        <span className="automation-security"><ShieldCheck size={16} /> Acesso protegido</span>
      </div>
      {demo && <div className="automation-alert" role="alert">Entre com seu e-mail e senha para gerenciar a conexão. O modo demonstrativo não tem acesso à Evolution.</div>}
      {error && <div className="automation-alert" role="alert">{error}</div>}
      {notice && <div className="automation-notice" role="status">{notice}</div>}
      <div className="automation-grid">
        <article className="automation-card">
          <div className="automation-card-title"><Wifi size={22} /><h3>Instância WhatsApp</h3></div>
          <dl>
            <div><dt>Nome da instância</dt><dd>{connection.instanceName || 'analistalogistica'}</dd></div>
            <div><dt>Status</dt><dd><span className={'automation-state state-' + connection.state}>{labels[connection.state] || labels.unknown}</span></dd></div>
            <div><dt>Última verificação</dt><dd>{connection.checkedAt ? new Date(connection.checkedAt).toLocaleString('pt-BR') : 'Aguardando consulta'}</dd></div>
          </dl>
          <div className="automation-actions">
            <button type="button" className="btn-primary" disabled={unavailable} onClick={() => perform()}><RefreshCw size={16} />{busy === 'status' ? 'Verificando…' : 'Verificar status'}</button>
            {buttons.map(([action, label, Icon]) => <button type="button" className="btn-secondary" key={action} disabled={unavailable} onClick={() => perform(action)}><Icon size={16} />{busy === action ? 'Processando…' : label}</button>)}
          </div>
          <label className="automation-checkbox"><input type="checkbox" checked={automatic} disabled={demo} onChange={event => setAutomatic(event.target.checked)} /> Atualizar status a cada 15 segundos nesta tela</label>
          <p className="automation-muted">Se a sessão cair, use Reconectar. Se o WhatsApp solicitar pareamento, leia um novo QR Code.</p>
        </article>
        <article className="automation-card automation-pairing">
          <div className="automation-card-title"><QrCode size={22} /><h3>Pareamento do WhatsApp</h3></div>
          {connection.state === 'open' ? <div className="automation-pairing-placeholder"><Wifi size={48} /><strong>WhatsApp conectado</strong><p>A instância está disponível.</p></div> :
            qrValid ? <><img className="automation-qr" src={qr} alt="QR Code para conectar a instância WhatsApp" /><p>Leia em até {Math.max(0, Math.ceil((qrExpires - now) / 1000))} segundos. Se expirar, gere outro.</p></> :
              <div className="automation-pairing-placeholder"><QrCode size={64} /><strong>{qr ? 'QR Code expirado' : 'Conecte seu aparelho'}</strong><p>Clique em Conectar / gerar QR Code. No WhatsApp, abra Aparelhos conectados → Conectar um aparelho.</p></div>}
          <p className="automation-muted">Mantenha esta tela aberta durante o pareamento. O status será confirmado pela Evolution.</p>
        </article>
      </div>
      <article className="automation-card automation-maintenance">
        <h3>Gerenciamento da instância</h3><p>Se ela ainda não existe na Evolution, crie-a uma única vez. Desconectar encerra a sessão do WhatsApp e exige novo pareamento.</p>
        <div className="automation-actions">
          <button type="button" className="btn-secondary" disabled={unavailable || connection.state === 'open' || connection.state === 'connecting'} onClick={() => perform('create')}><Plus size={16} />{busy === 'create' ? 'Criando…' : 'Criar instância'}</button>
          <button type="button" className="btn-secondary automation-danger" disabled={unavailable || connection.state !== 'open'} onClick={() => { if (window.confirm('Desconectar o WhatsApp? Será necessário ler um novo QR Code.')) perform('logout'); }}><Power size={16} />Desconectar WhatsApp</button>
        </div>
      </article>
    </section>
  );
}
