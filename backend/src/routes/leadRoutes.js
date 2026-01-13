const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');

// Rotas para Leads
router.post('/', [
  authMiddleware,
  body('nome_cliente').isString().notEmpty().withMessage('nome_cliente é obrigatório'),
  body('vendedor_id').optional().isInt().withMessage('vendedor_id deve ser um inteiro'),
  body('status_id').optional().isInt().withMessage('status_id deve ser um inteiro'),
  body('interested_providers').optional().isArray().withMessage('interested_providers deve ser um array')
], validate, leadController.createLead);

router.get('/', authMiddleware, leadController.listLeads);

// ROTA DE ATUALIZAÇÃO: Crucial para aprovar/reprovar
router.patch('/:id/status', [
  authMiddleware,
  param('id').isInt().withMessage('id inválido'),
  body('status').isString().notEmpty().withMessage('status é obrigatório'),
  body('approved_providers').optional().isArray().withMessage('approved_providers deve ser um array')
], validate, leadController.updateStatus);

module.exports = router;