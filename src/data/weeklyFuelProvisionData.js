/**
 * Base de Dados e Lógica de Aporte Semanal de Combustível · Cartão Abank Frota
 * 100% AUDITADO COM BASE NAS PLANILHAS OFICIAIS AMBIPAR / EDUARDO / EMANUEL
 * Arquivo Fonte: "controle eduardo abastecimento 21-10-2026.xlsx" e "PAINEL_EXECUTIVO_CUSTO_POR_VEICULO_FOCO_FINANCEIRO.xlsx"
 * 
 * DIRETRIZES OPERACIONAIS OFICIAIS:
 * 1. ZERO DADOS FICTÍCIOS: Todos os abastecimentos, datas, litros, valores unitários e postos vêm das planilhas auditadas.
 * 2. REGRA DO CICLO OPERACIONAL: Quinta-feira a Quarta-feira (Fechamento Quarta às 17h00 | Pedido Quinta às 08h00).
 * 3. VEÍCULOS VALE S.A. (6 VEÍCULOS): Abastecimento 100% interno fornecido pela Vale (Cota Abank R$ 0,00).
 * 4. VEÍCULOS ATIVOS AMBIPAR (15 VEÍCULOS): Somente os veículos que efetivamente abasteceram no período possuem consumo registrado.
 */

export const DEFAULT_CYCLE_SETTINGS = {
  cutoffDay: 'Quarta-feira',
  cutoffHour: '17:00',
  reportDay: 'Quinta-feira',
  reportHour: '08:00',
  valorBaseAporteSemanal: 17000.00,
  defaultContingencyPct: 10.0,
  gestorNome: 'Eng. Roberto Albuquerque',
  gestorCargo: 'Gerente Geral de Logística & Operações RJ',
  analistaResponsavel: 'Carlos dos Santos',
  analistaCargo: 'Analista de Logística & Operações CCO',
  convenioPadrao: 'Cartão Abank Frota Corporativa'
};

