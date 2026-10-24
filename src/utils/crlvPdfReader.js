import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

// Configura o worker do PDF.js empacotado pelo Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Converte data DD/MM/AAAA para YYYY-MM-DD para o input HTML date
 */
function toIsoDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.replace(/[\.-]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    if (parseInt(y, 10) > 1900) {
      return `${y}-${m}-${d}`;
    }
  }
  return '';
}

/**
 * Normaliza número float (ex: "57,00" -> 57.0, "57000" -> 57.0)
 */
function normalizeCapacityToTons(valStr) {
  if (!valStr) return '';
  const clean = valStr.trim().replace(/\s/g, '').replace('T', '').replace('KG', '');
  // Se tem vírgula como decimal (ex: 57,5)
  if (clean.includes(',')) {
    const num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) {
      return num > 1000 ? (num / 1000).toFixed(1) : num.toFixed(1);
    }
  }
  const rawNum = parseFloat(clean);
  if (isNaN(rawNum)) return '';
  // Se maior que 500, provavelmente está em KG (ex: 57000 kg -> 57 t)
  if (rawNum > 500) {
    return (rawNum / 1000).toFixed(1);
  }
  return rawNum.toFixed(1);
}

/**
 * Mapeia Tipo de Implemento / Carroceria a partir do texto do CRLV
 */
function mapVehicleType(fullText, especie, carroceria) {
  const t = `${fullText} ${especie || ''} ${carroceria || ''}`.toUpperCase();

  if (t.includes('BITREM')) {
    return 'Bitrem Tanque Químico';
  }
  if (t.includes('TANQUE') || t.includes(' TQ ') || t.includes('TQ/')) {
    if (t.includes('ISOTERM') || t.includes('CLIMATIZAD')) {
      return 'Carreta Tanque Isotérmica';
    }
    if (t.includes('CAMINHAO') && !t.includes('TRATOR') && !t.includes('SEMI')) {
      return 'Caminhão Truck PBT 23t (Tanque/Baú)';
    }
    return 'Carreta Tanque Químico (Inox 316L)';
  }
  if (t.includes('SIDER') || t.includes('ENLONAD')) {
    return 'Carreta Sider (Carga Seca / Tambores)';
  }
  if (t.includes('BAU') || t.includes('BAÚ')) {
    return 'Carreta Baú Fechado';
  }
  if (t.includes('BASCULANTE') || t.includes('CACAMBA') || t.includes('CAÇAMBA') || t.includes('RODOTREM') || t.includes('GRANELEIRO')) {
    return 'Rodotrem Graneleiro / Caçamba';
  }
  if (t.includes('TRATOR') || t.includes('TRACAO') || t.includes('TRAÇÃO')) {
    if (t.includes('6X4') || t.includes('6*4') || t.includes('TRAÇÃO 6X4')) {
      return 'Caminhão Trator Pesado (Tração 6x4)';
    }
    return 'Caminhão Trator (Tração 6x2)';
  }
  if (t.includes('TOCO') || t.includes('2 EIXOS')) {
    return 'Caminhão Toco PBT 16t';
  }
  if (t.includes('RESPOSTA') || t.includes('PAE') || t.includes('EMERGENCIA')) {
    return 'Veículo de Apoio PAE (Ambipar Response)';
  }

  // Padrão CCO Ambipar caso não especificado
  return 'Carreta Tanque Químico (Inox 316L)';
}

/**
 * Mapeia Combustível do CRLV para as opções do sistema
 */
function mapFuelType(combustivelStr, fullText) {
  const t = `${combustivelStr || ''} ${fullText || ''}`.toUpperCase();
  if (t.includes('BIODIESEL') || t.includes('B100')) {
    return 'Biodiesel B100';
  }
  if (t.includes('ELETRIC') || t.includes('HIBRID') || t.includes('HÍBRID')) {
    return 'Elétrico / Híbrido';
  }
  if (t.includes('GAS') || t.includes('GNV') || t.includes('BIOMETANO')) {
    return 'Gás Natural Veicular (GNV / Biometano)';
  }
  if (t.includes('S500')) {
    return 'Diesel S500';
  }
  // Padrão da frota limpa Ambipar
  return 'Diesel S10';
}

