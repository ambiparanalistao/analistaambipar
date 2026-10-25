import React, { useEffect, useState } from "react";
import {
  Wrench,
  Truck,
  Gauge,
  ArrowUpRight,
  RefreshCw,
  Search,
  History,
  ShieldCheck,
} from "lucide-react";
import useFleetDirectory from "../hooks/useFleetDirectory";
import useMaintenancePlans from "../hooks/useMaintenancePlans";
import { listOrders } from "../services/maintenanceOrders";
import { PREVENTIVE_RULES } from "../data/preventiveMaintenanceData";
import { ORDER_STATUS, PRIORITIES } from "../utils/orderValidation";
import "./PreventiveMaintenance.css";
const requestUrl = (id) =>
  "/manutencao/ordens-de-servico?acao=nova&preventiva_frota=" +
  encodeURIComponent(id);
export default function PreventiveMaintenanceModule({
  access,
  onNavigateFleet,
}) {
  const company = access?.companyId,
    directory = useFleetDirectory(company),
    plans = useMaintenancePlans(company);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("preventive_theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [search, setSearch] = useState(""),
    [history, setHistory] = useState({ loading: true, rows: [], error: "" }),
    [revision, setRevision] = useState(0);
  const canCreate = access?.orderPermissions?.create;
  useEffect(() => {
    let active = true;
    setHistory({ loading: !!company, rows: [], error: "" });
    if (company)
      listOrders(company, { tipo: "preventiva" }, 1, false)
        .then((r) => {
          if (active) setHistory({ loading: false, rows: r.rows, error: "" });
        })
        .catch((e) => {
          if (active)
            setHistory({ loading: false, rows: [], error: e.message });
        });
    return () => {
      active = false;
    };
  }, [company, revision]);
  if (access?.loading) return <p role="status">Verificando empresa…</p>;
  if (!access?.canRead)
    return (
      <p role="alert">
        Seu perfil não permite consultar a manutenção desta empresa.
      </p>
    );
  const visible = directory.vehicles.filter((v) =>
    (v.placa + " " + v.marca_modelo)
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const alertRows = plans.data?.rows || [];
  function refresh() {
    directory.reload();
    plans.reload();
    setRevision((v) => v + 1);
  }
  return (
    <section className="pm-page" data-pm-theme={theme}>
      <header className="pm-hero">
        <div>
          <span className="pm-eyebrow">
            <ShieldCheck size={16} />
            PLANEJAR · ORÇAR · ACOMPANHAR
          </span>
          <h1>Manutenção preventiva</h1>
          <p>
            Gere uma SDO com os serviços já descritos, acrescente outras
            necessidades e defina a urgência antes de enviar às oficinas.
          </p>
        </div>
        <div className="pm-actions">
          <button
            onClick={() =>
              setTheme((t) => {
                const n = t === "dark" ? "light" : "dark";
                try {
                  localStorage.setItem("preventive_theme", n);
                } catch {
                  /* Preference only. */
                }
                return n;
              })
            }
          >
            Modo {theme === "dark" ? "claro" : "escuro"}
          </button>
          <button onClick={refresh}>
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </header>
      <div className="pm-stats">
        <article>
          <Truck />
          <span>Veículos cadastrados</span>
          <strong>{directory.vehicles.length}</strong>
        </article>
        <article>
          <Gauge />
          <span>Com odômetro informado</span>
          <strong>
            {directory.vehicles.filter((v) => v.km_atual != null).length}
          </strong>
        </article>
        <article>
          <Wrench />
          <span>Preventivas vencidas</span>
          <strong>
            {plans.loading
              ? "…"
              : plans.error
                ? "—"
                : alertRows.filter((a) => a.estado === "vencida").length}
          </strong>
        </article>
      </div>
      <div className="pm-note">
        Gerar uma solicitação não conclui o serviço nem zera o KM. O odômetro é
        preservado; a execução será registrada no fluxo da manutenção.
      </div>
      <section className="pm-panel">
        <h2>Serviços incluídos na solicitação</h2>
        <p>
          Os itens abaixo são um roteiro para orçamento. Revise a aplicação ao
          veículo no formulário; os planos ativos do veículo também serão
          descritos.
        </p>
        <div className="pm-services">
          {PREVENTIVE_RULES.map((r) => (
            <details key={r.id}>
              <summary>{r.nome}</summary>
              <p>{r.descricao}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="pm-heading">
        <h2>Selecione o veículo</h2>
        <label>
          <Search size={17} />
          <input
            aria-label="Buscar veículo na preventiva"
            placeholder="Buscar placa ou modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {directory.loading ? (
        <p role="status">Carregando frota da empresa…</p>
      ) : directory.error ? (
        <div role="alert">
          {directory.error}
          <button onClick={directory.reload}>Tentar novamente</button>
        </div>
      ) : !visible.length ? (
        <p className="pm-panel">
          Nenhum veículo encontrado no cadastro da empresa.
        </p>
      ) : (
        <div className="pm-vehicles">
          {visible.map((v) => {
            const alerts = alertRows.filter((a) => a.vehicle_id === v.id);
            return (
              <article className="pm-panel" key={v.id}>
                <div className="pm-heading">
                  <h3>{v.placa}</h3>
                  <span className="pm-status">{v.status}</span>
                </div>
                <p>{v.marca_modelo || "Modelo não informado"}</p>
                <div className="pm-km">
                  <Gauge size={18} />
                  <strong>
                    {v.km_atual == null
                      ? "KM não informado"
                      : Number(v.km_atual).toLocaleString("pt-BR") + " km"}
                  </strong>
                  <small>Odômetro salvo no cadastro</small>
                </div>
                {alerts.length ? (
                  <ul>
                    {alerts.map((a) => (
                      <li key={a.id}>
                        {a.nome} ·{" "}
                        {a.estado === "vencida"
                          ? "Vencida"
                          : a.estado === "breve"
                            ? "Vence em breve"
                            : "Em dia"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pm-muted">
                    Sem plano periódico cadastrado. A SDO será preenchida com o
                    roteiro preventivo.
                  </p>
                )}
                <div className="pm-actions">
                  {canCreate &&
                    (v.status === "Em Viagem" ? (
                      <span>Finalize a viagem para gerar a SDO.</span>
                    ) : (
                      <a className="pm-primary" href={requestUrl(v.id)}>
                        Gerar SDO preventiva
                        <ArrowUpRight size={16} />
                      </a>
                    ))}
                  <button onClick={onNavigateFleet}>
                    Ver cadastro / atualizar KM
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {plans.error && (
        <p role="alert">
          Não foi possível consultar os planos: {plans.error}
          <button onClick={plans.reload}>Tentar novamente</button>
        </p>
      )}
      <section className="pm-panel">
        <div className="pm-heading">
          <h2>
            <History size={19} />
            Solicitações preventivas recentes
          </h2>
          <a href="/manutencao/ordens-de-servico">Ver solicitações</a>
        </div>
        {history.loading ? (
          <p role="status">Carregando solicitações…</p>
        ) : history.error ? (
          <p role="alert">
            {history.error}
            <button onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </button>
          </p>
        ) : !history.rows.length ? (
          <p>Nenhuma solicitação preventiva registrada no banco.</p>
        ) : (
          <div className="pm-table">
            <table>
              <thead>
                <tr>
                  <th>Solicitação</th>
                  <th>Veículo</th>
                  <th>Urgência</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((o) => (
                  <tr key={o.id}>
                    <td>{o.numero}</td>
                    <td>
                      {directory.vehicles.find((v) => v.id === o.vehicle_id)
                        ?.placa || "Não informado"}
                    </td>
                    <td>{PRIORITIES[o.prioridade]}</td>
                    <td>{ORDER_STATUS[o.status]}</td>
                    <td>
                      <a href={"/manutencao/ordens-de-servico?os=" + o.id}>
                        Acompanhar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
