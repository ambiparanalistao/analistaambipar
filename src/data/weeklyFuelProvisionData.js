/**
 * Base de Dados e Lógica de Aporte Semanal de Combustível
 * Programação de Fechamento: Quarta-feira à tarde (17:00h)
 * Envio da Solicitação ao Gestor: Toda Quinta-feira pela manhã (08:00h)
 * Cartões Homologados: Cartão Abank Frota
 * Ambipar Environmental Solutions - Base Duque de Caxias / Operações RJ
 */

export const DEFAULT_CYCLE_SETTINGS = {
  cutoffDay: 'Quarta-feira',
  cutoffHour: '17:00',
  reportDay: 'Quinta-feira',
  reportHour: '08:00',
  defaultContingencyPct: 8, // Margem de segurança operacional padrão de 8%
  gestorNome: 'Eng. Roberto Albuquerque',
  gestorCargo: 'Gerente Geral de Logística & Operações RJ',
  analistaResponsavel: 'Carlos dos Santos',
  analistaCargo: 'Analista de Operações & CCO Ambipar',
  convenioPadrao: 'Cartão Abank Frota'
};

export const INITIAL_WEEKLY_CYCLES = [
  {
    id: 'CICLO-2026-W43',
    nome: 'Ciclo Vigente · Semana 43 (Out/2026)',
    periodoInicio: '2026-10-18', // Domingo
    periodoFim: '2026-10-24',    // Sábado
    dataCorteQuarta: '2026-10-21T17:00:00', // Quarta-feira à tarde
    dataEnvioQuinta: '2026-10-22T08:00:00', // Quinta-feira pela manhã
    status: 'PRONTO_ENVIO', // 'EM_ANDAMENTO' | 'PRONTO_ENVIO' | 'APORTE_SOLICITADO' | 'APROVADO_CREDITADO'
    statusLabel: 'Fechamento Quarta-feira Concluído · Pronto p/ Quinta-feira',
    margemSegurancaPct: 8,
    observacaoCiclo: 'Ciclo regular com pico de operação de Roll-On na Amazon CD Meriti e transporte de minério/resíduo na Vale Guaíba.',
    veiculosAbastecidos: [
      {
        placa: 'RHU-6I87',
        prefixo: 'AMB-104',
        modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
        tipo: 'Poliguindaste Duplo',
        operacao: 'Contrato Vale S.A. (TIG Guaíba / CPBS)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 4491',
        kmInicial: 140200,
        kmFinal: 142350,
        kmRodado: 2150,
        metaKmL: 2.10,
        diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '06:45',
            posto: 'Posto Presidente Dutra (BR-116 km 178)',
            cidade: 'Nova Iguaçu / RJ',
            dieselLitros: 480.0,
            precoDiesel: 6.29,
            arlaLitros: 20.0,
            precoArla: 3.80,
            valorTotal: 3095.20,
            kmNoAto: 141150,
            nfNumero: 'NF-e 28410',
            comprovante: 'ABK-981244'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '15:30',
            posto: 'Posto Graal Petropen / Itaguaí (Rio-Santos)',
            cidade: 'Itaguaí / RJ',
            dieselLitros: 520.0,
            precoDiesel: 6.32,
            arlaLitros: 25.0,
            precoArla: 3.85,
            valorTotal: 3382.65,
            kmNoAto: 142350,
            nfNumero: 'NF-e 28670',
            comprovante: 'ABK-984112'
          }
        ],
        litrosDieselTotal: 1000.0,
        litrosArlaTotal: 45.0,
        valorTotalGasto: 6477.85,
        saldoCartaoAtual: 420.00,
        solicitacaoAporteSugerido: 7000.00, // Com margem e arredondamento operacional
        statusMedia: 'Dentro da Meta (2.15 km/l)'
      },
      {
        placa: 'FVV-0E16',
        prefixo: 'AMB-105',
        modelo: 'Ford Cargo 2629 6x4 Roll-On',
        tipo: 'Roll-On / Roll-Off 25t',
        operacao: 'Contrato Amazon Meriti (CD GIG 1 / GIG 7)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 8820',
        kmInicial: 186100,
        kmFinal: 188420,
        kmRodado: 2320,
        metaKmL: 2.20,
        diasAbastecimento: ['Seg (19/10)', 'Ter (20/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '07:15',
            posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 350.0,
            precoDiesel: 6.28,
            arlaLitros: 15.0,
            precoArla: 3.79,
            valorTotal: 2254.85,
            kmNoAto: 186850,
            nfNumero: 'NF-e 66104',
            comprovante: 'ABK-981502'
          },
          {
            data: '2026-10-20',
            diaSemana: 'Terça-feira',
            hora: '14:20',
            posto: 'Posto Shell Trevo São João de Meriti',
            cidade: 'São João de Meriti / RJ',
            dieselLitros: 340.0,
            precoDiesel: 6.30,
            arlaLitros: 15.0,
            precoArla: 3.80,
            valorTotal: 2199.00,
            kmNoAto: 187620,
            nfNumero: 'NF-e 66320',
            comprovante: 'ABK-982991'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '16:10',
            posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 360.0,
            precoDiesel: 6.29,
            arlaLitros: 18.0,
            precoArla: 3.80,
            valorTotal: 2332.80,
            kmNoAto: 188420,
            nfNumero: 'NF-e 66590',
            comprovante: 'ABK-984400'
          }
        ],
        litrosDieselTotal: 1050.0,
        litrosArlaTotal: 48.0,
        valorTotalGasto: 6786.65,
        saldoCartaoAtual: 310.00,
        solicitacaoAporteSugerido: 7350.00,
        statusMedia: 'Dentro da Meta (2.21 km/l)'
      },
      {
        placa: 'RAW-1B54',
        prefixo: 'AMB-101',
        modelo: 'M.Benz Accelo 1016 Baú 3/4',
        tipo: 'Baú 3/4 Urbano',
        operacao: 'Base Duque de Caxias (Coletas Emergenciais RJ)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 1152',
        kmInicial: 47100,
        kmFinal: 48500,
        kmRodado: 1400,
        metaKmL: 4.50,
        diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-20',
            diaSemana: 'Terça-feira',
            hora: '08:30',
            posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 155.0,
            precoDiesel: 6.25,
            arlaLitros: 8.0,
            precoArla: 3.75,
            valorTotal: 998.75,
            kmNoAto: 47800,
            nfNumero: 'NF-e 11980',
            comprovante: 'ABK-982110'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '14:45',
            posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 150.0,
            precoDiesel: 6.25,
            arlaLitros: 8.0,
            precoArla: 3.75,
            valorTotal: 967.50,
            kmNoAto: 48500,
            nfNumero: 'NF-e 12150',
            comprovante: 'ABK-984250'
          }
        ],
        litrosDieselTotal: 305.0,
        litrosArlaTotal: 16.0,
        valorTotalGasto: 1966.25,
        saldoCartaoAtual: 180.00,
        solicitacaoAporteSugerido: 2150.00,
        statusMedia: 'Excelente (4.59 km/l)'
      },
      {
        placa: 'EWX-0I82',
        prefixo: 'AMB-106',
        modelo: 'VW Constellation 25.390 (Cavalo 6x2)',
        tipo: 'Cavalo Mecânico Carreta',
        operacao: 'Contrato Amazon (Transferência Inter-CDs)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 9940',
        kmInicial: 309700,
        kmFinal: 312450,
        kmRodado: 2750,
        metaKmL: 2.60,
        diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '05:50',
            posto: 'Rede Graal Resende (Via Dutra km 304)',
            cidade: 'Resende / RJ',
            dieselLitros: 510.0,
            precoDiesel: 6.35,
            arlaLitros: 25.0,
            precoArla: 3.85,
            valorTotal: 3334.75,
            kmNoAto: 311050,
            nfNumero: 'NF-e 88190',
            comprovante: 'ABK-981105'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '13:10',
            posto: 'Posto Presidente Dutra (BR-116 km 178)',
            cidade: 'Nova Iguaçu / RJ',
            dieselLitros: 530.0,
            precoDiesel: 6.29,
            arlaLitros: 26.0,
            precoArla: 3.80,
            valorTotal: 3432.50,
            kmNoAto: 312450,
            nfNumero: 'NF-e 88470',
            comprovante: 'ABK-983890'
          }
        ],
        litrosDieselTotal: 1040.0,
        litrosArlaTotal: 51.0,
        valorTotalGasto: 6767.25,
        saldoCartaoAtual: 450.00,
        solicitacaoAporteSugerido: 7300.00,
        statusMedia: 'Na Meta (2.64 km/l)'
      },
      {
        placa: 'GEB-8C37',
        prefixo: 'AMB-107',
        modelo: 'VW Delivery 9.170 Baú 3/4',
        tipo: 'Baú 3/4 Urbano',
        operacao: 'Contrato Vale (Leste Fluminense / Niterói)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 3319',
        kmInicial: 97100,
        kmFinal: 98700,
        kmRodado: 1600,
        metaKmL: 4.40,
        diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '07:40',
            posto: 'Posto Shell BR-101 (Manilha / Itaboraí)',
            cidade: 'Itaboraí / RJ',
            dieselLitros: 180.0,
            precoDiesel: 6.28,
            arlaLitros: 9.0,
            precoArla: 3.75,
            valorTotal: 1164.15,
            kmNoAto: 97880,
            nfNumero: 'NF-e 44320',
            comprovante: 'ABK-981770'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '15:10',
            posto: 'Posto Shell BR-101 (Manilha / Itaboraí)',
            cidade: 'Itaboraí / RJ',
            dieselLitros: 185.0,
            precoDiesel: 6.28,
            arlaLitros: 9.0,
            precoArla: 3.75,
            valorTotal: 1195.55,
            kmNoAto: 98700,
            nfNumero: 'NF-e 44780',
            comprovante: 'ABK-984210'
          }
        ],
        litrosDieselTotal: 365.0,
        litrosArlaTotal: 18.0,
        valorTotalGasto: 2359.70,
        saldoCartaoAtual: 220.00,
        solicitacaoAporteSugerido: 2550.00,
        statusMedia: 'Dentro da Meta (4.38 km/l)'
      },
      {
        placa: 'GBU-0A23',
        prefixo: 'AMB-108',
        modelo: 'M.Benz Accelo 1016 Baú Plataforma',
        tipo: 'Baú Urbano Plataforma',
        operacao: 'Contrato Jogue Limpo (Barra & Recreio)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 5022',
        kmInicial: 132650,
        kmFinal: 134200,
        kmRodado: 1550,
        metaKmL: 4.40,
        diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-20',
            diaSemana: 'Terça-feira',
            hora: '09:00',
            posto: 'Posto Shell Linha Amarela / Inhaúma',
            cidade: 'Rio de Janeiro / RJ',
            dieselLitros: 175.0,
            precoDiesel: 6.34,
            arlaLitros: 8.5,
            precoArla: 3.80,
            valorTotal: 1141.80,
            kmNoAto: 133400,
            nfNumero: 'NF-e 55901',
            comprovante: 'ABK-982440'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '16:00',
            posto: 'Posto Ipiranga Av. das Américas (Recreio)',
            cidade: 'Rio de Janeiro / RJ',
            dieselLitros: 175.0,
            precoDiesel: 6.36,
            arlaLitros: 9.0,
            precoArla: 3.80,
            valorTotal: 1147.20,
            kmNoAto: 134200,
            nfNumero: 'NF-e 56120',
            comprovante: 'ABK-984380'
          }
        ],
        litrosDieselTotal: 350.0,
        litrosArlaTotal: 17.5,
        valorTotalGasto: 2289.00,
        saldoCartaoAtual: 190.00,
        solicitacaoAporteSugerido: 2500.00,
        statusMedia: 'Na Meta (4.43 km/l)'
      },
      {
        placa: 'DWE-4I52',
        prefixo: 'AMB-109',
        modelo: 'VW Delivery VUC Baú',
        tipo: 'VUC Carga Seca',
        operacao: 'Contrato Jogue Limpo (Zona Sul RJ)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 7140',
        kmInicial: 117350,
        kmFinal: 118600,
        kmRodado: 1250,
        metaKmL: 4.80,
        diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '08:15',
            posto: 'Posto BR Aterro do Flamengo / Glória',
            cidade: 'Rio de Janeiro / RJ',
            dieselLitros: 130.0,
            precoDiesel: 6.39,
            arlaLitros: 6.5,
            precoArla: 3.85,
            valorTotal: 855.73,
            kmNoAto: 117950,
            nfNumero: 'NF-e 99105',
            comprovante: 'ABK-981890'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '14:30',
            posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 130.0,
            precoDiesel: 6.25,
            arlaLitros: 6.5,
            precoArla: 3.75,
            valorTotal: 836.88,
            kmNoAto: 118600,
            nfNumero: 'NF-e 99420',
            comprovante: 'ABK-984180'
          }
        ],
        litrosDieselTotal: 260.0,
        litrosArlaTotal: 13.0,
        valorTotalGasto: 1692.61,
        saldoCartaoAtual: 140.00,
        solicitacaoAporteSugerido: 1850.00,
        statusMedia: 'Excelente (4.81 km/l)'
      },
      {
        placa: 'FMB-1H09',
        prefixo: 'AMB-110',
        modelo: 'VW 26.280 CRM Hidrovácuo',
        tipo: 'Tanque Sucção 12m³',
        operacao: 'Efluentes Industriais / Base DCX',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 6205',
        kmInicial: 85900,
        kmFinal: 87300,
        kmRodado: 1400,
        metaKmL: 1.85,
        diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
        abastecimentosDetalhe: [
          {
            data: '2026-10-19',
            diaSemana: 'Segunda-feira',
            hora: '07:00',
            posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 380.0,
            precoDiesel: 6.28,
            arlaLitros: 18.0,
            precoArla: 3.79,
            valorTotal: 2454.62,
            kmNoAto: 86550,
            nfNumero: 'NF-e 33100',
            comprovante: 'ABK-981320'
          },
          {
            data: '2026-10-21',
            diaSemana: 'Quarta-feira',
            hora: '15:45',
            posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
            cidade: 'Duque de Caxias / RJ',
            dieselLitros: 380.0,
            precoDiesel: 6.28,
            arlaLitros: 18.0,
            precoArla: 3.79,
            valorTotal: 2454.62,
            kmNoAto: 87300,
            nfNumero: 'NF-e 33490',
            comprovante: 'ABK-984330'
          }
        ],
        litrosDieselTotal: 760.0,
        litrosArlaTotal: 36.0,
        valorTotalGasto: 4909.24,
        saldoCartaoAtual: 280.00,
        solicitacaoAporteSugerido: 5350.00,
        statusMedia: 'Na Meta (1.84 km/l - PTO Ativo)'
      }
    ]
  },
  {
    id: 'CICLO-2026-W42',
    nome: 'Ciclo Anterior · Semana 42 (Out/2026)',
    periodoInicio: '2026-10-11',
    periodoFim: '2026-10-17',
    dataCorteQuarta: '2026-10-14T17:00:00',
    dataEnvioQuinta: '2026-10-15T08:00:00',
    status: 'APROVADO_CREDITADO',
    statusLabel: 'Aporte Concluído · Saldo Creditado nos Cartões Abank Frota',
    margemSegurancaPct: 8,
    observacaoCiclo: 'Aporte aprovado integralmente pelo Gestor em 15/10/2026 às 09:12. Recarga compensada no mesmo dia.',
    veiculosAbastecidos: [
      {
        placa: 'RHU-6I87',
        prefixo: 'AMB-104',
        modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
        tipo: 'Poliguindaste Duplo',
        operacao: 'Contrato Vale S.A. (TIG Guaíba / CPBS)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 4491',
        kmInicial: 138150,
        kmFinal: 140200,
        kmRodado: 2050,
        metaKmL: 2.10,
        diasAbastecimento: ['Seg (12/10)', 'Qua (14/10)'],
        abastecimentosDetalhe: [],
        litrosDieselTotal: 960.0,
        litrosArlaTotal: 42.0,
        valorTotalGasto: 6195.40,
        saldoCartaoAtual: 0,
        solicitacaoAporteSugerido: 6700.00,
        statusMedia: 'Dentro da Meta (2.14 km/l)'
      },
      {
        placa: 'FVV-0E16',
        prefixo: 'AMB-105',
        modelo: 'Ford Cargo 2629 6x4 Roll-On',
        tipo: 'Roll-On / Roll-Off 25t',
        operacao: 'Contrato Amazon Meriti (CD GIG 1 / GIG 7)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 8820',
        kmInicial: 183850,
        kmFinal: 186100,
        kmRodado: 2250,
        metaKmL: 2.20,
        diasAbastecimento: ['Seg (12/10)', 'Qua (14/10)'],
        abastecimentosDetalhe: [],
        litrosDieselTotal: 1020.0,
        litrosArlaTotal: 45.0,
        valorTotalGasto: 6580.20,
        saldoCartaoAtual: 0,
        solicitacaoAporteSugerido: 7100.00,
        statusMedia: 'Dentro da Meta (2.21 km/l)'
      },
      {
        placa: 'EWX-0I82',
        prefixo: 'AMB-106',
        modelo: 'VW Constellation 25.390 (Cavalo 6x2)',
        tipo: 'Cavalo Mecânico Carreta',
        operacao: 'Contrato Amazon (Transferência Inter-CDs)',
        cartaoTipo: 'Cartão Abank Frota',
        cartaoNumero: '•••• 9940',
        kmInicial: 307100,
        kmFinal: 309700,
        kmRodado: 2600,
        metaKmL: 2.60,
        diasAbastecimento: ['Seg (12/10)', 'Qua (14/10)'],
        abastecimentosDetalhe: [],
        litrosDieselTotal: 990.0,
        litrosArlaTotal: 48.0,
        valorTotalGasto: 6420.00,
        saldoCartaoAtual: 0,
        solicitacaoAporteSugerido: 6950.00,
        statusMedia: 'Na Meta (2.63 km/l)'
      }
    ]
  }
];

