import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  FileText, 
  Truck, 
  Box, 
  Scale, 
  Search, 
  Download, 
  Flame, 
  Leaf, 
  Users, 
  Award, 
  FileSpreadsheet,
  AlertCircle,
  ArrowLeft,
  Check,
  Plus,
  RefreshCw,
  Printer,
  Building2,
  Lock,
  Unlock,
  Filter,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  AUDITED_LICENSES, 
  AUDITED_CONTAINERS, 
  AUDITED_VEHICLES, 
  AUDITED_INFRACTIONS, 
  AUDITED_DRIVERS,
  AUDITED_KPI_SUMMARY 
} from '../data/auditedAmbiparData';

// Função auxiliar para calcular dias restantes com base na data da auditoria (24/10/2026)
function calculateDaysRemaining(dateStr, baseDateStr = '2026-10-24') {
  if (!dateStr) return null;
  
  // Tratamento para exercícios anuais como "2023", "2024", "2025", "2026"
  if (/^\d{4}$/.test(dateStr.trim())) {
    const yr = parseInt(dateStr.trim(), 10);
    if (yr < 2026) {
      return (yr - 2026) * 365; // valor negativo grande
    } else if (yr === 2026) {
      return 68; // até 31/12/2026
    } else {
      return (yr - 2026) * 365;
    }
  }

  // Tratamento para formato DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const targetDate = new Date(y, m, d);
    const baseDate = new Date(baseDateStr);
    const diffTime = targetDate - baseDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Tratamento para datas no formato YYYY-MM-DD
  if (dateStr.includes('-')) {
    const targetDate = new Date(dateStr);
    const baseDate = new Date(baseDateStr);
    const diffTime = targetDate - baseDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return null;
}

export default function ComplianceAuditModule() {
  // Controle de Modo de Visualização em Tela Inteira: 'overview' | 'renew_document' | 'new_document' | 'dossier'
  const [viewMode, setViewMode] = useState('overview');
  const [activeTab, setActiveTab] = useState('veiculos'); // 'veiculos', 'motoristas', 'licencas', 'cacambas', 'multas'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS'); // 'TODOS', 'BLOQUEADOS', 'ATENCAO', 'REGULAR'
  const [feedback, setFeedback] = useState(null);

  // Estados persistidos no localStorage
  const [licenses, setLicenses] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_compliance_licenses_v2');
      return saved ? JSON.parse(saved) : AUDITED_LICENSES;
    } catch {
      return AUDITED_LICENSES;
    }
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_compliance_vehicles_v2');
      return saved ? JSON.parse(saved) : AUDITED_VEHICLES;
    } catch {
      return AUDITED_VEHICLES;
    }
  });

  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_compliance_drivers_v2');
      return saved ? JSON.parse(saved) : AUDITED_DRIVERS;
    } catch {
      return AUDITED_DRIVERS;
    }
  });

  const [containers, setContainers] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_compliance_containers_v2');
      return saved ? JSON.parse(saved) : AUDITED_CONTAINERS;
    } catch {
      return AUDITED_CONTAINERS;
    }
  });

  const [infractions, setInfractions] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_compliance_infractions_v2');
      return saved ? JSON.parse(saved) : AUDITED_INFRACTIONS;
    } catch {
      return AUDITED_INFRACTIONS;
    }
  });

  // Estado para edição / renovação em tela cheia
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [renewForm, setRenewForm] = useState({
    categoria: 'veiculo',
    id: '',
    identificador: '',
    tipo_documento: 'CRLV Digital',
    orgao_emissor: 'Detran-RJ',
    numero_documento: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '2027-10-24',
    exercicio_ano: '2026',
    status: 'Regular',
    observacoes: ''
  });

  // Salvar alterações
  const saveVehicles = (list) => {
    setVehicles(list);
    try { localStorage.setItem('ambipar_compliance_vehicles_v2', JSON.stringify(list)); } catch (e) { console.warn(e); }
  };
  const saveDrivers = (list) => {
    setDrivers(list);
    try { localStorage.setItem('ambipar_compliance_drivers_v2', JSON.stringify(list)); } catch (e) { console.warn(e); }
  };
  const saveLicenses = (list) => {
    setLicenses(list);
    try { localStorage.setItem('ambipar_compliance_licenses_v2', JSON.stringify(list)); } catch (e) { console.warn(e); }
  };
  const saveContainers = (list) => {
    setContainers(list);
    try { localStorage.setItem('ambipar_compliance_containers_v2', JSON.stringify(list)); } catch (e) { console.warn(e); }
  };
  const saveInfractions = (list) => {
    setInfractions(list);
    try { localStorage.setItem('ambipar_compliance_infractions_v2', JSON.stringify(list)); } catch (e) { console.warn(e); }
  };

  // Cálculo de KPIs Gerais
  const vehicleStats = useMemo(() => {
    let bloqueados = 0;
    let atencao = 0;
    let regulares = 0;

    vehicles.forEach(v => {
      const crlvExpired = (v.status_crlv || '').includes('VENCIDO');
      const civPendente = (v.status_civ || '').includes('SEM LAUDO');
      if (crlvExpired || civPendente) {
        bloqueados++;
      } else if ((v.status_civ || '').includes('A Agendar') || (v.status_crlv || '').includes('DESATUALIZADO')) {
        atencao++;
      } else {
        regulares++;
      }
    });

    return { total: vehicles.length, bloqueados, atencao, regulares };
  }, [vehicles]);

  const licenseStats = useMemo(() => {
    let criticos = 0;
    let aVencer = 0;
    let validos = 0;

    licenses.forEach(l => {
      const days = calculateDaysRemaining(l.vencimento);
      if (days !== null && days < 0) criticos++;
      else if (days !== null && days <= 30) aVencer++;
      else validos++;
    });

    return { total: licenses.length, criticos, aVencer, validos };
  }, [licenses]);

  const driverStats = useMemo(() => {
    let pendentes = 0;
    let regulares = 0;
    drivers.forEach(d => {
      if (d.status_mopp === 'VÁLIDO' && d.status_cnh === 'REGULAR') regulares++;
      else pendentes++;
    });
    return { total: drivers.length, regulares, pendentes };
  }, [drivers]);

  // Abrir Renovação de Veículo em Tela Cheia
  const handleOpenRenewVehicle = (v) => {
    setSelectedTarget(v);
    setRenewForm({
      categoria: 'veiculo',
      id: v.id,
      identificador: v.placa,
      tipo_documento: 'CRLV Licenciamento Anual',
      orgao_emissor: 'Detran-RJ / Bradesco',
      numero_documento: `CRLV-${v.placa}-2026`,
      data_emissao: '2026-10-24',
      data_vencimento: '2027-10-31',
      exercicio_ano: '2026',
      status: 'REGULAR (2026)',
      observacoes: 'Taxa de licenciamento GRERJ quitada e CRLV digital baixado.'
    });
    setViewMode('renew_document');
  };

  // Abrir Renovação de Motorista em Tela Cheia
  const handleOpenRenewDriver = (d) => {
    setSelectedTarget(d);
    setRenewForm({
      categoria: 'motorista',
      id: d.id,
      identificador: d.nome,
      tipo_documento: 'Curso MOPP & Exame Toxicológico',
      orgao_emissor: 'Senatran / SEST SENAT',
      numero_documento: `MOPP-${d.cpf}`,
      data_emissao: '2026-10-24',
      data_vencimento: '2031-10-24',
      exercicio_ano: '2026',
      status: 'VÁLIDO',
      observacoes: 'Certificado de atualização MOPP e espelho de CNH digital anexados.'
    });
    setViewMode('renew_document');
  };

  // Abrir Renovação de Licença em Tela Cheia
  const handleOpenRenewLicense = (l) => {
    setSelectedTarget(l);
    setRenewForm({
      categoria: 'licenca',
      id: l.numero,
      identificador: `${l.orgao} - ${l.documento}`,
      tipo_documento: l.documento,
      orgao_emissor: l.orgao,
      numero_documento: l.numero,
      data_emissao: '2026-10-24',
      data_vencimento: '2027-04-30',
      exercicio_ano: '2026',
      status: 'VÁLIDO',
      observacoes: 'Protocolo de renovação regularizado perante o órgão emissor.'
    });
    setViewMode('renew_document');
  };

  // Abrir Regularização de Caçamba em Tela Cheia
  const handleOpenRenewContainer = (c) => {
    setSelectedTarget(c);
    setRenewForm({
      categoria: 'cacamba',
      id: c.codigo,
      identificador: `${c.codigo} - ${c.nome}`,
      tipo_documento: 'Laudo Periódico Olhais NR-11 / NBR 14728',
      orgao_emissor: 'Engenharia Mecânica / ART CREA-RJ',
      numero_documento: `ART-NR11-${c.codigo}`,
      data_emissao: '2026-10-24',
      data_vencimento: '2027-10-24',
      exercicio_ano: '2026',
      status: 'Regularizado',
      observacoes: 'Ensaio não destrutivo de soldas e teste de travas aprovado.'
    });
    setViewMode('renew_document');
  };

  // Abrir Quitação de Multa em Tela Cheia
  const handleOpenRenewInfraction = (m) => {
    setSelectedTarget(m);
    setRenewForm({
      categoria: 'multa',
      id: m.ait,
      identificador: `AIT ${m.ait} (${m.placa})`,
      tipo_documento: 'Indicação de Condutor / Quitação 20%',
      orgao_emissor: 'Órgão Autuador de Trânsito',
      numero_documento: m.ait,
      data_emissao: m.data,
      data_vencimento: '2026-10-24',
      exercicio_ano: '2026',
      status: 'Condutor Indicado / Quitado com 20%',
      observacoes: 'Formulário de indicação enviado antes da penalidade NIC.'
    });
    setViewMode('renew_document');
  };

  // Submeter Renovação
  const handleSaveRenew = (e) => {
    e.preventDefault();
    const cat = renewForm.categoria;

    if (cat === 'veiculo') {
      const updated = vehicles.map(v => {
        if (v.id === renewForm.id || v.placa === renewForm.identificador) {
          return {
            ...v,
            exercicio_crlv: renewForm.exercicio_ano || '2026',
            status_crlv: 'REGULAR (2026)',
            inspecao_civ: `Laudo Regularizado em ${renewForm.data_emissao}`,
            status_civ: 'VÁLIDO ATÉ ' + renewForm.data_vencimento,
            status: 'Disponível',
            observacoes: renewForm.observacoes || v.observacoes
          };
        }
        return v;
      });
      saveVehicles(updated);
      setFeedback({ type: 'success', text: `Documentação do veículo ${renewForm.identificador} regularizada com sucesso! Veículo liberado para escala.` });
    } else if (cat === 'motorista') {
      const updated = drivers.map(d => {
        if (d.id === renewForm.id || d.nome === renewForm.identificador) {
          return {
            ...d,
            status_mopp: 'VÁLIDO',
            validade_mopp: renewForm.data_vencimento,
            status_cnh: 'REGULAR',
            observacoes: renewForm.observacoes || d.observacoes
          };
        }
        return d;
      });
      saveDrivers(updated);
      setFeedback({ type: 'success', text: `Prontuário do motorista ${renewForm.identificador} regularizado e atualizado!` });
    } else if (cat === 'licenca') {
      const updated = licenses.map(l => {
        if (l.numero === renewForm.id || l.documento === renewForm.tipo_documento) {
          return {
            ...l,
            vencimento: renewForm.data_vencimento,
            status: '🟢 VÁLIDO / RENOVADO',
            prazo_restante: 'Renovado até ' + renewForm.data_vencimento,
            recomendacao: renewForm.observacoes || 'Certificado mantido regular'
          };
        }
        return l;
      });
      saveLicenses(updated);
      setFeedback({ type: 'success', text: `Licença/Certificado ${renewForm.identificador} renovado com êxito!` });
    } else if (cat === 'cacamba') {
      const updated = containers.map(c => {
        if (c.codigo === renewForm.id) {
          return {
            ...c,
            laudo_olhais: `Laudo ART Aprovado até ${renewForm.data_vencimento}`,
            status: 'Aprovado para Operação',
            recomendacao: renewForm.observacoes || 'Equipamento liberado para içamento'
          };
        }
        return c;
      });
      saveContainers(updated);
      setFeedback({ type: 'success', text: `Laudo de conformidade NR-11 da caçamba ${renewForm.identificador} homologado!` });
    } else if (cat === 'multa') {
      const updated = infractions.map(m => {
        if (m.ait === renewForm.id) {
          return {
            ...m,
            status_indicacao: '🟢 Concluído / Regularizado',
            prazo_limite: 'Tratado em ' + renewForm.data_emissao
          };
        }
        return m;
      });
      saveInfractions(updated);
      setFeedback({ type: 'success', text: `Auto de infração ${renewForm.identificador} baixado! Risco de Multa NIC eliminado.` });
    }

    setTimeout(() => setFeedback(null), 6000);
    setViewMode('overview');
  };

  // Exportar Relatório Consolidado em CSV (Sem Pop-up)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'CATEGORIA;IDENTIFICADOR;DOCUMENTO;ORGAO;VENCIMENTO;STATUS;DIAS_RESTANTES\n';

    vehicles.forEach(v => {
      const crlvExpired = (v.status_crlv || '').includes('VENCIDO');
      csvContent += `Veículo;${v.placa};CRLV Licenciamento;Detran-RJ;${v.exercicio_crlv};${v.status_crlv};${crlvExpired ? 'Vencido' : 'Regular'}\n`;
      csvContent += `Veículo;${v.placa};CIV Inspecao;EIVA / Inmetro;${v.inspecao_civ};${v.status_civ};${(v.status_civ || '').includes('VÁLIDO') ? 'Regular' : 'Pendente'}\n`;
    });

    licenses.forEach(l => {
      const days = calculateDaysRemaining(l.vencimento);
      csvContent += `Licenca;${l.titular};${l.documento};${l.orgao};${l.vencimento};${l.status};${days} dias\n`;
    });

    drivers.forEach(d => {
      csvContent += `Motorista;${d.nome};Curso MOPP;Senatran;${d.validade_mopp};${d.status_mopp};-\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Ambipar_Auditoria_Vencimentos_Regulatorios_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: 'success', text: 'Arquivo CSV com todos os 665 registros gerado e baixado com sucesso!' });
    setTimeout(() => setFeedback(null), 5000);
  };

  // =========================================================================
  // MODO 1: TELA INTEIRA DE RENOVAÇÃO / PROTOCOLO DE DOCUMENTO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'renew_document') {
    return (
      <div className="renew-doc-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Painel Geral</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                BAIXA DE PENDÊNCIA & REGULARIZAÇÃO
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Protocolar Renovação: {renewForm.identificador}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Informe os dados do novo documento, laudo técnico ou comprovante fiscal para atualizar o status e liberar o ativo na torre de controle.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('overview')}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={handleSaveRenew}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>Salvar & Liberar no Sistema</span>
            </button>
          </div>
        </div>

        <div className="card-panel" style={{ maxWidth: '850px', background: '#0e1524', margin: '0 auto' }}>
          <form onSubmit={handleSaveRenew}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Ativo / Entidade Vinculada:
                </label>
                <input
                  type="text"
                  disabled
                  value={renewForm.identificador}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Tipo de Documento / Certificado: *
                </label>
                <input
                  type="text"
                  required
                  value={renewForm.tipo_documento}
                  onChange={(e) => setRenewForm({ ...renewForm, tipo_documento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Órgão Emissor / Entidade Certificadora: *
                </label>
                <input
                  type="text"
                  required
                  value={renewForm.orgao_emissor}
                  onChange={(e) => setRenewForm({ ...renewForm, orgao_emissor: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Nº do Documento / Registro / Protocolo: *
                </label>
                <input
                  type="text"
                  required
                  value={renewForm.numero_documento}
                  onChange={(e) => setRenewForm({ ...renewForm, numero_documento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Data de Emissão / Vistoria: *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.data_emissao}
                  onChange={(e) => setRenewForm({ ...renewForm, data_emissao: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Nova Data de Vencimento / Vigência: *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.data_vencimento}
                  onChange={(e) => setRenewForm({ ...renewForm, data_vencimento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: '6px', color: 'var(--accent-emerald)', fontSize: '0.95rem', fontWeight: 700 }}
                />
              </div>

              {renewForm.categoria === 'veiculo' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Exercício CRLV Licenciamento Anual:
                  </label>
                  <select
                    value={renewForm.exercicio_ano}
                    onChange={(e) => setRenewForm({ ...renewForm, exercicio_ano: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                  >
                    <option value="2026">2026 (Em Dia / Regularizado)</option>
                    <option value="2027">2027 (Antecipado)</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Observações Técnicas / Anotações do CCO:
              </label>
              <textarea
                rows={3}
                value={renewForm.observacoes}
                onChange={(e) => setRenewForm({ ...renewForm, observacoes: e.target.value })}
                placeholder="Ex: Laudo anexado pelo engenheiro mecânico na EIVA. Comprovante fiscal arquivado no prontuário do veículo."
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('overview')}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
              >
                Confirmar Regularização
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: TELA INTEIRA DE CADASTRO DE NOVO DOCUMENTO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'new_document') {
    return (
      <div className="new-doc-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Painel Geral</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 800, background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                NOVO CADASTRO REGULATÓRIO
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Cadastrar Nova Licença, Documento ou Laudo Periódico
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Adicione um novo item para monitoramento contínuo de vencimentos no CCO da Ambipar.
            </p>
          </div>
        </div>

        <div className="card-panel" style={{ maxWidth: '850px', background: '#0e1524', margin: '0 auto' }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const newLic = {
              orgao: renewForm.orgao_emissor || 'Órgão Regulador',
              documento: renewForm.tipo_documento,
              numero: renewForm.numero_documento || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
              titular: renewForm.identificador || 'Ambipar Environmental Solutions DCX',
              emissao: renewForm.data_emissao,
              vencimento: renewForm.data_vencimento,
              prazo_restante: 'Recém Cadastrado',
              status: '🟢 VÁLIDO',
              recomendacao: renewForm.observacoes || 'Monitorar ciclo regulatório'
            };
            const updated = [newLic, ...licenses];
            saveLicenses(updated);
            setFeedback({ type: 'success', text: `Novo documento "${newLic.documento}" cadastrado com sucesso!` });
            setTimeout(() => setFeedback(null), 5000);
            setViewMode('overview');
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Órgão / Entidade Certificadora: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: IBAMA, INEA, Detran, Inmetro, CREA"
                  value={renewForm.orgao_emissor}
                  onChange={(e) => setRenewForm({ ...renewForm, orgao_emissor: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Nome do Documento / Licença: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Licença de Operação, Laudo Estanqueidade Tanque"
                  value={renewForm.tipo_documento}
                  onChange={(e) => setRenewForm({ ...renewForm, tipo_documento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Número de Registro / Processo: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LO-12345/26"
                  value={renewForm.numero_documento}
                  onChange={(e) => setRenewForm({ ...renewForm, numero_documento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Titular / Unidade Responsável:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ambipar DCX / Contrato Vale"
                  value={renewForm.identificador}
                  onChange={(e) => setRenewForm({ ...renewForm, identificador: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Data de Emissão: *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.data_emissao}
                  onChange={(e) => setRenewForm({ ...renewForm, data_emissao: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Data de Vencimento: *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.data_vencimento}
                  onChange={(e) => setRenewForm({ ...renewForm, data_vencimento: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Observações / Condicionantes Ambientais:
              </label>
              <textarea
                rows={3}
                value={renewForm.observacoes}
                onChange={(e) => setRenewForm({ ...renewForm, observacoes: e.target.value })}
                placeholder="Ex: Cumprir condicionante 4.2 de monitoramento semestral de efluentes."
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('overview')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
              >
                Cadastrar e Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 3: TELA INTEIRA DE DOSSIÊ DE CONFORMIDADE PARA IMPRESSÃO (SEM POP-UP)
  // =========================================================================
  if (viewMode === 'dossier') {
    return (
      <div className="dossier-print-fullscreen animate-fade-in" style={{ padding: '0.5rem 0', background: '#070b12' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('overview')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Painel Geral</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                DOSSIÊ EXECUTIVO DE CONFORMIDADE REGULATÓRIA
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Relatório de Auditoria para Fiscalização (PRF, INEA & Clientes Vale / Ternium)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Documento oficial consolidado emitido em 24/10/2026 para comprovação de regularidade operacional e ambiental.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('overview')}
            >
              Voltar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={() => window.print()}
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 700 }}
            >
              <Printer size={16} />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

        {/* Folha do Dossiê Formatada */}
        <div className="card-panel" style={{ background: '#0e1524', border: '1px solid var(--border-subtle)', padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--accent-emerald)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0 }}>AMBIPAR ENVIRONMENTAL SOLUTIONS</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Unidade Operacional Duque de Caxias (RJ) & Operação Contrato Vale S.A.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>AUDITORIA CONFORMIDADE 2026</span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data-Base: 24/10/2026</p>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>1. Status Consolidado de Conformidade da Frota</h3>
          <table className="operational-table" style={{ width: '100%', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Operação</th>
                <th>CRLV</th>
                <th>CIV / CIPP</th>
                <th>Status Operacional CCO</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => {
                const isBlocked = (v.status_crlv || '').includes('VENCIDO') || (v.status_civ || '').includes('SEM LAUDO');
                return (
                  <tr key={i}>
                    <td><strong>{v.placa}</strong></td>
                    <td>{v.marca_modelo}</td>
                    <td>{v.operacao_base}</td>
                    <td>{v.exercicio_crlv} ({v.status_crlv})</td>
                    <td>{v.status_civ}</td>
                    <td>
                      <strong style={{ color: isBlocked ? '#f87171' : 'var(--accent-emerald)' }}>
                        {isBlocked ? '🔴 BLOQUEADO PARA OPERAÇÃO' : '🟢 APTO PARA CIRCULAÇÃO'}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>2. Licenças Ambientais & Certificados da Base</h3>
          <table className="operational-table" style={{ width: '100%', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Órgão</th>
                <th>Licença / Certificado</th>
                <th>Registro</th>
                <th>Vencimento</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l, i) => (
                <tr key={i}>
                  <td><strong>{l.orgao}</strong></td>
                  <td>{l.documento}</td>
                  <td>{l.numero}</td>
                  <td>{l.vencimento}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>CCO - Centro de Controle Operacional Ambipar Logística RJ</span>
            <span>Documento rastreado digitalmente</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO PRINCIPAL: PAINEL GERAL (OVERVIEW) COM SEMÁFOROS E ABAS
  // =========================================================================
  return (
    <div className="compliance-audit-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Top Banner da Central de Vencimentos */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <span className="live-dot" style={{ background: '#ef4444' }}></span>
            <span>CENTRAL REGULATÓRIA & BLINDAGEM DA FROTA • CICLO 2026</span>
          </div>
          <h2>Central de Vencimentos Regulatórios & Compliance CCO</h2>
          <p>
            Monitoramento preditivo de CRLV, CIV, CIPP (Produtos Perigosos), Tacógrafo Inmetro, Licenças IBAMA, INEA e CNH/MOPP dos condutores para bloqueio preventivo de saídas irregulares.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn-secondary btn-icon-text"
            onClick={handleExportCSV}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            title="Baixar planilha CSV com todos os 665 registros"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>

          <button 
            type="button" 
            className="btn-secondary btn-icon-text"
            onClick={() => setViewMode('dossier')}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            title="Dossiê formal para fiscalização da PRF ou auditoria Vale"
          >
            <Printer size={15} />
            <span>Dossiê Fiscalização</span>
          </button>

          <button 
            type="button" 
            className="btn-primary btn-icon-text"
            onClick={() => {
              setRenewForm({
                categoria: 'licenca',
                id: '',
                identificador: '',
                tipo_documento: '',
                orgao_emissor: '',
                numero_documento: '',
                data_emissao: new Date().toISOString().split('T')[0],
                data_vencimento: '2027-10-24',
                exercicio_ano: '2026',
                status: '🟢 VÁLIDO',
                observacoes: ''
              });
              setViewMode('new_document');
            }}
            style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#070b12', fontWeight: 800, fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <Plus size={15} />
            <span>+ Novo Documento</span>
          </button>
        </div>
      </div>

      {/* Alerta Preditivo no Topo: Licenças IBAMA e Veículos Bloqueados */}
      <div 
        style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#070b12',
            fontWeight: 800
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                Alerta Regulatório Crítico: 2 Licenças IBAMA vencem em 12 dias e {vehicleStats.bloqueados} veículos estão bloqueados!
              </strong>
              <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px', color: '#f87171' }}>
                AÇÃO IMEDIATA CCO
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Certificado de Regularidade CTF/APP e Autorização Ambiental AATIPP vencem em 05/11/2026. Veículos como RAW-1B54 (CRLV 2023) não podem sair para viagem sob risco de apreensão na estrada.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-icon-text"
          onClick={() => {
            const ibama = licenses.find(l => l.documento.includes('Regularidade') || l.orgao.includes('IBAMA'));
            if (ibama) handleOpenRenewLicense(ibama);
            else setActiveTab('licencas');
          }}
          style={{ background: '#f87171', borderColor: '#f87171', color: '#070b12', fontWeight: 800, padding: '0.45rem 1rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} />
          <span>Renovar Licenças IBAMA</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
          ✓ {feedback.text}
        </div>
      )}

      {/* 4 Cards de Resumo Executivo da Auditoria com Semáforo */}
      <div className="kpi-metrics-grid" style={{ marginTop: '1.25rem' }}>
        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
          <div className="kpi-top">
            <span className="kpi-title" style={{ color: '#f87171' }}>Veículos Bloqueados p/ Viagem</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <Lock size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: '#f87171' }}>{vehicleStats.bloqueados}</span>
            <span className="unit-suffix">caminhões</span>
          </div>
          <div className="kpi-formula-tag">
            <code>CRLV atrasado ou sem CIV válido</code>
          </div>
          <div className="kpi-footer-status negative">
            <span>Trava de segurança na Escala CCO ativa</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
          <div className="kpi-top">
            <span className="kpi-title" style={{ color: 'var(--accent-amber)' }}>Vencendo em até 30 Dias</span>
            <div className="kpi-icon-wrap amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: 'var(--accent-amber)' }}>{licenseStats.aVencer + 2}</span>
            <span className="unit-suffix">documentos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>IBAMA 12 dias • Intalog 21 dias</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Protocolar renovação antecipada</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Veículos Homologados & Aptos</span>
            <div className="kpi-icon-wrap emerald">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: 'var(--accent-emerald)' }}>{vehicleStats.regulares}</span>
            <span className="unit-suffix">caminhões 100% OK</span>
          </div>
          <div className="kpi-formula-tag">
            <code>FVV-0E16, EWX-0I82, GBU-0A23...</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Liberados para Vale, Amazon e DCX</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Multas com Risco de Dobro (NIC)</span>
            <div className="kpi-icon-wrap cyan">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{infractions.length}</span>
            <span className="unit-suffix">AITs pendentes</span>
          </div>
          <div className="kpi-formula-tag">
            <code>R$ 1.956,48 em multas</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Indicar condutores para evitar dobro</span>
          </div>
        </div>
      </div>

      {/* Navegação por Abas Especializadas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('veiculos'); setStatusFilter('TODOS'); }}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'veiculos' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'veiculos' ? '#070b12' : 'var(--text-main)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Truck size={16} />
          <span>Veículos, CRLV & CIV ({vehicles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('motoristas'); setStatusFilter('TODOS'); }}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'motoristas' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'motoristas' ? '#070b12' : 'var(--text-main)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Users size={16} />
          <span>Motoristas & MOPP ({drivers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('licencas'); setStatusFilter('TODOS'); }}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'licencas' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'licencas' ? '#070b12' : 'var(--text-main)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Scale size={16} />
          <span>Licenças Ambientais & Balança ({licenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('cacambas'); setStatusFilter('TODOS'); }}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'cacambas' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'cacambas' ? '#070b12' : 'var(--text-main)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Box size={16} />
          <span>Caçambas & Caixas (83 Ativos)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('multas'); setStatusFilter('TODOS'); }}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'multas' ? 'var(--accent-emerald)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'multas' ? '#070b12' : 'var(--text-main)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <AlertTriangle size={16} />
          <span>Multas & Prazos NIC ({infractions.length})</span>
        </button>
      </div>

      {/* Barra de Filtro Rápido e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: '1' }}>
          <div className="search-input-wrap" style={{ minWidth: '280px', maxWidth: '380px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={`Filtrar registros em ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className={statusFilter === 'TODOS' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStatusFilter('TODOS')}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              Todos
            </button>
            <button
              type="button"
              className={statusFilter === 'BLOQUEADOS' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStatusFilter('BLOQUEADOS')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                background: statusFilter === 'BLOQUEADOS' ? '#f87171' : undefined,
                borderColor: statusFilter === 'BLOQUEADOS' ? '#f87171' : undefined,
                color: statusFilter === 'BLOQUEADOS' ? '#070b12' : undefined
              }}
            >
              Bloqueados / Vencidos
            </button>
            <button
              type="button"
              className={statusFilter === 'REGULAR' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStatusFilter('REGULAR')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                background: statusFilter === 'REGULAR' ? 'var(--accent-emerald)' : undefined,
                borderColor: statusFilter === 'REGULAR' ? 'var(--accent-emerald)' : undefined,
                color: statusFilter === 'REGULAR' ? '#070b12' : undefined
              }}
            >
              Aptos / Regulares
            </button>
          </div>
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Auditado em: <strong>24/10/2026</strong> • Base DCX & Vale
        </span>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: VEÍCULOS, CRLV, CIV E TACÓGRAFO                                */}
      {/* ===================================================================== */}
      {activeTab === 'veiculos' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Controle de Licenciamento (CRLV), Vistoria CIV/CIPP e Tacógrafo Inmetro</h3>
              <p>Monitoramento dos {vehicles.length} veículos pesados e utilitários da frota DCX, Vale e parceiros</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Placa / Prefixo</th>
                  <th>Tipo Carroceria</th>
                  <th>Operação / Base</th>
                  <th>Exercício CRLV</th>
                  <th>Status Licenciamento</th>
                  <th>Inspeção CIV / CIPP</th>
                  <th>Status Operação CCO</th>
                  <th>Ações de Regularização</th>
                </tr>
              </thead>
              <tbody>
                {vehicles
                  .filter(v => {
                    const s = searchTerm.toLowerCase();
                    const matchSearch = v.placa.toLowerCase().includes(s) ||
                      v.tipo.toLowerCase().includes(s) ||
                      v.operacao_base.toLowerCase().includes(s) ||
                      v.marca_modelo.toLowerCase().includes(s);

                    const isBlocked = (v.status_crlv || '').includes('VENCIDO') || (v.status_civ || '').includes('SEM LAUDO');
                    let matchStatus = true;
                    if (statusFilter === 'BLOQUEADOS') matchStatus = isBlocked;
                    if (statusFilter === 'REGULAR') matchStatus = !isBlocked;

                    return matchSearch && matchStatus;
                  })
                  .map((v, idx) => {
                    const isCrlvExpired = (v.status_crlv || '').includes('VENCIDO');
                    const isCivPendente = (v.status_civ || '').includes('SEM LAUDO');
                    const isBlocked = isCrlvExpired || isCivPendente;

                    return (
                      <tr key={idx} style={{ background: isBlocked ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{v.placa}</strong>
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                              {v.prefixo}
                            </span>
                          </div>
                          <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{v.marca_modelo}</small>
                        </td>
                        <td><span className="badge-class inert">{v.tipo}</span></td>
                        <td><strong>{v.operacao_base}</strong></td>
                        <td><span className="date-tag" style={{ color: isCrlvExpired ? '#f87171' : undefined }}>{v.exercicio_crlv}</span></td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isCrlvExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                            color: isCrlvExpired ? '#f87171' : 'var(--accent-emerald-light)',
                            border: `1px solid ${isCrlvExpired ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}>
                            {v.status_crlv}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>{v.inspecao_civ}</div>
                          <span style={{ fontSize: '0.72rem', color: (v.status_civ || '').includes('VÁLIDO') ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                            {v.status_civ}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isBlocked ? <Lock size={14} color="#f87171" /> : <Unlock size={14} color="var(--accent-emerald)" />}
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                              color: isBlocked ? '#f87171' : 'var(--accent-emerald)',
                              border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                            }}>
                              {isBlocked ? 'BLOQUEADO P/ VIAGEM' : 'APTO PARA OPERAÇÃO'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-primary btn-icon-text"
                            onClick={() => handleOpenRenewVehicle(v)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              background: isBlocked ? 'var(--accent-amber)' : 'rgba(16, 185, 129, 0.2)',
                              borderColor: isBlocked ? 'var(--accent-amber)' : 'rgba(16, 185, 129, 0.4)',
                              color: isBlocked ? '#070b12' : 'var(--accent-emerald)',
                              fontWeight: 700
                            }}
                          >
                            <RefreshCw size={12} />
                            <span>{isBlocked ? 'Baixar / Renovar CRLV' : 'Atualizar Laudo'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: MOTORISTAS, CNH E MOPP                                         */}
      {/* ===================================================================== */}
      {activeTab === 'motoristas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Quadro Operacional de Motoristas, CNH e Certificações MOPP</h3>
              <p>Validade de CNH profissional, curso regulamentar de transporte de resíduos perigosos e toxicológico</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Nome do Motorista</th>
                  <th>CPF</th>
                  <th>Função Operacional</th>
                  <th>Curso MOPP</th>
                  <th>Validade MOPP</th>
                  <th>Status MOPP</th>
                  <th>Categoria CNH</th>
                  <th>Status Prontuário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {drivers
                  .filter(d => {
                    const s = searchTerm.toLowerCase();
                    const matchSearch = d.nome.toLowerCase().includes(s) || d.cpf.toLowerCase().includes(s) || d.funcao.toLowerCase().includes(s);
                    const isRegular = d.status_mopp === 'VÁLIDO' && d.status_cnh === 'REGULAR';
                    let matchStatus = true;
                    if (statusFilter === 'BLOQUEADOS') matchStatus = !isRegular;
                    if (statusFilter === 'REGULAR') matchStatus = isRegular;
                    return matchSearch && matchStatus;
                  })
                  .map((d, idx) => {
                    const isRegular = d.status_mopp === 'VÁLIDO' && d.status_cnh === 'REGULAR';
                    return (
                      <tr key={idx}>
                        <td><strong>{d.nome}</strong></td>
                        <td><small style={{ color: 'var(--text-muted)' }}>{d.cpf}</small></td>
                        <td>{d.funcao}</td>
                        <td><small>{d.curso_mopp}</small></td>
                        <td><span className="date-tag">{d.validade_mopp}</span></td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: d.status_mopp === 'VÁLIDO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: d.status_mopp === 'VÁLIDO' ? 'var(--accent-emerald-light)' : 'var(--accent-amber)'
                          }}>
                            {d.status_mopp}
                          </span>
                        </td>
                        <td><span className="badge-class inert">Cat. {d.categoria_cnh}</span></td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isRegular ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                            {isRegular ? '🟢 Conforme' : '🟡 Pendente Anexo'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-secondary btn-icon-text"
                            onClick={() => handleOpenRenewDriver(d)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <RefreshCw size={12} />
                            <span>Atualizar Prontuário</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: LICENÇAS AMBIENTAIS E BALANÇA RODOVIÁRIA                       */}
      {/* ===================================================================== */}
      {activeTab === 'licencas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Licenças Ambientais, Autorizações e Calibrações da Base</h3>
              <p>Ciclo de validade IBAMA, INEA, Corpo de Bombeiros (AVCB), Vigilância Sanitária e Balança Toledo</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Órgão / Entidade</th>
                  <th>Documento / Licença</th>
                  <th>Nº / Processo</th>
                  <th>Titular / CNPJ</th>
                  <th>Emissão</th>
                  <th>Vencimento</th>
                  <th>Prazo Restante</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {licenses
                  .filter(l => {
                    const s = searchTerm.toLowerCase();
                    return l.orgao.toLowerCase().includes(s) || l.documento.toLowerCase().includes(s) || l.numero.toLowerCase().includes(s);
                  })
                  .map((lic, idx) => {
                    const isUrgent = lic.status.includes('URGENTE') || lic.status.includes('CRÍTICO');
                    const isValid = lic.status.includes('VÁLIDO');
                    return (
                      <tr key={idx} style={{ background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                        <td><strong>{lic.orgao}</strong></td>
                        <td>{lic.documento}</td>
                        <td><code>{lic.numero}</code></td>
                        <td><small>{lic.titular}</small></td>
                        <td><span className="date-tag">{lic.emissao}</span></td>
                        <td><span className="date-tag" style={{ color: isUrgent ? '#f87171' : undefined }}>{lic.vencimento}</span></td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: isUrgent ? '#f87171' : (isValid ? 'var(--accent-emerald)' : 'var(--accent-amber)')
                          }}>
                            {lic.prazo_restante}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : (isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                            color: isUrgent ? '#f87171' : (isValid ? 'var(--accent-emerald-light)' : 'var(--accent-amber)'),
                            border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : (isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`
                          }}>
                            {lic.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-primary btn-icon-text"
                            onClick={() => handleOpenRenewLicense(lic)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              background: isUrgent ? 'var(--accent-amber)' : 'rgba(16, 185, 129, 0.2)',
                              borderColor: isUrgent ? 'var(--accent-amber)' : 'rgba(16, 185, 129, 0.4)',
                              color: isUrgent ? '#070b12' : 'var(--accent-emerald)',
                              fontWeight: 700
                            }}
                          >
                            <RefreshCw size={12} />
                            <span>Renovar / Protocolar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 4: CAÇAMBAS E CAIXAS ESTÁTICAS (83 ATIVOS)                        */}
      {/* ===================================================================== */}
      {activeTab === 'cacambas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Inventário de Caçambas e Caixas Estáticas (83 Unidades Auditadas)</h3>
              <p>Equipamentos Brooks e Rollon alocados em clientes (Vale Ilha de Guaíba, CPBS Itaguaí, Amazon) e Base DCX</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Código do Bem</th>
                  <th>Nome do Equipamento</th>
                  <th>Tipo</th>
                  <th>Base / Operação</th>
                  <th>Data Aquisição</th>
                  <th>Idade do Ativo</th>
                  <th>Laudo Olhais (NR-11)</th>
                  <th>Status de Conformidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {containers
                  .filter(c => {
                    const s = searchTerm.toLowerCase();
                    return c.codigo.toLowerCase().includes(s) || c.nome.toLowerCase().includes(s) || c.base.toLowerCase().includes(s);
                  })
                  .slice(0, 50) // exibe até 50 na visualização paginada
                  .map((c, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: 'var(--accent-emerald)' }}>{c.codigo}</strong></td>
                      <td>{c.nome}</td>
                      <td><span className="badge-class inert">{c.tipo}</span></td>
                      <td><strong>{c.base}</strong></td>
                      <td>{c.aquisicao}</td>
                      <td>{c.idade}</td>
                      <td><span style={{ fontSize: '0.8rem', color: (c.laudo_olhais || '').includes('Aprovado') ? 'var(--accent-emerald)' : '#f87171' }}>{c.laudo_olhais}</span></td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: (c.status || '').includes('Aprovado') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: (c.status || '').includes('Aprovado') ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                          border: `1px solid ${(c.status || '').includes('Aprovado') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary btn-icon-text"
                          onClick={() => handleOpenRenewContainer(c)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <RefreshCw size={12} />
                          <span>Anexar Laudo ART</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 5: MULTAS E PRAZOS NIC                                            */}
      {/* ===================================================================== */}
      {activeTab === 'multas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Autos de Infração (AIT) e Prazos de Indicação do Condutor</h3>
              <p>Evite a penalidade NIC (Não Indicação do Condutor) que dobra o valor da multa para Pessoa Jurídica</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Auto de Infração (AIT)</th>
                  <th>Data Infração</th>
                  <th>Enquadramento Legal</th>
                  <th>Valor Original</th>
                  <th>Valor c/ Desconto 20%</th>
                  <th>Prazo Limite Envio</th>
                  <th>Status Indicação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {infractions
                  .filter(m => {
                    const s = searchTerm.toLowerCase();
                    return m.placa.toLowerCase().includes(s) || m.ait.toLowerCase().includes(s) || m.enquadramento.toLowerCase().includes(s);
                  })
                  .map((m, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: 'var(--accent-cyan)' }}>{m.placa}</strong></td>
                      <td><code>{m.ait}</code></td>
                      <td><span className="date-tag">{m.data}</span></td>
                      <td><small>{m.enquadramento}</small></td>
                      <td>R$ {m.valor_original.toFixed(2)}</td>
                      <td><strong style={{ color: 'var(--accent-emerald)' }}>R$ {m.valor_com_desconto.toFixed(2)}</strong></td>
                      <td><span className="date-tag" style={{ color: '#f87171' }}>{m.prazo_limite}</span></td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: (m.status_indicacao || '').includes('Concluído') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: (m.status_indicacao || '').includes('Concluído') ? 'var(--accent-emerald)' : '#f87171',
                          border: `1px solid ${(m.status_indicacao || '').includes('Concluído') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          {m.status_indicacao}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary btn-icon-text"
                          onClick={() => handleOpenRenewInfraction(m)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Check size={12} />
                          <span>Indicar / Quitar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
