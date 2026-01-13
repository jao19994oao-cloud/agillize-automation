const axios = require('axios');

// --- PASSO 1: SÓ MEXA AQUI ---
// Vá no banco, copie o 'asaas_id' (ex: pay_58493...) e cole dentro das aspas abaixo.
// NÃO apague o 'pay_', o ID completo inclui ele.
const ID_QUE_ESTA_NO_BANCO = 'pay_z8uolnou4ngrnpfj'; 

// URL do seu servidor local
const WEBHOOK_URL = 'http://localhost:3000/api/financial/webhook/asaas';

async function enviarWebhook() {
    console.log("---------------------------------------------------");
    console.log(`📡 Fingindo ser o Asaas e avisando o servidor...`);
    console.log(`💰 Pagamento ID: ${ID_QUE_ESTA_NO_BANCO}`);
    console.log("---------------------------------------------------");

    try {
        // Envia a requisição POST igualzinha a que o Asaas enviaria
        const response = await axios.post(WEBHOOK_URL, {
            event: "PAYMENT_RECEIVED",
            payment: {
                id: ID_QUE_ESTA_NO_BANCO
            }
        });

        console.log("✅ SUCESSO! O servidor recebeu o aviso.");
        console.log("📩 Resposta do servidor:", response.data);
        console.log("---------------------------------------------------");
        console.log("👀 AGORA OLHE O TERMINAL ONDE O 'node server.js' ESTÁ RODANDO.");
        console.log("   Lá deve ter aparecido: '🔓 SISTEMA DESBLOQUEADO VIA WEBHOOK!'");
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("❌ FALHA AO ENVIAR:");
        if (error.response) {
            // O servidor respondeu com erro (404, 500, etc)
            console.error(`Status: ${error.response.status}`);
            console.error(`Motivo: ${JSON.stringify(error.response.data)}`);
        } else {
            // O servidor está desligado ou url errada
            console.error(error.message);
            console.error("DICA: Seu servidor (node server.js) está rodando?");
        }
    }
}

enviarWebhook();