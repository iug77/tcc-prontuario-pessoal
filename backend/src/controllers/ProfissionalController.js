const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const Tesseract = require('tesseract.js');
const { createCanvas } = require('@napi-rs/canvas');

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

const parseJsonFromModelResponse = (raw = '') => {
  let jsonStr = String(raw || '').trim();

  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0];
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0];
  }

  // Remove caracteres de controle que às vezes quebram o JSON.
  jsonStr = jsonStr
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    // Fallback: tenta recuperar o primeiro objeto JSON presente na resposta.
    const inicio = jsonStr.indexOf('{');
    const fim = jsonStr.lastIndexOf('}');

    if (inicio !== -1 && fim !== -1 && fim > inicio) {
      const candidato = jsonStr.slice(inicio, fim + 1)
        .replace(/,\s*([}\]])/g, '$1')
        .trim();

      return JSON.parse(candidato);
    }

    throw error;
  }
};

const limparTextoClinico = (texto = '') => {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();
};

const extrairNomeItemClinico = (texto = '') => {
  const bruto = String(texto || '').trim();
  if (!bruto) {
    return '';
  }

  const semTags = bruto.replace(/\[[^\]]+\]\s*/g, '');
  const antesDosDetalhes = semTags
    .replace(/\s+(dentro|fora)\b.*$/i, '')
    .split(':')[0]
    .trim();

  return antesDosDetalhes.toLowerCase();
};

const reconciliarClassificacaoClinica = (foraReferencia = [], itensNormais = [], itensAlterados = []) => {
  const nomesAlterados = new Set(
    [...foraReferencia, ...itensAlterados]
      .map(extrairNomeItemClinico)
      .filter(Boolean)
  );

  const itensNormaisFiltrados = itensNormais.filter((item) => {
    const nome = extrairNomeItemClinico(item);
    return !nome || !nomesAlterados.has(nome);
  });

  return {
    foraReferencia,
    itensNormais: itensNormaisFiltrados,
    itensAlterados
  };
};

const inferirMimeTypeArquivo = (mimeTypeOriginal = '', buffer = Buffer.alloc(0), nomeArquivo = '') => {
  const mime = String(mimeTypeOriginal || '').toLowerCase();
  if (mime && mime !== 'application/octet-stream') {
    return mime;
  }

  const b0 = buffer[0];
  const b1 = buffer[1];
  const b2 = buffer[2];
  const b3 = buffer[3];

  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) return 'application/pdf';
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return 'image/jpeg';
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return 'image/png';
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return 'image/gif';
  if (b0 === 0x42 && b1 === 0x4d) return 'image/bmp';
  if (buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  if ((b0 === 0x49 && b1 === 0x49 && b2 === 0x2a && b3 === 0x00) ||
      (b0 === 0x4d && b1 === 0x4d && b2 === 0x00 && b3 === 0x2a)) {
    return 'image/tiff';
  }

  const nome = String(nomeArquivo || '').toLowerCase();
  if (nome.endsWith('.pdf')) return 'application/pdf';
  if (nome.endsWith('.jpg') || nome.endsWith('.jpeg')) return 'image/jpeg';
  if (nome.endsWith('.png')) return 'image/png';
  if (nome.endsWith('.gif')) return 'image/gif';
  if (nome.endsWith('.bmp')) return 'image/bmp';
  if (nome.endsWith('.webp')) return 'image/webp';
  if (nome.endsWith('.tif') || nome.endsWith('.tiff')) return 'image/tiff';

  return mime || 'application/octet-stream';
};

const extrairConteudoDataUrl = (dataUrl = '') => {
  const match = dataUrl.match(/^data:([^;]+)(?:;name=([^;]+))?;base64,(.+)$/i);
  if (!match) {
    return null;
  }

  const mimeTypeOriginal = (match[1] || 'application/octet-stream').toLowerCase();
  const nomeArquivo = match[2] ? decodeURIComponent(match[2]) : '';
  const base64 = match[3] || '';
  if (!base64) {
    return null;
  }

  const buffer = Buffer.from(base64, 'base64');
  const mimeType = inferirMimeTypeArquivo(mimeTypeOriginal, buffer, nomeArquivo);

  return {
    mimeType,
    nomeArquivo,
    buffer
  };
};

const extrairTextoPdfComPdfJs = async (pdfBuffer) => {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableWorker: true
    });

    const documento = await loadingTask.promise;
    const totalPaginas = Math.min(documento.numPages || 1, 100);
    const partes = [];

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      const page = await documento.getPage(pagina);
      const textContent = await page.getTextContent();
      const textoPagina = (textContent.items || [])
        .map((item) => item.str || '')
        .join(' ');

      if (textoPagina) {
        partes.push(textoPagina);
      }
    }

    return limparTextoClinico(partes.join(' '));
  } catch (error) {
    console.warn('[PDFJS][TEXTO][ERRO]', error.message);
    return '';
  }
};

