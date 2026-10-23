import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Zap, 
  Settings, 
  X, 
  ExternalLink, 
  Truck, 
  Layers, 
  UserCheck, 
  Gauge, 
  Fuel, 
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { 
  getEvolutionConfig, 
  saveEvolutionConfig, 
  checkInstanceStatus, 
  getEvolutionQrCode, 
  sendEvolutionTextMessage, 
  logoutEvolutionInstance, 
  createEvolutionInstance,
  formatPhoneNumberForEvolution 
} from '../services/evolutionApi';
import { formatPlateMercosul, getCountdown } from './VehiclesModule';

export const WHATSAPP_TEMPLATES = [
  {
    id: 'escala',
    category: 'Escala & Carregamento',
    badge: 'Prioritário',
    title: 'Ordem de Carregamento & Escala Imediata',
    description: 'Convocação para apresentação na base operacional e início de rota',
    template: 'Olá, {MOTORISTA}! Aqui é a Torre de Operações CCO Ambipar.\n\nO conjunto {MARCA_MODELO} (Placa *{PLACA}*, Prefixo *{PREFIXO}*) foi escalado para operação imediata de {TIPO_CARGA}.\n\nFavor se apresentar na base operacional para o checklist de saída e liberação da documentação de viagem (DACTE / MDF-e).\n\nTorre de Controle Ambipar CCO • {HORA_ATUAL}'
  },
  {
    id: 'revisao',
    category: 'Manutenção Preventiva',
    badge: 'Oficina',
    title: 'Alerta de Revisão Preventiva por Odômetro',
    description: 'Notificação de proximidade do limite de quilometragem de revisão',
    template: 'Olá, {MOTORISTA}! Gestão de Manutenção de Frotas Ambipar informando:\n\nIdentificamos via telemetria que o veículo *{PLACA}* atingiu *{KM_ATUAL} km*. A próxima revisão preventiva está programada para *{PROXIMA_REVISAO} km*.\n\nSolicitamos programar parada na oficina central da base para alinhamento e inspeção preventiva.\n\nGestão de Frotas & Manutenção CCO'
  },
  {
    id: 'vistorias',
    category: 'Compliance & Regulatório',
    badge: 'ANTT / INMETRO',
    title: 'Aviso de Vencimento de Vistorias & Laudos',
    description: 'Aviso de renovação para CIPP, CIV, CRLV ou Cronotacógrafo',
    template: 'Prezado(a) {MOTORISTA},\n\nAvisamos que o veículo *{PLACA}* ({MARCA_MODELO}) possui laudos regulatórios obrigatórios próximos da data de vencimento ({VISTORIAS_STATUS}).\n\nFavor apresentar o conjunto para inspeção e renovação antes do prazo limite para evitar bloqueios operacionais na ANTT/INMETRO.\n\nCompliance & Segurança Veicular Ambipar'
  },
  {
    id: 'checklist',
    category: 'Segurança & PAE',
    badge: 'Emergência',
    title: 'Checklist 360º & Prontidão Ambiental PAE',
    description: 'Inspeção preventiva de itens Hazmat e segurança antes de rodar',
    template: 'Olá, {MOTORISTA}! Lembrete de Segurança Operacional Ambipar:\n\nAntes de liberar a partida do veículo *{PLACA}*, realize o checklist 360º obrigatório:\n• Calibração e estado dos pneus\n• Extintores e lacres de segurança\n• Kit PAE de Atendimento a Emergências Químicas\n• Cones, lanternas e calços de roda\n\nSua segurança e a preservação ambiental são prioridade máxima!'
  },
  {
    id: 'posicao',
    category: 'Torre de Controle CCO',
    badge: 'Monitoramento',
    title: 'Solicitação de Posição & Status de Viagem',
    description: 'Confirmação de rota, trânsito e cumprimento de descanso da Lei 13.103',
    template: 'Olá, {MOTORISTA}! Torre de Controle Ambipar CCO em contato.\n\nSolicitamos confirmação do seu posicionamento atual e status de viagem do veículo *{PLACA}*.\n\nFavor confirmar se a viagem segue conforme planejado e se as paradas de descanso da Lei 13.103 estão sendo cumpridas.\n\nTorre de Controle 24h Ambipar'
  },
  {
    id: 'combustivel',
    category: 'Eficiência Energética',
    badge: 'Combustível',
    title: 'Comprovante de Abastecimento & Odômetro',
    description: 'Solicitação de foto da nota de combustível e km da bomba',
    template: 'Olá, {MOTORISTA}! Lembrete de controle de combustível CCO:\n\nFavor enviar a foto da nota fiscal do último abastecimento de {COMBUSTIVEL} do veículo *{PLACA}*, informando o odômetro da bomba para atualização dos indicadores de consumo e eficiência energética.\n\nObrigado pela colaboração!'
  }
];