/**
 * Função utilitária para calcular o resumo consolidado de um ciclo
 */
export function calculateCycleTotals(cycle, marginPct = 8) {
  if (!cycle || !cycle.veiculosAbastecidos) {
    return {
      totalVeiculos: 0,
      totalGasto: 0,
      totalKm: 0,
      totalDiesel: 0,
      totalArla: 0,
      mediaFrotaKmL: 0,
      totalAporteSugerido: 0,
      precoMedioDiesel: 0
    };
  }

  const totalVeiculos = cycle.veiculosAbastecidos.length;
  let totalGasto = 0;
  let totalKm = 0;
  let totalDiesel = 0;
  let totalArla = 0;
  let totalAporteSugerido = 0;

  cycle.veiculosAbastecidos.forEach(v => {
    totalGasto += Number(v.valorTotalGasto) || 0;
    totalKm += Number(v.kmRodado) || 0;
    totalDiesel += Number(v.litrosDieselTotal) || 0;
    totalArla += Number(v.litrosArlaTotal) || 0;

    // Se o veículo tiver valor manual calculado, usa ele; senão calcula gasto * (1 + margin/100)
    const baseAporte = (Number(v.valorTotalGasto) || 0) * (1 + (marginPct / 100));
    const finalAporte = v.solicitacaoAporteSugerido || Math.round(baseAporte / 50) * 50;
    totalAporteSugerido += finalAporte;
  });

  const mediaFrotaKmL = totalDiesel > 0 ? (totalKm / totalDiesel).toFixed(2) : '0.00';
  const precoMedioDiesel = totalDiesel > 0 ? (totalGasto / totalDiesel).toFixed(2) : '0.00';

  return {
    totalVeiculos,
    totalGasto,
    totalKm,
    totalDiesel,
    totalArla,
    mediaFrotaKmL,
    totalAporteSugerido,
    precoMedioDiesel
  };
}

