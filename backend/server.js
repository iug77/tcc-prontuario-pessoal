const express = require('express');
const cors = require('cors');
const pacienteRoutes = require('./src/routes/pacienteRoutes'); // Importa as rotas de paciente

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

// Rota de teste simples para ver se o servidor está online
app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'Servidor do Prontuário Pessoal rodando perfeitamente!' });
});

// Conectando as rotas de paciente na nossa API principal
app.use('/api', pacienteRoutes); 

// Definindo a porta em que o servidor vai rodar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV || 'development'}`);
});