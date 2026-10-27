import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlan, preventiveState, DEFAULT_PREVENTIVE_PLANS, computeVehiclePreventiveAlerts, generateFleetAlerts } from '../src/utils/planValidation.js';

const base = { nome: 'Óleo', vehicle_id: 'v', categoria_veiculo: '', intervalo_km: 1000, intervalo_dias: 30, ultima_execucao_km: 1000, ultima_execucao_data: '2026-10-01' };

test('plan requires an interval and exactly one scope', () => {
  assert.ok(validatePlan({ ...base, intervalo_km: '', intervalo_dias: '' }, { km_atual: 1000 }, '2026-10-23').intervalo_km);
  assert.ok(validatePlan({ ...base, categoria_veiculo: 'caminhao' }, { km_atual: 1000 }, '2026-10-23').scope);
  assert.deepEqual(validatePlan(base, { km_atual: 1000 }, '2026-10-23'), {});
  // Global fleet scope is valid
  assert.deepEqual(validatePlan({ ...base, vehicle_id: '', categoria_veiculo: 'TODOS' }, { km_atual: 1000 }, '2026-10-23'), {});
});

test('invalid intervals, future dates and odometer base rejected', () => {
  for (const intervalo_km of [-1, 1.5, 'NaN', 2147483648]) {
    assert.ok(validatePlan({ ...base, intervalo_km }, { km_atual: 1000 }, '2026-10-23').intervalo_km);
  }
  assert.ok(validatePlan({ ...base, ultima_execucao_km: 1001 }, { km_atual: 1000 }, '2026-10-23').ultima_execucao_km);
  assert.ok(validatePlan({ ...base, ultima_execucao_data: '2027-01-01' }, { km_atual: 1000 }, '2026-10-23').ultima_execucao_data);
});

test('first due threshold wins, including equality', () => {
  assert.equal(preventiveState({ km: 2000, proximaKm: 2000, proximaData: '2027-01-01', today: '2026-10-23' }), 'vencida');
  assert.equal(preventiveState({ km: 0, proximaKm: 2000, proximaData: '2026-10-23', today: '2026-10-23' }), 'vencida');
  assert.equal(preventiveState({ km: 1500, proximaKm: 2000, proximaData: null, today: '2026-10-23' }), 'breve');
  assert.equal(preventiveState({ km: 1000, proximaKm: 2000, proximaData: '2026-10-30', today: '2026-10-23' }), 'breve');
  // Explicit 500 km antecedência
  assert.equal(preventiveState({ km: 1000, proximaKm: 2000, proximaData: '2026-10-31', today: '2026-10-23', antecedenciaKm: 500 }), 'dia');
  // Default 1500 km threshold: 1600 km remaining is 'dia', 1500 km remaining triggers 'breve'
  assert.equal(preventiveState({ km: 400, proximaKm: 2000, proximaData: '2026-10-31', today: '2026-10-23' }), 'dia');
  assert.equal(preventiveState({ km: 500, proximaKm: 2000, proximaData: '2026-10-31', today: '2026-10-23' }), 'breve');
});

test('automatic periodic plans are generated for vehicles based on KM', () => {
  assert.equal(DEFAULT_PREVENTIVE_PLANS.length, 6);
  const vehicleNew = { id: 'v-new', placa: 'AAA0001', tipo: 'Caminhão', km_atual: 1000 };
  const alertsNew = computeVehiclePreventiveAlerts(vehicleNew);
  assert.equal(alertsNew.length, 6);
  assert.ok(alertsNew.every(a => a.estado === 'dia'));
  const oilAlert = alertsNew.find(a => a.nome.includes('Óleo'));
  assert.equal(oilAlert.proxima_km, 10000);

  // Vehicle approaching 1500 km threshold (8600 km -> 1400 km remaining -> triggers 'breve')
  const vehicleSoon = { id: 'v-soon', placa: 'BBB0002', tipo: 'Caminhão', km_atual: 8600 };
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

  // Universal fleet plans with categoria_veiculo='TODOS'
  const customTodosPlan = [
    { id: 'p-todos', nome: 'Revisão Universal', intervalo_km: 15000, intervalo_dias: 365, categoria_veiculo: 'TODOS', ativo: true }
  ];
  const todosAlerts = generateFleetAlerts([vehicleNew], customTodosPlan);
  assert.equal(todosAlerts.length, 1);
  assert.equal(todosAlerts[0].nome, 'Revisão Universal');
});

test('custom programmed KM editing updates vehicle milestones and alerts', () => {
  const vehicle = { id: 'v-truck', placa: 'TEST-1234', tipo: 'Cavalo Mecânico', km_atual: 13800 };

  // Plan with 20.000 km: at 13.800 km, remaining is 6.200 km > 1.500 km -> 'dia'
  const plan20k = [
    { id: 'p-brakes', nome: 'Sistema de Freios', intervalo_km: 20000, intervalo_dias: 365, categoria_veiculo: 'TODOS', ativo: true }
  ];
  const alerts20k = computeVehiclePreventiveAlerts(vehicle, plan20k);
  assert.equal(alerts20k[0].proxima_km, 20000);
  assert.equal(alerts20k[0].estado, 'dia');

  // User edits programmed KM to 15.000 km: next is 15.000 km (at 13.800 km, remaining is 1.200 km <= 1.500 km -> triggers 'breve'!)
  const plan15k = [
    { id: 'p-oil-15k', nome: 'Troca de Óleo de Motor', intervalo_km: 15000, intervalo_dias: 180, categoria_veiculo: 'TODOS', ativo: true }
  ];
  const alerts15k = computeVehiclePreventiveAlerts(vehicle, plan15k);
  assert.equal(alerts15k[0].proxima_km, 15000);
  assert.equal(alerts15k[0].estado, 'breve');
});
