const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Pega o token do cabeçalho da requisição
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // O formato esperado é "Bearer TOKEN_AQUI"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro no formato do token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformado' });
    }

    // 2. Valida o Token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Erro JWT:", err.message);
            return res.status(401).json({ error: 'Sessão inválida ou expirada' });
        }

        // 3. Salva os dados do usuário na requisição para uso nos controllers
        req.user = {
            id: decoded.id,
            permissions: decoded.permissions
        };

        return next();
    });
};