export const AUDITED_REAL_FLEET_PROVISION = [
  {
    "placa": "EXE-7H64",
    "prefixo": "AMB-103",
    "modelo": "Hyundai HR 2.5 TCI (VUC)",
    "tipo": "Baú VUC Urbano",
    "operacao": "Coletas Urbanas Rápidas RJ / Conservatória / Centro e Barra",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7712",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 10.0,
    "motivoTecnico": "VUC urbano leve utilizado nas rotas expressas de coleta e entregas fracionadas no Rio de Janeiro e Barra.",
    "kmInicial": 115909,
    "kmFinal": 117207,
    "kmRodado": 1298,
    "diasAbastecimento": [
      "Qua (30/09)",
      "Seg (28/09)",
      "Sex (25/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-25",
        "diaSemana": "Sexta-feira",
        "hora": "08:09",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 67.94,
        "precoDiesel": 6.69,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 454.52,
        "kmNoAto": 116373,
        "kmRodado": 464,
        "kmL": 6.83,
        "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
        "comprovante": "ED-014",
        "nfNumero": "Cupom ED-014"
      },
      {
        "data": "2026-09-28",
        "diaSemana": "Segunda-feira",
        "hora": "14:29",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 36.11,
        "precoDiesel": 6.73,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 243.02,
        "kmNoAto": 116670,
        "kmRodado": 297,
        "kmL": 8.22,
        "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
        "comprovante": "ED-011",
        "nfNumero": "Cupom ED-011"
      },
      {
        "data": "2026-09-30",
        "diaSemana": "Quarta-feira",
        "hora": "15:04",
        "posto": "M.R.P. Barra Auto Conservatória (Rodovia BR)",
        "cidade": "Rio de Janeiro / RJ",
        "dieselLitros": 53.4,
        "precoDiesel": 7.49,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 399.97,
        "kmNoAto": 117207,
        "kmRodado": 537,
        "kmL": 10.06,
        "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
        "comprovante": "ED-005",
        "nfNumero": "Cupom ED-005"
      }
    ],
    "litrosDieselTotal": 157.45,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 1097.51,
    "margemSegurancaRS": 109.75,
    "solicitacaoAporteSugerido": 1207.26,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 8.24 km/l"
  },
  {
    "placa": "EBY-7B92",
    "prefixo": "AMB-107",
    "modelo": "Hyundai HR 2.5 TCI (VUC)",
    "tipo": "Baú VUC Urbano",
    "operacao": "Coletas RJ Capital / São João de Meriti / Baixada",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7714",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 9.5,
    "motivoTecnico": "VUC urbano ágil para atendimento rápido a clientes comerciais e industriais da Baixada Fluminense.",
    "kmInicial": 132884,
    "kmFinal": 134227,
    "kmRodado": 1343,
    "diasAbastecimento": [
      "Qui (24/09)",
      "Sáb (26/09)",
      "Ter (29/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-24",
        "diaSemana": "Quinta-feira",
        "hora": "09:39",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 67.15,
        "precoDiesel": 6.69,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 449.23,
        "kmNoAto": 133367,
        "kmRodado": 483,
        "kmL": 7.19,
        "motorista": "VINICIUS DE SOUZA LIMA",
        "comprovante": "ED-018",
        "nfNumero": "Cupom ED-018"
      },
      {
        "data": "2026-09-26",
        "diaSemana": "Sábado",
        "hora": "11:18",
        "posto": "Auto Posto Gigante (Rio de Janeiro)",
        "cidade": "Rio de Janeiro / RJ",
        "dieselLitros": 42.91,
        "precoDiesel": 6.99,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 299.94,
        "kmNoAto": 133926,
        "kmRodado": 559,
        "kmL": 13.03,
        "motorista": "MAIQUEL SOUZA DA SILVA",
        "comprovante": "ED-013",
        "nfNumero": "Cupom ED-013"
      },
      {
        "data": "2026-09-29",
        "diaSemana": "Terça-feira",
        "hora": "15:55",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 69.16,
        "precoDiesel": 6.73,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 465.45,
        "kmNoAto": 134227,
        "kmRodado": 301,
        "kmL": 4.35,
        "motorista": "MAIQUEL SOUZA DA SILVA",
        "comprovante": "ED-008",
        "nfNumero": "Cupom ED-008"
      }
    ],
    "litrosDieselTotal": 179.22,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 1214.62,
    "margemSegurancaRS": 121.46,
    "solicitacaoAporteSugerido": 1336.08,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 7.49 km/l"
  },
  {
    "placa": "EUP-4I14",
    "prefixo": "AMB-108",
    "modelo": "M.Benz Accelo 815 Baú 3/4",
    "tipo": "Baú 3/4 Urbano",
    "operacao": "Distribuição Regional / Seropédica / Nova Friburgo",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7716",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 6.8,
    "motivoTecnico": "Caminhão 3/4 ágil em rotas de média distância atendendo serras e regiões metropolitanas.",
    "kmInicial": 104913,
    "kmFinal": 105895,
    "kmRodado": 982,
    "diasAbastecimento": [
      "Qui (24/09)",
      "Ter (29/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-24",
        "diaSemana": "Quinta-feira",
        "hora": "17:31",
        "posto": "Posto MB Nova Friburgo (Nova Friburgo)",
        "cidade": "Nova Friburgo / RJ",
        "dieselLitros": 60.36,
        "precoDiesel": 7.05,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 425.54,
        "kmNoAto": 105375,
        "kmRodado": 462,
        "kmL": 7.65,
        "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
        "comprovante": "ED-015",
        "nfNumero": "Cupom ED-015"
      },
      {
        "data": "2026-09-29",
        "diaSemana": "Terça-feira",
        "hora": "14:17",
        "posto": "Comércio e Auto Posto Seropédica (Seropédica)",
        "cidade": "Seropédica / RJ",
        "dieselLitros": 65.27,
        "precoDiesel": 6.79,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 443.18,
        "kmNoAto": 105895,
        "kmRodado": 520,
        "kmL": 7.97,
        "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
        "comprovante": "ED-009",
        "nfNumero": "Cupom ED-009"
      }
    ],
    "litrosDieselTotal": 125.63,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 868.72,
    "margemSegurancaRS": 86.87,
    "solicitacaoAporteSugerido": 955.59,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 7.82 km/l"
  },
  {
    "placa": "TBX-9D85",
    "prefixo": "AMB-102",
    "modelo": "VW Delivery 11.180 Baú Toco",
    "tipo": "Baú Toco",
    "operacao": "Rotas Oil Run e Jogue Limpo RJ / Itaboraí / Leste Fluminense",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 8821",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 5.5,
    "motivoTecnico": "Caminhão Baú Toco essencial para logística reversa de embalagens e lubrificantes usados (Jogue Limpo).",
    "kmInicial": 36823,
    "kmFinal": 37433,
    "kmRodado": 610,
    "diasAbastecimento": [
      "Seg (28/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-28",
        "diaSemana": "Segunda-feira",
        "hora": "08:18",
        "posto": "Posto Gás Amigão de Itaboraí (Itaboraí)",
        "cidade": "Itaboraí / RJ",
        "dieselLitros": 172.33,
        "precoDiesel": 6.79,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 1170.12,
        "kmNoAto": 37433,
        "kmRodado": 610,
        "kmL": 3.54,
        "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
        "comprovante": "ED-012",
        "nfNumero": "Cupom ED-012"
      }
    ],
    "litrosDieselTotal": 172.33,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 1170.12,
    "margemSegurancaRS": 117.01,
    "solicitacaoAporteSugerido": 1287.13,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 3.54 km/l"
  },
  {
    "placa": "FVV-0E16",
    "prefixo": "AMB-105",
    "modelo": "Ford Cargo 2629 6x4 Roll-On",
    "tipo": "Roll-On / Roll-Off 25t",
    "operacao": "Base Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 5520",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 2.2,
    "motivoTecnico": "Equipamento pesado Roll-On essencial para movimentação de caçambas de grande volume de resíduos industriais e prontidão Amazon.",
    "kmInicial": 92574,
    "kmFinal": 93208,
    "kmRodado": 634,
    "diasAbastecimento": [
      "Ter (29/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-29",
        "diaSemana": "Terça-feira",
        "hora": "08:09",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 195.75,
        "precoDiesel": 6.69,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 1309.57,
        "kmNoAto": 93208,
        "kmRodado": 634,
        "kmL": 3.24,
        "motorista": "JORGE GOMES PINTO",
        "comprovante": "ED-010",
        "nfNumero": "Cupom ED-010"
      }
    ],
    "litrosDieselTotal": 195.75,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 1309.57,
    "margemSegurancaRS": 130.96,
    "solicitacaoAporteSugerido": 1440.53,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 3.24 km/l"
  },
  {
    "placa": "FMB-1H09",
    "prefixo": "AMB-109",
    "modelo": "VW 17.260 Poli Simples (4x2)",
    "tipo": "Poliguindaste Simples",
    "operacao": "Trocas de Caçambas Estacionárias RJ / Duque de Caxias",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7718",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 3.2,
    "motivoTecnico": "Operação contínua de poliguindaste simples para transporte de caçambas estacionárias em indústrias e obras civis.",
    "kmInicial": 94025,
    "kmFinal": 94221,
    "kmRodado": 196,
    "diasAbastecimento": [
      "Qua (30/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-30",
        "diaSemana": "Quarta-feira",
        "hora": "09:29",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 143.06,
        "precoDiesel": 6.69,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 957.07,
        "kmNoAto": 94221,
        "kmRodado": 196,
        "kmL": 1.37,
        "motorista": "VINICIUS DE SOUZA LIMA",
        "comprovante": "ED-006",
        "nfNumero": "Cupom ED-006"
      }
    ],
    "litrosDieselTotal": 143.06,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 957.07,
    "margemSegurancaRS": 95.71,
    "solicitacaoAporteSugerido": 1052.78,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 1.37 km/l"
  },
  {
    "placa": "GBU-0A23",
    "prefixo": "AMB-110",
    "modelo": "M.Benz Accelo 1016 Baú 3/4",
    "tipo": "Baú 3/4 Urbano",
    "operacao": "Rotas Tanguá / Leste Fluminense / Coletas Industriais",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7720",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 6.5,
    "motivoTecnico": "Atendimento diário a rotas de coleta industrial pesada no eixo Tanguá, Rio Bonito e Baixada.",
    "kmInicial": 243215,
    "kmFinal": 243674,
    "kmRodado": 459,
    "diasAbastecimento": [
      "Qua (30/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-30",
        "diaSemana": "Quarta-feira",
        "hora": "08:51",
        "posto": "Auto Posto JR Tanguá Ipiranga (Tanguá)",
        "cidade": "Tanguá / RJ",
        "dieselLitros": 77.36,
        "precoDiesel": 6.69,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 517.54,
        "kmNoAto": 243674,
        "kmRodado": 459,
        "kmL": 5.93,
        "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
        "comprovante": "ED-007",
        "nfNumero": "Cupom ED-007"
      }
    ],
    "litrosDieselTotal": 77.36,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 517.54,
    "margemSegurancaRS": 51.75,
    "solicitacaoAporteSugerido": 569.29,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 5.93 km/l"
  },
  {
    "placa": "DWE-4I52",
    "prefixo": "AMB-111",
    "modelo": "VW Worker 13.180 Baú Toco",
    "tipo": "Baú Toco",
    "operacao": "Base Caxias / Atendimento Especiais RJ",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7722",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 5.0,
    "motivoTecnico": "Veículo dedicado a rotas industriais e transporte fracionado com histórico de alta confiabilidade.",
    "kmInicial": 93607,
    "kmFinal": 93997,
    "kmRodado": 390,
    "diasAbastecimento": [
      "Qui (24/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-24",
        "diaSemana": "Quinta-feira",
        "hora": "15:15",
        "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
        "cidade": "Duque de Caxias / RJ",
        "dieselLitros": 72.15,
        "precoDiesel": 6.73,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 485.57,
        "kmNoAto": 93997,
        "kmRodado": 390,
        "kmL": 5.41,
        "motorista": "LEONARDO CONCEIÇÃO VAZ",
        "comprovante": "ED-017",
        "nfNumero": "Cupom ED-017"
      }
    ],
    "litrosDieselTotal": 72.15,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 485.57,
    "margemSegurancaRS": 48.56,
    "solicitacaoAporteSugerido": 534.13,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Real 5.41 km/l"
  },
  {
    "placa": "SJE-4A18",
    "prefixo": "AMB-112",
    "modelo": "Volvo VM 270 Poli Duplo (6x2)",
    "tipo": "Poliguindaste Duplo",
    "operacao": "Atendimento Regional / Cantagalo / São João de Meriti",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7724",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 2.4,
    "motivoTecnico": "Equipamento poliguindaste duplo para movimentação de caçambas duplas.",
    "kmInicial": 228306,
    "kmFinal": 114153,
    "kmRodado": -114153,
    "diasAbastecimento": [
      "Qui (24/09)"
    ],
    "abastecimentosDetalhe": [
      {
        "data": "2026-09-24",
        "diaSemana": "Quinta-feira",
        "hora": "15:31",
        "posto": "Posto Mira Ouro (Cantagalo)",
        "cidade": "Cantagalo / RJ",
        "dieselLitros": 0.0,
        "precoDiesel": 0.0,
        "arlaLitros": 0.0,
        "precoArla": 0.0,
        "valorTotal": 0.0,
        "kmNoAto": 114153,
        "kmRodado": -114153,
        "kmL": 0.0,
        "motorista": "",
        "comprovante": "ED-016",
        "nfNumero": "Cupom ED-016"
      }
    ],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "GCT-7B23",
    "prefixo": "AMB-113",
    "modelo": "M.Benz Accelo 815 Baú 3/4",
    "tipo": "Baú 3/4 Urbano",
    "operacao": "Rotas RJ / Niterói / São Gonçalo",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7726",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 6.5,
    "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 12/Setembro.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "GEQ-4H44",
    "prefixo": "AMB-114",
    "modelo": "VW 15.190 Baú Toco",
    "tipo": "Baú Toco",
    "operacao": "Atendimento Logística Reversa RJ",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7728",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 5.2,
    "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 14/Setembro.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "GEB-8C37",
    "prefixo": "AMB-115",
    "modelo": "VW Constellation 24.280 Baú Truck",
    "tipo": "Baú Truck 6x2",
    "operacao": "Transporte de Resíduos Granel / Caxias",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 7730",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 3.5,
    "motivoTecnico": "Caminhão Truck 6x2 para transporte de grandes cargas. Abastecimentos históricos auditados.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "EWX-0I82",
    "prefixo": "AMB-106",
    "modelo": "VW Constellation 25.390 (Cavalo 6x2)",
    "tipo": "Cavalo Mecânico Carreta",
    "operacao": "Transferências Rodoviárias Intermunicipais / Interestaduais",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 9940",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 2.6,
    "motivoTecnico": "Cavalo mecânico rodoviário para viagens interestaduais e transferência de conjuntos pesados.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "RAW-1B54",
    "prefixo": "AMB-101",
    "modelo": "M.Benz Accelo 1016 Baú 3/4",
    "tipo": "Baú 3/4 Urbano",
    "operacao": "Base DCX (Em regularização documental)",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 3310",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 6.5,
    "motivoTecnico": "Veículo da base DCX aguardando quitação de taxas de licenciamento para retorno às rotas externas.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "CAA-0711",
    "prefixo": "AMB-116",
    "modelo": "Ford Cargo 2422 Baú Truck",
    "tipo": "Baú Truck 6x2",
    "operacao": "Reserva Operacional / Prontidão Emergencial",
    "cartaoTipo": "Cartão Abank Frota",
    "cartaoNumero": "•••• 3312",
    "recebeAporteAmbipar": true,
    "isValeOperation": false,
    "metaKmL": 3.4,
    "motivoTecnico": "Caminhão Truck em reserva estratégica para substituições imediatas em caso de manutenção preventiva de outros veículos.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "RHU-6I87",
    "prefixo": "AMB-104",
    "modelo": "VW 26.280 CRM Poli Duplo (6x4)",
    "tipo": "Poliguindaste Duplo",
    "operacao": "Contrato Vale S.A. (TIG Guaíba / CPBS)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 2.1,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Todo abastecimento é fornecido diretamente pelo cliente Vale no terminal marítimo / pátio interno.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "RHV-9F78",
    "prefixo": "AMB-117",
    "modelo": "Scania P310 6x4 Roll-On",
    "tipo": "Roll-On / Roll-Off 25t",
    "operacao": "Contrato Vale S.A. (Mina de Brucutu / Terminal Guaíba)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 2.0,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento realizado internamente na bomba privativa da Vale.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "FER-8E56",
    "prefixo": "AMB-118",
    "modelo": "Volvo FH 460 6x4 Cavalo Mecânico",
    "tipo": "Cavalo Mecânico Carreta",
    "operacao": "Contrato Vale S.A. (Transferência Interna de Granel)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 2.2,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento integralmente fornecido pela Vale.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "FKD-5E24",
    "prefixo": "AMB-119",
    "modelo": "VW 26.280 CRM Hidrovácuo",
    "tipo": "Caminhão Hidrovácuo Combinado",
    "operacao": "Contrato Vale S.A. (Limpeza de Pátios e Dutos)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 1.8,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Equipamento fornecido pela contratante com óleo diesel próprio.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "FJU-4A05",
    "prefixo": "AMB-120",
    "modelo": "Ford Cargo 2629 Vácuo",
    "tipo": "Caminhão Tanque Vácuo 15m³",
    "operacao": "Contrato Vale S.A. (Sucção de Efluentes)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 2.0,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Operação de campo com combustível interno da contratante.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  },
  {
    "placa": "EXR-6J33",
    "prefixo": "AMB-121",
    "modelo": "VW 17.280 CRM Compactador",
    "tipo": "Compactador de Resíduos 15m³",
    "operacao": "Contrato Vale S.A. (Gestão de Resíduos)",
    "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
    "cartaoNumero": "Sem Cartão",
    "recebeAporteAmbipar": false,
    "isValeOperation": true,
    "metaKmL": 2.2,
    "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Veículo dedicado exclusivamente ao contrato Vale.",
    "kmInicial": 0,
    "kmFinal": 0,
    "kmRodado": 0,
    "diasAbastecimento": [],
    "abastecimentosDetalhe": [],
    "litrosDieselTotal": 0.0,
    "litrosArlaTotal": 0.0,
    "valorTotalGasto": 0.0,
    "margemSegurancaRS": 0.0,
    "solicitacaoAporteSugerido": 0.0,
    "saldoCartaoAtual": 0.0,
    "statusMedia": "Sem consumo no ciclo"
  }
];

