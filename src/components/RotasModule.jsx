import React, { useState } from 'react';
import { 
  Route, 
  MapPin, 
  Plus, 
  Search, 
  Truck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Layers, 
  Building2, 
  Compass, 
  PlusCircle, 
  Calendar,
  Sparkles,
  ChevronRight,
  MoveDown,
  Navigation,
  ArrowLeft,
  Check,
  Fuel,
  ShieldCheck
} from 'lucide-react';
import { AUDITED_RJ_ROUTES, AUDITED_RJ_CLIENTS } from '../data/auditedClientsRoutesData';

export default function RotasModule({ user, onNavigateEscala }) {
  // Controle de Tela Cheia: 'list' (Catálogo Geral) | 'form' (Estúdio de Roteirização Tela Cheia)
  const [viewMode, setViewMode] = useState('list');

  const [routes, setRoutes] = useState(() => {
    try {
      localStorage.removeItem('ambipar_real_routes');
      const saved = localStorage.getItem('ambipar_user_routes_clean_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleLoadAuditedRoutes = () => {
    setRoutes(AUDITED_RJ_ROUTES);
    try {
      localStorage.setItem('ambipar_user_routes_clean_v1', JSON.stringify(AUDITED_RJ_ROUTES));
    } catch (e) {
      console.warn(e);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Filtro por polo ou nome
  const filteredRoutes = routes.filter(r => {
    const s = searchTerm.toLowerCase();
    return (
      r.nome.toLowerCase().includes(s) ||
      r.codigo.toLowerCase().includes(s) ||
      r.polo.toLowerCase().includes(s) ||
      r.tipo.toLowerCase().includes(s)
    );
  });

  // Novo formulário de rota com múltiplos endereços
  const [newRouteForm, setNewRouteForm] = useState({
    nome: '',
    polo: 'Contrato Jogue Limpo',
    tipo: 'Fracionada Urbana / Baú',
    distancia_km: '',
    tempo_estimado_horas: '',
    veiculo_padrao: 'Caminhão Baú 3/4',
    frequencia: 'Diária (Seg a Sáb)',
    pontos_parada: [
      {
        ordem: 1,
        tipo: 'Origem / Saída',
        nome_ponto: 'Base Ambipar Duque de Caxias',
        endereco: 'Rod. Washington Luís, km 114 - Duque de Caxias',
        acao: 'Saída da base e conferência de equipamentos'
      }
    ]
  });

  const handleAddStop = () => {
    setNewRouteForm(prev => ({
      ...prev,
      pontos_parada: [
        ...prev.pontos_parada,
        {
          ordem: prev.pontos_parada.length + 1,
          tipo: `${prev.pontos_parada.length}ª Coleta / Parada`,
          nome_ponto: '',
          endereco: '',
          acao: 'Coleta de resíduos no cliente'
        }
      ]
    }));
  };

  const handleRemoveStop = (idx) => {
    if (newRouteForm.pontos_parada.length <= 1) return;
    const updated = newRouteForm.pontos_parada.filter((_, i) => i !== idx).map((p, i) => ({
      ...p,
      ordem: i + 1,
      tipo: i === 0 ? 'Origem / Saída' : `${i}ª Coleta / Parada`
    }));
    setNewRouteForm(prev => ({ ...prev, pontos_parada: updated }));
  };

  const handleSaveRoute = (e) => {
    e.preventDefault();
    if (!newRouteForm.nome) {
      alert('Informe o nome da rota.');
      return;
    }

    const newRoute = {
      ...newRouteForm,
      id: `ROTA-CUSTOM-${Date.now()}`,
      codigo: `ROTA-RJ-${String(routes.length + 1).padStart(2, '0')}`,
      distancia_km: Number(newRouteForm.distancia_km) || 60,
      pedagios_previstos: 1
    };

    const updated = [newRoute, ...routes];
    setRoutes(updated);
    try {
      localStorage.setItem('ambipar_user_routes_clean_v1', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    setViewMode('list');
  };

  // =========================================================================
  // MODO 1: TELA INTEIRA DE CADASTRO DE ROTA (SEM POP-UP!)
  // =========================================================================
  if (viewMode === 'form') {
    return (
      <div className="rotas-form-fullscreen animate-fade-in" style={{ padding: '0.5rem 0' }}>
        {/* Top Header da Tela Cheia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => setViewMode('list')}
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Catálogo</span>
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 800, background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                ROTEIRIZAÇÃO Central de Gestão • CIRUCTOS MULTI-PARADAS
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Cadastrar Nova Rota com Múltiplos Endereços em Tela Cheia
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Defina o circuito logístico e vincule todos os clientes/paradas que o veículo visitará em sequência no mesmo dia.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={handleSaveRoute}
              style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>Salvar & Homologar Rota</span>
            </button>
          </div>
        </div>

        {/* Layout Dividido em Duas Colunas Amplas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(450px, 1.4fr)', gap: '1.5rem' }}>
          {/* Coluna 1: Dados Gerais da Rota */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-panel" style={{ background: '#0e1524' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Route size={18} />
                <span>1. Dados do Corredor Logístico</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Nome da Rota:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ROTA-RJ-04 - Circuito Jogue Limpo Zona Sul & Niterói"
                    value={newRouteForm.nome}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, nome: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Contrato / Polo Operacional:
                    </label>
                    <select
                      value={newRouteForm.polo}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, polo: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                    >
                      <option value="Contrato Jogue Limpo">Contrato Jogue Limpo (Óleo Usado)</option>
                      <option value="Contrato Vale S.A.">Contrato Vale S.A. (Costa Verde)</option>
                      <option value="Contrato Amazon">Contrato Amazon (Centros GIG)</option>
                      <option value="Operações Spot RJ">Operações Spot / Indústrias RJ</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Perfil do Veículo Homologado:
                    </label>
                    <select
                      value={newRouteForm.veiculo_padrao}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, veiculo_padrao: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                    >
                      <option value="Caminhão Poli Duplo (26.280 CRM)">Caminhão Poli Duplo (26.280 CRM)</option>
                      <option value="Caminhão Baú 3/4 (VW Delivery 9.170)">Caminhão Baú 3/4 (VW Delivery 9.170)</option>
                      <option value="Cavalo Mecânico + Carreta Graneleira">Cavalo Mecânico + Carreta Graneleira</option>
                      <option value="Caminhão Compactador 15m³">Caminhão Compactador 15m³</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Distância Total Estimada (KM):
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 110"
                      value={newRouteForm.distancia_km}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, distancia_km: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      Tempo Estimado de Viagem:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5h30"
                      value={newRouteForm.tempo_estimado_horas}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, tempo_estimado_horas: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Painel Informativo de Diretrizes */}
            <div className="card-panel" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Normas Operacionais Central de Gestão RJ</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Todas as rotas iniciam e encerram na <strong>Base Ambipar DCX (Rod. Washington Luís, km 114)</strong>.</li>
                <li>Clientes em corredores da Zona Sul exigem atenção aos horários de restrição de circulação pesada.</li>
                <li>Para transporte de produtos perigosos / óleo usado, o condutor obrigatoriamente deve possuir MOPP homologado.</li>
              </ul>
            </div>
          </div>

          {/* Coluna 2: Sequenciador Visual de Múltiplos Endereços e Paradas */}
          <div className="card-panel" style={{ background: '#0e1524' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} />
                  <span>2. Sequência de Múltiplos Endereços ({newRouteForm.pontos_parada.length} paradas no dia)</span>
                </h3>
                <small style={{ color: 'var(--text-muted)' }}>O motorista seguirá rigorosamente esta ordem de paradas e coletas</small>
              </div>

              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={handleAddStop}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              >
                <Plus size={15} />
                <span>Adicionar Nova Parada</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {newRouteForm.pontos_parada.map((pt, pIdx) => (
                <div 
                  key={pIdx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        background: pIdx === 0 ? 'var(--accent-cyan)' : 'var(--accent-amber)', 
                        color: '#070b12', 
                        fontWeight: 800, 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px' 
                      }}>
                        #{pt.ordem}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                        {pt.tipo}
                      </strong>
                    </div>

                    {pIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(pIdx)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={13} />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        Nome do Ponto / Cliente:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Inter Japan Botafogo"
                        value={pt.nome_ponto}
                        onChange={(e) => {
                          const updated = [...newRouteForm.pontos_parada];
                          updated[pIdx].nome_ponto = e.target.value;
                          setNewRouteForm({ ...newRouteForm, pontos_parada: updated });
                        }}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        Endereço Completo:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Rua Real Grandeza, 280 - Botafogo, Rio de Janeiro/RJ"
                        value={pt.endereco}
                        onChange={(e) => {
                          const updated = [...newRouteForm.pontos_parada];
                          updated[pIdx].endereco = e.target.value;
                          setNewRouteForm({ ...newRouteForm, pontos_parada: updated });
                        }}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Ação Operacional a ser Executada no Ponto:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Coleta de bombonas de óleo lubrificante usado (OLUC) e conferência de MTR"
                      value={pt.acao || ''}
                      onChange={(e) => {
                        const updated = [...newRouteForm.pontos_parada];
                        updated[pIdx].acao = e.target.value;
                        setNewRouteForm({ ...newRouteForm, pontos_parada: updated });
                      }}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', background: '#070b12', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', color: 'var(--accent-emerald)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO 2: CATÁLOGO GERAL DE ROTAS EM TELA INTEIRA
  // =========================================================================
  return (
    <div className="rotas-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Banner Superior */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' }}>
            <span className="live-dot" style={{ background: 'var(--accent-cyan)' }}></span>
            <span>CENTRAL DE ROTAS & ROTEIRIZAÇÃO INTELIGENTE RJ • Central de Gestão AMBIPAR</span>
          </div>
          <h2>Corredores Logísticos & Circuitos Multi-Endereços</h2>
          <p>
            Roteirização dedicada para atendimento diário em múltiplos clientes no mesmo circuito: Contrato Vale (Costa Verde), Amazon Express (Dutra) e Malha Jogue Limpo (Grande Rio).
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary btn-icon-text"
          onClick={() => setViewMode('form')}
          style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Nova Rota Multi-Endereços</span>
        </button>
      </div>

      {/* Barra de Filtro e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: '1', maxWidth: '420px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar rota por nome, polo, código ou tipo de carga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong>{filteredRoutes.length}</strong> rotas homologadas cadastradas no Rio de Janeiro
        </span>
      </div>

      {/* Grid de Cards das Rotas com Múltiplas Paradas ou Estado Limpo */}
      {filteredRoutes.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px dashed rgba(255, 255, 255, 0.12)', borderRadius: '12px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Route size={32} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Nenhuma Rota Cadastrada no Sistema
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
            O catálogo de rotas e circuitos está 100% limpo. Você pode criar novas rotas personalizadas com múltiplos endereços e paradas, ou carregar os modelos de corredores homologados do RJ.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary btn-icon-text"
              onClick={() => setViewMode('form')}
              style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700, padding: '0.75rem 1.6rem', fontSize: '0.9rem' }}
            >
              <Plus size={18} />
              <span>+ Criar Nova Rota Multi-Endereços</span>
            </button>
            <button
              type="button"
              className="btn-secondary btn-icon-text"
              onClick={handleLoadAuditedRoutes}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.88rem' }}
            >
              <Sparkles size={16} />
              <span>Carregar Modelos Homologados RJ</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
          {filteredRoutes.map((route) => (
          <div 
            key={route.id} 
            className="card-panel"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 15, 29, 0.85) 100%)',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <div>
              {/* Header do Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                <div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    color: 'var(--accent-cyan)', 
                    background: 'rgba(6, 182, 212, 0.12)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    display: 'inline-block',
                    marginBottom: '0.4rem'
                  }}>
                    {route.codigo} • {route.polo}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {route.nome}
                  </h3>
                </div>
              </div>

              {/* Informações Operacionais da Rota */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(7, 11, 18, 0.5)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Distância Total</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)' }}>{route.distancia_km} km</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Tempo Estimado</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>{route.tempo_estimado_horas}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Paradas no Dia</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--accent-amber)' }}>{route.pontos_parada?.length || 0} locais</strong>
                </div>
              </div>

              {/* Linha do Tempo de Múltiplos Endereços na Rota */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                  Itinerário de Paradas e Clientes no RJ:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {route.pontos_parada && route.pontos_parada.map((pt, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.6rem',
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${pIdx === 0 ? 'var(--accent-cyan)' : pIdx === route.pontos_parada.length - 1 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`
                      }}
                    >
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: 'var(--text-muted)',
                        minWidth: '18px',
                        marginTop: '2px'
                      }}>
                        #{pt.ordem}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                            {pt.nome_ponto}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            {pt.tipo}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                          {pt.endereco}
                        </span>
                        {pt.acao && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', display: 'block', marginTop: '2px', fontStyle: 'italic' }}>
                            ⚡ {pt.acao}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações do Card */}
            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-primary btn-icon-text"
                style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem', justifyContent: 'center' }}
                onClick={() => {
                  if (onNavigateEscala) {
                    onNavigateEscala();
                  }
                }}
              >
                <Calendar size={14} />
                <span>Escalar Veículo Nesta Rota</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
