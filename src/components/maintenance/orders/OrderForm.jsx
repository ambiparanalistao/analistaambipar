import QuoteTypeSelector from './QuoteTypeSelector';
import {driverForVehicle} from '../../../utils/registryMatching';
import {vehicleCommand} from '../../../services/vehicleMaintenance';
import React,{useState,useEffect,useMemo} from 'react';
import {ORDER_TYPES,PRIORITIES,validateOrder} from '../../../utils/orderValidation';
import {PARTNER_TYPES} from '../../../utils/partnerValidation';

export function computeQuotePartnerTypes(selectedIds, allPartners) {
  if (!selectedIds || !selectedIds.length) return [];
  const active = (allPartners || []).filter(p => p.status === 'ativo' && !p.deleted_at);
  if (active.length > 0 && selectedIds.length >= active.length) {
    return Object.keys(PARTNER_TYPES);
  }
  const codes = new Set();
  const selectedPartners = active.filter(p => selectedIds.includes(p.id));
  for (const p of selectedPartners) {
    const list = p.onboarding_profile?.tipos_oficina;
    let found = false;
    if (Array.isArray(list)) {
      for (const [code, label] of Object.entries(PARTNER_TYPES)) {
        if (list.includes(label) || list.includes(code)) {
          codes.add(code);
          found = true;
        }
      }
    }
    if (p.tipo && PARTNER_TYPES[p.tipo]) {
      codes.add(p.tipo);
      found = true;
    }
    if (!found) {
      codes.add('outros');
    }
  }
  return Array.from(codes);
}

