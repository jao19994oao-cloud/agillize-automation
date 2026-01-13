const db = require('../config/database');

// Buscar dados da empresa
exports.getCompanySettings = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM company_settings LIMIT 1");
        // Se não tiver nada, retorna objeto vazio (não é erro, é só que não cadastrou ainda)
        if (result.rows.length === 0) return res.json(null);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar dados da empresa" });
    }
};

// Salvar ou Atualizar dados
exports.saveCompanySettings = async (req, res) => {
    const { name, document, email, phone } = req.body;

    if (!name || !document || !email) {
        return res.status(400).json({ error: "Nome, Documento e E-mail são obrigatórios." });
    }

    // Remove caracteres não numéricos do documento (pontos, traços)
    const cleanDocument = document.replace(/\D/g, '');

    try {
        // Verifica se já existe registro
        const check = await db.query("SELECT id FROM company_settings LIMIT 1");

        if (check.rows.length > 0) {
            // ATUALIZA
            await db.query(
                "UPDATE company_settings SET name=$1, document=$2, email=$3, phone=$4 WHERE id=$5",
                [name, cleanDocument, email, phone, check.rows[0].id]
            );
        } else {
            // CRIA NOVO
            await db.query(
                "INSERT INTO company_settings (name, document, email, phone) VALUES ($1, $2, $3, $4)",
                [name, cleanDocument, email, phone]
            );
        }

        res.json({ message: "Dados da empresa salvos com sucesso!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar dados" });
    }
};