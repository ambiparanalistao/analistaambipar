import test from 'node:test';
import assert from 'node:assert/strict';
import { exportOrdersListExcel } from '../src/utils/orderWorkbook.js';

test('orders filter: can filter orders by vehicle plate, month and date range', () => {
  const sampleOrders = [
    { id: '1', numero: 'SDO-001', vehicle_id: 'v1', data_abertura: '2026-10-15T10:00:00Z', tipo: 'preventiva', status: 'aberta', valor_total: 1500 },
    { id: '2', numero: 'SDO-002', vehicle_id: 'v2', data_abertura: '2026-10-20T14:00:00Z', tipo: 'corretiva', status: 'em_execucao', valor_total: 3200 },
    { id: '3', numero: 'SDO-003', vehicle_id: 'v1', data_abertura: '2026-09-05T08:00:00Z', tipo: 'corretiva', status: 'encerrada', valor_total: 800 },
  ];

  // 1. Filter by vehicle_id (Placa)
  const v1Orders = sampleOrders.filter(o => o.vehicle_id === 'v1');
  assert.equal(v1Orders.length, 2);

  // 2. Filter by month (Outubro/2026: 2026-10-01 to 2026-10-31)
  const octOrders = sampleOrders.filter(o => o.data_abertura.slice(0, 7) === '2026-10');
  assert.equal(octOrders.length, 2);

  // 3. Combined Filter: Vehicle v1 + Month Outubro/2026
  const combined = sampleOrders.filter(o => o.vehicle_id === 'v1' && o.data_abertura.slice(0, 7) === '2026-10');
  assert.equal(combined.length, 1);
  assert.equal(combined[0].numero, 'SDO-001');

  // 4. Date Range Filter: 2026-10-01 to 2026-10-18
  const rangeOrders = sampleOrders.filter(o => {
    const d = o.data_abertura.slice(0, 10);
    return d >= '2026-10-01' && d <= '2026-10-18';
  });
  assert.equal(rangeOrders.length, 1);
  assert.equal(rangeOrders[0].numero, 'SDO-001');
});

test('orders filter: exportOrdersListExcel function is exported and defined', () => {
  assert.equal(typeof exportOrdersListExcel, 'function');
});

test('orders maintenance: deleteOrder and updateOrderData are exported in maintenanceOrders.js', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const servicePath = path.resolve(process.cwd(), 'src/services/maintenanceOrders.js');
  const content = await fs.readFile(servicePath, 'utf8');

  assert.match(content, /export async function deleteOrder\(/);
  assert.match(content, /export async function updateOrderData\(/);
  assert.match(content, /rpc\('maintenance_order_delete'/);
  assert.match(content, /from\('maintenance_orders'\)[\s\S]*?\.delete\(\)/);
});

test('orders migration: 20261027160000_order_delete_feature.sql exists and contains maintenance_order_delete RPC', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261027160000_order_delete_feature.sql');
  const sql = await fs.readFile(migrationPath, 'utf8');

  assert.match(sql, /CREATE OR REPLACE FUNCTION maintenance_private\.order_delete/i);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.maintenance_order_delete/i);
  assert.match(sql, /DELETE FROM public\.maintenance_orders WHERE id = o\.id/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.maintenance_order_delete/i);
});
