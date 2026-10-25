# Gestão de documentos da frota

Documentos de veículos, motoristas, clientes, oficinas, multas e informações financeiras não devem ser armazenados em arquivos estáticos do repositório.

## Onde guardar

- Cadastros estruturados e datas de validade: tabelas do Supabase vinculadas à empresa.
- CRLV, CNH, notas fiscais, contratos, laudos e demais anexos: bucket privado do Supabase Storage, com metadados e vínculo ao registro correspondente.
- Dados de demonstração: usar somente valores explicitamente fictícios e domínios reservados para testes; nunca copiar dados reais para fixtures ou documentação.

## Atualização e acesso

Use os formulários autenticados da plataforma para cadastrar ou atualizar documentos. As políticas de acesso por empresa devem proteger os registros e os anexos. Não compartilhe links públicos permanentes para arquivos privados.

## Migração de arquivos existentes

Faça backup dos arquivos de origem, carregue-os no Storage privado, associe cada arquivo ao cadastro correto, valide acesso e integridade e só então remova a cópia de origem segundo a política de retenção da empresa. Não coloque nomes de arquivos, placas, documentos, contatos ou valores de registros reais em commits, logs ou documentação.
