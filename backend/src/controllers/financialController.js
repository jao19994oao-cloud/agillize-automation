const db = require('../config/database');
const asaasService = require('../services/asaasService');

// Listar faturas
exports.listInvoices = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM system_invoices WHERE status != 'PAID' ORDER BY due_date ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Erro ao buscar faturas" }); }
};

// GERAR O PIX NO ASAAS (Substitui a antiga simulação)
exports.generatePix = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Busca a fatura
        const invRes = await db.query("SELECT * FROM system_invoices WHERE id = $1", [id]);
        if(invRes.rows.length === 0) return res.status(404).json({ error: "Fatura não encontrada" });
        const invoice = invRes.rows[0];

        if (invoice.pix_code && invoice.asaas_id) {
             return res.json({ message: "Pix recuperado!", qrCodeImage: null, copyPaste: invoice.pix_code });
        }

        // 2. BUSCA DADOS DINÂMICOS DA EMPRESA (SEM HARDCODE!)
        const companyRes = await db.query("SELECT * FROM company_settings LIMIT 1");
        
        if (companyRes.rows.length === 0) {
            return res.status(400).json({ 
                error: "Dados da Empresa não configurados. Vá em Configurações > Dados da Empresa e preencha o CNPJ/Email." 
            });
        }

        const company = companyRes.rows[0];

        // 3. Monta o objeto com os dados do banco
        const customerData = {
            name: company.name,
            email: company.email,
            document: company.document, // Já está limpo no banco
            phone: company.phone
        };

        const invoiceData = {
            amount: invoice.amount,
            dueDate: new Date().toISOString().split('T')[0],
            description: invoice.description
        };

        console.log("Gerando Pix para:", customerData.name, "Doc:", customerData.document);

        // 4. Chama Asaas
        const pixData = await asaasService.createPixCharge(customerData, invoiceData);

        await db.query("UPDATE system_invoices SET asaas_id = $1, pix_code = $2 WHERE id = $3", 
            [pixData.paymentId, pixData.payload, id]
        );

        res.json({
            message: "Pix gerado com sucesso!",
            qrCodeImage: pixData.encodedImage,
            copyPaste: pixData.payload
        });

    } catch (err) {
        console.error("ERRO BACKEND:", err.message);
        if (err.response) console.error("ASAAS:", err.response.data);
        res.status(500).json({ error: "Erro: " + (err.response?.data?.errors?.[0]?.description || err.message) });
    }
};

// --- WEBHOOK (O Asaas vai chamar isso aqui) ---
exports.handleWebhook = async (req, res) => {
    const { event, payment } = req.body;

    // console.log("Webhook recebido:", event);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        const asaasId = payment.id;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Acha a fatura pelo ID do Asaas e marca como PAGA
            await client.query("UPDATE system_invoices SET status = 'PAID' WHERE asaas_id = $1", [asaasId]);

            // 2. Verifica se ainda deve algo
            const pendingRes = await client.query("SELECT count(*) as total FROM system_invoices WHERE status != 'PAID'");
            const pendingCount = parseInt(pendingRes.rows[0].total);

            // 3. Se zerou, libera o sistema
            if (pendingCount === 0) {
                await client.query("UPDATE app_license SET status = 'ACTIVE'");
                console.log("🔓 SISTEMA DESBLOQUEADO VIA WEBHOOK!");
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Erro no webhook:", err);
            return res.status(500).send();
        } finally {
            client.release();
        }
    }

    res.json({ received: true });
};