const db = require('../config/database');

exports.listParameters = async (req, res) => {
    try {
        // Agora buscamos da tabela de licença, não de system_parameters
        const result = await db.query("SELECT modules_config FROM app_license LIMIT 1");
        
        if (result.rows.length === 0) return res.json([]);

        const config = result.rows[0].modules_config || {};
        
        // Mapeia para o formato que o frontend espera: [{ param_key: '...', param_value: '...' }]
        const formattedParams = [
            { 
                param_key: 'biometry_module', 
                param_value: config.biometry ? 'true' : 'false',
                description: 'Módulo Biometria (Gerenciado pela Licença)'
            }
        ];

        res.json(formattedParams);
    } catch (err) { res.status(500).json({ error: "Erro ao listar configurações" }); }
};

exports.updateParameter = async (req, res) => {
    // Como agora é gerenciado externamente, bloqueamos a edição local
    res.status(403).json({ error: "Esta configuração é gerenciada pela sua licença Master e não pode ser alterada localmente." });
};