import {test,expect} from '@playwright/test';
const company='12000000-0000-4000-8000-000000000001',vehicle='33000000-0000-4000-8000-000000000001',partner='42000000-0000-4000-8000-000000000001',occurrence='63000000-0000-4000-8000-000000000001',userId='22000000-0000-4000-8000-000000000001';
async function boot(page,role='admin_empresa'){
 const user={id:userId,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Fixture'},app_metadata:{provider:'email'}};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600,token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp}))+'.signature';localStorage.setItem('sb-maintenance-fixture-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 const fleet={id:vehicle,company_id:company,placa:'ABC1D23',tipo:'Caminhão',marca_modelo:'Fixture',km_atual:1000,status:'Disponível'},shop={id:partner,company_id:company,nome_fantasia:'Horizonte',razao_social:'Horizonte',nome:'Horizonte',status:'ativo'},rows=[],commands=[];
 const record={id:occurrence,company_id:company,vehicle_id:vehicle,placa:'ABC1D23',driver_id:null,tipo:'quebra',gravidade:'grave',descricao:'Freio com ruído',local:'Base',fotos:[],ocorreu_em:'2026-10-23T10:00:00Z',order_id:null};
 const dossier={vehicle:fleet,preferences:null,summary:{total_os:2,custo_acumulado:450,ultima_manutencao:null},downtime_horas:24,workshop:null,next:null,attachments:[]};
 await page.route('https://maintenance-fixture.supabase.co/**',async route=>{const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop();let data=[];
 if(req.method()==='OPTIONS')return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
 if(url.pathname.includes('/auth/'))data=user;
 else if(table==='company_members')data=[{company_id:company,role:'administrador',maintenance_role:role}];
 else if(table==='companies')data=[{id:company,nome:'Empresa teste'}];
 else if(table==='veiculos')data=[fleet];
 else if(table==='motoristas')data=[];
 else if(table==='maintenance_partners')data=[shop];
 else if(table==='maintenance_settings')data=[{limite_aprovacao_supervisor:5000}];
 else if(table==='maintenance_vehicle_command'){
 const {command,body}=req.postDataJSON();commands.push({command,body});
 if(command==='options')data={vehicles:[fleet],drivers:[],partners:[shop]};
 else if(command==='dossier')data=dossier;
 else if(command==='events')data=[{id:'event',occurred_at:'2026-10-23T10:00:00Z',kind:'chegada',description:'Chegada registrada',actor_id:userId,snapshot:{os:'OS-2026-0001',oficina:'Horizonte',dados:{km_chegada:1000}}}];
 else if(command==='occurrences')data={rows,count:rows.length};
 else if(command==='occurrence')data=record;
 else if(command==='report'){data={...record,...body};rows.push(data);}
 else if(command==='driver')data={vehicle:{id:vehicle,placa:fleet.placa,status:'Manutenção',km_atual:1000},workshop:{nome:'Horizonte',desde:'2026-10-22T10:00:00Z'}};
 else if(command==='available')data=[];
 else if(command==='allocate'||command==='check')return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Veículo indisponível: manutenção.'})});
 else if(command==='preferences'){dossier.preferences=body;data={};}
 else data={};
 }else if(url.pathname.includes('/storage/'))data={Key:'photo.jpg',signedURL:'/signed/photo.jpg'};
 const single=(req.headers()['accept']||'').includes('vnd.pgrst.object');if(single&&Array.isArray(data))data=data[0]||null;
 await route.fulfill({status:200,headers:{'content-type':'application/json','content-range':'0-0/1','access-control-allow-origin':'*'},body:JSON.stringify(data)});
 });return{commands};
}
test('ocorrência valida descrição, registra e permite gerar OS',async({page})=>{const fixture=await boot(page);await page.goto('/manutencao/ocorrencias');await page.getByRole('button',{name:'Reportar ocorrência',exact:true}).click();await page.getByRole('button',{name:'Registrar ocorrência',exact:true}).click();await expect(page.getByText('Selecione um veículo.',{exact:true})).toBeVisible();await page.getByLabel('Veículo da ocorrência').selectOption(vehicle);await page.getByLabel('Descrição da ocorrência').fill('Falha no sistema de freios');await page.getByRole('button',{name:'Registrar ocorrência',exact:true}).click();await expect(page.getByRole('link',{name:'Gerar OS',exact:true})).toBeVisible();expect(fixture.commands.find(c=>c.command==='report').body.vehicle_id).toBe(vehicle);});
test('OS é pré-preenchida pela ocorrência',async({page})=>{await boot(page);await page.goto('/manutencao/ordens-de-servico?acao=nova&ocorrencia='+occurrence);await expect(page.getByRole('heading',{name:'Nova ordem de serviço'})).toBeVisible();await expect(page.locator('[name=descricao_problema]')).toHaveValue('Freio com ruído');await expect(page.getByLabel('Veículo',{exact:true})).toHaveValue(vehicle);await expect(page.locator('[name=km_abertura]')).toHaveValue('1000');});
test('ficha exibe prontuário e exporta Excel',async({page})=>{await boot(page);await page.goto('/frotas');await page.getByRole('button',{name:'Ficha · Manutenção',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Ficha do veículo · ABC1D23'})).toBeVisible();await expect(page.getByText('Chegada registrada',{exact:false})).toBeVisible();await page.getByLabel('Oficina padrão').selectOption(partner);await page.getByRole('button',{name:'Salvar oficinas'}).click();await expect(page.getByText('Oficinas atualizadas com auditoria.')).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Excel',exact:true}).click();expect((await download).suggestedFilename()).toBe('prontuario-ABC1D23.xlsx');});
test('operador registra ocorrência sem gerar OS',async({page})=>{await boot(page,'operador_logistico');await page.goto('/manutencao/ocorrencias');await expect(page.getByRole('button',{name:'Reportar ocorrência',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Gerar OS',exact:true})).toHaveCount(0);});
test('motorista mobile vê somente seu veículo e reporta ocorrência',async({page})=>{await page.setViewportSize({width:390,height:844});await boot(page,'motorista');await page.goto('/motorista/manutencao');await expect(page.getByRole('heading',{name:'Área do motorista'})).toBeVisible();await expect(page.locator('#main-app-sidebar')).toHaveCount(0);await expect(page.getByRole('heading',{name:'ABC1D23'})).toBeVisible();await page.getByRole('button',{name:'Reportar ocorrência',exact:true}).click();await expect(page.getByLabel('Veículo da ocorrência')).toBeDisabled();await page.getByLabel('Descrição da ocorrência').fill('Pneu furado na operação');await page.getByRole('button',{name:'Registrar ocorrência',exact:true}).click();await expect(page.getByText('Ocorrência enviada para a equipe.')).toBeVisible();});
test('veículo em manutenção não aparece disponível para viagem',async({page})=>{await boot(page);await page.goto('/viagens');await page.getByRole('button',{name:'Despachar Nova Viagem'}).click();const select=page.getByLabel('Placa do veículo disponível');await expect(select).toBeEnabled();await expect(select.locator('option')).toHaveCount(1);await expect(select.locator('option')).toHaveText(['Selecione um veículo']);});
