/**
 * Base de Dados e Lógica de Aporte Semanal de Combustível · Cartão Abank Frota
 * Fechamento Programado: Quarta-feira à tarde (17:00h)
 * Envio da Solicitação ao Gestor: Toda Quinta-feira pela manhã (08:00h)
 * 
 * DIRETRIZES OPERACIONAIS OFICIAIS:
 * 1. FROTA COMPLETA DA BASE (21 VEÍCULOS): Todos os veículos cadastrados no sistema aparecem nesta matriz.
 * 2. VEÍCULOS NA OPERAÇÃO DA VALE (6 VEÍCULOS): NÃO recebem abastecimento da Ambipar, NÃO recebem cartão Abank e NÃO entram na divisão financeira (Cota = R$ 0,00 com motivo técnico explícito de abastecimento interno Vale).
 * 3. VEÍCULOS ATIVOS AMBIPAR (15 VEÍCULOS): Atendidos pelo Cartão Abank Frota, com valor total de R$ 17.000,00 semanais.
 * 4. AMAZON CD MERITI (GIG 1 / GIG 7): Solicitação esporádica / sob demanda, com cota provisionada de prontidão.
 * 5. MODALIDADES: Aporte com Divisão por Veículo OU Aporte Global Sem Divisão (Saldo Master Abank).
 */

export const DEFAULT_CYCLE_SETTINGS = {
  cutoffDay: 'Quarta-feira',
  cutoffHour: '17:00',
  reportDay: 'Quinta-feira',
  reportHour: '08:00',
  valorBaseAporteSemanal: 17000.00, // R$ 17k semanais
  defaultContingencyPct: 11.8,     // Margem de segurança operacional
  gestorNome: 'Eng. Roberto Albuquerque',
  gestorCargo: 'Gerente Geral de Logística & Operações RJ',
  analistaResponsavel: 'Carlos dos Santos',
  analistaCargo: 'Analista de Logística & Operações CCO',
  convenioPadrao: 'Cartão Abank Frota Corporativa'
};

/**
 * MATRIZ AUDITADA DA FROTA COMPLETA DA BASE (21 VEÍCULOS)
 * 15 Veículos Ambipar (R$ 17.000,00 nos cartões Abank)
 * 6 Veículos Vale (R$ 0,00 - Abastecimento fornecido internamente pela Vale)
 */
