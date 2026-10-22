import * as XLSX from 'xlsx';

// Definições dos campos do sistema Ambipar e seus sinônimos usuais em planilhas
export const FIELD_DEFINITIONS = [
  { 
    key: 'placa', 
    label: 'Placa do Veículo', 
    required: true, 
    aliases: ['placa', 'veiculo', 'veículo', 'placa veiculo', 'placa_veiculo', 'placa cavalo', 'carro', 'frota', 'cavalo', 'plate', 'veic'] 
  },
  { 
    key: 'data_abastecimento', 
    label: 'Data do Abastecimento', 
    required: true, 
    aliases: ['data', 'dt_abastecimento', 'data abastecimento', 'data_abastecimento', 'data/hora', 'emissao', 'dt emissao', 'dia', 'date', 'data_hora'] 
  },
  { 
    key: 'hora_abastecimento', 
    label: 'Hora', 
    required: false, 
    aliases: ['hora', 'horario', 'hr', 'hora abastecimento', 'time', 'hora_abastecimento'] 
  },
  { 
    key: 'modelo_veiculo', 
    label: 'Modelo do Veículo', 
    required: false, 
    aliases: ['modelo', 'modelo veiculo', 'veiculo modelo', 'tipo veiculo', 'caminhao', 'veiculo_modelo', 'descricao_veiculo'] 
  },
  { 
    key: 'motorista', 
    label: 'Motorista / Condutor', 
    required: false, 
    aliases: ['motorista', 'condutor', 'nome motorista', 'nome_motorista', 'colaborador', 'operador', 'driver', 'motorista_nome'] 
  },
  { 
    key: 'tipo_combustivel', 
    label: 'Combustível', 
    required: false, 
    aliases: ['combustivel', 'combustível', 'tipo combustivel', 'produto', 'combustivel tipo', 'tipo', 'fuel', 'descricao_produto'] 
  },
  { 
    key: 'litros', 
    label: 'Litros Abastecidos', 
    required: true, 
    aliases: ['litros', 'qtd', 'quantidade', 'volume', 'litragem', 'lts', 'litros abastecidos', 'liters', 'qtd_abastecida', 'vol'] 
  },
  { 
    key: 'preco_litro', 
    label: 'Preço por Litro (R$)', 
    required: false, 
    aliases: ['preco', 'preço', 'preco litro', 'vl unitario', 'valor litro', 'unitario', 'unitário', 'vl unit', 'preco/litro', 'price', 'valor_unitario'] 
  },
  { 
    key: 'valor_total', 
    label: 'Valor Total (R$)', 
    required: false, 
    aliases: ['valor', 'valor total', 'total', 'vl total', 'r$ total', 'total pago', 'valor pago', 'valor_total', 'amount', 'vlr_total'] 
  },
  { 
    key: 'hodometro_atual', 
    label: 'KM / Hodômetro Atual', 
    required: false, 
    aliases: ['km', 'km atual', 'hodometro', 'hodômetro', 'km_atual', 'odometro', 'km final', 'odometer', 'km_abastecimento'] 
  },
  { 
    key: 'hodometro_anterior', 
    label: 'KM Anterior', 
    required: false, 
    aliases: ['km anterior', 'hodometro anterior', 'odometro anterior', 'km_anterior', 'km inicial', 'odometro_anterior'] 
  },
  { 
    key: 'posto_nome', 
    label: 'Posto / Fornecedor', 
    required: false, 
    aliases: ['posto', 'nome posto', 'posto nome', 'estabelecimento', 'fornecedor', 'razao social', 'rede', 'station', 'nome_fantasia'] 
  },
  { 
    key: 'cidade', 
    label: 'Cidade', 
    required: false, 
    aliases: ['cidade', 'municipio', 'cidade_posto', 'local', 'city'] 
  },
  { 
    key: 'uf', 
    label: 'UF / Estado', 
    required: false, 
    aliases: ['uf', 'estado', 'uf_posto', 'state'] 
  },
  { 
    key: 'nota_fiscal', 
    label: 'Nota Fiscal / Cupom', 
    required: false, 
    aliases: ['nf', 'nota fiscal', 'num nf', 'numero_nf', 'cupom', 'documento', 'fatura', 'ticket', 'invoice'] 
  },
  { 
    key: 'forma_pagamento', 
    label: 'Forma de Pagamento', 
    required: false, 
    aliases: ['forma pagamento', 'pagamento', 'cartao', 'meio pagamento', 'forma_pagto', 'payment', 'tipo_pagamento'] 
  }
];