/**
 * Extrai e estrutura os dados do CRLV a partir das linhas e do texto integral
 */
export function extractCrlvData(lines, fullText) {
  const safeLines = lines || [];
  const cleanFullText = fullText || safeLines.join('\n');
  const upperFullText = cleanFullText.toUpperCase();

  const result = {
    placa: '',
    renavam: '',
    chassi: '',
    marca_modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    tipo: '',
    combustivel: '',
    capacidade_peso_ton: '',
    capacidade_volume_m3: '',
    validade_crlv: '',
    cor_predominante: '',
    proprietario: '',
    cpf_cnpj: '',
    observacoes: ''
  };

  // =========================================================================
  // 1. PLACA DO VEÍCULO (Mercosul ABC1D23 ou Padrão ABC1234 / ABC-1234)
  // =========================================================================
  // A. Busca direta por rótulo "PLACA"
  for (let i = 0; i < safeLines.length; i++) {
    const line = safeLines[i];
    const matchLabel = line.match(/(?:PLACA|PLACA\s*ATUAL|PLACA\s*ANTERIOR)[\s\:\.\-]*([A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-?[0-9]{4})\b/i);
    if (matchLabel) {
      result.placa = matchLabel[1].replace('-', '').toUpperCase();
      break;
    }
    // Caso o valor esteja na linha seguinte ao rótulo "PLACA"
    if (/^PLACA$/i.test(line.trim()) && i + 1 < safeLines.length) {
      const nextMatch = safeLines[i + 1].trim().match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}-?[0-9]{4})\b/i);
      if (nextMatch) {
        result.placa = nextMatch[1].replace('-', '').toUpperCase();
        break;
      }
    }
  }

  // B. Fallback Placa: Busca padrão Mercosul isolado em todo o texto
  if (!result.placa) {
    const mercosulMatch = cleanFullText.match(/\b([A-Z]{3}[0-9][A-Z][0-9]{2})\b/);
    if (mercosulMatch) {
      result.placa = mercosulMatch[1].toUpperCase();
    } else {
      const oldPlateMatch = cleanFullText.match(/\b([A-Z]{3}-?[0-9]{4})\b/);
      if (oldPlateMatch) {
        result.placa = oldPlateMatch[1].replace('-', '').toUpperCase();
      }
    }
  }

  // =========================================================================
  // 2. RENAVAM (9 a 11 dígitos)
  // =========================================================================
  for (let i = 0; i < safeLines.length; i++) {
    const line = safeLines[i];
    const matchLabel = line.match(/RENAVAM[\s\:\.\-]*(\d{9,11})\b/i);
    if (matchLabel) {
      result.renavam = matchLabel[1];
      break;
    }
    if (/^RENAVAM$/i.test(line.trim()) && i + 1 < safeLines.length) {
      const nextMatch = safeLines[i + 1].trim().match(/\b(\d{9,11})\b/);
      if (nextMatch) {
        result.renavam = nextMatch[1];
        break;
      }
    }
  }

  if (!result.renavam) {
    const renavamMatch = cleanFullText.match(/RENAVAM[\s\:\.\-]*(\d{9,11})/i);
    if (renavamMatch) result.renavam = renavamMatch[1];
  }

  // =========================================================================
  // 3. CHASSI / VIN (17 caracteres alfanuméricos)
  // =========================================================================
  for (let i = 0; i < safeLines.length; i++) {
    const line = safeLines[i];
    const matchChassi = line.match(/CHASSI[\s\:\.\-]*([A-HJ-NPR-Z0-9]{17})\b/i);
    if (matchChassi) {
      result.chassi = matchChassi[1].toUpperCase();
      break;
    }
    if (/^CHASSI$/i.test(line.trim()) && i + 1 < safeLines.length) {
      const nextMatch = safeLines[i + 1].trim().match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
      if (nextMatch) {
        result.chassi = nextMatch[1].toUpperCase();
        break;
      }
    }
  }

  if (!result.chassi) {
    const chassiMatch = cleanFullText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
    if (chassiMatch) result.chassi = chassiMatch[1].toUpperCase();
  }

  // =========================================================================
  // 4. MARCA / MODELO / VERSÃO
  // =========================================================================
  for (let i = 0; i < safeLines.length; i++) {
    const line = safeLines[i];
    const matchInline = line.match(/MARCA\s*\/\s*MODELO(?:\s*\/\s*VERS[AÃ]O)?[\s\:\.\-]*([^\n\r\|]{4,60})/i);
    if (matchInline) {
      let val = matchInline[1].trim();
      val = val.replace(/(ANO|COR|COMBUST|TIPO|PLACA).*/i, '').trim();
      if (val.length >= 3) {
        result.marca_modelo = val.toUpperCase();
        break;
      }
    }
    if (/^MARCA\s*\/\s*MODELO/i.test(line.trim()) && i + 1 < safeLines.length) {
      const nextVal = safeLines[i + 1].trim();
      if (nextVal.length >= 3 && !/^(ANO|CHASSI|PLACA|TIPO)/i.test(nextVal)) {
        result.marca_modelo = nextVal.toUpperCase();
        break;
      }
    }
  }

  // Fallback Marca: identifica fabricantes comuns se não achou pelo rótulo
  if (!result.marca_modelo) {
    const commonBrands = [
      'SCANIA', 'VOLVO', 'MERCEDES-BENZ', 'M.BENZ', 'MERCEDES', 'VOLKSWAGEN',
      'VW', 'IVECO', 'DAF', 'RANDON', 'FACCHINI', 'GUERRA', 'LIBRELATO',
      'NOMA', 'RODONAVES', 'KRONE', 'FORD'
    ];
    for (const brand of commonBrands) {
      const regex = new RegExp(`\\b(${brand}[^\\n\\r]{3,45})\\b`, 'i');
      const m = cleanFullText.match(regex);
      if (m) {
        result.marca_modelo = m[1].trim().replace(/\s+/g, ' ').toUpperCase();
        break;
      }
    }
  }

  // =========================================================================
  // 5. ANO DE FABRICAÇÃO & ANO DO MODELO (ex: 2023 / 2024 ou 2024/2024)
  // =========================================================================
  const anoPairMatch = cleanFullText.match(/(?:ANO\s*FAB(?:\.|\s*\/|\s*RICACAO)?[\s\S]{1,25}ANO\s*MOD(?:\.|\s*ELO)?)[\s\:\.\-]*(\d{4})[\s\/\-](\d{4})/i) ||
                       cleanFullText.match(/\b(20[0-2][0-9])\s*[\/\-]\s*(20[0-2][0-9])\b/);
  if (anoPairMatch) {
    result.ano_fabricacao = parseInt(anoPairMatch[1], 10);
    result.ano_modelo = parseInt(anoPairMatch[2], 10);
  } else {
    // Busca anos isolados
    const fabMatch = cleanFullText.match(/(?:ANO\s*FAB(?:RICA[CÇ][AÃ]O)?|FABRICA[CÇ][AÃ]O)[\s\:\.\-]*(\d{4})/i);
    const modMatch = cleanFullText.match(/(?:ANO\s*MOD(?:ELO)?|MODELO)[\s\:\.\-]*(\d{4})/i);
    if (fabMatch) result.ano_fabricacao = parseInt(fabMatch[1], 10);
    if (modMatch) result.ano_modelo = parseInt(modMatch[1], 10);
  }

  // =========================================================================
  // 6. TIPO DE IMPLEMENTO & CARROCERIA
  // =========================================================================
  let especieRaw = '';
  let carroceriaRaw = '';

  const espMatch = cleanFullText.match(/(?:ESP[EÉ]CIE\s*\/\s*TIPO|ESP[EÉ]CIE)[\s\:\.\-]*([^\n\r\|]{3,35})/i);
  if (espMatch) especieRaw = espMatch[1].trim();

  const carMatch = cleanFullText.match(/CARROCERIA[\s\:\.\-]*([^\n\r\|]{3,35})/i);
  if (carMatch) carroceriaRaw = carMatch[1].trim();

  result.tipo = mapVehicleType(cleanFullText, especieRaw, carroceriaRaw);

  // =========================================================================
  // 7. COMBUSTÍVEL
  // =========================================================================
  const combMatch = cleanFullText.match(/COMBUST[IÍ]VEL[\s\:\.\-]*([^\n\r\|]{3,25})/i);
  result.combustivel = mapFuelType(combMatch ? combMatch[1] : '', cleanFullText);

  // =========================================================================
  // 8. CAPACIDADE DE CARGA / LOTAÇÃO / PBTC (Toneladas)
  // =========================================================================
  const capMatch = cleanFullText.match(/(?:CAPACIDADE\s*\/\s*LOTA[CÇ][AÃ]O|CAPACIDADE|PBT|PBTC|CMT)[\s\:\.\-]*([\d\.\,]{2,10})\s*(?:T|TON|KG)?/i);
  if (capMatch) {
    result.capacidade_peso_ton = normalizeCapacityToTons(capMatch[1]);
  }

  // =========================================================================
  // 9. VALIDADE DO CRLV (Licenciamento Anual / Exercício)
  // =========================================================================
  // A. Busca pelo Exercício (ex: "EXERCÍCIO: 2026")
  const exercicioMatch = cleanFullText.match(/EXERC[IÍ]CIO[\s\:\.\-]*(\d{4})/i);
  if (exercicioMatch) {
    const anoExercicio = parseInt(exercicioMatch[1], 10);
    if (anoExercicio >= 2020) {
      // De acordo com o calendário do Detran, o licenciamento do exercício é válido até 31 de Outubro/Dezembro daquele ano
      result.validade_crlv = `${anoExercicio}-10-31`;
    }
  }

  // B. Se houver data de emissão ou validade explícita
  if (!result.validade_crlv) {
    const validadeExplicit = cleanFullText.match(/(?:VALIDADE|LICENCIAMENTO|DATA\s*DE\s*EMISS[AÃ]O)[\s\:\.\-]*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i);
    if (validadeExplicit) {
      result.validade_crlv = toIsoDate(validadeExplicit[1]);
    }
  }

  // =========================================================================
  // 10. COR PREDOMINANTE & PROPRIETÁRIO
  // =========================================================================
  const corMatch = cleanFullText.match(/COR\s*PREDOMINANTE[\s\:\.\-]*([A-ZÀ-Úa-zà-ú]{3,20})/i);
  if (corMatch) {
    result.cor_predominante = corMatch[1].toUpperCase();
  }

  const propMatch = cleanFullText.match(/(?:NOME\s*DO\s*PROPRIET[AÁ]RIO|PROPRIET[AÁ]RIO)[\s\:\.\-]*([^\n\r\|]{5,60})/i);
  if (propMatch) {
    result.proprietario = propMatch[1].trim().toUpperCase();
  }

  const docMatch = cleanFullText.match(/(?:CPF\s*\/\s*CNPJ|CNPJ|CPF)[\s\:\.\-]*([\d\.\-\/]{11,18})/i);
  if (docMatch) {
    result.cpf_cnpj = docMatch[1].trim();
  }

  // Monta observação executiva
  const obsParts = [];
  obsParts.push('Dados importados automaticamente via CRLV Digital (CRLV-e).');
  if (result.proprietario) obsParts.push(`Proprietário: ${result.proprietario}.`);
  if (result.cor_predominante) obsParts.push(`Cor: ${result.cor_predominante}.`);
  if (result.renavam) obsParts.push(`Renavam: ${result.renavam}.`);
  result.observacoes = obsParts.join(' ');

  return result;
}

