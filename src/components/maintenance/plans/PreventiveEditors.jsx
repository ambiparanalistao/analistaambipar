import React, { useState } from "react";
import { persistFleetVehicle } from "../../../services/fleetPersistence";
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

