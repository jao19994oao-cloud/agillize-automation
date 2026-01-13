const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middlewares/authMiddleware');
const providerController = require('../controllers/providerController'); // <--- ADICIONE ESTA LINHA
const validate = require('../middlewares/validationMiddleware');

router.get('/', authMiddleware, saleController.listSales);
router.get('/groups', authMiddleware, saleController.listGroups); // Nova rota de grupos
router.get('/products', authMiddleware, saleController.listProducts);

router.post('/convert', [
  authMiddleware,
  body('lead_id').isInt().withMessage('lead_id é obrigatório e deve ser inteiro'),
  body('provider_id').isInt().withMessage('provider_id é obrigatório e deve ser inteiro'),
  body('items').isArray({ min: 1 }).withMessage('items deve ser um array não-vazio'),
  body('items.*.product_id').isInt().withMessage('product_id deve ser inteiro'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity deve ser inteiro >= 1')
], validate, saleController.convertToSale);

router.get('/providers', authMiddleware, providerController.listProviders);
router.get('/products/:providerId', [authMiddleware, param('providerId').isInt().withMessage('providerId inválido')], validate, saleController.listProductsByProvider);

module.exports = router;