/**
 * Organiza os itens do PDF por coordenadas espaciais
 */
function organizePageItemsIntoLines(items) {
  const sorted = [...items].sort((a, b) => {
    const ay = a.transform ? a.transform[5] : 0;
    const by = b.transform ? b.transform[5] : 0;
    const ax = a.transform ? a.transform[4] : 0;
    const bx = b.transform ? b.transform[4] : 0;
    if (Math.abs(ay - by) > 6) {
      return by - ay;
    }
    return ax - bx;
  });

  const lines = [];
  let currentLine = [];
  let lastY = null;

  for (const item of sorted) {
    const str = (item.str || '').trim();
    if (!str) continue;
    const y = item.transform ? item.transform[5] : 0;

    if (lastY === null || Math.abs(y - lastY) > 6) {
      if (currentLine.length > 0) {
        lines.push(currentLine.map(i => (i.str || '').trim()).join(' '));
      }
      currentLine = [item];
      lastY = y;
    } else {
      currentLine.push(item);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.map(i => (i.str || '').trim()).join(' '));
  }

  return lines;
}

/**
 * Cria o worker do Tesseract para OCR de CRLVs escaneados ou imagens
 */
async function getOcrWorker(onProgress) {
  const logger = (m) => {
    if (m.status === 'recognizing text' && onProgress) {
      onProgress(`Analisando imagem do CRLV (OCR): ${Math.round((m.progress || 0) * 100)}%`);
    } else if (m.status && onProgress) {
      onProgress('Preparando leitura ótica...');
    }
  };

  try {
    const worker = await createWorker('por', 1, { logger });
    return worker;
  } catch (err) {
    console.warn('Falha no OCR em português, usando inglês:', err);
    const worker = await createWorker('eng', 1, { logger });
    return worker;
  }
}

