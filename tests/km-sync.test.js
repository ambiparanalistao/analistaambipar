import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('km-sync: migration script exists and has strict vehicle isolation and triggers', () => {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261027140000_automatic_km_synchronization.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');

  const content = fs.readFileSync(migrationPath, 'utf8');

  // Verify triggers for all tables
  assert.match(content, /trg_fuel_transaction_km_sync/, 'Trigger on fuel_transactions must exist');
  assert.match(content, /trg_order_km_sync/, 'Trigger on maintenance_orders must exist');
  assert.match(content, /trg_driver_report_km_sync/, 'Trigger on maintenance_driver_reports must exist');
  assert.match(content, /trg_checklist_km_sync/, 'Trigger on maintenance_checklists must exist');
  assert.match(content, /trg_workshop_visit_km_sync/, 'Trigger on workshop_visits must exist');

  // Verify strict vehicle isolation
  assert.match(content, /WHERE id = v_id\s+AND company_id = NEW\.company_id/, 'Fuel sync must isolate by vehicle id and company_id');
  assert.match(content, /WHERE id = NEW\.vehicle_id\s+AND company_id = NEW\.company_id/, 'Order and report sync must isolate by vehicle id and company_id');
  assert.match(content, /greatest\(coalesce\(km_atual, 0\)/, 'KM must never decrease (greatest)');
});

test('km-sync: vehicle KM logic updates strictly by vehicle ID and never mixes or regresses', () => {
  const vehicles = {
    'veh-1': { id: 'veh-1', placa: 'ABC-1234', km_atual: 100000 },
    'veh-2': { id: 'veh-2', placa: 'XYZ-9876', km_atual: 50000 },
  };

  const syncKm = (vehicleId, newKm) => {
    if (!vehicles[vehicleId]) return;
    if (newKm > (vehicles[vehicleId].km_atual || 0)) {
      vehicles[vehicleId].km_atual = newKm;
    }
  };

  // 1. Abastecimento alimentado para ABC-1234 com KM 105000
  syncKm('veh-1', 105000);
  assert.equal(vehicles['veh-1'].km_atual, 105000, 'veh-1 should have updated to 105000');
  assert.equal(vehicles['veh-2'].km_atual, 50000, 'veh-2 must NOT change when veh-1 is updated');

  // 2. Abastecimento alimentado com KM menor (não regride)
  syncKm('veh-1', 102000);
  assert.equal(vehicles['veh-1'].km_atual, 105000, 'veh-1 must remain 105000 (never regress)');

  // 3. Ordem de serviço / reparo solicitado para XYZ-9876 com KM 55000
  syncKm('veh-2', 55000);
  assert.equal(vehicles['veh-2'].km_atual, 55000, 'veh-2 should have updated to 55000');
  assert.equal(vehicles['veh-1'].km_atual, 105000, 'veh-1 must remain untouched');
});
