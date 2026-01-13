const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper para tratar preço (aceita "1200,50" ou "1200.50")
const parsePrice = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(value.toString().replace('.', '').replace(',', '.'));
};

// --- LISTAGENS ---
exports.listUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, u.active, r.name as role_name, u.role_id 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC`;
        const result = await db.query(query);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: "Erro ao listar usuários" }); }
};

exports.listRoles = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM roles ORDER BY id ASC");
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: "Erro ao listar cargos" }); }
};

exports.listSystemPermissions = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM system_permissions ORDER BY display_name ASC");
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: "Erro ao listar permissões" }); }
};

exports.listAdminProducts = async (req, res) => {
    try {
        // Traz nome do Grupo e do Provedor
        const query = `
            SELECT p.*, c.name as category_name, pv.name as provider_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN providers pv ON p.provider_id = pv.id
            ORDER BY p.id ASC`;
        const result = await db.query(query);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: "Erro ao listar produtos" }); }
};

// --- USUÁRIOS ---
exports.createUser = async (req, res) => {
    const { name, email, password, role_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (name, email, password_hash, role_id, active) VALUES ($1, $2, $3, $4, true)",
            [name, email, hashedPassword, role_id]
        );
        res.status(201).json({ message: "Usuário criado" });
    } catch (err) { res.status(500).json({ error: "Erro ao criar usuário (Email duplicado?)" }); }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role_id, active, password } = req.body;
    try {
        if (password && password.trim() !== "") {
            const hash = await bcrypt.hash(password, 10);
            await db.query(
                "UPDATE users SET name=$1, email=$2, role_id=$3, active=$4, password_hash=$5 WHERE id=$6", 
                [name, email, role_id, active, hash, id]
            );
        } else {
            await db.query(
                "UPDATE users SET name=$1, email=$2, role_id=$3, active=$4 WHERE id=$5", 
                [name, email, role_id, active, id]
            );
        }
        res.json({ message: "Usuário atualizado" });
    } catch (err) { res.status(500).json({ error: "Erro ao atualizar" }); }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE users SET active = false WHERE id = $1", [id]);
        res.json({ message: "Usuário inativado" });
    } catch (err) { res.status(500).json({ error: "Erro ao inativar" }); }
};

// --- PRODUTOS ---
exports.createProduct = async (req, res) => {
    // CORREÇÃO: Adicionado provider_id
    const { category_id, provider_id, name, price } = req.body;
    try {
        const finalPrice = parsePrice(price);
        await db.query(
            "INSERT INTO products (category_id, provider_id, name, price, active) VALUES ($1, $2, $3, $4, true)",
            [parseInt(category_id), parseInt(provider_id), name, finalPrice]
        );
        res.status(201).json({ message: "Produto cadastrado" });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Erro ao criar produto" }); 
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, category_id, provider_id, active } = req.body;
    try {
        const finalPrice = parsePrice(price);
        await db.query(
            "UPDATE products SET name=$1, price=$2, category_id=$3, provider_id=$4, active=$5 WHERE id=$6",
            [name, finalPrice, parseInt(category_id), parseInt(provider_id), active, id]
        );
        res.json({ message: "Produto atualizado" });
    } catch (err) { res.status(500).json({ error: "Erro ao atualizar produto" }); }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE products SET active = false WHERE id = $1", [id]);
        res.json({ message: "Produto inativado" });
    } catch (err) { res.status(500).json({ error: "Erro ao excluir" }); }
};

// --- GRUPOS (CATEGORIAS) ---
exports.createGroup = async (req, res) => {
    const { name } = req.body;
    try {
        await db.query("INSERT INTO categories (name, active) VALUES ($1, true)", [name]);
        res.status(201).json({ message: "Grupo criado" });
    } catch (err) { res.status(500).json({ error: "Erro ao criar grupo" }); }
};

exports.updateGroup = async (req, res) => {
    const { id } = req.params;
    const { name, active } = req.body;
    try {
        await db.query("UPDATE categories SET name=$1, active=$2 WHERE id=$3", [name, active, id]);
        res.json({ message: "Grupo atualizado" });
    } catch (err) { res.status(500).json({ error: "Erro ao atualizar" }); }
};

exports.deleteGroup = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE categories SET active = false WHERE id = $1", [id]);
        res.json({ message: "Grupo inativado" });
    } catch (err) { res.status(500).json({ error: "Erro ao excluir" }); }
};

// --- CARGOS (ROLES) ---
exports.createRole = async (req, res) => {
    const { name, permissions } = req.body;
    try {
        await db.query("INSERT INTO roles (name, permissions) VALUES ($1, $2)", [name, JSON.stringify(permissions)]);
        res.status(201).json({ message: "Cargo criado" });
    } catch (err) { res.status(500).json({ error: "Erro ao criar cargo" }); }
};

exports.updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    try {
        await db.query("UPDATE roles SET name=$1, permissions=$2 WHERE id=$3", [name, JSON.stringify(permissions), id]);
        res.json({ message: "Cargo atualizado" });
    } catch (err) { res.status(500).json({ error: "Erro ao atualizar" }); }
};

exports.deleteRole = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM roles WHERE id = $1", [id]);
        res.json({ message: "Cargo removido" });
    } catch (err) { 
        res.status(400).json({ error: "Não é possível excluir este cargo pois existem usuários vinculados a ele." }); 
    }
};