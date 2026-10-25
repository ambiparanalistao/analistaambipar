import CenteredDialog from './CenteredDialog';
import ComplianceDossier from "./ComplianceDossier";
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  FileCheck2,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Truck,
  Users,
  Sun,
  Moon,
  ArrowUpRight,
} from "lucide-react";
import useCompliance from "../hooks/useCompliance";
import useFleetDirectory from "../hooks/useFleetDirectory";
import { complianceCommand } from "../services/compliance";
import { updateRegistryStatus } from "../services/fleetDirectory";
import { supabase } from "../lib/supabaseClient";
import {
  VEHICLE_VALIDITIES,
  DRIVER_VALIDITIES,
  validity,
  displayDate,
  complianceToday,
} from "../utils/compliance";
import "./ComplianceAudit.css";
function Badge({ date, indeterminate, today }) {
  const s = validity(date, indeterminate, today);
  return (
    <span className={"ca-badge " + s.key}>
      {s.label}
      {s.days != null
        ? " · " + (s.days < 0 ? Math.abs(s.days) + "d em atraso" : s.days + "d")
        : ""}
    </span>
  );
}
function LicenseEditor({ license, busy, onSave, onCancel }) {
  const [f, setF] = useState(() => ({
    orgao: "",
    documento: "",
    numero: "",
    titular: "",
    emissao: "",
    vencimento: "",
    indeterminada: false,
    observacoes: "",
    ...license,
  }));
  return (
    <form
      className="ca-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave("license_save", f);
      }}
    >
      <fieldset disabled={busy}>
        <legend>{license?.id ? "Editar licença" : "Nova licença"}</legend>
        <div className="ca-form-grid">
          {[
            ["orgao", "Órgão emissor", true],
            ["documento", "Documento", true],
            ["numero", "Número / registro"],
            ["titular", "Titular / unidade"],
          ].map(([k, l, required]) => (
            <label key={k}>
              {l}
              <input
                required={required}
                maxLength={k === "orgao" ? 160 : 240}
                value={f[k] || ""}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </label>
          ))}
          <label>
            Emissão
            <input
              type="date"
              value={f.emissao || ""}
              onChange={(e) => setF((x) => ({ ...x, emissao: e.target.value }))}
            />
          </label>
          <label>
            Vencimento
            <input
              type="date"
              min={f.emissao || undefined}
              disabled={f.indeterminada}
              value={f.vencimento || ""}
              onChange={(e) =>
                setF((x) => ({ ...x, vencimento: e.target.value }))
              }
            />
          </label>
        </div>
        <label className="ca-checkbox">
          <input
            type="checkbox"
            checked={f.indeterminada}
            onChange={(e) =>
              setF((x) => ({
                ...x,
                indeterminada: e.target.checked,
                vencimento: e.target.checked ? "" : x.vencimento,
              }))
            }
          />
          Validade indeterminada
        </label>
        <label>
          Observações
          <textarea
            maxLength={4000}
            value={f.observacoes || ""}
            onChange={(e) =>
              setF((x) => ({ ...x, observacoes: e.target.value }))
            }
          />
        </label>
        <p>
          A atualização fica salva na empresa e será usada pelas demais telas e
          alertas.
        </p>
        <div className="ca-actions">
          <button className="ca-primary">
            {busy ? "Salvando…" : "Salvar licença"}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}
