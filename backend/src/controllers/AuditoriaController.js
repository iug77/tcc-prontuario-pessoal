const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

const obterSessao = (req) => {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      id: payload.id,
      tipo: payload.tipo
    };
  } catch {
    return null;
  }
};

exports.listarAuditoria = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    let logs;

    if (sessao.tipo === 'paciente') {
      // Paciente vê todos os logs relacionados a seus dados
      // 1. Seus próprios logs
      // 2. Logs de profissionais acessando seus registros/permissões
      logs = await prisma.logAuditoria.findMany({
        where: {
          OR: [
            { usuarioId: sessao.id }, // Ações do próprio paciente
            {
              acao: {
                in: ['REGISTRO_VISUALIZADO', 'DASHBOARD_PROFISSIONAL_VISUALIZADO', 'PERMISSAO_CONCEDIDA', 'PERMISSAO_REVOGADA', 'PERMISSAO_EXPIRAÇÃO_PROXIMAMENTE']
              }
            }
          ]
        },
        orderBy: { data: 'desc' },
        take: 100
      });
    } else if (sessao.tipo === 'profissional') {
      // Profissional vê:
      // 1. Seus próprios logs
      // 2. Logs de pacientes que têm permissão ativa dele
      const permissoesCom = await prisma.permissao.findMany({
        where: {
          profissionalId: sessao.id,
          ativo: true
        },
        select: { pacienteId: true }
      });

      const pacienteIds = permissoesCom.map((p) => p.pacienteId);

      logs = await prisma.logAuditoria.findMany({
        where: {
          OR: [
            { usuarioId: sessao.id }, // Ações do próprio profissional
            { usuarioId: { in: pacienteIds } } // Ações de pacientes que ele tem permissão
          ]
        },
        orderBy: { data: 'desc' },
        take: 100
      });
    } else {
      return res.status(403).json({ erro: 'Tipo de usuário inválido.' });
    }

    const usuarioIds = [...new Set(logs.map((log) => log.usuarioId))];

    const [pacientes, profissionais] = await Promise.all([
      prisma.paciente.findMany({
        where: { id: { in: usuarioIds } },
        select: { id: true, nome: true }
      }),
      prisma.profissional.findMany({
        where: { id: { in: usuarioIds } },
        select: { id: true, nome: true, especialidade: true }
      })
    ]);

    const pacientesMap = new Map(pacientes.map((item) => [item.id, item]));
    const profissionaisMap = new Map(profissionais.map((item) => [item.id, item]));

    const logsFormatados = logs.map((log) => {
      const paciente = pacientesMap.get(log.usuarioId);
      const profissional = profissionaisMap.get(log.usuarioId);

      let usuario = 'Sistema';
      if (profissional) {
        usuario = `${profissional.nome}${profissional.especialidade ? ` (${profissional.especialidade})` : ' (Profissional)'}`;
      } else if (paciente) {
        usuario = `${paciente.nome} (Paciente)`;
      }

      return {
        id: log.id,
        data: log.data,
        usuario,
        usuarioId: log.usuarioId,
        acao: log.acao,
        documento: log.documentoId,
        status: log.status
      };
    });

    return res.status(200).json({ logs: logsFormatados });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao carregar auditoria.' });
  }
};