/**
 * Gera mensagem estruturada executiva pronta para copiar para o WhatsApp / E-mail do Gestor
 */
export function generateManagerWhatsAppMessage(cycle, settings = DEFAULT_CYCLE_SETTINGS, marginPct = 8) {
  const totals = calculateCycleTotals(cycle, marginPct);

  const lines = [
    `*📋 SOLICITAÇÃO SEMANAL DE APORTE DE COMBUSTÍVEL · AMBIPAR RJ*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Gestor:* ${settings.gestorNome} (${settings.gestorCargo})`,
    `👨‍💻 *Analista Solicitante:* ${settings.analistaResponsavel} (${settings.analistaCargo})`,
    `📅 *Ciclo Fechado:* Quarta-feira (17:00h) | *Envio:* Quinta-feira Manhã`,
    `💳 *Convênio / Cartão:* ${settings.convenioPadrao}`,
    ``,
    `📊 *RESUMO EXECUTIVO CONSOLIDADO DA SEMANA:*`,
    `• 🚛 *Veículos Ativos Abastecidos:* ${totals.totalVeiculos} caminhões`,
    `• 🛣️ *KM Total Percorrido:* ${totals.totalKm.toLocaleString('pt-BR')} km`,
    `• ⛽ *Volume Diesel S10:* ${totals.totalDiesel.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Litros`,
    `• 💧 *Volume ARLA 32:* ${totals.totalArla.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Litros`,
    `• 📉 *Média Geral da Frota:* ${totals.mediaFrotaKmL} km/l`,
    `• 💵 *Gasto Realizado no Ciclo:* R$ ${totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `• 🛡️ *Margem Técnica de Contingência:* +${marginPct}%`,
    ``,
    `💰 *VALOR TOTAL DE RECARGA / APORTE SOLICITADO:*`,
    `👉 *R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔍 *DETALHAMENTO INDIVIDUAL POR VEÍCULO:*`
  ];

  cycle.veiculosAbastecidos.forEach((v, index) => {
    const mediaKmL = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-';
    lines.push(
      `${index + 1}) *${v.placa}* (${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''}) · ${v.operacao.split(' ')[0]} ${v.operacao.split(' ')[1] || ''}`,
      `   • Dias Abastecidos: ${v.diasAbastecimento.join(', ')}`,
      `   • KM: ${v.kmInicial.toLocaleString('pt-BR')} ➔ ${v.kmFinal.toLocaleString('pt-BR')} (${v.kmRodado.toLocaleString('pt-BR')} km rodados)`,
      `   • Consumo: ${v.litrosDieselTotal}L Diesel | Média: ${mediaKmL} km/l`,
      `   • Gasto Realizado: R$ ${v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `   • 💳 *Aporte Sugerido (Abank ${v.cartaoNumero}): R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      ``
    );
  });

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Ação Solicitada:* Autorização e liberação do crédito na plataforma Abank para garantir a operação até a próxima quarta-feira.`,
    `Sistema CCO Ambipar Logistics · Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`
  );

  return lines.join('\n');
}

