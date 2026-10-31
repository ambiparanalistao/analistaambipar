import React, { useState } from 'react';
import { Truck, AlertCircle, Building2 } from 'lucide-react';
import { driverPortal } from '../../../services/driverReports';

const items = {
  pneus: 'Pneus e rodas',
  freios: 'Freios',
  iluminacao: 'Iluminação',
  fluidos: 'Fluidos e vazamentos',
  direcao: 'Direção e suspensão',
  documentos: 'Documentos',
  equipamentos: 'Equipamentos de segurança'
};

export default function DriverChecklist({ invite, session, home, onChanged }) {
  const [f, setF] = useState({
    requestId: crypto.randomUUID(),
    vehicleId: '',
    km: '',
    kind: 'saida',
    items: {},
    notes: '',
    severity: 'media'
  });
  const [selectedBase, setSelectedBase] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const defect = Object.values(f.items).includes('defeito');

  const valeVehicles = (home?.vehicles || []).filter(
    (v) => (v.base_operacional || 'Base Vale') === 'Base Vale'
  );
  const dcxVehicles = (home?.vehicles || []).filter(
    (v) => (v.base_operacional || 'Base Vale') === 'Base DCX'
  );
  const baseVehicles =
    selectedBase === 'Base DCX' ? dcxVehicles : selectedBase === 'Base Vale' ? valeVehicles : [];

  const selectedVehicle = (home?.vehicles || []).find((v) => v.id === f.vehicleId);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!confirmed) {
      if (!selectedBase) {
        setError('Selecione primeiro a Base Operacional (Base Vale ou Base DCX).');
        return;
      }
      const v = baseVehicles.find((v) => v.id === f.vehicleId);
      if (!v || f.km === '' || !Number.isInteger(Number(f.km)) || Number(f.km) < Number(v.km_atual || 0)) {
        setError('Escolha a placa da base selecionada e confirme o KM atual, sem diminuir o odômetro.');
        return;
      }
      setConfirmed(true);
      return;
    }

    setBusy(true);
    try {
      const r = await driverPortal('checklist', { invite, session, ...f });
      setNotice(
        r.report_id
          ? 'Checklist recebido. Os defeitos foram encaminhados para análise.'
          : 'Checklist recebido. Obrigado pelo cuidado com o veículo!'
      );
      setF({
        requestId: crypto.randomUUID(),
        vehicleId: '',
        km: '',
        kind: 'saida',
        items: {},
        notes: '',
        severity: 'media'
      });
      setSelectedBase('');
      setConfirmed(false);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dp-card">
      <h2>Checklist de saída e retorno</h2>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert" className="dp-error">{error}</p>}

      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {!confirmed ? (
            <>
              {/* SELEÇÃO DA BASE ANTES DO VEÍCULO NO CHECKLIST */}
              <div className="dp-base-section">
                <label className="dp-base-heading">
                  <Building2 size={16} /> 1. Escolha a sua Base Operacional
                </label>
                <div className="dp-base-options">
                  <button
                    type="button"
                    className={`dp-base-btn ${selectedBase === 'Base Vale' ? 'selected-vale' : ''}`}
                    onClick={() => {
                      if (selectedBase !== 'Base Vale') {
                        setSelectedBase('Base Vale');
                        setF((x) => ({ ...x, vehicleId: '', km: '' }));
                        setError('');
                      }
                    }}
                  >
                    <div className="dp-base-header-row">
                      <span className="dp-base-title">
                        <Truck size={17} />
                        Base Vale
                      </span>
                      {selectedBase === 'Base Vale' && <span className="dp-base-badge">Ativa</span>}
                    </div>
                    <span className="dp-base-count">{valeVehicles.length} veículos cadastrados</span>
                  </button>

                  <button
                    type="button"
                    className={`dp-base-btn ${selectedBase === 'Base DCX' ? 'selected-dcx' : ''}`}
                    onClick={() => {
                      if (selectedBase !== 'Base DCX') {
                        setSelectedBase('Base DCX');
                        setF((x) => ({ ...x, vehicleId: '', km: '' }));
                        setError('');
                      }
                    }}
                  >
                    <div className="dp-base-header-row">
                      <span className="dp-base-title">
                        <Truck size={17} />
                        Base DCX
                      </span>
                      {selectedBase === 'Base DCX' && <span className="dp-base-badge">Ativa</span>}
                    </div>
                    <span className="dp-base-count">{dcxVehicles.length} veículos cadastrados</span>
                  </button>
                </div>
              </div>

              {!selectedBase ? (
                <div className="dp-base-notice">
                  <AlertCircle size={18} />
                  <span>
                    Selecione a <strong>Base Vale</strong> ou <strong>Base DCX</strong> acima para liberar
                    as placas correspondentes.
                  </span>
                </div>
              ) : (
                <>
                  <label className="dp-field">
                    2. Placa do veículo ({selectedBase})
                    <select
                      required
                      value={f.vehicleId}
                      onChange={(e) => setF((x) => ({ ...x, vehicleId: e.target.value, km: '' }))}
                    >
                      <option value="">
                        Escolha a placa cadastrada na {selectedBase} ({baseVehicles.length} opções)
                      </option>
                      {baseVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.placa} · {v.marca_modelo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="dp-field">
                    KM atual
                    <input
                      required
                      type="number"
                      min={selectedVehicle?.km_atual || 0}
                      max="10000000"
                      value={f.km}
                      onChange={(e) => setF((x) => ({ ...x, km: e.target.value }))}
                      placeholder={
                        selectedVehicle?.km_atual != null
                          ? `Último KM: ${selectedVehicle.km_atual}`
                          : 'Informe o KM'
                      }
                    />
                  </label>

                  <button className="dp-primary" disabled={!f.vehicleId || f.km === ''}>
                    Confirmar KM e verificar
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="dp-vehicle-summary">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{selectedVehicle?.placa}</strong>
                    <span
                      className={`dp-badge ${
                        selectedBase === 'Base DCX' ? 'base-dcx' : 'base-vale'
                      }`}
                    >
                      {selectedBase}
                    </span>
                  </div>
                  <span>{f.km} km · {selectedVehicle?.marca_modelo}</span>
                </div>
                <button type="button" onClick={() => setConfirmed(false)}>
                  Alterar placa / KM
                </button>
              </div>

              <label className="dp-field">
                Momento
                <select value={f.kind} onChange={(e) => setF((x) => ({ ...x, kind: e.target.value }))}>
                  <option value="saida">Saída</option>
                  <option value="retorno">Retorno</option>
                </select>
              </label>

              {Object.entries(items).map(([k, l]) => (
                <label className="dp-field" key={k}>
                  {l}
                  <select
                    required
                    value={f.items[k] || ''}
                    onChange={(e) => setF((x) => ({ ...x, items: { ...x.items, [k]: e.target.value } }))}
                  >
                    <option value="">Verifique</option>
                    <option value="ok">OK</option>
                    <option value="defeito">Com defeito</option>
                    <option value="nao_aplicavel">Não se aplica</option>
                  </select>
                </label>
              ))}

              <label className="dp-field">
                Observações / defeitos
                <textarea
                  required={defect}
                  minLength={defect ? 5 : 0}
                  maxLength={9990}
                  value={f.notes}
                  onChange={(e) => setF((x) => ({ ...x, notes: e.target.value }))}
                  placeholder={
                    defect
                      ? 'Descreva os defeitos encontrados obrigatoriamente…'
                      : 'Observações adicionais (opcional)…'
                  }
                />
              </label>

              {defect && (
                <label className="dp-field">
                  Grau da manutenção
                  <select
                    value={f.severity}
                    onChange={(e) => setF((x) => ({ ...x, severity: e.target.value }))}
                  >
                    <option value="leve">Leve</option>
                    <option value="media">Média</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </label>
              )}

              <button className="dp-primary" disabled={busy}>
                {busy ? 'Salvando…' : 'Enviar checklist'}
              </button>
            </>
          )}
        </fieldset>
      </form>
    </div>
  );
}
