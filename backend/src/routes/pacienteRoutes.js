const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/PacienteController');
const ProfissionalController = require('../controllers/ProfissionalController');
const ChatController = require('../controllers/ChatController');
const AuditoriaController = require('../controllers/AuditoriaController');
const InsightsIAController = require('../controllers/InsightsIAController');

// Define que quando houver um POST em /pacientes, ele chama a função de cadastro
router.post('/pacientes', PacienteController.cadastrarPaciente);

// Nova Rota de Login
router.post('/pacientes/login', PacienteController.loginPaciente);
router.get('/pacientes/dashboard', PacienteController.dashboardPaciente);
router.post('/pacientes/registros', PacienteController.criarRegistro);
router.get('/pacientes/registros', PacienteController.listarRegistrosPaciente);
router.get('/pacientes/registros/:registroId', PacienteController.obterRegistroPaciente);
router.post('/pacientes/permissoes', PacienteController.concederPermissaoPaciente);
router.get('/pacientes/permissoes', PacienteController.listarPermissoesPaciente);
router.delete('/pacientes/permissoes/:permissaoId', PacienteController.revogarPermissaoPaciente);

// Rotas de cadastro e login para profissional de saude
router.post('/profissionais', ProfissionalController.cadastrarProfissional);
router.post('/profissionais/login', ProfissionalController.loginProfissional);
router.get('/profissionais/dashboard', ProfissionalController.dashboardProfissional);
router.get('/profissionais/registros/:pacienteId', ProfissionalController.listarRegistrosPaciente);
router.get('/profissionais/registros/:pacienteId/:registroId', ProfissionalController.obterRegistro);
router.get('/profissionais/registros/:pacienteId/:registroId/insight', ProfissionalController.obterInsightRegistro);
router.post('/profissionais/registros/:pacienteId/:registroId/insight/gerar', ProfissionalController.gerarInsightRegistro);

// Rotas de chat
router.get('/chat/contatos', ChatController.listarContatos);
router.get('/chat/mensagens/:contatoId', ChatController.listarMensagensContato);
router.post('/chat/mensagens', ChatController.enviarMensagem);
router.get('/chat/contar', ChatController.contarMensagens);
router.post('/chat/marcar-lidas', ChatController.marcarMensagensComoLidas);

// Rota de auditoria (paciente ou profissional)
router.get('/auditoria', AuditoriaController.listarAuditoria);

// Rotas de IA e Insights
router.get('/ai/insights/:pacienteId', InsightsIAController.obterInsightsAtuais);
router.get('/ai/insights/:pacienteId/historico', InsightsIAController.obterHistoricoInsights);
router.post('/ai/insights/gerar/:pacienteId', InsightsIAController.gerarInsights);
router.post('/ai/insights/:insightId/feedback', InsightsIAController.enviarFeedbackInsight);

module.exports = router;