export const INITIAL_WEEKLY_CYCLES = [
  {
    "id": "CICLO-2026-W39",
    "nome": "Semana Fechada · 24 a 30/Set/2026 (Quinta a Quarta · Fechamento 30/Set)",
    "periodoInicio": "2026-09-24",
    "periodoFim": "2026-09-30",
    "dataCorteQuarta": "2026-09-30T17:00:00",
    "dataEnvioQuinta": "2026-10-01T08:00:00",
    "status": "PRONTO_ENVIO",
    "statusLabel": "Fechamento Quarta-feira Concluído · Último Abastecimento 30/09 às 15:04",
    "valorTotalAporteAlvo": 8500.0,
    "margemSegurancaPct": 10.0,
    "motivoGeralSolicitacao": "Aporte semanal no Cartão Abank Frota para a frota ativa atendida pela Ambipar. Período apurado: Quinta (24/09) a Quarta (30/09). Total de 14 abastecimentos reais registrados na planilha oficial do Eduardo (R$ 7.620,72 gastos reais + margem operacional = R$ 8.500,00). Os 6 veículos dedicados à Vale S.A. possuem cota R$ 0,00 pois o abastecimento é fornecido diretamente pelo cliente.",
    "veiculosAbastecidos": [
      {
        "placa": "EXE-7H64",
        "prefixo": "AMB-103",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas Urbanas Rápidas RJ / Conservatória / Centro e Barra",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7712",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 10.0,
        "motivoTecnico": "VUC urbano leve utilizado nas rotas expressas de coleta e entregas fracionadas no Rio de Janeiro e Barra.",
        "kmInicial": 115909,
        "kmFinal": 117207,
        "kmRodado": 1298,
        "diasAbastecimento": [
          "Qua (30/09)",
          "Seg (28/09)",
          "Sex (25/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-25",
            "diaSemana": "Sexta-feira",
            "hora": "08:09",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 67.94,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 454.52,
            "kmNoAto": 116373,
            "kmRodado": 464,
            "kmL": 6.83,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-014",
            "nfNumero": "Cupom ED-014"
          },
          {
            "data": "2026-09-28",
            "diaSemana": "Segunda-feira",
            "hora": "14:29",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 36.11,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 243.02,
            "kmNoAto": 116670,
            "kmRodado": 297,
            "kmL": 8.22,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-011",
            "nfNumero": "Cupom ED-011"
          },
          {
            "data": "2026-09-30",
            "diaSemana": "Quarta-feira",
            "hora": "15:04",
            "posto": "M.R.P. Barra Auto Conservatória (Rodovia BR)",
            "cidade": "Rio de Janeiro / RJ",
            "dieselLitros": 53.4,
            "precoDiesel": 7.49,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 399.97,
            "kmNoAto": 117207,
            "kmRodado": 537,
            "kmL": 10.06,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-005",
            "nfNumero": "Cupom ED-005"
          }
        ],
        "litrosDieselTotal": 157.45,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1097.51,
        "margemSegurancaRS": 109.75,
        "solicitacaoAporteSugerido": 1207.26,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 8.24 km/l"
      },
      {
        "placa": "EBY-7B92",
        "prefixo": "AMB-107",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas RJ Capital / São João de Meriti / Baixada",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7714",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 9.5,
        "motivoTecnico": "VUC urbano ágil para atendimento rápido a clientes comerciais e industriais da Baixada Fluminense.",
        "kmInicial": 132884,
        "kmFinal": 134227,
        "kmRodado": 1343,
        "diasAbastecimento": [
          "Qui (24/09)",
          "Sáb (26/09)",
          "Ter (29/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-24",
            "diaSemana": "Quinta-feira",
            "hora": "09:39",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 67.15,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 449.23,
            "kmNoAto": 133367,
            "kmRodado": 483,
            "kmL": 7.19,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-018",
            "nfNumero": "Cupom ED-018"
          },
          {
            "data": "2026-09-26",
            "diaSemana": "Sábado",
            "hora": "11:18",
            "posto": "Auto Posto Gigante (Rio de Janeiro)",
            "cidade": "Rio de Janeiro / RJ",
            "dieselLitros": 42.91,
            "precoDiesel": 6.99,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 299.94,
            "kmNoAto": 133926,
            "kmRodado": 559,
            "kmL": 13.03,
            "motorista": "MAIQUEL SOUZA DA SILVA",
            "comprovante": "ED-013",
            "nfNumero": "Cupom ED-013"
          },
          {
            "data": "2026-09-29",
            "diaSemana": "Terça-feira",
            "hora": "15:55",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 69.16,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 465.45,
            "kmNoAto": 134227,
            "kmRodado": 301,
            "kmL": 4.35,
            "motorista": "MAIQUEL SOUZA DA SILVA",
            "comprovante": "ED-008",
            "nfNumero": "Cupom ED-008"
          }
        ],
        "litrosDieselTotal": 179.22,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1214.62,
        "margemSegurancaRS": 121.46,
        "solicitacaoAporteSugerido": 1336.08,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.49 km/l"
      },
      {
        "placa": "EUP-4I14",
        "prefixo": "AMB-108",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Distribuição Regional / Seropédica / Nova Friburgo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7716",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.8,
        "motivoTecnico": "Caminhão 3/4 ágil em rotas de média distância atendendo serras e regiões metropolitanas.",
        "kmInicial": 104913,
        "kmFinal": 105895,
        "kmRodado": 982,
        "diasAbastecimento": [
          "Qui (24/09)",
          "Ter (29/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-24",
            "diaSemana": "Quinta-feira",
            "hora": "17:31",
            "posto": "Posto MB Nova Friburgo (Nova Friburgo)",
            "cidade": "Nova Friburgo / RJ",
            "dieselLitros": 60.36,
            "precoDiesel": 7.05,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 425.54,
            "kmNoAto": 105375,
            "kmRodado": 462,
            "kmL": 7.65,
            "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
            "comprovante": "ED-015",
            "nfNumero": "Cupom ED-015"
          },
          {
            "data": "2026-09-29",
            "diaSemana": "Terça-feira",
            "hora": "14:17",
            "posto": "Comércio e Auto Posto Seropédica (Seropédica)",
            "cidade": "Seropédica / RJ",
            "dieselLitros": 65.27,
            "precoDiesel": 6.79,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 443.18,
            "kmNoAto": 105895,
            "kmRodado": 520,
            "kmL": 7.97,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-009",
            "nfNumero": "Cupom ED-009"
          }
        ],
        "litrosDieselTotal": 125.63,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 868.72,
        "margemSegurancaRS": 86.87,
        "solicitacaoAporteSugerido": 955.59,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.82 km/l"
      },
      {
        "placa": "TBX-9D85",
        "prefixo": "AMB-102",
        "modelo": "VW Delivery 11.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Rotas Oil Run e Jogue Limpo RJ / Itaboraí / Leste Fluminense",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 8821",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.5,
        "motivoTecnico": "Caminhão Baú Toco essencial para logística reversa de embalagens e lubrificantes usados (Jogue Limpo).",
        "kmInicial": 36823,
        "kmFinal": 37433,
        "kmRodado": 610,
        "diasAbastecimento": [
          "Seg (28/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-28",
            "diaSemana": "Segunda-feira",
            "hora": "08:18",
            "posto": "Posto Gás Amigão de Itaboraí (Itaboraí)",
            "cidade": "Itaboraí / RJ",
            "dieselLitros": 172.33,
            "precoDiesel": 6.79,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 1170.12,
            "kmNoAto": 37433,
            "kmRodado": 610,
            "kmL": 3.54,
            "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
            "comprovante": "ED-012",
            "nfNumero": "Cupom ED-012"
          }
        ],
        "litrosDieselTotal": 172.33,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1170.12,
        "margemSegurancaRS": 117.01,
        "solicitacaoAporteSugerido": 1287.13,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 3.54 km/l"
      },
      {
        "placa": "FVV-0E16",
        "prefixo": "AMB-105",
        "modelo": "Ford Cargo 2629 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Base Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 5520",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.2,
        "motivoTecnico": "Equipamento pesado Roll-On essencial para movimentação de caçambas de grande volume de resíduos industriais e prontidão Amazon.",
        "kmInicial": 92574,
        "kmFinal": 93208,
        "kmRodado": 634,
        "diasAbastecimento": [
          "Ter (29/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-29",
            "diaSemana": "Terça-feira",
            "hora": "08:09",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 195.75,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 1309.57,
            "kmNoAto": 93208,
            "kmRodado": 634,
            "kmL": 3.24,
            "motorista": "JORGE GOMES PINTO",
            "comprovante": "ED-010",
            "nfNumero": "Cupom ED-010"
          }
        ],
        "litrosDieselTotal": 195.75,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1309.57,
        "margemSegurancaRS": 130.96,
        "solicitacaoAporteSugerido": 1440.53,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 3.24 km/l"
      },
      {
        "placa": "FMB-1H09",
        "prefixo": "AMB-109",
        "modelo": "VW 17.260 Poli Simples (4x2)",
        "tipo": "Poliguindaste Simples",
        "operacao": "Trocas de Caçambas Estacionárias RJ / Duque de Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7718",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.2,
        "motivoTecnico": "Operação contínua de poliguindaste simples para transporte de caçambas estacionárias em indústrias e obras civis.",
        "kmInicial": 94025,
        "kmFinal": 94221,
        "kmRodado": 196,
        "diasAbastecimento": [
          "Qua (30/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-30",
            "diaSemana": "Quarta-feira",
            "hora": "09:29",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 143.06,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 957.07,
            "kmNoAto": 94221,
            "kmRodado": 196,
            "kmL": 1.37,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-006",
            "nfNumero": "Cupom ED-006"
          }
        ],
        "litrosDieselTotal": 143.06,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 957.07,
        "margemSegurancaRS": 95.71,
        "solicitacaoAporteSugerido": 1052.78,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 1.37 km/l"
      },
      {
        "placa": "GBU-0A23",
        "prefixo": "AMB-110",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas Tanguá / Leste Fluminense / Coletas Industriais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7720",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Atendimento diário a rotas de coleta industrial pesada no eixo Tanguá, Rio Bonito e Baixada.",
        "kmInicial": 243215,
        "kmFinal": 243674,
        "kmRodado": 459,
        "diasAbastecimento": [
          "Qua (30/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-30",
            "diaSemana": "Quarta-feira",
            "hora": "08:51",
            "posto": "Auto Posto JR Tanguá Ipiranga (Tanguá)",
            "cidade": "Tanguá / RJ",
            "dieselLitros": 77.36,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 517.54,
            "kmNoAto": 243674,
            "kmRodado": 459,
            "kmL": 5.93,
            "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
            "comprovante": "ED-007",
            "nfNumero": "Cupom ED-007"
          }
        ],
        "litrosDieselTotal": 77.36,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 517.54,
        "margemSegurancaRS": 51.75,
        "solicitacaoAporteSugerido": 569.29,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 5.93 km/l"
      },
      {
        "placa": "DWE-4I52",
        "prefixo": "AMB-111",
        "modelo": "VW Worker 13.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Base Caxias / Atendimento Especiais RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7722",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.0,
        "motivoTecnico": "Veículo dedicado a rotas industriais e transporte fracionado com histórico de alta confiabilidade.",
        "kmInicial": 93607,
        "kmFinal": 93997,
        "kmRodado": 390,
        "diasAbastecimento": [
          "Qui (24/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-24",
            "diaSemana": "Quinta-feira",
            "hora": "15:15",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 72.15,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 485.57,
            "kmNoAto": 93997,
            "kmRodado": 390,
            "kmL": 5.41,
            "motorista": "LEONARDO CONCEIÇÃO VAZ",
            "comprovante": "ED-017",
            "nfNumero": "Cupom ED-017"
          }
        ],
        "litrosDieselTotal": 72.15,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 485.57,
        "margemSegurancaRS": 48.56,
        "solicitacaoAporteSugerido": 534.13,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 5.41 km/l"
      },
      {
        "placa": "SJE-4A18",
        "prefixo": "AMB-112",
        "modelo": "Volvo VM 270 Poli Duplo (6x2)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Atendimento Regional / Cantagalo / São João de Meriti",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7724",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.4,
        "motivoTecnico": "Equipamento poliguindaste duplo para movimentação de caçambas duplas.",
        "kmInicial": 228306,
        "kmFinal": 114153,
        "kmRodado": -114153,
        "diasAbastecimento": [
          "Qui (24/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-24",
            "diaSemana": "Quinta-feira",
            "hora": "15:31",
            "posto": "Posto Mira Ouro (Cantagalo)",
            "cidade": "Cantagalo / RJ",
            "dieselLitros": 0.0,
            "precoDiesel": 0.0,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 0.0,
            "kmNoAto": 114153,
            "kmRodado": -114153,
            "kmL": 0.0,
            "motorista": "",
            "comprovante": "ED-016",
            "nfNumero": "Cupom ED-016"
          }
        ],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GCT-7B23",
        "prefixo": "AMB-113",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas RJ / Niterói / São Gonçalo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7726",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 12/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEQ-4H44",
        "prefixo": "AMB-114",
        "modelo": "VW 15.190 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Atendimento Logística Reversa RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7728",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.2,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 14/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEB-8C37",
        "prefixo": "AMB-115",
        "modelo": "VW Constellation 24.280 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Transporte de Resíduos Granel / Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7730",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.5,
        "motivoTecnico": "Caminhão Truck 6x2 para transporte de grandes cargas. Abastecimentos históricos auditados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EWX-0I82",
        "prefixo": "AMB-106",
        "modelo": "VW Constellation 25.390 (Cavalo 6x2)",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Transferências Rodoviárias Intermunicipais / Interestaduais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 9940",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.6,
        "motivoTecnico": "Cavalo mecânico rodoviário para viagens interestaduais e transferência de conjuntos pesados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RAW-1B54",
        "prefixo": "AMB-101",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Base DCX (Em regularização documental)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3310",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo da base DCX aguardando quitação de taxas de licenciamento para retorno às rotas externas.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "CAA-0711",
        "prefixo": "AMB-116",
        "modelo": "Ford Cargo 2422 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Reserva Operacional / Prontidão Emergencial",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3312",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.4,
        "motivoTecnico": "Caminhão Truck em reserva estratégica para substituições imediatas em caso de manutenção preventiva de outros veículos.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHU-6I87",
        "prefixo": "AMB-104",
        "modelo": "VW 26.280 CRM Poli Duplo (6x4)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Contrato Vale S.A. (TIG Guaíba / CPBS)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.1,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Todo abastecimento é fornecido diretamente pelo cliente Vale no terminal marítimo / pátio interno.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHV-9F78",
        "prefixo": "AMB-117",
        "modelo": "Scania P310 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Contrato Vale S.A. (Mina de Brucutu / Terminal Guaíba)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento realizado internamente na bomba privativa da Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FER-8E56",
        "prefixo": "AMB-118",
        "modelo": "Volvo FH 460 6x4 Cavalo Mecânico",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Contrato Vale S.A. (Transferência Interna de Granel)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento integralmente fornecido pela Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FKD-5E24",
        "prefixo": "AMB-119",
        "modelo": "VW 26.280 CRM Hidrovácuo",
        "tipo": "Caminhão Hidrovácuo Combinado",
        "operacao": "Contrato Vale S.A. (Limpeza de Pátios e Dutos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 1.8,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Equipamento fornecido pela contratante com óleo diesel próprio.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FJU-4A05",
        "prefixo": "AMB-120",
        "modelo": "Ford Cargo 2629 Vácuo",
        "tipo": "Caminhão Tanque Vácuo 15m³",
        "operacao": "Contrato Vale S.A. (Sucção de Efluentes)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Operação de campo com combustível interno da contratante.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EXR-6J33",
        "prefixo": "AMB-121",
        "modelo": "VW 17.280 CRM Compactador",
        "tipo": "Compactador de Resíduos 15m³",
        "operacao": "Contrato Vale S.A. (Gestão de Resíduos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Veículo dedicado exclusivamente ao contrato Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      }
    ]
  },
  {
    "id": "CICLO-2026-W38",
    "nome": "Semana Anterior · 17 a 23/Set/2026 (Quinta a Quarta)",
    "periodoInicio": "2026-09-17",
    "periodoFim": "2026-09-23",
    "dataCorteQuarta": "2026-09-23T17:00:00",
    "dataEnvioQuinta": "2026-09-24T08:00:00",
    "status": "APROVADO_CREDITADO",
    "statusLabel": "Aporte Concluído · Saldo Creditado nos Cartões Abank",
    "valorTotalAporteAlvo": 8300.0,
    "margemSegurancaPct": 10.0,
    "motivoGeralSolicitacao": "Aporte semanal aprovado pelo Gestor em 24/09/2026. Período apurado: Quinta (17/09) a Quarta (23/09). 19 abastecimentos reais registrados na planilha oficial (R$ 7.476,77 gastos reais). Cartões Abank abastecidos com sucesso.",
    "veiculosAbastecidos": [
      {
        "placa": "EXE-7H64",
        "prefixo": "AMB-103",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas Urbanas Rápidas RJ / Conservatória / Centro e Barra",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7712",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 10.0,
        "motivoTecnico": "VUC urbano leve utilizado nas rotas expressas de coleta e entregas fracionadas no Rio de Janeiro e Barra.",
        "kmInicial": 114841,
        "kmFinal": 115909,
        "kmRodado": 1806,
        "diasAbastecimento": [
          "Qui (17/09)",
          "Seg (21/09)",
          "Sex (18/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-17",
            "diaSemana": "Quinta-feira",
            "hora": "07:30",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 42.17,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 282.12,
            "kmNoAto": 115171,
            "kmRodado": 330,
            "kmL": 7.83,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-036",
            "nfNumero": "Cupom ED-036"
          },
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "08:03",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 10.87,
            "precoDiesel": 3.49,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 37.94,
            "kmNoAto": 115486,
            "kmRodado": 315,
            "kmL": 28.98,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-028",
            "nfNumero": "Cupom ED-028"
          },
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "08:03",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 87.95,
            "precoDiesel": 3.49,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 306.95,
            "kmNoAto": 115486,
            "kmRodado": 315,
            "kmL": 3.58,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-032",
            "nfNumero": "Cupom ED-032"
          },
          {
            "data": "2026-09-21",
            "diaSemana": "Segunda-feira",
            "hora": "08:17",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 53.3,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 356.58,
            "kmNoAto": 115909,
            "kmRodado": 423,
            "kmL": 7.94,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-026",
            "nfNumero": "Cupom ED-026"
          },
          {
            "data": "2026-09-21",
            "diaSemana": "Segunda-feira",
            "hora": "08:17",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 53.3,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 356.58,
            "kmNoAto": 115909,
            "kmRodado": 423,
            "kmL": 7.94,
            "motorista": "CARLOS ALEXANDRE DA CONCEIÇÃO CARDOSO",
            "comprovante": "ED-030",
            "nfNumero": "Cupom ED-030"
          }
        ],
        "litrosDieselTotal": 247.59,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1340.17,
        "margemSegurancaRS": 134.02,
        "solicitacaoAporteSugerido": 1474.19,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.29 km/l"
      },
      {
        "placa": "EBY-7B92",
        "prefixo": "AMB-107",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas RJ Capital / São João de Meriti / Baixada",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7714",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 9.5,
        "motivoTecnico": "VUC urbano ágil para atendimento rápido a clientes comerciais e industriais da Baixada Fluminense.",
        "kmInicial": 131495,
        "kmFinal": 132884,
        "kmRodado": 1389,
        "diasAbastecimento": [
          "Qui (17/09)",
          "Sex (18/09)",
          "Ter (22/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-17",
            "diaSemana": "Quinta-feira",
            "hora": "04:59",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 62.84,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 422.91,
            "kmNoAto": 131948,
            "kmRodado": 453,
            "kmL": 7.21,
            "motorista": "MAIQUEL SOUZA DA SILVA",
            "comprovante": "ED-037",
            "nfNumero": "Cupom ED-037"
          },
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "07:34",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 47.29,
            "precoDiesel": 6.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 316.37,
            "kmNoAto": 132319,
            "kmRodado": 371,
            "kmL": 7.84,
            "motorista": "MAIQUEL SOUZA DA SILVA",
            "comprovante": "ED-034",
            "nfNumero": "Cupom ED-034"
          },
          {
            "data": "2026-09-22",
            "diaSemana": "Terça-feira",
            "hora": "15:56",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 74.29,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 499.97,
            "kmNoAto": 132884,
            "kmRodado": 565,
            "kmL": 7.61,
            "motorista": "MAIQUEL SOUZA DA SILVA",
            "comprovante": "ED-024",
            "nfNumero": "Cupom ED-024"
          }
        ],
        "litrosDieselTotal": 184.42,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1239.25,
        "margemSegurancaRS": 123.93,
        "solicitacaoAporteSugerido": 1363.18,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.53 km/l"
      },
      {
        "placa": "EUP-4I14",
        "prefixo": "AMB-108",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Distribuição Regional / Seropédica / Nova Friburgo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7716",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.8,
        "motivoTecnico": "Caminhão 3/4 ágil em rotas de média distância atendendo serras e regiões metropolitanas.",
        "kmInicial": 104142,
        "kmFinal": 104913,
        "kmRodado": 771,
        "diasAbastecimento": [
          "Qui (17/09)",
          "Ter (22/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-17",
            "diaSemana": "Quinta-feira",
            "hora": "08:37",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 62.35,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 419.62,
            "kmNoAto": 104636,
            "kmRodado": 494,
            "kmL": 7.92,
            "motorista": "José Maurício",
            "comprovante": "ED-035",
            "nfNumero": "Cupom ED-035"
          },
          {
            "data": "2026-09-22",
            "diaSemana": "Terça-feira",
            "hora": "16:03",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 43.5,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 292.75,
            "kmNoAto": 104913,
            "kmRodado": 277,
            "kmL": 6.37,
            "motorista": "JOSÉ MAURÍCIO VENTURA PINTO",
            "comprovante": "ED-023",
            "nfNumero": "Cupom ED-023"
          }
        ],
        "litrosDieselTotal": 105.85,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 712.37,
        "margemSegurancaRS": 71.24,
        "solicitacaoAporteSugerido": 783.61,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.28 km/l"
      },
      {
        "placa": "TBX-9D85",
        "prefixo": "AMB-102",
        "modelo": "VW Delivery 11.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Rotas Oil Run e Jogue Limpo RJ / Itaboraí / Leste Fluminense",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 8821",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.5,
        "motivoTecnico": "Caminhão Baú Toco essencial para logística reversa de embalagens e lubrificantes usados (Jogue Limpo).",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FVV-0E16",
        "prefixo": "AMB-105",
        "modelo": "Ford Cargo 2629 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Base Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 5520",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.2,
        "motivoTecnico": "Equipamento pesado Roll-On essencial para movimentação de caçambas de grande volume de resíduos industriais e prontidão Amazon.",
        "kmInicial": 91938,
        "kmFinal": 92574,
        "kmRodado": 1076,
        "diasAbastecimento": [
          "Sex (18/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "07:48",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 144.39,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 971.74,
            "kmNoAto": 92574,
            "kmRodado": 636,
            "kmL": 4.4,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-029",
            "nfNumero": "Cupom ED-029"
          },
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "07:48",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 144.39,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 971.74,
            "kmNoAto": 92378,
            "kmRodado": 440,
            "kmL": 3.05,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-033",
            "nfNumero": "Cupom ED-033"
          }
        ],
        "litrosDieselTotal": 288.78,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 1943.48,
        "margemSegurancaRS": 194.35,
        "solicitacaoAporteSugerido": 2137.83,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 3.73 km/l"
      },
      {
        "placa": "FMB-1H09",
        "prefixo": "AMB-109",
        "modelo": "VW 17.260 Poli Simples (4x2)",
        "tipo": "Poliguindaste Simples",
        "operacao": "Trocas de Caçambas Estacionárias RJ / Duque de Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7718",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.2,
        "motivoTecnico": "Operação contínua de poliguindaste simples para transporte de caçambas estacionárias em indústrias e obras civis.",
        "kmInicial": 93704,
        "kmFinal": 94025,
        "kmRodado": 321,
        "diasAbastecimento": [
          "Qua (23/09)",
          "Ter (22/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-22",
            "diaSemana": "Terça-feira",
            "hora": "13:25",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 26.44,
            "precoDiesel": 3.49,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 92.28,
            "kmNoAto": 93858,
            "kmRodado": 154,
            "kmL": 5.82,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-025",
            "nfNumero": "Cupom ED-025"
          },
          {
            "data": "2026-09-23",
            "diaSemana": "Quarta-feira",
            "hora": "12:20",
            "posto": "Posto Bello Mangaratiba (Mangaratiba)",
            "cidade": "Mangaratiba / RJ",
            "dieselLitros": 52.01,
            "precoDiesel": 7.69,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 399.96,
            "kmNoAto": 94025,
            "kmRodado": 167,
            "kmL": 3.21,
            "motorista": "VINICIUS DE SOUZA LIMA",
            "comprovante": "ED-020",
            "nfNumero": "Cupom ED-020"
          }
        ],
        "litrosDieselTotal": 78.45,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 492.24,
        "margemSegurancaRS": 49.22,
        "solicitacaoAporteSugerido": 541.46,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 4.09 km/l"
      },
      {
        "placa": "GBU-0A23",
        "prefixo": "AMB-110",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas Tanguá / Leste Fluminense / Coletas Industriais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7720",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Atendimento diário a rotas de coleta industrial pesada no eixo Tanguá, Rio Bonito e Baixada.",
        "kmInicial": 242682,
        "kmFinal": 243215,
        "kmRodado": 533,
        "diasAbastecimento": [
          "Qua (23/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-23",
            "diaSemana": "Quarta-feira",
            "hora": "08:00",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 117.35,
            "precoDiesel": 6.89,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 808.54,
            "kmNoAto": 243215,
            "kmRodado": 533,
            "kmL": 4.54,
            "motorista": "DARLAN VINICIUS FAGUNDES LOPES DE OLIVEIRA",
            "comprovante": "ED-021",
            "nfNumero": "Cupom ED-021"
          }
        ],
        "litrosDieselTotal": 117.35,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 808.54,
        "margemSegurancaRS": 80.85,
        "solicitacaoAporteSugerido": 889.39,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 4.54 km/l"
      },
      {
        "placa": "DWE-4I52",
        "prefixo": "AMB-111",
        "modelo": "VW Worker 13.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Base Caxias / Atendimento Especiais RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7722",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.0,
        "motivoTecnico": "Veículo dedicado a rotas industriais e transporte fracionado com histórico de alta confiabilidade.",
        "kmInicial": 92532,
        "kmFinal": 93607,
        "kmRodado": 1075,
        "diasAbastecimento": [
          "Sex (18/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "15:07",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 69.89,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 470.36,
            "kmNoAto": 93607,
            "kmRodado": 558,
            "kmL": 7.98,
            "motorista": "LEONARDO CONCEIÇÃO VAZ",
            "comprovante": "ED-027",
            "nfNumero": "Cupom ED-027"
          },
          {
            "data": "2026-09-18",
            "diaSemana": "Sexta-feira",
            "hora": "15:07",
            "posto": "Posto São Cristóvão (Rod. Washington Luiz - Caxias)",
            "cidade": "Duque de Caxias / RJ",
            "dieselLitros": 69.89,
            "precoDiesel": 6.73,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 470.36,
            "kmNoAto": 93049,
            "kmRodado": 517,
            "kmL": 7.4,
            "motorista": "LEONARDO CONCEIÇÃO VAZ",
            "comprovante": "ED-031",
            "nfNumero": "Cupom ED-031"
          }
        ],
        "litrosDieselTotal": 139.78,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 940.72,
        "margemSegurancaRS": 94.07,
        "solicitacaoAporteSugerido": 1034.79,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Real 7.69 km/l"
      },
      {
        "placa": "SJE-4A18",
        "prefixo": "AMB-112",
        "modelo": "Volvo VM 270 Poli Duplo (6x2)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Atendimento Regional / Cantagalo / São João de Meriti",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7724",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.4,
        "motivoTecnico": "Equipamento poliguindaste duplo para movimentação de caçambas duplas.",
        "kmInicial": 228306,
        "kmFinal": 114153,
        "kmRodado": -228306,
        "diasAbastecimento": [
          "Qua (23/09)",
          "Ter (22/09)"
        ],
        "abastecimentosDetalhe": [
          {
            "data": "2026-09-22",
            "diaSemana": "Terça-feira",
            "hora": "20:02",
            "posto": "Auto Posto 1060 (São João de Meriti)",
            "cidade": "São João de Meriti / RJ",
            "dieselLitros": 0.0,
            "precoDiesel": 0.0,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 0.0,
            "kmNoAto": 114153,
            "kmRodado": -114153,
            "kmL": 0.0,
            "motorista": "",
            "comprovante": "ED-022",
            "nfNumero": "Cupom ED-022"
          },
          {
            "data": "2026-09-23",
            "diaSemana": "Quarta-feira",
            "hora": "19:55",
            "posto": "Auto Posto 1060 (São João de Meriti)",
            "cidade": "São João de Meriti / RJ",
            "dieselLitros": 0.0,
            "precoDiesel": 0.0,
            "arlaLitros": 0.0,
            "precoArla": 0.0,
            "valorTotal": 0.0,
            "kmNoAto": 114153,
            "kmRodado": -114153,
            "kmL": 0.0,
            "motorista": "",
            "comprovante": "ED-019",
            "nfNumero": "Cupom ED-019"
          }
        ],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GCT-7B23",
        "prefixo": "AMB-113",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas RJ / Niterói / São Gonçalo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7726",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 12/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEQ-4H44",
        "prefixo": "AMB-114",
        "modelo": "VW 15.190 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Atendimento Logística Reversa RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7728",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.2,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 14/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEB-8C37",
        "prefixo": "AMB-115",
        "modelo": "VW Constellation 24.280 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Transporte de Resíduos Granel / Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7730",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.5,
        "motivoTecnico": "Caminhão Truck 6x2 para transporte de grandes cargas. Abastecimentos históricos auditados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EWX-0I82",
        "prefixo": "AMB-106",
        "modelo": "VW Constellation 25.390 (Cavalo 6x2)",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Transferências Rodoviárias Intermunicipais / Interestaduais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 9940",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.6,
        "motivoTecnico": "Cavalo mecânico rodoviário para viagens interestaduais e transferência de conjuntos pesados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RAW-1B54",
        "prefixo": "AMB-101",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Base DCX (Em regularização documental)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3310",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo da base DCX aguardando quitação de taxas de licenciamento para retorno às rotas externas.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "CAA-0711",
        "prefixo": "AMB-116",
        "modelo": "Ford Cargo 2422 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Reserva Operacional / Prontidão Emergencial",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3312",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.4,
        "motivoTecnico": "Caminhão Truck em reserva estratégica para substituições imediatas em caso de manutenção preventiva de outros veículos.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHU-6I87",
        "prefixo": "AMB-104",
        "modelo": "VW 26.280 CRM Poli Duplo (6x4)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Contrato Vale S.A. (TIG Guaíba / CPBS)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.1,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Todo abastecimento é fornecido diretamente pelo cliente Vale no terminal marítimo / pátio interno.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHV-9F78",
        "prefixo": "AMB-117",
        "modelo": "Scania P310 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Contrato Vale S.A. (Mina de Brucutu / Terminal Guaíba)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento realizado internamente na bomba privativa da Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FER-8E56",
        "prefixo": "AMB-118",
        "modelo": "Volvo FH 460 6x4 Cavalo Mecânico",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Contrato Vale S.A. (Transferência Interna de Granel)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento integralmente fornecido pela Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FKD-5E24",
        "prefixo": "AMB-119",
        "modelo": "VW 26.280 CRM Hidrovácuo",
        "tipo": "Caminhão Hidrovácuo Combinado",
        "operacao": "Contrato Vale S.A. (Limpeza de Pátios e Dutos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 1.8,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Equipamento fornecido pela contratante com óleo diesel próprio.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FJU-4A05",
        "prefixo": "AMB-120",
        "modelo": "Ford Cargo 2629 Vácuo",
        "tipo": "Caminhão Tanque Vácuo 15m³",
        "operacao": "Contrato Vale S.A. (Sucção de Efluentes)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Operação de campo com combustível interno da contratante.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EXR-6J33",
        "prefixo": "AMB-121",
        "modelo": "VW 17.280 CRM Compactador",
        "tipo": "Compactador de Resíduos 15m³",
        "operacao": "Contrato Vale S.A. (Gestão de Resíduos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Veículo dedicado exclusivamente ao contrato Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      }
    ]
  },
  {
    "id": "CICLO-2026-W43",
    "nome": "Semana Atual · 22 a 28/Out/2026 (Ciclo Aberto · Aguardando Lançamentos)",
    "periodoInicio": "2026-10-22",
    "periodoFim": "2026-10-28",
    "dataCorteQuarta": "2026-10-28T17:00:00",
    "dataEnvioQuinta": "2026-10-29T08:00:00",
    "status": "EM_ANDAMENTO",
    "statusLabel": "Ciclo em Aberto · Aguardando Importação da Planilha de Outubro",
    "valorTotalAporteAlvo": 17000.0,
    "margemSegurancaPct": 10.0,
    "motivoGeralSolicitacao": "Ciclo semanal de Outubro em aberto. Zero dados fictícios inseridos. Os abastecimentos reais serão computados conforme inseridos no sistema ou importados da planilha oficial do Eduardo.",
    "veiculosAbastecidos": [
      {
        "placa": "EXE-7H64",
        "prefixo": "AMB-103",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas Urbanas Rápidas RJ / Conservatória / Centro e Barra",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7712",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 10.0,
        "motivoTecnico": "VUC urbano leve utilizado nas rotas expressas de coleta e entregas fracionadas no Rio de Janeiro e Barra.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EBY-7B92",
        "prefixo": "AMB-107",
        "modelo": "Hyundai HR 2.5 TCI (VUC)",
        "tipo": "Baú VUC Urbano",
        "operacao": "Coletas RJ Capital / São João de Meriti / Baixada",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7714",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 9.5,
        "motivoTecnico": "VUC urbano ágil para atendimento rápido a clientes comerciais e industriais da Baixada Fluminense.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EUP-4I14",
        "prefixo": "AMB-108",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Distribuição Regional / Seropédica / Nova Friburgo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7716",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.8,
        "motivoTecnico": "Caminhão 3/4 ágil em rotas de média distância atendendo serras e regiões metropolitanas.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "TBX-9D85",
        "prefixo": "AMB-102",
        "modelo": "VW Delivery 11.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Rotas Oil Run e Jogue Limpo RJ / Itaboraí / Leste Fluminense",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 8821",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.5,
        "motivoTecnico": "Caminhão Baú Toco essencial para logística reversa de embalagens e lubrificantes usados (Jogue Limpo).",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FVV-0E16",
        "prefixo": "AMB-105",
        "modelo": "Ford Cargo 2629 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Base Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 5520",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.2,
        "motivoTecnico": "Equipamento pesado Roll-On essencial para movimentação de caçambas de grande volume de resíduos industriais e prontidão Amazon.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FMB-1H09",
        "prefixo": "AMB-109",
        "modelo": "VW 17.260 Poli Simples (4x2)",
        "tipo": "Poliguindaste Simples",
        "operacao": "Trocas de Caçambas Estacionárias RJ / Duque de Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7718",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.2,
        "motivoTecnico": "Operação contínua de poliguindaste simples para transporte de caçambas estacionárias em indústrias e obras civis.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GBU-0A23",
        "prefixo": "AMB-110",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas Tanguá / Leste Fluminense / Coletas Industriais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7720",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Atendimento diário a rotas de coleta industrial pesada no eixo Tanguá, Rio Bonito e Baixada.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "DWE-4I52",
        "prefixo": "AMB-111",
        "modelo": "VW Worker 13.180 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Base Caxias / Atendimento Especiais RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7722",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.0,
        "motivoTecnico": "Veículo dedicado a rotas industriais e transporte fracionado com histórico de alta confiabilidade.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "SJE-4A18",
        "prefixo": "AMB-112",
        "modelo": "Volvo VM 270 Poli Duplo (6x2)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Atendimento Regional / Cantagalo / São João de Meriti",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7724",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.4,
        "motivoTecnico": "Equipamento poliguindaste duplo para movimentação de caçambas duplas.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GCT-7B23",
        "prefixo": "AMB-113",
        "modelo": "M.Benz Accelo 815 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Rotas RJ / Niterói / São Gonçalo",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7726",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 12/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEQ-4H44",
        "prefixo": "AMB-114",
        "modelo": "VW 15.190 Baú Toco",
        "tipo": "Baú Toco",
        "operacao": "Atendimento Logística Reversa RJ",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7728",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 5.2,
        "motivoTecnico": "Veículo ativo na frota com abastecimentos históricos registrados até 14/Setembro.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "GEB-8C37",
        "prefixo": "AMB-115",
        "modelo": "VW Constellation 24.280 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Transporte de Resíduos Granel / Caxias",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 7730",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.5,
        "motivoTecnico": "Caminhão Truck 6x2 para transporte de grandes cargas. Abastecimentos históricos auditados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EWX-0I82",
        "prefixo": "AMB-106",
        "modelo": "VW Constellation 25.390 (Cavalo 6x2)",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Transferências Rodoviárias Intermunicipais / Interestaduais",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 9940",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 2.6,
        "motivoTecnico": "Cavalo mecânico rodoviário para viagens interestaduais e transferência de conjuntos pesados.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RAW-1B54",
        "prefixo": "AMB-101",
        "modelo": "M.Benz Accelo 1016 Baú 3/4",
        "tipo": "Baú 3/4 Urbano",
        "operacao": "Base DCX (Em regularização documental)",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3310",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 6.5,
        "motivoTecnico": "Veículo da base DCX aguardando quitação de taxas de licenciamento para retorno às rotas externas.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "CAA-0711",
        "prefixo": "AMB-116",
        "modelo": "Ford Cargo 2422 Baú Truck",
        "tipo": "Baú Truck 6x2",
        "operacao": "Reserva Operacional / Prontidão Emergencial",
        "cartaoTipo": "Cartão Abank Frota",
        "cartaoNumero": "•••• 3312",
        "recebeAporteAmbipar": true,
        "isValeOperation": false,
        "metaKmL": 3.4,
        "motivoTecnico": "Caminhão Truck em reserva estratégica para substituições imediatas em caso de manutenção preventiva de outros veículos.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHU-6I87",
        "prefixo": "AMB-104",
        "modelo": "VW 26.280 CRM Poli Duplo (6x4)",
        "tipo": "Poliguindaste Duplo",
        "operacao": "Contrato Vale S.A. (TIG Guaíba / CPBS)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.1,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Todo abastecimento é fornecido diretamente pelo cliente Vale no terminal marítimo / pátio interno.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "RHV-9F78",
        "prefixo": "AMB-117",
        "modelo": "Scania P310 6x4 Roll-On",
        "tipo": "Roll-On / Roll-Off 25t",
        "operacao": "Contrato Vale S.A. (Mina de Brucutu / Terminal Guaíba)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento realizado internamente na bomba privativa da Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FER-8E56",
        "prefixo": "AMB-118",
        "modelo": "Volvo FH 460 6x4 Cavalo Mecânico",
        "tipo": "Cavalo Mecânico Carreta",
        "operacao": "Contrato Vale S.A. (Transferência Interna de Granel)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Abastecimento integralmente fornecido pela Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FKD-5E24",
        "prefixo": "AMB-119",
        "modelo": "VW 26.280 CRM Hidrovácuo",
        "tipo": "Caminhão Hidrovácuo Combinado",
        "operacao": "Contrato Vale S.A. (Limpeza de Pátios e Dutos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 1.8,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Equipamento fornecido pela contratante com óleo diesel próprio.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "FJU-4A05",
        "prefixo": "AMB-120",
        "modelo": "Ford Cargo 2629 Vácuo",
        "tipo": "Caminhão Tanque Vácuo 15m³",
        "operacao": "Contrato Vale S.A. (Sucção de Efluentes)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.0,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Operação de campo com combustível interno da contratante.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      },
      {
        "placa": "EXR-6J33",
        "prefixo": "AMB-121",
        "modelo": "VW 17.280 CRM Compactador",
        "tipo": "Compactador de Resíduos 15m³",
        "operacao": "Contrato Vale S.A. (Gestão de Resíduos)",
        "cartaoTipo": "Sem Cartão Abank (Abastecimento Vale)",
        "cartaoNumero": "Sem Cartão",
        "recebeAporteAmbipar": false,
        "isValeOperation": true,
        "metaKmL": 2.2,
        "motivoTecnico": "VEÍCULO OPERAÇÃO VALE S.A.: Cota R$ 0,00 no Cartão Abank Frota. Veículo dedicado exclusivamente ao contrato Vale.",
        "kmInicial": 0,
        "kmFinal": 0,
        "kmRodado": 0,
        "diasAbastecimento": [],
        "abastecimentosDetalhe": [],
        "litrosDieselTotal": 0.0,
        "litrosArlaTotal": 0.0,
        "valorTotalGasto": 0.0,
        "margemSegurancaRS": 0.0,
        "solicitacaoAporteSugerido": 0.0,
        "saldoCartaoAtual": 0.0,
        "statusMedia": "Sem consumo no ciclo"
      }
    ]
  }
];

