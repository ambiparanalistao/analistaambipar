# Modelo de análise para decisões de frota

Este documento descreve uma estrutura de análise. Ele não contém dados de veículos, pessoas, fornecedores, ocorrências ou valores da empresa. Preencha relatórios reais dentro da plataforma autenticada, com acesso restrito à empresa correspondente.

## Estrutura recomendada

1. **Período e escopo** — intervalo de datas e unidade organizacional autorizada.
2. **Indicadores** — disponibilidade, custos, ocorrências e vencimentos calculados a partir dos registros do Supabase.
3. **Itens que exigem decisão** — referência interna do registro, situação, impacto estimado e responsável pela validação.
4. **Alternativas** — opções disponíveis, consequências operacionais e custos apurados nos sistemas autorizados.
5. **Decisão** — aprovador, data, justificativa e ações de acompanhamento.

## Requisitos de proteção

- Não inserir identificadores pessoais, placas, documentos, contatos, endereços, arquivos ou valores reais em documentos versionados.
- Gerar relatórios em tempo de execução, respeitando autenticação, RLS e isolamento por empresa.
- Guardar anexos em Storage privado e registrar apenas sua referência protegida no banco.
- Revisar os destinatários e permissões antes de exportar ou compartilhar um relatório.
