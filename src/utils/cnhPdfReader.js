import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do pdf.js para o browser com CDN rápida e confiável
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

/**
 * Analisa o texto bruto extraído da CNH (formato CDT / Detran / Senatran)
 * e extrai automaticamente Nome, CPF, Número de Registro CNH, Validade e Categoria.
 */
export function parseCnhText(fullText) {
  const result = {
    nome: '',
    cpf: '',
    cnh: '',
    validade_cnh: '',
    categoria_cnh: '',
    tem_mopp: false
  };

  if (!fullText) return result;

  // 1. CPF (ex: 123.456.789-00 ou 12345678900)
  const cpfMatch = fullText.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);
  if (cpfMatch) {
    const raw = cpfMatch[1].replace(/\D/g, '');
    if (raw.length === 11) {
      result.cpf = raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  }

  // 2. Nome Completo
  // Na CNH digital, o nome vem após 'NOME' ou 'NOME DO CONDUTOR'
  const nomeMatch = fullText.match(/NOME(?:\s*DO\s*CONDUTOR)?\s*[:\n]?\s*([A-ZÀ-Úa-zà-ú\s]{6,50})/i);
  if (nomeMatch) {
    let cleanName = nomeMatch[1].trim();
    // Remove palavras-chave comuns de cabeçalhos subsequentes
    cleanName = cleanName.replace(/(DOC|IDENTIDADE|RG|FILIAÇÃO|DATA|CPF|NACIONALIDADE|REGISTRO|VALIDADE).*/i, '').trim();
    // Limpa quebras e múltiplos espaços
    cleanName = cleanName.replace(/\s+/g, ' ');
    if (cleanName.length >= 5) {
      result.nome = cleanName.toUpperCase();
    }
  }

  // 3. Número de Registro CNH (11 dígitos numéricos)
  const regMatch = fullText.match(/(?:N[º°]?\s*(?:DE\s*)?REGISTRO|REGISTRO(?:\s*CNH)?)\s*[:\n]?\s*(\d{10,11})/i);
  if (regMatch) {
    result.cnh = regMatch[1];
  } else {
    // Procura qualquer sequência de 10 a 11 dígitos que seja diferente do CPF
    const allEleven = fullText.match(/\b\d{10,11}\b/g) || [];
    const cleanCpf = result.cpf ? result.cpf.replace(/\D/g, '') : '';
    const cand = allEleven.find((n) => n !== cleanCpf);
    if (cand) {
      result.cnh = cand;
    }
  }

  // 4. Data de Validade da CNH (DD/MM/AAAA) -> formato YYYY-MM-DD para o input HTML
  const valMatch = fullText.match(/VALIDADE\s*[:\n]?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i) ||
                   fullText.match(/VAL(?:IDADE)?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (valMatch) {
    const parts = valMatch[1].replace(/[\.-]/g, '/').split('/');
    if (parts.length === 3) {
      const dia = parts[0].padStart(2, '0');
      const mes = parts[1].padStart(2, '0');
      const ano = parts[2];
      result.validade_cnh = `${ano}-${mes}-${dia}`;
    }
  }

  // 5. Categoria CNH (E, D, C, etc.)
  const catMatch = fullText.match(/(?:CAT\.?\s*HAB\.?|CATEGORIA)\s*[:\n]?\s*([A-E]{1,2})/i);
  if (catMatch) {
    const rawCat = catMatch[1].toUpperCase();
    if (rawCat.includes('E')) result.categoria_cnh = 'E';
    else if (rawCat.includes('D')) result.categoria_cnh = 'D';
    else if (rawCat.includes('C')) result.categoria_cnh = 'C';
  }

  // 6. Detecção MOPP no campo de observações
  const upper = fullText.toUpperCase();
  if (upper.includes('MOPP') || upper.includes('PRODUTOS PERIGOSOS') || upper.includes('TRANSPORTE DE PROD')) {
    result.tem_mopp = true;
  }

  return result;
}

/**
 * Lê o arquivo PDF diretamente na memória RAM do navegador do usuário.
 * IMPORTANTE: O arquivo NUNCA é enviado ao Supabase ou armazenado em banco,
 * mantendo custo zero de armazenamento e velocidade instantânea.
 */
export async function readCnhPdfFile(file) {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += ' ' + pageText;
  }

  const parsed = parseCnhText(fullText);
  return {
    ...parsed,
    rawTextLength: fullText.length
  };
}