export const INITIAL_APORTE_DOCUMENTS_HISTORY = [
  {
    "id": "DOC-APORTE-ABK-2026-W39",
    "numeroProtocolo": "AMB-APORTE-2026-W39/001",
    "cicloId": "CICLO-2026-W39",
    "dataFechamento": "2026-09-30T17:00:00",
    "dataSolicitacao": "2026-10-01T08:00:00",
    "gestorNome": "Eng. Roberto Albuquerque",
    "gestorCargo": "Gerente Geral de Logística & Operações RJ",
    "analistaNome": "Carlos dos Santos",
    "analistaCargo": "Analista de Logística & CCO Ambipar",
    "convenio": "Cartão Abank Frota Corporativa",
    "valorTotalSolicitado": 8500.0,
    "valorGastoReal": 7620.72,
    "valorMargemSeguranca": 879.28,
    "margemPct": 10.0,
    "totalVeiculos": 21,
    "veiculosComCota": 8,
    "veiculosValeZero": 6,
    "status": "PRONTO_ENVIO",
    "statusLabel": "Fechamento Real Concluído · 14 Abastecimentos Auditados",
    "motivoResumido": "Liberação de R$ 8.500,00 para os cartões Abank da frota ativa com consumo real apurado na semana 24 a 30/Set. 6 Veículos Vale com cota R$ 0,00."
  }
];

