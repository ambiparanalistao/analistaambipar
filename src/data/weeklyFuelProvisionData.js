export const DEFAULT_CYCLE_SETTINGS = {
  gestorNome: '', gestorCargo: '', analistaResponsavel: '', analistaCargo: '', convenioPadrao: '',
};
export const INITIAL_WEEKLY_CYCLES = [];
export const INITIAL_APORTE_DOCUMENTS_HISTORY = [];

const active = (vehicles = []) => vehicles.filter(v => v.recebeAporteAmbipar !== false);
const round2 = value => Number((Number(value) || 0).toFixed(2));

export function distributeByHistoricalWeight(targetTotal, vehicles = []) {
  const rows = active(vehicles), result = {};
  const weightTotal = rows.reduce((sum, v) => sum + (Number(v.valorTotalGasto) || Number(v.litrosDieselTotal) || 0), 0);
  let used = 0;
  rows.forEach((v, index) => {
    const weight = Number(v.valorTotalGasto) || Number(v.litrosDieselTotal) || 0;
    const amount = index === rows.length - 1 ? round2(targetTotal - used) : round2(weightTotal ? targetTotal * weight / weightTotal : targetTotal / rows.length);
    result[v.placa] = amount; used += amount;
  });
  vehicles.filter(v => v.recebeAporteAmbipar === false).forEach(v => { result[v.placa] = 0; });
  return result;
}
export function distributeEqually(targetTotal, vehicles = []) {
  const rows = active(vehicles), result = {};
  let used = 0;
  rows.forEach((v, i) => { const amount = i === rows.length - 1 ? round2(targetTotal - used) : round2(targetTotal / rows.length); result[v.placa] = amount; used += amount; });
  vehicles.filter(v => v.recebeAporteAmbipar === false).forEach(v => { result[v.placa] = 0; });
  return result;
}
export function distributeByKm(targetTotal, vehicles = []) {
  const rows = active(vehicles), total = rows.reduce((sum, v) => sum + (Number(v.kmRodado) || 0), 0);
  if (!total) return distributeEqually(targetTotal, vehicles);
  const result = {}; let used = 0;
  rows.forEach((v, i) => { const amount = i === rows.length - 1 ? round2(targetTotal - used) : round2(targetTotal * (Number(v.kmRodado) || 0) / total); result[v.placa] = amount; used += amount; });
  vehicles.filter(v => v.recebeAporteAmbipar === false).forEach(v => { result[v.placa] = 0; });
  return result;
}
export function calculateCycleTotals(cycle, marginPct = 0, customQuotas = null, isGlobalAporte = false, targetGlobalTotal = 0) {
  const vehicles = cycle?.veiculosAbastecidos || [];
  const totalGasto = vehicles.reduce((s, v) => s + (Number(v.valorTotalGasto) || 0), 0);
  const totalKm = vehicles.reduce((s, v) => s + (Number(v.kmRodado) || 0), 0);
  const totalDiesel = vehicles.reduce((s, v) => s + (Number(v.litrosDieselTotal) || 0), 0);
  const totalArla = vehicles.reduce((s, v) => s + (Number(v.litrosArlaTotal) || 0), 0);
  const eligible = active(vehicles);
  const totalAporteSugerido = isGlobalAporte ? Number(targetGlobalTotal) || 0 : eligible.reduce((s, v) => s + (Number(customQuotas?.[v.placa] ?? v.solicitacaoAporteSugerido) || 0), 0);
  return { totalVeiculos: vehicles.length, veiculosComCota: eligible.length, veiculosValeZero: vehicles.length - eligible.length,
    totalGasto, totalKm, totalDiesel, totalArla, mediaFrotaKmL: totalDiesel ? (totalKm / totalDiesel).toFixed(2) : '0.00',
    totalAporteSugerido, precoMedioDiesel: totalDiesel ? (totalGasto / totalDiesel).toFixed(2) : '0.00',
    margemTotalRS: round2(totalAporteSugerido - totalGasto), margemPct: Number(marginPct) || 0 };
}
export function generateManagerWhatsAppMessage(cycle, settings = DEFAULT_CYCLE_SETTINGS, marginPct = 0, withTechnicalMotives = false, isGlobalAporte = false, customQuotas = null) {
  if (!cycle) return 'Nenhum ciclo de aporte cadastrado.';
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte, cycle.valorTotalAporteAlvo);
  const lines = [`Solicitação de aporte de combustível`, `Ciclo: ${cycle.nome || 'Não informado'}`, `Período: ${cycle.periodoInicio || '—'} a ${cycle.periodoFim || '—'}`,
    `Empresa/convênio: ${settings.convenioPadrao || 'Não informado'}`, `Veículos: ${totals.totalVeiculos}`, `Total gasto: R$ ${totals.totalGasto.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,
    `Total solicitado: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR',{minimumFractionDigits:2})}`];
  if (withTechnicalMotives) lines.push(`Justificativa: ${cycle.motivoGeralSolicitacao || 'Não informada.'}`);
  for (const v of cycle.veiculosAbastecidos || []) lines.push(`${v.placa || 'Placa não informada'} · ${v.modelo || 'Modelo não informado'} · R$ ${Number(customQuotas?.[v.placa] ?? v.solicitacaoAporteSugerido ?? 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`);
  return lines.join('\n');
}
export function exportCycleToCSV(cycle, marginPct = 0, isGlobalAporte = false, customQuotas = null) {
  if (!cycle) return;
  const esc = v => `"${String(v ?? '').replaceAll('"','""')}"`;
  const rows = [['Placa','Modelo','Operação','KM','Diesel (L)','Gasto (R$)','Aporte (R$)'], ...(cycle.veiculosAbastecidos || []).map(v => [v.placa,v.modelo,v.operacao,v.kmRodado,v.litrosDieselTotal,v.valorTotalGasto,customQuotas?.[v.placa] ?? v.solicitacaoAporteSugerido])];
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte, cycle.valorTotalAporteAlvo);
  rows.push(['TOTAL','','',totals.totalKm,totals.totalDiesel,totals.totalGasto,totals.totalAporteSugerido]);
  const blob = new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(';')).join('\n')], {type:'text/csv;charset=utf-8'});
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `aporte-${cycle.id || 'ciclo'}.csv`; link.click(); URL.revokeObjectURL(link.href);
}
const htmlEscape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function printAporteDossierCleanWindow(doc, isGlobalAporte = false, withTechnicalMotives = false, customQuotas = null) {
  if (!doc) return;
  const vehicles = doc.veiculos || [];
  const totals = calculateCycleTotals({veiculosAbastecidos:vehicles}, doc.margemPct || 0, customQuotas, isGlobalAporte, doc.valorTotalSolicitado);
  const rows = vehicles.map(v => `<tr><td>${htmlEscape(v.placa)}</td><td>${htmlEscape(v.modelo)}</td><td>${Number(v.kmRodado)||0}</td><td>${Number(v.litrosDieselTotal)||0}</td><td>${Number(v.valorTotalGasto||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${Number(customQuotas?.[v.placa]??v.solicitacaoAporteSugerido??0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td></tr>`).join('');
  const w=window.open('','_blank','width=1050,height=900'); if(!w){window.alert('Permita pop-ups para imprimir o relatório.');return;}
  w.document.write(`<!doctype html><html lang="pt-br"><meta charset="utf-8"><title>Relatório de aporte</title><style>body{font:14px Arial;margin:32px;color:#17212b}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}.summary{display:flex;gap:24px;margin:24px 0}</style><h1>Relatório de aporte</h1><p>${htmlEscape(doc.cicloNome || doc.numeroProtocolo || 'Ciclo')}</p><div class="summary"><div>Veículos: ${totals.totalVeiculos}</div><div>Gasto: R$ ${totals.totalGasto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div>Total solicitado: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>${withTechnicalMotives?`<p>${htmlEscape(doc.motivoGeral||'')}</p>`:''}<table><thead><tr><th>Placa</th><th>Modelo</th><th>KM</th><th>Diesel</th><th>Gasto</th><th>Aporte</th></tr></thead><tbody>${rows}</tbody></table></html>`);
  w.document.close(); w.focus(); w.print();
}
