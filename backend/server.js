require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const pacienteRoutes = require('./src/routes/pacienteRoutes'); // Importa as rotas de paciente
const adminRoutes = require('./src/routes/adminRoutes');

const prisma = new PrismaClient();
const JWT_SECRET = 'segredo_do_tcc_123';

const obterTokenBearer = (authHeader = '') => {
  const [tipo, token] = String(authHeader || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const app = express();

// Configurar CORS para produção e desenvolvimento
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://seu-projeto.vercel.app'
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares básicos (Segurança e formato de dados)
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Permite payload maior para upload base64

// Métrica simples em memória (desde o start do processo)
app.locals.apiRequestCount = 0;
app.locals.serverStartedAt = Date.now();
app.use((req, res, next) => {
  const caminho = String(req.path || '');
  if (caminho.startsWith('/api')) {
    req.app.locals.apiRequestCount = (req.app.locals.apiRequestCount || 0) + 1;
  }

  next();
});

// Garantir UTF-8 em todas as respostas
app.use((req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rota de teste simples para ver se o servidor está online
app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'Servidor do Prontuário Pessoal rodando perfeitamente!' });
});

// Bloqueia o uso de token para contas desativadas (vale para todas as rotas /api)
app.use('/api', async (req, res, next) => {
  const caminho = req.path || '';

  // Rotas públicas
  const rotasPublicas = new Set([
    '/status',
    '/pacientes',
    '/pacientes/login',
    '/profissionais',
    '/profissionais/login',
    '/admin/login'
  ]);

  if (rotasPublicas.has(caminho)) {
    return next();
  }

  const token = obterTokenBearer(req.headers.authorization || '');
  if (!token) {
    return next();
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    // Token inválido: deixa o controller responder corretamente
    return next();
  }

  if (payload?.tipo === 'admin') {
    return next();
  }

  try {
    if (payload?.tipo === 'paciente' && payload?.id) {
      const paciente = await prisma.paciente.findUnique({
        where: { id: payload.id },
        select: { ativo: true }
      });

      if (!paciente?.ativo) {
        return res.status(403).json({ erro: 'Conta desativada. Contate o administrador.' });
      }
    }

    if (payload?.tipo === 'profissional' && payload?.id) {
      const profissional = await prisma.profissional.findUnique({
        where: { id: payload.id },
        select: { ativo: true, crmValidado: true }
      });

      if (!profissional?.ativo) {
        return res.status(403).json({ erro: 'Conta desativada. Contate o administrador.' });
      }

      if (profissional?.crmValidado === false) {
        return res.status(403).json({ erro: 'Conta pendente de validação de CRM. Contate o administrador.' });
      }
    }
  } catch {
    // Se der erro no DB, não bloqueia aqui; deixa o controller tratar.
  }

  return next();
});

// Conectando as rotas de paciente na nossa API principal
app.use('/api', pacienteRoutes); 

// Rotas de admin
app.use('/api/admin', adminRoutes);

// Definindo a porta em que o servidor vai rodar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV || 'development'}`);
});