// Normaliza strings para comparação flexível
export const normalizeHeader = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, ' ')      // remove pontuações
    .trim()
    .replace(/\s+/g, ' ');           // espaços únicos
};

// Detecção Automática Inteligente de Colunas
export const detectColumnMapping = (rawHeaders) => {
  const mapping = {};
  const usedIndices = new Set();

  FIELD_DEFINITIONS.forEach(field => {
    // Procura por correspondência exata ou alias
    let matchedIndex = -1;
    for (let i = 0; i < rawHeaders.length; i++) {
      if (usedIndices.has(i)) continue;
      const normalizedCol = normalizeHeader(rawHeaders[i]);

      // 1. Testa se o alias é idêntico
      const exactMatch = field.aliases.some(alias => normalizeHeader(alias) === normalizedCol);
      if (exactMatch) {
        matchedIndex = i;
        break;
      }

      // 2. Testa se o alias está contido
      const containsMatch = field.aliases.some(alias => {
        const normAlias = normalizeHeader(alias);
        return normalizedCol.includes(normAlias) || normAlias.includes(normalizedCol);
      });
      if (containsMatch && matchedIndex === -1) {
        matchedIndex = i;
      }
    }

    if (matchedIndex !== -1) {
      mapping[field.key] = rawHeaders[matchedIndex];
      usedIndices.add(matchedIndex);
    } else {
      mapping[field.key] = '';
    }
  });

  return mapping;
};

// Conversão inteligente de números (trata formatos brasileiros "1.520,30" ou internacionais "1520.30")
export const parseSmartNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim().replace(/[R$\s]/g, '');
  if (!str) return 0;

  // Se tem vírgula e ponto (ex: "1.250,50")
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Apenas vírgula (ex: "1250,50")
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Conversão inteligente de datas de Excel e strings comuns
export const parseSmartDate = (val) => {
  if (!val) return new Date().toISOString().split('T')[0];

  // Se já for uma instância de Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // Se for serial number de data do Excel (ex: 45230)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = val * 86400000;
    const dateObj = new Date(excelEpoch.getTime() + millis);
    return dateObj.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  // Formato brasileiro DD/MM/AAAA ou DD-MM-AAAA
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Formato ISO AAAA-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};

// Leitor assíncrono de arquivo Excel (.xlsx, .xls) ou CSV
export const readSpreadsheetFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('A planilha selecionada não possui abas visíveis.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converte a aba para matriz de objetos brutos
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rawJson || rawJson.length < 2) {
          throw new Error('A planilha selecionada está vazia ou contém apenas o cabeçalho.');
        }

        const rawHeaders = rawJson[0].map(h => String(h || '').trim()).filter(Boolean);
        const dataRows = rawJson.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

        // Mapeia para objetos { [header]: value }
        const parsedRows = dataRows.map(row => {
          const rowObj = {};
          rawHeaders.forEach((header, colIndex) => {
            rowObj[header] = row[colIndex] !== undefined ? row[colIndex] : '';
          });
          return rowObj;
        });

        const detectedMapping = detectColumnMapping(rawHeaders);

        resolve({
          fileName: file.name,
          sheetNames: workbook.SheetNames,
          activeSheet: sheetName,
          rawHeaders,
          totalRows: parsedRows.length,
          parsedRows,
          detectedMapping
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo selecionado no disco.'));
    reader.readAsArrayBuffer(file);
  });
};

