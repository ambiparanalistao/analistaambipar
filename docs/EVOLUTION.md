# Automação — Evolution API 2.3.7

Acesse /automacao com uma sessão Supabase real. O modo demonstrativo não pode chamar a API.
O módulo somente gerencia a conexão; não envia mensagens nem configura campanhas ou webhooks.

## Configuração na Vercel
No projeto analistaambipar, configure:
- EVOLUTION_API_URL: https://evolutionapi.vps11334.panel.icontainer.net (sem /manager/)
- EVOLUTION_INSTANCE_NAME: analistalogistica
- EVOLUTION_API_KEY: chave global da Evolution, armazenada como Secret/sensitive.
- EVOLUTION_ADMIN_USER_IDS: UUID do usuário autorizado, separados por vírgula.
- VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY, ou equivalentes publishable já existentes.

A chave global corresponde a AUTHENTICATION_API_KEY na configuração da instalação Evolution.
Ela autoriza criar a instância. Um token restrito de instância pode limitar a criação.
Não publique a chave no Git, em localStorage, em campos VITE_ ou no navegador.
Após mudar variáveis, gere um novo deployment; deployments existentes não recebem as alterações.

O servidor valida o bearer token via Supabase /auth/v1/user, rejeita usuários anônimos e
restringe acesso por UUID ou app_metadata.automation_admin=true configurado administrativamente.
user_metadata não concede permissões.

## Uso
1. Abra Automação · WhatsApp.
2. Verifique o status.
3. Se a instância não existe, clique em Criar instância uma vez.
4. Clique em Conectar / gerar QR Code e leia no WhatsApp em Aparelhos conectados.
5. Aguarde a confirmação de status Conectada.
6. Use Reconectar em caso de queda, ou Reiniciar conexão para reiniciar uma sessão.
7. Desconectar WhatsApp encerra a sessão e exige confirmação e novo pareamento.

O status atualiza a cada 15 segundos enquanto a página está visível. Isso não é um
monitor em segundo plano: nenhuma reinicialização ou tentativa de envio acontece automaticamente.
QR Codes são temporários; o módulo oculta-os após 40 segundos ou quando confirma conexão.
Não precisa de webhook para essas funções.

## API
GET /api/evolution: estado normalizado.
POST /api/evolution: action = create, connect, reconnect, restart, logout.
Destino e instância são fixados no servidor. URLs, chaves e nomes enviados pelo cliente são ignorados.
A API não expõe endpoints de envio ou exclusão de instância. Respostas de erro não repassam
o payload bruto da Evolution. Chamadas têm timeout e não seguem redirecionamentos.

Referência verificada na versão 2.3.7:
https://github.com/EvolutionAPI/evolution-api/blob/2.3.7/src/api/routes/instance.router.ts
Em particular, restart usa POST, logout usa DELETE e connect/connectionState usam GET.

## Verificação
node --test tests/evolution.test.js
npm run build
npm run lint

Para validar ao vivo, configure a chave na Vercel, faça login com o usuário autorizado,
crie/conecte a instância e confirme status open. Não é necessário enviar mensagens para testar.
