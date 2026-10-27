import test from 'node:test';import assert from 'node:assert/strict';import {validatePlan,preventiveState,DEFAULT_PREVENTIVE_PLANS,computeVehiclePreventiveAlerts,generateFleetAlerts} from '../src/utils/planValidation.js';
const base={nome:'Óleo',vehicle_id:'v',categoria_veiculo:'',intervalo_km:1000,intervalo_dias:30,ultima_execucao_km:1000,ultima_execucao_data:'2026-10-01'};
test('plan requires an interval and exactly one scope',()=>{assert.ok(validatePlan({...base,intervalo_km:'',intervalo_dias:''},{km_atual:1000},'2026-10-23').intervalo_km);assert.ok(validatePlan({...base,categoria_veiculo:'caminhao'},{km_atual:1000},'2026-10-23').scope);assert.deepEqual(validatePlan(base,{km_atual:1000},'2026-10-23'),{});});
test('invalid intervals, future dates and odometer base rejected',()=>{for(const intervalo_km of [-1,1.5,'NaN',2147483648])assert.ok(validatePlan({...base,intervalo_km},{km_atual:1000},'2026-10-23').intervalo_km);assert.ok(validatePlan({...base,ultima_execucao_km:1001},{km_atual:1000},'2026-10-23').ultima_execucao_km);assert.ok(validatePlan({...base,ultima_execucao_data:'2027-01-01'},{km_atual:1000},'2026-10-23').ultima_execucao_data);});
test('first due threshold wins, including equality',()=>{assert.equal(preventiveState({km:2000,proximaKm:2000,proximaData:'2027-01-01',today:'2026-10-23'}),'vencida');assert.equal(preventiveState({km:0,proximaKm:2000,proximaData:'2026-10-23',today:'2026-10-23'}),'vencida');assert.equal(preventiveState({km:1500,proximaKm:2000,proximaData:null,today:'2026-10-23'}),'breve');assert.equal(preventiveState({km:1000,proximaKm:2000,proximaData:'2026-10-30',today:'2026-10-23'}),'breve');assert.equal(preventiveState({km:1000,proximaKm:2000,proximaData:'2026-10-31',today:'2026-10-23'}),'dia');});

test('automatic periodic plans are generated for vehicles based on KM', () => {
  assert.equal(DEFAULT_PREVENTIVE_PLANS.length, 6);
  const vehicleNew = { id: 'v-new', placa: 'AAA0001', tipo: 'Caminhão', km_atual: 1000 };
  const alertsNew = computeVehiclePreventiveAlerts(vehicleNew);
  assert.equal(alertsNew.length, 6);
  assert.ok(alertsNew.every(a => a.estado === 'dia'));
  const oilAlert = alertsNew.find(a => a.nome.includes('Óleo'));
  assert.equal(oilAlert.proxima_km, 10000);

  // Vehicle approaching oil change threshold (9600 km -> 400 km left -> breve)
  const vehicleSoon = { id: 'v-soon', placa: 'BBB0002', tipo: 'Caminhão', km_atual: 9600 };
  const alertsSoon = computeVehiclePreventiveAlerts(vehicleSoon);
  const oilSoon = alertsSoon.find(a => a.nome.includes('Óleo'));
  assert.equal(oilSoon.estado, 'breve');

  // Vehicle over threshold (10100 km -> overdue -> vencida)
  const vehicleOver = { id: 'v-over', placa: 'CCC0003', tipo: 'Caminhão', km_atual: 10100 };
  const alertsOver = computeVehiclePreventiveAlerts(vehicleOver);
  const oilOver = alertsOver.find(a => a.nome.includes('Óleo'));
  assert.equal(oilOver.estado, 'vencida');

  // Fleet alerts sort 'vencida' first
  const fleetAlerts = generateFleetAlerts([vehicleNew, vehicleSoon, vehicleOver]);
  assert.equal(fleetAlerts[0].estado, 'vencida');
});