export default function OrderForm({
  options,
  partnerId,
  company,
  initialValues = {},
  sourceLocked = false,
  vehicleLocked = false,
  title = "Nova solicitação de orçamento",
  submitLabel = "Abrir S.D.O",
  descriptionLabel = "Descrição do problema *",
  priorityLabel = "Prioridade",
  onSave,
  onBack,
  busy,
  error
}) {
  const activePartners = useMemo(
    () => (options.partners || []).filter(p => p.status === 'ativo' && !p.deleted_at),
    [options.partners]
  );

  const initialV = options.vehicles.find(v => v.id === (initialValues.vehicle_id || ''));

  const initialSelected = useMemo(() => {
    if (partnerId) return [partnerId];
    if (initialValues.selected_partner_ids?.length) return initialValues.selected_partner_ids;
    if (initialValues.partner_id) return [initialValues.partner_id];
    return activePartners.map(p => p.id);
  }, [partnerId, initialValues, activePartners]);

  const initialRefPartnerId = partnerId || initialValues.partner_id || (initialSelected[0] || (activePartners[0]?.id || ''));

  const [form, setForm] = useState({
    selected_partner_ids: initialSelected,
    partner_id: initialRefPartnerId,
    quote_partner_types: initialValues.quote_partner_types?.length
      ? initialValues.quote_partner_types
      : computeQuotePartnerTypes(initialSelected, options.partners),
    vehicle_id: '',
    driver_id: '',
    tipo: 'corretiva',
    prioridade: 'media',
    descricao_problema: '',
    km_abertura: '',
    previsao_entrega: '',
    prazo_entrega_dias: options.partners.find(p => p.id === initialRefPartnerId)?.onboarding_profile?.prazo_entrega_dias || '',
    ...initialValues,
    driver_id: initialValues.driver_id || driverForVehicle(options.vehicles.find(v => v.id === initialValues.vehicle_id), options.drivers)?.id || ''
  });

  const [search, setSearch] = useState(initialV ? initialV.placa : '');
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [errors, setErrors] = useState({});

  function handlePlacaChange(val) {
    setSearch(val);
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matched = options.vehicles.find(v => {
      const vClean = v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return vClean === clean || v.placa.toUpperCase() === val.toUpperCase().trim() || v.id === val;
    });
    if (matched) {
      setForm(f => ({
        ...f,
        vehicle_id: matched.id,
        km_abertura: matched.km_atual ?? f.km_abertura,
        driver_id: driverForVehicle(matched, options.drivers)?.id || f.driver_id
      }));
    } else {
      setForm(f => ({ ...f, vehicle_id: '' }));
    }
  }

  function updateSelectedPartners(nextIds, preferredRef) {
    const refId = (preferredRef && nextIds.includes(preferredRef))
      ? preferredRef
      : (nextIds.includes(form.partner_id) ? form.partner_id : (nextIds[0] || ''));
    const refPartner = options.partners.find(p => p.id === refId);
    const types = computeQuotePartnerTypes(nextIds, options.partners);
    setForm(f => ({
      ...f,
      selected_partner_ids: nextIds,
      partner_id: refId,
      quote_partner_types: types,
      prazo_entrega_dias: refPartner?.onboarding_profile?.prazo_entrega_dias || f.prazo_entrega_dias
    }));
  }

  function toggleWorkshop(id) {
    const cur = form.selected_partner_ids || [];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    updateSelectedPartners(next);
  }

  function selectAllWorkshops() {
    updateSelectedPartners(activePartners.map(p => p.id));
  }

  function deselectAllWorkshops() {
    updateSelectedPartners([]);
  }

  function setReferenceWorkshop(id, e) {
    if (e) e.stopPropagation();
    const cur = form.selected_partner_ids || [];
    const next = cur.includes(id) ? cur : [...cur, id];
    updateSelectedPartners(next, id);
  }

  function handleReferenceChange(e) {
    const chosenId = e.target.value;
    if (!chosenId) {
      updateSelectedPartners([], '');
      return;
    }
    const cur = form.selected_partner_ids || [];
    const next = cur.includes(chosenId) ? cur : [...cur, chosenId];
    updateSelectedPartners(next, chosenId);
  }

  useEffect(() => {
    let active = true;
    if (company && form.vehicle_id) {
      vehicleCommand(company, 'dossier', { vehicle_id: form.vehicle_id })
        .then(data => {
          if (active) {
            setForm(f => {
              const preferred = options.partners.find(p => p.id === data.preferences?.default_partner_id && p.status === 'ativo' && !p.deleted_at);
              const id = f.partner_id || preferred?.id || '';
              const curIds = f.selected_partner_ids || [];
              const nextIds = preferred?.id && !curIds.includes(preferred.id) ? [...curIds, preferred.id] : curIds;
              return {
                ...f,
                partner_id: id,
                selected_partner_ids: nextIds.length ? nextIds : (id ? [id] : []),
                prazo_entrega_dias: f.prazo_entrega_dias || options.partners.find(p => p.id === id)?.onboarding_profile?.prazo_entrega_dias || ''
              };
            });
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [company, form.vehicle_id, options.partners]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const vehicle = options.vehicles.find(v => v.id === form.vehicle_id);
  const driver = options.drivers.find(d => d.id === form.driver_id);
  const field = (k, label, type = 'text') => (
    <label className="mp-field">
      {label}
      <input name={k} type={type} value={form[k]} onChange={e => set(k, e.target.value)} aria-invalid={!!errors[k]} />
      {errors[k] && <span className="mp-error">{errors[k]}</span>}
    </label>
  );

  function submit(e) {
    e.preventDefault();
    const invalid = validateOrder(form, vehicle);
    setErrors(invalid);
    if (!Object.keys(invalid).length) {
      onSave({
        ...form,
        km_abertura: Number(form.km_abertura),
        previsao_entrega: form.previsao_entrega ? new Date(form.previsao_entrega).toISOString() : null
      });
    }
  }

  const filteredPartners = activePartners.filter(p => {
    if (!workshopSearch.trim()) return true;
    const q = workshopSearch.toLowerCase();
    const name = (p.nome_fantasia || '').toLowerCase();
    const social = (p.razao_social || '').toLowerCase();
    const types = (p.onboarding_profile?.tipos_oficina || []).join(' ').toLowerCase();
    const city = (p.onboarding_profile?.cidade || p.cidade || '').toLowerCase();
    return name.includes(q) || social.includes(q) || types.includes(q) || city.includes(q);
  });

  const selectedCount = (form.selected_partner_ids || []).length;

  return (
    <form onSubmit={submit} noValidate>
      <div className="mp-row mp-between">
        <h2>{title}</h2>
        <button type="button" disabled={busy} onClick={onBack}>Voltar</button>
      </div>
      {error && <p role="alert" className="mp-error">{error}</p>}
      <fieldset disabled={busy} className="os-fieldset">
        <legend>{submitLabel === 'Gerar SDO' ? 'Abertura da SDO' : 'Abertura da S.D.O'}</legend>
        <p className="mp-muted">
          O número será gerado automaticamente ao salvar. Marque abaixo as oficinas que devem receber esta solicitação de orçamento via WhatsApp. Cada oficina receberá a planilha Excel e o link do portal para informar prazos, garantia e NCM das peças antes de sua aprovação final.
        </p>
        <div className="mp-grid">
          <label className="mp-field">
            Placa do veículo *
            <input
              aria-label="Placa do veículo"
              list="order-vehicles-datalist"
              disabled={sourceLocked || vehicleLocked}
              placeholder="Selecione ou informe a placa cadastrada"
              value={search}
              onChange={e => handlePlacaChange(e.target.value)}
            />
            {errors.vehicle_id && <span className="mp-error">{errors.vehicle_id}</span>}
            <datalist id="order-vehicles-datalist">
              {options.vehicles.map(v => (
                <option key={v.id} value={v.placa}>
                  {v.placa} · {v.marca_modelo} · {v.status}
                </option>
              ))}
            </datalist>
          </label>

          <label className="mp-field">
            Relator dos defeitos do veículo (motorista, opcional)
            <select
              aria-label="Motorista relator"
              disabled={sourceLocked}
              value={form.driver_id}
              onChange={e => set('driver_id', e.target.value)}
            >
              <option value="">Relator não informado</option>
              {options.drivers.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </label>

          <label className="mp-field">
            Tipo
            <select aria-label="Tipo da S.D.O" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(ORDER_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>

          <label className="mp-field">
            {priorityLabel}
            <select aria-label={priorityLabel} value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>

          {field('km_abertura', 'KM atual *', 'number')}
          {field('prazo_entrega_dias', 'Prazo desejado após aprovação (dias corridos)', 'number')}

          {/* SELEÇÃO MULTIPLA DE OFICINAS PARA COTAÇÃO */}
          <div className="os-workshop-section">
            <div className="os-workshop-header">
              <div>
                <h3>
                  <span style={{ fontSize: '1.25rem' }}>🏢</span> Oficinas para envio de cotação e execução *
                </h3>
                <p className="os-workshop-subtitle">
                  Marque quantas oficinas desejar para gerar e enviar as solicitações de orçamento simultaneamente via WhatsApp antes de aprovar o serviço.
                </p>
              </div>
              <div className={`os-workshop-badge-count ${!selectedCount ? 'empty' : ''}`}>
                {selectedCount > 0 ? (
                  <>✓ {selectedCount} oficina{selectedCount > 1 ? 's' : ''} selecionada{selectedCount > 1 ? 's' : ''} para cotação</>
                ) : (
                  <>⚠ Nenhuma oficina selecionada</>
                )}
              </div>
            </div>

            <div className="os-workshop-toolbar">
              <div className="os-workshop-actions">
                <button
                  type="button"
                  className="os-workshop-btn os-workshop-btn-primary"
                  onClick={selectAllWorkshops}
                  disabled={busy || !activePartners.length}
                >
                  ✓ Marcar Todas ({activePartners.length})
                </button>
                <button
                  type="button"
                  className="os-workshop-btn"
                  onClick={deselectAllWorkshops}
                  disabled={busy || !selectedCount}
                >
                  ✕ Desmarcar Todas
                </button>
              </div>

              <div className="os-workshop-search">
                <input
                  type="text"
                  placeholder="🔍 Filtrar oficina por nome, tipo ou cidade..."
                  value={workshopSearch}
                  onChange={e => setWorkshopSearch(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="os-workshop-grid">
              {filteredPartners.map(p => {
                const isSelected = (form.selected_partner_ids || []).includes(p.id);
                const isRef = form.partner_id === p.id;
                const phone = p.onboarding_profile?.whatsapp || p.onboarding_profile?.telefone || p.telefone;
                const types = p.onboarding_profile?.tipos_oficina || (p.tipo ? [PARTNER_TYPES[p.tipo] || p.tipo] : []);
                const leadTime = p.onboarding_profile?.prazo_entrega_dias;

                return (
                  <div
                    key={p.id}
                    className={`os-workshop-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleWorkshop(p.id)}
                  >
                    <div className="os-workshop-card-top">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Selecionar ${p.nome_fantasia || p.razao_social}`}
                      />
                      <div className="os-workshop-card-info">
                        <div className="os-workshop-name">{p.nome_fantasia || p.razao_social}</div>
                        {p.nome_fantasia && p.razao_social && p.nome_fantasia !== p.razao_social && (
                          <div className="os-workshop-subname">{p.razao_social}</div>
                        )}
                        {types.length > 0 && (
                          <div className="os-workshop-tags">
                            {types.map(t => (
                              <span key={t} className="os-workshop-tag">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="os-workshop-meta">
                      <div>
                        {phone ? <span>📱 WhatsApp: {phone}</span> : <span style={{ opacity: 0.6 }}>Sem contato salvo</span>}
                        {leadTime ? <span style={{ marginLeft: 8 }}>· Prazo: {leadTime}d</span> : null}
                      </div>
                      {isRef ? (
                        <span className="os-ref-badge" title="Oficina referência principal para a ordem">★ Referência</span>
                      ) : isSelected ? (
                        <button
                          type="button"
                          className="os-make-ref-btn"
                          onClick={e => setReferenceWorkshop(p.id, e)}
                          title="Tornar esta oficina a referência principal da S.D.O"
                        >
                          Tornar ref.
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {!filteredPartners.length && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--mp-muted)' }}>
                  Nenhuma oficina encontrada{workshopSearch ? ` para "${workshopSearch}"` : ''}.
                </p>
              )}
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="mp-field" style={{ margin: 0, flex: 1, minWidth: 260 }}>
                Oficina de referência para execução *
                <select
                  aria-label="Oficina"
                  value={form.partner_id}
                  onChange={handleReferenceChange}
                  disabled={busy}
                >
                  <option value="">Selecione a oficina de referência</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome_fantasia || p.razao_social} {((form.selected_partner_ids || []).includes(p.id)) ? '✓ (Marcada para cotação)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              {errors.partner_id && <span className="mp-error" style={{ display: 'block', width: '100%' }}>{errors.partner_id}</span>}
            </div>
          </div>
        </div>

        {vehicle && (
          <p className="mp-muted">
            Último odômetro salvo: {vehicle.km_atual == null ? 'Não informado' : Number(vehicle.km_atual).toLocaleString('pt-BR') + ' km'}.
          </p>
        )}
        {!options.vehicles.length && <p role="status">Cadastre e salve um veículo na Gestão de Frotas para abrir a S.D.O.</p>}
        {!activePartners.length && <p role="status">Cadastre uma oficina ativa em Oficinas Parceiras.</p>}

        <label className="mp-field">
          {descriptionLabel}
          <textarea
            readOnly={sourceLocked}
            name="descricao_problema"
            value={form.descricao_problema}
            onChange={e => set('descricao_problema', e.target.value)}
            maxLength={5000}
          />
          {errors.descricao_problema && <span className="mp-error">{errors.descricao_problema}</span>}
        </label>
      </fieldset>

      <details className="os-fieldset" style={{ marginTop: 16, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#94a3b8', fontSize: '0.88rem' }}>
          ⚙️ Filtros avançados por categoria de serviço ({form.quote_partner_types?.length || 0} categorias sincronizadas)
        </summary>
        <div style={{ marginTop: 12 }}>
          <QuoteTypeSelector
            partners={options.partners}
            value={form.quote_partner_types || []}
            onChange={types => set('quote_partner_types', types)}
            disabled={busy}
          />
        </div>
      </details>

      {vehicle && (
        <section className="mp-card">
          <h3>Dados do veículo e relator dos defeitos</h3>
          <p>
            {vehicle.placa} · {vehicle.marca_modelo} · Ano {vehicle.ano_fabricacao || 'não informado'} / {vehicle.ano_modelo || 'não informado'} · Chassi {vehicle.chassi || 'não informado'}
          </p>
          <p>
            Relator dos defeitos: {driver?.nome || 'Nenhum selecionado'} · Telefone: {driver?.telefone || 'não informado'}
          </p>
        </section>
      )}

      <div className="mp-row mp-footer">
        <button disabled={busy} type="button" onClick={onBack}>Cancelar</button>
        <button className="mp-primary" disabled={busy || !options.vehicles.length} type="submit">
          {busy ? 'Abrindo…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
