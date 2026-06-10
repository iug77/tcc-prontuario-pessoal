const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/PacienteController');
const ProfissionalController = require('../controllers/ProfissionalController');
const ChatController = require('../controllers/ChatController');
const AuditoriaController = require('../controllers/AuditoriaController');
const InsightsIAController = require('../controllers/InsightsIAController');
const TendenciasController = require('../controllers/TendenciasController');

// Define que quando houver um POST em /pacientes, ele chama a função de cadastro
router.post('/pacientes', PacienteController.cadastrarPaciente);

// Nova Rota de Login
router.post('/pacientes/login', PacienteController.loginPaciente);
router.get('/pacientes/dashboard', PacienteController.dashboardPaciente);
router.get('/pacientes/prontuario/exportar', PacienteController.exportarProntuario);
router.get('/pacientes/alertas', PacienteController.obterAlertas);
router.get('/pacientes/notificacoes', PacienteController.listarNotificacoes);
router.post('/pacientes/registros', PacienteController.criarRegistro);
router.post('/pacientes/registros/:registroId/insight/gerar', PacienteController.gerarInsightRegistroPaciente);
router.get('/pacientes/registros', PacienteController.listarRegistrosPaciente);
router.get('/pacientes/registros/:registroId', PacienteController.obterRegistroPaciente);
router.put('/pacientes/registros/:registroId', PacienteController.atualizarRegistro);
router.delete('/pacientes/registros/:registroId', PacienteController.deletarRegistro);
router.post('/pacientes/permissoes', PacienteController.concederPermissaoPaciente);
router.get('/pacientes/permissoes', PacienteController.listarPermissoesPaciente);
router.delete('/pacientes/permissoes/:permissaoId', PacienteController.revogarPermissaoPaciente);

// Rotas de Perfil (estáticas antes das dinâmicas)
router.get('/pacientes/perfil', PacienteController.obterPerfilPaciente);
router.put('/pacientes/perfil', PacienteController.atualizarPerfilPaciente);
router.get('/pacientes/:id/perfil', PacienteController.obterPerfilPacienteParaProfissional);

// Rotas de cadastro e login para profissional de saude
router.post('/profissionais', ProfissionalController.cadastrarProfissional);
router.post('/profissionais/login', ProfissionalController.loginProfissional);
router.get('/profissionais/dashboard', ProfissionalController.dashboardProfissional);
router.get('/profissionais/pareceres/pendentes', ProfissionalController.listarParecesPendentes);
router.get('/profissionais/pacientes/alertas', ProfissionalController.listarPacientesComAlertas);
router.get('/profissionais/perfil', ProfissionalController.obterPerfilProfissional);
router.put('/profissionais/perfil', ProfissionalController.atualizarPerfilProfissional);
router.get('/profissionais/:id/perfil', ProfissionalController.obterPerfilPublicoProfissional);
router.get('/profissionais/registros/:pacienteId', ProfissionalController.listarRegistrosPaciente);
router.get('/profissionais/registros/:pacienteId/:registroId', ProfissionalController.obterRegistro);
router.get('/profissionais/registros/:pacienteId/:registroId/insight', ProfissionalController.obterInsightRegistro);
router.post('/profissionais/registros/:pacienteId/:registroId/insight/gerar', ProfissionalController.gerarInsightRegistro);

// Parecer Médico Contextualizado (profissional)
router.put('/registros/:id/parecer', ProfissionalController.atualizarParecerRegistro);

// Rotas de chat
router.get('/chat/contatos', ChatController.listarContatos);
router.get('/chat/mensagens/:contatoId', ChatController.listarMensagensContato);
router.post('/chat/mensagens', ChatController.enviarMensagem);
router.get('/chat/contar', ChatController.contarMensagens);
router.post('/chat/marcar-lidas', ChatController.marcarMensagensComoLidas);

// Rota de auditoria (paciente ou profissional)
router.get('/auditoria', AuditoriaController.listarAuditoria);

// Tendências clínicas (paciente)
router.get('/pacientes/tendencias', TendenciasController.obterTendencias);

// Rotas de IA e Insights
router.get('/ai/insights/:pacienteId', InsightsIAController.obterInsightsAtuais);
router.get('/ai/insights/:pacienteId/historico', InsightsIAController.obterHistoricoInsights);
router.post('/ai/insights/gerar/:pacienteId', InsightsIAController.gerarInsights);
router.post('/ai/insights/:insightId/feedback', InsightsIAController.enviarFeedbackInsight);

module.exports = router;