const extrairTextoArquivoUpado = async (arquivoUrl) => {
  if (!arquivoUrl || typeof arquivoUrl !== 'string') {
    return { textoExtraido: '', origem: null, erro: null };
  }

  const conteudo = extrairConteudoDataUrl(arquivoUrl);
  if (!conteudo) {
    return { textoExtraido: '', origem: null, erro: 'Formato de arquivo não suportado para extração.' };
  }

  const { mimeType, buffer } = conteudo;

  try {
    if (mimeType === 'application/pdf') {
      const textoPdf = await extrairTextoPdfComPdfJs(buffer);

      if (textoPdf.length > 60) {
        return {
          textoExtraido: textoPdf,
          origem: 'pdf-texto',
          erro: null
        };
      }

      // PDF escaneado sem camada de texto: tentar OCR por renderização de páginas.
      const textoOcrPdf = await extrairTextoPdfViaOcr(buffer);
      return {
        textoExtraido: textoOcrPdf,
        origem: textoOcrPdf ? 'pdf-ocr' : 'pdf-sem-texto',
        erro: null
      };
    }

    if (mimeType.startsWith('image/')) {
      const resultadoOcr = await Tesseract.recognize(buffer, 'por+eng', {
        logger: () => {}
      });

      return {
        textoExtraido: limparTextoClinico(resultadoOcr?.data?.text || ''),
        origem: 'ocr-imagem',
        erro: null
      };
    }

    return { textoExtraido: '', origem: null, erro: 'Tipo de arquivo não suportado para OCR.' };
  } catch (error) {
    return {
      textoExtraido: '',
      origem: null,
      erro: error.message || 'Falha ao extrair texto do arquivo.'
    };
  }
};

const extrairTextoPdfViaOcr = async (pdfBuffer) => {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableWorker: true
    });

    const documento = await loadingTask.promise;
    const totalPaginas = Math.min(documento.numPages || 1, 100);
    const textos = [];

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      const page = await documento.getPage(pagina);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const contexto = canvas.getContext('2d');

      await page.render({
        canvasContext: contexto,
        viewport
      }).promise;

      const imagemBuffer = canvas.toBuffer('image/png');
      const ocr = await Tesseract.recognize(imagemBuffer, 'por+eng', {
        logger: () => {}
      });

      textos.push(ocr?.data?.text || '');
    }

    return limparTextoClinico(textos.join(' '));
  } catch (error) {
    console.warn('[OCR][PDF][ERRO]', error.message);
    return '';
  }
};

