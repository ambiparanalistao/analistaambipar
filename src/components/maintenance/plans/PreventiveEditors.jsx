import React, { useState } from "react";
import { persistFleetVehicle } from "../../../services/fleetPersistence";
import { planCommand } from "../../../services/maintenancePlans";
import { validatePlan } from "../../../utils/planValidation";
import { complianceToday } from "../../../utils/compliance";
export function OdometerEditor({
  vehicle,
  company,
  onSaved,
  onCancel,
  onBusy,
}) {
  const [value, setValue] = useState(vehicle.km_atual ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (
      value === "" ||
      !Number.isInteger(Number(value)) ||
      Number(value) < Math.max(0, Number(vehicle.km_atual || 0))
    ) {
      setError("Informe KM inteiro igual ou superior à última leitura.");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      await persistFleetVehicle(
        { km_atual: Number(value) },
        vehicle.id,
        null,
        company,
      );
      onSaved(
        "Odômetro atualizado. As próximas preventivas foram recalculadas.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Leitura real de {vehicle.placa}</legend>
        <label>
          KM atual do veículo
          <input
            aria-label="KM atual do veículo"
            type="number"
            min={vehicle.km_atual ?? 0}
            step="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </label>
        <p>
          O valor será salvo no cadastro do veículo e usado nas demais áreas.
          Não é permitido diminuir o odômetro.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="pm-actions">
          <button className="pm-primary" type="submit">
            {busy ? "Salvando…" : "Salvar KM"}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}
export function PreventiveReferenceEditor({
  vehicle,
  rule,
  company,
  onSaved,
  onCancel,
  onBusy,
}) {
  const [form, setForm] = useState({
      nome: rule.nome,
      vehicle_id: vehicle.id,
      categoria_veiculo: "",
      intervalo_km: rule.intervalo_km,
      intervalo_dias: "",
      ultima_execucao_km: "",
      ultima_execucao_data: "",
      ativo: true,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [baseline, setBaseline] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  async function submit(e) {
    e.preventDefault();
    const errors = validatePlan(form, vehicle, complianceToday());
    if (Object.keys(errors).length) {
      setError(Object.values(errors).join(" "));
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      await planCommand(company, "save", form);
      onSaved("Referência salva. Próxima preventiva calculada no painel.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={busy}>
        <legend>
          {rule.nome} · {vehicle.placa}
        </legend>
        <p>
          Confirme o intervalo recomendado para este veículo. A referência pode
          ser a última revisão conhecida ou o início do acompanhamento; salvar
          não registra serviço executado.
        </p>
        <div className="pm-editor-grid">
          <label>
            Intervalo em KM
            <input
              aria-label="Intervalo em KM"
              type="number"
              min="1"
              step="1"
              value={form.intervalo_km}
              onChange={(e) => set("intervalo_km", e.target.value)}
            />
          </label>
          <label>
            Intervalo em dias (opcional)
            <input
              aria-label="Intervalo em dias"
              type="number"
              min="1"
              value={form.intervalo_dias}
              onChange={(e) => set("intervalo_dias", e.target.value)}
            />
          </label>
          <label>
            KM de referência
            <input
              aria-label="KM de referência"
              disabled={baseline}
              type="number"
              min="0"
              max={vehicle.km_atual}
              value={form.ultima_execucao_km}
              onChange={(e) => set("ultima_execucao_km", e.target.value)}
            />
          </label>
          <label>
            Data de referência
            <input
              aria-label="Data de referência"
              disabled={baseline}
              type="date"
              max={complianceToday()}
              value={form.ultima_execucao_data}
              onChange={(e) => set("ultima_execucao_data", e.target.value)}
            />
          </label>
        </div>
        <label className="pm-check">
          <input
            type="checkbox"
            checked={baseline}
            onChange={(e) => {
              setBaseline(e.target.checked);
              setForm((f) => ({
                ...f,
                ultima_execucao_km: e.target.checked ? vehicle.km_atual : "",
                ultima_execucao_data: e.target.checked ? complianceToday() : "",
              }));
            }}
          />
          Iniciar acompanhamento no KM atual, sem registrar revisão executada
        </label>
        <p>
          Vale o que vencer primeiro: KM ou tempo. As barras usam a referência
          confirmada e a leitura atual do veículo.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="pm-actions">
          <button className="pm-primary" type="submit">
            {busy ? "Salvando…" : "Salvar referência"}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}
