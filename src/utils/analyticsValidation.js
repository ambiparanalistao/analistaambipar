export const REPORTS={vehicles:'Custos por veículo',partners:'Custos por oficina',types:'Custos por tipo',history:'Histórico de S.D.O',downtime:'Downtime por veículo'};
export function initialAnalyticsFilters(search=window.location.search,today=new Date().toLocaleDateString('en-CA')){const q=new URLSearchParams(search);return{start:q.get('start')||today.slice(0,4)+'-01-01',end:q.get('end')||today,branch_id:q.get('branch_id')||'',vehicle_id:q.get('vehicle_id')||'',partner_id:q.get('partner_id')||'',tipo:q.get('tipo')||''};}
export function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function validateAnalyticsFilters(f){if(!validDate(f.start)||!validDate(f.end)||f.end<f.start||(Date.parse(f.end)-Date.parse(f.start))/86400000>3660)return 'Informe um período válido de até 10 anos.';return '';}
export function analyticsQuery(filters){return new URLSearchParams(Object.entries(filters).filter(([,v])=>v)).toString();}
export const metricMoney=v=>v==null?'Sem dados':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const metricNumber=v=>v==null?'Sem dados':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});
export function exportText(v){const s=String(v??'');return /^[=+@-]/.test(s)?"'"+s:s;}