const extrairNumeroParametro = (texto = '', padrao) => {
  const match = texto.match(padrao);
  if (!match || !match[1]) {
    return null;
  }

  const valor = parseFloat(String(match[1]).replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
};

const analisarValoresClinicos = (texto = '') => {
  const foraReferencia = [];
  const itensNormais = [];
  const itensAlterados = [];
  const valoresImportantes = [];

  const textoNormalizado = String(texto || '').replace(/\s+/g, ' ');

  const padraoFaixa = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9/%\-\s]{2,40}?)\s*[:=-]?\s*(\d{1,4}(?:[\.,]\d+)?)\s*([a-zA-Z%\/]*)\s*(?:\(|\[)?\s*(?:ref(?:er[êe]ncia)?|vr|valores? de refer[êe]ncia|normal)\s*[:=]?\s*(\d{1,4}(?:[\.,]\d+)?)\s*(?:-|a|até)\s*(\d{1,4}(?:[\.,]\d+)?)/gi;
  let matchFaixa;
  while ((matchFaixa = padraoFaixa.exec(textoNormalizado)) !== null) {
    const parametro = (matchFaixa[1] || '').trim();
    const valor = parseFloat(String(matchFaixa[2]).replace(',', '.'));
    const unidade = (matchFaixa[3] || '').trim();
    const refMin = parseFloat(String(matchFaixa[4]).replace(',', '.'));
    const refMax = parseFloat(String(matchFaixa[5]).replace(',', '.'));

    if (![valor, refMin, refMax].every(Number.isFinite)) {
      continue;
    }

    const sufixoUnidade = unidade ? ` ${unidade}` : '';
    valoresImportantes.push(`${parametro}: ${valor}${sufixoUnidade} (referência ${refMin}-${refMax}${sufixoUnidade})`);

    if (valor < refMin || valor > refMax) {
      foraReferencia.push(`${parametro}: ${valor}${sufixoUnidade} fora da referência (${refMin}-${refMax}${sufixoUnidade}).`);
      itensAlterados.push(`${parametro} fora da faixa de referência.`);
    } else {
      itensNormais.push(`${parametro} dentro da faixa de referência.`);
    }
  }

  const padraoLimite = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9/%\-\s]{2,40}?)\s*[:=-]?\s*(\d{1,4}(?:[\.,]\d+)?)\s*([a-zA-Z%\/]*)\s*(?:\(|\[)?\s*(?:ref(?:er[êe]ncia)?|vr|normal)\s*[:=]?\s*(<=|<|>=|>)\s*(\d{1,4}(?:[\.,]\d+)?)/gi;
  let matchLimite;
  while ((matchLimite = padraoLimite.exec(textoNormalizado)) !== null) {
    const parametro = (matchLimite[1] || '').trim();
    const valor = parseFloat(String(matchLimite[2]).replace(',', '.'));
    const unidade = (matchLimite[3] || '').trim();
    const operador = matchLimite[4];
    const limite = parseFloat(String(matchLimite[5]).replace(',', '.'));

    if (![valor, limite].every(Number.isFinite)) {
      continue;
    }

    const sufixoUnidade = unidade ? ` ${unidade}` : '';
    valoresImportantes.push(`${parametro}: ${valor}${sufixoUnidade} (referência ${operador} ${limite}${sufixoUnidade})`);

    const dentro =
      (operador === '<' && valor < limite) ||
      (operador === '<=' && valor <= limite) ||
      (operador === '>' && valor > limite) ||
      (operador === '>=' && valor >= limite);

    if (dentro) {
      itensNormais.push(`${parametro} dentro do limite de referência (${operador} ${limite}).`);
    } else {
      foraReferencia.push(`${parametro}: ${valor}${sufixoUnidade} fora da referência (${operador} ${limite}${sufixoUnidade}).`);
      itensAlterados.push(`${parametro} fora do limite de referência.`);
    }
  }

  const padraoFaixaDireta = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9/%\-\s]{2,45}?)\s*[:=-]?\s*(\d{1,4}(?:[\.,]\d+)?)\s*([a-zA-Zµ%\/]*)\s+(\d{1,4}(?:[\.,]\d+)?)\s*(?:-|a|até)\s*(\d{1,4}(?:[\.,]\d+)?)/gi;
  let matchFaixaDireta;
  while ((matchFaixaDireta = padraoFaixaDireta.exec(textoNormalizado)) !== null) {
    const parametro = (matchFaixaDireta[1] || '').trim();
    const valor = parseFloat(String(matchFaixaDireta[2]).replace(',', '.'));
    const unidade = (matchFaixaDireta[3] || '').trim();
    const refMin = parseFloat(String(matchFaixaDireta[4]).replace(',', '.'));
    const refMax = parseFloat(String(matchFaixaDireta[5]).replace(',', '.'));

    if (![valor, refMin, refMax].every(Number.isFinite) || refMax <= refMin) {
      continue;
    }

    // Evita falsos positivos com texto sem nome de parâmetro clínico real.
    if (parametro.length < 3 || /data|hora|página|protocolo|solicitação/i.test(parametro)) {
      continue;
    }

    const sufixoUnidade = unidade ? ` ${unidade}` : '';
    valoresImportantes.push(`${parametro}: ${valor}${sufixoUnidade} (referência ${refMin}-${refMax}${sufixoUnidade})`);

    if (valor < refMin) {
      foraReferencia.push(`[BAIXO] ${parametro}: ${valor}${sufixoUnidade} (referência ${refMin}-${refMax}${sufixoUnidade}).`);
      itensAlterados.push(`${parametro} abaixo da faixa de referência.`);
    } else if (valor > refMax) {
      foraReferencia.push(`[ALTO] ${parametro}: ${valor}${sufixoUnidade} (referência ${refMin}-${refMax}${sufixoUnidade}).`);
      itensAlterados.push(`${parametro} acima da faixa de referência.`);
    } else {
      itensNormais.push(`${parametro} dentro da faixa de referência.`);
    }
  }

  const padraoFlag = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9/%\-\s]{2,45}?)\s*[:=-]?\s*(\d{1,4}(?:[\.,]\d+)?)\s*([a-zA-Zµ%\/]*)\s*(h|l|alto|baixo|anormal|\u2191|\u2193)\b/gi;
  let matchFlag;
  while ((matchFlag = padraoFlag.exec(textoNormalizado)) !== null) {
    const parametro = (matchFlag[1] || '').trim();
    const valor = parseFloat(String(matchFlag[2]).replace(',', '.'));
    const unidade = (matchFlag[3] || '').trim();
    const flagBruta = String(matchFlag[4] || '').toLowerCase();

    if (!Number.isFinite(valor) || parametro.length < 3) {
      continue;
    }

    const sufixoUnidade = unidade ? ` ${unidade}` : '';
    const flag =
      flagBruta === 'h' || flagBruta === 'alto' || flagBruta === '\u2191'
        ? 'ALTO'
        : flagBruta === 'l' || flagBruta === 'baixo' || flagBruta === '\u2193'
          ? 'BAIXO'
          : 'ANORMAL';

    valoresImportantes.push(`${parametro}: ${valor}${sufixoUnidade} (flag ${flag}).`);
    foraReferencia.push(`[${flag}] ${parametro}: ${valor}${sufixoUnidade}.`);
    itensAlterados.push(`${parametro} sinalizado como ${flag.toLowerCase()}.`);
  }

  if (/fora da refer[êe]ncia|acima da refer[êe]ncia|abaixo da refer[êe]ncia/i.test(textoNormalizado)) {
    itensAlterados.push('O texto do laudo menciona achado fora da referência.');
  }

  if (/dentro da refer[êe]ncia|dentro da normalidade|sem altera[cç][õo]es/i.test(textoNormalizado)) {
    itensNormais.push('O texto do laudo menciona achado dentro da normalidade.');
  }

  const classificacao = reconciliarClassificacaoClinica(
    unirListas(foraReferencia),
    unirListas(itensNormais),
    unirListas(itensAlterados)
  );

  return {
    foraReferencia: classificacao.foraReferencia,
    itensNormais: classificacao.itensNormais,
    itensAlterados: classificacao.itensAlterados,
    valoresImportantes: unirListas(valoresImportantes)
  };
};

