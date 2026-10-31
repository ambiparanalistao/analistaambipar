import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Plus, Trash2, X, RotateCcw, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

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

  // Fecha com a tecla ESC e previne scroll de fundo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciar Tipos de Implemento & Carroceria"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1.25rem',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0e1726 0%, #080f1a 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.2)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div
          style={{
            padding: '1.25rem 1.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#ffffff' }}>
                Categorias de Implemento & Carroceria
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Adicione as categorias reais da sua frota ou remova as que não utiliza.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#cbd5e1',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Fechar (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div
          style={{
            padding: '1.4rem 1.6rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
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
              padding: '1.15rem'
            }}
          >
            <h4
              style={{
                margin: '0 0 0.8rem 0',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> Adicionar Nova Categoria de Implemento
            </h4>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
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
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    color: '#94a3b8',
                    marginBottom: '4px',
                    fontWeight: 600
                  }}
                >
                  Descrição / Finalidade Operacional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abastecimento de água industrial, sucção de efluentes e resíduos..."
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(8, 14, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Plus size={16} /> Adicionar ao Catálogo
                </button>
              </div>
            </form>
          </div>

          {/* Área 2: Lista de Categorias Ativas com Busca e Exclusão */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Categorias Ativas ({vehicleTypes.length})
              </span>

              {vehicleTypes.length > 4 && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Filtrar categorias..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      padding: '5px 10px 5px 26px',
                      fontSize: '0.76rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      width: '170px'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {displayedTypes.map((t) => {
                const inUseCount = vehicles.filter((v) => v.tipo === t.value).length;
                return (
                  <div
                    key={t.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 13px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                          {t.label || t.value}
                        </strong>
                        {inUseCount > 0 ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px',
                              background: 'rgba(16, 185, 129, 0.18)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            {inUseCount} veículo{inUseCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              color: '#64748b',
                              padding: '2px 6px'
                            }}
                          >
                            Sem veículos vinculados
                          </span>
                        )}
                      </div>
                      {t.sublabel && (
                        <p
                          style={{
                            margin: '3px 0 0',
                            fontSize: '0.76rem',
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
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
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
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.84rem' }}>
                  Nenhuma categoria encontrada para "{searchFilter}".
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div
          style={{
            padding: '1.1rem 1.6rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={handleRestore}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.78rem',
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
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '9px 24px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
