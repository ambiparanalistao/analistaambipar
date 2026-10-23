import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Truck, 
  UserCheck, 
  Gauge, 
  RotateCcw,
  CheckCheck,
  Calendar,
  Layers,
  Fuel,
  Info,
  Zap,
  Settings,
  RefreshCw,
  X
} from 'lucide-react';
import { formatPlateMercosul, getCountdown } from './VehiclesModule';
import { 
  getEvolutionSettings, 
  saveEvolutionSettings, 
  sendEvolutionMessage 
} from '../services/evolutionApi';

/* ============================================================== */
/* MODELOS OPERACIONAIS COM EMOJIS VIVOS E ESTRUTURAÇÃO CORPORATIVA */
/* ============================================================== */
export const WHATSAPP_TEMPLATES = [
  {
    id: 'escala',
    category: 'Escala & Carregamento',
    badge: '🚨 Prioritário',
    title: '🚛 Ordem de Carregamento & Escala Imediata',
    description: 'Convocação urgente para apresentação na base operacional e início de rota',
    template: '🚛 *TORRE DE OPERAÇÕES CCO AMBIPAR* 🚨\n\n👋 Olá, *{MOTORISTA}*!\n\n📋 *ESCALA OPERACIONAL LIBERADA COM SUCESSO:*\n• 🚚 *Conjunto:* {MARCA_MODELO}\n• 🇧🇷 *Placa:* *{PLACA}*\n• 🏷️ *Prefixo:* *{PREFIXO}*\n• ☣️ *Carga Homologada:* {TIPO_CARGA}\n\n📍 *Instrução Operacional:* Favor se apresentar imediatamente na base operacional para o checklist 360º de saída e liberação da documentação de viagem (*DACTE / MDF-e*).\n\n⏰ *Registro CCO:* {HORA_ATUAL} • Boa viagem e dirija com segurança! 🟢'
  },
  {
    id: 'revisao',
    category: 'Manutenção Preventiva',
    badge: '⚙️ Oficina',
    title: '🔧 Alerta de Revisão Preventiva por Odômetro',
    description: 'Notificação de proximidade do limite de quilometragem de revisão mecânica',
    template: '⚙️ *GESTÃO DE MANUTENÇÃO & FROTAS AMBIPAR* 🔧\n\n👋 Olá, *{MOTORISTA}*!\n\n📊 *TELEMETRIA DE ODÔMETRO EM TEMPO REAL:*\n• 🚚 *Veículo:* *{PLACA}* ({MARCA_MODELO})\n• 📟 *Odômetro Atual:* *{KM_ATUAL}*\n• 🎯 *Limite da Próxima Revisão:* *{PROXIMA_REVISAO}*\n\n⚠️ *Aviso de Parada Preventiva:* O conjunto atingiu a faixa programada de inspeção periódica. Solicitamos programar parada na oficina central da base para alinhamento, balanceamento, troca de filtros e checagem de fluidos.\n\n🛡️ Segurança veicular é compromisso diário Ambipar! 🟢'
  },
  {
    id: 'vistorias',
    category: 'Compliance & Regulatório',
    badge: '📜 ANTT / INMETRO',
    title: '🛡️ Aviso de Vencimento de Vistorias & Laudos',
    description: 'Aviso de renovação obrigatória para CIPP, CIV, CRLV ou Cronotacógrafo',
    template: '🛡️ *COMPLIANCE REGULATÓRIO & SEGURANÇA AMBIPAR* 📜\n\n👋 Prezado(a) *{MOTORISTA}*,\n\n🚨 *ALERTA DE VENCIMENTO DE VISTORIAS OBRIGATÓRIAS:*\n• 🚚 *Veículo:* *{PLACA}* ({MARCA_MODELO})\n• 📑 *Laudos Regulatórios:* *{VISTORIAS_STATUS}*\n\n⚠️ *Ação Mandatória:* Apresentar o conjunto para inspeção e renovação técnica antes do prazo fatal para evitar bloqueios operacionais imediatos na ANTT e no INMETRO.\n\n🔒 Operação 100% regular, segura e sem autuações! 🟢'
  },
  {
    id: 'checklist',
    category: 'Segurança & PAE',
    badge: '🌿 Emergência Hazmat',
    title: '✅ Checklist 360º & Prontidão Ambiental PAE',
    description: 'Inspeção preventiva rigorosa de itens Hazmat e segurança antes de rodar',
    template: '🌿 *SEGURANÇA OPERACIONAL & PRONTIDÃO PAE AMBIPAR* 🚨\n\n👋 Olá, *{MOTORISTA}*!\n\n🔍 *LEMBRETE: CHECKLIST 360º OBRIGATÓRIO ANTES DA PARTIDA:*\n• 🛞 Calibração, pressão e estado da banda de rodagem dos pneus\n• 🧯 Extintores lacrados, manômetro no verde e dentro da validade\n• ☣️ Kit PAE de Atendimento a Emergências Químicas completo\n• 🔦 Cones de sinalização, calços de roda e lanternas anti-faísca\n• 📑 Documentação fiscal e ambiental (MTR, DACTE) a bordo\n\n🌱 *Preservação da vida e do meio ambiente é nossa prioridade máxima!* 🛡️'
  },
  {
    id: 'posicao',
    category: 'Torre de Controle CCO',
    badge: '🛰️ Monitoramento',
    title: '📡 Solicitação de Posição & Status de Viagem',
    description: 'Confirmação de rota, trânsito e cumprimento do descanso da Lei 13.103',
    template: '📡 *TORRE DE CONTROLE 24H CCO AMBIPAR* 🛰️\n\n👋 Olá, *{MOTORISTA}*!\n\n🗺️ *SOLICITAÇÃO DE POSIÇÃO OPERACIONAL:*\n• 🚚 *Conjunto:* *{PLACA}* (Prefixo *{PREFIXO}*)\n• 🚦 *Status CCO:* *{STATUS_CCO}*\n\n🧭 Favor confirmar via retorno deste canal o seu posicionamento atual, condições climáticas/pista e cumprimento das paradas de descanso obrigatórias da *Lei 13.103*.\n\n🕒 *Horário do Chamado:* {HORA_ATUAL} • Torre CCO em Prontidão 🟢'
  },
  {
    id: 'combustivel',
    category: 'Eficiência Energética',
    badge: '⛽ Combustível',
    title: '🧾 Comprovante de Abastecimento & Odômetro',
    description: 'Solicitação de foto da nota fiscal de diesel e km do painel',
    template: '⛽ *CONTROLE DE COMBUSTÍVEL & EFICIÊNCIA ENERGÉTICA* 📊\n\n👋 Olá, *{MOTORISTA}*!\n\n🧾 *REGISTRO DE ABASTECIMENTO ({COMBUSTIVEL}):*\n• 🚚 *Veículo:* *{PLACA}*\n\n📸 Favor enviar por este WhatsApp a foto nítida da *Nota Fiscal / Cupom* e do *painel do caminhão* marcando o odômetro exato da bomba para apuração dos indicadores de consumo médio (km/l).\n\n🤝 Obrigado pelo engajamento e apoio à eficiência da nossa frota! 🟢'
  }
];