const unirListas = (...listas) => {
  return [...new Set(listas.flat().filter(Boolean).map((item) => String(item).trim()))];
};

const combinarInsightComLocal = (insightModelo, insightLocal, extracaoArquivo) => {
  const base = insightModelo || {};

  const foraReferencia = unirListas(insightLocal.foraReferencia || [], base.foraReferencia || []);
  const itensAlterados = unirListas(insightLocal.itensAlterados || [], base.itensAlterados || []);
  const itensNormaisBrutos = unirListas(insightLocal.itensNormais || [], base.itensNormais || []);
  const classificacao = reconciliarClassificacaoClinica(foraReferencia, itensNormaisBrutos, itensAlterados);

  return {
    resumo: base.resumo || insightLocal.resumo,
    conclusao: base.conclusao || insightLocal.conclusao,
    foraReferencia: classificacao.foraReferencia,
    alertas: unirListas(base.alertas || [], insightLocal.alertas || []),
    itensNormais: classificacao.itensNormais,
    itensAlterados: classificacao.itensAlterados,
    valoresImportantes: unirListas(insightLocal.valoresImportantes || [], base.valoresImportantes || []),
    pendencias: unirListas(base.pendencias || [], insightLocal.pendencias || []),
    recomendacoes: unirListas(base.recomendacoes || [], insightLocal.recomendacoes || []),
    modelo: base.modelo || insightLocal.modelo,
    diagnosticoExtracao: {
      origem: extracaoArquivo?.origem || null,
      caracteresExtraidos: (extracaoArquivo?.textoExtraido || '').length,
      erro: extracaoArquivo?.erro || null
    }
  };
};

const gerarInsightRegistroLocal = (registro, textoArquivoExtraido = '', erroExtracao = null) => {
  const agora = new Date();
  const dataRegistro = new Date(registro.data);
  const dias = Math.floor((agora.getTime() - dataRegistro.getTime()) / (1000 * 60 * 60 * 24));
  const orgaoTexto = (registro.orgao || '').toLowerCase();
  const textoClinico = `${registro.descricaoClinica || ''} ${textoArquivoExtraido || ''}`.toLowerCase();

  const alertas = [];
  const recomendacoes = [];
  const pendencias = [];
  const foraReferencia = [];
  const itensNormais = [];
  const itensAlterados = [];
  const valoresImportantes = [];

  if (!registro.arquivoUrl) {
    pendencias.push('Registro sem arquivo anexado para validação detalhada.');
  }

  if (registro.arquivoUrl && !textoArquivoExtraido) {
    pendencias.push('Arquivo anexado sem texto extraível automaticamente. Inserir resumo clínico manualmente melhora o resultado.');
  }

  if (erroExtracao) {
    pendencias.push(`Falha na leitura automática do arquivo: ${erroExtracao}`);
  }

  const achadosDeterministicos = analisarValoresClinicos(textoClinico);
  foraReferencia.push(...achadosDeterministicos.foraReferencia);
  itensNormais.push(...achadosDeterministicos.itensNormais);
  itensAlterados.push(...achadosDeterministicos.itensAlterados);
  valoresImportantes.push(...achadosDeterministicos.valoresImportantes);

  if (dias > 180) {
    alertas.push(`Registro sem atualização recente (${dias} dias).`);
    recomendacoes.push('Considerar repetição do exame ou atualização do acompanhamento.');
  }

  if (registro.tipo === 'receita') {
    recomendacoes.push('Checar aderência terapêutica e possíveis interações medicamentosas.');
  }

  if (registro.tipo === 'medicamento') {
    recomendacoes.push('Validar dose, frequência e efeitos adversos relatados pelo paciente.');
  }

  if (registro.tipo === 'alergia') {
    alertas.push('Atenção para risco de reação adversa.');
    recomendacoes.push('Confirmar alergia em todas as prescrições futuras.');
  }

  const resumo = foraReferencia.length > 0
    ? `Foram identificados ${foraReferencia.length} achado(s) possivelmente fora da referência no registro.`
    : 'Não foram identificados achados objetivamente fora da referência no conteúdo analisado.';

  const conclusao = itensAlterados.length > 0
    ? 'Foram identificados possíveis achados alterados no texto informado. Necessária validação clínica com laudo completo.'
    : 'Não foram detectados achados alterados evidentes no texto informado. Confirmar com laudo completo.';

  return {
    resumo,
    conclusao,
    foraReferencia,
    alertas,
    itensNormais,
    itensAlterados,
    valoresImportantes,
    pendencias,
    recomendacoes,
    modelo: 'heuristico-registro-local-v1'
  };
};

