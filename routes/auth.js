// ============================================
// STREAMPREMIUM - ROTAS DE AUTENTICAÇÃO
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG, SECURITY_CONFIG } = require('../config/configuracao');

const router = express.Router();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarSenha(senha) {
    if (senha.length < SECURITY_CONFIG.senhaMinLength) {
        return { valido: false, erro: `Senha deve ter no mínimo ${SECURITY_CONFIG.senhaMinLength} caracteres` };
    }
    
    if (SECURITY_CONFIG.requerMaiusculas && !/[A-Z]/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter letras maiúsculas' };
    }
    
    if (SECURITY_CONFIG.requerNumeros && !/\d/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter números' };
    }
    
    if (SECURITY_CONFIG.requerCaracteresEspeciais && !/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter caracteres especiais' };
    }
    
    return { valido: true };
}

function gerarToken(usuario, tipo = 'usuario') {
    return jwt.sign(
        { 
            id: usuario.id, 
            email: usuario.email, 
            tipo,
            nome: usuario.nome
        },
        JWT_CONFIG.secret,
        { 
            expiresIn: JWT_CONFIG.expiresIn,
            algorithm: JWT_CONFIG.algorithm,
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        }
    );
}

// ============================================
// ROTAS
// ============================================

// POST /api/auth/cadastro
// Cadastro de novo usuário
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha, cpf, telefone } = req.body;
        const banco = req.banco;

        // Validações
        if (!nome || nome.trim().length < 3) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Nome deve ter no mínimo 3 caracteres' 
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'E-mail inválido' 
            });
        }

        const validacaoSenha = validarSenha(senha);
        if (!validacaoSenha.valido) {
            return res.status(400).json({ 
                sucesso: false,
                erro: validacaoSenha.erro 
            });
        }

        // Verificar se e-mail já existe
        const usuarioExistente = banco.buscarUm('usuarios', { email });
        if (usuarioExistente) {
            return res.status(409).json({ 
                sucesso: false,
                erro: 'E-mail já cadastrado' 
            });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, SECURITY_CONFIG.bcryptSaltRounds);

        // Criar usuário
        const novoUsuario = banco.inserir('usuarios', {
            nome: nome.trim(),
            email: email.toLowerCase(),
            senha: senhaHash,
            cpf: cpf || null,
            telefone: telefone || null,
            plano: 'gratuito',
            status: 'ativo',
            verificado: false,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Gerar token
        const token = gerarToken(novoUsuario, 'usuario');

        res.status(201).json({
            sucesso: true,
            mensagem: 'Usuário cadastrado com sucesso',
            token,
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                plano: novoUsuario.plano,
                verificado: novoUsuario.verificado
            }
        });
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/login
// Login de usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const banco = req.banco;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'E-mail inválido' 
            });
        }

        if (!senha) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Senha é obrigatória' 
            });
        }

        // Buscar usuário
        const usuario = banco.buscarUm('usuarios', { email: email.toLowerCase() });
        if (!usuario) {
            return res.status(401).json({ 
                sucesso: false,
                erro: 'Credenciais inválidas' 
            });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ 
                sucesso: false,
                erro: 'Credenciais inválidas' 
            });
        }

        // Verificar status
        if (usuario.status !== 'ativo') {
            return res.status(403).json({ 
                sucesso: false,
                erro: 'Conta suspensa ou inativa. Entre em contato com o suporte.' 
            });
        }

        // Atualizar último acesso
        banco.atualizar('usuarios', usuario.id, {
            ultimoAcesso: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Gerar token
        const token = gerarToken(usuario, 'usuario');

        res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano,
                verificado: usuario.verificado
            }
        });
    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/admin/login