// Transforma linhas brutas mapeadas em registros completos do FuelModule com cálculos derivados
export const convertRowsToFuelRecords = (rawRows, mapping, existingRecords = [], options = { skipDuplicates: true }) => {
  const records = [];
  let skippedDuplicates = 0;
  let invalidRows = 0;

  // Cria set para detectar duplicatas rápidas (placa + data + litros ou nf)
  const existingKeys = new Set(
    existingRecords.map(r => `${(r.placa || '').toUpperCase()}_${r.data_abastecimento}_${Number(r.litros).toFixed(1)}_${r.nota_fiscal || ''}`)
  );

  rawRows.forEach((row, idx) => {
    // Extrai valores a partir do mapeamento
    const getVal = (fieldKey) => {
      const headerName = mapping[fieldKey];
      return headerName && row[headerName] !== undefined ? row[headerName] : '';
    };

    const placaRaw = String(getVal('placa') || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    const litrosNum = parseSmartNumber(getVal('litros'));

    // Validação mínima de integridade
    if (!placaRaw || litrosNum <= 0) {
      invalidRows++;
      return;
    }

    const dataAbast = parseSmartDate(getVal('data_abastecimento'));
    const horaAbast = String(getVal('hora_abastecimento') || '12:00').trim().slice(0, 5);
    const nf = String(getVal('nota_fiscal') || '').trim();

    // Verificação de Duplicatas
    const duplicateKey = `${placaRaw}_${dataAbast}_${litrosNum.toFixed(1)}_${nf}`;
    if (options.skipDuplicates && existingKeys.has(duplicateKey)) {
      skippedDuplicates++;
      return;
    }
    existingKeys.add(duplicateKey);

    let precoLitro = parseSmartNumber(getVal('preco_litro'));
    let valorTotal = parseSmartNumber(getVal('valor_total'));

    if (valorTotal > 0 && precoLitro === 0 && litrosNum > 0) {
      precoLitro = Number((valorTotal / litrosNum).toFixed(3));
    } else if (precoLitro > 0 && valorTotal === 0 && litrosNum > 0) {
      valorTotal = Number((litrosNum * precoLitro).toFixed(2));
    }

    const kmAtual = parseSmartNumber(getVal('hodometro_atual'));
    const kmAnterior = parseSmartNumber(getVal('hodometro_anterior'));
    const distKm = kmAtual > kmAnterior ? kmAtual - kmAnterior : 0;
    const kmPorLitro = distKm > 0 && litrosNum > 0 ? Number((distKm / litrosNum).toFixed(2)) : null;
    const cpk = distKm > 0 && valorTotal > 0 ? Number((valorTotal / distKm).toFixed(2)) : null;

    let fuelType = String(getVal('tipo_combustivel') || 'Diesel S10').trim();
    if (!fuelType) fuelType = 'Diesel S10';

    // Cálculo ESG de CO2
    let co2Kg = 0;
    if (fuelType.includes('HVO')) {
      co2Kg = Number((litrosNum * 0.53).toFixed(1));
    } else if (fuelType.includes('Diesel')) {
      co2Kg = Number((litrosNum * 2.68).toFixed(1));
    } else if (fuelType.includes('Gasolina')) {
      co2Kg = Number((litrosNum * 2.27).toFixed(1));
    } else if (fuelType.includes('Etanol')) {
      co2Kg = Number((litrosNum * 0.45).toFixed(1));
    }

    records.push({
      id: `imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      data_abastecimento: dataAbast,
      hora_abastecimento: horaAbast,
      placa: placaRaw,
      modelo_veiculo: String(getVal('modelo_veiculo') || 'Veículo Frota').trim(),
      motorista: String(getVal('motorista') || 'Escala CCO').trim(),
      tipo_combustivel: fuelType,
      litros: litrosNum,
      preco_litro: precoLitro > 0 ? precoLitro.toFixed(3) : '6.15',
      valor_total: valorTotal > 0 ? valorTotal.toFixed(2) : (litrosNum * 6.15).toFixed(2),
      hodometro_atual: kmAtual > 0 ? kmAtual : '',
      hodometro_anterior: kmAnterior > 0 ? kmAnterior : '',
      distancia_percorrida_km: distKm,
      km_por_litro: kmPorLitro,
      custo_por_km: cpk,
      co2_emitido_kg: co2Kg,
      tanque_cheio: true,
      posto_nome: String(getVal('posto_nome') || 'Rede Credenciada').trim(),
      posto_cnpj: '',
      cidade: String(getVal('cidade') || 'Base CCO').trim(),
      uf: String(getVal('uf') || 'SP').trim().toUpperCase().slice(0, 2),
      rodovia_km: '',
      nota_fiscal: nf,
      forma_pagamento: String(getVal('forma_pagamento') || 'Cartão Frota - Ticket Log').trim(),
      nivel_tanque_pos: '100%',
      observacoes: 'Importado via planilha XLS/CSV',
      origem_importacao: 'planilha_excel'
    });
  });

  return {
    records,
    skippedDuplicates,
    invalidRows,
    totalImported: records.length
  };
};

// Parser para copiar e colar diretamente do Excel (Ctrl+C / Ctrl+V em lote)
export const parseClipboardTable = (clipboardText) => {
  if (!clipboardText || !clipboardText.trim()) return [];

  const lines = clipboardText.trim().split(/\r\n|\r|\n/);
  if (lines.length === 0) return [];

  // Quebra por tabulações (\t)
  const rows = lines.map(line => line.split('\t').map(cell => cell.trim()));
  return rows;
};

// Exportador profissional para arquivo nativo .xlsx com abas e formatação
export const exportFuelRecordsToExcel = (records, fileName = 'abastecimentos_frota_ambipar.xlsx') => {
  const wb = XLSX.utils.book_new();

  // 1. Aba Principal: Abastecimentos Detalhados
  const formattedRows = records.map((r, index) => ({
    'Nº': index + 1,
    'Data': r.data_abastecimento,
    'Hora': r.hora_abastecimento || '',
    'Placa': r.placa,
    'Modelo do Veículo': r.modelo_veiculo || '',
    'Motorista / Condutor': r.motorista || '',
    'Tipo de Combustível': r.tipo_combustivel || 'Diesel S10',
    'Litros': Number(r.litros) || 0,
    'Preço / Litro (R$)': Number(r.preco_litro) || 0,
    'Valor Total (R$)': Number(r.valor_total) || 0,
    'KM Anterior': Number(r.hodometro_anterior) || '',
    'KM Atual': Number(r.hodometro_atual) || '',
    'Distância (KM)': Number(r.distancia_percorrida_km) || '',
    'Média (KM/L)': Number(r.km_por_litro) || '',
    'CPK (R$/KM)': Number(r.custo_por_km) || '',
    'Posto de Abastecimento': r.posto_nome || '',
    'Cidade': r.cidade || '',
    'UF': r.uf || '',
    'Nota Fiscal': r.nota_fiscal || '',
    'Forma de Pagamento': r.forma_pagamento || '',
    'CO2 Emitido (kg)': Number(r.co2_emitido_kg) || ''
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);

  // Largura automática das colunas
  const colWidths = [
    { wch: 6 },  // Nº
    { wch: 12 }, // Data
    { wch: 8 },  // Hora
    { wch: 11 }, // Placa
    { wch: 24 }, // Modelo
    { wch: 22 }, // Motorista
    { wch: 20 }, // Combustível
    { wch: 12 }, // Litros
    { wch: 15 }, // Preço/L
    { wch: 16 }, // Total R$
    { wch: 12 }, // KM Anterior
    { wch: 12 }, // KM Atual
    { wch: 14 }, // Distância
    { wch: 14 }, // KM/L
    { wch: 14 }, // CPK
    { wch: 26 }, // Posto
    { wch: 16 }, // Cidade
    { wch: 6 },  // UF
    { wch: 14 }, // NF
    { wch: 22 }, // Pagamento
    { wch: 16 }  // CO2
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Abastecimentos');

  // 2. Aba Executiva: Resumo CCO
  const totalLitros = records.reduce((acc, r) => acc + (Number(r.litros) || 0), 0);
  const totalValor = records.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
  const totalKm = records.reduce((acc, r) => acc + (Number(r.distancia_percorrida_km) || 0), 0);
  const mediaGeral = totalLitros > 0 && totalKm > 0 ? (totalKm / totalLitros).toFixed(2) : '0.00';
  const cpkGeral = totalKm > 0 && totalValor > 0 ? (totalValor / totalKm).toFixed(2) : '0.00';

  const summaryRows = [
    { 'Indicador Executivo CCO': 'Total de Abastecimentos Registrados', 'Valor Consolidado': records.length },
    { 'Indicador Executivo CCO': 'Volume Total Abastecido (Litros)', 'Valor Consolidado': Number(totalLitros.toFixed(2)) },
    { 'Indicador Executivo CCO': 'Custo Financeiro Total (R$)', 'Valor Consolidado': Number(totalValor.toFixed(2)) },
    { 'Indicador Executivo CCO': 'Distância Percorrida Total (KM)', 'Valor Consolidado': Number(totalKm.toFixed(2)) },
    { 'Indicador Executivo CCO': 'Média Geral de Rendimento (KM/L)', 'Valor Consolidado': Number(mediaGeral) },
    { 'Indicador Executivo CCO': 'Custo Médio por KM (R$/KM)', 'Valor Consolidado': Number(cpkGeral) },
    { 'Indicador Executivo CCO': 'Data da Exportação', 'Valor Consolidado': new Date().toLocaleString('pt-BR') }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo_CCO');

  // Grava e dispara o download do arquivo no navegador
  XLSX.writeFile(wb, fileName);
};

// Gera o Modelo Oficial em Branco (.xlsx) com instruções para preenchimento da equipe
export const generateBlankTemplateExcel = () => {
  const wb = XLSX.utils.book_new();

  const templateRows = [
    {
      'PLACA': 'ABC1D23',
      'DATA': '2026-10-22',
      'HORA': '08:30',
      'MODELO': 'Volvo FH 540 6x4',
      'MOTORISTA': 'João da Silva',
      'COMBUSTIVEL': 'Diesel S10',
      'LITROS': 450.5,
      'PRECO_LITRO': 6.19,
      'VALOR_TOTAL': 2788.60,
      'KM_ANTERIOR': 142100,
      'KM_ATUAL': 143180,
      'POSTO': 'Posto Graal Rodovia Anhanguera',
      'CIDADE': 'Campinas',
      'UF': 'SP',
      'NOTA_FISCAL': '109842',
      'FORMA_PAGAMENTO': 'Cartão Frota - Ticket Log'
    },
    {
      'PLACA': 'XYZ9E87',
      'DATA': '2026-10-22',
      'HORA': '14:15',
      'MODELO': 'Scania R450 6x2',
      'MOTORISTA': 'Carlos Eduardo Santos',
      'COMBUSTIVEL': 'Diesel S10',
      'LITROS': 380.0,
      'PRECO_LITRO': 6.25,
      'VALOR_TOTAL': 2375.00,
      'KM_ANTERIOR': 98200,
      'KM_ATUAL': 99120,
      'POSTO': 'Posto Ipiranga Rodovia Presidente Dutra',
      'CIDADE': 'Resende',
      'UF': 'RJ',
      'NOTA_FISCAL': '541289',
      'FORMA_PAGAMENTO': 'Cartão Frota - Sem Parar / Veloe Go'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 22 },
    { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Abastecimentos');

  // Aba de Instruções e Dicionário de Dados
  const instructions = [
    { 'Instrução Operacional CCO': '1. Preencha as linhas abaixo da linha de cabeçalho na aba Modelo_Abastecimentos.' },
    { 'Instrução Operacional CCO': '2. As colunas obrigatórias são: PLACA, DATA e LITROS.' },
    { 'Instrução Operacional CCO': '3. O sistema calcula automaticamente: KM Rodados, KM/L, CPK e CO2 se os dados de KM forem preenchidos.' },
    { 'Instrução Operacional CCO': '4. Se o PREÇO_LITRO for deixado em branco, o sistema divide o VALOR_TOTAL pelos LITROS.' },
    { 'Instrução Operacional CCO': '5. Após preencher, importe o arquivo diretamente no sistema clicando em "+ Importar Planilha XLS".' },
    { 'Instrução Operacional CCO': '6. Você também pode copiar as células no Excel (Ctrl+C) e colar direto no sistema (Ctrl+V).' }
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Como_Preencher');

  XLSX.writeFile(wb, 'modelo_padrao_abastecimentos_ambipar.xlsx');
};

// Código pronto do Google Apps Script para sincronização bidirecional em tempo real
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * SINCRONIZAÇÃO AUTOMÁTICA EM TEMPO REAL: SISTEMA AMBIPAR <-> GOOGLE SHEETS
 * ============================================================================
 * 
 * COMO CONFIGURAR EM 3 MINUTOS:
 * 1. Crie uma planilha nova no Google Sheets (ex: "Frota Ambipar CCO").
 * 2. No menu superior, clique em: Extensões > Apps Script.
 * 3. Apague tudo o que estiver lá e cole este código completo.
 * 4. Clique em "Salvar" (ícone de disquete).
 * 5. Clique no botão azul "Implantar" (canto superior direito) > "Nova implantação".
 * 6. Em "Selecionar tipo", escolha "App da Web".
 * 7. Configure:
 *    - Descrição: "Ambipar Sync Webhook"
 *    - Executar como: "Eu (seu email)"
 *    - Quem pode acessar: "Qualquer pessoa" (fundamental para receber os dados do site).
 * 8. Clique em "Implantar" e conceda as permissões solicitadas.
 * 9. Copie a "URL do app da Web" gerada (termina com /exec) e cole no Sistema Ambipar!
 * 
 * PRONTO! Toda vez que alguém salvar, editar ou excluir no site, a planilha atualiza na hora!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'UPSERT';
    var record = payload.record;

    if (!record) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Nenhum registro recebido' })).setMimeType(ContentService.MimeType.JSON);
    }

    // Se a planilha estiver vazia, cria o cabeçalho executivo Ambipar
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_SISTEMA',
        'DATA',
        'HORA',
        'PLACA',
        'MODELO_VEICULO',
        'MOTORISTA',
        'COMBUSTIVEL',
        'LITROS',
        'PRECO_LITRO',
        'VALOR_TOTAL',
        'KM_ANTERIOR',
        'KM_ATUAL',
        'KM_PERCORRIDO',
        'KM_POR_LITRO',
        'CPK_R$_KM',
        'POSTO',
        'CIDADE',
        'UF',
        'NOTA_FISCAL',
        'FORMA_PAGAMENTO',
        'ULTIMA_ATUALIZACAO'
      ]);
      
      // Estiliza o cabeçalho
      var headerRange = sheet.getRange(1, 1, 1, 21);
      headerRange.setBackground('#0f172a');
      headerRange.setFontColor('#10b981');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    var data = sheet.getDataRange().getValues();
    var targetRow = -1;

    // Busca se o registro já existe pelo ID
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(record.id)) {
        targetRow = i + 1;
        break;
      }
    }

    // Ação de Exclusão
    if (action === 'DELETE') {
      if (targetRow > -1) {
        sheet.deleteRow(targetRow);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Linha excluída com sucesso', id: record.id })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Registro já não existia na planilha' })).setMimeType(ContentService.MimeType.JSON);
    }

    var rowValues = [
      String(record.id || ''),
      String(record.data_abastecimento || ''),
      String(record.hora_abastecimento || ''),
      String(record.placa || ''),
      String(record.modelo_veiculo || ''),
      String(record.motorista || ''),
      String(record.tipo_combustivel || 'Diesel S10'),
      Number(record.litros) || 0,
      Number(record.preco_litro) || 0,
      Number(record.valor_total) || 0,
      Number(record.hodometro_anterior) || '',
      Number(record.hodometro_atual) || '',
      Number(record.distancia_percorrida_km) || '',
      Number(record.km_por_litro) || '',
      Number(record.custo_por_km) || '',
      String(record.posto_nome || ''),
      String(record.cidade || ''),
      String(record.uf || ''),
      String(record.nota_fiscal || ''),
      String(record.forma_pagamento || ''),
      Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm:ss')
    ];

    if (targetRow > -1) {
      // Atualiza linha existente
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Linha atualizada com sucesso', row: targetRow })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Insere nova linha no final
      sheet.appendRow(rowValues);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Nova linha inserida com sucesso', row: sheet.getLastRow() })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    var headers = values[0];
    var list = [];
    for (var i = 1; i < values.length; i++) {
      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j]] = values[i][j];
      }
      list.push(item);
    }

    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