function DatesEditor({ entry, kind, busy, onSave, onCancel }) {
  const fields = kind === "vehicle" ? VEHICLE_VALIDITIES : DRIVER_VALIDITIES;
  const [dates, setDates] = useState(() =>
    Object.fromEntries(Object.keys(fields).map((k) => [k, entry[k] || ""])),
  );
  return (
    <form
      className="ca-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(kind === "vehicle" ? "vehicle_dates" : "driver_dates", {
          id: entry.id,
          dates,
          before: Object.fromEntries(
            Object.keys(fields).map((k) => [k, entry[k] ?? null]),
          ),
        });
      }}
    >
      <fieldset disabled={busy}>
        <legend>Atualizar validades · {entry.placa || entry.nome}</legend>
        <div className="ca-form-grid">
          {Object.entries(fields).map(([k, l]) => (
            <label key={k}>
              {l}
              <input
                required={k === "validade_cnh"}
                type="date"
                value={dates[k]}
                onChange={(e) =>
                  setDates((x) => ({ ...x, [k]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        {kind === "driver" && <p>Curso MOPP: validade indeterminada.</p>}
        <p>
          Estas datas atualizam o cadastro original, o prontuário, a auditoria e
          os alertas. A disponibilidade permanece sob controle manual.
        </p>
        <div className="ca-actions">
          <button className="ca-primary">
            {busy ? "Salvando…" : "Salvar validades"}
          </button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
    </form>
  );
}
export default function ComplianceAuditModule({ access }) {

  const [dossier, setDossier] = useState(false);
  const company = access?.companyId,
    licenses = useCompliance(company),
    directory = useFleetDirectory(company);
  const [containers, setContainers] = useState([]), [infractions, setInfractions] = useState([]), [operationalError, setOperationalError] = useState('');
  const loadOperationalAudit = async () => {
    if (!supabase || !company) { setContainers([]); setInfractions([]); return; }
    setOperationalError('');
    const [c, i] = await Promise.all([
      supabase.from('fleet_containers').select('*').eq('company_id', company).is('deleted_at', null).order('codigo'),
      supabase.from('vehicle_infractions').select('*').eq('company_id', company).is('deleted_at', null).order('data', { ascending: false }),
    ]);
    if (c.error || i.error) setOperationalError(c.error?.message || i.error?.message || 'Falha ao consultar auditoria.');
    setContainers(c.data || []); setInfractions((i.data || []).map(row => ({ ...row, ...(row.source_payload || {}) })));
  };
  useEffect(() => { loadOperationalAudit(); }, [company]);
  const [tab, setTab] = useState("licencas"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("todos"),
    [editor, setEditor] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState(null),
    [today, setToday] = useState(complianceToday),
    [theme, setTheme] = useState(() => {
      try {
        return localStorage.getItem("compliance_theme") || "dark";
      } catch {
        return "dark";
      }
    });
  useEffect(() => {
    const refreshDay = () => setToday(complianceToday());
    window.addEventListener("focus", refreshDay);
    return () => window.removeEventListener("focus", refreshDay);
  }, []);
  const refresh = () => {
    licenses.reload();
    directory.reload();
  };
  const canWrite = access?.canWrite;
  async function save(command, body) {
    setBusy(true);
    setError("");
    try {
      await complianceCommand(company, command, body);
      setNotice("Atualização salva. As demais áreas já usam os novos dados.");
      setEditor(null);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function status(kind, row, value) {
    setBusy(true);
    setError("");
    try {
      await updateRegistryStatus(
        kind === "veiculos" ? "veiculos" : "motoristas",
        row.id,
        value,
        company,
      );
      setNotice("Disponibilidade alterada manualmente e salva.");
      directory.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function showHistory(id) {
    setError("");
    try {
      setHistory(await complianceCommand(company, "history", { id }));
    } catch (e) {
      setError(e.message);
    }
  }
  const counts = {
    total: licenses.rows.length,
    vencida: 0,
    breve: 0,
    regular: 0,
    pendente: 0,
  };
  for (const l of licenses.rows) {
    const k = validity(l.vencimento, l.indeterminada, today).key;
    counts[k] = (counts[k] || 0) + 1;
  }
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const match = (row) =>
    !term ||
    Object.values(row).some(
      (v) =>
        typeof v === "string" && v.toLocaleLowerCase("pt-BR").includes(term),
    );
  const visibleLicenses = licenses.rows.filter(
    (l) =>
      match(l) &&
      (filter === "todos" ||
        validity(l.vencimento, l.indeterminada, today).key === filter),
  );
  const current = tab === "veiculos" ? directory.vehicles : directory.drivers;
  async function exportAudit(pdf) {
    setError("");
    try {
      const rows =
        tab === "licencas"
          ? visibleLicenses
          : ["veiculos", "motoristas"].includes(tab)
            ? current.filter(match)
            : (tab === "cacambas"
                ? containers
                : infractions
              ).filter(match);
      const exporters = await import("../utils/complianceExports");
      const metadata = [
        ["Empresa", access.membership?.nome || company],
        ["Área", tab],
        ["Busca", search || "Sem busca"],
        ["Situação", filter],
      ];
      if (pdf) exporters.exportCompliancePdf(tab, rows, metadata);
      else exporters.exportComplianceExcel(tab, rows, metadata);
    } catch (e) {
      setError(e.message);
    }
  }
  function changeTab(t) {
    setTab(t);
    setSearch("");
    setFilter("todos");
    setEditor(null);
    setHistory(null);
    setError("");
  }
  if (dossier && access?.canRead)
    return (
      <section className="ca-page" data-ca-theme={theme}>
        <ComplianceDossier
          company={access.membership?.nome || company}
          licenses={licenses.rows}
          vehicles={directory.vehicles}
          drivers={directory.drivers}
          containers={containers}
          infractions={infractions}
          onBack={() => setDossier(false)}
        />
      </section>
    );
  return (
    <section className="ca-page" data-ca-theme={theme}>
      <header className="ca-hero">
        <div>
          <span className="ca-eyebrow">
            <ShieldCheck size={15} />
            CONFORMIDADE · CONTROLE · TRANSPARÊNCIA
          </span>
          <h1>Auditoria e Vencimentos</h1>
          <p>
            Documentos organizados. Prazos visíveis. Atualizações que acompanham
            a operação.
          </p>
          <label className="ca-company">
            Empresa{" "}
            <select
              aria-label="Empresa da auditoria"
              disabled={busy}
              value={company || ""}
              onChange={(e) => access.selectCompany(e.target.value)}
            >
              {(access?.memberships || [])
                .filter(
                  (m) =>
                    m.full_module_access ||
                    [
                      "admin_geral",
                      "admin_empresa",
                      "analista_transporte",
                      "supervisor",
                      "operador_logistico",
                    ].includes(m.roleName),
                )
                .map((m) => (
                  <option key={m.company_id} value={m.company_id}>
                    {m.nome}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="ca-actions">
          <button
            onClick={() =>
              setTheme((t) => {
                const v = t === "dark" ? "light" : "dark";
                try {
                  localStorage.setItem("compliance_theme", v);
                } catch {
                  /* Preference only. */
                }
                return v;
              })
            }
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}Modo{" "}
            {theme === "dark" ? "claro" : "escuro"}
          </button>
          <button disabled={busy} onClick={refresh}>
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            disabled={licenses.loading || directory.loading || !access?.canRead}
            onClick={() => setDossier(true)}
          >
            Dossiê Fiscalização
          </button>
          <button
            disabled={licenses.loading || directory.loading}
            onClick={() => exportAudit(false)}
          >
            Excel
          </button>
          <button
            disabled={licenses.loading || directory.loading}
            onClick={() => exportAudit(true)}
          >
            PDF
          </button>
        </div>
      </header>
      {access?.loading ? (
        <p role="status">Verificando empresa…</p>
      ) : !access?.canRead ? (
        <p role="alert">
          Entre com um perfil autorizado e selecione a empresa.
        </p>
      ) : (
        <>
          <div className="ca-kpis">
            {[
              ["todos", "Licenças cadastradas", counts.total, FileCheck2],
              ["vencida", "Vencidas", counts.vencida, AlertTriangle],
              ["breve", "Próximos 30 dias", counts.breve, CalendarClock],
              ["regular", "Em dia", counts.regular, ShieldCheck],
            ].map(([k, label, n, Icon]) => (
              <button
                key={k}
                className={"ca-kpi " + k}
                aria-pressed={tab === "licencas" && filter === k}
                onClick={() => {
                  changeTab("licencas");
                  setFilter(k);
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
                <strong>{n}</strong>
              </button>
            ))}
          </div>
          <nav className="ca-tabs" aria-label="Áreas da auditoria">
            {[
              ["licencas", "Licenças e certificados", FileCheck2],
              ["veiculos", "Validades dos veículos", Truck],
              ["motoristas", "Validades dos motoristas", Users],
              ["cacambas", "Inventário auditado", ShieldCheck],
              ["multas", "Infrações auditadas", AlertTriangle],
            ].map(([k, l, Icon]) => (
              <button
                disabled={busy}
                key={k}
                aria-pressed={tab === k}
                onClick={() => changeTab(k)}
              >
                <Icon size={17} />
                {l}
              </button>
            ))}
          </nav>
          <div className="ca-toolbar">
            <label>
              <Search size={18} />
              <input
                aria-label="Buscar na auditoria"
                placeholder={
                  tab === "licencas"
                    ? "Buscar documento, órgão, número ou titular…"
                    : "Buscar placa, nome ou identificação…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {tab === "licencas" && (
              <select
                aria-label="Filtrar situação"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="todos">Todas as situações</option>
                <option value="vencida">Vencidas</option>
                <option value="breve">Vencem em até 30 dias</option>
                <option value="regular">Em dia</option>
                <option value="pendente">Sem data</option>
                <option value="indeterminada">Indeterminadas</option>
              </select>
            )}
            {canWrite && tab === "licencas" && (
              <button
                className="ca-primary"
                disabled={busy}
                onClick={() => {
                  setEditor({ kind: "license", row: {} });
                  setHistory(null);
                }}
              >
                <Plus size={17} />
                Nova licença
              </button>
            )}
          </div>
          {error && !editor && (
            <p className="ca-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="ca-notice" role="status">
              {notice}
            </p>
          )}
          
          {editor && <CenteredDialog title={editor.kind==='license'?(editor.row.id?'Editar licença':'Nova licença'):'Atualizar documentos · '+(editor.row.placa||editor.row.nome)} className="ca-page" theme={theme} busy={busy} error={error} onClose={()=>setEditor(null)}>
            {editor.kind === "license" ? (
              <LicenseEditor
                key={editor.row.id || "new"}
                license={editor.row}
                busy={busy}
                onSave={save}
                onCancel={() => setEditor(null)}
              />
            ) : (
              <DatesEditor
                key={editor.row.id}
                entry={editor.row}
                kind={editor.kind}
                busy={busy}
                onSave={save}
                onCancel={() => setEditor(null)}
              />
            )}</CenteredDialog>}
          {history && (
            <section className="ca-panel">
              <div className="ca-heading">
                <h2>Histórico de atualizações</h2>
                <button onClick={() => setHistory(null)}>
                  Fechar histórico
                </button>
              </div>
              {!history.length ? (
                <p>Nenhuma alteração registrada.</p>
              ) : (
                history.map((h) => (
                  <article className="ca-history" key={h.id}>
                    <strong>
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </strong>
                    <p>
                      {h.action === "license_save"
                        ? "Licença salva"
                        : "Validades atualizadas"}{" "}
                      · {h.actor_name || "Usuário autenticado"}
                    </p>
                    {h.before_data && (
                      <p>
                        Vencimento anterior:{" "}
                        {displayDate(h.before_data.vencimento)} →{" "}
                        {displayDate(h.after_data.vencimento)}
                      </p>
                    )}
                  </article>
                ))
              )}
            </section>
          )}
          {licenses.loading || directory.loading ? (
            <p role="status">Carregando dados da empresa…</p>
          ) : licenses.error || directory.error || operationalError ? (
            <div className="ca-panel" role="alert">
              <p>{licenses.error || directory.error || operationalError}</p>
              <button onClick={refresh}>Tentar novamente</button>
            </div>
          ) : (
            <>
              {tab === "licencas" && (
                <>
                  <div className="ca-heading">
                    <div>
                      <h2>Licenças e certificados</h2>
                      <p>
                        {visibleLicenses.length} documentos · {counts.pendente}{" "}
                        sem data informada
                      </p>
                    </div>
                    <small>Salvar aqui atualiza a central e o painel</small>
                  </div>
                  <div className="ca-license-grid">
                    {!visibleLicenses.length ? (
                      <div className="ca-empty">
                        Nenhuma licença encontrada nesta situação.
                      </div>
                    ) : (
                      visibleLicenses.map((l) => (
                        <article className="ca-license" key={l.id}>
                          <div className="ca-license-top">
                            <span className="ca-org">{l.orgao}</span>
                            <Badge
                              date={l.vencimento}
                              indeterminate={l.indeterminada}
                              today={today}
                            />
                          </div>
                          <h3>{l.documento}</h3>
                          <p className="ca-license-number">
                            {l.numero || "Número não informado"}
                          </p>
                          <dl>
                            <div>
                              <dt>Titular / unidade</dt>
                              <dd>{l.titular || "Não informado"}</dd>
                            </div>
                            <div>
                              <dt>Emissão</dt>
                              <dd>{displayDate(l.emissao)}</dd>
                            </div>
                            <div>
                              <dt>Vencimento</dt>
                              <dd>
                                {l.indeterminada
                                  ? "Indeterminado"
                                  : displayDate(l.vencimento)}
                              </dd>
                            </div>
                          </dl>
                          {l.observacoes && (
                            <details>
                              <summary>Observações</summary>
                              <p>{l.observacoes}</p>
                            </details>
                          )}
                          <footer>
                            {canWrite && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  setEditor({ kind: "license", row: l })
                                }
                              >
                                <Pencil size={15} />
                                Editar e atualizar
                              </button>
                            )}
                            <button onClick={() => showHistory(l.id)}>
                              Histórico
                              <ArrowUpRight size={14} />
                            </button>
                          </footer>
                        </article>
                      ))
                    )}
                  </div>
                </>
              )}
              {["veiculos", "motoristas"].includes(tab) && (
                <>
                  <div className="ca-heading">
                    <div>
                      <h2>
                        {tab === "veiculos"
                          ? "Documentos da frota"
                          : "Prontuário dos motoristas"}
                      </h2>
                      <p>
                        {current.filter(match).length} cadastros da empresa.
                        Disponibilidade alterada somente por você.
                      </p>
                    </div>
                  </div>
                  <div className="ca-register-grid">
                    {!current.filter(match).length ? (
                      <p className="ca-empty">
                        Nenhum cadastro encontrado no banco da empresa.
                      </p>
                    ) : (
                      current.filter(match).map((r) => (
                        <article className="ca-panel" key={r.id}>
                          <div className="ca-heading">
                            <div>
                              <h3>{tab === "veiculos" ? r.placa : r.nome}</h3>
                              <p>
                                {tab === "veiculos"
                                  ? r.marca_modelo
                                  : "CNH " +
                                    (r.categoria_cnh || "Não informada")}
                              </p>
                            </div>
                            <span className="ca-status">
                              {r.status || "Não informado"}
                            </span>
                          </div>
                          {canWrite && (
                            <label className="ca-status-control">
                              Disponibilidade manual
                              <select
                                aria-label={
                                  "Disponibilidade de " + (r.placa || r.nome)
                                }
                                disabled={busy}
                                value={r.status || ""}
                                onChange={(e) => status(tab, r, e.target.value)}
                              >
                                {(tab === "veiculos"
                                  ? [
                                      "Disponível",
                                      "Em Viagem",
                                      "Manutenção",
                                      "Bloqueado",
                                    ]
                                  : [
                                      "Disponível",
                                      "Em Viagem",
                                      "Folga",
                                      "Bloqueado",
                                    ]
                                ).map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            </label>
                          )}
                          <div className="ca-validity-list">
                            {Object.entries(
                              tab === "veiculos"
                                ? VEHICLE_VALIDITIES
                                : DRIVER_VALIDITIES,
                            ).map(([k, label]) => (
                              <div key={k}>
                                <span>{label}</span>
                                <strong>{displayDate(r[k])}</strong>
                                <Badge date={r[k]} today={today} />
                              </div>
                            ))}
                            {tab === "motoristas" && (
                              <div>
                                <span>Curso MOPP</span>
                                <strong>Validade indeterminada</strong>
                              </div>
                            )}
                          </div>
                          {canWrite && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                setEditor({
                                  kind:
                                    tab === "veiculos" ? "vehicle" : "driver",
                                  row: r,
                                })
                              }
                            >
                              <Pencil size={15} />
                              Editar validades
                            </button>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </>
              )}
              {["cacambas", "multas"].includes(tab) && (
                <section className="ca-panel">
                  <h2>
                    {tab === "cacambas"
                      ? "Inventário da auditoria"
                      : "Infrações da auditoria"}
                  </h2>
                  <p className="ca-muted">
                    Referência documental da base auditada. As disponibilidades
                    operacionais são consultadas nos cadastros da empresa.
                  </p>
                  <div className="ca-reference-grid">
                    {(tab === "cacambas"
                      ? containers
                      : infractions
                    )
                      .filter(match)
                      .map((r, i) => (
                        <details key={r.id || r.codigo || r.ait || i}>
                          <summary>
                            {r.codigo ||
                              r.placa ||
                              r.nome ||
                              "Registro " + (i + 1)}{" "}
                            · {r.nome || r.ait || r.status || "Detalhes"}
                          </summary>
                          <dl>
                            {Object.entries(r)
                              .filter(([k]) => k !== "id")
                              .map(([k, v]) => (
                                <div key={k}>
                                  <dt>{k.replaceAll("_", " ")}</dt>
                                  <dd>{String(v ?? "Não informado")}</dd>
                                </div>
                              ))}
                          </dl>
                        </details>
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
