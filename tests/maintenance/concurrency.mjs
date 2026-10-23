// Disposable CI PostgreSQL only. Never connects to Supabase or a production URL.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const container = process.env.MAINTENANCE_TEST_CONTAINER;
if (!container || !/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Set MAINTENANCE_TEST_CONTAINER to the isolated Docker service ID');
function sql(text) {
  return new Promise((resolve,reject) => {
    const child=spawn('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{stdio:['pipe','pipe','pipe']});
    let out='',err='';
    child.stdout.on('data',chunk=>{out+=chunk;});
    child.stderr.on('data',chunk=>{err+=chunk;});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve(out.trim()):reject(new Error(err)));
    child.stdin.end(text);
  });
}
const company='11000000-0000-0000-0000-000000000001';
const user='21000000-0000-0000-0000-000000000001';
const vehicle='31000000-0000-0000-0000-000000000001';
const partner='41000000-0000-0000-0000-000000000001';
await sql(`
INSERT INTO auth.users(id,email) VALUES('${user}','concurrency@example.invalid');
INSERT INTO public.companies(id,nome,created_by) VALUES('${company}','Concurrent fixture','${user}');
INSERT INTO public.company_members(company_id,user_id,role,created_by) VALUES('${company}','${user}','administrador','${user}');
INSERT INTO public.veiculos(id,company_id,placa,tipo,marca_modelo) VALUES('${vehicle}','${company}','CONCUR1','caminhao','Fixture');
INSERT INTO public.maintenance_partners(id,company_id,created_by,razao_social) VALUES('${partner}','${company}','${user}','Concurrent partner');
`);
const results=await Promise.all(Array.from({length:16},(_,i)=>sql(`
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','${user}',true);
INSERT INTO public.maintenance_orders(company_id,vehicle_id,partner_id,descricao_problema,data_abertura)
VALUES('${company}','${vehicle}','${partner}','Concurrent ${i}','2026-10-01T00:00:00Z') RETURNING numero;
COMMIT;
`)));
assert.equal(results.length,16);
const numbers=(await sql(`SELECT numero FROM public.maintenance_orders WHERE company_id='${company}' ORDER BY numero;`)).split('\n');
assert.equal(numbers.length,16);
assert.equal(new Set(numbers).size,16);
assert.equal(numbers[0],'OS-2026-0001');
assert.equal(numbers.at(-1),'OS-2026-0016');
console.log('16 simultaneous orders: unique sequential numbers, no lost updates.');

const ids=(await sql(`SELECT id FROM public.maintenance_orders WHERE company_id='${company}' ORDER BY numero;`)).split('\n');
await Promise.all(ids.map(id=>sql(`
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','${user}',true);
UPDATE public.maintenance_orders SET status='encerrada' WHERE id='${id}';
COMMIT;
`)));
assert.equal(await sql(`SELECT status FROM public.veiculos WHERE id='${vehicle}';`),'Disponível');
assert.equal(await sql(`SELECT count(*) FROM public.maintenance_orders WHERE company_id='${company}' AND status='encerrada';`),'16');
console.log('16 simultaneous closures: vehicle released only after the last active order.');

await sql(`
INSERT INTO public.maintenance_orders(id,company_id,created_by,vehicle_id,partner_id,descricao_problema)
VALUES('51000000-0000-0000-0000-000000000001','${company}','${user}','${vehicle}','${partner}','Concurrent items');
`);
await Promise.all(Array.from({length:12},(_,i)=>sql(`
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','${user}',true);
INSERT INTO public.maintenance_order_items(company_id,order_id,tipo,descricao,quantidade,valor_unitario)
VALUES('${company}','51000000-0000-0000-0000-000000000001','peca','Item ${i}',1,10);
COMMIT;
`)));
assert.equal(await sql("SELECT valor_total FROM public.maintenance_orders WHERE id='51000000-0000-0000-0000-000000000001';"),'120.00');
console.log('12 simultaneous item inserts: totals are consistent.');

const optionalSeed=await readFile(new URL('../../supabase/seeds/maintenance_optional.sql',import.meta.url),'utf8');
await sql(`SELECT set_config('maintenance.seed_company_id','${company}',false);
SELECT set_config('maintenance.seed_user_id','${user}',false);
SELECT set_config('maintenance.seed_vehicle_id','${vehicle}',false);
`+optionalSeed);
assert.equal(await sql(`SELECT count(*) FROM public.maintenance_orders WHERE company_id='${company}' AND observacoes='OPTIONAL_SEED_STAGE_1';`),'5');
assert.equal(await sql(`SELECT count(*) FROM public.maintenance_plans WHERE company_id='${company}';`),'2');
assert.equal(await sql(`SELECT count(*) FROM public.maintenance_partners WHERE company_id='${company}' AND razao_social LIKE 'DEMONSTRAÇÃO%';`),'3');
console.log('Optional seed verified: 3 partners, 5 orders, 2 plans in explicitly chosen company.');
