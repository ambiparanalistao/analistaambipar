export function preventiveRequestDescription(plans = []) {
  const items = [
    ...plans.map((p) => ({ name: p.nome, description: "" })),
  ];
  const unique = [
    ...new Map(
      items.map((i) => [i.name.trim().toLocaleLowerCase("pt-BR"), i]),
    ).values(),
  ];
  return [
    "SDO — SOLICITAÇÃO DE ORÇAMENTO PREVENTIVO",
    unique.length
      ? "Solicitar avaliação e orçamento dos planos cadastrados abaixo, conforme aplicação ao veículo e especificações do fabricante. Não executar sem aprovação."
      : "Não há plano preventivo cadastrado para este veículo. Descreva os serviços que devem ser avaliados antes de enviar às oficinas.",
    ...unique.map(
      (i, n) =>
        n + 1 + ". " + i.name + (i.description ? ": " + i.description : ""),
    ),
    "Informar peças, mão de obra, NCM quando aplicável e prazo em dias corridos após aprovação do orçamento.",
    "Serviços adicionais / defeitos observados:",
  ].join("\n\n");
}
export function preventiveRequestInitial(vehicle, plans = []) {
  return {
    vehicle_id: vehicle.id,
    tipo: "preventiva",
    prioridade: plans.some((p) => p.estado === "vencida") ? "alta" : "media",
    km_abertura: vehicle.km_atual ?? "",
    descricao_problema: preventiveRequestDescription(plans),
  };
}

