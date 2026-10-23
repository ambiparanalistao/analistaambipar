# Cadastro público de oficinas
## Uso
Em Manutenção > Oficinas Parceiras, abra Solicitações de parceria. Admin/Analista geram e copiam o link, válido por 180 dias, podendo renovar ou desativar. Cada empresa possui um link independente. Renovar invalida o anterior.
A oficina acessa sem login e informa CNPJ, endereço, contatos, veículos, marcas, serviços, estrutura, horários, garantias e condições de faturamento. Envia declaração e autorização de análise. Não há upload, Storage nem gravação de fotos nesse fluxo.
A solicitação fica pendente e recebe protocolo. Admin/Analista analisam a ficha completa e aprovam ou recusam com motivo. Aprovar cria um parceiro ativo e preserva todo o perfil, numa única transação. Supervisor/Operador consultam e exportam; Motorista/Cliente não têm acesso.
O painel consulta novas solicitações a cada 60 segundos enquanto visível e ao retornar à janela. Há atualização manual. Relatórios de solicitações respeitam o filtro de situação e incluem todas as páginas. Ficha individual disponível no parceiro aprovado, em Excel ou impressão/Salvar PDF.

## Localização
Google Maps abre pelo endereço ou pelas coordenadas fornecidas. Sem chave do Maps, o endereço é preenchido manualmente; não há geocodificação automática. O autocomplete existente continua disponível quando configurado.

## Segurança e persistência
Migration: 20261023185016_partner_registration.sql.
maintenance_partners.onboarding_profile armazena os campos adicionais; maintenance_partner_requests e maintenance_partner_request_audit preservam submissões e decisões. CNPJ validado no cliente e servidor, inclusive formato alfanumérico.
O token de convite tem 64 caracteres aleatórios e vai no fragmento da URL (não no caminho/query enviados ao servidor de hospedagem). Ele autoriza apenas ver o nome da empresa e enviar cadastro, não consultar solicitações ou parceiros. Tokens ficam em tabela privada, sem grants diretos para usuários.
RPC pública invoker usa função definer em schema isolado, search_path vazio e allowlist de ações/campos. Não concede acesso anônimo aos outros helpers de manutenção. RLS e verificação de associação ativa protegem leituras/revisões internas.
Limite de 30 novos cadastros por empresa/hora, honeypot, limite de tamanho e idempotência por request_id. Duplicatas por CNPJ são bloqueadas enquanto pendentes/aprovadas ou já cadastradas. O limite não é um CAPTCHA; para grande divulgação, considerar proteção adicional contra automação e ajustar limites com base no uso.
Nenhum e-mail/WhatsApp é enviado automaticamente. A equipe contata a oficina pelos dados fornecidos. Não há consulta externa de situação cadastral do CNPJ.

## Validação
Executar build, lint, typecheck, testes Node e Playwright. SQL tests usam PostgreSQL descartável e transação com rollback: anônimo sem leitura, envio e retry, prevenção de duplicata, revisão por perfil, isolamento entre empresas, auditoria e revogação do convite.

## Tipos de oficina
O campo aceita várias opções no cadastro público e na edição interna. As seleções são salvas em onboarding_profile.tipos_oficina e aparecem na ficha, relatórios e filtro da listagem. O campo legado tipo mantém a primeira seleção para compatibilidade. Cadastros antigos continuam exibindo seu tipo original. Migration complementar: 20261023192457_partner_multiple_types.sql.
