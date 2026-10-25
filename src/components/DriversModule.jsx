import {requestDriverToxicology} from '../services/driverToxicology';
import {driverValidityRequest} from '../utils/driverValidityRequest';
import DriverBindingPanel from './maintenance/driver/DriverBindingPanel';
import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  Truck, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Calendar,
  MessageCircle,
  ArrowLeft,
  Save,
  Check,
  Flame,
  Layers,
  User,
  ShieldAlert,
  LayoutGrid,
  List
} from 'lucide-react';
import PremiumSelect from './PremiumSelect';
import { AUDITED_VEHICLES } from '../data/auditedAmbiparData';
import useFleetDirectory from '../hooks/useFleetDirectory';
import {saveDriver,deleteRegistryRecord,updateRegistryStatus} from '../services/fleetDirectory';

export const STATUS_OPTIONS = [
  { 
    value: 'Disponível', 
    label: 'Disponível no Pátio / CCO', 
    sublabel: 'Pronto para escala e alocação imediata', 
    color: '#10b981',
    badge: 'Liberado'
  },
  { 
    value: 'Bloqueado', 
    label: 'Bloqueado (Documentação / CCO)', 
    sublabel: 'Pendência em CNH, MOPP, Toxicológico ou NR', 
    color: '#f43f5e',
    badge: 'Bloqueado'
  }
];

export const DEFAULT_FLEET = AUDITED_VEHICLES.map(v => ({ placa: v.placa, modelo: `${v.tipo} (${v.marca_modelo})` }));

export const CNH_CATEGORIES = [
  {
    value: 'E',
    label: 'Categoria E (Combinações Pesadas)',
    sublabel: 'Carretas Tanque, Bitrens, Rodotrens e Articulados',
    icon: '🚛'
  },
  {
    value: 'D',
    label: 'Categoria D (Caminhões Pesados)',
    sublabel: 'Caminhões Truck, Bi-truck e Coletivos',
    icon: '🚚'
  },
  {
    value: 'C',
    label: 'Categoria C (Carga Média)',
    sublabel: 'Caminhões Toco, VUC e Cargas Fracionadas',
    icon: '📦'
  }
];

// Formatadores e utilitários de exibição executiva
export const formatCPF = (val) => {
  if (!val) return '—';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return val;
};

export const formatPhone = (val) => {
  if (!val) return '—';
  const clean = String(val).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return val;
};