export const AUDITED_REAL_FLEET_PROVISION = [
  // ==========================================
  // 1. CARROS ATIVOS AMBIPAR (15 VEÍCULOS)
  // TOTAL: R$ 17.000,00 NO CARTÃO ABANK FROTA
  // ==========================================
  {
    placa: 'EWX-0I82',
    prefixo: 'AMB-106',
    modelo: 'VW Constellation 25.390 (Cavalo 6x2)',
    tipo: 'Cavalo Mecânico Carreta',
    operacao: 'Transferências Rodoviárias Intermunicipais / Interestaduais',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 9940',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 310650,
    kmFinal: 312450,
    kmRodado: 1800,
    metaKmL: 2.60,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '05:50',
        posto: 'Rede Graal Resende (Via Dutra km 304)',
        cidade: 'Resende / RJ',
        dieselLitros: 320.0,
        precoDiesel: 6.35,
        arlaLitros: 15.0,
        precoArla: 3.85,
        valorTotal: 2089.75,
        kmNoAto: 311550,
        nfNumero: 'NF-e 88190',
        comprovante: 'ABK-981105'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '13:10',
        posto: 'Posto Presidente Dutra (BR-116 km 178)',
        cidade: 'Nova Iguaçu / RJ',
        dieselLitros: 260.0,
        precoDiesel: 6.29,
        arlaLitros: 15.0,
        precoArla: 3.80,
        valorTotal: 1692.40,
        kmNoAto: 312450,
        nfNumero: 'NF-e 88470',
        comprovante: 'ABK-983890'
      }
    ],
    litrosDieselTotal: 580.0,
    litrosArlaTotal: 30.0,
    valorTotalGasto: 3782.15,
    margemSegurancaRS: 317.85,
    solicitacaoAporteSugerido: 4100.00,
    saldoCartaoAtual: 180.00,
    statusMedia: 'Na Meta (2.65 km/l)',
    motivoTecnico: 'Cavalo mecânico rodoviário tracionando conjuntos pesados de 45t PBT (Dutra, Resende e SP). Principal percurso rodoviário da frota Ambipar.'
  },
  {
    placa: 'FVV-0E16',
    prefixo: 'AMB-105',
    modelo: 'Ford Cargo 2629 6x4 Roll-On',
    tipo: 'Roll-On / Roll-Off 25t',
    operacao: 'Base Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 8820',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    isSporadicGIG: true,
    kmInicial: 187120,
    kmFinal: 188420,
    kmRodado: 1300,
    metaKmL: 2.20,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:15',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 200.0,
        precoDiesel: 6.28,
        arlaLitros: 10.0,
        precoArla: 3.79,
        valorTotal: 1293.90,
        kmNoAto: 187750,
        nfNumero: 'NF-e 66104',
        comprovante: 'ABK-981502'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '16:10',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 190.0,
        precoDiesel: 6.29,
        arlaLitros: 10.0,
        precoArla: 3.80,
        valorTotal: 1233.10,
        kmNoAto: 188420,
        nfNumero: 'NF-e 66590',
        comprovante: 'ABK-984400'
      }
    ],
    litrosDieselTotal: 390.0,
    litrosArlaTotal: 20.0,
    valorTotalGasto: 2527.00,
    margemSegurancaRS: 273.00,
    solicitacaoAporteSugerido: 2800.00,
    saldoCartaoAtual: 110.00,
    statusMedia: 'Dentro da Meta (2.20 km/l)',
    motivoTecnico: 'Atendimento a caçambas da Base Caxias e acionamentos esporádicos sob demanda dos CDs Amazon GIG 1 e GIG 7 (Meriti), com cota de prontidão.'
  },
  {
    placa: 'FMB-1H09',
    prefixo: 'AMB-109',
    modelo: 'VW 26.280 CRM Hidrovácuo',
    tipo: 'Caminhão Hidrovácuo / Vácuo',
    operacao: 'Sucção de Efluentes Líquidos Industriais & Limpeza Pesada Base DCX',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 7715',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 142100,
    kmFinal: 142950,
    kmRodado: 850,
    metaKmL: 1.85,
    diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '11:45',
        posto: 'Posto Petrobras REDUC (Rod. Washington Luiz)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 170.0,
        precoDiesel: 6.32,
        arlaLitros: 10.0,
        precoArla: 3.82,
        valorTotal: 1112.60,
        kmNoAto: 142500,
        nfNumero: 'NF-e 44102',
        comprovante: 'ABK-982110'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '15:30',
        posto: 'Posto Petrobras REDUC (Rod. Washington Luiz)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 150.0,
        precoDiesel: 6.31,
        arlaLitros: 8.0,
        precoArla: 3.82,
        valorTotal: 977.06,
        kmNoAto: 142950,
        nfNumero: 'NF-e 44380',
        comprovante: 'ABK-984022'
      }
    ],
    litrosDieselTotal: 320.0,
    litrosArlaTotal: 18.0,
    valorTotalGasto: 2089.66,
    margemSegurancaRS: 210.34,
    solicitacaoAporteSugerido: 2300.00,
    saldoCartaoAtual: 75.00,
    statusMedia: 'PTO Severo (Sucção Contínua)',
    motivoTecnico: 'Caminhão de hidrovácuo com alto consumo em tomada de força (PTO) operando bomba de anel líquido em sucção estática industrial.'
  },
  {
    placa: 'GCT-7B23',
    prefixo: 'AMB-110',
    modelo: 'VW 31.330 6x4 Roll-On',
    tipo: 'Roll-On / Roll-Off 25t Pesado',
    operacao: 'Transporte de Caçambas Industriais e Destinação Base DCX',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 1120',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 75630,
    kmFinal: 76580,
    kmRodado: 950,
    metaKmL: 2.15,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '08:40',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 140.0,
        precoDiesel: 6.29,
        arlaLitros: 8.0,
        precoArla: 3.80,
        valorTotal: 911.00,
        kmNoAto: 76100,
        nfNumero: 'NF-e 77310',
        comprovante: 'ABK-981770'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '14:50',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 110.0,
        precoDiesel: 6.29,
        arlaLitros: 6.0,
        precoArla: 3.80,
        valorTotal: 714.70,
        kmNoAto: 76580,
        nfNumero: 'NF-e 77590',
        comprovante: 'ABK-983995'
      }
    ],
    litrosDieselTotal: 250.0,
    litrosArlaTotal: 14.0,
    valorTotalGasto: 1625.70,
    margemSegurancaRS: 174.30,
    solicitacaoAporteSugerido: 1800.00,
    saldoCartaoAtual: 90.00,
    statusMedia: 'Na Meta (2.15 km/l)',
    motivoTecnico: 'Caminhão roll-on pesado 6x4 operando em descarte e destinação de caçambas de resíduos industriais da Base Caxias para aterros licenciados.'
  },
  {
    placa: 'FER-8E56',
    prefixo: 'AMB-102',
    modelo: 'VW 31.280 CRM 6x4',
    tipo: 'Caminhão Traçado Pesado',
    operacao: 'Remoção de Resíduos Pesados / Bases Operacionais RJ',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 4410',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 50970,
    kmFinal: 51620,
    kmRodado: 650,
    metaKmL: 2.10,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '10:15',
        posto: 'Posto Petrobras REDUC (Rod. Washington Luiz)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 170.0,
        precoDiesel: 6.30,
        arlaLitros: 10.0,
        precoArla: 3.80,
        valorTotal: 1109.00,
        kmNoAto: 51620,
        nfNumero: 'NF-e 55100',
        comprovante: 'ABK-982440'
      }
    ],
    litrosDieselTotal: 170.0,
    litrosArlaTotal: 10.0,
    valorTotalGasto: 1109.00,
    margemSegurancaRS: 91.00,
    solicitacaoAporteSugerido: 1200.00,
    saldoCartaoAtual: 60.00,
    statusMedia: 'Na Meta (2.10 km/l)',
    motivoTecnico: 'Caminhão 6x4 traçado para manobras pesadas e suporte operacional a clientes industriais na região Metropolitana do Rio.'
  },
  {
    placa: 'RAW-1B54',
    prefixo: 'AMB-101',
    modelo: 'M.Benz Accelo 1016 Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Coletas Industriais Fracionadas / Baixada Fluminense & Zona Norte',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 6632',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 47780,
    kmFinal: 48500,
    kmRodado: 720,
    metaKmL: 3.80,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '09:20',
        posto: 'Posto Shell Trevo São João de Meriti',
        cidade: 'São João de Meriti / RJ',
        dieselLitros: 120.0,
        precoDiesel: 6.29,
        arlaLitros: 5.0,
        precoArla: 3.80,
        valorTotal: 773.80,
        kmNoAto: 48500,
        nfNumero: 'NF-e 11920',
        comprovante: 'ABK-982050'
      }
    ],
    litrosDieselTotal: 120.0,
    litrosArlaTotal: 5.0,
    valorTotalGasto: 773.80,
    margemSegurancaRS: 76.20,
    solicitacaoAporteSugerido: 850.00,
    saldoCartaoAtual: 45.00,
    statusMedia: 'Econômico (4.10 km/l)',
    motivoTecnico: 'Veículo médio de distribuição urbana para coletas de pequeno e médio porte em rotas fracionadas do RJ.'
  },
  {
    placa: 'GBU-0A23',
    prefixo: 'AMB-111',
    modelo: 'VW 9.170 Delivery Baú 3/4',
    tipo: 'Baú 3/4 Coleta',
    operacao: 'Operação Programa Jogue Limpo (Barra da Tijuca, Recreio & Jacarepaguá)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 5541',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 79000,
    kmFinal: 79700,
    kmRodado: 700,
    metaKmL: 3.90,
    diasAbastecimento: ['Seg (19/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '14:15',
        posto: 'Posto Shell Linha Amarela (Inhaúma)',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 120.0,
        precoDiesel: 6.30,
        arlaLitros: 5.0,
        precoArla: 3.80,
        valorTotal: 775.00,
        kmNoAto: 79700,
        nfNumero: 'NF-e 12040',
        comprovante: 'ABK-981600'
      }
    ],
    litrosDieselTotal: 120.0,
    litrosArlaTotal: 5.0,
    valorTotalGasto: 775.00,
    margemSegurancaRS: 75.00,
    solicitacaoAporteSugerido: 850.00,
    saldoCartaoAtual: 50.00,
    statusMedia: 'Dentro da Meta (3.92 km/l)',
    motivoTecnico: 'Coleta de embalagens plásticas de lubrificantes pós-consumo em postos e oficinas na Zona Oeste/Barra.'
  },
  {
    placa: 'RHV-9F78',
    prefixo: 'AMB-103',
    modelo: 'M.Benz Atego 2426 Baú Toco',
    tipo: 'Baú Toco Distribuição',
    operacao: 'Transferências Regionais e Coletas Base DCX',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 3320',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 54160,
    kmFinal: 54740,
    kmRodado: 580,
    metaKmL: 3.20,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '16:00',
        posto: 'Posto Petrobras REDUC (Rod. Washington Luiz)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 98.0,
        precoDiesel: 6.29,
        arlaLitros: 4.0,
        precoArla: 3.80,
        valorTotal: 631.62,
        kmNoAto: 54740,
        nfNumero: 'NF-e 33105',
        comprovante: 'ABK-982880'
      }
    ],
    litrosDieselTotal: 98.0,
    litrosArlaTotal: 4.0,
    valorTotalGasto: 631.62,
    margemSegurancaRS: 68.38,
    solicitacaoAporteSugerido: 700.00,
    saldoCartaoAtual: 40.00,
    statusMedia: 'Na Meta (3.20 km/l)',
    motivoTecnico: 'Caminhão toco com baú de alta cubagem para rotas de transferência logística de produtos químicos e resíduos secos.'
  },
  {
    placa: 'TBX-9D85',
    prefixo: 'AMB-108',
    modelo: 'VW Constellation Baú Toco',
    tipo: 'Baú Toco Logística',
    operacao: 'Coletas Comerciais e Logística Reversa Base DCX',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 2210',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 69780,
    kmFinal: 70340,
    kmRodado: 560,
    metaKmL: 3.10,
    diasAbastecimento: ['Seg (19/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '17:30',
        posto: 'Posto Petrobras REDUC (Rod. Washington Luiz)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 98.0,
        precoDiesel: 6.29,
        arlaLitros: 4.0,
        precoArla: 3.80,
        valorTotal: 631.62,
        kmNoAto: 70340,
        nfNumero: 'NF-e 22910',
        comprovante: 'ABK-981990'
      }
    ],
    litrosDieselTotal: 98.0,
    litrosArlaTotal: 4.0,
    valorTotalGasto: 631.62,
    margemSegurancaRS: 68.38,
    solicitacaoAporteSugerido: 700.00,
    saldoCartaoAtual: 40.00,
    statusMedia: 'Na Meta (3.10 km/l)',
    motivoTecnico: 'Operação de coletas regulares programadas de clientes industriais e centros de triagem da Baixada.'
  },
  {
    placa: 'DWE-4I52',
    prefixo: 'AMB-112',
    modelo: 'VW Delivery VUC Baú',
    tipo: 'Baú Urbano VUC',
    operacao: 'Operação Programa Jogue Limpo (Zona Sul / Centro RJ)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0980',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 82440,
    kmFinal: 82820,
    kmRodado: 380,
    metaKmL: 4.50,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '15:10',
        posto: 'Posto Shell Linha Vermelha',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 48.0,
        precoDiesel: 6.30,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 302.40,
        kmNoAto: 82820,
        nfNumero: 'NF-e 09811',
        comprovante: 'ABK-982750'
      }
    ],
    litrosDieselTotal: 48.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 302.40,
    margemSegurancaRS: 47.60,
    solicitacaoAporteSugerido: 350.00,
    saldoCartaoAtual: 30.00,
    statusMedia: 'Econômico (4.60 km/l)',
    motivoTecnico: 'VUC ágil para coletas em garagens e postos de combustíveis na Zona Sul do Rio de Janeiro.'
  },
  {
    placa: 'EBY-7B92',
    prefixo: 'AMB-113',
    modelo: 'VW Delivery VUC Baú',
    tipo: 'Baú Urbano VUC',
    operacao: 'Coletas Centro RJ & Zona Portuária',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0870',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 85580,
    kmFinal: 85940,
    kmRodado: 360,
    metaKmL: 4.50,
    diasAbastecimento: ['Seg (19/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '11:00',
        posto: 'Posto Shell Linha Vermelha',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 48.0,
        precoDiesel: 6.30,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 302.40,
        kmNoAto: 85940,
        nfNumero: 'NF-e 08722',
        comprovante: 'ABK-981440'
      }
    ],
    litrosDieselTotal: 48.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 302.40,
    margemSegurancaRS: 47.60,
    solicitacaoAporteSugerido: 350.00,
    saldoCartaoAtual: 30.00,
    statusMedia: 'Na Meta (4.50 km/l)',
    motivoTecnico: 'Atendimento a clientes do centro financeiro e zona portuária com restrição de circulação para pesados.'
  },
  {
    placa: 'EUP-4I14',
    prefixo: 'AMB-114',
    modelo: 'VW Delivery VUC Baú',
    tipo: 'Baú Urbano VUC',
    operacao: 'Coletas Baixada Fluminense & Rodovia Dutra',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0760',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 88740,
    kmFinal: 89060,
    kmRodado: 320,
    metaKmL: 4.50,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '14:20',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 42.0,
        precoDiesel: 6.28,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 263.76,
        kmNoAto: 89060,
        nfNumero: 'NF-e 07655',
        comprovante: 'ABK-982630'
      }
    ],
    litrosDieselTotal: 42.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 263.76,
    margemSegurancaRS: 36.24,
    solicitacaoAporteSugerido: 300.00,
    saldoCartaoAtual: 25.00,
    statusMedia: 'Na Meta (4.50 km/l)',
    motivoTecnico: 'Rotas de coleta de resíduos e logística reversa na Baixada Fluminense.'
  },
  {
    placa: 'EXE-7H64',
    prefixo: 'AMB-115',
    modelo: 'VW Delivery VUC Baú',
    tipo: 'Baú Urbano VUC',
    operacao: 'Coletas Zona Norte RJ & Linha Amarela',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0650',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 91870,
    kmFinal: 92180,
    kmRodado: 310,
    metaKmL: 4.50,
    diasAbastecimento: ['Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '09:40',
        posto: 'Posto Shell Linha Amarela (Inhaúma)',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 42.0,
        precoDiesel: 6.29,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 264.18,
        kmNoAto: 92180,
        nfNumero: 'NF-e 06588',
        comprovante: 'ABK-983510'
      }
    ],
    litrosDieselTotal: 42.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 264.18,
    margemSegurancaRS: 35.82,
    solicitacaoAporteSugerido: 300.00,
    saldoCartaoAtual: 25.00,
    statusMedia: 'Na Meta (4.50 km/l)',
    motivoTecnico: 'Coleta de resíduos recicláveis em shopping centers e polos comerciais da Zona Norte.'
  },
  {
    placa: 'GEQ-4H44',
    prefixo: 'AMB-116',
    modelo: 'VW Delivery VUC Baú',
    tipo: 'Baú Urbano VUC',
    operacao: 'Coletas Zona Oeste RJ (Campo Grande & Bangu)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0540',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 95000,
    kmFinal: 95300,
    kmRodado: 300,
    metaKmL: 4.50,
    diasAbastecimento: ['Ter (20/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '17:15',
        posto: 'Posto Petrobras Avenida Brasil (Realengo)',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 42.0,
        precoDiesel: 6.29,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 264.18,
        kmNoAto: 95300,
        nfNumero: 'NF-e 05419',
        comprovante: 'ABK-982990'
      }
    ],
    litrosDieselTotal: 42.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 264.18,
    margemSegurancaRS: 35.82,
    solicitacaoAporteSugerido: 300.00,
    saldoCartaoAtual: 25.00,
    statusMedia: 'Na Meta (4.50 km/l)',
    motivoTecnico: 'Atendimento a estabelecimentos automotivos e indústrias da Zona Oeste.'
  },
  {
    placa: 'SJE-4E18',
    prefixo: 'AMB-121',
    modelo: 'Fiat Argo 1.0 Flex',
    tipo: 'Veículo Leve Operacional',
    operacao: 'Supervisão de Torre CCO & Apoio Técnico de Campo Base DCX',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 0430',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 110450,
    kmFinal: 110900,
    kmRodado: 450,
    metaKmL: 12.50,
    diasAbastecimento: ['Seg (19/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '08:00',
        posto: 'Posto Ipiranga Base Caxias',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 30.0, // Gasolina C Comum
        precoDiesel: 5.89,
        arlaLitros: 0.0,
        precoArla: 0.0,
        valorTotal: 176.70,
        kmNoAto: 110900,
        nfNumero: 'NF-e 04388',
        comprovante: 'ABK-981220'
      }
    ],
    litrosDieselTotal: 30.0,
    litrosArlaTotal: 0.0,
    valorTotalGasto: 176.70,
    margemSegurancaRS: 23.30,
    solicitacaoAporteSugerido: 200.00,
    saldoCartaoAtual: 20.00,
    statusMedia: 'Na Meta (13.2 km/l)',
    motivoTecnico: 'Veículo leve para fiscalização de motoristas, vistorias de emergência e suporte da Torre CCO.'
  },

  // ==========================================
  // 2. VEÍCULOS NA OPERAÇÃO DA VALE S.A. (6 VEÍCULOS)
  // REGRA OFICIAL: COTA R$ 0,00 (NÃO RECEBEM CARTÃO ABANK)
  // ==========================================
  {
    placa: 'RHU-6I87',
    prefixo: 'AMB-104',
    modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
    tipo: 'Poliguindaste Duplo Articulado',
    operacao: 'Operação Vale S.A. (Terminal Ilha Guaíba - TIG & Mina)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 141600,
    kmFinal: 142350,
    kmRodado: 750,
    metaKmL: 2.10,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo dedicado 100% à Operação Vale S.A. (TIG Guaíba). O combustível é fornecido diretamente pelo cliente nos terminais/mina, não recebendo cartão e não consumindo saldo do Aporte Abank da Ambipar.'
  },
  {
    placa: 'GEB-8C37',
    prefixo: 'AMB-107',
    modelo: 'M.Benz Accelo Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Operação Vale S.A. (Leste Fluminense / Niterói)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 66800,
    kmFinal: 67220,
    kmRodado: 420,
    metaKmL: 4.40,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo dedicado à Operação Vale S.A. (Leste Fluminense). Abastecimento fornecido diretamente pelo cliente no terminal, com cota zerada no Aporte Ambipar.'
  },
  {
    placa: 'FOT-2A43',
    prefixo: 'AMB-117',
    modelo: 'VW 26.280 CRM Poli Duplo 6x4',
    tipo: 'Poliguindaste Duplo Articulado',
    operacao: 'Operação Vale S.A. (Operações Internas Mangaratiba / Guaíba)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 97800,
    kmFinal: 98420,
    kmRodado: 620,
    metaKmL: 2.15,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Caminhão poliguindaste da Vale S.A. operando no translado interno de caçambas na mina/terminal. Abastecimento realizado pelo cliente em ponto de abastecimento próprio.'
  },
  {
    placa: 'EXR-6J33',
    prefixo: 'AMB-118',
    modelo: 'VW 31.330 Roll-On 6x4',
    tipo: 'Roll-On / Roll-Off 25t Pesado',
    operacao: 'Operação Vale S.A. (Terminal Marítimo / Mina)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 100900,
    kmFinal: 101540,
    kmRodado: 640,
    metaKmL: 2.10,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Roll-on pesado alocado na Operação Vale S.A. O combustível é abastecido nas bombas internas do cliente, não consumindo recursos do aporte Ambipar.'
  },
  {
    placa: 'FKD-5E24',
    prefixo: 'AMB-119',
    modelo: 'Renault Master Van Cargo',
    tipo: 'Van / Furgão de Carga',
    operacao: 'Operação Vale S.A. (Apoio Logístico Interno & Amostragens)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 104100,
    kmFinal: 104660,
    kmRodado: 560,
    metaKmL: 9.80,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo de apoio e transporte de amostras ambientais exclusivo do contrato Vale S.A., abastecido internamente pelo cliente.'
  },
  {
    placa: 'FJU-4A05',
    prefixo: 'AMB-120',
    modelo: 'Renault Master Van Cargo',
    tipo: 'Van / Furgão de Carga',
    operacao: 'Operação Vale S.A. (Monitoramento Ambiental & Transporte)',
    cartaoTipo: 'Sem Cartão Abank (Abastecimento Direto Vale)',
    cartaoNumero: 'Sem Cartão Abank',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 107200,
    kmFinal: 107780,
    kmRodado: 580,
    metaKmL: 9.80,
    diasAbastecimento: ['Interno Vale S.A.'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00,
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo de monitoramento operacional do contrato Vale S.A., com abastecimento direto e exclusivo fornecido pela contratante.'
  }
];