/**
 * Lê o arquivo PDF ou Imagem do CRLV-e diretamente na memória RAM do navegador.
 * IMPORTANTE: O arquivo NUNCA é enviado ao servidor nem armazenado em disco/banco.
 */
export async function readCrlvFile(file, onProgress) {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  // Caso 1: O usuário enviou uma IMAGEM (JPEG/PNG/Print do CRLV)
  if (file.type && file.type.startsWith('image/')) {
    if (onProgress) onProgress('Processando imagem do CRLV-e...');
    const worker = await getOcrWorker(onProgress);
    try {
      const { data } = await worker.recognize(file);
      const lines = (data.lines || []).map(l => l.text.trim()).filter(Boolean);
      const parsed = extractCrlvData(lines, data.text || '');
      return {
        ...parsed,
        rawTextLength: (data.text || '').length,
        linesCount: lines.length
      };
    } finally {
      await worker.terminate();
    }
  }

  // Caso 2: O arquivo é um PDF (CRLV Digital nativo)
  if (onProgress) onProgress('Lendo dados vetoriais do CRLV-e...');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'
  });

  const pdf = await loadingTask.promise;

  let allLines = [];
  let rawTextTotal = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = organizePageItemsIntoLines(textContent.items);
    allLines = allLines.concat(pageLines);
    rawTextTotal += ' ' + pageLines.join(' ');
  }

  const fullText = allLines.join('\n');
  let parsed = extractCrlvData(allLines, fullText);

  // Se a camada vetorial do PDF não continha placa/renavam (PDF escaneado/fotografado)
  const hasCrucialData = parsed.placa || parsed.chassi || parsed.renavam;
  if (!hasCrucialData && typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (onProgress) onProgress('Executando leitura ótica OCR da página escaneada...');
    try {
      const maxPages = Math.min(pdf.numPages, 2);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.2 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;

        const worker = await getOcrWorker(onProgress);
        try {
          const { data } = await worker.recognize(canvas);
          if (data && data.text) {
            const ocrLines = (data.lines || []).map(l => l.text.trim()).filter(Boolean);
            const ocrParsed = extractCrlvData(ocrLines, data.text);
            parsed = {
              placa: ocrParsed.placa || parsed.placa,
              renavam: ocrParsed.renavam || parsed.renavam,
              chassi: ocrParsed.chassi || parsed.chassi,
              marca_modelo: ocrParsed.marca_modelo || parsed.marca_modelo,
              ano_fabricacao: ocrParsed.ano_fabricacao || parsed.ano_fabricacao,
              ano_modelo: ocrParsed.ano_modelo || parsed.ano_modelo,
              tipo: ocrParsed.tipo || parsed.tipo,
              combustivel: ocrParsed.combustivel || parsed.combustivel,
              capacidade_peso_ton: ocrParsed.capacidade_peso_ton || parsed.capacidade_peso_ton,
              validade_crlv: ocrParsed.validade_crlv || parsed.validade_crlv,
              cor_predominante: ocrParsed.cor_predominante || parsed.cor_predominante,
              proprietario: ocrParsed.proprietario || parsed.proprietario,
              observacoes: ocrParsed.observacoes || parsed.observacoes
            };
            if (parsed.placa || parsed.chassi) break;
          }
        } finally {
          await worker.terminate();
        }
      }
    } catch (ocrErr) {
      console.warn('Falha no fallback OCR do CRLV:', ocrErr);
    }
  }

  return {
    ...parsed,
    rawTextLength: rawTextTotal.length,
    linesCount: allLines.length
  };
}
