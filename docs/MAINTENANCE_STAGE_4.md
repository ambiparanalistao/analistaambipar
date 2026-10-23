# Etapa 4 — vínculo veículo/oficina e prontuário

## Uso
- Frota > Ficha · Manutenção: situação e permanência na oficina, oficinas padrão/preferidas, totais de OS, custo realizado, tempo efetivo em oficina, última/próxima manutenção e prontuário.
- Manutenção > Ocorrências: registrar tipo, gravidade, veículo, motorista opcional, descrição, localização e até dez fotos JPEG/PNG/WebP de até 20 MB cada. Admin/Analista pode gerar OS com os dados preenchidos; criação e vínculo são transacionais, sem duplicação.
- Motoristas > Acesso do motorista ao próprio veículo: administrador vincula ou desvincula um login com membership Motorista já provisionado na empresa a um cadastro e veículo reais (UUIDs). Não inferir acesso por nome, telefone, user_metadata ou user_id do criador do cadastro. A provisão de company_members continua administrativa, como nas etapas anteriores.
- Motorista autenticado é direcionado à área responsiva /motorista/manutencao, sem menu administrativo: consulta placa/status/oficina do próprio veículo e envia ocorrência com GPS/foto. Empresa selecionável quando possui vários vínculos.
- No prontuário, PDF / imprimir abre a versão própria de impressão; selecionar Salvar como PDF no navegador. Excel baixa .xlsx. Ambos exportam TODOS os eventos dos filtros, não apenas a página exibida.
- Maps/Places reutilizam o carregador existente. Sem VITE_GOOGLE_MAPS_API_KEY, endereço e coordenadas manuais/GPS continuam funcionando; mapa mostra indisponibilidade. Nenhuma biblioteca de produção adicionada.

## Alterações em módulos antigos
- App.jsx: encaminha empresa/acesso para frota, motoristas, clientes e viagens; rota e tela restrita do motorista; aguarda resolução de acesso antes do painel.
- VehiclesModule.jsx: botão Ficha · Manutenção nas visões cards/tabela; painel separado; passa empresa ao workspace WhatsApp. Cadastro, leitura de documentos e sincronização driverFleetSync preservados.
- DriversModule.jsx: painel de vínculo seguro, exclusivo do administrador. Cadastro e sincronização existentes preservados.
- TripsModule.jsx: seleção com disponibilidade consultada; criação/retomada valida e registra alocação no servidor; conclusão libera reserva. Histórico de viagens continua com armazenamento existente. Novas reservas identificadas por UUID e empresa.
- ClientsModule.jsx: seleção de placa disponível; valida/registra nova placa ou troca de alocação ao salvar e ao redirecionar rota; editar outros dados preserva a alocação histórica. Outros campos, contratos, impressão e fluxo de cadastro preservados.
- WhatsAppDispatchWorkspace.jsx: antes do envio do modelo Escala, consulta disponibilidade atual; notificações de revisão/posição permanecem disponíveis.
- MaintenanceModule.jsx: ativa página de ocorrências.
- OrderForm/OrdersPage: pré-preenchimento por ocorrência e sugestão da oficina padrão; confirmação mantém todos os controles da Etapa 3.
- Nenhuma mudança em combustíveis, MTR, simuladores, cálculo de frete ou ocorrência antiga de emergência.

## Dados e segurança
Migração gerada com CLI oficial: 20261023150240_vehicle_dossier.sql. Adiciona quatro tabelas com RLS: maintenance_vehicle_preferences, maintenance_driver_bindings, maintenance_vehicle_events e maintenance_allocations. Dados existentes são preservados; histórico já existente de OS/ocorrências é copiado ao ledger.

RPC maintenance_vehicle_command exige membership ativo e empresa ativa em cada chamada. Admin/Analista alteram preferências/geram OS; Supervisor/Operador leem prontuário e registram ocorrências; Motorista apenas consulta projeção mínima do próprio veículo e reporta ocorrência. Vínculos de login são exclusivos de Admin. DML direto das ocorrências e tabelas novas é revogado; gravações sensíveis deixam eventos permanentes com autor, data e snapshots.

Guardas restritivas adicionais em veiculos/motoristas impedem o motorista de usar as políticas legadas para ler ou alterar cadastros completos. O endpoint próprio retorna somente placa/status/KM/oficina. Fotos usam bucket privado maintenance com caminho empresa/occurrences/ocorrencia/arquivo e política por vínculo/autor; não podem ser sobrescritas nem apagadas pelo cliente. Falha de upload não duplica ocorrência: informa registro salvo e quais fotos falharam. Objetos órfãos, se houver, exigem limpeza administrativa.

Alocação valida veículo/empresa/status/OS sob lock da mesma linha de veículo usada pela abertura de OS. Viagem ativa registrada impede abertura de OS até conclusão. Isso complementa o bloqueio de alteração direta de status existente. Nenhuma reserva de viagem é criada retroativamente a partir de cache histórico.

Custo acumulado soma OS concluídas/retiradas/encerradas (não estimativas pendentes). Downtime corresponde à soma dos intervalos reais em workshop_visits, incluindo visita aberta até agora; não inclui espera antes da chegada. Próxima manutenção consulta planos ativos já cadastrados e KM de revisão existente; não implementa planejamento preventivo da Etapa 5.

## Verificação
- npm run build; npm run lint; tsc --project tsconfig.maintenance.json.
- node --test tests/evolution.test.js tests/partner-validation.test.js tests/orders-validation.test.js tests/occurrence-validation.test.js.
- tests/maintenance/vehicle-dossier.sql: PostgreSQL isolado, roles, isolamento entre empresas, registros permanentes, fotos, vínculo motorista, geração única de OS e alocação.
- Playwright: 16 fluxos (parceiros + OS + etapa 4), incluindo celular, formulário, prefill, exportação Excel e disponibilidade. API fixtures isoladas; permissões são testadas também no banco, não só em mocks.
- CI executa migrações/testes anteriores na ordem original antes da nova migração.
