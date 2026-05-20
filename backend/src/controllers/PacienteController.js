const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

const obterTokenBearer = (authHeader = '') => {
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const normalizarNivelAcesso = (valor = '') => {
  const nivel = valor.trim().toLowerCase();

  if (nivel === 'apenas leitura' || nivel === 'leitura') {
    return 'Apenas Leitura';
  }

  if (nivel === 'leitura e escrita' || nivel === 'escrita') {
    return 'Leitura e Escrita';
  }

  return null;
};

const autenticarPaciente = (req, res) => {
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

  if (payload.tipo !== 'paciente') {
    res.status(403).json({ erro: 'Acesso permitido apenas para pacientes.' });
    return null;
  }

  return payload;
};

exports.cadastrarPaciente = async (req, res) => {
  try {
    // 1. Pega os dados que vieram do Frontend (Tela de Login/Cadastro)
    const { nome, email, senha } = req.body;

    // 2. Verifica se o paciente já existe no banco
    const pacienteExiste = await prisma.paciente.findUnique({
      where: { email }
    });

    if (pacienteExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // 3. Criptografa a senha (Gera um "hash" seguro)
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 4. Salva no banco de dados usando o Prisma
    const novoPaciente = await prisma.paciente.create({
      data: {
        nome,
        email,
        senha: senhaHash
      }
    });

    // 5. Devolve a resposta de sucesso (sem enviar a senha de volta, por segurança)
    return res.status(201).json({
      mensagem: 'Paciente cadastrado com sucesso!',
      paciente: {
        id: novoPaciente.id,
        nome: novoPaciente.nome,
        email: novoPaciente.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao cadastrar paciente.' });
  }
};

exports.loginPaciente = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // 1. Verifica se o paciente existe no banco de dados
    const paciente = await prisma.paciente.findUnique({
      where: { email }
    });

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }

    if (paciente.ativo === false) {
      return res.status(403).json({ erro: 'Conta desativada. Contate o administrador.' });
    }

    // 2. Compara a senha digitada com a senha criptografada do banco
    const senhaValida = await bcrypt.compare(senha, paciente.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // 3. Gera o Token JWT (O "Crachá" de acesso)
    // Nota: Em um projeto real de produção, o "segredo_do_tcc" ficaria no arquivo .env
    const token = jwt.sign(
      { id: paciente.id, tipo: 'paciente' }, 
      JWT_SECRET, 
      { expiresIn: '1d' } // Token expira em 1 dia
    );

    // 4. Devolve o token e os dados do usuário (nunca devolva a senha!)
    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token: token,
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        email: paciente.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao fazer login.' });
  }
};

exports.dashboardPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        nome: true,
        email: true,
        registros: {
          select: {
            id: true,
            tipo: true,
            data: true,
            orgao: true,
            arquivoUrl: true
          },
          orderBy: {
            data: 'desc'
          },
          take: 10
        },
        permissoes: {
          where: {
            ativo: true
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'DASHBOARD_PACIENTE_VISUALIZADO',
        documentoId: paciente.id,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        email: paciente.email
      },
      totalPermissoesAtivas: paciente.permissoes.length,
      registros: paciente.registros
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao carregar dashboard do paciente.' });
  }
};
exports.concederPermissaoPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const { profissionalId, profissionalEmail, nivelAcesso, expiraEm } = req.body;

    if ((!profissionalId && !profissionalEmail) || !nivelAcesso) {
      return res.status(400).json({ erro: 'Informe profissionalId ou profissionalEmail, e também nivelAcesso.' });
    }

    const nivelAcessoNormalizado = normalizarNivelAcesso(nivelAcesso);

    if (!nivelAcessoNormalizado) {
      return res.status(400).json({ erro: 'nivelAcesso inválido. Use "Apenas Leitura" ou "Leitura e Escrita".' });
    }

    let dataExpiracao = null;
    if (expiraEm) {
      dataExpiracao = new Date(expiraEm);

      if (Number.isNaN(dataExpiracao.getTime())) {
        return res.status(400).json({ erro: 'expiraEm inválido. Envie uma data válida em ISO (YYYY-MM-DDTHH:mm:ss.sssZ).' });
      }
    }

    const profissional = await prisma.profissional.findFirst({
      where: profissionalId ? { id: profissionalId } : { email: profissionalEmail },
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        especialidade: true
      }
    });

    if (!profissional) {
      return res.status(404).json({ erro: 'Profissional não encontrado.' });
    }

    await prisma.permissao.updateMany({
      where: {
        pacienteId: payload.id,
        profissionalId: profissional.id,
        ativo: true
      },
      data: {
        ativo: false
      }
    });

    const permissao = await prisma.permissao.create({
      data: {
        pacienteId: payload.id,
        profissionalId: profissional.id,
        nivelAcesso: nivelAcessoNormalizado,
        expiraEm: dataExpiracao,
        ativo: true
      }
    });

    return res.status(200).json({
      mensagem: 'Permissão concedida com sucesso.',
      permissao: {
        id: permissao.id,
        pacienteId: permissao.pacienteId,
        profissionalId: permissao.profissionalId,
        profissional,
        nivelAcesso: permissao.nivelAcesso,
        expiraEm: permissao.expiraEm,
        ativo: permissao.ativo
      },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'PERMISSAO_CONCEDIDA',
        documentoId: permissao.id,
        status: 'Sucesso'
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao conceder permissão.' });
  }
};

exports.listarPermissoesPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const agora = new Date();
    const permissoes = await prisma.permissao.findMany({
      where: {
        pacienteId: payload.id
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

    const itens = permissoes.map((permissao) => {
      const expirou = permissao.expiraEm ? permissao.expiraEm < agora : false;
      const status = permissao.ativo && !expirou ? 'Ativo' : 'Inativo';

      return {
        id: permissao.id,
        nivelAcesso: permissao.nivelAcesso,
        expiraEm: permissao.expiraEm,
        ativo: permissao.ativo,
        status,
        profissional: permissao.profissional
      };
    });

    return res.status(200).json({ permissoes: itens });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar permissões.' });
  }
};

exports.revogarPermissaoPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const { permissaoId } = req.params;

    const permissao = await prisma.permissao.findFirst({
      where: {
        id: permissaoId,
        pacienteId: payload.id
      }
    });

    if (!permissao) {
      return res.status(404).json({ erro: 'Permissão não encontrada.' });
    }

    await prisma.permissao.update({
      where: { id: permissaoId },
      data: { ativo: false }
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'PERMISSAO_REVOGADA',
        documentoId: permissaoId,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ mensagem: 'Permissão revogada com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao revogar permissão.' });
  }
};

