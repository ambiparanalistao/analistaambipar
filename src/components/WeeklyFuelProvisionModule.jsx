import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Fuel,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Copy,
  Download,
  Share2,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
  ShieldCheck,
  Building,
  User,
  Sliders,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Send,
  Droplets,
  Gauge,
  Wallet,
  Settings
} from 'lucide-react';
import {
  DEFAULT_CYCLE_SETTINGS,
  INITIAL_WEEKLY_CYCLES,
  calculateCycleTotals,
  generateManagerWhatsAppMessage,
  exportCycleToCSV
} from '../data/weeklyFuelProvisionData';
import './WeeklyFuelProvisionModule.css';

export default function WeeklyFuelProvisionModule({ user, onNavigateModule }) {
  // Estado de ciclos salvo localmente (Versão 2 - Abank)
  const [cycles, setCycles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_weekly_fuel_cycles_v2');
      if (saved) return JSON.parse(saved);
      // Limpa chave v1 antiga se existir
      localStorage.removeItem('ambipar_weekly_fuel_cycles_v1');
      return INITIAL_WEEKLY_CYCLES;
    } catch {
      return INITIAL_WEEKLY_CYCLES;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_cycle_settings_v2');
      if (saved) return JSON.parse(saved);
      localStorage.removeItem('ambipar_fuel_cycle_settings_v1');
      return DEFAULT_CYCLE_SETTINGS;
    } catch {
      return DEFAULT_CYCLE_SETTINGS;
    }
  });

  // Salva no localStorage quando alterado
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_weekly_fuel_cycles_v2', JSON.stringify(cycles));
    } catch (e) {
      console.warn('Erro ao salvar ciclos:', e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_cycle_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações do ciclo:', e);
    }
  }, [settings]);

  // Ciclo Ativo
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || 'CICLO-2026-W43');
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // Margem de contingência operacional ajustável
  const [contingencyPct, setContingencyPct] = useState(activeCycle?.margemSegurancaPct || 8);

  // Modo de visualização de tela cheia (SEM NENHUM POP-UP!)
  // viewMode: 'dashboard' | 'dossier' | 'vehicle_detail' | 'new_entry' | 'settings'
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('Todas');
  const [copySuccess, setCopySuccess] = useState(false);

  // Totais consolidados do ciclo ativo
  const totals = useMemo(() => {
    return calculateCycleTotals(activeCycle, contingencyPct);
  }, [activeCycle, contingencyPct]);

  // Lista de veículos filtrados
  const filteredVehicles = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];
    return activeCycle.veiculosAbastecidos.filter(v => {
      const matchSearch =
        v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.operacao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchOp = operationFilter === 'Todas' || v.operacao.includes(operationFilter);
      return matchSearch && matchOp;
    });
  }, [activeCycle, searchTerm, operationFilter]);

  // Operações únicas para filtro
  const availableOperations = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];
    const ops = new Set();
    activeCycle.veiculosAbastecidos.forEach(v => {
      if (v.operacao.includes('Vale')) ops.add('Vale');
      else if (v.operacao.includes('Amazon')) ops.add('Amazon');
      else if (v.operacao.includes('Jogue Limpo')) ops.add('Jogue Limpo');
      else ops.add('Base Duque de Caxias');
    });
    return ['Todas', ...Array.from(ops)];
  }, [activeCycle]);

  // Copiar resumo formatado para o WhatsApp
  const handleCopyWhatsAppMessage = () => {
    const text = generateManagerWhatsAppMessage(activeCycle, settings, contingencyPct);
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
  };

  // Exportar CSV
  const handleExportCSV = () => {
    exportCycleToCSV(activeCycle, contingencyPct);
  };

  // Novo abastecimento adicionado
  const [newEntryData, setNewEntryData] = useState({
    placa: 'RHU-6I87',
    data: new Date().toISOString().split('T')[0],
    hora: '10:00',
    posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
    cidade: 'Duque de Caxias / RJ',
    dieselLitros: 350,
    precoDiesel: 6.29,
    arlaLitros: 15,
    precoArla: 3.80,
    kmNoAto: 142400,
    nfNumero: 'NF-e 88921',
    comprovante: 'ABK-985100'
  });

  const handleSaveNewEntry = (e) => {
    e.preventDefault();
    const updatedCycles = cycles.map(c => {
      if (c.id !== activeCycle.id) return c;
      const veiculos = c.veiculosAbastecidos.map(v => {
        if (v.placa !== newEntryData.placa) return v;
        const totalEntry = (Number(newEntryData.dieselLitros) * Number(newEntryData.precoDiesel)) +
                           (Number(newEntryData.arlaLitros) * Number(newEntryData.precoArla));
        
        const novoDiaLabel = `${new Date(newEntryData.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`;
        const diasAtualizados = v.diasAbastecimento.includes(novoDiaLabel) ? v.diasAbastecimento : [...v.diasAbastecimento, novoDiaLabel];
        
        const novosDetalhes = [
          ...(v.abastecimentosDetalhe || []),
          {
            data: newEntryData.data,
            diaSemana: new Date(newEntryData.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
            hora: newEntryData.hora,
            posto: newEntryData.posto,
            cidade: newEntryData.cidade,
            dieselLitros: Number(newEntryData.dieselLitros),
            precoDiesel: Number(newEntryData.precoDiesel),
            arlaLitros: Number(newEntryData.arlaLitros),
            precoArla: Number(newEntryData.precoArla),
            valorTotal: totalEntry,
            kmNoAto: Number(newEntryData.kmNoAto),
            nfNumero: newEntryData.nfNumero,
            comprovante: newEntryData.comprovante
          }
        ];

        const novoDieselTotal = v.litrosDieselTotal + Number(newEntryData.dieselLitros);
        const novoArlaTotal = v.litrosArlaTotal + Number(newEntryData.arlaLitros);
        const novoGastoTotal = v.valorTotalGasto + totalEntry;
        const novoKmFinal = Math.max(v.kmFinal, Number(newEntryData.kmNoAto));
        const novoKmRodado = novoKmFinal - v.kmInicial;

        return {
          ...v,
          diasAbastecimento: diasAtualizados,
          abastecimentosDetalhe: novosDetalhes,
          litrosDieselTotal: novoDieselTotal,
          litrosArlaTotal: novoArlaTotal,
          valorTotalGasto: novoGastoTotal,
          kmFinal: novoKmFinal,
          kmRodado: novoKmRodado,
          solicitacaoAporteSugerido: Math.round((novoGastoTotal * (1 + contingencyPct / 100)) / 50) * 50
        };
      });
      return { ...c, veiculosAbastecidos: veiculos };
    });

    setCycles(updatedCycles);
    setViewMode('dashboard');
  };

  // Se a tela estiver em modo Dossiê Timbrado para Impressão / PDF
  if (viewMode === 'dossier') {
    return (
      <div className="dossier-fullscreen-workspace animate-fade-in" id="dossier-fullscreen-workspace">
        <header className="dossier-topbar no-print">
          <div className="dossier-topbar-left">
            <button
              type="button"
              className="btn-back-dossier"
              onClick={() => setViewMode('dashboard')}
            >
              <ArrowLeft size={18} />
              <span>Voltar ao Painel de Aporte</span>
            </button>
            <div className="dossier-tag">Dossiê Executivo Oficial de Solicitação de Saldo</div>
          </div>
          <div className="dossier-topbar-right">
            <button
              type="button"
              className="btn-print-action"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              className="btn-copy-action"
              onClick={handleCopyWhatsAppMessage}
            >
              <Copy size={18} />
              <span>{copySuccess ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>
        </header>

        <div className="dossier-paper-container">
          <div className="dossier-document">
            {/* Cabeçalho Oficial Ambipar */}
            <div className="doc-header">
              <div className="doc-brand">
                <div className="doc-logo-pill">AMBIPAR</div>
                <div className="doc-brand-text">
                  <h2>AMBIPAR ENVIRONMENTAL SOLUTIONS</h2>
                  <p>Operações de Logística & Gestão Integrada de Frotas · Polo Duque de Caxias / RJ</p>
                </div>
              </div>
              <div className="doc-meta-box">
                <span className="doc-code">{activeCycle.id}</span>
                <span className="doc-date">Fechamento: Quarta-feira 17:00h</span>
                <span className="doc-report-date">Aporte: Quinta-feira 08:00h</span>
              </div>
            </div>

            <div className="doc-title-banner">
              <h1>RELATÓRIO & APORTE SEMANAL DE COMBUSTÍVEL · CARTÃO ABANK FROTA</h1>
              <p>Demonstrativo consolidado de abastecimentos realizados, quilometragens aferidas e solicitação de saldo financeiro para a semana seguinte.</p>
            </div>

            {/* Informações de Gestão */}
            <div className="doc-info-grid">
              <div className="doc-info-item">
                <label>GESTOR RESPONSÁVEL / APROVADOR:</label>
                <strong>{settings.gestorNome}</strong>
                <span>{settings.gestorCargo}</span>
              </div>
              <div className="doc-info-item">
                <label>ANALISTA CCO SOLICITANTE:</label>
                <strong>{settings.analistaResponsavel}</strong>
                <span>{settings.analistaCargo}</span>
              </div>
              <div className="doc-info-item">
                <label>CONVÊNIO & MEIO DE PAGAMENTO:</label>
                <strong>{settings.convenioPadrao}</strong>
                <span>Cartões Frota com Faturamento Quinzenal</span>
              </div>
              <div className="doc-info-item">
                <label>PERÍODO OPERACIONAL:</label>
                <strong>{activeCycle.nome}</strong>
                <span>Corte programado em Quarta-feira à tarde</span>
              </div>
            </div>

            {/* Tabela Oficial Consolidada dos Veículos */}
            <div className="doc-table-section">
              <h3>1. DEMONSTRATIVO ANALÍTICO DOS VEÍCULOS ABASTECIDOS NO CICLO</h3>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo / Operação</th>
                    <th>Dias Abastecidos</th>
                    <th>KM Inicial</th>
                    <th>KM Final</th>
                    <th>KM Rodado</th>
                    <th>Diesel S10</th>
                    <th>ARLA 32</th>
                    <th>Média</th>
                    <th>Gasto Realizado (R$)</th>
                    <th className="highlight-col">Aporte Sugerido (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCycle.veiculosAbastecidos.map((v, i) => (
                    <tr key={v.placa}>
                      <td className="bold-cell">
                        <div>{v.placa}</div>
                        <small className="sub-tag">{v.prefixo}</small>
                      </td>
                      <td>
                        <div className="model-name">{v.modelo}</div>
                        <div className="op-tag">{v.operacao}</div>
                      </td>
                      <td className="center-cell days-col">
                        {v.diasAbastecimento.map(d => (
                          <span key={d} className="day-badge">{d}</span>
                        ))}
                      </td>
                      <td className="right-cell">{v.kmInicial.toLocaleString('pt-BR')}</td>
                      <td className="right-cell">{v.kmFinal.toLocaleString('pt-BR')}</td>
                      <td className="right-cell bold-cell">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                      <td className="right-cell">{v.litrosDieselTotal} L</td>
                      <td className="right-cell">{v.litrosArlaTotal} L</td>
                      <td className="center-cell bold-cell">
                        {v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-'} km/l
                      </td>
                      <td className="right-cell">R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="right-cell highlight-col bold-cell">
                        R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tfoot-totals">
                    <td colSpan="5"><strong>TOTAL CONSOLIDADO DA FROTA</strong></td>
                    <td className="right-cell"><strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong></td>
                    <td className="right-cell"><strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong></td>
                    <td className="right-cell"><strong>{totals.totalArla.toLocaleString('pt-BR')} L</strong></td>
                    <td className="center-cell"><strong>{totals.mediaFrotaKmL} km/l</strong></td>
                    <td className="right-cell"><strong>R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                    <td className="right-cell highlight-col">
                      <strong>R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Justificativa e Quadro de Contingência */}
            <div className="doc-contingency-box">
              <h3>2. MEMÓRIA DE CÁLCULO & RECARGA SOLICITADA PARA A SEMANA SEGUINTE</h3>
              <div className="contingency-grid">
                <div className="contingency-card">
                  <span>Gasto Realizado no Período Encerrado:</span>
                  <strong>R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="contingency-card">
                  <span>Margem Técnica de Contingência (+{contingencyPct}%):</span>
                  <strong>R$ {(totals.totalAporteSugerido - totals.totalGasto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="contingency-card highlight-card">
                  <span>VALOR TOTAL REQUERIDO DE APORTE ABANK FROTA:</span>
                  <strong>R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
              <p className="contingency-note">
                * A margem de segurança de {contingencyPct}% cobre variações de itinerário, manobras com tomada de força (PTO) nos caminhões de sucção/poliguindaste e contingências de tráfego no Arco Metropolitano e Rodovia Presidente Dutra.
              </p>
            </div>

            {/* Assinaturas Formais */}
            <div className="doc-signatures">
              <div className="sig-block">
                <div className="sig-line"></div>
                <strong>{settings.analistaResponsavel}</strong>
                <span>Analista de Operações & CCO (Solicitante)</span>
                <small>Emitido em: {new Date().toLocaleDateString('pt-BR')} · Sistema CCO Ambipar</small>
              </div>

              <div className="sig-block">
                <div className="sig-line"></div>
                <strong>{settings.gestorNome}</strong>
                <span>{settings.gestorCargo} (Aprovador)</span>
                <small>Status: Aguardando Autorização no Portal / App Abank</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se a tela estiver em modo Detalhes de um Veículo Específico
  if (viewMode === 'vehicle_detail' && selectedVehicleForDetail) {
    const v = selectedVehicleForDetail;
    return (
      <div className="vehicle-detail-fullscreen animate-fade-in" id="vehicle-detail-fullscreen">
        <header className="detail-topbar">
          <button
            type="button"
            className="btn-back-action"
            onClick={() => setViewMode('dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Resumo Semanal de Aporte</span>
          </button>
          <div className="detail-title-box">
            <h2>Auditoria de Abastecimento · {v.placa} ({v.prefixo})</h2>
            <span className="badge-cycle">{activeCycle.nome}</span>
          </div>
        </header>

        <div className="detail-body-container">
          {/* Header Card do Veículo */}
          <div className="vehicle-summary-card">
            <div className="v-card-main">
              <div className="v-plate-badge">{v.placa}</div>
              <div>
                <h3>{v.modelo}</h3>
                <p className="v-op-sub">{v.operacao} · Cartão {v.cartaoTipo} ({v.cartaoNumero})</p>
              </div>
            </div>

            <div className="v-kpi-group">
              <div className="v-kpi">
                <span>KM Rodado na Semana</span>
                <strong>{v.kmRodado.toLocaleString('pt-BR')} km</strong>
                <small>{v.kmInicial.toLocaleString('pt-BR')} ➔ {v.kmFinal.toLocaleString('pt-BR')}</small>
              </div>
              <div className="v-kpi">
                <span>Diesel S10 Total</span>
                <strong>{v.litrosDieselTotal} L</strong>
                <small>Média: {(v.kmRodado / v.litrosDieselTotal).toFixed(2)} km/l (Meta: {v.metaKmL})</small>
              </div>
              <div className="v-kpi">
                <span>ARLA 32 Total</span>
                <strong>{v.litrosArlaTotal} L</strong>
                <small>Proporção: {((v.litrosArlaTotal / v.litrosDieselTotal) * 100).toFixed(1)}%</small>
              </div>
              <div className="v-kpi highlight-kpi">
                <span>Aporte Sugerido Próxima Semana</span>
                <strong>R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                <small>Gasto Realizado: R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>
              </div>
            </div>
          </div>

          {/* Histórico dos Cupons / Abastecimentos no Período */}
          <div className="tickets-section">
            <div className="tickets-header">
              <h3>
                <Fuel size={20} className="icon-emerald" />
                <span>Comprovantes de Abastecimento Realizados na Semana (Fechamento Quarta-feira)</span>
              </h3>
              <span className="count-badge">{v.abastecimentosDetalhe?.length || 0} abastecimentos registrados</span>
            </div>

            <div className="tickets-list">
              {v.abastecimentosDetalhe && v.abastecimentosDetalhe.length > 0 ? (
                v.abastecimentosDetalhe.map((ticket, idx) => (
                  <div key={idx} className="ticket-card">
                    <div className="ticket-badge-day">
                      <Calendar size={14} />
                      <span>{ticket.diaSemana} · {ticket.data} às {ticket.hora}</span>
                    </div>

                    <div className="ticket-details-grid">
                      <div className="ticket-station">
                        <label>Posto Credenciado / Localização:</label>
                        <strong>{ticket.posto}</strong>
                        <span>{ticket.cidade}</span>
                      </div>

                      <div className="ticket-odometer">
                        <label>Hodômetro no Ato:</label>
                        <strong>{ticket.kmNoAto.toLocaleString('pt-BR')} km</strong>
                        <span>Nota Fiscal: {ticket.nfNumero}</span>
                      </div>

                      <div className="ticket-fuel">
                        <label>Volumes & Preços:</label>
                        <div className="fuel-pill-row">
                          <span className="pill-diesel">{ticket.dieselLitros} L Diesel S10 (R$ {ticket.precoDiesel.toFixed(2)}/L)</span>
                          {ticket.arlaLitros > 0 && (
                            <span className="pill-arla">{ticket.arlaLitros} L ARLA 32 (R$ {ticket.precoArla.toFixed(2)}/L)</span>
                          )}
                        </div>
                      </div>

                      <div className="ticket-cost">
                        <label>Valor Total do Cupom:</label>
                        <strong className="cost-val">R$ {ticket.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        <span className="auth-code">Aut: {ticket.comprovante}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-tickets">
                  <Info size={24} />
                  <p>Nenhum detalhamento de cupom registrado individualmente para este veículo no ciclo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se a tela estiver em modo de Lançamento de Novo Abastecimento no Ciclo
  if (viewMode === 'new_entry') {
    return (
      <div className="new-entry-fullscreen animate-fade-in" id="new-entry-fullscreen">
        <header className="entry-topbar">
          <button
            type="button"
            className="btn-back-action"
            onClick={() => setViewMode('dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Cancelar e Voltar ao Aporte</span>
          </button>
          <h2>Lançar Novo Abastecimento no Ciclo Semanal</h2>
        </header>

        <div className="entry-form-container">
          <form onSubmit={handleSaveNewEntry} className="entry-card-form">
            <div className="form-legend">
              <Plus size={20} className="icon-emerald" />
              <div>
                <h3>Registro de Cupom / Nota Fiscal Abank</h3>
                <p>Insira os dados do comprovante para atualizar a memória de cálculo do aporte da próxima quinta-feira.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Veículo / Placa:</label>
                <select
                  value={newEntryData.placa}
                  onChange={e => setNewEntryData({ ...newEntryData, placa: e.target.value })}
                  className="form-input"
                  required
                >
                  {activeCycle.veiculosAbastecidos.map(v => (
                    <option key={v.placa} value={v.placa}>
                      {v.placa} - {v.modelo} ({v.operacao})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data do Abastecimento:</label>
                <input
                  type="date"
                  value={newEntryData.data}
                  onChange={e => setNewEntryData({ ...newEntryData, data: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Horário:</label>
                <input
                  type="time"
                  value={newEntryData.hora}
                  onChange={e => setNewEntryData({ ...newEntryData, hora: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Hodômetro no Ato (KM):</label>
                <input
                  type="number"
                  value={newEntryData.kmNoAto}
                  onChange={e => setNewEntryData({ ...newEntryData, kmNoAto: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Posto de Combustível Credenciado:</label>
                <input
                  type="text"
                  value={newEntryData.posto}
                  onChange={e => setNewEntryData({ ...newEntryData, posto: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Posto Presidente Dutra BR-116"
                  required
                />
              </div>

              <div className="form-group">
                <label>Litros Diesel S10:</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntryData.dieselLitros}
                  onChange={e => setNewEntryData({ ...newEntryData, dieselLitros: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preço Diesel (R$/L):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntryData.precoDiesel}
                  onChange={e => setNewEntryData({ ...newEntryData, precoDiesel: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Litros ARLA 32:</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntryData.arlaLitros}
                  onChange={e => setNewEntryData({ ...newEntryData, arlaLitros: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Preço ARLA 32 (R$/L):</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntryData.precoArla}
                  onChange={e => setNewEntryData({ ...newEntryData, precoArla: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Número da Nota Fiscal (NF-e):</label>
                <input
                  type="text"
                  value={newEntryData.nfNumero}
                  onChange={e => setNewEntryData({ ...newEntryData, nfNumero: e.target.value })}
                  className="form-input"
                  placeholder="Ex: NF-e 44102"
                />
              </div>

              <div className="form-group">
                <label>Comprovante Abank / NSU:</label>
                <input
                  type="text"
                  value={newEntryData.comprovante}
                  onChange={e => setNewEntryData({ ...newEntryData, comprovante: e.target.value })}
                  className="form-input"
                  placeholder="Ex: ABK-985100"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setViewMode('dashboard')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit-entry"
              >
                <CheckCircle2 size={18} />
                <span>Salvar Abastecimento no Ciclo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Se a tela estiver em modo de Configurações do Ciclo
  if (viewMode === 'settings') {
    return (
      <div className="settings-fullscreen animate-fade-in" id="settings-fullscreen">
        <header className="entry-topbar">
          <button
            type="button"
            className="btn-back-action"
            onClick={() => setViewMode('dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Painel de Aporte</span>
          </button>
          <h2>Configuração de Parâmetros do Aporte Semanal</h2>
        </header>

        <div className="settings-container">
          <div className="settings-card">
            <h3>Horários de Corte & Envio</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Dia do Fechamento do Ciclo:</label>
                <input
                  type="text"
                  value={settings.cutoffDay}
                  onChange={e => setSettings({ ...settings, cutoffDay: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Horário Limite do Corte (Quarta-feira):</label>
                <input
                  type="time"
                  value={settings.cutoffHour}
                  onChange={e => setSettings({ ...settings, cutoffHour: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Dia do Envio do Aporte:</label>
                <input
                  type="text"
                  value={settings.reportDay}
                  onChange={e => setSettings({ ...settings, reportDay: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Horário de Envio (Quinta-feira Manhã):</label>
                <input
                  type="time"
                  value={settings.reportHour}
                  onChange={e => setSettings({ ...settings, reportHour: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <h3 style={{ marginTop: '24px' }}>Destinatário & Responsáveis</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Gestor (Aprovador):</label>
                <input
                  type="text"
                  value={settings.gestorNome}
                  onChange={e => setSettings({ ...settings, gestorNome: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Cargo do Gestor:</label>
                <input
                  type="text"
                  value={settings.gestorCargo}
                  onChange={e => setSettings({ ...settings, gestorCargo: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Nome do Analista CCO (Solicitante):</label>
                <input
                  type="text"
                  value={settings.analistaResponsavel}
                  onChange={e => setSettings({ ...settings, analistaResponsavel: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Convenio Padrão:</label>
                <input
                  type="text"
                  value={settings.convenioPadrao}
                  onChange={e => setSettings({ ...settings, convenioPadrao: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn-submit-entry"
                onClick={() => setViewMode('dashboard')}
              >
                <Check size={18} />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (DASHBOARD EXECUTIVO DO APORTE SEMANAL)
  return (
    <div className="weekly-fuel-provision-module animate-fade-in" id="weekly-fuel-provision-module">
      {/* Top Banner de Rotina Operacional Quarta ➔ Quinta */}
      <section className="cycle-routine-banner">
        <div className="banner-badge-col">
          <div className="status-pulse-pill">
            <span className="pulse-dot"></span>
            <span>FECHAMENTO QUARTA-FEIRA À TARDE (17:00H)</span>
          </div>
          <h1>Aporte Semanal & Solicitação de Saldo de Combustível</h1>
          <p>
            Consolidação automática dos abastecimentos realizados na semana para envio ao gestor toda <strong>quinta-feira pela manhã</strong>.
          </p>
        </div>

        <div className="banner-controls-col">
          <div className="cycle-selector-box">
            <label>Selecione o Ciclo Semanal:</label>
            <select
              value={selectedCycleId}
              onChange={e => setSelectedCycleId(e.target.value)}
              className="cycle-select"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.id === 'CICLO-2026-W43' ? '· (Atual)' : ''}
                </option>
              ))}
            </select>
            <span className="cycle-status-text">
              <CheckCircle2 size={13} className="icon-emerald" />
              <span>{activeCycle.statusLabel}</span>
            </span>
          </div>

          <div className="quick-action-buttons">
            <button
              type="button"
              className="btn-action-primary"
              onClick={handleCopyWhatsAppMessage}
              title="Copiar mensagem completa formatada para enviar no WhatsApp ou E-mail do Gestor"
            >
              <Send size={16} />
              <span>{copySuccess ? 'Copiado c/ Sucesso!' : 'Copiar Resumo p/ WhatsApp'}</span>
            </button>

            <button
              type="button"
              className="btn-action-dossier"
              onClick={() => setViewMode('dossier')}
              title="Abrir tela de Dossiê Executivo para Visualização e Impressão/PDF"
            >
              <FileText size={16} />
              <span>Visualizar Dossiê / Imprimir</span>
            </button>

            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleExportCSV}
              title="Exportar planilha Excel/CSV do Aporte"
            >
              <Download size={16} />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setViewMode('new_entry')}
              title="Registrar novo cupom de abastecimento de última hora no ciclo"
            >
              <Plus size={16} />
              <span>Lançar Cupom</span>
            </button>

            <button
              type="button"
              className="btn-action-icon"
              onClick={() => setViewMode('settings')}
              title="Configurações de Corte e Gestor"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Margem de Contingência & Ajuste Interativo */}
      <section className="contingency-bar">
        <div className="contingency-info">
          <Sliders size={18} className="icon-cyan" />
          <div>
            <strong>Margem de Contingência Operacional (Reserva Técnica de Saldo):</strong>
            <span>Adiciona margem sobre o gasto real para cobrir desvios de rota, tráfego pesado e PTO.</span>
          </div>
        </div>

        <div className="contingency-pills">
          {[0, 5, 8, 10, 15].map(pct => (
            <button
              key={pct}
              type="button"
              className={`pill-margin ${contingencyPct === pct ? 'active' : ''}`}
              onClick={() => setContingencyPct(pct)}
            >
              +{pct}% {pct === 8 ? '(Recomendado)' : ''}
            </button>
          ))}
        </div>
      </section>

      {/* Grid de KPIs Consolidados */}
      <section className="kpi-cards-grid">
        <div className="kpi-card highlight-card-blue">
          <div className="kpi-card-header">
            <span className="kpi-label">TOTAL SOLICITADO P/ APORTE (ABANK FROTA)</span>
            <Wallet size={20} className="kpi-icon-cyan" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-currency">R$</span>
            <span className="kpi-big-value">
              {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Gasto Real: R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="badge-plus">+{contingencyPct}% contingência</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">GASTO REALIZADO NO CICLO (R$)</span>
            <DollarSign size={20} className="kpi-icon-emerald" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-currency">R$</span>
            <span className="kpi-big-value">
              {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Preço Médio Pago: R$ {totals.precoMedioDiesel} / Litro</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">VEÍCULOS ABASTECIDOS</span>
            <Truck size={20} className="kpi-icon-emerald" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.totalVeiculos}</span>
            <span className="kpi-unit">caminhões</span>
          </div>
          <div className="kpi-subtext">
            <span>100% da frota ativa vinculada a contratos RJ</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">KM TOTAL RODADO NO PERÍODO</span>
            <Gauge size={20} className="kpi-icon-yellow" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.totalKm.toLocaleString('pt-BR')}</span>
            <span className="kpi-unit">km</span>
          </div>
          <div className="kpi-subtext">
            <span>Média da Frota: <strong>{totals.mediaFrotaKmL} km/l</strong></span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">COMBUSTÍVEL CONSUMIDO</span>
            <Droplets size={20} className="kpi-icon-purple" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">
              {totals.totalDiesel.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
            <span className="kpi-unit">L Diesel S10</span>
          </div>
          <div className="kpi-subtext">
            <span>+ {totals.totalArla.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} L ARLA 32 ({((totals.totalArla / totals.totalDiesel) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </section>

      {/* Tabela Interativa de Veículos Abastecidos */}
      <section className="vehicles-provision-table-section">
        <div className="table-controls-bar">
          <div className="table-title-group">
            <h3>Veículos Abastecidos na Semana (Ciclo Quarta 17h)</h3>
            <span className="table-count-pill">{filteredVehicles.length} veículos</span>
          </div>

          <div className="table-search-group">
            <div className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar placa, modelo, contrato..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-select-box">
              <Filter size={14} />
              <select
                value={operationFilter}
                onChange={e => setOperationFilter(e.target.value)}
              >
                {availableOperations.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="provision-table-wrapper">
          <table className="provision-table">
            <thead>
              <tr>
                <th>Placa & Prefixo</th>
                <th>Modelo & Implemento</th>
                <th>Operação / Cliente</th>
                <th>Dias Abastecidos</th>
                <th>KM Inicial</th>
                <th>KM Final</th>
                <th>KM Rodado</th>
                <th>Diesel S10</th>
                <th>ARLA 32</th>
                <th>Média km/l</th>
                <th>Gasto Realizado</th>
                <th className="th-aporte">Aporte Sugerido (R$)</th>
                <th className="th-action">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                const media = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-';
                return (
                  <tr key={v.placa} className="tr-vehicle-row">
                    <td>
                      <div className="plate-badge-row">
                        <strong>{v.placa}</strong>
                        <span className="prefix-badge">{v.prefixo}</span>
                      </div>
                      <small className="card-ref">{v.cartaoTipo} {v.cartaoNumero}</small>
                    </td>

                    <td>
                      <div className="model-cell-title">{v.modelo}</div>
                      <small className="model-cell-type">{v.tipo}</small>
                    </td>

                    <td>
                      <span className="op-tag-badge">{v.operacao}</span>
                    </td>

                    <td>
                      <div className="days-badge-container">
                        {v.diasAbastecimento.map(d => (
                          <span key={d} className="badge-day">{d}</span>
                        ))}
                      </div>
                    </td>

                    <td className="km-val">{v.kmInicial.toLocaleString('pt-BR')}</td>
                    <td className="km-val">{v.kmFinal.toLocaleString('pt-BR')}</td>
                    <td className="km-val bold-text">{v.kmRodado.toLocaleString('pt-BR')} km</td>

                    <td className="liters-val">{v.litrosDieselTotal} L</td>
                    <td className="liters-val arla-val">{v.litrosArlaTotal} L</td>

                    <td>
                      <span className="efficiency-badge">
                        {media} km/l
                      </span>
                    </td>

                    <td className="cost-val">
                      R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="td-aporte-val">
                      <strong>R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      <small>Saldo est.: R$ {(v.saldoCartaoAtual || 0).toFixed(2)}</small>
                    </td>

                    <td className="td-action-cell">
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={() => {
                          setSelectedVehicleForDetail(v);
                          setViewMode('vehicle_detail');
                        }}
                        title="Ver cupons, postos e notas fiscais deste caminhão (100% tela cheia, sem pop-up)"
                      >
                        Auditar Cupons
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tr-totals-footer">
                <td colSpan="6">
                  <strong>TOTAL GERAL DO CICLO (FECHAMENTO QUARTA-FEIRA 17:00H)</strong>
                </td>
                <td className="km-val">
                  <strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong>
                </td>
                <td className="liters-val">
                  <strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong>
                </td>
                <td className="liters-val arla-val">
                  <strong>{totals.totalArla.toLocaleString('pt-BR')} L</strong>
                </td>
                <td>
                  <strong>{totals.mediaFrotaKmL} km/l</strong>
                </td>
                <td className="cost-val">
                  <strong>R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="td-aporte-val">
                  <strong className="grand-total">
                    R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Guia Rápido de Procedimento Semanal */}
      <section className="weekly-procedure-footer">
        <div className="proc-col">
          <div className="proc-step-num">1</div>
          <div>
            <h4>Quarta-feira (até 17:00h)</h4>
            <p>O analista confere os cupons emitidos e o odômetro final da frota. Se houver abastecimento tardio, clica em "Lançar Cupom".</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">2</div>
          <div>
            <h4>Quinta-feira (08:00h da Manhã)</h4>
            <p>O analista clica em "Copiar Resumo p/ WhatsApp" ou "Visualizar Dossiê / Imprimir" e submete ao gestor para aprovação.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">3</div>
          <div>
            <h4>Liberação do Saldo (Abank Frota)</h4>
            <p>O financeiro processa a recarga corporativa no portal Abank. Os cartões de cada caminhão recebem o crédito antes das saídas de quinta-feira.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
