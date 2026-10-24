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
  Navigation
} from 'lucide-react';
import { AUDITED_RJ_ROUTES, AUDITED_RJ_CLIENTS } from '../data/auditedClientsRoutesData';

export default function RotasModule({ user, onNavigateEscala }) {
  const [routes, setRoutes] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_routes');
      return saved ? JSON.parse(saved) : AUDITED_RJ_ROUTES;
    } catch {
      return AUDITED_RJ_ROUTES;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      localStorage.setItem('ambipar_real_routes', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    setShowCreateModal(false);
  };

  return (
    <div className="rotas-module animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Banner Superior */}
      <div className="control-tower-banner" style={{ background: 'linear-gradient(135deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
        <div className="tower-header-text">
          <div className="tower-badge-live" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' }}>
            <span className="live-dot" style={{ background: 'var(--accent-cyan)' }}></span>
            <span>CENTRAL DE ROTAS & ROTEIRIZAÇÃO INTELIGENTE RJ • CCO AMBIPAR</span>
          </div>
          <h2>Corredores Logísticos & Circuitos Multi-Endereços</h2>
          <p>
            Roteirização dedicada para atendimento diário em múltiplos clientes no mesmo circuito: Contrato Vale (Costa Verde), Amazon Express (Dutra) e Malha Jogue Limpo (Grande Rio).
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary btn-icon-text"
          onClick={() => setShowCreateModal(true)}
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

      {/* Grid de Cards das Rotas com Múltiplas Paradas */}
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
                  Sequência de Paradas e Clientes no Dia:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {route.pontos_parada?.map((pt, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        background: pIdx === 0 ? 'rgba(16, 185, 129, 0.06)' : (pIdx === route.pontos_parada.length - 1 ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255, 255, 255, 0.03)'),
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: pIdx === 0 ? 'var(--accent-emerald)' : (pIdx === route.pontos_parada.length - 1 ? 'var(--accent-cyan)' : 'var(--accent-amber)'),
                        color: '#070b12',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {pt.ordem}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.78rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pt.nome_ponto}
                          </strong>
                        </div>
                        <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pt.endereco}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações do Card */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem', display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {route.veiculo_padrao}
              </span>

              <button
                type="button"
                className="btn-primary btn-icon-text"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                onClick={() => onNavigateEscala && onNavigateEscala(route)}
                title="Criar escala operacional para esta rota"
              >
                <Calendar size={14} />
                <span>Escalar Veículo & Motorista</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação de Rota com Múltiplos Endereços */}
      {showCreateModal && (
        <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-container" style={{ background: '#0e1524', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '14px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Cadastrar Nova Rota com Múltiplos Endereços
                </h3>
                <small style={{ color: 'var(--text-muted)' }}>Defina o circuito e adicione todos os clientes/paradas que o veículo visitará no mesmo dia</small>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoute}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Nome da Rota
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rota Jogue Limpo - Centro & Niterói"
                    value={newRouteForm.nome}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, nome: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Contrato / Polo
                  </label>
                  <select
                    value={newRouteForm.polo}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, polo: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="Contrato Jogue Limpo">Contrato Jogue Limpo</option>
                    <option value="Contrato Vale S.A.">Contrato Vale S.A.</option>
                    <option value="Contrato Amazon">Contrato Amazon</option>
                    <option value="Operações Spot RJ">Operações Spot RJ</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Distância Estimada (KM)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 85"
                    value={newRouteForm.distancia_km}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, distancia_km: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Tempo Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5h30"
                    value={newRouteForm.tempo_estimado_horas}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, tempo_estimado_horas: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Seção Dinâmica de Múltiplos Endereços / Paradas */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    Sequência de Paradas / Clientes na Rota ({newRouteForm.pontos_parada.length})
                  </label>
                  <button
                    type="button"
                    className="btn-secondary btn-icon-text"
                    onClick={handleAddStop}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Plus size={14} />
                    <span>Adicionar Endereço / Parada</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {newRouteForm.pontos_parada.map((pt, pIdx) => (
                    <div 
                      key={pIdx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                          Parada #{pt.ordem}: {pt.tipo}
                        </span>
                        {pIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(pIdx)}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          required
                          placeholder="Nome do Ponto / Cliente (Ex: Inter Japan)"
                          value={pt.nome_ponto}
                          onChange={(e) => {
                            const updated = [...newRouteForm.pontos_parada];
                            updated[pIdx].nome_ponto = e.target.value;
                            setNewRouteForm({ ...newRouteForm, pontos_parada: updated });
                          }}
                          style={{ padding: '0.45rem 0.65rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          required
                          placeholder="Endereço Completo (Rua, Bairro, Cidade)"
                          value={pt.endereco}
                          onChange={(e) => {
                            const updated = [...newRouteForm.pontos_parada];
                            updated[pIdx].endereco = e.target.value;
                            setNewRouteForm({ ...newRouteForm, pontos_parada: updated });
                          }}
                          style={{ padding: '0.45rem 0.65rem', background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: '#070b12', fontWeight: 700 }}
                >
                  Salvar Rota Homologada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