const gerarInsightRegistroComGemini = async (registro, extracaoArquivo = null) => {
  try {
    const extracao = extracaoArquivo || await extrairTextoArquivoUpado(registro.arquivoUrl);
    const textoArquivoExtraido = extracao.textoExtraido || '';
    const conteudoArquivo = extrairConteudoDataUrl(registro.arquivoUrl || '');
    const mimeTypeArquivo = conteudoArquivo?.mimeType || '';
    const mimeTypesGeminiInlineSuportados = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]);
    const arquivoSuportadoNoGemini = mimeTypesGeminiInlineSuportados.has(mimeTypeArquivo);

    const limiteArquivoMb = Number.parseInt(process.env.GEMINI_MAX_FILE_MB || '18', 10);
    const tamanhoArquivoMb = conteudoArquivo?.buffer
      ? (conteudoArquivo.buffer.length / (1024 * 1024))
      : 0;

    const enviarArquivoDireto = Boolean(
      conteudoArquivo &&
      arquivoSuportadoNoGemini &&
      tamanhoArquivoMb <= (Number.isFinite(limiteArquivoMb) ? limiteArquivoMb : 18)
    );

    const arquivoBase64 = enviarArquivoDireto
      ? conteudoArquivo.buffer.toString('base64')
      : null;

    const criarPrompt = (textoArquivoLimitado) => `Você é um assistente clínico para suporte a profissionais de saúde.
Analise o registro e responda SOMENTE com JSON válido, sem markdown.

DADOS DO REGISTRO:
- tipo: ${registro.tipo}
- data: ${new Date(registro.data).toLocaleDateString('pt-BR')}
- órgão/sistema: ${registro.orgao || 'não informado'}
- possui_arquivo: ${registro.arquivoUrl ? 'sim' : 'não'}
- arquivo_enviado_diretamente_para_ia: ${enviarArquivoDireto ? 'sim' : 'não'}
- tipo_arquivo: ${mimeTypeArquivo || 'não informado'}
- resumo_clinico_informado: ${registro.descricaoClinica || 'não informado'}
- texto_extraido_do_arquivo: ${textoArquivoLimitado || 'não extraído'}

Objetivo:
1) Gerar um resumo curto e técnico do exame.
2) Gerar uma conclusão curta, sem diagnóstico definitivo, usando linguagem cautelosa.
3) Sempre incluir na conclusão o aviso: "Esta análise é uma ferramenta de apoio e não substitui a consulta com um profissional de saúde qualificado."

Formato obrigatório final (JSON puro):
{
  "resumo": "string",
  "conclusao": "string"
}`;

    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada.');
    }

    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const geminiUrl = process.env.GEMINI_URL
      || `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const timeoutMsBase = Number.parseInt(process.env.GEMINI_TIMEOUT_MS || '120000', 10);
    const textLimitBase = Number.parseInt(process.env.GEMINI_TEXT_LIMIT || '18000', 10);

    const perfisGeracao = [
      {
        nome: 'normal',
        textLimit: Number.isFinite(textLimitBase) ? textLimitBase : 18000,
        timeoutMs: Number.isFinite(timeoutMsBase) ? timeoutMsBase : 120000
      },
      {
        nome: 'leve',
        textLimit: 6000,
        timeoutMs: Math.max(Number.isFinite(timeoutMsBase) ? timeoutMsBase : 120000, 120000)
      },
      {
        nome: 'ultra-leve',
        textLimit: 3000,
        timeoutMs: Math.max(Number.isFinite(timeoutMsBase) ? timeoutMsBase : 120000, 120000)
      }
    ];

    let respostaTexto = '';
    let erroConexao = null;

    for (const perfil of perfisGeracao) {
      const textoArquivoLimitado = textoArquivoExtraido.slice(0, perfil.textLimit);
      const prompt = criarPrompt(textoArquivoLimitado);
      const parts = [{ text: prompt }];

      if (enviarArquivoDireto && arquivoBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeTypeArquivo,
            data: arquivoBase64
          }
        });
      }

      try {
        const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(perfil.timeoutMs)
          : undefined;

        const response = await fetch(`${geminiUrl}?key=${encodeURIComponent(geminiApiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          }),
          signal
        });

        if (!response.ok) {
          const detalhe = await response.text().catch(() => 'sem detalhes');
          throw new Error(`Gemini retornou ${response.status} (${perfil.nome}): ${detalhe.slice(0, 300)}`);
        }

        const responseJson = await response.json();
        if (responseJson.error) {
          throw new Error(`Gemini erro: ${responseJson.error.message || 'erro desconhecido'}`);
        }

        respostaTexto = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!respostaTexto || !respostaTexto.trim()) {
          throw new Error('Resposta vazia do Gemini.');
        }

        erroConexao = null;
        break;
      } catch (error) {
        erroConexao = error;
        respostaTexto = '';
      }
    }

    if (!respostaTexto) {
      throw new Error(`Falha ao conectar no Gemini: ${erroConexao?.message || 'erro desconhecido'}`);
    }

    const parsed = parseJsonFromModelResponse(respostaTexto);

    return {
      resumo: parsed.resumo || 'Análise concluída. Revisar documento clínico para confirmação.',
      conclusao: parsed.conclusao || 'Resultado assistivo gerado. Necessária validação clínica profissional.',
      foraReferencia: [],
      alertas: [],
      itensNormais: [],
      itensAlterados: [],
      valoresImportantes: [],
      pendencias: [],
      recomendacoes: [],
      modelo: `gemini-${geminiModel}`
    };
  } catch (error) {
    console.warn('[INSIGHT_REGISTRO][GEMINI][ERRO]', error.message);

    return {
      resumo: '',
      conclusao: '',
      foraReferencia: [],
      alertas: [],
      itensNormais: [],
      itensAlterados: [],
      valoresImportantes: [],
      pendencias: [`Falha no Gemini: ${error.message}`],
      recomendacoes: ['Revisar análise determinística abaixo e validar GEMINI_API_KEY/configuração da API.'],
      modelo: `heuristico-gemini-fallback`
    };
  }
};

