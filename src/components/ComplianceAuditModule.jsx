import React, { useState } from 'react';
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
  ExternalLink, 
  Flame, 
  Leaf, 
  Users, 
  Award, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  AUDITED_LICENSES, 
  AUDITED_CONTAINERS, 
  AUDITED_VEHICLES, 
  AUDITED_INFRACTIONS, 
  AUDITED_DRIVERS,
  AUDITED_KPI_SUMMARY 
} from '../data/auditedAmbiparData';

export default function ComplianceAuditModule() {
  const [activeTab, setActiveTab] = useState('licencas'); // 'licencas', 'cacambas', 'veiculos', 'multas', 'motoristas'
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros de busca para cada aba
  const filteredLicenses = AUDITED_LICENSES.filter(l => {
    const s = searchTerm.toLowerCase();
    return (
      l.orgao.toLowerCase().includes(s) ||
      l.documento.toLowerCase().includes(s) ||
      l.numero.toLowerCase().includes(s) ||
      l.titular.toLowerCase().includes(s) ||
      l.status.toLowerCase().includes(s)
    );
  });

  const filteredContainers = AUDITED_CONTAINERS.filter(c => {
    const s = searchTerm.toLowerCase();
    return (
      c.codigo.toLowerCase().includes(s) ||
      c.nome.toLowerCase().includes(s) ||
      c.base.toLowerCase().includes(s) ||
      c.status.toLowerCase().includes(s)
    );
  });

  const filteredVehicles = AUDITED_VEHICLES.filter(v => {
    const s = searchTerm.toLowerCase();
    return (
      v.placa.toLowerCase().includes(s) ||
      v.tipo.toLowerCase().includes(s) ||
      v.marca_modelo.toLowerCase().includes(s) ||
      v.operacao_base.toLowerCase().includes(s) ||
      v.status_crlv.toLowerCase().includes(s) ||
      v.status_civ.toLowerCase().includes(s)
    );
  });

  const filteredInfractions = AUDITED_INFRACTIONS.filter(m => {
    const s = searchTerm.toLowerCase();
    return (
      m.placa.toLowerCase().includes(s) ||
      m.ait.toLowerCase().includes(s) ||
      m.enquadramento.toLowerCase().includes(s) ||
      m.status_indicacao.toLowerCase().includes(s)
    );
  });

  const filteredDrivers = AUDITED_DRIVERS.filter(d => {
    const s = searchTerm.toLowerCase();
    return (
      d.nome.toLowerCase().includes(s) ||
      d.cpf.toLowerCase().includes(s) ||
      d.curso_mopp.toLowerCase().includes(s) ||
      d.status_mopp.toLowerCase().includes(s) ||
      d.status_cnh.toLowerCase().includes(s)
    );
  });

  const handleDownloadExcel = () => {
    // Alerta o usuário sobre a localização do arquivo oficial gerado no Desktop
    alert('O Relatório Oficial Completo em Excel está disponível no seu Desktop:\nRELATORIO_AUDITORIA_VENCIMENTOS_DOCUMENTOS_2026.xlsx\n\nContém 6 abas completas com todos os 665 documentos auditados.');
  };

  return (
    <div className="compliance-audit-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Top Banner de Apresentação */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <span className="live-dot" style={{ background: '#ef4444' }}></span>
            <span>AUDITORIA INTEGRAL DE VENCIMENTOS & CONFORMIDADE REGULATÓRIA • 2026</span>
          </div>
          <h2>Central Executiva de Vencimentos & Ativos</h2>
          <p>
            Painel consolidado a partir do rastreio de 665 documentos físicos e digitais: Unidade Duque de Caxias, Contrato Vale e Operação Amazon. Controle de licenças ambientais, caçambas, CRLV e multas.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary btn-icon-text"
          onClick={handleDownloadExcel}
          style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}
        >
          <FileSpreadsheet size={16} />
          <span>Planilha Oficial Excel (6 Abas)</span>
        </button>
      </div>

      {/* Cards de Resumo Geral da Auditoria */}
      <div className="kpi-metrics-grid" style={{ marginTop: '1.25rem' }}>
        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(15, 23, 42, 0.5) 100%)' }}>
          <div className="kpi-top">
            <span className="kpi-title" style={{ color: '#f87171' }}>Alertas Críticos Imediatos</span>
            <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ color: '#f87171' }}>3</span>
            <span className="unit-suffix">pendências</span>
          </div>
          <div className="kpi-formula-tag">
            <code>IBAMA 12 dias • Balança Toledo • RAW-1B54</code>
          </div>
          <div className="kpi-footer-status negative">
            <span>Ação prioritária da gestão CCO</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Licenças & Certificações</span>
            <div className="kpi-icon-wrap emerald">
              <Scale size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">9</span>
            <span className="unit-suffix">órgãos / laudos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>IBAMA, INEA, Bombeiros, Visa, ISO</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>5 regulares • 4 com atenção/urgência</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Caçambas & Caixas Estáticas</span>
            <div className="kpi-icon-wrap amber">
              <Box size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">83</span>
            <span className="unit-suffix">equipamentos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Vale Guaíba, Amazon e Base DCX</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Necessário laudo anual de olhais NR-11</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Multas & Prazos NIC</span>
            <div className="kpi-icon-wrap cyan">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">13</span>
            <span className="unit-suffix">AITs</span>
          </div>
          <div className="kpi-formula-tag">
            <code>R$ 1.956,48 total • R$ 1.565,18 c/ 20%</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Economia de R$ 391,30 indicando no prazo</span>
          </div>
        </div>
      </div>

      {/* Navegação por Abas Especializadas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('licencas')}
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
          <span>Licenças & Balança ({AUDITED_LICENSES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cacambas')}
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
          onClick={() => setActiveTab('veiculos')}
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
          <span>Veículos, CRLV & CIV ({AUDITED_VEHICLES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('multas')}
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
          <span>Multas & Prazos NIC ({AUDITED_INFRACTIONS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('motoristas')}
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
          <span>Quadro Motoristas MOPP ({AUDITED_DRIVERS.length})</span>
        </button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: '1', maxWidth: '400px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={`Filtrar na aba ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Auditado em: <strong>24/10/2026</strong> • Base DCX & Vale
        </span>
      </div>

      {/* Conteúdo da Aba 1: Licenças e Balança */}
      {activeTab === 'licencas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Licenças Ambientais, Autorizações e Calibrações</h3>
              <p>Controle do ciclo de validade IBAMA, INEA, Bombeiros, Vigilância Sanitária e Balança Rodoviária</p>
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
                  <th>Ação Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((lic, idx) => {
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
                      <td><small style={{ color: 'var(--text-muted)' }}>{lic.recomendacao}</small></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Caçambas e Caixas */}
      {activeTab === 'cacambas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Inventário de Caçambas e Caixas Estáticas (83 Unidades)</h3>
              <p>Equipamentos alocados em clientes (Vale Ilha de Guaíba, CPBS Itaguaí, Amazon) e Base DCX</p>
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
                  <th>Norma Aplicável</th>
                  <th>Laudo Olhais (NR-11)</th>
                  <th>Status de Conformidade</th>
                  <th>Recomendação Técnica</th>
                </tr>
              </thead>
              <tbody>
                {filteredContainers.map((c, idx) => (
                  <tr key={idx}>
                    <td><strong style={{ color: 'var(--accent-emerald)' }}>{c.codigo}</strong></td>
                    <td>{c.nome}</td>
                    <td><span className="badge-class inert">{c.tipo}</span></td>
                    <td><strong>{c.base}</strong></td>
                    <td>{c.aquisicao}</td>
                    <td>{c.idade}</td>
                    <td><small>{c.norma}</small></td>
                    <td><span style={{ fontSize: '0.8rem', color: '#f87171' }}>{c.laudo_olhais}</span></td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-amber)',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td><small style={{ color: 'var(--text-muted)' }}>{c.recomendacao}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Veículos, CRLV e CIV */}
      {activeTab === 'veiculos' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Controle de Licenciamento (CRLV) e Vistoria CIV/CIPP</h3>
              <p>21 Veículos homologados na frota DCX, Vale e contratos parceiros</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Prefixo</th>
                  <th>Tipo Carroceria</th>
                  <th>Operação / Base</th>
                  <th>Marca / Modelo</th>
                  <th>Exercício CRLV</th>
                  <th>Status Licenciamento</th>
                  <th>Inspeção CIV / CIPP</th>
                  <th>Status CIV</th>
                  <th>Status Operação</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v, idx) => {
                  const isCrlvExpired = v.status_crlv.includes('VENCIDO');
                  return (
                    <tr key={idx} style={{ background: isCrlvExpired ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                      <td><strong style={{ color: 'var(--accent-cyan)' }}>{v.placa}</strong></td>
                      <td><code>{v.prefixo}</code></td>
                      <td>{v.tipo}</td>
                      <td>{v.operacao_base}</td>
                      <td><small>{v.marca_modelo}</small></td>
                      <td><span className="date-tag">{v.exercicio_crlv}</span></td>
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
                      <td><small>{v.inspecao_civ}</small></td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: v.status_civ.includes('VÁLIDO') ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          {v.status_civ}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: v.status === 'Disponível' ? 'rgba(16, 185, 129, 0.15)' : (v.status === 'Em Viagem' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                          color: v.status === 'Disponível' ? 'var(--accent-emerald-light)' : (v.status === 'Em Viagem' ? 'var(--accent-cyan)' : '#f87171')
                        }}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Multas e Prazos NIC */}
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
                </tr>
              </thead>
              <tbody>
                {filteredInfractions.map((m, idx) => (
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
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {m.status_indicacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 5: Motoristas e MOPP */}
      {activeTab === 'motoristas' && (
        <div className="card-panel live-board-panel" style={{ marginTop: '1rem' }}>
          <div className="live-board-header">
            <div>
              <h3>Quadro Operacional de Motoristas e Certificações MOPP</h3>
              <p>Validade de CNH, curso regulamentar de produtos perigosos e toxicologia</p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome do Motorista</th>
                  <th>CPF</th>
                  <th>Função Operacional</th>
                  <th>Curso MOPP</th>
                  <th>Validade MOPP</th>
                  <th>Status MOPP</th>
                  <th>Categoria CNH</th>
                  <th>Status CNH</th>
                  <th>Recomendações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d, idx) => {
                  const isRegular = d.status_mopp === 'VÁLIDO' && d.status_cnh === 'REGULAR';
                  return (
                    <tr key={idx}>
                      <td><code>{d.id}</code></td>
                      <td><strong>{d.nome}</strong></td>
                      <td><small>{d.cpf}</small></td>
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
                        <span style={{ fontSize: '0.8rem', color: isRegular ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          {d.status_cnh}
                        </span>
                      </td>
                      <td><small style={{ color: 'var(--text-muted)' }}>{d.observacoes || 'Manter prontuário ativo'}</small></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
