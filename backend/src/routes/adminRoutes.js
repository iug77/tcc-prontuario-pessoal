const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/AdminController');

router.post('/login', AdminController.loginAdmin);
router.get('/usuarios', AdminController.listarUsuarios);
router.get('/usuarios/:tipo/:id', AdminController.obterUsuario);

module.exports = router;
