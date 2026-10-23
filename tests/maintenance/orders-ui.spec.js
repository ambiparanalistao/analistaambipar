import {test,expect} from '@playwright/test';
const company='12000000-0000-4000-8000-000000000001',id='42000000-0000-4000-8000-000000000001',userId='22000000-0000-4000-8000-000000000001';
async function boot(page,role='admin_geral'){
 const user={id:userId,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Usuário teste'},app_metadata:{provider:'email'}};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600;const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp}))+'.signature';localStorage.setItem('sb-maintenance-fixture-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 let partner={id,company_id:company,razao_social:'Oficina Horizonte Ltda',nome_fantasia:'Horizonte',cnpj_cpf:'11222333000181',tipo:'oficina_mecanica',especialidades:['Freios'],tipos_veiculo_atendidos:['Caminhão'],contato_nome:'João',telefone:'11987654321',whatsapp:null,email:'oficina@example.invalid',cep:'01001000',logradouro:'Praça da Sé',numero:'10',complemento:null,bairro:'Sé',cidade:'São Paulo',estado:'SP',pais:'BR',latitude:-23.55,longitude:-46.63,horario_funcionamento:{},atende_24h:true,possui_guincho:true,valor_hora_mao_obra:100,prazo_pagamento_dias:30,desconto_percentual:5,status:'ativo',motivo_bloqueio:null,avaliacao_interna:4,sla_medio_dias:null,version:1};
 const files=[],queries=[],items=[],timeline=[],visits=[];let order={id:'53000000-0000-4000-8000-000000000001',company_id:company,numero:'OS-2026-0001',vehicle_id:'33000000-0000-4000-8000-000000000001',partner_id:id,driver_id:null,tipo:'corretiva',prioridade:'alta',descricao_problema:'Freio',diagnostico:null,servicos_executados:null,km_abertura:1000,km_entrada:null,km_saida:null,data_abertura:'2026-10-01T10:00:00Z',previsao_entrega:'2026-10-02T10:00:00Z',status:'aberta',orcamento_status:'pendente',valor_pecas:0,valor_mao_obra:0,valor_total:0,version:1};let fleet={id:order.vehicle_id,placa:'ABC1D23',marca_modelo:'Caminhão teste',km_atual:1000,status:'Disponível'};
 await page.route('https://maintenance-fixture.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop(),method=request.method();queries.push(url);
 let data=[];
 if(method==='OPTIONS'){await route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'}});return;}
 if(url.pathname.includes('/auth/'))data=user;
 else if(table==='company_members')data=[{company_id:company,role:'administrador',maintenance_role:role}];
 else if(table==='companies')data=[{id:company,nome:'Empresa de teste'}];
 else if(table==='maintenance_partners'){
 if(method==='POST'){partner={...partner,...request.postDataJSON(),id,version:1};data=partner;}
 else if(method==='PATCH'){partner={...partner,...request.postDataJSON(),version:partner.version+1};data=[partner];}
 else data=url.searchParams.has('id')?partner:[partner];
 }
 else if(table==='veiculos')data=[fleet];
 else if(table==='motoristas')data=[];
 else if(table==='maintenance_settings')data={limite_aprovacao_supervisor:1000};
 else if(table==='maintenance_orders')data=url.searchParams.has('id')?order:[order];
 else if(table==='maintenance_order_items')data=items;
 else if(table==='maintenance_order_timeline')data=timeline;
 else if(table==='workshop_visits')data=visits;
 else if(table==='maintenance_attachments')data=files;
 else if(table==='maintenance_order_command'){
 const {command,body}=request.postDataJSON();
 if(command==='create'){order={...order,...body,status:'aberta'};fleet.status='Manutenção';}
 if(command==='summary')order={...order,...body};
 if(command==='transition')order={...order,status:body.status,servicos_executados:body.servicos_executados||order.servicos_executados};
 if(command==='item_save'){items.push({...body,id:'item-1'});order.valor_pecas=Number(body.quantidade)*Number(body.valor_unitario);order.valor_total=order.valor_pecas;order.orcamento_status='pendente';}
 if(command==='budget'){order.orcamento_status=body.decisao;order.status=body.decisao==='aprovado'?'orcamento_aprovado':'aguardando_orcamento';order.decisao_por=userId;order.decisao_em=new Date().toISOString();}
 if(command==='arrival'){order.status='na_oficina';order.km_entrada=Number(body.km);fleet.km_atual=Number(body.km);visits.push({id:'visit-1',chegada_em:new Date().toISOString(),km_chegada:Number(body.km),saida_em:null});}
 if(command==='departure'){order.status='veiculo_retirado';order.km_saida=Number(body.km);fleet.km_atual=Number(body.km);visits[0].saida_em=new Date().toISOString();visits[0].km_saida=Number(body.km);}
 if(command==='attachment_add')files.push({...body,id:'file-1'});
 order.version++;timeline.push({id:'event-'+timeline.length,tipo_evento:'comentario',descricao:body.observacao||'Operação '+command,created_at:new Date().toISOString(),usuario_id:userId});data=order;
 }
 else if(table==='maintenance_partner_cities')data=[{cidade:'São Paulo'}];
 else if(table==='maintenance_partner_metrics')data=[{total_os:0,custo_medio:null}];
 else if(table==='maintenance_partner_attachments'){if(method==='POST'){const row={...request.postDataJSON(),id:'file-1',created_at:new Date().toISOString()};files.push(row);data=row;}else data=files;}
 else if(url.pathname.includes('/storage/'))data={Key:'maintenance/file.pdf'};
 const single=(request.headers()['accept']||'').includes('vnd.pgrst.object');
 if(single&&Array.isArray(data))data=data[0]||null;
 await route.fulfill({status:200,headers:{'content-type':'application/json','content-range':'0-0/1','access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:JSON.stringify(data)});
 });
 return{queries,getPartner:()=>partner,getOrder:()=>order};
}

test('OS abre com placa real e sugere odômetro',async({page})=>{
 const fixture=await boot(page);await page.goto('/manutencao/ordens-de-servico?acao=nova');const module=page.locator('.mp-module');
 await expect(module.getByRole('heading',{name:'Nova ordem de serviço'})).toBeVisible();
 await module.getByLabel('Buscar placa').fill('ABC');await module.getByLabel('Veículo',{exact:true}).selectOption('33000000-0000-4000-8000-000000000001');
 await expect(module.locator('[name=km_abertura]')).toHaveValue('1000');
 await module.getByLabel('Oficina',{exact:true}).selectOption(id);await module.locator('[name=descricao_problema]').fill('Freio com ruído');await module.getByRole('button',{name:'Abrir OS',exact:true}).click();
 await expect(module.getByRole('heading',{name:/OS-2026-0001/})).toBeVisible();expect(fixture.getOrder().descricao_problema).toBe('Freio com ruído');
});
test('OS orçamento, transições, conclusão e timeline',async({page})=>{
 const fixture=await boot(page);await page.goto('/manutencao/ordens-de-servico?os=53000000-0000-4000-8000-000000000001');const module=page.locator('.mp-module');
 await module.getByRole('tab',{name:'Orçamento',exact:true}).click();await module.locator('[name=descricao]').fill('Peça de freio');await module.locator('[name=valor_unitario]').fill('100');await module.getByRole('button',{name:'Salvar item',exact:true}).click();
 await expect(module.getByText('Peça de freio',{exact:true})).toBeVisible();
 await module.getByRole('button',{name:'Aprovar orçamento',exact:true}).click();let dialog=page.getByRole('dialog');await dialog.locator('[name=observacao]').fill('Aprovado');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(module.getByText('Orçamento · aprovado',{exact:true})).toBeVisible();
 await module.getByRole('tab',{name:'Anexos',exact:true}).click();await module.getByLabel('Tipo de anexo',{exact:true}).selectOption('orcamento');await module.getByLabel('Arquivo da OS',{exact:true}).setInputFiles({name:'orcamento.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 fixture')});await module.getByRole('button',{name:'Enviar anexo',exact:true}).click();await expect(module.getByText('orcamento.pdf · Orçamento PDF',{exact:true})).toBeVisible();
 await module.getByLabel('Mover OS para').selectOption('em_transito');dialog=page.getByRole('dialog');await dialog.locator('[name=observacao]').fill('Encaminhado');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await module.getByRole('button',{name:'Registrar chegada na oficina',exact:true}).click();dialog=page.getByRole('dialog');await dialog.locator('[name=km]').fill('1010');await dialog.locator('[name=observacao]').fill('Chegou');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 for(const status of ['em_execucao','concluido']){await module.getByLabel('Mover OS para').selectOption(status);dialog=page.getByRole('dialog');await dialog.locator('[name=observacao]').fill('Serviço '+status);if(status==='concluido')await dialog.locator('[name=servicos_executados]').fill('Freio substituído');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}
 await module.getByRole('button',{name:'Registrar saída',exact:true}).click();dialog=page.getByRole('dialog');await dialog.locator('[name=km]').fill('1015');await dialog.locator('[name=observacao]').fill('Retirado');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await module.getByLabel('Mover OS para').selectOption('encerrada');dialog=page.getByRole('dialog');await dialog.locator('[name=observacao]').fill('Encerrado');await dialog.getByRole('button',{name:'Confirmar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await module.getByRole('tab',{name:'Timeline',exact:true}).click();await expect(module.getByText('Encerrado',{exact:true})).toBeVisible();expect(fixture.getOrder().status).toBe('encerrada');
});
test('Kanban, tabela, filtros e cancelamento de modal não mutam status',async({page})=>{
 const fixture=await boot(page);await page.goto('/manutencao/ordens-de-servico');const module=page.locator('.mp-module');await expect(module.getByLabel('Kanban de ordens')).toBeVisible();await expect(module.getByText('ATRASADA',{exact:true})).toBeVisible();
 await module.locator('.os-card').first().dragTo(module.locator('.os-column[aria-label="Aguardando orçamento"]'));await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Voltar',exact:true}).click();expect(fixture.getOrder().status).toBe('aberta');
 await module.getByLabel('Mover OS-2026-0001').selectOption('aguardando_orcamento');await page.getByRole('dialog').getByRole('button',{name:'Voltar',exact:true}).click();expect(fixture.getOrder().status).toBe('aberta');
 await module.getByRole('button',{name:'Tabela',exact:true}).click();await expect(module.getByRole('button',{name:'Ver OS',exact:true})).toBeVisible();await module.getByLabel('Prioridade',{exact:true}).selectOption('alta');await expect.poll(()=>fixture.queries.some(u=>u.searchParams.get('prioridade')==='eq.alta')).toBeTruthy();
 await page.setViewportSize({width:390,height:844});await expect.poll(async()=>(await module.boundingBox()).width).toBeGreaterThan(220);await page.screenshot({path:'test-results/os-mobile.png',fullPage:true});
});
test('Operador abre e visita, sem orçamento ou cancelamento; motorista é barrado',async({page})=>{
 await boot(page,'operador_logistico');await page.goto('/manutencao/ordens-de-servico?os=53000000-0000-4000-8000-000000000001');const module=page.locator('.mp-module');await expect(module.getByRole('button',{name:'Registrar chegada na oficina',exact:true})).toBeVisible();await expect(module.getByRole('button',{name:'Cancelar OS',exact:true})).toHaveCount(0);await module.getByRole('tab',{name:'Orçamento',exact:true}).click();await expect(module.getByRole('button',{name:'Salvar item',exact:true})).toHaveCount(0);await expect(module.getByRole('button',{name:'Aprovar orçamento',exact:true})).toHaveCount(0);
});
test('Motorista não consulta OS',async({page})=>{const fixture=await boot(page,'motorista');await page.goto('/manutencao/ordens-de-servico');await expect(page.getByRole('heading',{name:'Área do motorista'})).toBeVisible();expect(fixture.queries.some(u=>u.pathname.endsWith('maintenance_orders'))).toBeFalsy();});
