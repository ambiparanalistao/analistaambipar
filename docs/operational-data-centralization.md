# Centralização dos dados operacionais

## Inventário da origem legada — 25/10/2026

A tabela abaixo registra o que foi encontrado nos arquivos de origem antes da retirada dos datasets; não significa que esses arquivos ainda existam no código atual.

O inventário anterior de `src/data` encontrou registros operacionais embutidos no frontend, além de catálogos genéricos. Não registrar identificadores pessoais, contatos, endereços ou valores financeiros em migrations, fixtures, testes ou logs versionados.

A base legada de manutenção preventiva também continha placas, odômetros, oficinas e históricos de OS hardcoded. A busca no código confirmou que esses históricos não tinham consumidores; somente regras genéricas eram usadas. O histórico e a lista de oficinas hardcoded foram removidos do frontend para evitar dados de exemplo tratados como reais. As regras genéricas permanecem como catálogo, e planos reais devem ser cadastrados em maintenance_plans por empresa.

| Fonte legada | Registros encontrados na origem | Persistência Supabase observada | Consumidores principais |
| --- | ---: | --- | --- |
| Veículos | 21 | `veiculos`: 21; todos com empresa e placas sem duplicata; odômetro ausente/zero em 21 | Frota, motoristas, escala, manutenção |
| Motoristas | 10 | `motoristas`: 8; todos com empresa, CNH preenchida e CPF sem duplicata | Motoristas, escala, manutenção |
| Licenças | 9 | `compliance_licenses`: 9; source key preenchida e sem duplicatas | Auditoria e vencimentos |
| Clientes | 12 | `clientes`: 12 | Clientes, rotas |
| Rotas | 5 | `routes`: 5 | Rotas, escala |
| Infrações | 13 | `vehicle_infractions`: 13 | Auditoria e vencimentos |
| Contêineres | 8 | `fleet_containers`: 8 | Auditoria e vencimentos |
| Resíduos/MTR | 6 | `registros_residuos`: 6 | ESG/MTR |
| Frota de aporte | 21 veículos, mais ciclos e relatório inicial | `fuel_provision_cycles`: 2; `fuel_provision_vehicles`: 21; `fuel_provision_documents`: 1 | Aporte semanal |
| Arquivos de documentos no Storage | — | `storage.objects`: 0 | Nenhum documento enviado está no bucket do projeto |

Os arquivos de clientes também têm estado salvo no `localStorage`; ciclos e configurações de aporte são gravados por navegador. Esses dados não podem ser obtidos do Supabase e precisarão ser exportados do navegador de cada usuário antes da retirada do armazenamento local. A pasta pública do site contém apenas SVGs de ícones, não os documentos operacionais.

## Regra de reconciliação

1. Registros existentes no banco são a fonte principal.
2. Um veículo só pode ser associado pela placa normalizada e dentro da empresa. O odômetro está vazio no banco e não será preenchido a partir de uma leitura antiga sem confirmação.
3. Um motorista só pode ser associado por identificador forte (CPF/CNH validado), nunca somente pelo nome. Os registros estáticos sem correspondência ou com campos de validade incompletos entram em revisão, sem virar motorista ativo automaticamente.
4. Licenças existentes devem ser comparadas por `source_key` e campo a campo; não se recriam as nove.
5. Valores estáticos diferentes dos valores já salvos vão para revisão. Importação é idempotente e nunca limpa ou substitui campo preenchido automaticamente.
6. Uma informação sem confirmação não pode alimentar escala, vencimentos, abastecimento ou relatório operacional.

## Destino dos dados

- Dados estruturados: Postgres/Supabase (`veiculos`, `motoristas`, `compliance_licenses` e tabelas operacionais adicionais com `company_id`).
- PDFs, imagens e anexos: Supabase Storage privado, metadados e referência na tabela. Não guardar bytes em colunas Postgres nem em `public/`.
- Catálogos genéricos sem dados de empresa podem continuar como constantes de aplicação. Dados reais, defaults preenchidos com uma frota real, registros históricos e estados de usuário não podem.
- `fuel_provision_vehicles.snapshot` preserva o retrato do aporte por ciclo para que relatórios históricos não mudem quando o cadastro do veículo mudar.

