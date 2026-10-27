import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AmbiparConfirmDialog({
  isOpen,
  title = 'Confirmação',
  message,
  subtitle,
  itemBadge,
  itemLabel = 'Identificador',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  icon: CustomIcon,
  loading = false,
  onConfirm,
  onCancel
}) {
  // Fecha com a tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const IconComponent = CustomIcon || (isDanger ? Trash2 : AlertTriangle);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(2, 8, 5, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(145deg, #0e1e15 0%, #07120b 100%)',
          border: isDanger ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '24px 26px',
          boxShadow: isDanger
            ? '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.15)'
            : '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.15)',
          color: '#e2e8f0',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* Botão de Fechar no Canto Superior */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Fechar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X size={16} />
        </button>

        {/* Header com Ícone Destacado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
              color: isDanger ? '#f87171' : '#34d399',
              boxShadow: isDanger ? '0 0 20px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(16, 185, 129, 0.2)'
            }}
          >
            <IconComponent size={22} />
          </div>

          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: isDanger ? '#f87171' : '#34d399',
                display: 'block',
                marginBottom: '2px'
              }}
            >
              {isDanger ? 'Ação Irreversível' : 'Confirmação do Sistema'}
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.25
              }}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Badge do Item em Evidência (Placa, Código, etc.) */}
        {itemBadge && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '16px 0',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(44, 68, 52, 0.8)',
              borderRadius: '10px',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              {itemLabel}:
            </span>
            <span
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '2px',
                color: '#10b981',
                fontFamily: 'monospace',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              {itemBadge}
            </span>
          </div>
        )}

        {/* Mensagem Principal */}
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            color: '#cbd5e1'
          }}
        >
          {message}
        </p>

        {/* Subtítulo / Alerta Secundário */}
        {subtitle && (
          <div
            style={{
              padding: '10px 12px',
              background: isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: isDanger ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              lineHeight: 1.45,
              color: isDanger ? '#fca5a5' : '#a7f3d0',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{subtitle}</span>
          </div>
        )}

        {/* Rodapé de Ações */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '22px'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: '0.86rem',
              fontWeight: 600,
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 18px',
              fontSize: '0.86rem',
              fontWeight: 700,
              borderRadius: '8px',
              background: isDanger
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: isDanger
                ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.75 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = isDanger
                  ? '0 6px 18px rgba(239, 68, 68, 0.55)'
                  : '0 6px 18px rgba(16, 185, 129, 0.55)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDanger
                ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                : '0 4px 14px rgba(16, 185, 129, 0.4)';
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <IconComponent size={15} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
