# Cadastro flexível de oficinas

Obrigatórios: razão social, CNPJ válido e telefone ou WhatsApp com DDD. Mantidas declaração de representação e autorização de análise. Endereço, e-mail, contato nominal, marcas, serviços, veículos, dados fiscais e comerciais são opcionais. Se preenchidos, continuam sujeitos à validação de formato; não são inventados valores de contato/endereço. O cadastro interno também permite endereço incompleto.

Novos envios recebem um link individual de complemento, mostrado junto ao protocolo. O token possui 256 bits aleatórios e fica no fragmento da URL; somente SHA-256 é salvo no banco. Válido por 30 dias e apenas enquanto a solicitação está pendente, sem acesso aos dados de outras oficinas. CNPJ e empresa não podem ser alterados pelo complemento. Atualizações usam versão para impedir sobrescrita concorrente e geram auditoria.

Após aprovação/recusa ou expiração, a oficina deve solicitar a atualização ao analista. Cadastros anteriores sem token também continuam sendo complementados pelo analista: o link público coletivo não permite recuperar dados pessoais. Aprovação de dados incompletos preserva os campos vazios, sem exigir preenchimento artificial.

Verificação: testes de cadastro mínimo, aprovação parcial, recuperação/complemento, token incorreto/expirado, CNPJ imutável, versão desatualizada, cadastro já analisado e fluxo no navegador. O teste SQL usa transação com rollback.
