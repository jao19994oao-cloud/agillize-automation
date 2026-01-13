const db = require('../config/database');

exports.listLeads = async (req, res) => {
    const { id: userId, permissions } = req.user;
    try {
        let query;
        let params = [];
        if (permissions?.all === true || permissions?.view_all_leads === true) {
            query = `
                SELECT l.*, s.name as status_name, u.name as nome_vendedor
                FROM leads l
                LEFT JOIN status_types s ON l.status_id = s.id
                LEFT JOIN users u ON l.vendedor_id = u.id
                ORDER BY l.created_at DESC`;
        } else {
            query = `
                SELECT l.*, s.name as status_name, u.name as nome_vendedor
                FROM leads l
                LEFT JOIN status_types s ON l.status_id = s.id
                LEFT JOIN users u ON l.vendedor_id = u.id
                WHERE l.vendedor_id = $1
                ORDER BY l.created_at DESC`;
            params = [userId];
        }
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar leads:", err);
        res.status(500).json({ error: "Erro interno ao buscar leads" });
    }
};

exports.createLead = async (req, res) => {
    // CORREÇÃO: Recebendo os campos corretos da Análise de Crédito
    const { documento, nome_cliente, endereco, nascimento, nome_mae, observacoes, vendedor_id, status_id, interested_providers } = req.body;
    
    // Converter array de interesse para JSON (evita erro se vier nulo)
    const providersJson = JSON.stringify(interested_providers || []);

    try {
        const query = `
            INSERT INTO leads (documento, nome_cliente, endereco, nascimento, nome_mae, observacoes, vendedor_id, status_id, interested_providers)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
        
        const values = [documento, nome_cliente, endereco, nascimento, nome_mae, observacoes, vendedor_id, status_id, providersJson];
        
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao criar lead:", err.message); // Log detalhado do erro SQL
        res.status(500).json({ error: "Erro ao salvar lead no banco: " + err.message });
    }
};

exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, observacoes_admin, approved_providers } = req.body;

    try {
        const statusRes = await db.query("SELECT id FROM status_types WHERE name = $1 LIMIT 1", [status]);
        
        if (statusRes.rows.length === 0) {
            return res.status(400).json({ error: "Status não encontrado no banco de dados" });
        }

        const status_id = statusRes.rows[0].id;
        const approvedJson = approved_providers ? JSON.stringify(approved_providers) : '[]';

        const result = await db.query(
            "UPDATE leads SET status_id = $1, observacoes = $2, approved_providers = $3 WHERE id = $4 RETURNING *",
            [status_id, observacoes_admin, approvedJson, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Lead não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar status:", err);
        res.status(500).json({ error: "Erro ao atualizar lead" });
    }
};