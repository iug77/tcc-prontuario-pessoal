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

const temPermissaoAtiva = async (pacienteId, profissionalId) => {
  const permissao = await prisma.permissao.findFirst({
    where: {
      pacienteId,
      profissionalId,
      ativo: true
    },
    orderBy: {
      expiraEm: 'desc'
    }
  });

  if (!permissao) {
    return false;
  }

  if (!permissao.expiraEm) {
    return true;
  }

  return permissao.expiraEm >= new Date();
};

exports.listarContatos = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    if (sessao.tipo === 'paciente') {
      const permissoes = await prisma.permissao.findMany({
        where: {
          pacienteId: sessao.id,
          ativo: true,
          OR: [
            { expiraEm: null },
            { expiraEm: { gte: new Date() } }
          ]
        },
        include: {
          profissional: {
            select: {
              id: true,
              nome: true,
              email: true,
              crm: true,
              especialidade: true
            }
          }
        },
        orderBy: {
          expiraEm: 'asc'
        }
      });

      const contatos = permissoes.map((item) => ({
        id: item.profissional.id,
        nome: item.profissional.nome,
        email: item.profissional.email,
        subtitulo: item.profissional.especialidade || item.profissional.crm || 'Profissional de Saúde',
        tipo: 'profissional'
      }));

      return res.status(200).json({ contatos });
    }

    if (sessao.tipo === 'profissional') {
      const permissoes = await prisma.permissao.findMany({
        where: {
          profissionalId: sessao.id,
          ativo: true,
          OR: [
            { expiraEm: null },
            { expiraEm: { gte: new Date() } }
          ]
        },
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
      });

      const contatos = permissoes.map((item) => ({
        id: item.paciente.id,
        nome: item.paciente.nome,
        email: item.paciente.email,
        subtitulo: 'Paciente',
        tipo: 'paciente'
      }));

      return res.status(200).json({ contatos });
    }

    return res.status(403).json({ erro: 'Tipo de usuário inválido.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao listar contatos do chat.' });
  }
};

exports.listarMensagensContato = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    const { contatoId } = req.params;

    const pacienteId = sessao.tipo === 'paciente' ? sessao.id : contatoId;
    const profissionalId = sessao.tipo === 'profissional' ? sessao.id : contatoId;

    const permitido = await temPermissaoAtiva(pacienteId, profissionalId);
    if (!permitido) {
      return res.status(403).json({ erro: 'Sem permissão ativa para conversar com este contato.' });
    }

    const mensagens = await prisma.mensagem.findMany({
      where: {
        pacienteId,
        profissionalId
      },
      orderBy: {
        criadoEm: 'asc'
      }
    });

    return res.status(200).json({ mensagens });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao listar mensagens.' });
  }
};

exports.enviarMensagem = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    const { contatoId, conteudo } = req.body;

    if (!contatoId || !conteudo || !conteudo.trim()) {
      return res.status(400).json({ erro: 'contatoId e conteudo são obrigatórios.' });
    }

    const pacienteId = sessao.tipo === 'paciente' ? sessao.id : contatoId;
    const profissionalId = sessao.tipo === 'profissional' ? sessao.id : contatoId;

    const permitido = await temPermissaoAtiva(pacienteId, profissionalId);
    if (!permitido) {
      return res.status(403).json({ erro: 'Sem permissão ativa para conversar com este contato.' });
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        pacienteId,
        profissionalId,
        conteudo: conteudo.trim(),
        remetenteTipo: sessao.tipo
      }
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.id,
        acao: 'CHAT_MENSAGEM_ENVIADA',
        documentoId: mensagem.id,
        status: 'Sucesso'
      }
    });

    return res.status(201).json({ mensagem });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao enviar mensagem.' });
  }
};

exports.contarMensagens = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    const ultimoAcessoChat = await prisma.logAuditoria.findFirst({
      where: {
        usuarioId: sessao.id,
        acao: 'CHAT_MENSAGENS_VISUALIZADAS'
      },
      orderBy: {
        data: 'desc'
      },
      select: {
        data: true
      }
    });

    const filtroData = ultimoAcessoChat?.data
      ? { criadoEm: { gt: ultimoAcessoChat.data } }
      : {};

    let totalMensagens = 0;

    if (sessao.tipo === 'paciente') {
      // Contar mensagens enviadas por profissionais para o paciente
      totalMensagens = await prisma.mensagem.count({
        where: {
          pacienteId: sessao.id,
          remetenteTipo: 'profissional',
          ...filtroData
        }
      });
    } else if (sessao.tipo === 'profissional') {
      // Contar mensagens enviadas por pacientes para o profissional
      totalMensagens = await prisma.mensagem.count({
        where: {
          profissionalId: sessao.id,
          remetenteTipo: 'paciente',
          ...filtroData
        }
      });
    }

    return res.status(200).json({ totalMensagens });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao contar mensagens.' });
  }
};

exports.marcarMensagensComoLidas = async (req, res) => {
  try {
    const sessao = obterSessao(req);

    if (!sessao) {
      return res.status(401).json({ erro: 'Token inválido ou não informado.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: sessao.id,
        acao: 'CHAT_MENSAGENS_VISUALIZADAS',
        documentoId: null,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ mensagem: 'Mensagens marcadas como lidas.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao marcar mensagens como lidas.' });
  }
};
