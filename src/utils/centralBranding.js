import { generateManagerWhatsAppMessage as managerMessage } from '../data/weeklyFuelProvisionData.js';

export const presentCentralText = value => String(value ?? '').replace(/Analista de Logística[^\n]*?CCO(?: Ambipar)?/g, 'Analista de Transporte').replace(/\bCCO\b/g, 'Central de Gestão');
export const generateManagerWhatsAppMessage = (...args) => presentCentralText(managerMessage(...args));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));

export function renderCentralAporte(doc = {}, isGlobalAporte = false, withTechnicalMotives = true, customQuotas = null) {
  const vehicles = Array.isArray(doc.veiculos) ? doc.veiculos : [];
  const rows = vehicles.map(v => `<tr><td>${escapeHtml(v.placa)}</td><td>${escapeHtml(v.modelo)}</td><td>${escapeHtml(v.operacao)}</td><td>${Number(v.kmRodado)||0}</td><td>${Number(v.litrosDieselTotal)||0}</td><td>R$ ${Number(v.valorTotalGasto||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>R$ ${Number(customQuotas?.[v.placa] ?? v.solicitacaoAporteSugerido ?? 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td></tr>`).join('');
  const total = Number(doc.valorTotalSolicitado) || 0;
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Relatório de aporte · Central de Gestão de Frota e Logística</title><style>body{font:14px Arial;margin:32px;color:#17212b}header{margin-bottom:18px;color:#16794a;font-size:13px;letter-spacing:.04em}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}.summary{display:flex;gap:24px;margin:24px 0}</style></head><body><header>Central de Gestão de Frota e Logística</header><h1>Relatório de aporte</h1><p>${escapeHtml(doc.numeroProtocolo || 'Protocolo não informado')}</p><p>${escapeHtml(doc.cicloNome || 'Ciclo não informado')} · ${escapeHtml(doc.dataFechamento || 'Data não informada')}</p><div class="summary"><div>Veículos: ${vehicles.length}</div><div>Solicitado: R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div>Convênio: ${escapeHtml(doc.convenio || 'Não informado')}</div></div>${withTechnicalMotives ? `<p>${escapeHtml(doc.motivoGeral || 'Justificativa não informada.')}</p>` : ''}<p>Modalidade: ${isGlobalAporte ? 'Aporte global' : 'Divisão por veículo'}</p><table><thead><tr><th>Placa</th><th>Modelo</th><th>Operação</th><th>KM</th><th>Diesel (L)</th><th>Gasto (R$)</th><th>Aporte (R$)</th></tr></thead><tbody>${rows || '<tr><td colspan="7">Nenhum veículo registrado neste documento.</td></tr>'}</tbody></table></body></html>`;
}

export function printAporteDossierCleanWindow(...args) {
  const win = window.open('', '_blank', 'width=1050,height=900,menubar=no,toolbar=no');
  if (!win) { window.alert('Permita a abertura de pop-ups para imprimir o relatório.'); return; }
  win.document.open(); win.document.write(renderCentralAporte(...args)); win.document.close(); win.focus();
}
