import React, { useEffect, useState } from "react";
import { planCommand } from "../../../services/maintenancePlans";
import { preventiveRequestInitial } from "../../../utils/preventiveRequest";
import OrderForm from "../orders/OrderForm";
export default function FleetPreventiveOrderForm({
  company,
  vehicleId,
  options,
  ...props
}) {
  const vehicle = options.vehicles.find((v) => v.id === vehicleId);
  const [state, setState] = useState({
      loading: true,
      initial: null,
      error: "",
    }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, initial: null, error: "" });
    if (vehicle)
      planCommand(company, "alerts", { vehicle_id: vehicleId })
        .then((data) => {
          if (active)
            setState({
              loading: false,
              initial: preventiveRequestInitial(vehicle, data.rows || []),
              error: "",
            });
        })
        .catch((e) => {
          if (active)
            setState({ loading: false, initial: null, error: e.message });
        });
    return () => {
      active = false;
    };
  }, [company, vehicleId, revision]);
  if (!vehicle)
    return (
      <div role="alert">
        Veículo não encontrado na empresa.
        <button onClick={props.onBack}>Voltar</button>
      </div>
    );
  if (state.loading)
    return <p role="status">Preparando serviços preventivos…</p>;
  if (state.error)
    return (
      <div role="alert">
        {state.error}
        <button onClick={() => setRevision((v) => v + 1)}>
          Tentar novamente
        </button>
      </div>
    );
  return (
    <>
      <p className="mp-notice">
        S.D.O preventiva de {vehicle.placa}. Revise os serviços, acrescente o que
        for necessário e informe o grau de urgência. A abertura não dá baixa na
        preventiva nem reinicia o odômetro.
      </p>
      <OrderForm
        {...props}
        company={company}
        options={options}
        vehicleLocked
        priorityLabel="Grau de urgência"
        title="Nova S.D.O — Solicitação de Orçamento Preventivo"
        submitLabel="Gerar S.D.O"
        descriptionLabel="Serviços preventivos e adicionais *"
        initialValues={state.initial}
      />
    </>
  );
}
