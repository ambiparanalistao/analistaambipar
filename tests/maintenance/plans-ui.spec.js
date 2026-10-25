import {test,expect} from '@playwright/test';
const company='12000000-0000-4000-8000-000000000001',id='42000000-0000-4000-8000-000000000001',userId='22000000-0000-4000-8000-000000000001';
async function boot(page,role='admin_geral'){
 const user={id:userId,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Usuário teste'},app_metadata:{provider:'email'}};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600;const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp}))+'.signature';localStorage.setItem('sb-maintenance-fixture-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 let partner={id,company_id:company,razao_social:'Oficina Horizonte Ltda',nome_fantasia:'Horizonte',cnpj_cpf:'11222333000181',tipo:'oficina_mecanica',especialidades:['Freios'],tipos_veiculo_atendidos:['Caminhão'],contato_nome:'João',telefone:'11987654321',whatsapp:null,email:'oficina@example.invalid',cep:'01001000',logradouro:'Praça da Sé',numero:'10',complemento:null,bairro:'Sé',cidade:'São Paulo',estado:'SP',pais:'BR',latitude:-23.55,longitude:-46.63,horario_funcionamento:{},atende_24h:true,possui_guincho:true,valor_hora_mao_obra:100,prazo_pagamento_dias:30,desconto_percentual:5,status:'ativo',motivo_bloqueio:null,avaliacao_interna:4,sla_medio_dias:null,version:1};
 const files=[],queries=[],items=[],timeline=[],visits=[];let order={id:'53000000-0000-4000-8000-000000000001',company_id:company,numero:'OS-2026-0001',vehicle_id:'33000000-0000-4000-8000-000000000001',partner_id:id,driver_id:null,tipo:'corretiva',prioridade:'alta',descricao_problema:'Freio',diagnostico:null,servicos_executados:null,km_abertura:1000,km_entrada:null,km_saida:null,data_abertura:'2026-10-01T10:00:00Z',previsao_entrega:'2026-10-02T10:00:00Z',status:'aberta',orcamento_status:'pendente',valor_pecas:0,valor_mao_obra:0,valor_total:0,version:1};let fleet={id:order.vehicle_id,placa:'ABC1D23',marca_modelo:'Caminhão teste',km_atual:1000,status:'Disponível'};
 const plans=[],alerts=[{id:'pv-1',plan_id:'plan-1',vehicle_id:order.vehicle_id,nome:'Troca de óleo',placa:fleet.placa,categoria:'caminhao',km_atual:1500,ultima_execucao_km:1000,ultima_execucao_data:'2026-10-01',proxima_km:2000,proxima_data:'2026-11-01',estado:'breve',cycle:1,order_id:null}],messages=[],calls=[],templates=[{id:'73000000-0000-4000-8000-000000000001',nome:'Cobrar andamento',categoria:'andamento',conteudo:'Olá, {nome_parceiro}! S.D.O {numero_os} do veículo {placa}, modelo {modelo}. Previsão: {previsao_entrega}',ativo:true,version:1}],settings={id:'83000000-0000-4000-8000-000000000001',version:1,antecedencia_alerta_dias:7,antecedencia_alerta_km:500,intervalo_cobranca_horas:24,cobranca_ativa:true,cobranca_statuses:['em_execucao','aguardando_peca']};let unread=1;
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
 else if(table==='maintenance_plan_command'){
 const {command,body}=request.postDataJSON();calls.push({command,body});
 if(command==='count')data={count:1};
 if(command==='context')data={plans,vehicles:[{...fleet,tipo:'caminhao'}],settings};
 if(command==='alerts')data={rows:alerts};
 if(command==='notifications')data={rows:[],unread:0};
 if(command==='save'){const row={...body,id:'plan-'+plans.length,version:1};plans.push(row);data=row;}
 if(command==='settings'){Object.assign(settings,{antecedencia_alerta_dias:Number(body.dias),antecedencia_alerta_km:Number(body.km),version:settings.version+1});data=settings;}
 if(command==='create_order'){order={...order,...body,tipo:'preventiva'};data=order;}
 }
 else if(table==='maintenance_communication_command'){
 const {command,body}=request.postDataJSON();calls.push({command,body});
 if(command==='notifications')data={unread,rows:unread?[{id:'notification-1',order_id:order.id,titulo:'Cobrar andamento da S.D.O '+order.numero,updated_at:new Date().toISOString(),read_at:null}]:[]};
 else if(command==='notification_read'){unread=0;data={};}
 else if(command==='context')data={actor_id:userId,can_manage:['admin_geral','admin_empresa','analista_transporte'].includes(role),order:{...order,created_by:userId},partner:{nome:partner.nome_fantasia,whatsapp:partner.telefone,email:partner.email},vehicle:{placa:fleet.placa,modelo:fleet.marca_modelo},templates:templates.filter(t=>t.ativo),members:[{id:userId,nome:'Usuário teste'}],responsavel_nome:'Usuário teste',interval:24};
 else if(command==='history')data={rows:[...messages].reverse(),count:messages.length};
 else if(command==='prepare'||command==='record'){const row={...body,id:'msg-'+messages.length,created_at:new Date().toISOString(),enviado_por:userId,actor_name:'Usuário teste',situacao:command==='prepare'?'preparada':'registrada',efetivada_em:command==='prepare'?null:new Date().toISOString(),destinatario:body.canal==='email'?'oficina@example.invalid':'5511987654321'};messages.push(row);timeline.push({id:'event-'+timeline.length,tipo_evento:'mensagem',descricao:command==='prepare'?'Mensagem preparada':'Resposta da oficina registrada',created_at:row.created_at,usuario_id:userId,dados:{...row}});data=row;}
 else if(command==='confirm'){const row=messages.find(m=>m.id===body.id);row.situacao='confirmada';row.efetivada_em=new Date().toISOString();unread=0;timeline.push({id:'event-'+timeline.length,tipo_evento:'mensagem',descricao:'Envio confirmado pelo usuário',created_at:new Date().toISOString(),usuario_id:userId,dados:{...row}});data=row;}
 else if(command==='overview')data={count:1,rows:[{...order,placa:fleet.placa,oficina:partner.nome_fantasia,situacao:'aguardando_resposta',horas:48,sent:'2026-10-01T10:00:00Z'}]};
 else if(command==='config')data={settings,templates,scheduler:{active:true,schedule:'0 * * * *'}};
 else if(command==='template_save'){let row=templates.find(t=>t.id===body.id);if(row)Object.assign(row,body,{version:row.version+1});else{row={...body,id:'template-'+templates.length,version:1};templates.push(row);}data=row;}
 else if(command==='settings_save'){Object.assign(settings,body,{version:settings.version+1});data=settings;}
 else data={};
 }
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
 return{queries,calls,messages,templates,settings,plans,alerts,getPartner:()=>partner,getOrder:()=>order};
}


test('preventivas exibem semáforo, filtros, contador e modo claro',async({page})=>{await boot(page);await page.goto('/manutencao/planos-preventivos');await expect(page.getByRole('heading',{name:'Planos Preventivos',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Gerar SDO preventiva'})).toBeVisible();await expect(page.getByLabel('1 alertas preventivos')).toBeVisible();await page.getByLabel('Situação',{exact:true}).selectOption('vencida');await expect(page.getByText('Nenhum alerta encontrado para estes filtros.')).toBeVisible();await page.getByLabel('Situação',{exact:true}).selectOption('breve');await page.getByRole('button',{name:'Modo claro',exact:true}).click();await expect(page.locator('.mp-module').last()).toHaveAttribute('data-mp-theme','light');await page.screenshot({path:'test-results/preventivas-desktop.png',fullPage:true});});
test('admin cadastra plano por veículo e salva antecedência',async({page})=>{const fixture=await boot(page);await page.goto('/manutencao/planos-preventivos');await page.getByRole('button',{name:'Novo plano',exact:true}).click();await page.getByLabel('Veículo *',{exact:true}).selectOption('33000000-0000-4000-8000-000000000001');await page.getByLabel('Intervalo em KM',{exact:true}).fill('10000');await page.getByLabel('KM da última execução / base *',{exact:true}).fill('99999');await page.getByRole('button',{name:'Salvar plano',exact:true}).click();await expect(page.getByText('KM base deve estar entre zero e o odômetro atual.')).toBeVisible();await page.getByLabel('KM da última execução / base *',{exact:true}).fill('1000');await page.getByRole('button',{name:'Salvar plano',exact:true}).click();await expect(page.getByText('Plano salvo com auditoria.')).toBeVisible();expect(fixture.plans).toHaveLength(1);await page.getByLabel('Dias',{exact:true}).fill('10');await page.getByLabel('KM',{exact:true}).fill('750');await page.getByRole('button',{name:'Salvar antecedência',exact:true}).click();await expect(page.getByText('Antecedência salva.')).toBeVisible();expect(fixture.settings.antecedencia_alerta_km).toBe(750);});
test('categoria usa controle individual e operador gera S.D.O preenchida',async({page})=>{const fixture=await boot(page,'operador_logistico');await page.goto('/manutencao/planos-preventivos');await expect(page.getByRole('button',{name:'Novo plano',exact:true})).toHaveCount(0);await page.getByRole('link',{name:'Gerar SDO preventiva'}).click();await expect(page.getByLabel('Tipo da S.D.O',{exact:true})).toHaveValue('preventiva');await expect(page.locator('textarea[name=descricao_problema]')).toHaveValue(/Troca de óleo/);await page.getByLabel('Oficina',{exact:true}).selectOption(id);await page.getByRole('button',{name:'Gerar SDO',exact:true}).click();await expect.poll(()=>fixture.calls.some(c=>c.command==='create_order')).toBeTruthy();});
test('mobile mantém painel e formulários sem transbordamento',async({page})=>{await boot(page);await page.setViewportSize({width:390,height:844});await page.goto('/manutencao/planos-preventivos');await expect(page.getByRole('heading',{name:'Planos Preventivos',exact:true})).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.getByRole('button',{name:'Novo plano',exact:true}).click();await page.getByLabel('Aplicar por',{exact:true}).selectOption('category');await page.getByLabel('Categoria *',{exact:true}).selectOption('caminhao');await page.getByLabel('Intervalo em dias',{exact:true}).fill('30');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'test-results/preventivas-mobile.png',fullPage:true});});
test('motorista não acessa planos preventivos',async({page})=>{await boot(page,'motorista');await page.goto('/manutencao/planos-preventivos');await expect(page.getByRole('heading',{name:'Área do motorista',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Novo plano',exact:true})).toHaveCount(0);});
