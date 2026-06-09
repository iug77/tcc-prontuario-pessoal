const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

// Parses strings like:
//   "Glicose: 150 mg/dL (referência 70-100 mg/dL)"
//   "[ALTO] Hemoglobina: 11.5 g/dL (referência 12-16 g/dL)."
function parsearValor(texto) {
  if (!texto || typeof texto !== 'string') return null;

  let status = null;
  const tagMatch = texto.match(/^\[([A-ZÁÉÍÓÚÀÃÕÂÊÔÜ]+)\]/i);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    if (tag === 'ALTO' || tag === 'ELEVADO') status = 'ALTO';
    else if (tag === 'BAIXO') status = 'BAIXO';
    else if (tag === 'CRITICO' || tag === 'CRÍTICO') status = 'CRITICO';
    else status = tag;
  }

  const limpo = texto
    .replace(/^\[[^\]]+\]\s*/i, '')
    .replace(/\.$/, '')
    .trim();

  // "NOME: VALOR UNIDADE (referência MIN-MAX UNIDADE)"
  const match = limpo.match(
    /^(.+?):\s*([\d.,]+)\s*([^\s(,/]+)(?:\s*\(referência\s*([\d.,]+)\s*[-–]\s*([\d.,]+))?/i
  );
  if (!match) return null;

  const nome = match[1].trim();
  const valor = parseFloat(match[2].replace(',', '.'));
  const unidade = match[3].replace(/[()]/g, '').trim();
  const refMin = match[4] != null ? parseFloat(match[4].replace(',', '.')) : null;
  const refMax = match[5] != null ? parseFloat(match[5].replace(',', '.')) : null;

  if (isNaN(valor)) return null;

  return { nome, valor, unidade, refMin, refMax, status };
}

function parsearJson(str, fallback = []) {
  try { return JSON.parse(str || 'null') ?? fallback; } catch { return fallback; }
}

const obterTendencias = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Token não fornecido.' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    if (payload.tipo !== 'paciente') {
      return res.status(403).json({ erro: 'Acesso restrito a pacientes.' });
    }

    const registros = await prisma.registro.findMany({
      where: { pacienteId: payload.id },
      orderBy: { data: 'asc' },
      select: {
        id: true,
        tipo: true,
        data: true,
        insightRegistro: {
          select: {
            valoresImportantesJson: true,
            foraReferenciaJson: true,
            itensAlteradosJson: true,
          },
        },
      },
    });

    const totalRegistros = registros.length;
    const totalComInsight = registros.filter((r) => r.insightRegistro).length;

    // Aggregate by parameter name
    const parametros = {};

    for (const reg of registros) {
      if (!reg.insightRegistro) continue;

      const valoresImportantes = parsearJson(reg.insightRegistro.valoresImportantesJson);
      const foraReferencia = parsearJson(reg.insightRegistro.foraReferenciaJson);

      // Build status map from foraReferenciaJson (these have [ALTO]/[BAIXO] tags)
      const statusMap = {};
      for (const item of foraReferencia) {
        const p = parsearValor(item);
        if (p?.status) statusMap[p.nome.toLowerCase()] = p.status;
      }

      for (const item of valoresImportantes) {
        const p = parsearValor(item);
        if (!p) continue;

        const chaveNorm = p.nome.toLowerCase();
        let status = statusMap[chaveNorm] || p.status;

        // Fallback: determine from ref range if no explicit status
        if (!status && p.refMin != null && p.refMax != null) {
          if (p.valor > p.refMax) status = 'ALTO';
          else if (p.valor < p.refMin) status = 'BAIXO';
          else status = 'NORMAL';
        }
        status = status || 'NORMAL';

        if (!parametros[p.nome]) {
          parametros[p.nome] = {
            unidade: p.unidade,
            refMin: p.refMin,
            refMax: p.refMax,
            pontos: [],
          };
        } else {
          // Fill in reference range if not yet captured
          if (parametros[p.nome].refMin == null && p.refMin != null) {
            parametros[p.nome].refMin = p.refMin;
            parametros[p.nome].refMax = p.refMax;
          }
        }

        const dataFormatada = reg.data
          ? new Date(reg.data).toISOString().split('T')[0]
          : null;

        parametros[p.nome].pontos.push({
          data: dataFormatada,
          valor: p.valor,
          status,
          tipo: reg.tipo,
        });
      }
    }

    // Calculate period
    const datas = registros
      .map((r) => r.data)
      .filter(Boolean)
      .map((d) => new Date(d).getTime());

    const periodoInicio = datas.length
      ? new Date(Math.min(...datas)).toISOString().split('T')[0]
      : null;
    const periodoFim = datas.length
      ? new Date(Math.max(...datas)).toISOString().split('T')[0]
      : null;

    return res.json({
      totalRegistros,
      totalComInsight,
      periodoInicio,
      periodoFim,
      parametros,
    });
  } catch (err) {
    console.error('Erro ao obter tendências clínicas:', err);
    return res.status(500).json({ erro: 'Erro interno ao calcular tendências.' });
  }
};

module.exports = { obterTendencias };
