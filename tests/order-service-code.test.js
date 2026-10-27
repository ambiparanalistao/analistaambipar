import test from 'node:test';
import assert from 'node:assert/strict';
import { LC116_SERVICE_CODES, getOrderCodigoServico, getItemFiscalCode } from '../src/utils/orderValidation.js';

test('LC116 service codes list is defined and contains essential fleet maintenance codes', () => {
  assert.ok(Array.isArray(LC116_SERVICE_CODES) && LC116_SERVICE_CODES.length >= 5);
  const codes = LC116_SERVICE_CODES.map(c => c.code);
  assert.ok(codes.includes('14.01'), 'Includes 14.01 maintenance');
  assert.ok(codes.includes('14.02'), 'Includes 14.02 assistance');
  assert.ok(codes.includes('14.04'), 'Includes 14.04 tires');
});

test('getOrderCodigoServico extracts code from order object, description tag, or items', () => {
  // Direct column
  assert.equal(getOrderCodigoServico({ codigo_servico: '14.01' }), '14.01');
  
  // Tag in description
  assert.equal(getOrderCodigoServico({ descricao_problema: 'Barulho no freio\n\n[Cód. Serviço: 14.01 - Mecânica]' }), '14.01 - Mecânica');
  
  // From items
  const items = [
    { tipo: 'peca', ncm: '87083090' },
    { tipo: 'servico', codigo_servico: '14.01' }
  ];
  assert.equal(getOrderCodigoServico({}, items), '14.01');
});
