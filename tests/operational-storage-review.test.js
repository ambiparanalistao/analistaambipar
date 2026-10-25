import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewedLocalEntriesToRemove } from '../src/utils/operationalStorageReview.js';
const entry = { key: 'vehicles', value: [{ plate: 'ABC', nested: { b: 2, a: 1 } }] };
const row = (overrides = {}) => ({ source_key: 'user-1:vehicles', review_status: 'importado', created_at: '2026-10-25T10:00:00Z', payload: { value: [{ plate: 'ABC', nested: { a: 1, b: 2 } }] }, ...overrides });
test('allows cleanup only for unchanged latest finalized snapshot of the same user', () => {
  assert.deepEqual(reviewedLocalEntriesToRemove([entry], [row()], 'user-1', true), [entry]);
  assert.deepEqual(reviewedLocalEntriesToRemove([entry], [row()], 'other-user', true), []);
  assert.deepEqual(reviewedLocalEntriesToRemove([entry], [row()], 'user-1', false), []);
});
test('keeps changed local data and snapshots still pending review', () => {
  const changed = { ...entry, value: [{ plate: 'NEW' }] };
  assert.deepEqual(reviewedLocalEntriesToRemove([changed], [row()], 'user-1', true), []);
  assert.deepEqual(reviewedLocalEntriesToRemove([entry], [row({ review_status: 'aprovado' })], 'user-1', true), []);
});
test('uses the newest same-user snapshot, never an older finalized copy', () => {
  const newer = row({ created_at: '2026-10-26T10:00:00Z', review_status: 'pendente', payload: { value: [{ plate: 'NEW' }] } });
  assert.deepEqual(reviewedLocalEntriesToRemove([entry], [row(), newer], 'user-1', true), []);
});