/**
 * Exporta dados do Aporte Semanal em formato CSV compatível com Excel
 */
export function exportCycleToCSV(cycle, marginPct = 8) {
  const totals = calculateCycleTotals(cycle, marginPct);
  
  const headers = [
    'Placa',
    'Prefixo',
    'Modelo',
    'Operacao',
    'Cartao_Frota',
    'Dias_Abastecimento',
    'KM_Inicial',
    'KM_Final',
    'KM_Rodado',
    'Diesel_Litros',
    'Arla_Litros',
    'Media_km_l',
    'Meta_km_l',
    'Gasto_Total_RS',
    'Saldo_Atual_Cartao_RS',
    'Aporte_Sugerido_RS'
  ];

  const rows = cycle.veiculosAbastecidos.map(v => {
    const media = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '0';
    return [
      v.placa,
      v.prefixo,
      `"${v.modelo}"`,
      `"${v.operacao}"`,
      `"${v.cartaoTipo} ${v.cartaoNumero}"`,
      `"${v.diasAbastecimento.join('; ')}"`,
      v.kmInicial,
      v.kmFinal,
      v.kmRodado,
      v.litrosDieselTotal,
      v.litrosArlaTotal,
      media,
      v.metaKmL,
      v.valorTotalGasto.toFixed(2),
      (v.saldoCartaoAtual || 0).toFixed(2),
      v.solicitacaoAporteSugerido.toFixed(2)
    ].join(';');
  });

  const totalsRow = [
    'TOTAL_GERAL',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    totals.totalKm,
    totals.totalDiesel.toFixed(1),
    totals.totalArla.toFixed(1),
    totals.mediaFrotaKmL,
    '-',
    totals.totalGasto.toFixed(2),
    '-',
    totals.totalAporteSugerido.toFixed(2)
  ].join(';');

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, totalsRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aporte_Semanal_Combustivel_Ambipar_${cycle.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
