import {test,expect} from '@playwright/test';
const company='12000000-0000-4000-8000-000000000001',id='42000000-0000-4000-8000-000000000001',userId='22000000-0000-4000-8000-000000000001';
async function boot(page,role='admin_geral',fullAccess=false){
 const user={id:userId,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Usuário teste'},app_metadata:{provider:'email'}};
 await page.addInitScript(({user})=>{const exp=Math.floor(Date.now()/1000)+3600;const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp}))+'.signature';localStorage.setItem('sb-maintenance-fixture-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}));},{user});
 let partner={id,company_id:company,razao_social:'Oficina Horizonte Ltda',nome_fantasia:'Horizonte',cnpj_cpf:'11222333000181',tipo:'oficina_mecanica',especialidades:['Freios'],tipos_veiculo_atendidos:['Caminhão'],contato_nome:'João',telefone:'11987654321',whatsapp:null,email:'oficina@example.invalid',cep:'01001000',logradouro:'Praça da Sé',numero:'10',complemento:null,bairro:'Sé',cidade:'São Paulo',estado:'SP',pais:'BR',latitude:-23.55,longitude:-46.63,horario_funcionamento:{},atende_24h:true,possui_guincho:true,valor_hora_mao_obra:100,prazo_pagamento_dias:30,desconto_percentual:5,status:'ativo',motivo_bloqueio:null,avaliacao_interna:4,sla_medio_dias:null,version:1};
 const files=[],queries=[];
 await page.route('https://maintenance-fixture.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop(),method=request.method();queries.push(url);
 let data=[];
 if(method==='OPTIONS'){await route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'}});return;}
 if(url.pathname.includes('/auth/'))data=user;
 else if(table==='company_members')data=[{company_id:company,role:'administrador',maintenance_role:role,full_module_access:fullAccess}];
 else if(table==='companies')data=[{id:company,nome:'Empresa de teste'}];
 else if(table==='maintenance_partners'){
 if(method==='POST'){partner={...partner,...request.postDataJSON(),id,version:1};data=partner;}
 else if(method==='PATCH'){partner={...partner,...request.postDataJSON(),version:partner.version+1};data=[partner];}
 else data=url.searchParams.has('id')?partner:[partner];
 }
 else if(table==='maintenance_partner_cities')data=[{cidade:'São Paulo'}];
 else if(table==='maintenance_partner_metrics')data=[{total_os:0,custo_medio:null}];
 else if(table==='maintenance_partner_attachments'){if(method==='POST'){const row={...request.postDataJSON(),id:'file-1',created_at:new Date().toISOString()};files.push(row);data=row;}else data=files;}
 else if(url.pathname.includes('/storage/'))data={Key:'maintenance/file.pdf'};
 const single=(request.headers()['accept']||'').includes('vnd.pgrst.object');
 if(single&&Array.isArray(data))data=data[0]||null;
 await route.fulfill({status:200,headers:{'content-type':'application/json','content-range':'0-0/1','access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:JSON.stringify(data)});
 });
 return{queries,getPartner:()=>partner};
}
test('lista, filtros, tema e mapa sem chave',async({page})=>{
 const fixture=await boot(page);await page.goto('/manutencao/oficinas');const module=page.locator('.mp-module');
 await expect(module.getByRole('heading',{name:'Oficinas Parceiras'})).toBeVisible();await expect(module.getByText('Horizonte',{exact:true})).toBeVisible();
 expect(fixture.queries.some(u=>u.pathname.endsWith('maintenance_partners')&&u.searchParams.get('company_id')==='eq.'+company)).toBeTruthy();
 await module.getByLabel('Tipo',{exact:true}).selectOption('borracharia');await module.getByLabel('Cidade',{exact:true}).selectOption('São Paulo');await module.getByLabel('Status',{exact:true}).selectOption('ativo');await module.getByLabel('Nota mínima',{exact:true}).selectOption('4');
 await expect.poll(()=>fixture.queries.some(u=>(u.searchParams.get('or')||'').includes('tipo.eq.borracharia')&&u.searchParams.get('cidade')==='eq.São Paulo'&&u.searchParams.get('status')==='eq.ativo'&&u.searchParams.get('avaliacao_interna')==='gte.4')).toBeTruthy();
 await module.getByLabel('Buscar parceiros').fill('Hor');await expect.poll(()=>fixture.queries.some(u=>(u.searchParams.get('or')||'').includes('ilike.%Hor%'))).toBeTruthy();await module.getByRole('button',{name:'Limpar filtros'}).click();
 await module.getByRole('button',{name:'Modo claro'}).click();await expect(module).toHaveAttribute('data-mp-theme','light');
 await module.getByRole('button',{name:'Mapa',exact:true}).click();await expect(module.getByText('Mapa indisponível')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect(module.getByRole('button',{name:'Novo parceiro'})).toBeVisible();await expect.poll(async()=>(await module.boundingBox()).width).toBeGreaterThan(220);const box=await module.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(390);await page.screenshot({path:'test-results/oficinas-mobile.png',fullPage:true});

});
test('cadastro valida obrigatórios e salva endereço manual',async({page})=>{
 await boot(page);await page.goto('/manutencao/oficinas?acao=nova');const module=page.locator('.mp-module');
 await module.getByRole('button',{name:'Salvar parceiro'}).click();await expect(module.getByText('Informe a razão social.')).toBeVisible();
 for(const [name,value]of Object.entries({razao_social:'Nova Oficina Ltda',nome_fantasia:'Nova Oficina',cnpj_cpf:'11222333000181',telefone:'11987654321',cep:'01001000',logradouro:'Praça da Sé',numero:'20',bairro:'Sé',cidade:'São Paulo',estado:'SP'}))await module.locator('[name="'+name+'"]').fill(value);
 await module.getByRole('button',{name:'Salvar parceiro'}).click();await expect(module.getByRole('heading',{name:'Nova Oficina',exact:true})).toBeVisible();await expect(module.getByRole('button',{name:'Nova S.OR',exact:true})).toBeEnabled();
});
test('supervisor somente leitura e bloqueio de URL de edição',async({page})=>{
 await boot(page,'supervisor');await page.goto('/manutencao/oficinas');const module=page.locator('.mp-module');await expect(module.getByText('Horizonte',{exact:true})).toBeVisible();await expect(module.getByRole('button',{name:'Novo parceiro'})).toHaveCount(0);
 await page.goto('/manutencao/oficinas?oficina='+id+'&acao=editar');await expect(page.locator('.mp-module').getByText('Seu perfil tem acesso somente leitura.')).toBeVisible();
});
test('motorista sem acesso ao menu ou dados',async({page})=>{
 const fixture=await boot(page,'motorista');await page.goto('/manutencao/oficinas');await expect(page.getByRole('heading',{name:'Área do motorista'})).toBeVisible();expect(fixture.queries.some(u=>u.pathname.endsWith('/maintenance_partners'))).toBeFalsy();await expect(page.locator('.sidebar-nav').getByRole('button',{name:'Manutenção',exact:true})).toHaveCount(0);
});
test('bloqueio exige motivo, gera cadastro e permite anexo',async({page})=>{
 const fixture=await boot(page);await page.goto('/manutencao/oficinas?oficina='+id+'&acao=editar');const module=page.locator('.mp-module');
 await module.locator('[name=status]').selectOption('bloqueado');await module.getByRole('button',{name:'Salvar parceiro'}).click();await expect(module.getByText('Explique o motivo do bloqueio.')).toBeVisible();await module.locator('[name=motivo_bloqueio]').fill('Contrato suspenso');await module.getByRole('button',{name:'Salvar parceiro'}).click();
 await expect(module.getByRole('button',{name:'Nova S.OR',exact:true})).toBeVisible();expect(fixture.getPartner().status).toBe('bloqueado');
 await module.getByLabel('Adicionar anexo',{exact:true}).setInputFiles({name:'contrato.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 fixture')});await module.getByRole('button',{name:'Enviar anexo',exact:true}).click();await expect(module.getByText(/contrato.pdf · Contrato/)).toBeVisible();
});

for(const role of ['supervisor','operador_logistico','motorista','cliente'])test('acesso completo liberado mantém perfil '+role,async({page})=>{await boot(page,role,true);await page.goto('/manutencao/oficinas');await expect(page.getByRole('heading',{name:'Central de Manutenção'})).toBeVisible();await expect(page.getByRole('button',{name:'Novo parceiro',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Manutenção',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Áreas de manutenção'}).getByRole('button')).toHaveCount(7);await expect(page.getByText('Todos os módulos liberados',{exact:true})).toBeVisible();});