// Login de administrador
router.post('/admin/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const banco = req.banco;

        if (!email || !validarEmail(email)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'E-mail inválido' 
            });
        }

        if (!senha) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Senha é obrigatória' 
            });
        }

        // Buscar administrador
        const admin = banco.buscarUm('administradores', { email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ 
                sucesso: false,
                erro: 'Credenciais inválidas' 
            });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, admin.senha);
        if (!senhaValida) {
            return res.status(401).json({ 
                sucesso: false,
                erro: 'Credenciais inválidas' 
            });
        }

        // Verificar status
        if (admin.status !== 'ativo') {
            return res.status(403).json({ 
                sucesso: false,
                erro: 'Conta administrativa desativada' 
            });
        }

        // Atualizar último acesso
        banco.atualizar('administradores', admin.id, {
            ultimoAcesso: new Date().toISOString()
        });

        // Gerar token
        const token = gerarToken({ ...admin, nome: admin.nome }, 'admin');

        res.json({
            sucesso: true,
            mensagem: 'Login administrativo realizado',
            token,
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                cargo: admin.cargo
            }
        });
    } catch (erro) {
        console.error('Erro no login admin:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/recuperar-senha
// Solicitar recuperação de senha
router.post('/recuperar-senha', async (req, res) => {
    try {
        const { email } = req.body;
        const banco = req.banco;

        if (!validarEmail(email)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'E-mail inválido' 
            });
        }

        const usuario = banco.buscarUm('usuarios', { email: email.toLowerCase() });

        // Por segurança, sempre retornar sucesso
        if (usuario) {
            // Gerar token de recuperação
            const tokenRecuperacao = jwt.sign(
                { id: usuario.id, email: usuario.email, tipo: 'recuperacao' },
                JWT_CONFIG.secret,
                { expiresIn: '1h' }
            );

            // Registrar e-mail de recuperação
            banco.inserir('emails', {
                destinatario: email,
                assunto: 'Recuperação de senha',
                tipo: 'Segurança',
                status: 'enviado',
                conteudo: `Link de recuperação: ${process.env.URL_BASE || 'http://localhost:3000'}/redefinir-senha?token=${tokenRecuperacao}`,
                criadoEm: new Date().toISOString()
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Se o e-mail existir, enviaremos instruções de recuperação'
        });
    } catch (erro) {
        console.error('Erro na recuperação de senha:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/redefinir-senha
// Redefinir senha
router.post('/redefinir-senha', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;
        const banco = req.banco;

        if (!token) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Token não fornecido' 
            });
        }

        const validacaoSenha = validarSenha(novaSenha);
        if (!validacaoSenha.valido) {
            return res.status(400).json({ 
                sucesso: false,
                erro: validacaoSenha.erro 
            });
        }

        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_CONFIG.secret);
        } catch (erro) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Token inválido ou expirado' 
            });
        }

        if (decoded.tipo !== 'recuperacao') {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Token inválido' 
            });
        }

        // Buscar usuário
        const usuario = banco.buscarPorId('usuarios', decoded.id);
        if (!usuario) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Usuário não encontrado' 
            });
        }

        // Hash da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, SECURITY_CONFIG.bcryptSaltRounds);

        // Atualizar senha
        banco.atualizar('usuarios', usuario.id, {
            senha: senhaHash,
            atualizadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: 'Senha redefinida com sucesso'
        });
    } catch (erro) {
        console.error('Erro na redefinição de senha:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/verificar-email
// Verificar e-mail
router.post('/verificar-email', (req, res) => {
    try {
        const { codigo } = req.body;
        const banco = req.banco;

        if (!codigo || codigo.length !== 6) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Código inválido' 
            });
        }

        // Simulação - código correto: 123456
        if (codigo === '123456') {
            res.json({
                sucesso: true,
                mensagem: 'E-mail verificado com sucesso'
            });
        } else {
            res.status(400).json({ 
                sucesso: false,
                erro: 'Código incorreto' 
            });
        }
    } catch (erro) {
        console.error('Erro na verificação de e-mail:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/auth/logout
// Logout (invalida token - cliente deve descartar)
router.post('/logout', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso'
    });
});

// GET /api/auth/verificar-token
// Verificar se o token é válido
router.get('/verificar-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            sucesso: false,
            erro: 'Token não fornecido' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret);
        res.json({
            sucesso: true,
            valido: true,
            usuario: decoded
        });
    } catch (erro) {
        res.status(401).json({ 
            sucesso: false,
            valido: false,
            erro: 'Token inválido ou expirado' 
        });
    }
});

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = router;
