import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';

// Configura o worker do PDF.js empacotado diretamente pelo Vite (zero falhas de CDN ou CORS)
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Palavras-chave oficiais que NÃO devem ser confundidas com nomes de condutores
 */
const CNH_HEADER_KEYWORDS = [
  'REPÚBLICA', 'FEDERATIVA', 'BRASIL', 'MINISTÉRIO', 'SECRETARIA',
  'DEPARTAMENTO', 'CARTEIRA', 'NACIONAL', 'HABILITAÇÃO', 'TRÂNSITO',
  'SENATRAN', 'DENATRAN', 'DETRAN', 'DOC', 'IDENTIDADE', 'EMISSOR',
  'FILIAÇÃO', 'PERMISSÃO', 'REGISTRO', 'VALIDADE', 'OBSERVAÇÕES',
  'ASSINATURA', 'QR CODE', 'LOCAL', 'DATA', 'CONDUTOR', 'ÓRGÃO',
  'CATEGORIA', 'HABILITACAO', 'VALIDO', 'TRANSPORTE', 'SEGURANÇA',
  'SOBRENOME', 'SURNAME', 'FIRST', 'NAME', 'DATE', 'BIRTH', 'EXPIRY',
  'REGISTER', 'NUMBER', 'AUTHORITY', 'CONTRAN', 'RESOLUÇÃO'
];

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
 * Extrai dados do condutor suportando:
 * 1. Novo Modelo CONTRAN 886 (Vigente a partir de junho/2022 com campos numerados 1., 4b., 4d., 5., 9.)
 * 2. Modelo Anterior CONTRAN (NOME, CPF, Nº REGISTRO, VALIDADE, CAT. HAB.)
 * 3. Heurística Universal Resiliente
 */
