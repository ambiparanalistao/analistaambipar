const day = (value) => Date.parse(String(value).slice(0, 10) + "T12:00:00Z");
export function preventiveProgress(plan, currentKm, today) {
  const numeric = (v) =>
    v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
  const kmKnown =
    numeric(currentKm) &&
    numeric(plan.proxima_km) &&
    numeric(plan.ultima_execucao_km) &&
    Number(plan.proxima_km) > Number(plan.ultima_execucao_km);
  const timeKnown =
    Number.isFinite(day(plan.proxima_data)) &&
    Number.isFinite(day(plan.ultima_execucao_data)) &&
    day(plan.proxima_data) > day(plan.ultima_execucao_data);
  const percentages = [];
  if (kmKnown)
    percentages.push(
      ((Number(currentKm) - Number(plan.ultima_execucao_km)) /
        (Number(plan.proxima_km) - Number(plan.ultima_execucao_km))) *
        100,
    );
  if (timeKnown)
    percentages.push(
      ((day(today) - day(plan.ultima_execucao_data)) /
        (day(plan.proxima_data) - day(plan.ultima_execucao_data))) *
        100,
    );
  return {
    percent: percentages.length
      ? Math.round(Math.max(0, Math.min(100, Math.max(...percentages))))
      : null,
    remainingKm: kmKnown ? Number(plan.proxima_km) - Number(currentKm) : null,
    remainingDays: timeKnown
      ? Math.ceil((day(plan.proxima_data) - day(today)) / 86400000)
      : null,
  };
}
export function preventiveRuleMatches(rule, name) {
  const text = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return rule.id === "oleo_filtros"
    ? text.includes("oleo")
    : rule.id === "engraxamento"
      ? text.includes("engrax") || text.includes("lubrificacao")
      : rule.id === "freios"
        ? text.includes("freio")
        : rule.id === "filtro_ar_racor"
          ? (text.includes("filtro") && !text.includes("oleo")) ||
            text.includes("racor")
          : rule.nome === name;
}