const obterTokenBearer = (authHeader = '') => {
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const mapearInsightPersistido = (insightRegistro) => {
  return {
    resumo: insightRegistro.resumo,
    conclusao: insightRegistro.conclusao,
    foraReferencia: JSON.parse(insightRegistro.foraReferenciaJson || '[]'),
    alertas: JSON.parse(insightRegistro.alertasJson || '[]'),
    itensNormais: JSON.parse(insightRegistro.itensNormaisJson || '[]'),
    itensAlterados: JSON.parse(insightRegistro.itensAlteradosJson || '[]'),
    valoresImportantes: JSON.parse(insightRegistro.valoresImportantesJson || '[]'),
    pendencias: JSON.parse(insightRegistro.pendenciasJson || '[]'),
    recomendacoes: JSON.parse(insightRegistro.recomendacoesJson || '[]'),
    diagnosticoExtracao: JSON.parse(insightRegistro.diagnosticoExtracaoJson || '{}'),
    modelo: insightRegistro.modelo,
    geradoEm: insightRegistro.geradoEm,
    atualizadoEm: insightRegistro.atualizadoEm,
    origem: 'cache'
  };
};

const salvarInsightRegistro = async (registroId, insight) => {
  const salvo = await prisma.insightRegistro.upsert({
    where: { registroId },
    update: {
      resumo: insight.resumo,
      conclusao: insight.conclusao,
      foraReferenciaJson: JSON.stringify(insight.foraReferencia || []),
      alertasJson: JSON.stringify(insight.alertas || []),
      itensNormaisJson: JSON.stringify(insight.itensNormais || []),
      itensAlteradosJson: JSON.stringify(insight.itensAlterados || []),
      valoresImportantesJson: JSON.stringify(insight.valoresImportantes || []),
      pendenciasJson: JSON.stringify(insight.pendencias || []),
      recomendacoesJson: JSON.stringify(insight.recomendacoes || []),
      diagnosticoExtracaoJson: JSON.stringify(insight.diagnosticoExtracao || {}),
      modelo: insight.modelo
    },
    create: {
      registroId,
      resumo: insight.resumo,
      conclusao: insight.conclusao,
      foraReferenciaJson: JSON.stringify(insight.foraReferencia || []),
      alertasJson: JSON.stringify(insight.alertas || []),
      itensNormaisJson: JSON.stringify(insight.itensNormais || []),
      itensAlteradosJson: JSON.stringify(insight.itensAlterados || []),
      valoresImportantesJson: JSON.stringify(insight.valoresImportantes || []),
      pendenciasJson: JSON.stringify(insight.pendencias || []),
      recomendacoesJson: JSON.stringify(insight.recomendacoes || []),
      diagnosticoExtracaoJson: JSON.stringify(insight.diagnosticoExtracao || {}),
      modelo: insight.modelo
    }
  });

  return mapearInsightPersistido(salvo);
};

exports.cadastrarProfissional = async (req, res) => {
  try {
    const { nome, email, senha, crm, especialidade } = req.body;

    const profissionalExiste = await prisma.profissional.findUnique({
      where: { email }
    });

    if (profissionalExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoProfissional = await prisma.profissional.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        crm: crm || null,
        especialidade: especialidade || null
      }
    });

    return res.status(201).json({
      mensagem: 'Profissional cadastrado com sucesso!',
      profissional: {
        id: novoProfissional.id,
        nome: novoProfissional.nome,
        email: novoProfissional.email,
        crm: novoProfissional.crm,
        especialidade: novoProfissional.especialidade
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao cadastrar profissional.' });
  }
};

exports.loginProfissional = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const profissional = await prisma.profissional.findUnique({
      where: { email }
    });

    if (!profissional) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    if (profissional.ativo === false) {
      return res.status(403).json({ erro: 'Conta desativada. Contate o administrador.' });
    }

    if (profissional.crmValidado === false) {
      return res.status(403).json({ erro: 'Conta pendente de validação de CRM. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, profissional.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: profissional.id, tipo: 'profissional' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
        email: profissional.email,
        crm: profissional.crm,
        especialidade: profissional.especialidade
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao fazer login de profissional.' });
  }
};

exports.dashboardProfissional = async (req, res) => {
  try {
    const token = obterTokenBearer(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({ erro: 'Token não informado.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    if (payload.tipo !== 'profissional') {
      return res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
    }

    const profissional = await prisma.profissional.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        especialidade: true,
        permissoesRecebidas: {
          include: {
            paciente: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: {
            expiraEm: 'asc'
          }
        }
      }
    });

    if (!profissional) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'DASHBOARD_PROFISSIONAL_VISUALIZADO',
        documentoId: profissional.id,
        status: 'Sucesso'
      }
    });

    const agora = new Date();
    const pacientes = profissional.permissoesRecebidas.map((permissao) => {
      const expirou = permissao.expiraEm ? permissao.expiraEm < agora : false;
      const status = !permissao.ativo || expirou ? 'Inativo' : 'Ativo';

      return {
        permissaoId: permissao.id,
        pacienteId: permissao.paciente.id,
        nome: permissao.paciente.nome,
        email: permissao.paciente.email,
        permissao: permissao.nivelAcesso,
        expiraEm: permissao.expiraEm,
        status
      };
    });

    return res.status(200).json({
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
        email: profissional.email,
        crm: profissional.crm,
        especialidade: profissional.especialidade
      },
      pacientes
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao carregar dashboard do profissional.' });
  }
};

exports.listarRegistrosPaciente = async (req, res) => {
  try {
    const token = obterTokenBearer(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({ erro: 'Token não informado.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    if (payload.tipo !== 'profissional') {
      return res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
    }

    const { pacienteId } = req.params;

    // Verificar se o profissional tem permissão ativa para este paciente
    const permissao = await prisma.permissao.findFirst({
      where: {
        pacienteId,
        profissionalId: payload.id,
        ativo: true
      }
    });

    if (!permissao) {
      return res.status(403).json({ erro: 'Você não possui permissão para acessar os registros deste paciente.' });
    }

    // Verificar se a permissão não expirou
    const agora = new Date();
    if (permissao.expiraEm && permissao.expiraEm < agora) {
      return res.status(403).json({ erro: 'Sua permissão de acesso expirou.' });
    }

    // Buscar registros do paciente
    const registros = await prisma.registro.findMany({
      where: { pacienteId },
      select: {
        id: true,
        tipo: true,
        data: true,
        orgao: true,
        descricaoClinica: true,
        arquivoUrl: true
      },
      orderBy: {
        data: 'desc'
      }
    });

    return res.status(200).json({ registros });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar registros.' });
  }
};

exports.obterRegistro = async (req, res) => {
  try {
    const token = obterTokenBearer(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({ erro: 'Token não informado.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    if (payload.tipo !== 'profissional') {
      return res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
    }

    const { pacienteId, registroId } = req.params;

    // Verificar se o profissional tem permissão ativa para este paciente
    const permissao = await prisma.permissao.findFirst({
      where: {
        pacienteId,
        profissionalId: payload.id,
        ativo: true
      }
    });

    if (!permissao) {
      return res.status(403).json({ erro: 'Você não possui permissão para acessar os registros deste paciente.' });
    }

    // Verificar se a permissão não expirou
    const agora = new Date();
    if (permissao.expiraEm && permissao.expiraEm < agora) {
      return res.status(403).json({ erro: 'Sua permissão de acesso expirou.' });
    }

    // Buscar registro específico
    const registro = await prisma.registro.findUnique({
      where: { id: registroId }
    });

    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }

    if (registro.pacienteId !== pacienteId) {
      return res.status(403).json({ erro: 'Este registro não pertence a este paciente.' });
    }

    // Criar log de auditoria
    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'REGISTRO_VISUALIZADO',
        documentoId: registroId,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ registro });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao obter registro.' });
  }
};

const validarAcessoRegistroProfissional = async (req, res) => {
  try {
    const token = obterTokenBearer(req.headers.authorization || '');

    if (!token) {
      res.status(401).json({ erro: 'Token não informado.' });
      return null;
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      res.status(401).json({ erro: 'Token inválido ou expirado.' });
      return null;
    }

    if (payload.tipo !== 'profissional') {
      res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
      return null;
    }

    const { pacienteId, registroId } = req.params;

    const permissao = await prisma.permissao.findFirst({
      where: {
        pacienteId,
        profissionalId: payload.id,
        ativo: true
      }
    });

    if (!permissao) {
      res.status(403).json({ erro: 'Você não possui permissão para acessar os registros deste paciente.' });
      return null;
    }

    const agora = new Date();
    if (permissao.expiraEm && permissao.expiraEm < agora) {
      res.status(403).json({ erro: 'Sua permissão de acesso expirou.' });
      return null;
    }

    const registro = await prisma.registro.findUnique({
      where: { id: registroId },
      select: {
        id: true,
        tipo: true,
        data: true,
        orgao: true,
        descricaoClinica: true,
        arquivoUrl: true,
        pacienteId: true
      }
    });

    if (!registro) {
      res.status(404).json({ erro: 'Registro não encontrado.' });
      return null;
    }

    if (registro.pacienteId !== pacienteId) {
      res.status(403).json({ erro: 'Este registro não pertence a este paciente.' });
      return null;
    }

    return { payload, registro, registroId };
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno no servidor ao validar acesso ao registro.' });
    return null;
  }
};

exports.obterInsightRegistro = async (req, res) => {
  try {
    const contexto = await validarAcessoRegistroProfissional(req, res);
    if (!contexto) {
      return;
    }

    const { registroId, payload } = contexto;

    const insightSalvo = await prisma.insightRegistro.findUnique({
      where: { registroId }
    });

    if (!insightSalvo) {
      return res.status(404).json({ erro: 'Insight ainda não gerado para este registro.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'INSIGHT_REGISTRO_CACHE_VISUALIZADO',
        documentoId: registroId,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ insight: mapearInsightPersistido(insightSalvo) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao obter insight do registro.' });
  }
};

exports.gerarInsightRegistro = async (req, res) => {
  try {
    const contexto = await validarAcessoRegistroProfissional(req, res);
    if (!contexto) {
      return;
    }

    const { payload, registro, registroId } = contexto;

    const extracaoArquivo = await extrairTextoArquivoUpado(registro.arquivoUrl);

    const insightLocal = gerarInsightRegistroLocal(
      registro,
      extracaoArquivo.textoExtraido,
      extracaoArquivo.erro
    );

    const insightModelo = await gerarInsightRegistroComGemini(registro, extracaoArquivo);
    const insightCombinado = combinarInsightComLocal(insightModelo, insightLocal, extracaoArquivo);
    const insight = {
      resumo: insightCombinado.resumo || insightLocal.resumo,
      conclusao: insightCombinado.conclusao || insightLocal.conclusao,
      foraReferencia: [],
      alertas: [],
      itensNormais: [],
      itensAlterados: [],
      valoresImportantes: [],
      pendencias: [],
      recomendacoes: [],
      modelo: insightCombinado.modelo,
      diagnosticoExtracao: insightCombinado.diagnosticoExtracao
    };

    const insightPersistido = await salvarInsightRegistro(registroId, insight);

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'INSIGHT_REGISTRO_GERADO',
        documentoId: registroId,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ insight: insightPersistido });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao gerar insight do registro.' });
  }
};
