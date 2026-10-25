import * as XLSX from 'xlsx';

// Definições dos campos do sistema Ambipar e seus sinônimos usuais em planilhas
export const FIELD_DEFINITIONS = [
  { 
    key: 'placa', 
    label: 'Placa do Veículo', 
    required: true, 
    aliases: ['placa', 'veiculo', 'veículo', 'placa veiculo', 'placa_veiculo', 'placa cavalo', 'carro', 'frota', 'cavalo', 'plate', 'veic', 'conjunto'] 
  },
  { 
    key: 'data_abastecimento', 
    label: 'Data do Abastecimento', 
    required: true, 
    aliases: ['data', 'dt_abastecimento', 'data abastecimento', 'data_abastecimento', 'data/hora', 'emissao', 'dt emissao', 'dia', 'date', 'data_hora', 'mes', 'periodo'] 
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
    aliases: ['modelo', 'modelo veiculo', 'veiculo modelo', 'tipo veiculo', 'caminhao', 'veiculo_modelo', 'descricao_veiculo', 'tipo'] 
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
    aliases: ['combustivel', 'combustível', 'tipo combustivel', 'produto', 'combustivel tipo', 'fuel', 'descricao_produto'] 
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
    aliases: ['valor', 'valor total', 'total', 'vl total', 'r$ total', 'total pago', 'valor pago', 'valor_total', 'amount', 'vlr_total', 'total (r$)'] 
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

// Meses para leitura da Matriz de Custos da Frota (Como a da foto)
export const MATRIX_MONTHS = [
  { key: 'janeiro', label: 'Janeiro', num: '01' },
  { key: 'fevereiro', label: 'Fevereiro', num: '02' },
  { key: 'marco', label: 'Março', num: '03' },
  { key: 'abril', label: 'Abril', num: '04' },
  { key: 'maio', label: 'Maio', num: '05' },
  { key: 'junho', label: 'Junho', num: '06' },
  { key: 'julho', label: 'Julho', num: '07' },
  { key: 'agosto', label: 'Agosto', num: '08' },
  { key: 'setembro', label: 'Setembro', num: '09' },
  { key: 'outubro', label: 'Outubro', num: '10' },
  { key: 'novembro', label: 'Novembro', num: '11' },
  { key: 'dezembro', label: 'Dezembro', num: '12' }
];

// Categorias padrão da Matriz Ambipar (Relatório de Custo Mensal da Frota)
export const MATRIX_CATEGORIES = [
  'COMBUSTIVEIS',
  'LUBRIFICANTES',
  'MAN. FROTAS - MAO DE OBRA',
  'MAN. FROTAS - PECAS',
  'PNEUS',
  'IPVA, DPVAT, LICENCIAMENTO',
  'LAVAGEM DE FROTA',
  'LAUDOS FROTAS - CIPP, CIVV',
  'RASTREAMENTO',
  'LOCACAO DE VEICULOS',
  'GERENCIAMENTO DE RISCO',
  'PEDAGIOS',
  'MULTA DE TRANSITO',
  'SERV DE TELEMETRIA',
  'SEGURO DE FROTAS',
  'TOTAL (R$)'
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

// Conversão inteligente de números (trata formatos brasileiros "1.520,30" ou "R$ 31.552,51")
export const parseSmartNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim().replace(/[\u00A0\u202F\s]/g, '');
  // Remove prefixos como "R$", "$", etc.
  str = str.replace(/[^0-9.,\-]/g, '');
  if (!str) return 0;

  // Se tem vírgula e ponto (ex: "31.552,51")
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Apenas vírgula (ex: "31552,51")
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Conversão inteligente de datas de Excel e strings comuns
export const parseSmartDate = (val) => {
  if (!val) return new Date().toISOString().split('T')[0];

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = val * 86400000;
    const dateObj = new Date(excelEpoch.getTime() + millis);
    return dateObj.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};

// Localiza de forma inteligente a linha de cabeçalho na planilha (pulando logos e títulos mesclados)
export const findHeaderRow = (rawJson) => {
  if (!rawJson || rawJson.length === 0) return { headerIndex: 0, headers: [] };

  let bestIndex = 0;
  let maxScore = -1;
  let bestHeaders = [];

  const maxScan = Math.min(rawJson.length, 15);
  const keywords = [
    'placa', 'veiculo', 'data', 'litros', 'valor', 'combustivel', 'motorista',
    'unidade', 'tipo', 'custos', 'janeiro', 'fevereiro', 'marco', 'total', 'posto', 'km'
  ];

  for (let i = 0; i < maxScan; i++) {
    const row = rawJson[i];
    if (!Array.isArray(row)) continue;

    const nonEmptyCells = row.map(c => String(c || '').trim()).filter(Boolean);
    if (nonEmptyCells.length === 0) continue;

    let score = nonEmptyCells.length;
    row.forEach(cell => {
      const norm = normalizeHeader(cell);
      if (keywords.some(k => norm.includes(k))) {
        score += 5;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
      bestHeaders = row.map(c => String(c || '').trim());
    }
  }

  return { headerIndex: bestIndex, headers: bestHeaders };
};

// Detecta se a aba é uma Matriz de Custos da Frota (como a da foto do usuário)
export const detectSheetFormat = (headers, rows) => {
  const normHeaders = headers.map(normalizeHeader);
  const hasMonths = normHeaders.some(h => h.includes('janeiro') || h.includes('fevereiro') || h.includes('marco'));
  const hasCostsCol = normHeaders.some(h => h.includes('custos') || h.includes('frota') || h.includes('tipo'));

  // Verifica se nas linhas aparecem palavras como "combustiveis", "manutencao", "pneus"
  const hasMatrixRows = rows.slice(0, 15).some(r => {
    const rowStr = Object.values(r).map(normalizeHeader).join(' ');
    return rowStr.includes('combustivel') || rowStr.includes('pneu') || rowStr.includes('lubrificante') || rowStr.includes('ipva');
  });

  if ((hasMonths && (hasCostsCol || hasMatrixRows)) || (hasMatrixRows && hasMonths)) {
    return 'MATRIZ_CUSTOS_MENSAL';
  }

  return 'TABELA_ABASTECIMENTOS';
};

// Detecção Automática Inteligente de Colunas
export const detectColumnMapping = (rawHeaders) => {
  const mapping = {};
  const usedIndices = new Set();

  FIELD_DEFINITIONS.forEach(field => {
    let matchedIndex = -1;
    for (let i = 0; i < rawHeaders.length; i++) {
      if (usedIndices.has(i)) continue;
      const normalizedCol = normalizeHeader(rawHeaders[i]);
      if (!normalizedCol) continue;

      const exactMatch = field.aliases.some(alias => normalizeHeader(alias) === normalizedCol);
      if (exactMatch) {
        matchedIndex = i;
        break;
      }

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

// Extrai dados da Matriz Mensal da Frota (Como a da foto)
export const parseFleetCostMatrix = (rawJson, headerIndex, headers, sheetName) => {
  const matrixData = [];
  const monthlyFuelExpenses = [];
  const unit = 'DCX';
  const fleetType = sheetName || 'FROTA COMPLETA';

  // Identifica colunas dos meses
  const monthColMap = {};
  headers.forEach((h, colIdx) => {
    const norm = normalizeHeader(h);
    MATRIX_MONTHS.forEach(m => {
      if (norm.includes(m.key) || norm.includes(normalizeHeader(m.label))) {
        monthColMap[m.key] = colIdx;
      }
    });
  });

  // Identifica a coluna da descrição do custo
  let costDescCol = headers.findIndex(h => {
    const norm = normalizeHeader(h);
    return norm.includes('custo') || norm.includes('descricao') || norm.includes('item');
  });
  if (costDescCol === -1) costDescCol = 2; // Na planilha da foto é a coluna C (índice 2)

  // Varre as linhas da matriz
  const dataRows = rawJson.slice(headerIndex + 1);
  dataRows.forEach((row, rowIdx) => {
    if (!Array.isArray(row)) return;
    const rawCategory = String(row[costDescCol] || row[1] || row[0] || '').trim();
    if (!rawCategory || rawCategory.length < 3) return;

    const rowObj = {
      categoria: rawCategory,
      unidade: String(row[0] || unit).trim(),
      tipo: String(row[1] || fleetType).trim(),
      meses: {},
      totalAno: 0
    };

    let rowTotal = 0;
    MATRIX_MONTHS.forEach(m => {
      const colIdx = monthColMap[m.key];
      const val = colIdx !== undefined ? parseSmartNumber(row[colIdx]) : 0;
      rowObj.meses[m.key] = val;
      rowTotal += val;
    });
    rowObj.totalAno = rowTotal;
    matrixData.push(rowObj);

    // Se for a linha de COMBUSTÍVEIS, cria os registros de abastecimento mensais automáticos!
    const normCat = normalizeHeader(rawCategory);
    if (normCat.includes('combustivel')) {
      MATRIX_MONTHS.forEach(m => {
        const val = rowObj.meses[m.key];
        if (val > 0) {
          const precoMedioEst = 6.15;
          const litrosEst = Number((val / precoMedioEst).toFixed(1));
          monthlyFuelExpenses.push({
            id: `MAT_${m.key}_${fleetType.replace(/[^A-Za-z0-9]/g, '_')}_${Date.now()}`,
            data_abastecimento: `2026-${m.num}-15`,
            hora_abastecimento: '12:00',
            placa: `FROTA-${sheetName?.slice(0, 8).toUpperCase() || 'DCX'}`,
            modelo_veiculo: fleetType,
            motorista: 'Gestão de Frota',
            tipo_combustivel: 'Diesel S10',
            litros: litrosEst,
            preco_litro: precoMedioEst.toFixed(2),
            valor_total: val.toFixed(2),
            hodometro_atual: '',
            hodometro_anterior: '',
            distancia_percorrida_km: Math.round(litrosEst * 2.3),
            km_por_litro: 2.3,
            custo_por_km: Number((val / (litrosEst * 2.3)).toFixed(2)),
            posto_nome: 'Rede Convênio / Matriz Ambipar',
            cidade: 'Paulínia',
            uf: 'SP',
            nota_fiscal: `FECH-${m.key.toUpperCase()}-2026`,
            forma_pagamento: 'Faturado Convênio Corporativo',
            observacoes: `Importado da Matriz de Custos da Frota (${sheetName}) - Mês de ${m.label}`,
            origem_importacao: 'matriz_custo_frota'
          });
        }
      });
    }
  });

  return { matrixData, monthlyFuelExpenses };
};

// Leitor assíncrono avançado de arquivo Excel (.xlsx, .xls) ou CSV
export const readSpreadsheetWorkbook = (file, targetSheetName = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo de planilha foi fornecido.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('A planilha selecionada não possui abas visíveis.');
        }

        const sheetNames = workbook.SheetNames;
        const activeSheet = (targetSheetName && sheetNames.includes(targetSheetName)) 
          ? targetSheetName 
          : sheetNames[0];

        const worksheet = workbook.Sheets[activeSheet];
        if (!worksheet) {
          throw new Error(`A aba "${activeSheet}" não pôde ser aberta.`);
        }

        // Converte a aba para matriz de células (linhas brutas)
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rawJson || rawJson.length === 0) {
          throw new Error(`A aba "${activeSheet}" está vazia.`);
        }

        // Localiza dinamicamente o cabeçalho real
        const { headerIndex, headers } = findHeaderRow(rawJson);
        const validHeaders = headers.filter(Boolean);

        // Mapeia linhas de dados a partir do cabeçalho
        const rawDataRows = rawJson.slice(headerIndex + 1);
        const dataRows = rawDataRows.filter(row => Array.isArray(row) && row.some(cell => String(cell || '').trim() !== ''));

        const parsedRows = dataRows.map(row => {
          const rowObj = {};
          headers.forEach((header, colIndex) => {
            if (header) {
              rowObj[header] = row[colIndex] !== undefined ? row[colIndex] : '';
            }
          });
          return rowObj;
        });

        // Detecta se é a Matriz de Custos da Frota (Como a foto do usuário) ou Tabela Normal
        const sheetFormat = detectSheetFormat(headers, parsedRows);
        let matrixResult = null;

        if (sheetFormat === 'MATRIZ_CUSTOS_MENSAL') {
          matrixResult = parseFleetCostMatrix(rawJson, headerIndex, headers, activeSheet);
        }

        const detectedMapping = detectColumnMapping(validHeaders);

        resolve({
          fileName: file.name,
          sheetNames,
          activeSheet,
          rawHeaders: validHeaders,
          totalRows: parsedRows.length,
          parsedRows,
          detectedMapping,
          sheetFormat,
          matrixResult,
          workbook
        });
      } catch (err) {
        console.error('Erro ao ler planilha:', err);
        reject(new Error(err.message || 'Falha ao processar arquivo da planilha.'));
      }
    };

    reader.onerror = (err) => {
      console.error('FileReader error:', err);
      reject(new Error('Falha ao acessar o arquivo. Verifique se o arquivo não está bloqueado pelo Excel e tente novamente.'));
    };

    try {
      reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(new Error('Não foi possível iniciar a leitura do arquivo: ' + err.message));
    }
  });
};

// Converte linhas de abastecimento convencionais em registros do FuelModule
export const convertRowsToFuelRecords = (rawRows, mapping, existingRecords = [], options = { skipDuplicates: true }) => {
  const records = [];
  let skippedDuplicates = 0;
  let invalidRows = 0;

  // Garante que existingRecords seja seguro e não lance exceção com itens nulos
  const safeExisting = Array.isArray(existingRecords) ? existingRecords.filter(Boolean) : [];
  const existingKeys = new Set(
    safeExisting.map(r => `${(r.placa || '').toUpperCase()}_${r.data_abastecimento || ''}_${Number(r.litros || 0).toFixed(1)}_${r.nota_fiscal || ''}`)
  );

  (rawRows || []).forEach((row, idx) => {
    if (!row || typeof row !== 'object') return;

    const getVal = (fieldKey) => {
      const headerName = mapping[fieldKey];
      return headerName && row[headerName] !== undefined ? row[headerName] : '';
    };

    const placaRaw = String(getVal('placa') || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    const litrosNum = parseSmartNumber(getVal('litros'));

    if (!placaRaw || litrosNum <= 0) {
      invalidRows++;
      return;
    }

    const dataAbast = parseSmartDate(getVal('data_abastecimento'));
    const horaAbast = String(getVal('hora_abastecimento') || '12:00').trim().slice(0, 5);
    const nf = String(getVal('nota_fiscal') || '').trim();

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
      motorista: String(getVal('motorista') || 'Escala Operacional').trim(),
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
      cidade: String(getVal('cidade') || 'Base Central de Gestão').trim(),
      uf: String(getVal('uf') || 'SP').trim().toUpperCase().slice(0, 2),
      rodovia_km: '',
      nota_fiscal: nf,
      forma_pagamento: String(getVal('forma_pagamento') || 'Cartão Frota - Abank').trim(),
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

  return lines.map(line => line.split('\t').map(cell => cell.trim()));
};

// Exportador profissional para arquivo nativo .xlsx com abas e formatação
export const exportFuelRecordsToExcel = (records, fileName = 'abastecimentos_frota_ambipar.xlsx') => {
  const wb = XLSX.utils.book_new();

  const formattedRows = (records || []).map((r, index) => ({
    'Nº': index + 1,
    'Data': r.data_abastecimento || '',
    'Hora': r.hora_abastecimento || '',
    'Placa': r.placa || '',
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

  const colWidths = [
    { wch: 6 },  { wch: 12 }, { wch: 8 },  { wch: 11 }, { wch: 24 },
    { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 26 }, { wch: 16 }, { wch: 6 },  { wch: 14 }, { wch: 22 }, { wch: 16 }
  ];
  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, 'Abastecimentos');

  // Resumo Executivo
  const totalLitros = (records || []).reduce((acc, r) => acc + (Number(r.litros) || 0), 0);
  const totalValor = (records || []).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
  const totalKm = (records || []).reduce((acc, r) => acc + (Number(r.distancia_percorrida_km) || 0), 0);
  const mediaGeral = totalLitros > 0 && totalKm > 0 ? (totalKm / totalLitros).toFixed(2) : '0.00';
  const cpkGeral = totalKm > 0 && totalValor > 0 ? (totalValor / totalKm).toFixed(2) : '0.00';

  const summaryRows = [
    { 'Indicador Executivo Central de Gestão': 'Total de Abastecimentos Registrados', 'Valor Consolidado': records.length },
    { 'Indicador Executivo Central de Gestão': 'Volume Total Abastecido (Litros)', 'Valor Consolidado': Number(totalLitros.toFixed(2)) },
    { 'Indicador Executivo Central de Gestão': 'Custo Financeiro Total (R$)', 'Valor Consolidado': Number(totalValor.toFixed(2)) },
    { 'Indicador Executivo Central de Gestão': 'Distância Percorrida Total (KM)', 'Valor Consolidado': Number(totalKm.toFixed(2)) },
    { 'Indicador Executivo Central de Gestão': 'Média Geral de Rendimento (KM/L)', 'Valor Consolidado': Number(mediaGeral) },
    { 'Indicador Executivo Central de Gestão': 'Custo Médio por KM (R$/KM)', 'Valor Consolidado': Number(cpkGeral) },
    { 'Indicador Executivo Central de Gestão': 'Data da Exportação', 'Valor Consolidado': new Date().toLocaleString('pt-BR') }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo_CCO');

  XLSX.writeFile(wb, fileName);
};

// Gera o Modelo Oficial em Branco (.xlsx)
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
      'FORMA_PAGAMENTO': 'Cartão Frota - Abank'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Abastecimentos');
  XLSX.writeFile(wb, 'modelo_padrao_abastecimentos_ambipar.xlsx');
};

// Código do Google Apps Script
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Sincronização Automática Ambipar Central de Gestão <-> Google Sheets
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'UPSERT';
    var record = payload.record;

    if (!record) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Nenhum registro' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'ID_SISTEMA', 'DATA', 'HORA', 'PLACA', 'MODELO_VEICULO', 'MOTORISTA', 'COMBUSTIVEL',
        'LITROS', 'PRECO_LITRO', 'VALOR_TOTAL', 'KM_ANTERIOR', 'KM_ATUAL', 'KM_PERCORRIDO',
        'KM_POR_LITRO', 'CPK_R$_KM', 'POSTO', 'CIDADE', 'UF', 'NOTA_FISCAL', 'FORMA_PAGAMENTO', 'ULTIMA_ATUALIZACAO'
      ]);
      sheet.getRange(1, 1, 1, 21).setBackground('#0f172a').setFontColor('#10b981').setFontWeight('bold');
    }

    var data = sheet.getDataRange().getValues();
    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(record.id)) {
        targetRow = i + 1;
        break;
      }
    }

    if (action === 'DELETE' && targetRow > -1) {
      sheet.deleteRow(targetRow);
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: record.id })).setMimeType(ContentService.MimeType.JSON);
    }

    var rowValues = [
      String(record.id || ''), String(record.data_abastecimento || ''), String(record.hora_abastecimento || ''),
      String(record.placa || ''), String(record.modelo_veiculo || ''), String(record.motorista || ''),
      String(record.tipo_combustivel || 'Diesel S10'), Number(record.litros) || 0, Number(record.preco_litro) || 0,
      Number(record.valor_total) || 0, Number(record.hodometro_anterior) || '', Number(record.hodometro_atual) || '',
      Number(record.distancia_percorrida_km) || '', Number(record.km_por_litro) || '', Number(record.custo_por_km) || '',
      String(record.posto_nome || ''), String(record.cidade || ''), String(record.uf || ''),
      String(record.nota_fiscal || ''), String(record.forma_pagamento || ''), Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm:ss')
    ];

    if (targetRow > -1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
