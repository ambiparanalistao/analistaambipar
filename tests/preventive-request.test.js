import test from "node:test";
import assert from "node:assert/strict";
import {
  preventiveRequestInitial,
  preventiveRequestDescription,
} from "../src/utils/preventiveRequest.js";
test("SDO descreve todas as preventivas sem registrar execução nem modificar KM", () => {
  const vehicle = { id: "vehicle", km_atual: 123456 };
  const plans = [
    { nome: "Troca de óleo", estado: "em_dia" },
    { nome: "Revisão do tacógrafo", estado: "vencida" },
  ];
  const initial = preventiveRequestInitial(vehicle, plans);
  assert.equal(initial.km_abertura, 123456);
  assert.equal(vehicle.km_atual, 123456);
  assert.equal(initial.tipo, "preventiva");
  assert.equal(initial.prioridade, "alta");
  for (const plan of plans)
    assert.ok(initial.descricao_problema.includes(plan.nome));
  assert.ok(initial.descricao_problema.includes("Revisão do tacógrafo"));
  assert.ok(initial.descricao_problema.includes("Serviços adicionais"));
  assert.equal(initial.status, undefined);
});
test("odômetro ausente fica em branco e plano duplicado não repete serviço", () => {
  assert.equal(
    preventiveRequestInitial({ id: "vehicle", km_atual: null }).km_abertura,
    "",
  );
  const text = preventiveRequestDescription([{ nome: "Troca de óleo" }]);
  assert.equal(text.split("Troca de óleo").length, 2);
  assert.ok(!text.includes("Troca de filtros"));
});
