import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ArrowRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import useMaintenancePlans from '../../../hooks/useMaintenancePlans';

export default function PreventiveBanner({ companyId, onNavigate }) {
  const alerts = useMaintenancePlans(companyId, 'alerts');
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // When companyId changes, reset dismissal
  useEffect(() => {
    setDismissed(false);
    setExpanded(false);
  }, [companyId]);

  if (dismissed || !companyId || alerts.loading || !alerts.data?.rows) {
    return null;
  }

  const allRows = alerts.data.rows || [];

  // Filter items that are either:
  // 1. vencida (overdue)
  // 2. breve (within alert threshold, default <= 1500 km or <= 7 days)
  // 3. remaining km <= 1500 km
  const criticalOrWarningItems = allRows.filter(a => {
    if (a.estado === 'vencida' || a.estado === 'breve') return true;
    if (a.proxima_km != null && a.km_atual != null) {
      const remaining = Number(a.proxima_km) - Number(a.km_atual);
      return remaining <= 1500;
    }
    return false;
  });

  if (!criticalOrWarningItems.length) {
    return null;
  }

  const overdueCount = criticalOrWarningItems.filter(a => a.estado === 'vencida').length;
  const warningCount = criticalOrWarningItems.length - overdueCount;

  return (
    <div
      className="preventive-screen-banner animate-fade-in"
      style={{
        margin: '12px 0 16px 0',
        borderRadius: '12px',
        background: overdueCount > 0 ? 'color-mix(in srgb, #ef4444 14%, var(--mp-panel, #122018))' : 'color-mix(in srgb, #f59e0b 14%, var(--mp-panel, #122018))',
        border: overdueCount > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(245, 158, 11, 0.45)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        color: 'var(--mp-text, #e9f4ec)',
        padding: '14px 18px',
        position: 'relative',
        zIndex: 50
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              background: overdueCount > 0 ? '#ef4444' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            {overdueCount > 0 ? <AlertTriangle size={20} /> : <Bell size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {overdueCount > 0
                  ? `Aviso Urgente: ${overdueCount} manutenção(ões) preventiva(s) vencida(s)!`
                  : `Atenção: ${criticalOrWarningItems.length} manutenção(ões) preventiva(s) a menos de 1.500 km do vencimento!`}
              </span>
              {warningCount > 0 && overdueCount > 0 && (
                <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                  +{warningCount} próximas de 1.500 km
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--mp-muted, #a0b8a8)' }}>
              Monitore a troca de óleo, filtros, freios e demais itens periódicos programados para garantir a disponibilidade da frota.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'var(--mp-input, #09130d)',
              border: '1px solid var(--mp-border, #2c4434)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--mp-text, #e9f4ec)'
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Ocultar detalhes' : `Ver veículos (${criticalOrWarningItems.length})`}
          </button>

          <a
            href="/manutencao/planos-preventivos"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/manutencao/planos-preventivos');
              }
            }}
            style={{
              background: overdueCount > 0 ? '#dc2626' : '#d97706',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Abrir Preventivas <ArrowRight size={14} />
          </a>

          <button
            type="button"
            title="Fechar aviso temporariamente"
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--mp-border, rgba(255,255,255,0.12))' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {criticalOrWarningItems.map(item => {
              const diff = item.proxima_km != null ? Number(item.proxima_km) - Number(item.km_atual || 0) : null;
              const isOverdue = item.estado === 'vencida' || (diff != null && diff <= 0);
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--mp-panel, #122018)',
                    border: '1px solid var(--mp-border, #2c4434)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${isOverdue ? '#ef4444' : '#f59e0b'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--mp-text, #e9f4ec)' }}>{item.placa}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: isOverdue ? '#fca5a5' : '#fcd34d'
                      }}
                    >
                      {isOverdue ? 'Vencida' : 'Próxima (≤ 1.500 km)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--mp-text, #e9f4ec)', fontWeight: 600 }}>
                    {item.nome}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--mp-muted, #a0b8a8)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>KM atual: {Number(item.km_atual || 0).toLocaleString('pt-BR')}</span>
                    <strong style={{ color: isOverdue ? '#ef4444' : '#f59e0b' }}>
                      {diff != null ? (diff <= 0 ? `${Math.abs(diff).toLocaleString('pt-BR')} km em atraso` : `restam ${diff.toLocaleString('pt-BR')} km`) : '—'}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
