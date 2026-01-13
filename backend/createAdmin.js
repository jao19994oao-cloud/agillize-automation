const db = require('./src/config/database');
const bcrypt = require('bcryptjs'); // Usando a versão JS para garantir

async function createAdmin() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('agillize123', salt);
    const email = 'admin@teste.com';

    try {
        // Primeiro, deletamos o admin antigo para não dar erro de duplicata
        await db.query('DELETE FROM users WHERE email = $1', [email]);
        
        // Inserimos o novo com o hash gerado NA SUA MÁQUINA
        await db.query(
            'INSERT INTO users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4)',
            ['Admin Agillize', email, hash, 1]
        );
        
        console.log("✅ Admin criado com sucesso!");
        console.log("Hash gerado no seu PC:", hash);
        process.exit();
    } catch (err) {
        console.error("Erro ao criar admin:", err);
        process.exit(1);
    }
}

createAdmin();