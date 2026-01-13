const db = require('../config/database');

// Função auxiliar para converter "10,5" em 10.5
const parseDecimal = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(',', '.'));
};

exports.listProviders = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM providers ORDER BY name ASC");
        res.json(result.rows || []);
    } catch (err) { 
        console.error("Erro ao listar provedores:", err);
        res.status(500).json({ error: "Erro ao buscar provedores" }); 
    }
};

exports.createProvider = async (req, res) => {
    const { name, razao_social, cnpj, email, contato, endereco, commission_resale, commission_seller } = req.body;
    
    if (!name) return res.status(400).json({ error: "Nome fantasia é obrigatório" });

    try {
        await db.query(
            `INSERT INTO providers (name, razao_social, cnpj, email, contato, endereco, commission_resale, commission_seller, active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
            [
                name, 
                razao_social, 
                cnpj, 
                email, 
                contato, 
                endereco, 
                parseDecimal(commission_resale), 
                parseDecimal(commission_seller)
            ]
        );
        res.status(201).json({ message: "Provedor cadastrado com sucesso" });
    } catch (err) { 
        console.error("Erro ao criar provedor:", err);
        res.status(500).json({ error: "Erro ao salvar no banco de dados" }); 
    }
};

exports.updateProvider = async (req, res) => {
    const { id } = req.params;
    const { name, razao_social, cnpj, email, contato, endereco, commission_resale, commission_seller, active } = req.body;
    
    try {
        await db.query(
            `UPDATE providers SET 
                name=$1, 
                razao_social=$2, 
                cnpj=$3, 
                email=$4, 
                contato=$5, 
                endereco=$6, 
                commission_resale=$7, 
                commission_seller=$8, 
                active=$9 
             WHERE id=$10`,
            [
                name, 
                razao_social, 
                cnpj, 
                email, 
                contato, 
                endereco, 
                parseDecimal(commission_resale), 
                parseDecimal(commission_seller), 
                active, 
                id
            ]
        );
        res.json({ message: "Provedor atualizado" });
    } catch (err) { 
        console.error("Erro ao atualizar provedor:", err);
        res.status(500).json({ error: "Erro ao atualizar" }); 
    }
};

exports.deleteProvider = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft Delete (Apenas inativa)
        await db.query("UPDATE providers SET active = false WHERE id = $1", [id]);
        res.json({ message: "Provedor inativado" });
    } catch (err) { res.status(500).json({ error: "Erro ao inativar" }); }
};