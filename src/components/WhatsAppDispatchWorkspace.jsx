import React, { useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
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
  const [phone, setPhone] = useState(vehicle?.motorista_telefone || '');
  const [messageText, setMessageText] = useState(() => {
    const tpl = WHATSAPP_TEMPLATES[0];
    return resolveTemplateText(tpl.template, vehicle);
  });

  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionSentCount, setSessionSentCount] = useState(0);

  // Selecionar Modelo
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    const resolved = resolveTemplateText(tpl.template, vehicle);
    setMessageText(resolved);
    setFeedback({ type: 'info', text: `Modelo "${tpl.title}" aplicado com sucesso.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Restaurar modelo original
  const handleResetToTemplate = () => {
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    setMessageText(resolveTemplateText(tpl.template, vehicle));
    setFeedback({ type: 'info', text: 'Modelo padrão restaurado.' });
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
        text: `O dado "${trigger.label}" (${val}) já está incluído no texto! Não foi duplicado.`
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
      text: `"${trigger.label}" adicionado à mensagem.`
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
      setFeedback({ type: 'info', text: 'Bloco modular removido da mensagem.' });
    } else {
      setMessageText(prev => prev.trim() + blockText);
      setFeedback({ type: 'success', text: 'Bloco modular inserido na mensagem.' });
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  // Formatação de telefone brasileira
  const normalizePhoneNumber = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('55')) return digits;
    return `55${digits}`;
  };

  // Enviar pelo WhatsApp Web / App
  const handleSendWhatsApp = () => {
    const cleanNumber = normalizePhoneNumber(phone || vehicle.motorista_telefone);
    if (!cleanNumber || cleanNumber.length < 10) {
      alert('Por favor, informe um número de telefone com DDD válido para o condutor.');
      return;
    }

    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanNumber}?text=${encoded}`;
    window.open(url, '_blank');

    setSessionSentCount(prev => prev + 1);

    if (phone && phone !== vehicle.motorista_telefone && onUpdateVehiclePhone) {
      onUpdateVehiclePhone(vehicle.id, phone);
    }
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
                <span>Ambipar CCO • Despacho Operacional Ativo</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Modo Tela Cheia • Sem Modais
              </span>
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

          <button
            type="button"
            className="whatsapp-send-primary btn-icon-text"
            onClick={handleSendWhatsApp}
            id="btn-main-send-whatsapp"
          >
            <Send size={16} />
            <span>Enviar pelo WhatsApp</span>
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
      {/* FAIXA EXECUTIVA DE TELEMETRIA: CONTEXTO DO ATIVO E DO MOTORISTA */}
      {/* ============================================================== */}
      <div className="dispatch-telemetry-ribbon">
        <div className="ribbon-driver-col">
          <div className="driver-avatar-circle">
            <UserCheck size={24} />
          </div>
          <div className="driver-meta-info">
            <span className="ribbon-label">Motorista Alocado:</span>
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
          <div className="mercosul-plate-badge-cockpit">
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
            <Gauge size={16} className="icon-emerald" />
            <div>
              <span className="spec-label">Odômetro Atual</span>
              <strong>{vehicle.km_atual ? `${Number(vehicle.km_atual).toLocaleString('pt-BR')} km` : '—'}</strong>
            </div>
          </div>

          <div className="spec-item">
            <RotateCcw size={16} className="icon-cyan" />
            <div>
              <span className="spec-label">Próxima Revisão</span>
              <strong>{vehicle.proxima_revisao_km ? `${Number(vehicle.proxima_revisao_km).toLocaleString('pt-BR')} km` : '—'}</strong>
            </div>
          </div>

          <div className="spec-item">
            <ShieldCheck size={16} className="icon-emerald" />
            <div>
              <span className="spec-label">CRLV / Vistoria</span>
              <strong className={crlvCountdown.color}>{crlvCountdown.compactText}</strong>
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
                  <p>Mensagens operacionais completas já formatadas</p>
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
              <span className="section-title-sm">Inserir / Remover Blocos Completos:</span>
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
                  <span>🕒 Assinatura CCO com Horário</span>
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
                  <p>Edição manual livre com gatilhos dinâmicos inteligentes</p>
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
                  onClick={handleSendWhatsApp}
                  style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem' }}
                >
                  <Send size={18} />
                  <span>Enviar pelo WhatsApp Agora</span>
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
                <div className="chat-mic-btn" onClick={handleSendWhatsApp} title="Enviar pelo WhatsApp">
                  <Send size={14} color="#ffffff" />
                </div>
              </div>
            </div>

            {/* Informações da Sessão */}
            <div className="dispatch-audit-trail-box">
              <span className="audit-trail-title">Painel de Disparo Rápido:</span>
              <p className="audit-preview" style={{ color: '#94a3b8' }}>
                O envio utiliza o link direto oficial do WhatsApp (WhatsApp Web ou aplicativo mobile).
              </p>
              {sessionSentCount > 0 && (
                <div className="audit-item" style={{ marginTop: '0.4rem' }}>
                  <div className="audit-item-top">
                    <span className="audit-badge">Disparo Realizado</span>
                    <span className="audit-time">Sessão</span>
                  </div>
                  <p className="audit-preview">{sessionSentCount} mensagem(ns) iniciada(s) nesta sessão</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
