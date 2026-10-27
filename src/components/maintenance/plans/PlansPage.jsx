import React, { useState, useEffect } from 'react';
import useMaintenancePlans from '../../../hooks/useMaintenancePlans';
import { planCommand } from '../../../services/maintenancePlans';
import PlanForm from './PlanForm';
import PreventiveAlerts from './PreventiveAlerts';
import { Settings, Save, Check, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import './Plans.css';

function AlertSettings({ company, settings, onSaved }) {
  const [dias, setDias] = useState(settings.antecedencia_alerta_dias || 7);
  const [km, setKm] = useState(settings.antecedencia_alerta_km || 1500);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await planCommand(company, 'settings', { dias, km, version: settings.version });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mp-card pp-settings" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Settings size={18} style={{ color: 'var(--mp-accent, #b6ff3b)' }} />
        <h3 style={{ margin: 0 }}>Antecedência Geral dos Alertas na Tela</h3>
      </div>
      <p className="mp-muted">
        O sistema emite alertas na tela quando faltar a quantidade de KM ou dias configurados aqui. O padrão atual é avisar com <strong>1.500 km</strong> de antecedência.
      </p>
      {error && <p role="alert" className="mp-error">{error}</p>}
      <div className="mp-grid">
        <label className="mp-field">
          Dias de antecedência
          <input
            aria-label="Dias"
            type="number"
            min="0"
            max="365"
            required
            value={dias}
            onChange={e => setDias(e.target.value)}
          />
        </label>
        <label className="mp-field">
          KM de antecedência (Aviso na tela)
          <input
            aria-label="KM"
            type="number"
            min="0"
            max="1000000"
            required
            value={km}
            onChange={e => setKm(e.target.value)}
          />
        </label>
      </div>
      <button disabled={busy} className="mp-button">
        {busy ? 'Salvando…' : 'Salvar antecedência (1.500 km)'}
      </button>
    </form>
  );
}