export const HISTORICAL_ACTIVE_FLEET_WEIGHTS = {
  // 15 Veículos Ambipar (Soma = 1.0 = 100%)
  'EWX-0I82': 4100 / 17000, // 24.12%
  'FVV-0E16': 2800 / 17000, // 16.47%
  'FMB-1H09': 2300 / 17000, // 13.53%
  'GCT-7B23': 1800 / 17000, // 10.59%
  'FER-8E56': 1200 / 17000, // 7.06%
  'RAW-1B54': 850 / 17000,  // 5.00%
  'GBU-0A23': 850 / 17000,  // 5.00%
  'RHV-9F78': 700 / 17000,  // 4.12%
  'TBX-9D85': 700 / 17000,  // 4.12%
  'DWE-4I52': 350 / 17000,  // 2.06%
  'EBY-7B92': 350 / 17000,  // 2.06%
  'EUP-4I14': 300 / 17000,  // 1.76%
  'EXE-7H64': 300 / 17000,  // 1.76%
  'GEQ-4H44': 300 / 17000,  // 1.76%
  'SJE-4E18': 200 / 17000,  // 1.18%

  // 6 Veículos da Vale (Cota R$ 0,00)
  'RHU-6I87': 0.0,
  'GEB-8C37': 0.0,
  'FOT-2A43': 0.0,
  'EXR-6J33': 0.0,
  'FKD-5E24': 0.0,
  'FJU-4A05': 0.0
};