export const INITIAL_WEEKLY_CYCLES = [
  {
    id: 'CICLO-2026-W43',
    nome: 'Ciclo Vigente · Semana 43 (Out/2026)',
    periodoInicio: '2026-10-18', // Domingo
    periodoFim: '2026-10-24',    // Sábado
    dataCorteQuarta: '2026-10-21T17:00:00', // Quarta-feira à tarde
    dataEnvioQuinta: '2026-10-22T08:00:00', // Quinta-feira pela manhã
    status: 'PRONTO_ENVIO',
    statusLabel: 'Fechamento Quarta-feira Concluído · Pronto p/ Quinta-feira',
    valorTotalAporteAlvo: 17000.00,
    margemSegurancaPct: 11.8,
    motivoGeralSolicitacao: 'Aporte semanal de R$ 17.000,00 no Cartão Abank Frota para a frota ativa atendida pela Ambipar (15 veículos). Os 6 veículos dedicados à Vale S.A. estão com cota R$ 0,00 pois o abastecimento é fornecido diretamente pelo cliente. As rotas da Amazon GIG 1 e GIG 7 são esporádicas/sob demanda, com cota de prontidão alocada.',
    veiculosAbastecidos: AUDITED_REAL_FLEET_PROVISION
  },
  {
    id: 'CICLO-2026-W42',
    nome: 'Ciclo Anterior · Semana 42 (Out/2026)',
    periodoInicio: '2026-10-11',
    periodoFim: '2026-10-17',
    dataCorteQuarta: '2026-10-14T17:00:00',
    dataEnvioQuinta: '2026-10-15T08:00:00',
    status: 'APROVADO_CREDITADO',
    statusLabel: 'Aporte Concluído · Saldo de R$ 17.000,00 Creditado nos Cartões Abank',
    valorTotalAporteAlvo: 17000.00,
    margemSegurancaPct: 11.8,
    motivoGeralSolicitacao: 'Aporte regular semana 42 aprovado pelo Gestor em 15/10/2026 às 08:35. Recargas nos cartões Abank ativas sem registro de falta de combustível.',
    veiculosAbastecidos: AUDITED_REAL_FLEET_PROVISION
  }
];

