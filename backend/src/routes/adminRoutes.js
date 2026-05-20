const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/AdminController');

router.post('/login', AdminController.loginAdmin);
router.get('/usuarios', AdminController.listarUsuarios);
router.get('/usuarios/:tipo/:id', AdminController.obterUsuario);
router.patch('/usuarios/:tipo/:id/status', AdminController.atualizarStatusUsuario);
router.patch('/profissionais/:id/aprovar', AdminController.aprovarProfissional);
router.get('/auditoria', AdminController.listarAuditoriaGlobal);
router.get('/infra', AdminController.obterInfra);

module.exports = router;
