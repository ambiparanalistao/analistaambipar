import React, { useState } from 'react';
import { PLAN_ITEMS, validatePlan } from '../../../utils/planValidation';

export default function PlanForm({ initial, vehicles, onSave, onBack, busy, error }) {
  const isGlobalInit = initial && !initial.vehicle_id && (!initial.categoria_veiculo || initial.categoria_veiculo === 'TODOS' || initial.categoria_veiculo === 'frota');
  const initialScope = isGlobalInit ? 'all' : (initial?.categoria_veiculo ? 'category' : (initial?.vehicle_id ? 'vehicle' : 'all'));

  const [form, setForm] = useState(() => initial || {
    nome: 'Troca de óleo',
    vehicle_id: '',
    categoria_veiculo: 'TODOS',
    intervalo_km: '10000',
    intervalo_dias: '180',
    ultima_execucao_km: '',
    ultima_execucao_data: new Date().toLocaleDateString('en-CA'),
    ativo: true,
  });
  const [scope, setScope] = useState(initialScope);
  const [errors, setErrors] = useState({});

  const vehicle = vehicles.find(v => v.id === form.vehicle_id);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (scope === 'all') {
      payload.categoria_veiculo = 'TODOS';
      payload.vehicle_id = '';
    } else if (scope === 'category') {
      payload.vehicle_id = '';
    } else if (scope === 'vehicle') {
      payload.categoria_veiculo = '';
    }
    const invalid = validatePlan(payload, vehicle);
    setErrors(invalid);
    if (!Object.keys(invalid).length) onSave(payload);
  }

  const field = (k, label, type = 'text') => (
    <label className="mp-field">
      {label}
      <input
        aria-label={label}
        type={type}
        value={form[k] ?? ''}
        min={type === 'number' ? 0 : undefined}
        onChange={e => set(k, e.target.value)}
        aria-invalid={!!errors[k]}
      />
      {errors[k] && <span className="mp-error">{errors[k]}</span>}
    </label>
  );

  return (
    <form noValidate onSubmit={submit} className="mp-card">
      <div className="mp-row mp-between">
        <h2>{form.id ? 'Editar plano preventivo' : 'Novo plano preventivo'}</h2>
        <button type="button" disabled={busy} onClick={onBack}>
          Voltar
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy}>
        <legend>Plano e periodicidade</legend>
        <div className="mp-grid">
          <label className="mp-field">
            Item / Manutenção *
            <input
              list="preventive-items"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
            <datalist id="preventive-items">
              {PLAN_ITEMS.map(n => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {errors.nome && <span className="mp-error">{errors.nome}</span>}
          </label>
          <label className="mp-field">
            Aplicar por
            <select
              aria-label="Aplicar por"
              disabled={!!form.id}
              value={scope}
              onChange={e => {
                const newScope = e.target.value;
                setScope(newScope);
                setForm(f => ({
                  ...f,
                  vehicle_id: '',
                  categoria_veiculo: newScope === 'all' ? 'TODOS' : '',
                  ultima_execucao_km: '',
                }));
              }}
            >
              <option value="all">Toda a Frota (Todos os veículos)</option>
              <option value="category">Por Categoria</option>
              <option value="vehicle">Veículo Específico</option>
            </select>
          </label>
          {scope === 'all' ? (
            <div style={{ gridColumn: 'span 2', padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', fontSize: '0.88rem', color: '#1e40af' }}>
              ✓ Este plano será aplicado automaticamente a todos os veículos atuais e novos da empresa.
            </div>
          ) : scope === 'vehicle' ? (
            <label className="mp-field">
              Veículo *
              <select
                aria-label="Veículo *"
                disabled={!!form.id}
                value={form.vehicle_id || ''}
                onChange={e => {
                  const v = vehicles.find(x => x.id === e.target.value);
                  setForm(f => ({
                    ...f,
                    vehicle_id: e.target.value,
                    ultima_execucao_km: v?.km_atual ?? '',
                  }));
                }}
              >
                <option value="">Selecione</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.placa} · {v.km_atual ?? 0} km
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="mp-field">
              Categoria *
              <select
                aria-label="Categoria *"
                disabled={!!form.id}
                value={form.categoria_veiculo || ''}
                onChange={e => set('categoria_veiculo', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="TODOS">Todos os tipos</option>
                {[...new Set(vehicles.map(v => v.tipo).filter(Boolean))].sort().map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          )}
          {field('intervalo_km', 'Intervalo programado em KM (Ex: 10000)', 'number')}
          {field('intervalo_dias', 'Intervalo em dias (Ex: 180)', 'number')}
          {!form.id && (
            <>
              {scope === 'vehicle' && field('ultima_execucao_km', 'KM da última execução / base *', 'number')}
              {field('ultima_execucao_data', 'Data da última execução / base *', 'date')}
            </>
          )}
        </div>
        {errors.scope && <p role="alert">{errors.scope}</p>}
        <p className="mp-muted">
          Vale o primeiro vencimento atingido (KM ou data). A edição do KM programa novos ciclos para a frota sem perder o histórico já executado.
        </p>
        <label>
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={e => set('ativo', e.target.checked)}
          />
          Plano ativo
        </label>
        <button className="mp-primary" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar plano'}
        </button>
      </fieldset>
    </form>
  );
}