export const getInitials = (name) => {
  if (!name) return 'MO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Utilitário de cálculo automático de contagem regressiva de validade
export const getCountdown = (dateStr) => {
  if (!dateStr) return { 
    status: 'empty', 
    text: 'Não informada', 
    compactText: '— Não inf.',
    formattedDate: '',
    days: null, 
    badgeClass: 'badge-muted', 
    color: '#64748b' 
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-');
  const target = new Date(Number(year), Number(month) - 1, Number(day));
  
  const diffTime = target - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  if (days < 0) {
    return {
      status: 'expired',
      days,
      formattedDate,
      text: `VENCIDO há ${Math.abs(days)} dia(s)`,
      compactText: `Vencido (${Math.abs(days)}d)`,
      badgeClass: 'badge-expired',
      color: '#f43f5e'
    };
  }
  if (days === 0) {
    return {
      status: 'today',
      days: 0,
      formattedDate,
      text: 'VENCE HOJE!',
      compactText: 'Vence Hoje!',
      badgeClass: 'badge-expired',
      color: '#f43f5e'
    };
  }
  if (days <= 30) {
    return {
      status: 'critical',
      days,
      formattedDate,
      text: `Faltam ${days} dia(s) (Alerta Crítico)`,
      compactText: `${days}d restantes`,
      badgeClass: 'badge-warning',
      color: '#f59e0b'
    };
  }
  if (days <= 60) {
    return {
      status: 'attention',
      days,
      formattedDate,
      text: `Restam ${days} dia(s) (Atenção)`,
      compactText: `${days}d restantes`,
      badgeClass: 'badge-attention',
      color: '#38bdf8'
    };
  }
  return {
    status: 'valid',
    days,
    formattedDate,
    text: `Válido (${days} dias restantes)`,
    compactText: `Em dia (${days}d)`,
    badgeClass: 'badge-valid',
    color: '#10b981'
  };
};

function ValidityRequestButton({driver,company,compact=false}){const [busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('');const [requestId]=useState(()=>crypto.randomUUID());const delivery=driverValidityRequest(driver);
 async function send(){if(busy||!delivery)return;const uncertain=result?.status==='unknown';if(uncertain&&!window.confirm('O envio anterior pode ter sido recebido. Confira o WhatsApp do motorista. Deseja repetir mesmo com possibilidade de duplicação?'))return;setBusy(true);setError('');try{setResult(await requestDriverToxicology(company,driver.id,requestId,uncertain));}catch(e){setResult({status:'unknown'});setError(e.message);}finally{setBusy(false);}}
 return <div style={{display:'flex',flexDirection:'column',gap:5,maxWidth:'100%'}}><button type="button" onClick={send} disabled={busy||!delivery||result?.status==='accepted'||result?.status==='sending'} className={compact?'table-wa-direct-btn':'btn-whatsapp-executive'} aria-label={'Solicitar toxicológico de '+driver.nome} title={delivery?'Enviar solicitação do exame toxicológico via WhatsApp':'Cadastre um telefone / WhatsApp válido.'} style={{display:'inline-flex',gap:6,alignItems:'center',whiteSpace:'normal'}}><MessageCircle size={14}/><span>{busy?'Enviando…':result?.status==='accepted'?'Aceito para envio WhatsApp':result?.status==='unknown'?'Conferir e tentar novamente':'Solicitar toxicológico'}</span></button>{result&&<small role="status">{result.error||({accepted:'Solicitação aceita para envio WhatsApp.',failed:'Falha no envio. Confira a conexão e tente novamente.',unknown:'Envio incerto. Confira o WhatsApp antes de repetir.',sending:'Já existe um envio em processamento.'}[result.status]||'Confira o resultado do envio.')}</small>}{error&&<small role="alert">{error}</small>}</div>;
}

export default function DriversModule({ user, maintenanceAccess }) {
  // Controle de visualização: 'list' (Quadro Geral) ou 'form' (Formulário Amplo na Página, sem pop-up)
  const [viewMode, setViewMode] = useState('list');
  const [displayLayout, setDisplayLayout] = useState('cards'); // 'cards' (Cards Operacionais VIP) ou 'table' (Tabela Executiva)
  const [editingId, setEditingId] = useState(null);

  // Cadastros operacionais vêm exclusivamente do banco da empresa.
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  // Frotas Integradas (sincronizadas com o Módulo de Frotas)
  const company=maintenanceAccess?.companyId;const directory=useFleetDirectory(company);
  const [fleetVehicles,setFleetVehicles]=useState([]);
  useEffect(()=>{
    if(directory.drivers && directory.drivers.length > 0){
      setDrivers(directory.drivers);
    } else {
      setDrivers([]);
    }
    if(directory.vehicles && directory.vehicles.length > 0){
      setFleetVehicles(directory.vehicles.map(v=>({...v,modelo:v.marca_modelo})));
    } else {
      setFleetVehicles([]);
    }
    setLoading(directory.loading);
    if(directory.error)setFeedback({type:'error',text:directory.error});
  },[directory.drivers,directory.vehicles,directory.loading,directory.error]);
  // Estado do Formulário Completo com Todos os Cursos
  const initialForm = {
    nome: '',
    cpf: '',
    telefone: '',
    telefone_emergencia: '',
    cnh: '',
    categoria_cnh: 'E',
    validade_cnh: '',
    mopp_numero: '',
    validade_toxicologico: '',
    validade_nr20: '',
    validade_nr35: '',
    validade_nr33: '',
    validade_direcao_defensiva: '',
    validade_cargas_especiais: '',
    validade_hazmat_pae: '',
    veiculo_vinculado: '',
    status: 'Disponível',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleRefreshQuadro=()=>directory.reload();
  // Prepara formulário para cadastrar
  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData(initialForm);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepara formulário para editar
  const handleOpenEditForm = (driver) => {
    setEditingId(driver.id);
    setFormData({
      nome: driver.nome || '',
      cpf: driver.cpf || '',
      telefone: driver.telefone || '',
      telefone_emergencia: driver.telefone_emergencia || '',
      cnh: driver.cnh || '',
      categoria_cnh: driver.categoria_cnh || 'E',
      validade_cnh: driver.validade_cnh || '',
      mopp_numero: driver.mopp_numero || '',
      validade_toxicologico: driver.validade_toxicologico || '',
      validade_nr20: driver.validade_nr20 || '',
      validade_nr35: driver.validade_nr35 || '',
      validade_nr33: driver.validade_nr33 || '',
      validade_direcao_defensiva: driver.validade_direcao_defensiva || '',
      validade_cargas_especiais: driver.validade_cargas_especiais || '',
      validade_hazmat_pae: driver.validade_hazmat_pae || '',
      veiculo_vinculado: driver.veiculo_vinculado || '',
      status: driver.status === 'Bloqueado' ? 'Bloqueado' : 'Disponível',
      observacoes: driver.observacoes || ''
    });
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitForm=async e=>{e.preventDefault();if(loading)return;setLoading(true);try{const saved=await saveDriver(formData,editingId,user?.id,company);setDrivers(list=>editingId?list.map(d=>d.id===editingId?saved:d):[saved,...list]);setViewMode('list');setFeedback({type:'success',text:'Motorista salvo no banco.'});}catch(e){setFeedback({type:'error',text:'Motorista não salvo: '+e.message});}finally{setLoading(false);}};
  const handleChangeStatus=async(id,status)=>{try{const saved=await updateRegistryStatus('motoristas',id,status,company);setDrivers(rows=>rows.map(d=>d.id===id?saved:d));}catch(e){setFeedback({type:'error',text:e.message});}};
  const handleDeleteDriver=async(id,nome)=>{if(!window.confirm('Confirma a exclusão do motorista '+nome+'?'))return;try{await deleteRegistryRecord('motoristas',id,company);setDrivers(rows=>rows.filter(d=>d.id!==id));setFeedback({type:'success',text:'Motorista excluído do banco.'});}catch(e){setFeedback({type:'error',text:e.message});}};
  // Verifica se o motorista tem alerta de conformidade em qualquer documento ou curso
  const hasComplianceAlert = (driver) => {
    const dates = [
      driver.validade_cnh,
      driver.validade_toxicologico,
      driver.validade_nr20,
      driver.validade_nr35,
      driver.validade_nr33,
      driver.validade_direcao_defensiva,
      driver.validade_cargas_especiais,
      driver.validade_hazmat_pae
    ];

    return dates.some(d => {
      if (!d) return false;
      const c = getCountdown(d);
      return c.status === 'expired' || c.status === 'today' || c.status === 'critical';
    });
  };

  // Contadores Globais (apenas Disponível e Bloqueado)
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.status === 'Disponível').length;
  const blockedDrivers = drivers.filter(d => d.status === 'Bloqueado').length;
  const alertDrivers = drivers.filter(hasComplianceAlert).length;

  // Filtragem da lista
  const filteredDrivers = drivers.filter(d => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      (d.nome && d.nome.toLowerCase().includes(s)) ||
      (d.cnh && d.cnh.toLowerCase().includes(s)) ||
      (d.cpf && d.cpf.toLowerCase().includes(s)) ||
      (d.telefone && d.telefone.toLowerCase().includes(s)) ||
      (d.veiculo_vinculado && d.veiculo_vinculado.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'disponivel') return d.status === 'Disponível';
    if (statusFilter === 'bloqueado') return d.status === 'Bloqueado';
    if (statusFilter === 'alerta_doc') return hasComplianceAlert(d);
    return true;
  });

  // Link para o WhatsApp Web direto
  const getWhatsAppLink = (phoneStr) => {
    if (!phoneStr) return null;
    const cleanNumber = phoneStr.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    return `https://wa.me/${fullNumber}`;
  };

  return (
    <div className="module-view animate-fade-in" id="drivers-module-root">

      {['admin_geral','admin_empresa'].includes(maintenanceAccess?.role)&&<DriverBindingPanel access={maintenanceAccess}/>}
      {/* ============================================================== */}
      {/* CABEÇALHO DO MÓDULO */}
      {/* ============================================================== */}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <UserCheck size={16} />
            <span>GESTÃO TÉCNICA DE CONDUTORES & COMPLIANCE MOPP</span>
          </div>
          <h2>Quadro de Motoristas & Validades em Tempo Real</h2>
          <p>
            MOPP com validade indeterminada; monitoramento de CNH, exames toxicológicos e NRs com contadores de expiração e acionamento direto via WhatsApp.
          </p>
        </div>

        <div className="header-actions">
          {viewMode === 'form' ? (
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Quadro de Motoristas</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={handleRefreshQuadro}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
                <span>Atualizar Quadro</span>
              </button>

              <button
                type="button"
                className="btn-primary btn-icon-text"
                onClick={handleOpenCreateForm}
                id="open-create-driver-btn"
              >
                <Plus size={18} />
                <span>Cadastrar Novo Motorista</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 1: FORMULÁRIO COMPLETO NA PÁGINA (SEM POP-UP CLAUSTROFÓBICO) */}
      {/* ============================================================== */}
      {viewMode === 'form' ? (
        <form onSubmit={handleSubmitForm} className="driver-full-page-form animate-fade-in" id="driver-form">
          <div className="form-header-banner">
            <div>
              <h3>{editingId ? 'Editar Cadastro do Motorista' : 'Homologar Novo Motorista na Frota Ambipar'}</h3>
              <p>Preencha os dados e acompanhe o contador de validade em tempo real ao selecionar cada data</p>
            </div>
            <div className="form-header-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('list')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary btn-icon-text"
              >
                <Save size={16} />
                <span>{editingId ? 'Salvar Alterações' : 'Concluir Cadastro do Motorista'}</span>
              </button>
            </div>
          </div>

          <div className="driver-form-sections-grid">
            {/* Bloco 1: Identificação & Área de Contato do Motorista */}
            <div className="card-panel card-z-top" style={{ position: 'relative', zIndex: 40 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <User size={20} className="icon-emerald" />
                  <div>
                    <h4>1. Identificação & Contato Direto</h4>
                    <p>Dados civis e canais de comunicação com o condutor</p>
                  </div>
                </div>
              </div>

              <div className="input-group-custom" style={{ marginBottom: '1rem' }}>
                <label>Nome Completo do Motorista *</label>
                <input
                  type="text"
                  required
                  placeholder="Digite o nome completo do motorista"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="grid-2-cols" style={{ marginBottom: '1rem' }}>
                <div className="input-group-custom">
                  <label>CPF do Motorista</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Status Operacional Inicial</label>
                  <PremiumSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={STATUS_OPTIONS}
                    id="driver-status-select"
                  />
                </div>
              </div>

              {/* Área Destacada de Contato Telefônico & WhatsApp */}
              <div className="contact-highlight-container">
                <div className="contact-highlight-header">
                  <Phone size={18} className="text-emerald" />
                  <strong>Área de Contato Operacional & WhatsApp</strong>
                </div>

                {/* Enquadramento e alinhamento dos 2 números na mesma altura exata */}
                <div className="contact-numbers-aligned-grid">
                  <div className="input-group-custom">
                    <label>Telefone / WhatsApp Principal *</label>
                    <div className="input-with-unit">
                      <input
                        type="text"
                        required
                        placeholder="(19) 99876-5432"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                      <span className="unit-tag">
                        <MessageCircle size={15} style={{ color: '#25D366' }} />
                      </span>
                    </div>
                  </div>

                  <div className="input-group-custom">
                    <label>Telefone de Emergência / Recado</label>
                    <div className="input-with-unit">
                      <input
                        type="text"
                        placeholder="(19) 3876-0000"
                        value={formData.telefone_emergencia}
                        onChange={(e) => setFormData({ ...formData, telefone_emergencia: e.target.value })}
                      />
                      <span className="unit-tag">
                        <Phone size={15} style={{ color: '#94a3b8' }} />
                      </span>
                    </div>
                  </div>
                </div>

                {formData.telefone && (
                  <div className="whatsapp-preview-box">
                    <span className="whatsapp-chip">
                      <MessageCircle size={14} /> WhatsApp Integrado:
                    </span>
                    <span className="whatsapp-number">{formData.telefone}</span>
                    <a
                      href={getWhatsAppLink(formData.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-test-btn"
                    >
                      Testar Link de Mensagem ➔
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: CNH & Exame Toxicológico com Contadores Regressivos */}
            <div className="card-panel card-z-mid-high" style={{ position: 'relative', zIndex: 35 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <ShieldCheck size={20} className="icon-cyan" />
                  <div>
                    <h4>2. Habilitação CNH & Toxicológico</h4>
                    <p>Contadores automáticos de expiração e categoria</p>
                  </div>
                </div>
              </div>

              {/* Número de Registro CNH com espaço amplo e legível */}
              <div className="input-group-custom" style={{ marginBottom: '1.2rem' }}>
                <label>Número de Registro CNH (11 dígitos) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 04981726354"
                  value={formData.cnh}
                  onChange={(e) => setFormData({ ...formData, cnh: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.06em' }}
                />
              </div>

              {/* Categoria CNH em linha própria com espaço total para ícones e textos */}
              <div className="input-group-custom" style={{ marginBottom: '1.25rem' }}>
                <label>Categoria da Carteira Nacional de Habilitação</label>
                <PremiumSelect
                  value={formData.categoria_cnh}
                  onChange={(val) => setFormData({ ...formData, categoria_cnh: val })}
                  options={CNH_CATEGORIES}
                  id="driver-cnh-category-select"
                />
              </div>

              {/* Data Validade CNH com Contador Automático */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.25rem' }}>
                <div className="input-group-custom">
                  <label>Data de Validade da CNH *</label>
                  <input
                    type="date"
                    required
                    value={formData.validade_cnh}
                    onChange={(e) => setFormData({ ...formData, validade_cnh: e.target.value })}
                  />
                </div>

                {formData.validade_cnh && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_cnh).badgeClass}`}>
                    <Calendar size={15} />
                    <strong>CNH:</strong>
                    <span>{getCountdown(formData.validade_cnh).text}</span>
                  </div>
                )}
              </div>

              {/* Data Validade Toxicológico com Contador Automático */}
              <div className="date-field-with-countdown-card">
                <div className="input-group-custom">
                  <label>Validade do Exame Toxicológico Periódico</label>
                  <input
                    type="date"
                    value={formData.validade_toxicologico}
                    onChange={(e) => setFormData({ ...formData, validade_toxicologico: e.target.value })}
                  />
                </div>

                {formData.validade_toxicologico && (
                  <div className={`countdown-live-banner ${getCountdown(formData.validade_toxicologico).badgeClass}`}>
                    <Calendar size={15} />
                    <strong>Toxicológico:</strong>
                    <span>{getCountdown(formData.validade_toxicologico).text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 3: Curso MOPP & Treinamentos de Segurança (NRs e Especializações Ambipar) */}
            <div className="card-panel card-z-mid" style={{ position: 'relative', zIndex: 10 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Award size={20} className="icon-emerald" />
                  <div>
                    <h4>3. Cursos Obrigatórios & Certificações Técnicas</h4>
                    <p>MOPP, NRs, Produtos Perigosos e Treinamentos Especializados</p>
                  </div>
                </div>
              </div>

              {/* MOPP Principal */}
              <div className="date-field-with-countdown-card" style={{ marginBottom: '1.2rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="grid-2-cols">
                  <div className="input-group-custom">
                    <label>Nº do Certificado MOPP (Resolução ANTT)</label>
                    <input
                      type="text"
                      placeholder="Ex: MOPP-SP-89412"
                      value={formData.mopp_numero}
                      onChange={(e) => setFormData({ ...formData, mopp_numero: e.target.value })}
                    />
                  </div>

                  <div className="input-group-custom">
                    <label>Validade do Curso MOPP</label>
                    <input type="text" aria-label="Validade do Curso MOPP" value="Validade indeterminada" readOnly/>

                  </div>
                </div>


              </div>

              {/* Grid com Cursos e NRs Especializadas do Setor */}
              <div className="courses-two-cols-grid">
                {/* 1. NR-20 (Inflamáveis e Combustíveis) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-20 (Inflamáveis & Combustíveis)</label>
                    <input
                      type="date"
                      value={formData.validade_nr20}
                      onChange={(e) => setFormData({ ...formData, validade_nr20: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr20 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr20).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr20).text}</span>
                    </div>
                  )}
                </div>

                {/* 2. NR-35 (Trabalho em Altura - Bocais de Tanque) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-35 (Trabalho em Altura - Tanques)</label>
                    <input
                      type="date"
                      value={formData.validade_nr35}
                      onChange={(e) => setFormData({ ...formData, validade_nr35: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr35 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr35).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr35).text}</span>
                    </div>
                  )}
                </div>

                {/* 3. NR-33 (Espaço Confinado - Inspeção e Limpeza de Tanques) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>NR-33 (Espaço Confinado / Tanques)</label>
                    <input
                      type="date"
                      value={formData.validade_nr33}
                      onChange={(e) => setFormData({ ...formData, validade_nr33: e.target.value })}
                    />
                  </div>
                  {formData.validade_nr33 && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_nr33).badgeClass}`}>
                      <span>{getCountdown(formData.validade_nr33).text}</span>
                    </div>
                  )}
                </div>

                {/* 4. Direção Defensiva & Condução Segura */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>Direção Defensiva (CONTRAN)</label>
                    <input
                      type="date"
                      value={formData.validade_direcao_defensiva}
                      onChange={(e) => setFormData({ ...formData, validade_direcao_defensiva: e.target.value })}
                    />
                  </div>
                  {formData.validade_direcao_defensiva && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_direcao_defensiva).badgeClass}`}>
                      <span>{getCountdown(formData.validade_direcao_defensiva).text}</span>
                    </div>
                  )}
                </div>

                {/* 5. Cargas Indivisíveis e Especiais */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>Cargas Indivisíveis & Especiais</label>
                    <input
                      type="date"
                      value={formData.validade_cargas_especiais}
                      onChange={(e) => setFormData({ ...formData, validade_cargas_especiais: e.target.value })}
                    />
                  </div>
                  {formData.validade_cargas_especiais && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_cargas_especiais).badgeClass}`}>
                      <span>{getCountdown(formData.validade_cargas_especiais).text}</span>
                    </div>
                  )}
                </div>

                {/* 6. PAE / Hazmat (Plano de Atendimento a Emergências com Produtos Perigosos) */}
                <div className="date-field-with-countdown-card">
                  <div className="input-group-custom">
                    <label>PAE / Hazmat (Emergência Química)</label>
                    <input
                      type="date"
                      value={formData.validade_hazmat_pae}
                      onChange={(e) => setFormData({ ...formData, validade_hazmat_pae: e.target.value })}
                    />
                  </div>
                  {formData.validade_hazmat_pae && (
                    <div className={`countdown-live-banner ${getCountdown(formData.validade_hazmat_pae).badgeClass}`}>
                      <span>{getCountdown(formData.validade_hazmat_pae).text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco 4: Alocação de Frota & Histórico (Pré-programado para o Módulo de Frotas) */}
            <div className="card-panel card-z-low" style={{ position: 'relative', zIndex: 5 }}>
              <div className="panel-header">
                <div className="header-icon-label">
                  <Truck size={20} className="icon-cyan" />
                  <div>
                    <h4>4. Alocação de Frota & Histórico</h4>
                    <p>Veículo habitual vinculado e integração direta com o módulo de frotas</p>
                  </div>
                </div>
              </div>

              {/* Seletor de Frota Pré-Programado */}
              <div className="fleet-plate-picker-box" style={{ marginBottom: '1.25rem' }}>
                <div className="input-group-custom">
                  <label>Placa do Veículo Vinculado</label>
                  <input
                    type="text"
                    placeholder="Ex: AMB-4K89 ou clique na frota abaixo"
                    value={formData.veiculo_vinculado}
                    onChange={(e) => setFormData({ ...formData, veiculo_vinculado: e.target.value.toUpperCase() })}
                    style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}
                  />
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    ⚡ Selecionar Placa da Frota Ambipar Cadastrada:
                  </span>
                  <div className="fleet-plate-pills-row">
                    {fleetVehicles.map((v) => {
                      const isSelected = formData.veiculo_vinculado === v.placa;
                      return (
                        <button
                          key={v.placa}
                          type="button"
                          className={`fleet-pill-btn ${isSelected ? 'is-active' : ''}`}
                          onClick={() => setFormData({ ...formData, veiculo_vinculado: v.placa })}
                          title={v.modelo}
                        >
                          <Truck size={13} />
                          <span>{v.placa}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="fleet-sync-badge">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>
                    <strong>Pré-integrado com Módulo de Frotas:</strong> As placas selecionadas ou digitadas aqui são sincronizadas automaticamente com a frota geral e viagens.
                  </span>
                </div>
              </div>

              <div className="input-group-custom">
                <label>Observações do Analista / Restrições Médicas / CCO</label>
                <textarea
                  rows={4}
                  className="select-custom"
                  style={{ resize: 'vertical' }}
                  placeholder="Histórico de rotas, certificações adicionais ou observações do CCO..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação na Base */}
          <div className="form-submit-footer-card">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              Cancelar e Voltar ao Quadro
            </button>

            <button
              type="submit"
              className="btn-primary btn-icon-text"
              id="submit-driver-btn"
            >
              <Save size={18} />
              <span>{editingId ? 'Salvar Alterações do Motorista' : 'Homologar Cadastro do Motorista'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ============================================================== */
        /* MODO 2: LISTAGEM COMPLETA & QUADRO DE CONFORMIDADE OPERACIONAL */
        /* ============================================================== */
        <>
          {/* Cards de Métricas Operacionais de Motoristas */}
          <div className="mtr-summary-cards">
            <div className="summary-stat-box">
              <span className="stat-label">Total de Motoristas</span>
              <span className="stat-number">{totalDrivers}</span>
              <span className="stat-sub">Condutores homologados</span>
            </div>

            <div className="summary-stat-box success">
              <span className="stat-label">Disponíveis no Pátio / CCO</span>
              <span className="stat-number">{availableDrivers}</span>
              <span className="stat-sub">Prontos para escala imediata</span>
            </div>

            <div className="summary-stat-box danger">
              <span className="stat-label">Bloqueados pelo CCO</span>
              <span className="stat-number">{blockedDrivers}</span>
              <span className="stat-sub">Pendência documental ou administrativa</span>
            </div>

            <div className={`summary-stat-box ${alertDrivers > 0 ? 'warning' : 'forest'}`}>
              <span className="stat-label">Alertas de Vencimento</span>
              <span className="stat-number">{alertDrivers}</span>
              <span className="stat-sub">
                {alertDrivers > 0 ? 'CNH, toxicológico ou outros cursos a vencer/vencidos' : '100% dos certificados em dia'}
              </span>
            </div>
          </div>

          {/* Quadro Operacional de Motoristas & Validades */}
          <div className="card-panel" style={{ marginTop: '1.5rem' }}>
            <div className="live-board-header">
              <div>
                <h3>Quadro Operacional de Motoristas & Validades</h3>
                <p>Gestão técnica de condutores homologados, MOPP com validade indeterminada e controle de validades das NRs e acionamento direto CCO</p>
              </div>

              <div className="table-controls-bar">
                {/* Campo de Busca */}
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CNH, CPF, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtros Rápidos */}
                <div className="filter-pill-buttons">
                  <button
                    type="button"
                    className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    Todos ({totalDrivers})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${statusFilter === 'disponivel' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('disponivel')}
                  >
                    Disponíveis ({availableDrivers})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${statusFilter === 'bloqueado' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('bloqueado')}
                  >
                    Bloqueados ({blockedDrivers})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${statusFilter === 'alerta_doc' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('alerta_doc')}
                  >
                    Alertas Críticos ({alertDrivers})
                  </button>
                </div>

                {/* Alternador de Visualização: Cards vs Tabela */}
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-mode-btn ${displayLayout === 'cards' ? 'active' : ''}`}
                    onClick={() => setDisplayLayout('cards')}
                    title="Visualização em Cards Operacionais"
                  >
                    <LayoutGrid size={15} />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    className={`view-mode-btn ${displayLayout === 'table' ? 'active' : ''}`}
                    onClick={() => setDisplayLayout('table')}
                    title="Visualização em Tabela Executiva"
                  >
                    <List size={15} />
                    <span>Tabela</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredDrivers.length === 0 ? (
              <div className="empty-table-state" style={{ padding: '3.5rem 1rem' }}>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1.05rem' }}>
                  Nenhum motorista encontrado no filtro selecionado.
                </p>
                <span style={{ fontSize: '0.85rem', display: 'block', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
                  Cadastre novos condutores ou altere os termos de busca para visualizar os registros.
                </span>
                <button
                  type="button"
                  className="btn-primary btn-icon-text"
                  onClick={handleOpenCreateForm}
                  style={{ margin: '0 auto' }}
                >
                  <Plus size={16} />
                  <span>Cadastrar Novo Motorista</span>
                </button>
              </div>
            ) : displayLayout === 'cards' ? (
              /* ============================================================== */
              /* VISUALIZAÇÃO 1: CARDS OPERACIONAIS VIP (DOSSIÊ DO CONDUTOR)    */
              /* ============================================================== */
              <div className="driver-cards-grid">
                {filteredDrivers.map((d) => {
                  const cnhCount = getCountdown(d.validade_cnh);
                  const moppCount = {status:'valid',badgeClass:'badge-valid',compactText:'Validade indeterminada',formattedDate:''};
                  const toxCount = getCountdown(d.validade_toxicologico);
                  const nr20Count = getCountdown(d.validade_nr20);
                  const nr35Count = getCountdown(d.validade_nr35);
                  const nr33Count = getCountdown(d.validade_nr33);
                  const dirDefCount = getCountdown(d.validade_direcao_defensiva);
                  const cargasEspCount = getCountdown(d.validade_cargas_especiais);
                  const hazmatCount = getCountdown(d.validade_hazmat_pae);
                  const waLink = getWhatsAppLink(d.telefone);

                  return (
                    <div 
                      key={d.id} 
                      className={`driver-dossier-card animate-fade-in ${hasComplianceAlert(d) ? 'has-alert' : ''}`}
                    >
                      {/* Topo: Avatar, Nome, Categoria e Status */}
                      <div className="driver-card-header">
                        <div className="driver-avatar-info">
                          <div className="driver-avatar-circle">
                            {getInitials(d.nome)}
                          </div>
                          <div className="driver-title-meta">
                            <h4 className="driver-name-title" title={d.nome}>{d.nome}</h4>
                            <div className="driver-pills-subline">
                              <span className="driver-category-badge">Cat. {d.categoria_cnh || 'E'}</span>
                              {d.cpf && <span className="driver-cpf-text">CPF: {formatCPF(d.cpf)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className={`driver-card-status-badge ${d.status === 'Bloqueado' ? 'bloqueado' : 'disponivel'}`}>
                          <span className="status-dot"></span>
                          <span>{d.status || 'Disponível'}</span>
                        </div>
                      </div>

                      {/* Veículo Alocado */}
                      <div className="driver-vehicle-strip">
                        <span className="strip-label">Veículo Alocado:</span>
                        {d.veiculo_vinculado ? (
                          <div className="mercosul-plate-badge-mini" title="Placa do Veículo Vinculado">
                            <span className="flag">🇧🇷</span>
                            <span className="plate-txt">{d.veiculo_vinculado}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            Nenhum veículo fixo vinculado
                          </span>
                        )}
                      </div>

                      {/* Faixa de Contato & WhatsApp Direto */}
                      <div className="driver-contact-strip">
                        <div className="driver-phones-column">
                          <div className="main-phone-row">
                            <Phone size={14} className="text-emerald" />
                            <span>{formatPhone(d.telefone) || 'Sem telefone'}</span>
                          </div>
                          {d.telefone_emergencia && (
                            <span className="emergency-phone-sub">
                              Recado: {formatPhone(d.telefone_emergencia)}
                            </span>
                          )}
                        </div>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-executive"
                            title="Abrir conversa no WhatsApp com o motorista"
                          >
                            <MessageCircle size={15} />
                            <span>Chamar no Zap</span>
                          </a>
                        )}
                      </div>

                      <div style={{padding:'0 16px 12px'}}><ValidityRequestButton company={company} driver={d}/></div>
                      {/* Dossiê de Validades & Certificações (Grid 2x2 Limpo) */}
                      <div className="driver-compliance-matrix">
                        {/* 1. CNH */}
                        <div className="compliance-matrix-cell">
                          <div className="cell-title">
                            <span>CNH</span>
                            <span className={`cell-badge ${cnhCount.badgeClass}`}>{cnhCount.compactText}</span>
                          </div>
                          <div className="cell-data">Reg: {d.cnh || '—'}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Val: {cnhCount.formattedDate || 'Não informada'}
                          </span>
                        </div>

                        {/* 2. MOPP */}
                        <div className="compliance-matrix-cell">
                          <div className="cell-title">
                            <span>Curso MOPP</span>
                            <span className={`cell-badge ${moppCount.badgeClass}`}>{moppCount.compactText}</span>
                          </div>
                          <div className="cell-data">{d.mopp_numero || 'Certificado não informado'}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Validade indeterminada
                          </span>
                        </div>

                        {/* 3. Toxicológico */}
                        <div className="compliance-matrix-cell">
                          <div className="cell-title">
                            <span>Toxicológico</span>
                            <span className={`cell-badge ${toxCount.badgeClass}`}>{toxCount.compactText}</span>
                          </div>
                          <div className="cell-data">Laboratorial</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            Val: {toxCount.formattedDate || 'Não informada'}
                          </span>
                        </div>

                        {/* 4. Cursos NR & Especiais */}
                        <div className="compliance-matrix-cell">
                          <div className="cell-title">
                            <span>Normas & Cursos</span>
                          </div>
                          <div className="driver-courses-chips-row" style={{ marginTop: '2px' }}>
                            <span className={`course-chip-mini ${nr20Count.status}`}>
                              NR-20: {nr20Count.compactText}
                            </span>
                            <span className={`course-chip-mini ${nr35Count.status}`}>
                              NR-35: {nr35Count.compactText}
                            </span>
                            {d.validade_hazmat_pae && (
                              <span className={`course-chip-mini ${hazmatCount.status}`}>
                                PAE: {hazmatCount.compactText}
                              </span>
                            )}
                            {d.validade_nr33 && (
                              <span className={`course-chip-mini ${nr33Count.status}`}>
                                NR-33: {nr33Count.compactText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rodapé: Seletor Rápido de Status e Ações */}
                      <div className="driver-card-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Status CCO:</span>
                          <PremiumSelect
                            value={d.status}
                            onChange={(val) => handleChangeStatus(d.id, val)}
                            options={STATUS_OPTIONS}
                            size="inline"
                            id={`card-status-${d.id}`}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="topbar-icon-btn"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleOpenEditForm(d)}
                            title="Editar cadastro e validades"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn-danger-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => handleDeleteDriver(d.id, d.nome)}
                            title="Remover motorista da frota"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ============================================================== */
              /* VISUALIZAÇÃO 2: TABELA EXECUTIVA DE ALTA PERFORMANCE           */
              /* ============================================================== */
              <div className="table-responsive-wrapper">
                <table className="drivers-executive-table" id="drivers-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '250px' }}>Condutor Homologado</th>
                      <th style={{ minWidth: '180px' }}>Contato & WhatsApp</th>
                      <th style={{ minWidth: '160px' }}>CNH & Validade</th>
                      <th style={{ minWidth: '150px' }}>Curso MOPP</th>
                      <th style={{ minWidth: '140px' }}>Toxicológico</th>
                      <th style={{ minWidth: '160px' }}>Cursos NRs</th>
                      <th style={{ minWidth: '120px' }}>Veículo</th>
                      <th style={{ minWidth: '150px' }}>Status Operacional</th>
                      <th style={{ minWidth: '80px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((d) => {
                      const cnhCount = getCountdown(d.validade_cnh);
                      const moppCount = {status:'valid',badgeClass:'badge-valid',compactText:'Validade indeterminada',formattedDate:''};
                      const toxCount = getCountdown(d.validade_toxicologico);
                      const nr20Count = getCountdown(d.validade_nr20);
                      const nr35Count = getCountdown(d.validade_nr35);
                      const waLink = getWhatsAppLink(d.telefone);

                      return (
                        <tr key={d.id} className={hasComplianceAlert(d) ? 'row-alert-warning' : ''}>
                          {/* Condutor */}
                          <td>
                            <div className="driver-table-user-cell">
                              <div className="table-driver-avatar">
                                {getInitials(d.nome)}
                              </div>
                              <div className="table-driver-meta">
                                <strong title={d.nome}>{d.nome}</strong>
                                <small>CPF: {formatCPF(d.cpf)} · Cat. {d.categoria_cnh || 'E'}</small>
                              </div>
                            </div>
                          </td>

                          {/* Contato & WhatsApp */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                                {formatPhone(d.telefone) || '—'}
                              </span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="table-wa-direct-btn"
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle size={12} />
                                  <span>Chamar no Zap</span>
                                </a>
                              )}
                              <ValidityRequestButton company={company} driver={d} compact/>
                            </div>
                          </td>

                          {/* CNH */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc', whiteSpace: 'nowrap' }}>
                                Reg: {d.cnh || '—'}
                              </span>
                              <span className={`table-compact-doc-chip ${cnhCount.status}`}>
                                <span className={`table-doc-dot ${cnhCount.status}`}></span>
                                <span>{cnhCount.formattedDate || '—'} · {cnhCount.compactText}</span>
                              </span>
                            </div>
                          </td>

                          {/* MOPP */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc', whiteSpace: 'nowrap' }}>
                                {d.mopp_numero || 'Certificado não informado'}
                              </span>
                              <span className={`table-compact-doc-chip ${moppCount.status}`}>
                                <span className={`table-doc-dot ${moppCount.status}`}></span>
                                <span>{moppCount.compactText}</span>
                              </span>
                            </div>
                          </td>

                          {/* Toxicológico */}
                          <td>
                            <span className={`table-compact-doc-chip ${toxCount.status}`}>
                              <span className={`table-doc-dot ${toxCount.status}`}></span>
                              <span>{toxCount.formattedDate || '—'} · {toxCount.compactText}</span>
                            </span>
                          </td>

                          {/* Cursos NRs */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>NR-20:</span>
                                <span className={`table-compact-doc-chip ${nr20Count.status}`}>
                                  <span className={`table-doc-dot ${nr20Count.status}`}></span>
                                  <span>{nr20Count.compactText}</span>
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>NR-35:</span>
                                <span className={`table-compact-doc-chip ${nr35Count.status}`}>
                                  <span className={`table-doc-dot ${nr35Count.status}`}></span>
                                  <span>{nr35Count.compactText}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Veículo */}
                          <td>
                            {d.veiculo_vinculado ? (
                              <div className="mercosul-plate-badge-mini" title="Veículo vinculado">
                                <span className="flag">🇧🇷</span>
                                <span className="plate-txt">{d.veiculo_vinculado}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <PremiumSelect
                              value={d.status}
                              onChange={(val) => handleChangeStatus(d.id, val)}
                              options={STATUS_OPTIONS}
                              size="inline"
                              id={`status-table-${d.id}`}
                            />
                          </td>

                          {/* Ações */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="topbar-icon-btn"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => handleOpenEditForm(d)}
                                title="Editar dados"
                              >
                                <Edit3 size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn-danger-icon"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => handleDeleteDriver(d.id, d.nome)}
                                title="Excluir motorista"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