export function extractCnhData(lines, fullText) {
  const result = {
    nome: '',
    cpf: '',
    cnh: '',
    validade_cnh: '',
    categoria_cnh: '',
    mopp_numero: ''
  };

  const cleanFullText = fullText || lines.join('\n');

  // =========================================================================
  // 1. CPF (Padrão 000.000.000-00 ou campo 4d. ou sequência de 11 dígitos)
  // =========================================================================
  // A. Padrão no novo modelo CONTRAN 886: "4d. 000.000.000-00" ou "4d. 00000000000"
  for (const line of lines) {
    const m4d = line.match(/(?:4d\.\s*|CPF\s*[:\-\s]?\s*)(\d{3}\.?\d{3}\.?\d{3}\-?\d{2})/i);
    if (m4d) {
      const clean = m4d[1].replace(/\D/g, '');
      if (clean.length === 11) {
        result.cpf = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        break;
      }
    }
  }

  // B. Padrão formatado em qualquer linha
  if (!result.cpf) {
    for (const line of lines) {
      const formattedCpf = line.match(/\b(\d{3}\.\d{3}\.\d{3}-\d{2})\b/);
      if (formattedCpf) {
        result.cpf = formattedCpf[1];
        break;
      }
    }
  }

  // C. Fallback em todo o texto
  if (!result.cpf) {
    const cpfMatch = cleanFullText.match(/(?:CPF|C\.P\.F\.?)[\s\:\.\-]*(\d{3}\.?\d{3}\.?\d{3}\-?\d{2})/i) ||
                     cleanFullText.match(/\b(\d{3}\.\d{3}\.\d{3}\-\d{2})\b/);
    if (cpfMatch) {
      const clean = cpfMatch[1].replace(/\D/g, '');
      if (clean.length === 11) {
        result.cpf = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }
  }

  // =========================================================================
  // 2. NOME COMPLETO DO CONDUTOR
  // =========================================================================
  // A. Novo Modelo CONTRAN 886: "1. NOME COMPLETO" ou "1. SOBRENOME, NOME"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Caso A1: A própria linha começa com "1. ..."
    const m1 = line.match(/^1\.\s*([A-Za-zÀ-Úà-ú\s,]{5,70})/i);
    if (m1) {
      let cand = m1[1].replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cand.split(/\s+/).filter(w => w.length >= 2);
      const isHeader = CNH_HEADER_KEYWORDS.some(w => cand.toUpperCase().includes(w));
      if (words.length >= 2 && !isHeader) {
        result.nome = cand.toUpperCase();
        break;
      }
    }

    // Caso A2: O rótulo "1." ou "1. NOME" está isolado na linha anterior
    if (i > 0 && /^(?:1\.|1\.\s*NOME|1\.\s*SOBRENOME)/i.test(lines[i - 1].trim())) {
      let cand = line.replace(/[^A-Za-zÀ-Úà-ú\s]/g, '').trim();
      const words = cand.split(/\s+/).filter(w => w.length >= 2);
      const isHeader = CNH_HEADER_KEYWORDS.some(w => cand.toUpperCase().includes(w));
      if (words.length >= 2 && !isHeader) {
        result.nome = cand.toUpperCase();
        break;
      }
    }

    // Caso B: Modelo Anterior (rótulo "NOME" isolado na linha anterior)
    if (i > 0 && /^\s*NOME(?:\s*DO\s*CONDUTOR)?\s*$/i.test(lines[i - 1].trim())) {
      let cand = line.replace(/[^A-Za-zÀ-Úà-ú\s]/g, '').trim();
      const words = cand.split(/\s+/).filter(w => w.length >= 2);
      const isHeader = CNH_HEADER_KEYWORDS.some(w => cand.toUpperCase().includes(w));
      if (words.length >= 2 && !isHeader) {
        result.nome = cand.toUpperCase();
        break;
      }
    }

    // Caso C: "NOME: ..." na mesma linha
    const inlineMatch = line.match(/^NOME(?:\s*DO\s*CONDUTOR)?\s*[:\-\s]\s*([A-Za-zÀ-Úà-ú\s]{6,60})/i);
    if (inlineMatch) {
      let cand = inlineMatch[1].trim();
      cand = cand.replace(/(DOC|IDENTIDADE|RG|CPF|FILIAÇÃO).*/i, '').trim();
      if (cand.length >= 5) {
        result.nome = cand.toUpperCase();
        break;
      }
    }
  }

  // Fallback para Nome: Procura entre as primeiras 15 linhas uma sequência de 2 a 5 nomes próprios em maiúsculas
  if (!result.nome) {
    for (let i = 1; i < Math.min(lines.length, 16); i++) {
      const line = lines[i].trim();
      if (/^[A-ZÀ-Ú\s]{8,55}$/.test(line)) {
        const words = line.split(/\s+/).filter(w => w.length >= 2);
        const hasHeader = CNH_HEADER_KEYWORDS.some(w => line.toUpperCase().includes(w));
        if (words.length >= 2 && words.length <= 6 && !hasHeader) {
          result.nome = line.toUpperCase();
          break;
        }
      }
    }
  }

  // =========================================================================
  // 3. NÚMERO DE REGISTRO DA CNH (10 a 11 dígitos numéricos)
  // =========================================================================
  const cleanCpfDigits = result.cpf ? result.cpf.replace(/\D/g, '') : '';

  // A. Novo Modelo CONTRAN 886: Campo "5. 00000000000" ou linha após "5."
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m5 = line.match(/^5\.\s*(\d{10,11})/i);
    if (m5 && m5[1] !== cleanCpfDigits) {
      result.cnh = m5[1];
      break;
    }
    if (i > 0 && /^5\.\s*$/i.test(lines[i - 1].trim())) {
      const mNext = line.match(/\b(\d{10,11})\b/);
      if (mNext && mNext[1] !== cleanCpfDigits) {
        result.cnh = mNext[1];
        break;
      }
    }
  }

  // B. Modelo Anterior: linha com "REGISTRO"
  if (!result.cnh) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/(?:N[º°]?\s*)?REGISTRO/i.test(line)) {
        const onSame = line.match(/\b(\d{10,11})\b/);
        if (onSame && onSame[1] !== cleanCpfDigits) {
          result.cnh = onSame[1];
          break;
        }
        if (i + 1 < lines.length) {
          const onNext = lines[i + 1].match(/\b(\d{10,11})\b/);
          if (onNext && onNext[1] !== cleanCpfDigits) {
            result.cnh = onNext[1];
            break;
          }
        }
      }
    }
  }

  // C. Fallback: qualquer sequência de 10 a 11 dígitos diferente do CPF
  if (!result.cnh) {
    const allCandidates = cleanFullText.match(/\b\d{10,11}\b/g) || [];
    const cand = allCandidates.find(c => c !== cleanCpfDigits);
    if (cand) result.cnh = cand;
  }

  // =========================================================================
  // 4. DATA DE VALIDADE DA CNH (DD/MM/AAAA)
  // =========================================================================
  // A. Novo Modelo CONTRAN 886: Campo "4b." (Data de Validade)
  for (const line of lines) {
    const m4b = line.match(/4b\.\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i);
    if (m4b) {
      result.validade_cnh = toIsoDate(m4b[1]);
      break;
    }
  }

  // B. Modelo Anterior: Linha com "VALIDADE"
  if (!result.validade_cnh) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/VALIDADE/i.test(line)) {
        const sameDate = line.match(/(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/);
        if (sameDate) {
          result.validade_cnh = toIsoDate(sameDate[1]);
          break;
        }
        if (i + 1 < lines.length) {
          const nextDates = lines[i + 1].match(/(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/g);
          if (nextDates && nextDates.length > 0) {
            let bestDate = nextDates[0];
            let maxYear = 0;
            for (const d of nextDates) {
              const y = parseInt(d.slice(-4), 10);
              if (y > maxYear) {
                maxYear = y;
                bestDate = d;
              }
            }
            result.validade_cnh = toIsoDate(bestDate);
            break;
          }
        }
      }
    }
  }

  // C. Fallback Validade Universal: A data com o MAIOR ano no documento inteiro
  if (!result.validade_cnh) {
    const allDates = cleanFullText.match(/\b\d{2}[\/\.-]\d{2}[\/\.-]\d{4}\b/g) || [];
    if (allDates.length > 0) {
      let maxYear = 0;
      let targetDate = null;
      for (const d of allDates) {
        const parts = d.replace(/[\.-]/g, '/').split('/');
        const year = parseInt(parts[2], 10);
        // Filtra para anos de validade plausíveis (2020 a 2045)
        if (year >= 2020 && year > maxYear) {
          maxYear = year;
          targetDate = toIsoDate(d);
        }
      }
      if (targetDate) result.validade_cnh = targetDate;
    }
  }

  // =========================================================================
  // 5. CATEGORIA CNH (A, B, C, D, E, AB, AC, AD, AE)
  // =========================================================================
  // A. Novo Modelo CONTRAN 886: Campo "9. E" ou "9. AE"
  for (const line of lines) {
    const m9 = line.match(/^9\.\s*([A-E]{1,2})\b/i);
    if (m9) {
      result.categoria_cnh = m9[1].toUpperCase();
      break;
    }
  }

  // B. Modelo Anterior: Linha com "CAT. HAB."
  if (!result.categoria_cnh) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/CAT(?:\.?\s*HAB\.?|EGORIA)/i.test(line)) {
        const matchSame = line.match(/CAT(?:\.?\s*HAB\.?|EGORIA)[\s\:\.\-]*([A-E]{1,2})\b/i);
        if (matchSame) {
          result.categoria_cnh = matchSame[1].toUpperCase();
          break;
        }
        if (i + 1 < lines.length) {
          const nextMatch = lines[i + 1].trim().match(/^([A-E]{1,2})\b/i);
          if (nextMatch) {
            result.categoria_cnh = nextMatch[1].toUpperCase();
            break;
          }
        }
      }
    }
  }

  // C. Fallback Categoria
  if (!result.categoria_cnh) {
    const catMatch = cleanFullText.match(/\bCAT(?:\.?\s*HAB\.?|EGORIA)[\s\:\.\-]*([A-E]{1,2})\b/i);
    if (catMatch) result.categoria_cnh = catMatch[1].toUpperCase();
  }

  // =========================================================================
  // 6. DETECÇÃO DE MOPP (Movimentação Operacional de Produtos Perigosos)
  // =========================================================================
  const upper = cleanFullText.toUpperCase();
  if (upper.includes('MOPP') || upper.includes('PRODUTOS PERIGOSOS') || upper.includes('TRANSPORTE DE PROD')) {
    result.mopp_numero = 'Incluso na CNH (EAR/MOPP)';
  }

  return result;
}