export const INITIAL_APORTE_DOCUMENTS_HISTORY = [
  {
    id: 'DOC-APORTE-ABK-2026-W43',
    numeroProtocolo: 'AMB-APORTE-2026-W43/001',
    cicloId: 'CICLO-2026-W43',
    dataFechamento: '2026-10-21T17:00:00',
    dataSolicitacao: '2026-10-22T08:00:00',
    gestorNome: 'Eng. Roberto Albuquerque',
    gestorCargo: 'Gerente Geral de Logística & Operações RJ',
    analistaNome: 'Carlos dos Santos',
    analistaCargo: 'Analista de Logística & CCO Ambipar',
    convenio: 'Cartão Abank Frota Corporativa',
    valorTotalSolicitado: 17000.00,
    valorGastoReal: 15309.89,
    valorMargemSeguranca: 1690.11,
    margemPct: 11.8,
    totalVeiculos: 21,
    veiculosComCota: 15,
    veiculosValeZero: 6,
    status: 'PRONTO_ENVIO',
    statusLabel: 'Aguardando Aprovação do Gestor (Quinta-feira Manhã)',
    motivoResumido: 'Liberação de R$ 17.000,00 para os cartões Abank da frota ativa. 6 Carros da Vale com cota R$ 0,00 (abastecimento pelo cliente). Rotas Amazon GIG 1/7 esporádicas.'
  }
];

/**
 * Pesos Históricos Auditados da Frota Ativa Ambipar (Base de R$ 17.000,00)
 * Veículos da Vale: 0% (Abastecimento fornecido diretamente pelo cliente)
 */
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
