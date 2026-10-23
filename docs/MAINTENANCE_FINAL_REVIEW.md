# Revisão final — Manutenção e Oficinas Parceiras (etapas 1 a 7)

## Resultado da revisão
Os sete submenus têm implementação: Dashboard, OS, Oficinas, Planos Preventivos, Ocorrências, Comunicação e Relatórios. Comandos do módulo usam empresa explícita, perfis do banco e RLS/validação; notificações são individuais. SQL/backend concentra transições, orçamento, odômetro, execução de planos e indicadores. Admin/Analista têm gestão; Supervisor/Operador têm ações específicas. A visibilidade financeira desses dois perfis foi mantida por autorização do usuário, inclusive nos novos relatórios. Motorista usa somente área própria, ocorrência e situação do veículo; Cliente sem manutenção.

## Integração com módulos antigos e limites conhecidos
1. Frota, viagens, clientes e combustível ainda misturam dados locais/cache e persistência remota. O módulo de manutenção considera veículos/OS salvos e vinculados à empresa; cadastros somente locais ou sem empresa não entram nos indicadores. Atribuição histórica de empresa/filial exige conferência, sem migração automática especulativa.
2. O campo legado proxima_revisao_km continua em telas antigas. A manutenção preventiva nova usa maintenance_plans por veículo/categoria; não há sincronização bidirecional desse campo legado. A ficha de manutenção usa os planos reais. Recomenda-se convergir as telas antigas para a mesma fonte.
3. Leituras de abastecimento/importações locais não atualizam automaticamente veiculos.km_atual. KM oficial vem da frota e das OS/visitas, com trava contra redução. Custo/KM usa amostras observadas; telemetria ou histórico diário homologado melhoraria a cobertura.
4. Filial atual da frota pode diferir da filial histórica da OS. Isso é intencional e documentado; OS antigas permanecem Sem filial até definição de uma política de saneamento, sem reclassificar o passado ao mover veículo.
5. O legado pode ter disponibilidade/bloqueio manual diferente de uma OS aberta. O dashboard mostra status atual da frota e contagens de OS separadamente; não corrige situações operacionais automaticamente.
6. Limite de orçamento do Supervisor existe em maintenance_settings e é validado no servidor; falta uma tela dedicada para editar esse limite. Configurações de comunicação/preventiva preservam esse valor.
7. PDF segue impressão do navegador. Para arquivo PDF binário automático, envio por e-mail ou assinatura digital, seria necessária uma etapa própria.

## Configurações externas e recursos futuros
- Google Maps/Places: chave VITE_GOOGLE_MAPS_API_KEY ainda depende de configuração externa, APIs e faturamento habilitados/restrições de domínio. Sem chave, manter endereço/coordenadas manuais e indicação de mapa indisponível.
- Comunicação com oficinas: wa.me e mailto abrem rascunhos; envio e respostas têm confirmação/registro manual. Evolução futura por WhatsApp Business API/e-mail transacional exige provedor, credenciais no servidor e webhooks validados. A conexão/status da Evolution não equivale a disparo automático neste fluxo.
- Portal do parceiro: apenas contrato de tipos preparado, sem emissão de token/rota pública. Continua fase futura.
- Cron nativo do Supabase: cobrança horária e preventiva diária dependem do banco operacional. Monitorar cron.job_run_details/falhas, além de backups e restauração do projeto. Não depende do navegador aberto.

## Segurança e permissões pendentes de revisão fora do módulo
Não foi identificada lacuna nova de autorização nos comandos desta entrega pelos testes executados. Há avisos preexistentes do Supabase sobre handle_new_user com search_path mutável, funções antigas handle_new_user/rls_auto_enable executáveis e proteção de senhas vazadas desativada. Essas funções de provisionamento não foram alteradas por esta etapa. Revisar separadamente com os responsáveis pelo Auth para evitar quebrar cadastro de usuários:
- [search_path de funções](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Funções definer expostas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
O contador privado de OS mantém RLS sem política pública por intenção. Não foi aberta permissão para resolver esse aviso informativo.

## Melhorias sugeridas
Priorizar consolidação da fonte de veículos/KM e saneamento de vínculos de empresa/filial; monitorar falhas das rotinas; oferecer configuração do limite de aprovação; integrar transporte oficial/webhooks; adicionar medições históricas confiáveis para custo/KM e indisponibilidade; separar módulos em chunks/lazy loading para reduzir o bundle legado. A aplicação já emitia aviso de bundle grande antes desta etapa; nenhuma biblioteca de gráficos foi acrescentada.