/**
 * Organiza os itens de texto do PDF.js por coordenadas espaciais (Y e X)
 * para reconstruir o layout visual de linhas exato do documento.
 */
function organizePageItemsIntoLines(items) {
  const sorted = [...items].sort((a, b) => {
    const ay = a.transform ? a.transform[5] : 0;
    const by = b.transform ? b.transform[5] : 0;
    const ax = a.transform ? a.transform[4] : 0;
    const bx = b.transform ? b.transform[4] : 0;
    // Tolerância vertical de ~6 pixels para agrupar na mesma linha
    if (Math.abs(ay - by) > 6) {
      return by - ay; // Topo para base
    }
    return ax - bx;   // Esquerda para direita
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
 * Fallback de OCR no navegador para PDFs escaneados ou imagens puras
 */
async function performClientSideOcr(pdf, onProgress) {
  let combinedText = '';
  const ocrLines = [];

  const maxPages = Math.min(pdf.numPages, 2);
  for (let i = 1; i <= maxPages; i++) {
    if (onProgress) onProgress(`Executando OCR na página ${i} de ${maxPages}...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const { data } = await Tesseract.recognize(canvas, 'por', {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js',
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(`Reconhecendo caracteres (OCR): ${Math.round((m.progress || 0) * 100)}%`);
        }
      }
    });

    if (data && data.text) {
      combinedText += '\n' + data.text;
      if (data.lines) {
        data.lines.forEach(l => {
          if (l.text && l.text.trim()) ocrLines.push(l.text.trim());
        });
      }
    }
  }

  return { combinedText, ocrLines };
}

/**
 * Lê o arquivo PDF diretamente na memória RAM do navegador do usuário.
 * IMPORTANTE: O arquivo NUNCA é enviado ao Supabase ou armazenado em banco,
 * mantendo custo zero de armazenamento e velocidade instantânea.
 */
export async function readCnhPdfFile(file, onProgress) {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  if (onProgress) onProgress('Carregando CNH na memória...');
  const arrayBuffer = await file.arrayBuffer();

  // CRITICAL: Configuração de CMaps e fontes para decodificação de Identity-H (padrão Serpro/Gov)
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'
  });

  const pdf = await loadingTask.promise;

  let allLines = [];
  let rawTextTotal = '';

  // 1. Extrai camada de texto vetorial nativa em todas as páginas
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageLines = organizePageItemsIntoLines(textContent.items);
    allLines = allLines.concat(pageLines);
    rawTextTotal += ' ' + pageLines.join(' ');
  }

  const fullText = allLines.join('\n');
  let parsed = extractCnhData(allLines, fullText);

  // 2. Se nenhum dado crucial foi encontrado, aciona fallback OCR via canvas
  const hasCrucialData = parsed.nome || parsed.cnh || parsed.cpf || parsed.validade_cnh;
  if (!hasCrucialData && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      if (onProgress) onProgress('Ativando OCR no navegador para leitura visual...');
      const ocrResult = await performClientSideOcr(pdf, onProgress);
      if (ocrResult.combinedText) {
        const ocrParsed = extractCnhData(ocrResult.ocrLines, ocrResult.combinedText);
        parsed = {
          nome: ocrParsed.nome || parsed.nome,
          cpf: ocrParsed.cpf || parsed.cpf,
          cnh: ocrParsed.cnh || parsed.cnh,
          validade_cnh: ocrParsed.validade_cnh || parsed.validade_cnh,
          categoria_cnh: ocrParsed.categoria_cnh || parsed.categoria_cnh,
          mopp_numero: ocrParsed.mopp_numero || parsed.mopp_numero
        };
      }
    } catch (ocrErr) {
      console.warn('Fallback de OCR falhou:', ocrErr);
    }
  }

  return {
    ...parsed,
    rawTextLength: rawTextTotal.length,
    linesCount: allLines.length,
    previewText: allLines.slice(0, 15).join(' | ')
  };
}
