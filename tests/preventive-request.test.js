import test from "node:test";
import assert from "node:assert/strict";
import {
  preventiveRequestInitial,
  preventiveRequestDescription,
} from "../src/utils/preventiveRequest.js";
import { PREVENTIVE_RULES } from "../src/data/preventiveMaintenanceData.js";
test("SDO descreve todas as preventivas sem registrar execução nem modificar KM", () => {
  const vehicle = { id: "vehicle", km_atual: 123456 };
  const initial = preventiveRequestInitial(vehicle, [
    { nome: "Revisão do tacógrafo", estado: "vencida" },
  ]);
  assert.equal(initial.km_abertura, 123456);
  assert.equal(vehicle.km_atual, 123456);
  assert.equal(initial.tipo, "preventiva");
  assert.equal(initial.prioridade, "alta");
  for (const rule of PREVENTIVE_RULES)
    assert.ok(initial.descricao_problema.includes(rule.nome));
  assert.ok(initial.descricao_problema.includes("Revisão do tacógrafo"));
  assert.ok(initial.descricao_problema.includes("Serviços adicionais"));
  assert.equal(initial.status, undefined);
});
test("odômetro ausente fica em branco e plano duplicado não repete serviço", () => {
  assert.equal(
    preventiveRequestInitial({ id: "vehicle", km_atual: null }).km_abertura,
    "",
  );
  const text = preventiveRequestDescription([
    { nome: PREVENTIVE_RULES[0].nome },
  ]);
  assert.equal(text.split(PREVENTIVE_RULES[0].nome).length, 2);
});
