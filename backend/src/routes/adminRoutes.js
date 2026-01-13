const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middlewares/authMiddleware');
const providerController = require('../controllers/providerController'); // Adicione este import
const companySettingsController = require('../controllers/companySettingsController'); // <--- Importe novo

const adminOnly = (req, res, next) => {
    if (req.user && req.user.permissions && req.user.permissions.all === true) return next();
    return res.status(403).json({ error: "Acesso negado" });
};

router.use(authMiddleware, adminOnly);

// Usuários
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Cargos
router.get('/roles', adminController.listRoles);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// Gestão de Provedores
router.get('/providers', providerController.listProviders);
router.post('/providers', providerController.createProvider);
router.put('/providers/:id', providerController.updateProvider);
router.delete('/providers/:id', providerController.deleteProvider);

// Produtos
router.get('/products', adminController.listAdminProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Grupos de Produtos
router.get('/groups', saleController.listGroups);
router.post('/groups', adminController.createGroup);
router.put('/groups/:id', adminController.updateGroup);
router.delete('/groups/:id', adminController.deleteGroup);


//Company

router.get('/company-settings', companySettingsController.getCompanySettings);
router.post('/company-settings', companySettingsController.saveCompanySettings);

// Permissões do Sistema
router.get('/permissions-list', adminController.listSystemPermissions);

module.exports = router;