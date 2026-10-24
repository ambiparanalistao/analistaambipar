import {test} from 'node:test';import assert from 'node:assert/strict';import {quoteRecipients,validQuoteTypes} from '../src/utils/quoteFilters.js';
const partner=(id,types,status='ativo')=>({id,status,onboarding_profile:{tipos_oficina:types}});
const rows=[partner('mechanic',['Oficina mecânica']),partner('wash',['Lavagem']),partner('parts',['Peças e acessórios']),partner('multi',['Auto elétrica','Oficina mecânica']),partner('inactive',['Oficina mecânica'],'inativo'),partner('missing',undefined),{...partner('deleted',['Oficina mecânica']),deleted_at:'2026-10-24'}];
test('no selection sends to nobody',()=>assert.deepEqual(quoteRecipients(rows,[]),[]));
test('only explicit matching labels; missing, deleted and inactive excluded',()=>assert.deepEqual(quoteRecipients(rows,['oficina_mecanica']).map(p=>p.id),['mechanic','multi']));
test('multiple type OR with distinct recipients',()=>assert.deepEqual(quoteRecipients(rows,['lavagem','pecas_acessorios']).map(p=>p.id),['wash','parts']));
test('primary type alone never matches',()=>assert.deepEqual(quoteRecipients([{tipo:'oficina_mecanica',status:'ativo'}],['oficina_mecanica']),[]));
test('reject arbitrary filters',()=>{assert.equal(validQuoteTypes(['invented']),false);assert.equal(validQuoteTypes([]),true);assert.equal(validQuoteTypes(['pecas_acessorios']),true);});
