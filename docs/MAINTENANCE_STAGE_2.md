# Etapa 2 — Oficinas Parceiras

Acesse /manutencao/oficinas com uma sessão Supabase real e associação ativa em company_members. O perfil específico maintenance_role admite admin_geral, admin_empresa e analista_transporte para edição; supervisor e operador_logistico para leitura; motorista e cliente sem acesso. Associações sem maintenance_role mantêm o mapeamento legado documentado no código. Somente administração do banco provisiona associações; profiles não é fonte de autorização.

Migrações: o pré-requisito fleet_prerequisite só cria veiculos quando ausente; a etapa 1 prepara as tabelas e a etapa 2 acrescenta versão otimista, perfis, auditoria e anexos privados. Não há seed de demonstração em produção nem reassociação de dados antigos.

Teste: abrir lista, cadastrar CPF/CNPJ válido, contato e endereço, definir horários, salvar, editar, bloquear com motivo, enviar/baixar/excluir PDF e verificar auditoria. Sem OS, métricas informam ausência de histórico. Nova OS permanece desabilitada. Outros submenus exibem Em breve.

Google Maps é opcional. Sem chave, endereço manual e restante do cadastro funcionam. Para ativar, configurar VITE_GOOGLE_MAPS_API_KEY com Maps JavaScript API e Places API (New), restrição por domínio e API, e publicar novo build. VITE_GOOGLE_MAP_ID opcional. Não colocar chaves de servidor no cliente. Coordenadas manuais permitem preparar os pontos.

Validação: workflow isolado PostgreSQL 17, testes de regressão da etapa 1 antes da nova política de perfis, testes dos sete perfis e anexos, build, lint, typecheck, testes unitários e browser com dados fictícios interceptados.