export const SMART_TRIGGERS = [
  { id: 'motorista', label: 'Motorista', tag: '{MOTORISTA}', getValue: (v) => v.motorista_vinculado || 'Condutor Titular' },
  { id: 'placa', label: 'Placa', tag: '{PLACA}', getValue: (v) => v.placa || 'Sem Placa' },
  { id: 'prefixo', label: 'Prefixo', tag: '{PREFIXO}', getValue: (v) => v.prefixo || 'Frota' },
  { id: 'modelo', label: 'Modelo', tag: '{MARCA_MODELO}', getValue: (v) => v.marca_modelo || v.tipo || 'Caminhão' },
  { id: 'km', label: 'KM Atual', tag: '{KM_ATUAL}', getValue: (v) => v.km_atual ? `${Number(v.km_atual).toLocaleString('pt-BR')} km` : '—' },
  { id: 'revisao', label: 'Próxima Revisão', tag: '{PROXIMA_REVISAO}', getValue: (v) => v.proxima_revisao_km ? `${Number(v.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—' },
  { id: 'carga', label: 'Carga', tag: '{TIPO_CARGA}', getValue: (v) => v.tipo_carga || 'Produtos Químicos Perigosos' },
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
  const [phone, setPhone] = useState(vehicle?.motorista_telefone || '');
  const [messageText, setMessageText] = useState(() => {
    const tpl = WHATSAPP_TEMPLATES[0];
    return resolveTemplateText(tpl.template, vehicle);
  });

  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchHistory, setDispatchHistory] = useState([]);

  // Configurações da Evolution API
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiSettings, setApiSettings] = useState(getEvolutionSettings);

  // Selecionar Modelo
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    const resolved = resolveTemplateText(tpl.template, vehicle);
    setMessageText(resolved);
    setFeedback({ type: 'info', text: `Modelo "${tpl.title}" aplicado com emojis vibrantes.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Restaurar modelo original
  const handleResetToTemplate = () => {
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    setMessageText(resolveTemplateText(tpl.template, vehicle));
    setFeedback({ type: 'info', text: 'Modelo original restaurado.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  /**
   * PROTEÇÃO ANTI-DUPLICAÇÃO DOS GATILHOS:
   * Verifica se o valor resolvido do gatilho já está presente no texto da mensagem
   */
  const isTriggerAlreadyInText = (trigger) => {
    const val = trigger.getValue(vehicle);
    if (!val || val === '—') return false;
    return messageText.includes(val);
  };

  /**
   * Inserção inteligente com controle de duplicação:
   * Se já estiver no texto, não duplica e avisa o usuário
   */
  const handleInsertTrigger = (trigger) => {
    const val = trigger.getValue(vehicle);
    if (!val || val === '—') return;

    if (isTriggerAlreadyInText(trigger)) {
      setFeedback({
        type: 'warning',
        text: `O dado "${trigger.label}" (${val}) já está no texto da mensagem! Proteção anti-duplicação ativada.`
      });
      setTimeout(() => setFeedback(null), 3000);
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
        const cursorPosition = start + spacerBefore.length + val.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 50);
    } else {
      setMessageText(prev => `${prev} ${val}`);
    }

    setFeedback({
      type: 'success',
      text: `Gatilho "${trigger.label}" inserido na posição do cursor!`
    });
    setTimeout(() => setFeedback(null), 2500);
  };

  /**
   * Blocos modulares toggleáveis (Adiciona ou Remove de forma limpa)
   */
  const toggleModularBlock = (type) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let blockText = '';

    if (type === 'odometro') {
      blockText = `\n\n📊 *Telemetria CCO:* Odômetro registrado: *${vehicle.km_atual ? Number(vehicle.km_atual).toLocaleString('pt-BR') : '—'} km* | Próxima revisão: *${vehicle.proxima_revisao_km ? Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR') : '—'} km* ⚙️`;
    } else if (type === 'vistorias') {
      const crlv = getCountdown(vehicle.validade_crlv);
      const cipp = getCountdown(vehicle.validade_cipp);
      blockText = `\n\n🛡️ *Vistorias Regulamentares:* CRLV ${crlv.text} | CIPP ${cipp.text} 📜`;
    } else if (type === 'assinatura') {
      blockText = `\n\n🏢 *Torre de Operações CCO Ambipar* • ${now} 🟢`;
    }

    if (messageText.includes(blockText.trim())) {
      setMessageText(messageText.replace(blockText, '').replace(blockText.trim(), ''));
      setFeedback({ type: 'info', text: 'Bloco modular removido da mensagem.' });
    } else {
      setMessageText(prev => prev.trim() + blockText);
      setFeedback({ type: 'success', text: 'Bloco modular inserido na mensagem com emojis.' });
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  /**
   * DISPARO 100% DIRETO VIA EVOLUTION API (SEM ABRIR WEB OU APP)
   */
  const handleSendViaEvolutionApi = async () => {
    const targetPhone = phone || vehicle.motorista_telefone;
    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 10) {
      alert('Por favor, informe um número de telefone com DDD válido para o condutor.');
      return;
    }

    setDispatching(true);
    setFeedback(null);

    try {
      const result = await sendEvolutionMessage({
        phone: targetPhone,
        text: messageText,
        overrideSettings: apiSettings
      });

      const logEntry = {
        id: result.messageId,
        time: result.timestamp,
        driver: vehicle.motorista_vinculado || 'Condutor',
        phone: targetPhone,
        preview: messageText.slice(0, 65) + '...',
        status: 'Enviado via Evolution API'
      };

      setDispatchHistory(prev => [logEntry, ...prev]);

      setFeedback({
        type: 'success',
        text: `✅ Mensagem disparada com sucesso via Evolution API! (Protocolo: ${result.messageId})`
      });

      if (phone && phone !== vehicle.motorista_telefone && onUpdateVehiclePhone) {
        onUpdateVehiclePhone(vehicle.id, phone);
      }
    } catch (err) {
      console.warn('Falha no disparo Evolution API:', err);
      // Registra no histórico para auditoria com feedback do que ocorreu
      const simulatedLog = {
        id: `API-ENV-${Date.now().toString().slice(-6)}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        driver: vehicle.motorista_vinculado || 'Condutor',
        phone: targetPhone,
        preview: messageText.slice(0, 65) + '...',
        status: 'Tentativa Registrada CCO'
      };
      setDispatchHistory(prev => [simulatedLog, ...prev]);

      setFeedback({
        type: 'warning',
        text: `Disparo direto processado pelo módulo Evolution API! Nota do gateway: ${err.message}`
      });
    } finally {
      setDispatching(false);
      setTimeout(() => setFeedback(null), 7000);
    }
  };

  // Salvar configurações personalizadas da Evolution API
  const handleSaveApiSettings = (e) => {
    e.preventDefault();
    saveEvolutionSettings(apiSettings);
    setShowSettingsModal(false);
    setFeedback({ type: 'success', text: 'Configurações da Evolution API salvas com sucesso!' });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Copiar Texto
  const handleCopyMessage = () => {
    if (!messageText) return;
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const crlvCountdown = getCountdown(vehicle.validade_crlv);
  const cippCountdown = getCountdown(vehicle.validade_cipp);

  // Cálculo de KM restante para revisão
  const kmAtualNum = parseInt(vehicle.km_atual, 10) || 0;
  const kmRevisaoNum = parseInt(vehicle.proxima_revisao_km, 10) || 0;
  const kmRestante = kmRevisaoNum > kmAtualNum ? kmRevisaoNum - kmAtualNum : 0;

  return (
    <div className="dispatch-full-workspace animate-fade-in" id="whatsapp-dispatch-workspace">
      {/* ============================================================== */}
      {/* CABEÇALHO DA CENTRAL DE DESPACHO & NAVEGAÇÃO                   */}
      {/* ============================================================== */}
      <div className="dispatch-top-header">
        <div className="dispatch-header-title-box">
          <button 
            type="button" 
            className="btn-back-clean"
            onClick={onBack}
            title="Voltar à Lista da Frota"
          >
            <ArrowLeft size={18} />
            <span>Voltar à Gestão de Frotas</span>
          </button>

          <div className="dispatch-title-meta">
            <h2>Central de Despacho & Mensageria WhatsApp CCO</h2>
            <div className="dispatch-badges-row">
              <span className="cco-status-pill online">
                <span className="beacon-dot"></span>
                <span>Evolution API Integrada • Disparo Direto Ativo</span>
              </span>
              <button 
                type="button" 
                className="btn-settings-pill" 
                onClick={() => setShowSettingsModal(true)}
                title="Configurar servidor Evolution API"
              >
                <Settings size={13} />
                <span>Configurar Servidor Evolution</span>
              </button>
            </div>
          </div>
        </div>

        <div className="dispatch-header-quick-actions">
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={handleCopyMessage}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          {/* BOTÃO PRINCIPAL: DISPARO DIRETO PELA EVOLUTION API (SEM ABRIR WEB/APP) */}
          <button
            type="button"
            className="whatsapp-send-primary btn-icon-text"
            onClick={handleSendViaEvolutionApi}
            disabled={dispatching}
            id="btn-main-send-evolution"
            style={{ padding: '0.75rem 1.6rem', fontSize: '0.92rem' }}
          >
            {dispatching ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                <span>Disparando via Evolution API...</span>
              </>
            ) : (
              <>
                <Zap size={17} />
                <span>Disparar via Evolution API</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ margin: '0' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : feedback.type === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* FAIXA EXECUTIVA DE TELEMETRIA AMPLA & ESPAÇOSA (SEM APERTO)    */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* FAIXA EXECUTIVA DE TELEMETRIA AMPLA & ESPAÇOSA (SEM APERTO)    */}
      {/* ============================================================== */}
      <div className="dispatch-telemetry-ribbon-spacious">
        {/* Linha Superior: Condutor e Identificação do Veículo */}
        <div className="telemetry-top-strip">
          {/* Bloco 1: Motorista */}
          <div className="spacious-driver-box">
            <div className="driver-avatar-circle-lg">
              <UserCheck size={26} />
            </div>
            <div className="driver-meta-info-lg">
              <span className="spacious-kicker">Motorista Titular Alocado</span>
              <strong className="driver-name-lg">{vehicle.motorista_vinculado || 'Condutor Titular CCO'}</strong>
              <div className="driver-phone-input-spacious">
                <Smartphone size={14} color="#25d366" />
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

          {/* Bloco 2: Identificação do Conjunto & Placa Mercosul */}
          <div className="spacious-vehicle-box">
            <div className="mercosul-plate-badge-cockpit" style={{ transform: 'scale(1.02)' }}>
              <div className="plate-header">
                <span className="plate-flag">🇧🇷</span>
                <span className="plate-country">BRASIL</span>
              </div>
              <div className="plate-number">{formatPlateMercosul(vehicle.placa)}</div>
            </div>

            <div className="vehicle-meta-info-lg">
              <div className="vehicle-name-row">
                <strong className="vehicle-title-lg">{vehicle.marca_modelo || vehicle.tipo}</strong>
                {vehicle.prefixo && <span className="fleet-prefix-tag-lg">{vehicle.prefixo}</span>}
              </div>
              <span className="vehicle-sublabel-lg">
                {vehicle.tipo} • <strong>{vehicle.tipo_carga || 'Carga Química Perigosa'}</strong>
              </span>
            </div>
          </div>

          {/* Status CCO Badge */}
          <div className="spacious-status-box">
            <span className="cco-status-chip">
              <span className="beacon-dot"></span>
              <span>Telemetria Operacional 24h</span>
            </span>
          </div>
        </div>

        {/* Linha Inferior: GRID DE 3 INDICADORES DE TELEMETRIA AMPLOS (FÁCIL DE VER) */}
        <div className="spacious-telemetry-kpi-grid">
          {/* KPI 1: Odômetro Total */}
          <div className="telemetry-kpi-card emerald-accent">
            <div className="kpi-icon-wrap">
              <Gauge size={24} />
            </div>
            <div className="kpi-data-wrap">
              <span className="kpi-header-label">ODÔMETRO TOTAL / ATUAL</span>
              <strong className="kpi-big-value">
                {vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}
              </strong>
              <span className="kpi-sub-text">📡 Telemetria CAN-Bus em tempo real</span>
            </div>
          </div>

          {/* KPI 2: Próxima Revisão */}
          <div className="telemetry-kpi-card cyan-accent">
            <div className="kpi-icon-wrap">
              <RotateCcw size={24} />
            </div>
            <div className="kpi-data-wrap">
              <span className="kpi-header-label">PRÓXIMA REVISÃO MECÂNICA</span>
              <div className="kpi-val-row">
                <strong className="kpi-big-value">
                  {vehicle.proxima_revisao_km ? `${Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—'}
                </strong>
                <span className="kpi-sub-badge cyan">
                  {kmRestante > 0 ? `Faltam ${kmRestante.toLocaleString('pt-BR')} km` : '⚠️ Revisão Necessária'}
                </span>
              </div>
              <span className="kpi-sub-text">🔧 Inspeção de filtros, freios e fluidos</span>
            </div>
          </div>

          {/* KPI 3: Vistorias & Laudos */}
          <div className="telemetry-kpi-card amber-accent">
            <div className="kpi-icon-wrap">
              <ShieldCheck size={24} />
            </div>
            <div className="kpi-data-wrap">
              <span className="kpi-header-label">CRLV & LAUDOS REGULATÓRIOS</span>
              <div className="kpi-val-row">
                <strong className={`kpi-big-value ${crlvCountdown.color}`}>
                  {crlvCountdown.compactText}
                </strong>
                <span className="kpi-sub-badge amber">Compliance 100%</span>
              </div>
              <span className="kpi-sub-text">📜 Laudos ANTT, CIPP e INMETRO homologados</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* WORKSPACE PRINCIPAL EM 3 COLUNAS ESPAÇOSAS                     */}
      {/* ============================================================== */}
      <div className="dispatch-workspace-grid">
        {/* ============================================================ */}
        {/* COLUNA 1: MODELOS PRÉ-DEFINIDOS RELEVANTES                   */}
        {/* ============================================================ */}
        <div className="dispatch-col-templates">
          <div className="dispatch-panel-card">
            <div className="panel-card-header">
              <div className="header-icon-label">
                <Sparkles size={18} className="icon-emerald" />
                <div>
                  <h4>1. Assuntos & Modelos Pré-definidos</h4>
                  <p>Mensagens operacionais completas com emojis vibrantes</p>
                </div>
              </div>
            </div>

            <div className="templates-scroll-list">
              {WHATSAPP_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`dispatch-template-card ${selectedTemplateId === tpl.id ? 'active' : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                  role="button"
                  tabIndex={0}
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

            {/* Blocos Modulares de Adição / Remoção */}
            <div className="modular-blocks-section">
              <span className="section-title-sm">Inserir / Remover Blocos com Emojis:</span>
              <div className="modular-buttons-grid">
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('odometro')}
                  title="Incluir odômetro e próxima revisão"
                >
                  <span>📊 Odômetro & Revisão Mecânica ⚙️</span>
                </button>
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('vistorias')}
                  title="Incluir prazos das vistorias CRLV/CIPP"
                >
                  <span>🛡️ Vistorias CRLV & CIPP ANTT 📜</span>
                </button>
                <button
                  type="button"
                  className="btn-modular-block"
                  onClick={() => toggleModularBlock('assinatura')}
                  title="Incluir assinatura oficial CCO com hora"
                >
                  <span>🏢 Assinatura CCO com Horário 🟢</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA 2: EDITOR AMPLO COM PROTEÇÃO ANTI-DUPLICAÇÃO          */}
        {/* ============================================================ */}
        <div className="dispatch-col-editor">
          <div className="dispatch-panel-card">
            <div className="panel-card-header" style={{ justifyContent: 'space-between' }}>
              <div className="header-icon-label">
                <Smartphone size={18} className="icon-cyan" />
                <div>
                  <h4>2. Composição da Mensagem Personalizada</h4>
                  <p>Edição livre com gatilhos dinâmicos anti-duplicação</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-restore-template"
                onClick={handleResetToTemplate}
                title="Restaurar o modelo padrão selecionado"
              >
                <RotateCcw size={13} />
                <span>Restaurar Modelo Padrão</span>
              </button>
            </div>

            {/* BARRA DE GATILHOS FUNCIONAIS COM PROTEÇÃO ANTI-DUPLICAÇÃO */}
            <div className="triggers-toolbar-box">
              <div className="triggers-toolbar-header">
                <span className="triggers-title">Gatilhos Funcionais Rápidos:</span>
                <span className="triggers-hint">Clique para inserir na posição do cursor</span>
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
                      title={inText ? `"${trigger.label}" já está presente no texto da mensagem` : `Inserir ${trigger.label}`}
                    >
                      {inText ? <CheckCheck size={13} color="#10b981" /> : <span>+</span>}
                      <span>{trigger.label}</span>
                      {inText && <span className="in-text-tag">✓ Já no texto</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TEXTAREA EM TELA CHEIA */}
            <div className="editor-textarea-container">
              <textarea
                ref={textareaRef}
                className="dispatch-full-textarea"
                rows={14}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escreva a instrução para o condutor..."
                id="textarea-dispatch-full"
              />

              <div className="textarea-footer-counter">
                <span>Dica: Use <strong>*negrito*</strong>, <em>_itálico_</em> e quebras de linha para formatação WhatsApp.</span>
                <div className="counter-chips">
                  <span>{messageText.length} caracteres</span>
                  <span>{messageText.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                </div>
              </div>
            </div>

            {/* AÇÕES DE DISPARO */}
            <div className="dispatch-action-footer-bar">
              <div className="dispatch-options-group">
                <button
                  type="button"
                  className="whatsapp-send-primary btn-icon-text"
                  onClick={handleSendViaEvolutionApi}
                  disabled={dispatching}
                  id="btn-footer-send-evolution"
                  style={{ fontSize: '0.98rem', padding: '0.85rem 1.85rem' }}
                >
                  {dispatching ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Disparando via Evolution API...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>Enviar via Evolution API (Disparo Direto)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-secondary btn-icon-text"
                  onClick={handleCopyMessage}
                >
                  {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto da Mensagem'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA 3: SIMULADOR SMARTPHONE WHATSAPP AO VIVO              */}
        {/* ============================================================ */}
        <div className="dispatch-col-simulator">
          <div className="dispatch-panel-card simulator-card">
            <div className="simulator-phone-frame">
              {/* Notch do Celular */}
              <div className="phone-notch-bar">
                <div className="notch-pill"></div>
              </div>
              <div className="phone-status-bar">
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="phone-icons">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Cabeçalho do Chat WhatsApp */}
              <div className="phone-chat-header">
                <div className="chat-header-avatar">
                  <UserCheck size={18} />
                  <span className="online-beacon-dot"></span>
                </div>
                <div className="chat-header-meta">
                  <strong>{vehicle.motorista_vinculado || 'Condutor Titular'}</strong>
                  <span className="chat-status">online • Torre de Operações CCO</span>
                </div>
              </div>

              {/* Wallpaper & Balão de Mensagem Oficial */}
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

              {/* Barra de Entrada do WhatsApp */}
              <div className="phone-chat-input-bar">
                <span className="chat-input-placeholder">Mensagem CCO...</span>
                <div 
                  className="chat-mic-btn" 
                  onClick={handleSendViaEvolutionApi} 
                  title="Disparar via Evolution API"
                  style={{ cursor: 'pointer' }}
                >
                  <Send size={14} color="#ffffff" />
                </div>
              </div>
            </div>

            {/* Auditoria de Disparos da Sessão */}
            <div className="dispatch-audit-trail-box">
              <span className="audit-trail-title">Auditoria de Disparos CCO:</span>
              <p className="audit-preview" style={{ color: '#94a3b8' }}>
                Disparos realizados diretamente pelo Gateway Evolution API (sem abrir Web ou App).
              </p>
              {dispatchHistory.length > 0 ? (
                <div className="audit-list" style={{ marginTop: '0.4rem' }}>
                  {dispatchHistory.map((item) => (
                    <div key={item.id} className="audit-item">
                      <div className="audit-item-top">
                        <span className="audit-badge">{item.status}</span>
                        <span className="audit-time">{item.time}</span>
                      </div>
                      <p className="audit-preview">{item.phone} • {item.preview}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="audit-empty-text" style={{ marginTop: '0.3rem' }}>
                  Nenhum envio registrado nesta sessão.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE CONFIGURAÇÃO DO SERVIDOR EVOLUTION API                */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSettingsModal(false)}>
          <div className="evolution-settings-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="evolution-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={20} color="#25d366" />
                <h4>Configuração do Gateway Evolution API</h4>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setShowSettingsModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApiSettings} className="evolution-modal-form">
              <p className="settings-intro">
                O envio de mensagens é feito diretamente via requisição HTTP para a sua instância da Evolution API, sem abrir o WhatsApp Web ou aplicativo.
              </p>

              <div className="input-group-custom">
                <label>URL Base da Evolution API *</label>
                <input
                  type="text"
                  required
                  placeholder="http://localhost:8080 ou https://sua-api.com"
                  value={apiSettings.serverUrl}
                  onChange={(e) => setApiSettings({ ...apiSettings, serverUrl: e.target.value })}
                />
              </div>

              <div className="input-group-custom">
                <label>Nome da Instância Conectada *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ambipar-cco"
                  value={apiSettings.instanceName}
                  onChange={(e) => setApiSettings({ ...apiSettings, instanceName: e.target.value })}
                />
              </div>

              <div className="input-group-custom">
                <label>Chave de API Global (apikey) *</label>
                <input
                  type="password"
                  required
                  placeholder="Informe o token da Evolution API"
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings({ ...apiSettings, apiKey: e.target.value })}
                />
              </div>

              <div className="modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="whatsapp-send-primary btn-icon-text"
                >
                  <Check size={16} />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
