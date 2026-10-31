import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function VehicleTypesManagerModal({
  isOpen,
  onClose,
  vehicleTypes = [],
  onSaveCategories,
  vehicles = [],
  defaultTypes = []
}) {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newTypeName.trim();
    if (!name) return;

    if (
      vehicleTypes.some(
        (t) =>
          t.value.toLowerCase() === name.toLowerCase() ||
          t.label.toLowerCase() === name.toLowerCase()
      )
    ) {
      setFeedback({ type: 'error', text: 'Esta categoria já existe no catálogo.' });
      return;
    }

    const newCategory = {
      value: name,
      label: name,
      sublabel: newTypeDesc.trim() || 'Implemento personalizado da frota'
    };

    const updated = [...vehicleTypes, newCategory];
    onSaveCategories(updated);
    setNewTypeName('');
    setNewTypeDesc('');
    setFeedback({ type: 'success', text: `Categoria "${name}" adicionada com sucesso!` });
  };

  const handleRemove = (catValue) => {
    const inUseVehicles = vehicles.filter((v) => v.tipo === catValue);
    if (inUseVehicles.length > 0) {
      const confirmMsg = `Atenção: Existem ${inUseVehicles.length} veículo(s) cadastrado(s) com a categoria "${catValue}". Deseja realmente remover essa opção do catálogo? Os veículos já existentes manterão seus dados.`;
      if (!window.confirm(confirmMsg)) return;
    }

    const updated = vehicleTypes.filter((t) => t.value !== catValue);
    onSaveCategories(updated);
    setFeedback({ type: 'success', text: `Categoria removida do catálogo.` });
  };

  const handleRestore = () => {
    if (
      window.confirm(
        'Deseja restaurar a lista padrão de categorias de implemento da Ambipar? Suas categorias personalizadas serão substituídas pelas padrões.'
      )
    ) {
      onSaveCategories(defaultTypes);
      setFeedback({ type: 'success', text: 'Categorias restauradas para os padrões originais.' });
    }
  };

  const displayedTypes = vehicleTypes.filter((t) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      t.label.toLowerCase().includes(term) ||
      t.value.toLowerCase().includes(term) ||
      (t.sublabel && t.sublabel.toLowerCase().includes(term))
    );
  });

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <div
        className="card-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(13, 21, 35, 0.95) 0%, rgba(8, 14, 24, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(16, 185, 129, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header do Modal */}
        <div
          style={{
            padding: '1.4rem 1.8rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Gerenciar Tipos de Implemento & Carroceria
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Adicione categorias reais da sua operação ou remova as que não utiliza.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#cbd5e1',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div style={{ padding: '1.5rem 1.8rem', overflowY: 'auto', flex: 1 }}>
          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '1.2rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background:
                  feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${
                  feedback.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'
                }`,
                color: feedback.type === 'error' ? '#fca5a5' : '#34d399'
              }}
            >
              {feedback.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Área 1: Formulário para Adicionar Nova Categoria */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '14px',
              padding: '1.2rem',
              marginBottom: '1.5rem'
            }}
          >
            <h4
              style={{
                margin: '0 0 0.8rem 0',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> Adicionar Nova Categoria de Implemento
            </h4>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    marginBottom: '4px',
                    fontWeight: 600
                  }}
                >
                  Nome do Implemento / Carroceria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caminhão Pipa, Carreta Prancha, Caçamba Basculante, Roll-on Roll-off, Vácuo..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(8, 14, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    marginBottom: '4px',
                    fontWeight: 600
                  }}
                >
                  Descrição / Finalidade Operacional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abastecimento de água industrial, sucção de resíduos líquidos, etc."
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(8, 14, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Adicionar ao Catálogo
                </button>
              </div>
            </form>
          </div>

          {/* Área 2: Lista de Categorias com Filtro e Exclusão */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.8rem',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Categorias no Catálogo ({vehicleTypes.length})
              </span>

              {vehicleTypes.length > 5 && (
                <input
                  type="text"
                  placeholder="Filtrar categorias..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    width: '160px'
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {displayedTypes.map((t) => {
                const inUseCount = vehicles.filter((v) => v.tipo === t.value).length;
                return (
                  <div
                    key={t.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                          {t.label || t.value}
                        </strong>
                        {inUseCount > 0 ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {inUseCount} veículo{inUseCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: '#64748b',
                              padding: '2px 6px'
                            }}
                          >
                            Disponível para uso
                          </span>
                        )}
                      </div>
                      {t.sublabel && (
                        <p
                          style={{
                            margin: '3px 0 0',
                            fontSize: '0.78rem',
                            color: '#94a3b8',
                            lineHeight: 1.35
                          }}
                        >
                          {t.sublabel}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(t.value)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title={`Remover categoria "${t.label || t.value}"`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              {displayedTypes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                  Nenhuma categoria encontrada para "{searchFilter}".
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div
          style={{
            padding: '1.2rem 1.8rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            onClick={handleRestore}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Voltar às categorias originais da Ambipar"
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{
              padding: '9px 22px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 700
            }}
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
