import test from 'node:test';
import assert from 'node:assert/strict';
import {validDocument,maskDocument,maskPhone,maskCep,emptyPartner,validatePartner,partnerPayload,validateAttachment,maintenanceRole,readableRole,writableRole} from '../src/utils/partnerValidation.js';
const valid=()=>({...emptyPartner(),razao_social:'Oficina Teste',cnpj_cpf:'11.222.333/0001-81',telefone:'(11) 99999-1234',logradouro:'Rua Teste',numero:'10',bairro:'Centro',cidade:'São Paulo',estado:'SP',cep:'01001-000'});
test('CPF, numeric CNPJ and alphanumeric CNPJ checksums',()=>{
 assert.equal(validDocument('529.982.247-25'),true);
 assert.equal(validDocument('11.222.333/0001-81'),true);
 assert.equal(validDocument('12.ABC.345/01DE-35'),true);
 assert.equal(validDocument('111.111.111-11'),false);
 assert.equal(validDocument('11.222.333/0001-82'),false);
 assert.equal(validDocument('12.ABC.345/01DE-36'),false);
});
test('masks preserve letters and normalize contacts',()=>{
 assert.equal(maskDocument('12ABC34501DE35'),'12.ABC.345/01DE-35');
 assert.equal(maskDocument('52998224725'),'529.982.247-25');
 assert.equal(maskPhone('11999991234'),'(11) 99999-1234');
 assert.equal(maskCep('01001000'),'01001-000');
});
test('valid partner and mandatory identity/contact/address',()=>{
 assert.deepEqual(validatePartner(valid()),{});
 const errors=validatePartner({...emptyPartner(),estado:'XX',cep:'123'});
 for(const key of ['razao_social','cnpj_cpf','telefone','logradouro','numero','cidade','estado','cep'])assert.ok(errors[key]);
});
test('block requires a reason and numeric fields are constrained',()=>{
 const errors=validatePartner({...valid(),status:'bloqueado',motivo_bloqueio:'',desconto_percentual:101,valor_hora_mao_obra:-1,prazo_pagamento_dias:1.5});
 for(const key of ['motivo_bloqueio','desconto_percentual','valor_hora_mao_obra','prazo_pagamento_dias'])assert.ok(errors[key]);
});
test('coordinates and opening hours validation',()=>{
 assert.ok(validatePartner({...valid(),latitude:91,longitude:0}).latitude);
 assert.ok(validatePartner({...valid(),latitude:1,longitude:''}).latitude);
 assert.ok(validatePartner({...valid(),horario_funcionamento:{seg:{aberto:true,inicio:'18:00',fim:'08:00'}}}).horario_funcionamento);
 assert.equal(validatePartner({...valid(),atende_24h:true,horario_funcionamento:{seg:{aberto:true,inicio:'18:00',fim:'08:00'}}}).horario_funcionamento,undefined);
});
test('payload whitelist excludes tenant, actor and calculated fields',()=>{
 const payload=partnerPayload({...valid(),company_id:'forged',created_by:'other',version:100,sla_medio_dias:0});
 for(const key of ['company_id','created_by','version','sla_medio_dias'])assert.equal(key in payload,false);
 assert.equal(payload.cnpj_cpf,'11222333000181');assert.equal(payload.telefone,'11999991234');
 assert.equal(payload.latitude,null);assert.equal(payload.atende_24h,false);
});
test('private documents enforce extension, MIME and size',()=>{
 assert.equal(validateAttachment({name:'contrato.pdf',type:'application/pdf',size:100}),null);
 assert.ok(validateAttachment({name:'script.html',type:'text/html',size:100}));
 assert.ok(validateAttachment({name:'contrato.pdf',type:'text/html',size:100}));
 assert.ok(validateAttachment({name:'contrato.pdf',type:'application/pdf',size:21*1024*1024}));
});
test('module permissions and legacy profile mappings',()=>{
 assert.equal(maintenanceRole({role:'gestor'}),'supervisor');
 assert.equal(writableRole('supervisor'),false);assert.equal(readableRole('operador_logistico'),true);
 assert.equal(readableRole('motorista'),false);assert.equal(readableRole('cliente'),false);
 assert.equal(writableRole('admin_geral'),true);assert.equal(writableRole('analista_transporte'),true);
 assert.equal(maintenanceRole({role:'administrador',maintenance_role:'motorista'}),'motorista');
});
