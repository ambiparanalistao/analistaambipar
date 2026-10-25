import React from "react";
import { ArrowLeft, Printer, FileCheck2 } from "lucide-react";
import {
  VEHICLE_VALIDITIES,
  DRIVER_VALIDITIES,
  displayDate,
} from "../utils/compliance";
const hidden = new Set([
  "id",
  "company_id",
  "user_id",
  "created_by",
  "updated_by",
  "source_key",
  "version",
]);
const labels = {
  placa: "Placa",
  marca_modelo: "Marca / modelo",
  ano: "Ano",
  chassi: "Chassi",
  renavam: "Renavam",
  nome: "Nome",
  cpf: "CPF",
  telefone: "Contato",
  cnh: "CNH",
  categoria_cnh: "Categoria CNH",
  status: "Disponibilidade manual",
  km_atual: "Odômetro (km)",
  orgao: "Órgão",
  documento: "Documento",
  numero: "Número",
  titular: "Titular",
  emissao: "Emissão",
  vencimento: "Vencimento",
  observacoes: "Observações",
  ...VEHICLE_VALIDITIES,
  ...DRIVER_VALIDITIES,
};
function value(key, v, row) {
  if (key === "validade_mopp") return "Validade indeterminada";
  if (key === "vencimento" && row.indeterminada)
    return "Validade indeterminada";
  if (v === null || v === undefined || v === "") return "Não informado";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "object") return JSON.stringify(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return displayDate(v);
  return String(v);
}
function Records({ title, rows }) {
  return (
    <section className="ca-dossier-section">
      <h2>
        {title} <small>({rows.length})</small>
      </h2>
      {!rows.length ? (
        <p>Nenhum registro nesta seleção.</p>
      ) : (
        rows.map((row, i) => (
          <article className="ca-panel" key={row.id || i}>
            <h3>
              {row.placa ||
                row.nome ||
                row.documento ||
                row.codigo ||
                row.ait ||
                "Registro " + (i + 1)}
            </h3>
            <dl className="ca-dossier-fields">
              {Object.entries(row)
                .filter(([k]) => !hidden.has(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{labels[k] || k.replaceAll("_", " ")}</dt>
                    <dd>{value(k, v, row)}</dd>
                  </div>
                ))}
            </dl>
          </article>
        ))
      )}
    </section>
  );
}
export default function ComplianceDossier({
  company,
  licenses,
  vehicles,
  drivers,
  containers,
  infractions,
  onBack,
}) {
  return (
    <section className="ca-dossier" aria-label="Dossiê de fiscalização">
      <header className="ca-heading ca-no-print">
        <button onClick={onBack}>
          <ArrowLeft size={16} />
          Voltar à central
        </button>
        <button onClick={() => window.print()}>
          <Printer size={16} />
          Imprimir / salvar PDF
        </button>
      </header>
      <header className="ca-panel">
        <span className="ca-eyebrow">
          <FileCheck2 size={16} />
          DOSSIÊ DE CONFORMIDADE REGULATÓRIA
        </span>
        <h1>Documentos e prontuários da empresa</h1>
        <p>
          {company} · Emitido em {new Date().toLocaleString("pt-BR")}
        </p>
        <p>
          Licenças, veículos e motoristas refletem os cadastros persistidos.
          Datas ausentes permanecem não informadas. Disponibilidade manual não
          substitui a análise documental.
        </p>
      </header>
      <Records title="Licenças e certificados" rows={licenses} />
      <Records title="Prontuários dos veículos" rows={vehicles} />
      <Records
        title="Prontuários dos motoristas"
        rows={drivers.map((r) => ({ ...r, validade_mopp: "Indeterminada" }))}
      />
      <p className="ca-muted">
        As seções abaixo são referências documentais da auditoria de origem, sem
        atualização operacional automática.
      </p>
      <Records
        title="Inventário auditado — referência documental"
        rows={containers}
      />
      <Records
        title="Infrações auditadas — referência documental"
        rows={infractions}
      />
    </section>
  );
}
