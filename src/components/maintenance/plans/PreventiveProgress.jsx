import React from "react";
import { preventiveProgress } from "../../../utils/preventiveProgress";
import { complianceToday, displayDate } from "../../../utils/compliance";
const km = (n) => Number(n).toLocaleString("pt-BR");
export default function PreventiveProgress({
  vehicle,
  rows,
  loading,
  error,
}) {
  if (loading && !rows.length)
    return <p role="status">Calculando próximas preventivas…</p>;
  if (error)
    return (
      <p role="alert">
        As próximas preventivas estão indisponíveis. Atualize para tentar
        novamente.
      </p>
    );
  return (
    <section
      className="pm-progress-list"
      aria-label={"Próximas preventivas de " + vehicle.placa}
    >
      <h4>Próximas manutenções preventivas</h4>
      {rows.map((plan) => {
        const state = preventiveProgress(
            plan,
            vehicle.km_atual,
            complianceToday(),
          ),
          tone = state.percent == null ? "pending" : plan.estado,
          label = {
            vencida: "Vencida",
            breve: "Vence em breve",
            dia: "Em dia",
            pending: "Informe o KM",
          }[tone];
        return (
          <article className={"pm-progress-item " + tone} key={plan.id}>
            <div className="pm-progress-heading">
              <strong>{plan.nome}</strong>
              <span>{label}</span>
            </div>
            <p>
              {plan.proxima_km != null
                ? "Próxima: " + km(plan.proxima_km) + " km"
                : ""}
              {plan.proxima_km != null && plan.proxima_data ? " · " : ""}
              {plan.proxima_data ? "Até " + displayDate(plan.proxima_data) : ""}
            </p>
            {state.percent == null ? (
              <p>Informe o odômetro atual para calcular o progresso.</p>
            ) : (
              <>
                <div
                  className="pm-progress-track"
                  role="progressbar"
                  aria-label={plan.nome + " — " + vehicle.placa}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={state.percent}
                >
                  <span style={{ width: state.percent + "%" }} />
                </div>
                <div className="pm-progress-caption">
                  <span>
                    {state.remainingKm == null
                      ? ""
                      : state.remainingKm >= 0
                        ? km(state.remainingKm) + " km restantes"
                        : km(-state.remainingKm) + " km em atraso"}
                    {state.remainingKm != null && state.remainingDays != null
                      ? " · "
                      : ""}
                    {state.remainingDays == null
                      ? ""
                      : state.remainingDays >= 0
                        ? state.remainingDays + " dias restantes"
                        : -state.remainingDays + " dias em atraso"}
                  </span>
                  <strong>{state.percent}% do ciclo</strong>
                </div>
              </>
            )}
            <small>
              Referência:{" "}
              {plan.ultima_execucao_km != null
                ? km(plan.ultima_execucao_km) + " km · "
                : ""}
              {displayDate(plan.ultima_execucao_data)}
            </small>
          </article>
        );
      })}
      {!rows.length && <p>Nenhum plano preventivo cadastrado para este veículo. <a href="/manutencao/planos-preventivos">Cadastrar ou consultar planos</a>.</p>}
    </section>
  );
}