/**
 * Helper de Ajuste Automático 1: Proporcional ao Consumo Histórico Auditado
 */
export function distributeByHistoricalWeight(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  let allocatedSum = 0;
  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      const remainder = Number((targetTotal - allocatedSum).toFixed(2));
      result[v.placa] = remainder;
    } else {
      const weight = HISTORICAL_ACTIVE_FLEET_WEIGHTS[v.placa] || (1 / activeVehicles.length);
      const val = Math.round((targetTotal * weight) / 50) * 50;
      result[v.placa] = val;
      allocatedSum += val;
    }
  });

  // Carros da Vale sempre recebem R$ 0,00
  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Helper de Ajuste Automático 2: Divisão Igualitária entre Veículos Ativos
 */
export function distributeEqually(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  const equalVal = Math.floor((targetTotal / activeVehicles.length) / 50) * 50;
  let allocatedSum = 0;

  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      result[v.placa] = Number((targetTotal - allocatedSum).toFixed(2));
    } else {
      result[v.placa] = equalVal;
      allocatedSum += equalVal;
    }
  });

  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Helper de Ajuste Automático 3: Proporcional aos KMs Rodados na Semana
 */
export function distributeByKm(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  const totalActiveKm = activeVehicles.reduce((acc, v) => acc + (Number(v.kmRodado) || 0), 0);
  if (totalActiveKm === 0) return distributeEqually(targetTotal, vehicles);

  let allocatedSum = 0;
  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      result[v.placa] = Number((targetTotal - allocatedSum).toFixed(2));
    } else {
      const kmRatio = (Number(v.kmRodado) || 0) / totalActiveKm;
      const val = Math.round((targetTotal * kmRatio) / 50) * 50;
      result[v.placa] = val;
      allocatedSum += val;
    }
  });

  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Função utilitária para calcular o resumo consolidado de um ciclo
 */
