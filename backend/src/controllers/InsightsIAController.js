const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

const parseJsonFromModelResponse = (raw = '') => {
  let jsonStr = (raw || '').trim();

  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0];
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0];
  }

  return JSON.parse(jsonStr.trim());
};

const obterTokenBearer = (authHeader = '') => {
  const [tipo, token] = authHeader.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

const autenticarProfissional = (req, res) => {
  const token = obterTokenBearer(req.headers.authorization || '');

  if (!token) {
    res.status(401).json({ erro: 'Token não informado.' });
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.tipo !== 'profissional') {
      res.status(403).json({ erro: 'Acesso permitido apenas para profissionais.' });
      return null;
    }

    return payload;
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
    return null;
  }
};

const validarPermissaoAtiva = async (pacienteId, profissionalId) => {
  const permissao = await prisma.permissao.findFirst({
    where: {
      pacienteId,
      profissionalId,
      ativo: true,
      OR: [
        { expiraEm: null },
        { expiraEm: { gte: new Date() } }
      ]
    }
  });

  return Boolean(permissao);
};

const gerarInsightsLocais = (paciente, registros) => {
  const agora = new Date();
  const total = registros.length;

  const porTipo = registros.reduce((acc, registro) => {
    acc[registro.tipo] = (acc[registro.tipo] || 0) + 1;
    return acc;
  }, {});

  const ultimoRegistro = registros[0] || null;
  const diasSemAtualizacao = ultimoRegistro
    ? Math.floor((agora.getTime() - new Date(ultimoRegistro.data).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const comArquivo = registros.filter((item) => Boolean(item.arquivoUrl)).length;
  const semArquivo = total - comArquivo;

  const alertas = [];
  const tendencias = [];
  const pendencias = [];
  const recomendacoes = [];

  if (total === 0) {
    alertas.push({
      tipo: 'dados',
      severidade: 'media',
      titulo: 'Sem registros no prontuário',
      descricao: 'O paciente ainda não possui registros cadastrados para análise.'
    });

    pendencias.push({
      tipo: 'cadastro',
      descricao: 'Iniciar histórico com registros básicos de exames e condições clínicas.'
    });
  }

  if (diasSemAtualizacao !== null && diasSemAtualizacao > 180) {
    alertas.push({
      tipo: 'acompanhamento',
      severidade: 'media',
      titulo: 'Prontuário sem atualização recente',
      descricao: `Último registro há ${diasSemAtualizacao} dias.`
    });
  }

  if (semArquivo > 0) {
    pendencias.push({
      tipo: 'documentacao',
      descricao: `${semArquivo} registro(s) sem arquivo anexado para validação documental.`
    });
  }

  Object.keys(porTipo).forEach((tipo) => {
    tendencias.push({
      parametro: tipo,
      direcao: 'estavel',
      descricao: `${porTipo[tipo]} registro(s) do tipo ${tipo} no histórico disponível.`
    });
  });

  recomendacoes.push('Validar os achados da IA com contexto clínico e consulta presencial.');
  recomendacoes.push('Priorizar revisão dos registros mais antigos sem atualização recente.');

  const resumoClinico = total === 0
    ? `Paciente ${paciente.nome} sem dados suficientes para análise clínica assistiva.`
    : `Paciente ${paciente.nome} possui ${total} registro(s). Último registro em ${new Date(ultimoRegistro.data).toLocaleDateString('pt-BR')}. Registros com arquivo: ${comArquivo}.`;

  return {
    resumoClinico,
    alertas,
    tendencias,
    pendencias,
    recomendacoes,
    confiancaGeral: total > 0 ? 0.72 : 0.35,
    modelo: 'heuristico-local-v1'
  };
};

const gerarInsightsComOllama = async (paciente, registros) => {
  try {
    const resumoRegistros = registros.slice(0, 10).map((r) => {
      return `- ${r.tipo} (${new Date(r.data).toLocaleDateString('pt-BR')}): ${r.orgao || 'Órgão não informado'}`;
    }).join('\n');

    const prompt = `Você é um assistente de IA especializado em análise de prontuários médicos. 
Analise os registros clínicos abaixo e gere insights para auxiliar o profissional médico.

PACIENTE: ${paciente.nome}
TOTAL DE REGISTROS: ${registros.length}
ÚLTIMOS REGISTROS:
${resumoRegistros || 'Nenhum registro disponível'}

Responda em JSON:
{
  "resumoClinico": "resumo de 1-2 linhas",
  "alertas": [{"tipo": "string", "severidade": "baixa|media|alta", "titulo": "string", "descricao": "string"}],
  "tendencias": [{"parametro": "string", "direcao": "melhora|estavel|piora", "descricao": "string"}],
  "pendencias": [{"tipo": "string", "descricao": "string"}],
  "recomendacoes": ["string"]
}`;

    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaGenerateUrl = process.env.OLLAMA_URL || `${ollamaBaseUrl}/api/generate`;

    const numCtx = Number.parseInt(process.env.OLLAMA_NUM_CTX || '32768', 10);

    const response = await fetch(
      ollamaGenerateUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
          prompt,
          stream: false,
          temperature: 0.2,
          options: {
            num_ctx: Number.isFinite(numCtx) ? numCtx : 32768
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Ollama retornou ${response.status}`);
    }

    const responseJson = await response.json();
    if (!responseJson.response) {
      throw new Error('Resposta inválida do Ollama');
    }

    const insights = parseJsonFromModelResponse(responseJson.response);

    return {
      resumoClinico: insights.resumoClinico || 'Análise concluída.',
      alertas: insights.alertas || [],
      tendencias: insights.tendencias || [],
      pendencias: insights.pendencias || [],
      recomendacoes: insights.recomendacoes || [],
      confiancaGeral: 0.80,
      modelo: 'ollama-' + (process.env.OLLAMA_MODEL || 'qwen2.5:7b')
    };
  } catch (error) {
    console.warn('[OLLAMA][ERRO]', error.message);
    return null;
  }
};

exports.gerarInsights = async (req, res) => {
  try {
    const payload = autenticarProfissional(req, res);
    if (!payload) {
      return;
    }

    const { pacienteId } = req.params;

    const permitido = await validarPermissaoAtiva(pacienteId, payload.id);
    if (!permitido) {
      return res.status(403).json({ erro: 'Sem permissão ativa para este paciente.' });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true, nome: true }
    });

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }

    const registros = await prisma.registro.findMany({
      where: { pacienteId },
      select: {
        id: true,
        tipo: true,
        data: true,
        orgao: true,
        arquivoUrl: true
      },
      orderBy: {
        data: 'desc'
      }
    });

    const insights = (await gerarInsightsComOllama(paciente, registros)) || gerarInsightsLocais(paciente, registros);

    console.log(`[INSIGHTS] Insight gerado com modelo: ${insights.modelo} para paciente ${paciente.nome}`);

    const insightSalvo = await prisma.insightIA.create({
      data: {
        pacienteId,
        profissionalId: payload.id,
        resumoClinico: insights.resumoClinico,
        alertasJson: JSON.stringify(insights.alertas),
        tendenciasJson: JSON.stringify(insights.tendencias),
        pendenciasJson: JSON.stringify(insights.pendencias),
        recomendacoesJson: JSON.stringify(insights.recomendacoes),
        confiancaGeral: insights.confiancaGeral,
        modelo: insights.modelo,
        status: 'GERADO'
      }
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'INSIGHT_IA_GERADO',
        documentoId: insightSalvo.id,
        status: 'Sucesso'
      }
    });

    return res.status(201).json({
      mensagem: 'Insights gerados com sucesso.',
      insight: {
        id: insightSalvo.id,
        pacienteId,
        resumoClinico: insightSalvo.resumoClinico,
        alertas: JSON.parse(insightSalvo.alertasJson),
        tendencias: JSON.parse(insightSalvo.tendenciasJson),
        pendencias: JSON.parse(insightSalvo.pendenciasJson),
        recomendacoes: JSON.parse(insightSalvo.recomendacoesJson),
        confiancaGeral: insightSalvo.confiancaGeral,
        modelo: insightSalvo.modelo,
        status: insightSalvo.status,
        criadoEm: insightSalvo.criadoEm
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao gerar insights IA.' });
  }
};

exports.obterInsightsAtuais = async (req, res) => {
  try {
    const payload = autenticarProfissional(req, res);
    if (!payload) {
      return;
    }

    const { pacienteId } = req.params;

    const permitido = await validarPermissaoAtiva(pacienteId, payload.id);
    if (!permitido) {
      return res.status(403).json({ erro: 'Sem permissão ativa para este paciente.' });
    }

    const insight = await prisma.insightIA.findFirst({
      where: {
        pacienteId,
        profissionalId: payload.id
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    if (!insight) {
      return res.status(404).json({ erro: 'Nenhum insight encontrado para este paciente.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'INSIGHT_IA_VISUALIZADO',
        documentoId: insight.id,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({
      insight: {
        id: insight.id,
        pacienteId: insight.pacienteId,
        resumoClinico: insight.resumoClinico,
        alertas: JSON.parse(insight.alertasJson),
        tendencias: JSON.parse(insight.tendenciasJson),
        pendencias: JSON.parse(insight.pendenciasJson),
        recomendacoes: JSON.parse(insight.recomendacoesJson),
        confiancaGeral: insight.confiancaGeral,
        modelo: insight.modelo,
        status: insight.status,
        feedback: insight.feedback,
        criadoEm: insight.criadoEm,
        atualizadoEm: insight.atualizadoEm
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao obter insights IA.' });
  }
};

exports.obterHistoricoInsights = async (req, res) => {
  try {
    const payload = autenticarProfissional(req, res);
    if (!payload) {
      return;
    }

    const { pacienteId } = req.params;

    const permitido = await validarPermissaoAtiva(pacienteId, payload.id);
    if (!permitido) {
      return res.status(403).json({ erro: 'Sem permissão ativa para este paciente.' });
    }

    const historico = await prisma.insightIA.findMany({
      where: {
        pacienteId,
        profissionalId: payload.id
      },
      orderBy: {
        criadoEm: 'desc'
      },
      take: 20
    });

    return res.status(200).json({
      historico: historico.map((item) => ({
        id: item.id,
        resumoClinico: item.resumoClinico,
        confiancaGeral: item.confiancaGeral,
        status: item.status,
        feedback: item.feedback,
        modelo: item.modelo,
        criadoEm: item.criadoEm
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao obter histórico de insights.' });
  }
};

exports.enviarFeedbackInsight = async (req, res) => {
  try {
    const payload = autenticarProfissional(req, res);
    if (!payload) {
      return;
    }

    const { insightId } = req.params;
    const { status, feedback } = req.body;

    const statusPermitidos = ['REVISADO', 'DESCARTADO', 'GERADO'];
    if (status && !statusPermitidos.includes(status)) {
      return res.status(400).json({ erro: 'status inválido. Use GERADO, REVISADO ou DESCARTADO.' });
    }

    const insight = await prisma.insightIA.findUnique({
      where: { id: insightId }
    });

    if (!insight) {
      return res.status(404).json({ erro: 'Insight não encontrado.' });
    }

    if (insight.profissionalId !== payload.id) {
      return res.status(403).json({ erro: 'Você não pode alterar este insight.' });
    }

    const insightAtualizado = await prisma.insightIA.update({
      where: { id: insightId },
      data: {
        status: status || insight.status,
        feedback: feedback || insight.feedback
      }
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'INSIGHT_IA_FEEDBACK',
        documentoId: insightId,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({
      mensagem: 'Feedback registrado com sucesso.',
      insight: {
        id: insightAtualizado.id,
        status: insightAtualizado.status,
        feedback: insightAtualizado.feedback,
        atualizadoEm: insightAtualizado.atualizadoEm
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao registrar feedback do insight.' });
  }
};