exports.criarRegistro = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const { tipo, data, orgao, descricaoClinica, arquivoBase64, nomeArquivo, mimeType } = req.body;
  const mimePermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const mimeArquivo = mimePermitidos.includes(mimeType) ? mimeType : 'application/octet-stream';
  const nomeArquivoSeguro = (nomeArquivo || 'documento').replace(/[^a-zA-Z0-9._-]/g, '_');


    // Validar campos obrigatórios
    if (!tipo) {
      return res.status(400).json({ erro: 'Tipo de registro é obrigatório.' });
    }

    if (!data) {
      return res.status(400).json({ erro: 'Data do registro é obrigatória.' });
    }

    if (descricaoClinica && descricaoClinica.length > 8000) {
      return res.status(400).json({ erro: 'Resumo clínico muito longo. Limite de 8000 caracteres.' });
    }

    // Validar tipo de registro
    const tiposValidos = ['exame', 'receita', 'medicamento', 'alergia', 'doenca', 'cirurgia'];
    if (!tiposValidos.includes(tipo.toLowerCase())) {
      return res.status(400).json({ erro: 'Tipo de registro inválido.' });
    }

    // Validar tamanho do arquivo (máximo 5MB em base64)
    if (arquivoBase64) {
      const tamanhoMB = Buffer.byteLength(arquivoBase64, 'utf8') / (1024 * 1024);
      if (tamanhoMB > 5) {
        return res.status(400).json({ erro: 'Arquivo excede o tamanho máximo de 5MB.' });
      }
    }

    // Criar o registro
    const novoRegistro = await prisma.registro.create({
      data: {
        tipo: tipo.toLowerCase(),
        data: new Date(data),
        orgao: orgao || null,
        descricaoClinica: descricaoClinica || null,
        arquivoUrl: arquivoBase64
          ? `data:${mimeArquivo};name=${encodeURIComponent(nomeArquivoSeguro)};base64,${arquivoBase64}`
          : null,
        pacienteId: payload.id
      }
    });

    // Criar log de auditoria
    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'REGISTRO_CRIADO',
        documentoId: novoRegistro.id,
        status: 'Sucesso'
      }
    });

    return res.status(201).json({
      mensagem: 'Registro criado com sucesso.',
      registro: novoRegistro
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao criar registro.' });
  }
};

exports.listarRegistrosPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const registros = await prisma.registro.findMany({
      where: { pacienteId: payload.id },
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

exports.obterRegistroPaciente = async (req, res) => {
  try {
    const payload = autenticarPaciente(req, res);
    if (!payload) {
      return;
    }

    const { registroId } = req.params;

    const registro = await prisma.registro.findFirst({
      where: {
        id: registroId,
        pacienteId: payload.id
      }
    });

    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        acao: 'REGISTRO_VISUALIZADO_PACIENTE',
        documentoId: registro.id,
        status: 'Sucesso'
      }
    });

    return res.status(200).json({ registro });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao obter registro.' });
  }
};