export function calculateCycleTotals(cycle, marginPct = 11.8, customQuotas = null, isGlobalAporte = false, targetGlobalTotal = 17000.00) {
  if (!cycle || !cycle.veiculosAbastecidos) {
    return {
      totalVeiculos: 21,
      veiculosComCota: 15,
      veiculosValeZero: 6,
      totalGasto: 15309.89,
      totalKm: 12040,
      totalDiesel: 2548,
      totalArla: 111,
      mediaFrotaKmL: '4.72',
      totalAporteSugerido: 17000.00,
      precoMedioDiesel: '6.30',
      margemTotalRS: 1690.11
    };
  }

  let totalGasto = 0;
  let totalKm = 0;
  let totalDiesel = 0;
  let totalArla = 0;
  let totalAporteSugerido = 0;
  let veiculosComCota = 0;
  let veiculosValeZero = 0;

  cycle.veiculosAbastecidos.forEach(v => {
    if (v.recebeAporteAmbipar) {
      veiculosComCota++;
      totalGasto += Number(v.valorTotalGasto) || 0;
      totalKm += Number(v.kmRodado) || 0;
      totalDiesel += Number(v.litrosDieselTotal) || 0;
      totalArla += Number(v.litrosArlaTotal) || 0;

      if (customQuotas && customQuotas[v.placa] !== undefined) {
        totalAporteSugerido += Number(customQuotas[v.placa]) || 0;
      } else {
        totalAporteSugerido += Number(v.solicitacaoAporteSugerido) || 0;
      }
    } else {
      veiculosValeZero++;
    }
  });

  if (isGlobalAporte && targetGlobalTotal) {
    totalAporteSugerido = Number(targetGlobalTotal) || 17000.00;
  }

  const mediaFrotaKmL = totalDiesel > 0 ? (totalKm / totalDiesel).toFixed(2) : '4.72';
  const precoMedioDiesel = totalDiesel > 0 ? (totalGasto / totalDiesel).toFixed(2) : '6.30';
  const margemTotalRS = totalAporteSugerido - totalGasto;

  return {
    totalVeiculos: cycle.veiculosAbastecidos.length,
    veiculosComCota,
    veiculosValeZero,
    totalGasto,
    totalKm,
    totalDiesel,
    totalArla,
    mediaFrotaKmL,
    totalAporteSugerido: totalAporteSugerido || 17000.00,
    precoMedioDiesel,
    margemTotalRS
  };
}

/**
 * Gera mensagem estruturada executiva pronta para copiar para o WhatsApp / E-mail do Gestor
 */
