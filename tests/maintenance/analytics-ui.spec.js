import {test,expect} from '@playwright/test';import * as XLSX from 'xlsx';import fs from 'node:fs/promises';
const company='12000000-0000-4000-8000-000000000001',id='42000000-0000-4000-8000-000000000001',userId='22000000-0000-4000-8000-000000000001';
async function boot(page,role='admin_geral'){
 const user={id:userId,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Usuário teste'},app_metadata:{provider:'email'}};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600;const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp}))+'.signature';localStorage.setItem('sb-maintenance-fixture-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 let partner={id,company_id:company,razao_social:'Oficina Horizonte Ltda',nome_fantasia:'Horizonte',cnpj_cpf:'11222333000181',tipo:'oficina_mecanica',especialidades:['Freios'],tipos_veiculo_atendidos:['Caminhão'],contato_nome:'João',telefone:'11987654321',whatsapp:null,email:'oficina@example.invalid',cep:'01001000',logradouro:'Praça da Sé',numero:'10',complemento:null,bairro:'Sé',cidade:'São Paulo',estado:'SP',pais:'BR',latitude:-23.55,longitude:-46.63,horario_funcionamento:{},atende_24h:true,possui_guincho:true,valor_hora_mao_obra:100,prazo_pagamento_dias:30,desconto_percentual:5,status:'ativo',motivo_bloqueio:null,avaliacao_interna:4,sla_medio_dias:null,version:1};
 const files=[],queries=[],items=[],timeline=[],visits=[];let order={id:'53000000-0000-4000-8000-000000000001',company_id:company,numero:'OS-2026-0001',vehicle_id:'33000000-0000-4000-8000-000000000001',partner_id:id,driver_id:null,tipo:'corretiva',prioridade:'alta',descricao_problema:'Freio',diagnostico:null,servicos_executados:null,km_abertura:1000,km_entrada:null,km_saida:null,data_abertura:'2026-10-01T10:00:00Z',previsao_entrega:'2026-10-02T10:00:00Z',status:'aberta',orcamento_status:'pendente',valor_pecas:0,valor_mao_obra:0,valor_total:0,version:1};let fleet={id:order.vehicle_id,placa:'ABC1D23',marca_modelo:'Caminhão teste',km_atual:1000,status:'Disponível'};
 const branches=[{id:'branch-1',nome:'Unidade Norte',ativo:true,version:1}],faults={dashboard:false,empty:false},analytics={cards:{manutencao:1,disponibilidade:75,abertas:2,atrasadas:1,aprovacao:1,peca:1,custo:1200,mttr_horas:12,mttr_amostras:1,oficina_horas:24},monthly:[{mes:'2026-01',custo:1200},{mes:'2026-02',custo:0}],mix:{preventiva:1,corretiva:2},vehicles:[{placa:'ABC1D23',custo_total:1200,custo_km:1.2,total_os:1,km_observado:1000,downtime_horas:24}],downtime:[{placa:'ABC1D23',downtime_horas:24}],breakdowns:[{placa:'ABC1D23',quebras:2}],workshops:[{id:'w',oficina:'Horizonte',sla_pct:100,sla_amostras:2,prazo_horas:24,custo_medio:1200,nota:4}],critical:[{id:order.id,numero:order.numero,placa:'ABC1D23',status:'aguardando_peca',prioridade:'critica',atrasada:true}]};const plans=[],alerts=[{id:'pv-1',plan_id:'plan-1',vehicle_id:order.vehicle_id,nome:'Troca de óleo',placa:fleet.placa,categoria:'caminhao',km_atual:1500,ultima_execucao_km:1000,ultima_execucao_data:'2026-10-01',proxima_km:2000,proxima_data:'2026-11-01',estado:'breve',cycle:1,order_id:null}],messages=[],calls=[],templates=[{id:'73000000-0000-4000-8000-000000000001',nome:'Cobrar andamento',categoria:'andamento',conteudo:'Olá, {nome_parceiro}! S.D.O {numero_os} do veículo {placa}, modelo {modelo}. Previsão: {previsao_entrega}',ativo:true,version:1}],settings={id:'83000000-0000-4000-8000-000000000001',version:1,antecedencia_alerta_dias:7,antecedencia_alerta_km:500,intervalo_cobranca_horas:24,cobranca_ativa:true,cobranca_statuses:['em_execucao','aguardando_peca']};let unread=1;
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
 else if(table==='maintenance_branch_command'){
 const {command,body}=request.postDataJSON();calls.push({service:'branches',command,body});
 if(command==='list')data={rows:branches};else{const row={...body,id:body.id||'branch-'+(branches.length+1),version:(body.version||0)+1};const idx=branches.findIndex(b=>b.id===row.id);if(idx>=0)branches[idx]=row;else branches.push(row);data=row;}
 }
 else if(table==='maintenance_analytics_command'){
 const {command,body}=request.postDataJSON();calls.push({service:'analytics',command,body});
 if(command==='context')data={branches,vehicles:[fleet],partners:[{id:partner.id,nome:partner.nome_fantasia}]};
 if(command==='dashboard'){if(faults.dashboard){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Falha de teste no painel'})});return;}data=faults.empty?{cards:{manutencao:0,disponibilidade:null,abertas:0,atrasadas:0,aprovacao:0,peca:0,custo:0,mttr_horas:null,mttr_amostras:0,oficina_horas:null},monthly:[],mix:{preventiva:0,corretiva:0},vehicles:[],downtime:[],breakdowns:[],workshops:[],critical:[]}:analytics;}
 if(command==='report'){let rows=body.report==='history'?Array.from({length:501},(_,i)=>({order_id:'os-'+i,numero:'OS-'+String(i+1).padStart(4,'0'),placa:'ABC1D23',filial:'Unidade Norte',oficina:'Horizonte',tipo:'corretiva',status:'encerrada',data_abertura:'2026-01-01',encerrada_em:'2026-01-02',valor_total:1200})):body.report==='partners'?analytics.workshops:body.report==='types'?[{tipo:'corretiva',total_os:1,custo_total:1200}]:body.report==='downtime'?analytics.downtime:analytics.vehicles;const size=body.size||20;data={rows:rows.slice(((body.page||1)-1)*size,(body.page||1)*size),count:rows.length};}
 }
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
 return{queries,calls,messages,templates,settings,plans,alerts,branches,faults,getPartner:()=>partner,getOrder:()=>order};
}


test('dashboard usa filtros globais, gráficos e acesso direto à S.D.O',async({page})=>{const f=await boot(page);await page.goto('/manutencao/dashboard');await expect(page.getByRole('heading',{name:'Dashboard de Manutenção'})).toBeVisible();await expect(page.getByRole('img',{name:'Linha de custo mensal realizado'})).toBeVisible();await page.getByLabel('Filial',{exact:true}).selectOption('branch-1');await page.getByLabel('Tipo de manutenção',{exact:true}).selectOption('corretiva');await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();await expect.poll(()=>f.calls.some(c=>c.service==='analytics'&&c.command==='dashboard'&&c.body.branch_id==='branch-1'&&c.body.tipo==='corretiva')).toBeTruthy();await expect(page.getByRole('link',{name:'Abrir relatórios'})).toHaveAttribute('href',/branch_id=branch-1/);await expect(page.getByRole('link',{name:'OS-2026-0001 · ABC1D23'})).toHaveAttribute('href',/os=/);await page.getByRole('button',{name:'Modo claro',exact:true}).click();await page.screenshot({path:'test-results/dashboard-maintenance-desktop.png',fullPage:true});});
test('admin cadastra filial e operador mantém acesso financeiro autorizado',async({page})=>{const f=await boot(page);await page.goto('/manutencao/dashboard');await page.getByText('Gerenciar filiais',{exact:true}).click();await page.getByLabel('Nome da filial',{exact:true}).fill('Unidade Centro');await page.getByRole('button',{name:'Salvar filial',exact:true}).click();await expect(page.getByText('Filial salva com auditoria. Vincule os veículos na Gestão de Frotas.')).toBeVisible();expect(f.branches.some(b=>b.nome==='Unidade Centro')).toBe(true);});
test('operador visualiza valores sem configurar filiais',async({page})=>{await boot(page,'operador_logistico');await page.goto('/manutencao/dashboard');await expect(page.getByText(/R\$.*1.200,00/).first()).toBeVisible();await expect(page.getByText('Gerenciar filiais',{exact:true})).toHaveCount(0);});
test('Excel inclui todas as páginas do histórico e filtros aplicados',async({page})=>{const f=await boot(page);await page.goto('/manutencao/relatorios?branch_id=branch-1');await page.getByLabel('Relatório',{exact:true}).selectOption('history');await expect(page.getByText('501 registros · Página 1')).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar Excel',exact:true}).click();const file=await download,book=XLSX.read(await fs.readFile(await file.path()),{type:'buffer'});const rows=XLSX.utils.sheet_to_json(book.Sheets.Relatorio);expect(rows.length).toBe(501);expect(rows[500]['S.D.O']).toBe('OS-0501');expect(XLSX.utils.sheet_to_json(book.Sheets.Filtros).some(r=>r.Campo==='Filial'&&r.Valor==='Unidade Norte')).toBe(true);expect(f.calls.filter(c=>c.service==='analytics'&&c.command==='report'&&c.body.size===500).length).toBe(2);});
test('PDF prepara impressão com filtros e todas as linhas',async({page})=>{await boot(page);await page.goto('/manutencao/relatorios');const opened=page.waitForEvent('popup');await page.getByRole('button',{name:'Imprimir / Salvar PDF'}).click();const popup=await opened;await expect(popup.getByRole('heading',{name:'Custos por veículo'})).toBeVisible();await expect(popup.getByText(/Empresa de teste/)).toBeVisible();await expect(popup.locator('tbody tr')).toHaveCount(1);await popup.close();});
test('painel tem erro recuperável e modo mobile sem transbordamento',async({page})=>{const f=await boot(page);f.faults.dashboard=true;await page.setViewportSize({width:390,height:844});await page.goto('/manutencao/dashboard');await expect(page.getByText('Falha de teste no painel')).toBeVisible();f.faults.dashboard=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(page.getByRole('heading',{name:'Ranking de oficinas'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'test-results/dashboard-maintenance-mobile.png',fullPage:true});});
test('motorista não consulta analytics nem relatórios',async({page})=>{const f=await boot(page,'motorista');await page.goto('/manutencao/relatorios');await expect(page.getByRole('heading',{name:'Área do motorista'})).toBeVisible();expect(f.calls.some(c=>c.service==='analytics')).toBe(false);});

test('dashboard vazio não inventa MTTR, custo por KM ou disponibilidade',async({page})=>{const f=await boot(page);f.faults.empty=true;await page.goto('/manutencao/dashboard');await expect(page.getByText('Sem frota',{exact:true})).toBeVisible();await expect(page.getByText('Sem oficinas com dados no período.')).toBeVisible();await expect(page.getByText('Sem dados',{exact:true}).first()).toBeVisible();});
test('cadastro de frota permite selecionar filial da empresa',async({page})=>{await boot(page);await page.goto('/frotas');await page.getByRole('button',{name:'Homologar Novo Veículo',exact:true}).first().click();await expect(page.getByLabel('Filial do veículo',{exact:true})).toBeVisible();await page.getByLabel('Filial do veículo',{exact:true}).selectOption('branch-1');await expect(page.getByLabel('Filial do veículo',{exact:true})).toHaveValue('branch-1');});

test('dashboard premium permite períodos rápidos e seleção de mês',async({page})=>{const f=await boot(page);await page.goto('/manutencao/dashboard');await expect(page.getByRole('img',{name:'Linha de custo mensal realizado'})).toBeVisible();await page.getByRole('button',{name:'Últimos 30 dias',exact:true}).click();await expect.poll(()=>f.calls.filter(c=>c.service==='analytics'&&c.command==='dashboard').length).toBeGreaterThan(1);const latest=f.calls.filter(c=>c.service==='analytics'&&c.command==='dashboard').at(-1).body;expect((Date.parse(latest.end)-Date.parse(latest.start))/86400000).toBe(29);await page.getByRole('button',{name:'Recolher filtros'}).click();await expect(page.getByLabel('Filial',{exact:true})).not.toBeVisible();await page.getByRole('button',{name:'Mostrar filtros'}).click();await expect(page.getByLabel('Filial',{exact:true})).toBeVisible();await page.getByRole('group',{name:'Consultar custo de um mês'}).getByRole('button').first().click();await expect(page.locator('.pd-chart-readout strong')).toHaveText(/1.200,00/);await page.getByText('Análise por veículo',{exact:true}).click();await expect(page.getByRole('heading',{name:'Top 10 veículos por custo realizado'})).toBeVisible();});
