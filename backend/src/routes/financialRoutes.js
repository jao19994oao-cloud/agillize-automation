const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas protegidas (Usuario logado)
router.get('/invoices', authMiddleware, financialController.listInvoices);
router.post('/generate-pix/:id', authMiddleware, financialController.generatePix); // Mudou o nome

// Rota PÚBLICA (O Asaas não tem login do seu sistema, ele chama de fora)
// Importante: No futuro, validar um header de segurança que o Asaas manda
router.post('/webhook/asaas', financialController.handleWebhook);

module.exports = router;