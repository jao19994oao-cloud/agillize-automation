const db = require('../config/database');
const crypto = require('crypto');

// ... (Funções listSales, listGroups, listProducts, listProductsByProvider continuam IGUAIS) ...
// (Estou omitindo elas aqui para economizar espaço, mantenha como estava)
// Copie as funções de listagem do arquivo anterior, altere APENAS o convertToSale abaixo:

// 1. LISTAR VENDAS
exports.listSales = async (req, res) => {
    const { id: userId, permissions } = req.user;
    try {
        let query;
        let params = [];
        const baseQuery = `
            SELECT 
                s.*, 
                u.name as nome_vendedor, 
                pv.name as nome_provedor,
                l.nome_cliente, 
                l.documento
            FROM sales s
            LEFT JOIN users u ON s.vendedor_id = u.id
            LEFT JOIN providers pv ON s.provider_id = pv.id
            LEFT JOIN leads l ON s.lead_id = l.id
        `;

        if (permissions?.all === true || permissions?.view_sales === true) {
            query = `${baseQuery} ORDER BY s.data_venda DESC`;
        } else {
            query = `${baseQuery} WHERE s.vendedor_id = $1 ORDER BY s.data_venda DESC`;
            params = [userId];
        }
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro lista vendas:", err);
        res.status(500).json({ error: "Erro interno" });
    }
};

exports.listGroups = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM categories WHERE active = true ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Erro ao buscar grupos" }); }
};

exports.listProducts = async (req, res) => {
    try {
        const result = await db.query(`SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.active = true AND c.active = true ORDER BY p.name ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Erro ao buscar produtos" }); }
};

exports.listProductsByProvider = async (req, res) => {
    const { providerId } = req.params;
    try {
        const result = await db.query(`SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.provider_id = $1 AND p.active = true ORDER BY p.name ASC`, [providerId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Erro produtos provedor" }); }
};

// --- FUNÇÃO ATUALIZADA ---
exports.convertToSale = async (req, res) => {
    const { lead_id, provider_id, items, nascimento, contato, email, observacoes } = req.body;
    const vendedor_id = req.user.id;

    if (!provider_id) return res.status(400).json({ error: "Provedor obrigatório" });

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. CHECAGEM GLOBAL (Vem da Licença via Middleware)
        // O middleware já injetou a config da licença na requisição
        const globalBiometryActive = req.licenseConfig && req.licenseConfig.biometry === true;

        // 2. CHECAGEM LOCAL: Provedor exige biometria?
        const provRes = await client.query('SELECT commission_resale, commission_seller, uses_biometry FROM providers WHERE id = $1', [provider_id]);
        if (provRes.rows.length === 0) throw new Error("Provedor inválido");
        const { commission_resale, commission_seller, uses_biometry } = provRes.rows[0];

        // 3. REGRA FINAL: Só pede se Licença Global permite **E** Provedor exige
        const requireBiometry = globalBiometryActive && uses_biometry;

        // Define Status Inicial
        let initialStatusName = 'EM_ANALISE'; 
        let biometryToken = null;

        if (requireBiometry) {
            initialStatusName = 'AGUARDANDO_BIOMETRIA';
            biometryToken = crypto.randomBytes(32).toString('hex');
        }

        // Busca ID do Status
        const statusRes = await client.query("SELECT id FROM status_types WHERE name = $1 LIMIT 1", [initialStatusName]);
        if (statusRes.rows.length === 0) throw new Error(`Status ${initialStatusName} não configurado`); // Segurança contra banco desatualizado
        const statusId = statusRes.rows[0].id;

        // Atualiza Lead
        await client.query(`UPDATE leads SET status_id = (SELECT id FROM status_types WHERE name = 'CONCLUIDO' LIMIT 1) WHERE id = $1`, [lead_id]);

        // Cria Venda
        const saleResult = await client.query(`
            INSERT INTO sales (
                lead_id, vendedor_id, provider_id, status_id, biometry_token,
                applied_commission_resale, applied_commission_seller, 
                nascimento, contato, email, observacoes, data_venda
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
            RETURNING id`,
            [
                lead_id, vendedor_id, provider_id, statusId, biometryToken,
                commission_resale, commission_seller, 
                nascimento, contato, email, observacoes
            ]
        );

        const saleId = saleResult.rows[0].id;

        // Insere Itens
        if (items && items.length > 0) {
            for (const item of items) {
                const prodRes = await client.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
                const price = prodRes.rows[0]?.price || 0;

                await client.query(`
                    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
                    VALUES ($1, $2, $3, $4)`,
                    [saleId, item.product_id, item.quantity, price]
                );
            }
        }

        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: "Venda realizada!", 
            saleId, 
            status: initialStatusName,
            biometryLink: biometryToken ? `http://localhost:5173/biometria/${biometryToken}` : null 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro venda:", err);
        res.status(500).json({ error: "Erro ao processar venda: " + err.message });
    } finally {
        client.release();
    }
};