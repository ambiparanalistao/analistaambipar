import useCompliance from "../hooks/useCompliance";
import useFleetDirectory from "../hooks/useFleetDirectory";
import { validity } from "../utils/compliance";
import React, { useState, useEffect } from "react";
import {
  Layers,
  FileCheck2,
  Flame,
  Leaf,
  RefreshCw,
  Search,
  Calculator,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Fuel,
  Truck,
  Box,
  Wrench,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function LogisticsDashboard({
  user,
  onNavigateModule,
  maintenanceAccess,
}) {
  const licenses = useCompliance(maintenanceAccess?.companyId),
    fleet = useFleetDirectory(maintenanceAccess?.companyId);
  const licenseDue = licenses.rows.filter((l) =>
    ["vencida", "breve"].includes(validity(l.vencimento, l.indeterminada).key),
  );
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataSource, setDataSource] = useState("unavailable"); // 'audit' (Base Auditada 2026) ou 'supabase'

  // Busca dados do Supabase se configurado
  const loadRealData = async () => {
    if (!isSupabaseConfigured || !supabase || !maintenanceAccess?.companyId) {
      setRecords([]);
      setDataSource("unavailable");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registros_residuos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setRecords(data);
        setDataSource("supabase");
      } else {
        setRecords([]);
        setDataSource("unavailable");
      }
    } catch {
      setRecords([]);
      setDataSource("unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [maintenanceAccess?.companyId]);

  // Métricas apuradas
  const totalKg = records.reduce(
    (sum, row) => sum + (Number(row.quantidade_kg) || 0),
    0,
  );
  const totalTon = (totalKg / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });
  const totalMtrs = records.length;
  const totalClasseI = records.filter((r) => r.classe === "Classe I").length;
  const totalClasseII = records.filter((r) => r.classe === "Classe II").length;
  const activeRecords = records;
  const filteredRecords = activeRecords.filter((r) => {
    const s = searchTerm.toLowerCase();
    return (
      (r.empresa_origem && r.empresa_origem.toLowerCase().includes(s)) ||
      (r.tipo_residuo && r.tipo_residuo.toLowerCase().includes(s)) ||
      (r.classe && r.classe.toLowerCase().includes(s)) ||
      (r.destinacao_final && r.destinacao_final.toLowerCase().includes(s)) ||
      (r.placa_veiculo && r.placa_veiculo.toLowerCase().includes(s)) ||
      (r.numero_mtr && r.numero_mtr.toLowerCase().includes(s))
    );
  });

  return (
    <div
      className="logistics-dashboard animate-fade-in"
      id="logistics-dashboard-container"
    >
      {/* Top Banner de Boas-Vindas */}
      <div className="control-tower-banner">
        <div className="tower-header-text">
          <div className="tower-badge-live">
            <span className="live-dot"></span>
            <span>
              TORRE DE CONTROLE DE LOGÍSTICA & TRANSPORTE • Central de Gestão AMBIPAR
            </span>
          </div>
          <h2>Central de Gestão de Frota e Logística</h2>
          <p>
            Indicadores dos cadastros da empresa. Consulte os módulos para
            informações detalhadas e períodos específicos.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={loadRealData}
            disabled={loading}
            title="Recarregar dados auditados ou sincronizar banco"
          >
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
            <span>
              {dataSource === "supabase"
                ? "Sincronizar Banco"
                : "Sem dados confirmados"}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Alerta Crítico de Auditoria & Conformidade 2026 */}
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "12px",
          padding: "1rem 1.4rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.08)",
        }}
        id="compliance-critical-alert-banner"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f87171",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.2rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#f87171",
                  background: "rgba(239, 68, 68, 0.25)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                ALERTA DE VENCIMENTO Central de Gestão
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#fca5a5",
                  fontWeight: 700,
                }}
              >
                {licenses.loading
                  ? "Consultando licenças…"
                  : licenseDue.length
                    ? licenseDue.length +
                      " licença(s) vencida(s) ou com vencimento em até 30 dias"
                    : "Licenças acompanhadas na central de vencimentos"}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              Datas atualizadas na central são usadas neste painel. Consulte e
              renove os documentos na Auditoria e Vencimentos.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-icon-text"
          style={{
            background: "#ef4444",
            borderColor: "#dc2626",
            color: "#fff",
            whiteSpace: "nowrap",
          }}
          onClick={() =>
            onNavigateModule && onNavigateModule("auditoria_vencimentos")
          }
        >
          <ShieldAlert size={16} />
          <span>Abrir Central de Vencimentos</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Grid Principal de KPIs - Linha 1: Resíduos & Cargas */}
      <div className="kpi-metrics-grid">
        {/* KPI 1: Volume Real */}
        <div className="kpi-card" id="kpi-card-volume">
          <div className="kpi-top">
            <span className="kpi-title">Volume Total Movimentado</span>
            <div className="kpi-icon-wrap emerald">
              <Layers size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalTon}</span>
            <span className="unit-suffix">toneladas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Registros persistidos da empresa</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>
              {totalKg.toLocaleString("pt-BR")} kg movimentados no período
            </span>
          </div>
        </div>

        {/* KPI 2: Total de MTRs */}
        <div className="kpi-card" id="kpi-card-mtrs">
          <div className="kpi-top">
            <span className="kpi-title">Manifestos Registrados</span>
            <div className="kpi-icon-wrap cyan">
              <FileCheck2 size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalMtrs}</span>
            <span className="unit-suffix">MTRs</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Conformidade SINIR / INEA-RJ</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Consulte os certificados no registro de cada manifesto</span>
          </div>
        </div>

        {/* KPI 3: Resíduos Classe I Perigosos */}
        <div className="kpi-card" id="kpi-card-classe1">
          <div className="kpi-top">
            <span className="kpi-title">Resíduos Classe I (Perigosos)</span>
            <div className="kpi-icon-wrap forest">
              <Flame size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalClasseI}</span>
            <span className="unit-suffix">cargas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Efluentes, Borras Oleosas & PAE</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Incineração & Coprocessamento Seguro</span>
          </div>
        </div>

        {/* KPI 4: Resíduos Classe II */}
        <div className="kpi-card" id="kpi-card-classe2">
          <div className="kpi-top">
            <span className="kpi-title">
              Resíduos Classe II (Não Perigosos)
            </span>
            <div className="kpi-icon-wrap purple">
              <Leaf size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalClasseII}</span>
            <span className="unit-suffix">cargas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Inertes, Papelão & Sucatas Vale/Amazon</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Economia Circular & Reciclagem</span>
          </div>
        </div>
      </div>

      {/* Grid Secundário de KPIs Operacionais - Frota, Caçambas, Diesel e Manutenção */}
      <div className="kpi-metrics-grid" style={{ marginTop: "1.25rem" }}>
        {/* KPI 5: Frota Homologada */}
        <div className="kpi-card" id="kpi-card-frota">
          <div className="kpi-top">
            <span className="kpi-title">Frota Homologada (DCX & Vale)</span>
            <div className="kpi-icon-wrap cyan">
              <Truck size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{fleet.vehicles.length}</span>
            <span className="unit-suffix">veículos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>
              {fleet.vehicles.filter((v) => v.status === "Disponível").length}{" "}
              Disponíveis •{" "}
              {fleet.vehicles.filter((v) => v.status === "Em Viagem").length} Em
              rota •{" "}
              {fleet.vehicles.filter((v) => v.status === "Manutenção").length}{" "}
              Oficina •{" "}
              {fleet.vehicles.filter((v) => v.status === "Bloqueado").length}{" "}
              Bloqueados
            </code>
          </div>
          <div
            className="kpi-footer-status positive"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigateModule && onNavigateModule("frotas")}
          >
            <span>Gerenciar veículos cadastrados →</span>
          </div>
        </div>

        {/* KPI 6: Caçambas & Caixas */}
        <div className="kpi-card" id="kpi-card-cacambas">
          <div className="kpi-top">
            <span className="kpi-title">
              Caçambas & Caixas no Pátio/Clientes
            </span>
            <div className="kpi-icon-wrap amber">
              <Box size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">—</span>
            <span className="unit-suffix">ativos</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Inventário documental disponível na auditoria</code>
          </div>
          <div
            className="kpi-footer-status neutral"
            style={{ cursor: "pointer" }}
            onClick={() =>
              onNavigateModule && onNavigateModule("auditoria_vencimentos")
            }
          >
            <span>Exigência Laudo NR-11 Olhais →</span>
          </div>
        </div>

        {/* KPI 7: Diesel Abank Frota */}
        <div className="kpi-card" id="kpi-card-combustivel">
          <div className="kpi-top">
            <span className="kpi-title">Combustível Abank Frota (2026)</span>
            <div className="kpi-icon-wrap forest">
              <Fuel size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ fontSize: "1.45rem" }}>
              Consultar módulo
            </span>
          </div>
          <div className="kpi-formula-tag">
            <code>Totais disponíveis no módulo de combustível</code>
          </div>
          <div
            className="kpi-footer-status positive"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ cursor: "pointer" }}
              onClick={() =>
                onNavigateModule && onNavigateModule("combustivel")
              }
            >
              Auditar consumo →
            </span>
            <span
              style={{ cursor: "pointer", color: "#10b981", fontWeight: 700 }}
              onClick={() =>
                onNavigateModule && onNavigateModule("aporte_combustivel")
              }
            >
              Aporte Semanal (Quinta) →
            </span>
          </div>
        </div>

        {/* KPI 8: Manutenção Mecânica */}
        <div className="kpi-card" id="kpi-card-manutencao">
          <div className="kpi-top">
            <span className="kpi-title">Manutenção & Oficinas</span>
            <div className="kpi-icon-wrap purple">
              <Wrench size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number" style={{ fontSize: "1.45rem" }}>
              Consultar módulo
            </span>
          </div>
          <div className="kpi-formula-tag">
            <code>Indicadores no dashboard de manutenção</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>DRE de Custos Operacionais Central de Gestão</span>
          </div>
        </div>
      </div>

      {/* Banner de Acesso Rápido aos Módulos Operacionais Especializados */}
      <div
        className="dashboard-quick-modules-row"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="quick-access-banner-card highlight">
          <div className="banner-icon-circle emerald">
            <Calculator size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Módulo Avançado: Calculadora de Frete & Carbono</h4>
            <p>
              Faça a simulação analítica completa de rotas, DRE de custos
              (diesel, Arla 32, pedágios, manutenção, margem) e balanço de
              emissões GEE (GHG Protocol).
            </p>
          </div>
          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={() =>
              onNavigateModule && onNavigateModule("calculadora_frete")
            }
            id="go-to-freight-calculator-btn"
          >
            <span>Abrir Calculadora Completa</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="quick-access-banner-card">
          <div className="banner-icon-circle cyan">
            <ShieldAlert size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Central de Auditoria & Vencimentos 2026</h4>
            <p>
              Licenças, documentos da frota e dos motoristas, histórico de
              alterações e referências da auditoria.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() =>
              onNavigateModule && onNavigateModule("auditoria_vencimentos")
            }
            id="go-to-audit-vencimentos-btn"
          >
            <span>Auditoria 2026</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="quick-access-banner-card">
          <div className="banner-icon-circle amber">
            <Fuel size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Controle de Combustível & ARLA 32</h4>
            <p>
              Consulte abastecimentos, rendimento e custo por quilômetro no
              módulo de combustível.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => onNavigateModule && onNavigateModule("combustivel")}
            id="go-to-fuel-module-btn"
          >
            <span>Gerenciar Combustível</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Tabela de Dados Reais de Resíduos e Transportes */}
      <div
        className="card-panel live-board-panel"
        style={{ marginTop: "1.75rem" }}
      >
        <div className="live-board-header">
          <div>
            <h3>Registros Operacionais de Resíduos & Transportes</h3>
            <p>
              Cargas em trânsito e destinações homologadas da Unidade Duque de
              Caxias, Vale e Amazon
            </p>
          </div>

          <div className="table-controls-bar">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Filtrar por cliente, resíduo, placa ou MTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="operational-table" id="trips-monitoring-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>MTR / Romaneio</th>
                <th>Gerador (Origem)</th>
                <th>Tipo de Resíduo</th>
                <th>Classificação</th>
                <th>Quantidade (KG / Ton)</th>
                <th>Destinação Final</th>
                <th>Veículo & Condutor</th>
                <th>Status MTR</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{ textAlign: "center", padding: "2.5rem" }}
                  >
                    <span className="spinner"></span>
                    <p
                      style={{
                        marginTop: "0.5rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Consultando banco operacional...
                    </p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-table-state">
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--text-main)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Nenhum registro encontrado para o filtro aplicado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="date-tag">
                        {r.data_transporte ||
                          (r.data_descarte
                            ? new Date(r.data_descarte).toLocaleDateString(
                                "pt-BR",
                              )
                            : "Não informada")}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          color: "var(--accent-emerald)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        {r.numero_mtr || "Não informado"}
                      </code>
                    </td>
                    <td>
                      <strong>{r.empresa_origem}</strong>
                    </td>
                    <td>{r.tipo_residuo}</td>
                    <td>
                      <span
                        className={`badge-class ${r.classe?.includes("Classe I") ? "hazard" : "inert"}`}
                      >
                        {r.classe}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {(Number(r.quantidade_kg) || 0).toLocaleString("pt-BR")}{" "}
                        kg
                      </strong>
                      <small
                        style={{ display: "block", color: "var(--text-muted)" }}
                      >
                        {((Number(r.quantidade_kg) || 0) / 1000).toFixed(2)} t
                      </small>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.82rem" }}>
                        {r.destinacao_final}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--accent-cyan)",
                          }}
                        >
                          {r.placa_veiculo || "AMB-FROTA"}
                        </span>
                        <small style={{ color: "var(--text-muted)" }}>
                          {r.motorista || "Motorista Central de Gestão"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background:
                            r.status_mtr === "Em Trânsito"
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(16, 185, 129, 0.15)",
                          color:
                            r.status_mtr === "Em Trânsito"
                              ? "var(--accent-cyan)"
                              : "var(--accent-emerald-light)",
                          border: `1px solid ${r.status_mtr === "Em Trânsito" ? "rgba(6, 182, 212, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                        }}
                      >
                        {r.status_mtr || "Concluído"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
