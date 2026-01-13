const db = require('../config/database');

module.exports = async (req, res, next) => {
    // 1. A LISTA VIP (Login e Financeiro PASSAM DIRETO)
    // Se não tiver essa linha do 'financial', a tela de bloqueio não consegue buscar a fatura!
    if (req.path.startsWith('/auth') || req.path.startsWith('/financial')) {
        return next();
    }

    try {
        const result = await db.query("SELECT * FROM app_license LIMIT 1");
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: "ERRO CRÍTICO: Licença não encontrada." });
        }

        const license = result.rows[0];

        // 2. O BLOQUEIO
        if (license.status === 'BLOCKED') {
            return res.status(402).json({ 
                error: "ACESSO SUSPENSO",
                details: "Mensalidade em aberto."
            });
        }

        req.licenseConfig = license.modules_config || {};
        next();

    } catch (err) {
        console.error("Erro licença:", err);
        return res.status(500).json({ error: "Erro de verificação." });
    }
};