function QuickKmEditor({ plan, companyId, canWrite, onUpdated }) {
  const [kmValue, setKmValue] = useState(plan.intervalo_km || 10000);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Keep local input in sync if plan changes
  useEffect(() => {
    setKmValue(plan.intervalo_km || 10000);
  }, [plan.intervalo_km]);

  async function handleSaveKm(e) {
    e.preventDefault();
    if (!canWrite) return;
    const num = Number(kmValue);
    if (!num || num <= 0) {
      setError('Informe um KM válido maior que zero.');
      return;
    }
    setSaving(true);
    setError('');
    setSavedSuccess(false);
    try {
      await planCommand(companyId, 'save', {
        id: plan.id,
        nome: plan.nome,
        categoria_veiculo: plan.categoria_veiculo || 'TODOS',
        intervalo_km: num,
        intervalo_dias: plan.intervalo_dias,
        ativo: plan.ativo,
        version: plan.version
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onUpdated();
    } catch (err) {
      setError(err.message || 'Falha ao salvar KM.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 16px',
        background: 'var(--mp-panel, #122018)',
        border: '1px solid var(--mp-border, #2c4434)',
        borderRadius: '10px',
        marginBottom: '10px',
        transition: 'border-color 0.2s ease'
      }}
    >
      <div style={{ flex: '1 1 240px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--mp-text, #e9f4ec)' }}>
          {plan.nome}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--mp-muted, #a0b8a8)', marginTop: '2px' }}>
          {plan.vehicle_id ? 'Veículo específico' : (!plan.categoria_veiculo || plan.categoria_veiculo === 'TODOS' ? 'Toda a Frota (Geral)' : `Categoria: ${plan.categoria_veiculo}`)}
          {plan.intervalo_dias ? ` · ou a cada ${plan.intervalo_dias} dias` : ''}
        </div>
        {error && <span style={{ color: 'var(--mp-error, #ffabb3)', fontSize: '0.78rem' }}>{error}</span>}
      </div>

      <form onSubmit={handleSaveKm} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--mp-muted, #a0b8a8)', fontWeight: 600 }}>
            KM Programado:
          </label>
          <input
            type="number"
            min="100"
            max="1000000"
            step="500"
            disabled={!canWrite || saving}
            value={kmValue}
            onChange={e => setKmValue(e.target.value)}
            style={{
              width: '115px',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--mp-border, #2c4434)',
              background: 'var(--mp-input, #09130d)',
              color: 'var(--mp-text, #e9f4ec)',
              fontWeight: 700,
              fontSize: '0.95rem',
              textAlign: 'right'
            }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--mp-muted, #a0b8a8)', fontWeight: 600 }}>km</span>
        </div>

        {canWrite && (
          <button
            type="submit"
            disabled={saving || Number(kmValue) === Number(plan.intervalo_km)}
            className="mp-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: savedSuccess ? '#10b981' : undefined,
              borderColor: savedSuccess ? '#10b981' : undefined,
              color: savedSuccess ? '#ffffff' : undefined,
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            {savedSuccess ? <Check size={14} /> : saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {savedSuccess ? 'Salvo!' : saving ? 'Salvando…' : 'Atualizar KM'}
          </button>
        )}
      </form>
    </div>
  );
}

export default function PlansPage({ access, setLocked }) {
  const context = useMaintenancePlans(access.companyId, 'context');
  const alerts = useMaintenancePlans(access.companyId);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => () => setLocked(false), [setLocked]);

  function edit(plan) {
    setEditing(plan);
    setError('');
    setLocked(!!plan);
  }

  async function save(form) {
    setBusy(true);
    setError('');
    try {
      await planCommand(access.companyId, 'save', form);
      edit(null);
      setNotice('Plano preventivo salvo e sincronizado com toda a frota!');
      context.reload();
      alerts.reload();
      setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (context.loading && !context.data) {
    return <p role="status">Carregando planos preventivos…</p>;
  }

  if (context.error) {
    return (
      <div role="alert">
        {context.error}
        <button onClick={context.reload}>Tentar novamente</button>
      </div>
    );
  }

  if (editing) {
    return (
      <PlanForm
        key={editing.id || 'new'}
        initial={editing.id ? editing : undefined}
        vehicles={context.data?.vehicles || []}
        onSave={save}
        onBack={() => edit(null)}
        busy={busy}
        error={error}
      />
    );
  }

  const plansList = context.data?.plans || [];

  return (
    <div>
      <div className="mp-row mp-between">
        <div>
          <h2>Planos Preventivos e Manutenções Periódicas</h2>
          <p className="mp-muted">
            Configure os KMs programados para cada manutenção e acompanhe os alertas da frota.
          </p>
        </div>
        {access.canWrite && (
          <button className="mp-primary" onClick={() => edit({})}>
            + Novo plano personalizado
          </button>
        )}
      </div>

      {/* Info card destacando os 1.500 km e planos automáticos */}
      <div
        className="mp-card"
        style={{
          border: '1px solid var(--mp-border, #2c4434)',
          borderLeft: '4px solid #10b981',
          background: 'color-mix(in srgb, #10b981 8%, var(--mp-panel, #122018))',
          marginBottom: '16px',
          padding: '16px 18px',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Wrench size={18} style={{ color: '#10b981' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--mp-text, #e9f4ec)', fontWeight: 700 }}>
            Controle de KM Programado & Notificação com 1.500 km de Antecedência
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--mp-muted, #a0b8a8)', lineHeight: 1.6 }}>
          Você pode alterar o <strong style={{ color: 'var(--mp-text, #e9f4ec)' }}>KM programado</strong> de qualquer manutenção periódica abaixo (ex: Óleo para 10.000 km, Filtros para 10.000 km, Freios para 20.000 km).
          O sistema recalcula a meta de cada veículo automaticamente e <strong style={{ color: 'var(--mp-accent, #b6ff3b)' }}>emite uma notificação em destaque na tela sempre que o odômetro estiver a 1.500 km do vencimento</strong> (ou já vencido).
        </p>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            background: 'color-mix(in srgb, #10b981 12%, var(--mp-panel, #122018))',
            border: '1px solid #10b981',
            color: '#34d399',
            borderRadius: '8px',
            marginBottom: '14px',
            fontWeight: 600
          }}
        >
          ✓ {notice}
        </div>
      )}

      {/* Bloco de Edição Rápida de KM Programado */}
      <section className="mp-card" style={{ marginBottom: '20px' }}>
        <div className="mp-row mp-between" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Editar KM Programado das Manutenções Preventivas</h3>
            <span className="mp-muted" style={{ fontSize: '0.85rem' }}>
              Altere a quantidade de quilômetros para troca de óleo, filtros, freios, pneus e revisões.
            </span>
          </div>
          <button
            type="button"
            className="mp-button"
            onClick={() => {
              context.reload();
              alerts.reload();
            }}
          >
            <RefreshCw size={14} /> Atualizar Lista
          </button>
        </div>

        {!plansList.length ? (
          <p className="mp-muted">Nenhum plano periódico configurado no momento.</p>
        ) : (
          <div>
            {plansList.map(p => (
              <QuickKmEditor
                key={p.id}
                plan={p}
                companyId={access.companyId}
                canWrite={access.canWrite}
                onUpdated={() => {
                  context.reload();
                  alerts.reload();
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Painel de Alertas Preventivos */}
      {alerts.loading ? (
        <p role="status">Calculando alertas preventivos da frota…</p>
      ) : alerts.error ? (
        <div role="alert">
          {alerts.error}
          <button onClick={alerts.reload}>Tentar novamente</button>
        </div>
      ) : (
        <PreventiveAlerts
          rows={alerts.data?.rows || []}
          canGenerate={access.orderPermissions.create}
        />
      )}

      {/* Configuração Geral de Antecedência (dias e KM) */}
      {access.canWrite && context.data?.settings && (
        <AlertSettings
          key={context.data.settings.version}
          company={access.companyId}
          settings={context.data.settings}
          onSaved={() => {
            context.reload();
            alerts.reload();
            setNotice('Antecedência de alerta atualizada para toda a empresa.');
            setTimeout(() => setNotice(''), 4000);
          }}
        />
      )}
    </div>
  );
}