## Estado da migração — 25/10/2026

- Migrations aplicadas no Supabase; tabelas novas com RLS e isolamento por empresa.
- Foram preservadas 108 linhas de origem em `operational_data_import_rows`; esse lote está separado dos dados operacionais. Não há registros `local_storage` copiados deste navegador (contagem atual: 0).
- Contagem verificada no Supabase: 21 veículos, 8 motoristas, 9 licenças, 12 clientes, 5 rotas, 8 contêineres, 13 infrações, 6 resíduos/MTR, 19 transações de combustível, 2 ciclos de aporte, 21 snapshots de veículos no aporte e 1 documento histórico. Escalas, viagens, ocorrências de veículo e planos preventivos ainda estão vazios.
- Os 21 veículos, 8 motoristas e 9 licenças da origem coincidem com cadastros canônicos pelas chaves de placa, CPF e documento/número. Os cadastros existentes não foram sobrescritos. Dois motoristas sem correspondência continuam pendentes em staging.
- `ClientsModule` e `RotasModule` leem/escrevem no Supabase; escala consulta rotas e cadastros de veículo/motorista existentes. As fontes estáticas de clientes/rotas e a base auditada de frota foram removidas do HEAD e do bundle.
- O menu **Centralização de Dados** oferece backup JSON e cópia dos dados locais conhecidos para `operational_data_import_rows`, em revisão privada e isolada por empresa. A cópia não apaga o navegador; faça isso em cada navegador/usuário que tenha dados.
- O módulo de combustível consulta `fuel_transactions` e grava no banco as entradas criadas/editadas pelo formulário. Os registros locais permanecem preservados. A importação em massa da planilha e registros locais não sincronizados deve passar pela etapa de revisão/importação, sem sobrescrever silenciosamente dados canônicos.
- A matriz de custos mensais é carregada e salva por empresa em `company_operational_records` (`monthly_fleet_costs`). A importação abre os valores para revisão na tela; somente o botão **Salvar Matriz** os promove ao registro da empresa. Os valores zerados ou linhas removidas persistem na próxima gravação do conjunto completo.
- O módulo de aporte consulta ciclos, documentos e configurações do Supabase. Preferências locais continuam preservadas e são gravadas também em `fuel_provision_settings`; documentos emitidos são salvos em `fuel_provision_documents`.
- Foram adicionadas as tabelas `operational_schedules` e `transport_trips` com RLS por empresa. A tela já consulta esses registros e grava novas escalas/viagens e as alterações feitas pelo usuário; dados locais antigos continuam visíveis e não são importados em lote automaticamente.
- A tela antiga de Ocorrências consulta `vehicle_occurrences` e novos relatos usam `maintenance_vehicle_command`, que aplica as validações de empresa, perfil, veículo e motorista. Os relatos legados locais seguem disponíveis para backup e revisão.
- A exclusão no HEAD não remove os blobs dos commits públicos anteriores; a limpeza do histórico Git ainda não foi feita.

## Sequência restante

1. Em cada navegador usado pela equipe, baixar o backup JSON e copiar os dados locais para revisão no Supabase; conferir os lotes antes da importação operacional.
2. Resolver os dois motoristas sem correspondência e validar os históricos de aporte antes de torná-los ativos.
3. Conferir os lotes locais de escala, viagens e ocorrências e importar somente registros aprovados; novos registros e atualizações já são gravados no Supabase.
4. Concluir a reconciliação em massa de transações de combustível e conferir os documentos de aporte.
5. Fazer backup e validar os dados e módulos antes de limpar o histórico público do Git, que exige reescrita de commits.

O arquivo de migration associado cria apenas estrutura; nenhum registro de empresa ou pessoa foi embutido nele.
