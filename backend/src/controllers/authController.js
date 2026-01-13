const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query(
            `SELECT u.id, u.name, u.email, u.password_hash, u.active, r.name as role_name, r.permissions 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.email = $1`, 
            [email]
        );

        if (result.rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

        const user = result.rows[0];
        if (!user.active) return res.status(401).json({ error: "Acesso bloqueado" });

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) return res.status(401).json({ error: "Senha inválida" });

        let perms = user.permissions;
        if (typeof perms === 'string') {
            try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
        }

        const token = jwt.sign(
            { id: user.id, permissions: perms, role: user.role_name }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role_name, // ADMIN ou SELLER
                permissions: perms
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Erro no servidor" });
    }
};