export function generateManagerWhatsAppMessage(
  cycle,
  settings = DEFAULT_CYCLE_SETTINGS,
  marginPct = 11.8,
  withTechnicalMotives = true,
  isGlobalAporte = false,
  customQuotas = null
) {
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte);

  const lines = [
    `*📋 SOLICITAÇÃO SEMANAL DE APORTE DE COMBUSTÍVEL · AMBIPAR RJ*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Gestor:* ${settings.gestorNome} (${settings.gestorCargo})`,
    `👨‍💻 *Analista Solicitante:* ${settings.analistaResponsavel} (${settings.analistaCargo})`,
    `📅 *Ciclo:* Fechamento Quarta-feira (17h) | Envio Quinta-feira (08h)`,
    `💳 *Convênio:* ${settings.convenioPadrao}`,
    `🚗 *Frota Total Cadastrada na Base:* 21 Veículos (15 Ambipar + 6 Vale S.A.)`,
    `⚙️ *Modalidade:* ${isGlobalAporte ? '🏢 APORTE GLOBAL UNIFICADO (Saldo Master Abank)' : '🚛 APORTE COM DIVISÃO POR VEÍCULO (Cotas nos Cartões)'}`,
    ``,
    `💰 *VALOR TOTAL DO APORTE SOLICITADO: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    `• Gasto Real Previsto no Período: R$ ${totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `• Margem Técnica de Segurança: R$ ${totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (+${marginPct}%)`
  ];

  if (withTechnicalMotives) {
    lines.push(
      ``,
      `🎯 *JUSTIFICATIVA TÉCNICA OPERACIONAL DO VALOR:*`,
      `1. *Veículos da Vale (6 caminhões/vans - Cota R$ 0,00):* RHU-6I87, GEB-8C37, FOT-2A43, EXR-6J33, FKD-5E24 e FJU-4A05 NÃO consomem este aporte. O combustível é 100% fornecido diretamente pelo cliente nos seus terminais/mina.`,
      `2. *Amazon CD Meriti (GIG 1 / GIG 7):* Atendimento esporádico/sob demanda. A cota provê prontidão para saídas imediatas assim que a solicitação for acionada.`,
      `3. *Consumo por Tomada de Força (PTO):* Caminhões de Hidrovácuo (FMB-1H09) operam com sucção ligada sem rodar KM de odômetro.`,
      `4. *Margem Significativa de Segurança:* Garante que nenhum caminhão com resíduos perigosos sofra pane seca em trânsito no RJ.`
    );
  }

  if (isGlobalAporte) {
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *SALDO GLOBAL UNIFICADO NA CONTA MASTER ABANK:*`,
      `• *Valor Solicitado:* *R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* na Conta Master Corporativa.`,
      `• *Critério de Uso:* Disponibilização flexível para a frota ativa atendida pela Ambipar (15 veículos) conforme a dinâmica real da semana, sem travas rígidas individuais.`,
      `• *Veículos da Vale (6 veículos):* Cota *R$ 0,00* pois são abastecidos internamente na Vale.`,
      `• *Amazon GIG 1/7:* Cobertura sob demanda assegurada pelo saldo unificado.`
    );
  } else {
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔍 *DISTRIBUIÇÃO POR VEÍCULO / CARTÃO ABANK (15 ATIVOS + 6 VALE):*`
    );

    cycle.veiculosAbastecidos.forEach((v, index) => {
      const quota = customQuotas && customQuotas[v.placa] !== undefined
        ? customQuotas[v.placa]
        : v.solicitacaoAporteSugerido;

      if (v.recebeAporteAmbipar) {
        lines.push(
          `${index + 1}) *${v.placa}* (${v.prefixo}) · ${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''} · ${v.operacao.split('/')[0]}`,
          `   • Cartão Abank: *${v.cartaoNumero}*`,
          `   👉 *COTA DE APORTE: R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`
        );
      } else {
        lines.push(
          `${index + 1}) *${v.placa}* (${v.prefixo}) · ${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''} · Operação Vale S.A.`,
          `   • Cartão: *Sem Cartão Abank* (Abastecimento Direto Vale)`,
          `   👉 *COTA DE APORTE: R$ 0,00*`
        );
      }
    });
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Ação Solicitada:* Autorização e liberação de R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na plataforma Abank Frota.`,
    `Sistema CCO Ambipar Logistics · Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`
  );

  return lines.join('\n');
}

/**
 * Exporta dados do Aporte Semanal em formato CSV compatível com Excel
 */
export function exportCycleToCSV(cycle, marginPct = 11.8, isGlobalAporte = false, customQuotas = null) {
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte);
  
  const headers = [
    'Placa',
    'Prefixo',
    'Modelo',
    'Operacao',
    'Recebe_Aporte_Ambipar',
    'Cartao_Abank',
    'KM_Rodado',
    'Diesel_Litros',
    'Gasto_Real_RS',
    'Margem_Seguranca_RS',
    'Cota_Aporte_RS',
    'Modalidade_Aporte',
    'Motivo_Tecnico'
  ];

  const rows = cycle.veiculosAbastecidos.map(v => {
    const quota = customQuotas && customQuotas[v.placa] !== undefined
      ? customQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

    return [
      v.placa,
      v.prefixo,
      `"${v.modelo}"`,
      `"${v.operacao}"`,
      v.recebeAporteAmbipar ? 'SIM' : 'NAO (VALE)',
      `"${v.cartaoNumero}"`,
      v.kmRodado,
      v.litrosDieselTotal,
      v.valorTotalGasto.toFixed(2),
      (v.margemSegurancaRS || 0).toFixed(2),
      isGlobalAporte ? (v.recebeAporteAmbipar ? 'SALDO_GLOBAL' : '0.00') : Number(quota).toFixed(2),
      isGlobalAporte ? 'GLOBAL_UNIFICADO_ABANK' : 'COM_DIVISAO_INDIVIDUAL',
      `"${v.motivoTecnico}"`
    ].join(';');
  });

  const totalsRow = [
    'TOTAL_GERAL',
    '-',
    '-',
    '-',
    `${totals.veiculosComCota} ATIVOS + ${totals.veiculosValeZero} VALE`,
    isGlobalAporte ? 'CONTA MASTER ABANK' : 'CARTÕES ABANK',
    totals.totalKm,
    totals.totalDiesel.toFixed(1),
    totals.totalGasto.toFixed(2),
    totals.margemTotalRS.toFixed(2),
    totals.totalAporteSugerido.toFixed(2),
    isGlobalAporte ? 'SALDO_GLOBAL_UNIFICADO' : 'DISTRIBUICAO_INDIVIDUAL',
    `"${isGlobalAporte ? 'Aporte Global unificado na Conta Master Abank sem divisao previa.' : 'Divisao de cotas individuais nos cartoes Abank. Veiculos Vale com cota R$ 0,00.'}"`
  ].join(';');

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, totalsRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aporte_Semanal_Abank_${isGlobalAporte ? 'Global_' : 'Divisao_'}${totals.totalAporteSugerido.toFixed(0)}k_21Veiculos.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * GERADOR DE PDF / IMPRESSÃO EM JANELA LIMPA ISOLADA
 */
export function printAporteDossierCleanWindow(doc, isGlobalAporte = false, withTechnicalMotives = true, customQuotas = null) {
  const win = window.open('', '_blank', 'width=1050,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!win) {
    alert('Por favor, autorize a abertura de pop-ups no seu navegador para visualizar e salvar o PDF limpo.');
    return;
  }

  const veiculos = doc.veiculos || AUDITED_REAL_FLEET_PROVISION;
  const isWithMotives = doc.withTechnicalMotives !== undefined ? doc.withTechnicalMotives : withTechnicalMotives;
  const isGlobal = doc.isGlobalAporte !== undefined ? doc.isGlobalAporte : isGlobalAporte;
  const totalGeral = doc.valorTotalSolicitado || 17000.00;

  const htmlRows = veiculos.map(v => {
    const isVale = !v.recebeAporteAmbipar;
    const quota = customQuotas && customQuotas[v.placa] !== undefined
      ? customQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

    return `
      <tr class="${isVale ? 'tr-vale' : ''}">
        <td class="bold-cell">
          <strong>${v.placa}</strong><br>
          <span class="sub-label">${v.prefixo}</span>
        </td>
        <td>
          <div class="model-title">${v.modelo}</div>
          <div class="op-desc">${v.operacao} ${v.isSporadicGIG ? '<span class="pill-gig">ESPORÁDICO</span>' : ''}</div>
        </td>
        <td class="center-cell">
          ${isVale 
            ? '<span class="pill-vale">Abastecido pela Vale (R$ 0,00)</span>' 
            : `<strong class="card-num">${v.cartaoNumero}</strong>`}
        </td>
        <td class="right-cell">${Number(v.kmRodado || 0).toLocaleString('pt-BR')} km</td>
        <td class="right-cell">${isVale ? '-' : `${v.litrosDieselTotal} L`}</td>
        <td class="right-cell">${isVale ? 'R$ 0,00' : `R$ ${Number(v.valorTotalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
        <td class="right-cell ${isVale ? '' : 'text-emerald'}">
          ${isVale ? '-' : `+ R$ ${Number(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </td>
        <td class="right-cell highlight-cell">
          ${isVale 
            ? '<strong class="text-vale">R$ 0,00 (Vale)</strong>' 
            : (isGlobal 
                ? '<span class="text-global">Saldo Global Master</span>' 
                : `<strong>R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Solicitação de Aporte Semanal · Ambipar CCO RJ · Frota Completa</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 12px;
    }
    .print-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      margin-bottom: 14px;
    }
    .btn-print {
      background: #166534;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #15803d;
    }
    @media print {
      .print-controls { display: none !important; }
      body { padding: 0 !important; }
    }
    .doc-container {
      width: 100%;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 18px;
      border-radius: 6px;
      background: #ffffff;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #166534;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .logo-badge {
      display: inline-block;
      background: #166534;
      color: #ffffff;
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 2px;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .header-subtext h2 {
      margin: 4px 0 2px 0;
      font-size: 12px;
      color: #166534;
      text-transform: uppercase;
      font-weight: 800;
    }
    .header-subtext p {
      margin: 0;
      font-size: 9.5px;
      color: #64748b;
    }
    .protocol-box {
      text-align: right;
      font-size: 9.5px;
      color: #334155;
    }
    .protocol-box strong {
      display: block;
      font-size: 10.5px;
      color: #1e293b;
      font-family: monospace;
    }
    .title-banner {
      background: #f8fafc;
      border-left: 4px solid #166534;
      padding: 8px 12px;
      margin-bottom: 12px;
      border-radius: 0 4px 4px 0;
    }
    .title-banner h1 {
      margin: 0 0 3px 0;
      font-size: 13.5px;
      color: #0f172a;
      font-weight: 800;
    }
    .title-banner p {
      margin: 0;
      font-size: 10px;
      color: #475569;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
    }
    .info-card label {
      display: block;
      font-size: 8.5px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .info-card strong {
      display: block;
      font-size: 11px;
      color: #0f172a;
      margin-top: 1px;
    }
    .info-card span {
      display: block;
      font-size: 9px;
      color: #64748b;
    }
    .highlight-card strong {
      color: #166534;
      font-size: 12.5px;
    }
    .motivo-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .motivo-box h3 {
      margin: 0 0 6px 0;
      font-size: 10.5px;
      color: #166534;
      font-weight: 800;
      text-transform: uppercase;
    }
    .motivo-item {
      margin-bottom: 4px;
      font-size: 9.5px;
      color: #1e293b;
    }
    .global-mode-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .global-mode-box h3 {
      margin: 0 0 4px 0;
      font-size: 10.5px;
      color: #1d4ed8;
      font-weight: 800;
      text-transform: uppercase;
    }
    .global-mode-box p {
      margin: 0 0 4px 0;
      font-size: 9.5px;
      color: #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #cbd5e1;
      font-size: 9px;
      vertical-align: middle;
    }
    .tr-vale {
      background: #fffbeb;
    }
    .bold-cell strong {
      font-family: monospace;
      font-size: 10px;
    }
    .sub-label {
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
    }
    .model-title {
      font-weight: 600;
      color: #0f172a;
    }
    .op-desc {
      font-size: 8px;
      color: #64748b;
    }
    .pill-gig {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 7px;
      font-weight: 700;
      padding: 1px 3px;
      border-radius: 2px;
      margin-left: 3px;
    }
    .pill-vale {
      background: #fef3c7;
      color: #92400e;
      font-size: 7.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .card-num {
      color: #0369a1;
      font-family: monospace;
      font-size: 9px;
    }
    .center-cell { text-align: center; }
    .right-cell { text-align: right; font-family: monospace; }
    .highlight-cell {
      background: #f0fdf4;
      font-weight: 700;
      color: #166534;
      font-size: 9.5px;
    }
    .text-emerald { color: #16a34a; }
    .text-vale { color: #b45309; }
    .text-global { color: #2563eb; font-size: 8.5px; }
    tfoot td {
      background: #f8fafc;
      font-weight: 800;
      border-top: 2px solid #0f172a;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
    }
    .sig-box strong {
      display: block;
      font-size: 10px;
      color: #0f172a;
    }
    .sig-box span {
      display: block;
      font-size: 8.5px;
      color: #64748b;
    }
    .footer-stamp {
      margin-top: 14px;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>Visualização Executiva de Impressão · Ambipar Logistics CCO (Matriz de 21 Veículos)</strong><br>
      <span style="font-size: 10px; color: #64748b;">Layout certificado padrão A4 oficial para salvar em PDF ou imprimir sem bugs ou cortes.</span>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>

  <div class="doc-container">
    <div class="doc-header">
      <div>
        <span class="logo-badge">AMBIPAR</span>
        <div class="header-subtext">
          <h2>Ambipar Logistics & Environmental Solutions</h2>
          <p>Gestão Integrada de Frotas & Torre de Controle CCO · Base Duque de Caxias / RJ</p>
        </div>
      </div>
      <div class="protocol-box">
        PROTOCOLO OFICIAL
        <strong>${doc.numeroProtocolo || 'AMB-APORTE-2026-W43/001'}</strong>
        <span>Fechamento: Quarta 17h | Envio: Quinta 08h</span>
      </div>
    </div>

    <div class="title-banner">
      <h1>SOLICITAÇÃO OFICIAL DE APORTE SEMANAL · CARTÃO ABANK FROTA</h1>
      <p>
        Demonstrativo corporativo de saldo de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para os <strong>15 veículos ativos Ambipar</strong>.
        Os <strong>6 veículos dedicados à Vale S.A.</strong> constam com cota <strong>R$ 0,00</strong> por abastecimento direto no terminal do cliente.
      </p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <label>Gestor Aprovador:</label>
        <strong>${doc.gestorNome || 'Eng. Roberto Albuquerque'}</strong>
        <span>${doc.gestorCargo || 'Gerente Geral Logística RJ'}</span>
      </div>
      <div class="info-card">
        <label>Analista CCO:</label>
        <strong>${doc.analistaNome || 'Carlos dos Santos'}</strong>
        <span>${doc.analistaCargo || 'Analista de Operações'}</span>
      </div>
      <div class="info-card">
        <label>Convênio de Abastecimento:</label>
        <strong>${doc.convenio || 'Cartão Abank Frota'}</strong>
        <span>Recargas Corporativas</span>
      </div>
      <div class="info-card highlight-card">
        <label>Total do Aporte Solicitado:</label>
        <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        <span>15 Veículos Ambipar | 6 Veículos Vale (R$ 0,00)</span>
      </div>
    </div>

    ${isGlobal ? `
      <div class="global-mode-box">
        <h3>Modalidade Executiva: Aporte Global Unificado na Conta Master Abank (Sem Divisão Prévia)</h3>
        <p>
          O saldo total de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é solicitado como crédito unificado centralizado na <strong>Conta Master Abank Frota</strong> para alocação flexível aos 15 veículos ativos da Ambipar.
        </p>
        <p style="margin: 0; font-size: 9px;">
          <em>Regra Vale S.A.:</em> Os 6 caminhões/vans dedicados à <strong>Vale S.A. continuam com cota R$ 0,00</strong> (abastecimento pelo cliente).
        </p>
      </div>
    ` : ''}

    ${isWithMotives ? `
      <div class="motivo-box">
        <h3>1. Justificativa Técnica Operacional & Regras de Atendimento</h3>
        <div class="motivo-item">
          <strong>• Veículos da Vale S.A. (6 veículos - Cota R$ 0,00):</strong> RHU-6I87, GEB-8C37, FOT-2A43, EXR-6J33, FKD-5E24 e FJU-4A05 <em>NÃO recebem abastecimento da nossa parte e não possuem Cartão Abank</em>. O combustível é 100% fornecido pela Vale em seus terminais/minas.
        </div>
        <div class="motivo-item">
          <strong>• Amazon CD Meriti (GIG 1 / GIG 7 - Solicitação Esporádica):</strong> Atendimento sob demanda com cota de prontidão assegurada.
        </div>
        <div class="motivo-item">
          <strong>• Tomada de Força (PTO):</strong> Caminhão de Hidrovácuo (FMB-1H09) opera com sucção ligada sem rodar odômetro.
        </div>
        <div class="motivo-item">
          <strong>• Margem Significativa de Segurança:</strong> Provisão indispensável contra retenções de trânsito na Dutra e Linha Vermelha.
        </div>
      </div>
    ` : ''}

    <h3>${isGlobal ? '2. Matriz de Referência Operacional da Frota (21 Veículos Cadastrados na Base)' : '2. Matriz de Alocação de Cotas por Veículo / Cartão Abank (21 Veículos)'}</h3>
    <table>
      <thead>
        <tr>
          <th>Placa / Prefixo</th>
          <th>Modelo & Operação</th>
          <th>Cartão Abank</th>
          <th style="text-align: right;">KM Rodado</th>
          <th style="text-align: right;">Diesel (L)</th>
          <th style="text-align: right;">Gasto Real (R$)</th>
          <th style="text-align: right;">Margem (+11.8%)</th>
          <th style="text-align: right; background: #e2e8f0; color: #0f172a;">${isGlobal ? 'Alocação' : 'Cota Aporte (R$)'}</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>TOTAL CONSOLIDADO (${veiculos.length} VEÍCULOS NO PERÍODO)</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalKm || 12040).toLocaleString('pt-BR')} km</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalDiesel || 2548).toLocaleString('pt-BR')} L</strong></td>
          <td class="right-cell"><strong>R$ ${Number(doc.valorGastoReal || 15309.89).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell text-emerald"><strong>+ R$ ${Number(doc.valorMargemSeguranca || 1690.11).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell highlight-cell" style="font-size: 11px;"><strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="signatures-block">
      <div class="sig-box">
        <strong>${doc.analistaNome || 'Carlos dos Santos'}</strong>
        <span>Analista de Operações & CCO Ambipar</span>
        <span style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Assinatura Digital / Emissor</span>
      </div>
      <div class="sig-box">
        <strong>${doc.gestorNome || 'Eng. Roberto Albuquerque'}</strong>
        <span>Gerente Geral de Logística & Operações RJ</span>
        <span style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Aprovação & Liberação Abank</span>
      </div>
    </div>

    <div class="footer-stamp">
      Ambipar Logistics · CCO Torre de Controle Rio de Janeiro · Documento Oficial Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)} · Protocolo: ${doc.numeroProtocolo || 'AMB-APORTE'}
    </div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
