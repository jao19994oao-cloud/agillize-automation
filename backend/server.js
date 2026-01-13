const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Exigir variável de ambiente JWT_SECRET para segurança
if (!process.env.JWT_SECRET) {
    console.error('FATAL: ambiente não configurado: defina JWT_SECRET antes de iniciar a aplicação.');
    process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const licenseMiddleware = require('./src/middlewares/licenseMiddleware'); // Importa o Guarda
const financialRoutes = require('./src/routes/financialRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTAS ---

// 1. Auth (Login) fica FORA do bloqueio para permitir autenticação inicial
app.use('/api/auth', authRoutes);

// 2. Middleware de Licença (Bloqueia tudo daqui para baixo se estiver inadimplente)
app.use('/api', licenseMiddleware);

// 3. Rotas Protegidas pela Licença
app.use('/api/leads', leadRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/financial', financialRoutes); // Adicione isso!

const PORT = process.env.PORT || 3000;

// Error handler (centralizado)
const errorHandler = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// Export app for testing. Start server only when file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Sistema Agillize rodando na porta ${PORT}`);
  });
}

module.exports = app;