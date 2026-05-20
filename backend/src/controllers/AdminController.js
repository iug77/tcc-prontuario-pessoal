const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mantém o mesmo segredo usado hoje em Paciente/Profissional.
// (Ideal: mover para process.env.JWT_SECRET)
const JWT_SECRET = 'segredo_do_tcc_123';

const obterTokenBearer = (authHeader = '') => {
  const [tipo, token] = String(authHeader || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const autenticarAdmin = (req, res) => {
  const token = obterTokenBearer(req.headers.authorization || '');

  if (!token) {
    res.status(401).json({ erro: 'Token não informado.' });
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
    return null;
  }

  if (payload.tipo !== 'admin') {
    res.status(403).json({ erro: 'Acesso permitido apenas para admin.' });
    return null;
  }

  return payload;
};

exports.loginAdmin = async (req, res) => {
  try {
    const { login, senha } = req.body || {};

    const loginEsperado = process.env.ADMIN_LOGIN || 'admin';
    const senhaEsperada = process.env.ADMIN_SENHA || 'admin';

    if (String(login || '').trim() !== loginEsperado || String(senha || '') !== senhaEsperada) {
      return res.status(401).json({ erro: 'Login ou senha inválidos.' });
    }

    const token = jwt.sign(
      { tipo: 'admin', login: loginEsperado },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensagem: 'Login admin realizado com sucesso!',
      token,
      admin: {
        login: loginEsperado
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao fazer login admin.' });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const payload = autenticarAdmin(req, res);
    if (!payload) {
      return;
    }

    const [pacientes, profissionais] = await Promise.all([
      prisma.paciente.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          criadoEm: true,
          ativo: true
        },
        orderBy: {
          criadoEm: 'desc'
        }
      }),
      prisma.profissional.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          crm: true,
          especialidade: true,
          criadoEm: true,
          ativo: true
        },
        orderBy: {
          nome: 'asc'
        }
      })
    ]);

    const itens = [
      ...pacientes.map((p) => ({
        id: p.id,
        tipo: 'paciente',
        nome: p.nome,
        email: p.email,
        status: p.ativo ? 'Ativo' : 'Inativo',
        criadoEm: p.criadoEm
      })),
      ...profissionais.map((p) => ({
        id: p.id,
        tipo: 'profissional',
        nome: p.nome,
        email: p.email,
        status: p.ativo ? 'Ativo' : 'Inativo',
        criadoEm: p.criadoEm,
        crm: p.crm || null,
        especialidade: p.especialidade || null
      }))
    ].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));

    return res.status(200).json({
      usuarios: itens,
      total: itens.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar usuários.' });
  }
};

exports.obterUsuario = async (req, res) => {
  try {
    const payload = autenticarAdmin(req, res);
    if (!payload) {
      return;
    }

    const { tipo, id } = req.params;

    if (!tipo || !id) {
      return res.status(400).json({ erro: 'Parâmetros inválidos.' });
    }

    if (tipo === 'paciente') {
      const paciente = await prisma.paciente.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          criadoEm: true,
          ativo: true,
          _count: {
            select: {
              registros: true,
              permissoes: true,
              mensagens: true,
              insightsIA: true
            }
          }
        }
      });

      if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado.' });
      }

      return res.status(200).json({
        usuario: {
          id: paciente.id,
          tipo: 'paciente',
          nome: paciente.nome,
          email: paciente.email,
          criadoEm: paciente.criadoEm,
          status: paciente.ativo ? 'Ativo' : 'Inativo',
          contagens: paciente._count
        }
      });
    }

    if (tipo === 'profissional') {
      const profissional = await prisma.profissional.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          crm: true,
          especialidade: true,
          criadoEm: true,
          ativo: true,
          _count: {
            select: {
              permissoesRecebidas: true,
              mensagens: true,
              insightsGerados: true
            }
          }
        }
      });

      if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' });
      }

      return res.status(200).json({
        usuario: {
          id: profissional.id,
          tipo: 'profissional',
          nome: profissional.nome,
          email: profissional.email,
          criadoEm: profissional.criadoEm,
          status: profissional.ativo ? 'Ativo' : 'Inativo',
          crm: profissional.crm,
          especialidade: profissional.especialidade,
          contagens: profissional._count
        }
      });
    }

    return res.status(400).json({ erro: 'Tipo inválido. Use "paciente" ou "profissional".' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao obter usuário.' });
  }
};

exports.atualizarStatusUsuario = async (req, res) => {
  try {
    const payload = autenticarAdmin(req, res);
    if (!payload) {
      return;
    }

    const { tipo, id } = req.params;
    const { ativo } = req.body || {};

    if (!tipo || !id) {
      return res.status(400).json({ erro: 'Parâmetros inválidos.' });
    }

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ erro: 'Informe "ativo" como boolean.' });
    }

    if (tipo === 'paciente') {
      const atualizado = await prisma.paciente.update({
        where: { id },
        data: { ativo },
        select: { id: true, ativo: true }
      });

      return res.status(200).json({
        mensagem: 'Status atualizado com sucesso.',
        usuario: {
          id: atualizado.id,
          tipo: 'paciente',
          status: atualizado.ativo ? 'Ativo' : 'Inativo'
        }
      });
    }

    if (tipo === 'profissional') {
      const atualizado = await prisma.profissional.update({
        where: { id },
        data: { ativo },
        select: { id: true, ativo: true }
      });

      return res.status(200).json({
        mensagem: 'Status atualizado com sucesso.',
        usuario: {
          id: atualizado.id,
          tipo: 'profissional',
          status: atualizado.ativo ? 'Ativo' : 'Inativo'
        }
      });
    }

    return res.status(400).json({ erro: 'Tipo inválido. Use "paciente" ou "profissional".' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao atualizar status.' });
  }
};
