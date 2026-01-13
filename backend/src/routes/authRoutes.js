const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validationMiddleware');

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isString().notEmpty().withMessage('Senha é obrigatória')
], validate, authController.login);

module.exports = router;