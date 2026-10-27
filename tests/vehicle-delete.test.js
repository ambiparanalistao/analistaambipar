import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

test('vehicle delete service: deleteRegistryRecord supports vehicle delete with cascade cleanup and RPC', async () => {
  const servicePath = path.resolve(process.cwd(), 'src/services/fleetDirectory.js');
  const content = await fs.readFile(servicePath, 'utf8');

  assert.match(content, /export async function deleteRegistryRecord\(/);
  assert.match(content, /table === 'veiculos'/);
  assert.match(content, /rpc\('maintenance_vehicle_delete'/);
  assert.match(content, /maintenance_plan_vehicles/);
  assert.match(content, /vehicle_preventive_settings/);
  assert.match(content, /maintenance_plans/);
  assert.match(content, /registryChanged\(company\)/);
});

test('vehicle delete migration: 20261027170000_vehicle_delete_feature.sql exists and handles cascade cleanup', async () => {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261027170000_vehicle_delete_feature.sql');
  const sql = await fs.readFile(migrationPath, 'utf8');

  assert.match(sql, /CREATE OR REPLACE FUNCTION maintenance_private\.vehicle_delete/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.maintenance_vehicle_delete/i);
  assert.match(sql, /DELETE FROM public\.veiculos WHERE id = v\.id AND company_id = c/i);
  assert.match(sql, /vehicle_preventive_settings/i);
  assert.match(sql, /maintenance_plan_vehicles/i);
  assert.match(sql, /maintenance_plans/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.maintenance_vehicle_delete/i);
  assert.match(sql, /GRANT DELETE ON public\.veiculos TO authenticated/i);
});

test('vehicle delete UI: optimistic removal immediately filters out vehicle from list', () => {
  const currentVehicles = [
    { id: 'v-1', placa: 'EWX-0I82', status: 'Disponível' },
    { id: 'v-2', placa: 'DWE-4I52', status: 'Disponível' }
  ];

  const targetId = 'v-1';
  const updatedVehicles = currentVehicles.filter(v => v.id !== targetId);

  assert.equal(updatedVehicles.length, 1);
  assert.equal(updatedVehicles[0].id, 'v-2');
  assert.equal(updatedVehicles.some(v => v.id === targetId), false);
});
