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
        borderRadius: '10px',
        background: overdueCount > 0 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: overdueCount > 0 ? '1px solid #f87171' : '1px solid #fbbf24',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        color: '#1e293b',
        padding: '12px 16px',
        position: 'relative',
        zIndex: 50
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
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
                <span style={{ fontSize: '0.8rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  +{warningCount} próximas de 1.500 km
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>
              Monitore a troca de óleo, filtros, freios e demais itens periódicos programados para garantir a disponibilidade da frota.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#334155'
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
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {criticalOrWarningItems.map(item => {
              const diff = item.proxima_km != null ? Number(item.proxima_km) - Number(item.km_atual || 0) : null;
              const isOverdue = item.estado === 'vencida' || (diff != null && diff <= 0);
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${isOverdue ? '#ef4444' : '#f59e0b'}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{item.placa}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isOverdue ? '#fef2f2' : '#fffbeb',
                        color: isOverdue ? '#b91c1c' : '#b45309'
                      }}
                    >
                      {isOverdue ? 'Vencida' : 'Próxima (≤ 1.500 km)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                    {item.nome}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>KM atual: {Number(item.km_atual || 0).toLocaleString('pt-BR')}</span>
                    <strong style={{ color: isOverdue ? '#ef4444' : '#d97706' }}>
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