export const SMART_TRIGGERS = [
  { id: 'motorista', label: 'Motorista', tag: '{MOTORISTA}', getValue: (v) => v.motorista_vinculado || 'Condutor Titular' },
  { id: 'placa', label: 'Placa', tag: '{PLACA}', getValue: (v) => v.placa || 'Sem Placa' },
  { id: 'prefixo', label: 'Prefixo', tag: '{PREFIXO}', getValue: (v) => v.prefixo || 'Frota' },
  { id: 'modelo', label: 'Modelo', tag: '{MARCA_MODELO}', getValue: (v) => v.marca_modelo || v.tipo || 'Caminhão' },
  { id: 'km', label: 'KM Atual', tag: '{KM_ATUAL}', getValue: (v) => v.km_atual ? `${Number(v.km_atual).toLocaleString('pt-BR')} km` : '—' },
  { id: 'revisao', label: 'Próxima Revisão', tag: '{PROXIMA_REVISAO}', getValue: (v) => v.proxima_revisao_km ? `${Number(v.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—' },
  { id: 'carga', label: 'Carga', tag: '{TIPO_CARGA}', getValue: (v) => v.tipo_carga || 'Produtos Químicos' },
  { id: 'combustivel', label: 'Combustível', tag: '{COMBUSTIVEL}', getValue: (v) => v.combustivel || 'Diesel S10' },
  { id: 'status', label: 'Status CCO', tag: '{STATUS_CCO}', getValue: (v) => v.status || 'Disponível' },
  { id: 'hora', label: 'Hora CCO', tag: '{HORA_ATUAL}', getValue: () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
];

export function resolveTemplateText(templateText, vehicle) {
  if (!templateText) return '';
  const now = new Date();
  const horaStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const vistorias = [];
  if (vehicle?.validade_crlv) vistorias.push(`CRLV: ${vehicle.validade_crlv}`);
  if (vehicle?.validade_cipp) vistorias.push(`CIPP: ${vehicle.validade_cipp}`);
  if (vehicle?.validade_civ) vistorias.push(`CIV: ${vehicle.validade_civ}`);
  if (vehicle?.validade_cronotacografo) vistorias.push(`Tacógrafo: ${vehicle.validade_cronotacografo}`);
  const vistoriasStr = vistorias.length > 0 ? vistorias.slice(0, 2).join(', ') : 'CRLV e CIPP em dia';

  return templateText
    .replace(/{MOTORISTA}/g, vehicle?.motorista_vinculado || 'Condutor Titular')
    .replace(/{PLACA}/g, vehicle?.placa || 'Sem placa')
    .replace(/{PREFIXO}/g, vehicle?.prefixo || 'Frota')
    .replace(/{MARCA_MODELO}/g, vehicle?.marca_modelo || vehicle?.tipo || 'Caminhão')
    .replace(/{TIPO_CARGA}/g, vehicle?.tipo_carga || 'Produtos Químicos Perigosos')
    .replace(/{COMBUSTIVEL}/g, vehicle?.combustivel || 'Diesel S10')
    .replace(/{KM_ATUAL}/g, vehicle?.km_atual ? Number(vehicle.km_atual).toLocaleString('pt-BR') : '—')
    .replace(/{PROXIMA_REVISAO}/g, vehicle?.proxima_revisao_km ? Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR') : '—')
    .replace(/{STATUS_CCO}/g, vehicle?.status || 'Disponível')
    .replace(/{VISTORIAS_STATUS}/g, vistoriasStr)
    .replace(/{HORA_ATUAL}/g, horaStr);
}

export default function WhatsAppDispatchWorkspace({ vehicle, onBack, onUpdateVehiclePhone }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('escala');
  const [phone, setPhone] = useState(vehicle.motorista_telefone || '');
  const [messageText, setMessageText] = useState(() => {
    const tpl = WHATSAPP_TEMPLATES[0];
    return resolveTemplateText(tpl.template, vehicle);
  });

  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [dispatchingApi, setDispatchingApi] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState(null);

  // Estados da Evolution API
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [evolutionConfig, setEvolutionConfig] = useState(getEvolutionConfig);
  const [apiStatus, setApiStatus] = useState({ connected: false, state: 'checking', details: null });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Histórico de disparos na sessão
  const [dispatchHistory, setDispatchHistory] = useState([]);

  // Verifica status da Evolution API ao montar
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const res = await checkInstanceStatus(evolutionConfig);
    setApiStatus(res);
  };

  const handleFetchQrCode = async () => {
    setLoadingQr(true);
    try {
      // Tenta criar se ainda não existir
      await createEvolutionInstance(evolutionConfig);
      const res = await getEvolutionQrCode(evolutionConfig);
      if (res.success && res.qrcode) {
        setQrCodeData(res.qrcode);
        setApiStatus(prev => ({ ...prev, state: 'connecting' }));
      } else {
        alert(res.error || 'Não foi possível gerar o QR Code no servidor Evolution API.');
      }
    } catch (err) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleSaveConfig = () => {
    saveEvolutionConfig(evolutionConfig);
    checkConnection();
    setShowConfigModal(false);
    setDispatchFeedback({ type: 'success', text: 'Configurações da Evolution API salvas com sucesso!' });
    setTimeout(() => setDispatchFeedback(null), 4000);
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    const resolved = resolveTemplateText(tpl.template, vehicle);
    setMessageText(resolved);
  };

  const handleResetToTemplate = () => {
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    setMessageText(resolveTemplateText(tpl.template, vehicle));
  };

  /**
   * Proteção anti-duplicação:
   * Verifica se o valor resolvido do gatilho já consta no texto
   */
  const isTriggerAlreadyInText = (trigger) => {
    const val = trigger.getValue(vehicle);
    if (!val || val === '—') return false;
    return messageText.includes(val);
  };

  const handleInsertTrigger = (trigger) => {
    const val = trigger.getValue(vehicle);
    if (!val || val === '—') return;

    if (isTriggerAlreadyInText(trigger)) {
      setDispatchFeedback({
        type: 'info',
        text: `O dado "${trigger.label}" (${val}) já está presente no texto da mensagem.`
      });
      setTimeout(() => setDispatchFeedback(null), 3000);
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? messageText.length;
      const end = textarea.selectionEnd ?? messageText.length;
      const before = messageText.substring(0, start);
      const after = messageText.substring(end);
      const spacerBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
      const spacerAfter = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : '';
      const newText = before + spacerBefore + val + spacerAfter + after;
      setMessageText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + spacerBefore.length + val.length, start + spacerBefore.length + val.length);
      }, 50);
    } else {
      setMessageText(prev => `${prev} ${val}`);
    }
  };

  /**
   * Adiciona ou remove blocos modulares estruturados
   */
  const toggleModularBlock = (type) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let blockText = '';
    if (type === 'odometro') {
      blockText = `\n\n📊 *Telemetria CCO:* Odômetro registrado: *${vehicle.km_atual ? Number(vehicle.km_atual).toLocaleString('pt-BR') : '—'} km* | Próxima revisão: *${vehicle.proxima_revisao_km ? Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR') : '—'} km*.`;
    } else if (type === 'vistorias') {
      const crlv = getCountdown(vehicle.validade_crlv);
      const cipp = getCountdown(vehicle.validade_cipp);
      blockText = `\n\n🛡️ *Vistorias Regulamentares:* CRLV ${crlv.text} | CIPP ${cipp.text}.`;
    } else if (type === 'assinatura') {
      blockText = `\n\nTorre de Operações & CCO Ambipar • ${now}`;
    }

    if (messageText.includes(blockText.trim())) {
      setMessageText(messageText.replace(blockText, '').replace(blockText.trim(), ''));
    } else {
      setMessageText(prev => prev.trim() + blockText);
    }
  };

  // Disparo Direto via Evolution API
  const handleDispatchEvolution = async () => {
    const clean = formatPhoneNumberForEvolution(phone);
    if (!clean || clean.length < 10) {
      alert('Informe um número de telefone com DDD válido para o condutor.');
      return;
    }

    setDispatchingApi(true);
    setDispatchFeedback(null);

    try {
      const res = await sendEvolutionTextMessage({
        phone: clean,
        messageText,
        overrideConfig: evolutionConfig
      });

      const newLog = {
        id: res.messageId,
        time: new Date().toLocaleTimeString('pt-BR'),
        phone: clean,
        preview: messageText.slice(0, 60) + '...',
        status: 'Enviado via Evolution API'
      };
      setDispatchHistory([newLog, ...dispatchHistory]);

      setDispatchFeedback({
        type: 'success',
        text: `Mensagem disparada com sucesso via Evolution API! (ID: ${res.messageId})`
      });

      if (phone !== vehicle.motorista_telefone) {
        onUpdateVehiclePhone(vehicle.id, phone);
      }
    } catch (err) {
      console.warn('Falha Evolution API:', err);
      // Se a Evolution API remota estiver offline ou não configurada ainda, simula o despacho com transparência
      const mockId = `MOCK-${Date.now().toString().slice(-6)}`;
      const newLog = {
        id: mockId,
        time: new Date().toLocaleTimeString('pt-BR'),
        phone: clean,
        preview: messageText.slice(0, 60) + '...',
        status: 'Simulação CCO Registrada'
      };
      setDispatchHistory([newLog, ...dispatchHistory]);

      setDispatchFeedback({
        type: 'warning',
        text: `Evolution API offline no momento (${err.message}). O disparo foi simulado e salvo no histórico CCO. Utilize o envio direto via WhatsApp Web abaixo para enviar imediatamente ao condutor.`
      });
    } finally {
      setDispatchingApi(false);
      setTimeout(() => setDispatchFeedback(null), 6000);
    }
  };

  // Disparo Fallback via WhatsApp Web / App
  const handleSendWhatsAppWeb = () => {
    const clean = formatPhoneNumberForEvolution(phone);
    if (!clean || clean.length < 10) {
      alert('Informe o telefone com DDD do condutor.');
      return;
    }
    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${clean}?text=${encoded}`;
    window.open(url, '_blank');

    if (phone !== vehicle.motorista_telefone) {
      onUpdateVehiclePhone(vehicle.id, phone);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const crlvCountdown = getCountdown(vehicle.validade_crlv);
  const cippCountdown = getCountdown(vehicle.validade_cipp);

  return (
    <div className="dispatch-full-workspace animate-fade-in" id="whatsapp-dispatch-workspace">
      {/* ============================================================== */}
      {/* CABEÇALHO DA CENTRAL DE DESPACHO & BREADCRUMB                   */}
      {/* ============================================================== */}
      <div className="dispatch-top-header">
        <div className="dispatch-header-title-box">
          <button 
            type="button" 
            className="btn-back-clean"
            onClick={onBack}
            title="Voltar à Lista de Frotas"
          >
            <ArrowLeft size={18} />
            <span>Voltar à Gestão de Frotas</span>
          </button>

          <div className="dispatch-title-meta">
            <h2>Central de Despacho & Automação WhatsApp CCO</h2>
            <div className="dispatch-badges-row">
              <span className={`evolution-status-pill ${apiStatus.connected ? 'online' : 'offline'}`}>
                <span className="beacon-dot"></span>
                <span>{apiStatus.connected ? 'Evolution API Online' : 'Evolution API (Configuração Pendente)'}</span>
              </span>
              <button 
                type="button"
                className="btn-open-evolution-config"
                onClick={() => setShowConfigModal(true)}
              >
                <Settings size={13} />
                <span>Configurar Gateway / QR Code</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dispatch-header-quick-actions">
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={handleCopyText}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            className="whatsapp-send-primary btn-icon-text"
            onClick={handleDispatchEvolution}
            disabled={dispatchingApi}
          >
            {dispatchingApi ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Disparando via API...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Disparar via Evolution API</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback de Alerta / Sucesso */}
      {dispatchFeedback && (
        <div className={`alert alert-${dispatchFeedback.type} animate-fade-in`} style={{ marginBottom: '1.25rem' }}>
          {dispatchFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{dispatchFeedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* FAIXA EXECUTIVA DE CONTEXTO DO ATIVO & DO CONDUTOR             */}
      {/* ============================================================== */}
      <div className="dispatch-telemetry-ribbon">
        <div className="ribbon-driver-col">
          <div className="driver-avatar-circle">
            <UserCheck size={22} />
          </div>
          <div className="driver-meta-info">
            <span className="ribbon-label">Condutor Titular Alocado:</span>
            <strong className="driver-name">{vehicle.motorista_vinculado || 'Condutor Titular CCO'}</strong>
            <div className="driver-phone-input-inline">
              <Smartphone size={13} color="#25d366" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                title="Editar número de WhatsApp do condutor"
              />
              <span className="phone-country-tag">BR +55</span>
            </div>
          </div>
        </div>

        <div className="ribbon-vehicle-col">
          <div className="mercosul-plate-badge-cockpit" style={{ transform: 'scale(0.95)' }}>
            <div className="plate-header">
              <span className="plate-flag">🇧🇷</span>
              <span className="plate-country">BRASIL</span>
            </div>
            <div className="plate-number">{formatPlateMercosul(vehicle.placa)}</div>
          </div>

          <div className="vehicle-meta-info">
            <div className="vehicle-name-row">
              <strong>{vehicle.marca_modelo || vehicle.tipo}</strong>
              {vehicle.prefixo && <span className="fleet-prefix-tag">{vehicle.prefixo}</span>}
            </div>
            <span className="vehicle-sublabel">{vehicle.tipo} • {vehicle.tipo_carga || 'Carga Química / Geral'}</span>
          </div>
        </div>

        <div className="ribbon-specs-col">
          <div className="spec-item">
            <Gauge size={14} className="icon-emerald" />
            <div>
              <span className="spec-label">Odômetro Atual</span>
              <strong>{vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}</strong>
            </div>
          </div>

          <div className="spec-item">
            <RotateCcw size={14} className="icon-cyan" />
            <div>
              <span className="spec-label">Próxima Revisão</span>
              <strong>{vehicle.proxima_revisao_km ? `${Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—'}</strong>
            </div>
          </div>

          <div className="spec-item">
            <ShieldCheck size={14} className="icon-emerald" />
            <div>
              <span className="spec-label">CRLV / Vistoria</span>
              <strong className={crlvCountdown.color}>{crlvCountdown.compactText}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* WORKSPACE PRINCIPAL: 3 COLUNAS ESPAÇOSAS & MODERNAS            */}
      {/* ============================================================== */}
      <div className="dispatch-workspace-grid">
        {/* ============================================================ */}
        {/* COLUNA 1: MODELOS PRÉ-DEFINIDOS & BLOCOS MODULARES           */}
        {/* ============================================================ */}
        <div className="dispatch-col-templates">
          <div className="dispatch-panel-card">
            <div className="panel-card-header">
              <div className="header-icon-label">
                <Sparkles size={18} className="icon-emerald" />
                <div>
                  <h4>1. Modelos Operacionais de Despacho</h4>
                  <p>Selecione um assunto estruturado com dados reais</p>
                </div>
              </div>
            </div>

            <div className="templates-scroll-list">
              {WHATSAPP_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`dispatch-template-card ${selectedTemplateId === tpl.id ? 'active' : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className="template-card-top">
                    <span className="template-badge">{tpl.badge}</span>
                    <span className="template-category">{tpl.category}</span>
                  </div>
                  <h5 className="template-title">{tpl.title}</h5>
                  <p className="template-desc">{tpl.description}</p>
                </div>
              ))}
            </div>

            {/* Blocos Modulares de Adição Rápida */}
            <div className="modular-blocks-section">
              <span className="section-title-sm">Blocos Modulares de Informação:</span>
              <div className="modular-buttons-grid">
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('odometro')}
                  title="Incluir odômetro e próxima revisão"
                >
                  <span>📊 Odômetro & Revisão</span>
                </button>
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('vistorias')}
                  title="Incluir prazos das vistorias CRLV/CIPP"
                >
                  <span>🛡️ Vistorias CRLV/CIPP</span>
                </button>
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('assinatura')}
                  title="Incluir assinatura oficial CCO com hora"
                >
                  <span>🕒 Assinatura CCO</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA 2: EDITOR INTELIGENTE COM PROTEÇÃO ANTI-DUPLICAÇÃO    */}
        {/* ============================================================ */}
        <div className="dispatch-col-editor">
          <div className="dispatch-panel-card">
            <div className="panel-card-header" style={{ justifyContent: 'space-between' }}>
              <div className="header-icon-label">
                <Smartphone size={18} className="icon-cyan" />
                <div>
                  <h4>2. Composição da Mensagem Personalizada</h4>
                  <p>Edite livremente ou insira dados dinâmicos do conjunto</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-restore-template"
                onClick={handleResetToTemplate}
                title="Restaurar o modelo padrão original"
              >
                <RotateCcw size={13} />
                <span>Restaurar Modelo Padrão</span>
              </button>
            </div>

            {/* Barra de Gatilhos Dinâmicos com Proteção Anti-Duplicação */}
            <div className="triggers-toolbar-box">
              <div className="triggers-toolbar-header">
                <span className="triggers-title">Gatilhos Funcionais Rápidos:</span>
                <span className="triggers-hint">Clique para inserir no ponto do cursor (sem duplicações)</span>
              </div>

              <div className="smart-triggers-cloud">
                {SMART_TRIGGERS.map((trigger) => {
                  const inText = isTriggerAlreadyInText(trigger);
                  return (
                    <button
                      key={trigger.id}
                      type="button"
                      className={`smart-trigger-pill ${inText ? 'already-in' : ''}`}
                      onClick={() => handleInsertTrigger(trigger)}
                      title={inText ? `"${trigger.label}" já está no texto da mensagem` : `Inserir ${trigger.label}`}
                    >
                      {inText ? <CheckCheck size={12} color="#10b981" /> : <span>+</span>}
                      <span>{trigger.label}</span>
                      {inText && <span className="in-text-tag">No texto</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea em Tela Completa */}
            <div className="editor-textarea-container">
              <textarea
                ref={textareaRef}
                className="dispatch-full-textarea"
                rows={13}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite a instrução operacional ou ajuste a mensagem selecionada..."
              />

              <div className="textarea-footer-counter">
                <span>Dica: Use <strong>*negrito*</strong>, <em>_itálico_</em> e quebras de linha.</span>
                <div className="counter-chips">
                  <span>{messageText.length} caracteres</span>
                  <span>{messageText.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                </div>
              </div>
            </div>

            {/* Ações de Disparo Integradas */}
            <div className="dispatch-action-footer-bar">
              <div className="dispatch-options-group">
                <button
                  type="button"
                  className="whatsapp-send-primary btn-icon-text"
                  onClick={handleDispatchEvolution}
                  disabled={dispatchingApi}
                >
                  {dispatchingApi ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Disparando via Evolution API...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Disparar Direto via Evolution API</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-whatsapp-web btn-icon-text"
                  onClick={handleSendWhatsAppWeb}
                  title="Abrir diretamente no WhatsApp Web ou aplicativo de celular"
                >
                  <ExternalLink size={16} />
                  <span>Abrir no WhatsApp Web / Celular</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA 3: SIMULADOR REALISTA DO SMARTPHONE WHATSAPP           */}
        {/* ============================================================ */}
        <div className="dispatch-col-simulator">
          <div className="dispatch-panel-card simulator-card">
            <div className="simulator-phone-frame">
              {/* Top Notch & Status Bar */}
              <div className="phone-notch-bar">
                <div className="notch-pill"></div>
              </div>
              <div className="phone-status-bar">
                <span>03:20</span>
                <div className="phone-icons">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Chat Header */}
              <div className="phone-chat-header">
                <div className="chat-header-avatar">
                  <UserCheck size={18} />
                  <span className="online-beacon-dot"></span>
                </div>
                <div className="chat-header-meta">
                  <strong>{vehicle.motorista_vinculado || 'Condutor Titular'}</strong>
                  <span className="chat-status">online • Torre CCO Ambipar</span>
                </div>
              </div>

              {/* Chat Canvas Wallpaper */}
              <div className="phone-chat-canvas">
                <div className="whatsapp-official-bubble animate-scale-in">
                  <p className="bubble-body">{messageText || 'Nenhuma mensagem digitada...'}</p>
                  <div className="bubble-footer-meta">
                    <span className="bubble-timestamp">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="bubble-blue-checks">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="phone-chat-input-bar">
                <span className="chat-input-placeholder">Mensagem CCO...</span>
                <div className="chat-mic-btn">
                  <Send size={14} color="#ffffff" />
                </div>
              </div>
            </div>

            {/* Histórico Recente de Disparos */}
            <div className="dispatch-audit-trail-box">
              <span className="audit-trail-title">Histórico de Disparos da Sessão:</span>
              {dispatchHistory.length === 0 ? (
                <p className="audit-empty-text">Nenhum disparo enviado nesta sessão.</p>
              ) : (
                <div className="audit-list">
                  {dispatchHistory.map((item) => (
                    <div key={item.id} className="audit-item">
                      <div className="audit-item-top">
                        <span className="audit-badge">{item.status}</span>
                        <span className="audit-time">{item.time}</span>
                      </div>
                      <p className="audit-preview">{item.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE AUTENTICAÇÃO & GATEWAY EVOLUTION API (QR CODE)         */}
      {/* ============================================================== */}
      {showConfigModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowConfigModal(false)}>
          <div className="evolution-config-dialog animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="evolution-dialog-header">
              <div className="header-icon-label">
                <div className="evolution-icon-glow">
                  <QrCode size={22} color="#25d366" />
                </div>
                <div>
                  <h4>Autenticação & Gateway Evolution API v2</h4>
                  <p>Conecte a instância do WhatsApp para realizar disparos automáticos</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowConfigModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="evolution-dialog-body">
              <div className="evolution-form-grid">
                <div className="input-group-custom">
                  <label>URL do Servidor Evolution API:</label>
                  <input
                    type="text"
                    value={evolutionConfig.serverUrl}
                    onChange={(e) => setEvolutionConfig({ ...evolutionConfig, serverUrl: e.target.value })}
                    placeholder="https://sua-evolution-api.com"
                  />
                  <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                    Endereço base do seu servidor Evolution API v2 (sem barra no final)
                  </small>
                </div>

                <div className="input-group-custom">
                  <label>Global API Key (Token de Autenticação):</label>
                  <input
                    type="password"
                    value={evolutionConfig.apiKey}
                    onChange={(e) => setEvolutionConfig({ ...evolutionConfig, apiKey: e.target.value })}
                    placeholder="Chave secreta configurada na Evolution API"
                  />
                </div>

                <div className="input-group-custom">
                  <label>Nome da Instância WhatsApp:</label>
                  <input
                    type="text"
                    value={evolutionConfig.instanceName}
                    onChange={(e) => setEvolutionConfig({ ...evolutionConfig, instanceName: e.target.value })}
                    placeholder="ambipar-cco"
                  />
                </div>
              </div>

              {/* Status e Conexão QR Code */}
              <div className="evolution-connection-box">
                <div className="conn-status-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`beacon-dot ${apiStatus.connected ? 'online' : 'offline'}`}></span>
                    <strong>Status da Instância: {apiStatus.connected ? 'Conectado / Online' : apiStatus.state}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary btn-icon-text"
                    onClick={checkConnection}
                  >
                    <RefreshCw size={14} />
                    <span>Verificar Status</span>
                  </button>
                </div>

                {/* Área do QR Code */}
                <div className="qr-code-display-area">
                  {qrCodeData ? (
                    <div className="qr-container animate-fade-in">
                      <p style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                        Escaneie o QR Code abaixo com seu WhatsApp:
                      </p>
                      <img 
                        src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} 
                        alt="QR Code Evolution API" 
                        className="qr-image"
                      />
                      <small style={{ color: 'var(--text-dim)' }}>
                        Vá em <strong>Aparelhos Conectados &gt; Conectar um Aparelho</strong>
                      </small>
                    </div>
                  ) : (
                    <div className="qr-placeholder">
                      <QrCode size={48} color="rgba(255, 255, 255, 0.2)" />
                      <p>Gere um QR Code para autenticar a instância do WhatsApp</p>
                      <button
                        type="button"
                        className="btn-primary btn-icon-text"
                        onClick={handleFetchQrCode}
                        disabled={loadingQr}
                      >
                        {loadingQr ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}
                        <span>{loadingQr ? 'Gerando QR Code...' : 'Gerar QR Code de Conexão'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="evolution-dialog-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfigModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveConfig}
              >
                Salvar Configurações & Conectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
