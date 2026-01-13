const axios = require('axios');
require('dotenv').config();

const asaas = axios.create({
    baseURL: process.env.ASAAS_API_URL,
    headers: {
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
    }
});

exports.createPixCharge = async (customerData, invoiceData) => {
    try {
        // 1. Precisamos de um Cliente no Asaas. Vamos criar ou buscar um fixo.
        // Para este SaaS interno, vamos criar um cliente padrão "Minha Empresa" se não existir.
        // Em produção, você buscaria pelo CPF/CNPJ.
        
        let customerId;
        
        // Tenta buscar cliente pelo email
        const customerSearch = await asaas.get(`/customers?email=${customerData.email}`);
        
        if (customerSearch.data.data.length > 0) {
            customerId = customerSearch.data.data[0].id;
        } else {
            // Cria novo cliente
            const newCustomer = await asaas.post('/customers', {
                name: customerData.name,
                cpfCnpj: customerData.document,
                email: customerData.email
            });
            customerId = newCustomer.data.id;
        }

        // 2. Cria a Cobrança Pix
        const charge = await asaas.post('/payments', {
            customer: customerId,
            billingType: 'PIX',
            value: invoiceData.amount,
            dueDate: invoiceData.dueDate,
            description: invoiceData.description
        });

        // 3. Pega o QRCode e o Copia e Cola
        const qrCode = await asaas.get(`/payments/${charge.data.id}/pixQrCode`);

        return {
            paymentId: charge.data.id,
            encodedImage: qrCode.data.encodedImage, // Imagem Base64
            payload: qrCode.data.payload // Código Copia e Cola
        };

    } catch (error) {
        console.error("Erro Asaas:", error.response?.data || error.message);
        throw new Error("Falha na comunicação com gateway de pagamento.");
    }
};