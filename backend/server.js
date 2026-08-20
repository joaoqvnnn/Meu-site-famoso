// ============================================
// STREAMPREMIUM - BACKEND SERVER
// Servidor Node.js com Express
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURAÇÕES
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'streampremium_secret_key_2024';
const JWT_EXPIRES = '7d';

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// BANCO DE DADOS SIMULADO (em memória)
// ============================================
const db = {
    usuarios: [
        {
            id: 1,
            nome: 'João da Silva',
            email: 'joao.silva@email.com',
            senha: '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u',
            cpf: '123.456.789-00',
            telefone: '+55 44 99869-1568',
            plano: 'premium',
            status: 'ativo',
            criadoEm: '2024-01-15T10:00:00Z',
            atualizadoEm: '2024-12-15T14:30:00Z'
        },
        {
            id: 2,
            nome: 'Maria Oliveira',
            email: 'maria.oliveira@email.com',
            senha: '$2a$10$Y7mN3pQ5rS8tU2vW4xZ6aB1cD3eF5gH7iJ9kL2mN4oP6qR0sT1u',
            cpf: '987.654.321-00',
            telefone: '+55 44 98765-4321',
            plano: 'basico',
            status: 'ativo',
            criadoEm: '2024-02-22T10:00:00Z',
            atualizadoEm: '2024-12-14T22:00:00Z'
        }
    ],
    
    produtos: [
        {
            id: 1,
            titulo: 'Duna: Parte 2',
            tipo: 'filme',
            genero: 'Ficção Científica',
            ano: 2024,
            duracao: '2h 46min',
            avaliacao: 8.9,
            preco: 29.90,
            descricao: 'Paul Atreides se une a Chani e aos Fremen...',
            status: 'disponivel',
            destaque: true,
            criadoEm: '2024-01-01T00:00:00Z'
        },
        {
            id: 2,
            titulo: 'Breaking Bad - T1',
            tipo: 'serie',
            genero: 'Drama',
            ano: 2008,
            duracao: '45min/ep',
            avaliacao: 9.5,
            preco: 49.90,
            descricao: 'Um professor de química se torna traficante...',
            status: 'disponivel',
            destaque: true,
            criadoEm: '2024-01-01T00:00:00Z'
        }
    ],
    
    pedidos: [
        {
            id: 1,
            numero: '#SP-2024-001234',
            usuarioId: 1,
            itens: [
                { produtoId: 1, titulo: 'Duna: Parte 2', preco: 29.90 }
            ],
            subtotal: 29.90,
            desconto: 0,
            total: 29.90,
            status: 'pago',
            metodoPagamento: 'cartao',
            criadoEm: '2024-12-15T14:30:00Z'
        }
    ],
    
    assinaturas: [
        {
            id: 1,
            usuarioId: 1,
            plano: 'premium',
            valor: 29.90,
            status: 'ativa',
            inicio: '2024-01-15T00:00:00Z',
            proximaCobranca: '2024-12-15T00:00:00Z'
        }
    ],
    
    cupons: [
        {
            id: 1,
            codigo: 'BEMVINDO10',
            tipo: 'porcentagem',
            valor: 10,
            usos: 245,
            maximoUsos: 500,
            validade: '2024-12-31T23:59:59Z',
            status: 'ativo'
        }
    ],
    
    banners: [
        {
            id: 1,
            titulo: 'Duna: Parte 2 - Em destaque',
            posicao: 'hero',
            inicio: '2024-12-01T00:00:00Z',
            fim: '2024-12-31T23:59:59Z',
            status: 'ativo'
        }
    ],
    
    emails: [],
    
    administradores: [
        {
            id: 1,
            nome: 'Carlos Eduardo',
            email: 'admin@streampremium.com',
            senha: '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u',
            cargo: 'super',
            status: 'ativo',
            ultimoAcesso: null,
            criadoEm: '2024-01-01T00:00:00Z'
        }
    ]
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function gerarToken(usuario) {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, tipo: usuario.tipo || 'usuario' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido ou expirado' });
        }
        req.usuario = decoded;
        next();
    });
}

function autenticarAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido ou expirado' });
        }
        if (decoded.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado. Requer permissão de administrador' });
        }
        req.admin = decoded;
        next();
    });
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCPF(cpf) {
    return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

function gerarNumeroPedido() {
    const ano = new Date().getFullYear();
    const numero = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    return `#SP-${ano}-${numero}`;
}

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Rota principal - serve o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Cadastro de usuário
app.post('/api/cadastro', async (req, res) => {
    try {
        const { nome, email, senha, cpf, telefone } = req.body;
        
        // Validações
        if (!nome || nome.length < 3) {
            return res.status(400).json({ erro: 'Nome inválido' });
        }
        
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'E-mail inválido' });
        }
        
        if (!senha || senha.length < 8) {
            return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
        }
        
        // Verificar se e-mail já existe
        const usuarioExistente = db.usuarios.find(u => u.email === email);
        if (usuarioExistente) {
            return res.status(409).json({ erro: 'E-mail já cadastrado' });
        }
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);
        
        // Criar usuário
        const novoUsuario = {
            id: db.usuarios.length + 1,
            nome,
            email,
            senha: senhaHash,
            cpf: cpf || null,
            telefone: telefone || null,
            plano: 'gratuito',
            status: 'ativo',
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        
        db.usuarios.push(novoUsuario);
        
        // Gerar token
        const token = gerarToken({ ...novoUsuario, tipo: 'usuario' });
        
        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            token,
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                plano: novoUsuario.plano
            }
        });
    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Login de usuário
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'E-mail inválido' });
        }
        
        // Buscar usuário
        const usuario = db.usuarios.find(u => u.email === email);
        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Verificar status
        if (usuario.status !== 'ativo') {
            return res.status(403).json({ erro: 'Conta suspensa ou inativa' });
        }
        
        // Atualizar último acesso
        usuario.atualizadoEm = new Date().toISOString();
        
        // Gerar token
        const token = gerarToken({ ...usuario, tipo: 'usuario' });
        
        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano
            }
        });
    } catch (erro) {
        console.error('Erro no login:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Buscar admin
        const admin = db.administradores.find(a => a.email === email);
        if (!admin) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, admin.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Atualizar último acesso
        admin.ultimoAcesso = new Date().toISOString();
        
        // Gerar token
        const token = gerarToken({ ...admin, tipo: 'admin' });
        
        res.json({
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
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Recuperar senha
app.post('/api/recuperar-senha', (req, res) => {
    try {
        const { email } = req.body;
        
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'E-mail inválido' });
        }
        
        const usuario = db.usuarios.find(u => u.email === email);
        if (!usuario) {
            // Por segurança, não revelar se o e-mail existe
            return res.json({ mensagem: 'Se o e-mail existir, enviaremos instruções de recuperação' });
        }
        
        // Simular envio de e-mail
        const emailRecord = {
            id: db.emails.length + 1,
            destinatario: email,
            assunto: 'Recuperação de senha',
            tipo: 'Segurança',
            status: 'enviado',
            data: new Date().toISOString()
        };
        db.emails.push(emailRecord);
        
        res.json({ mensagem: 'Instruções de recuperação enviadas' });
    } catch (erro) {
        console.error('Erro na recuperação:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Redefinir senha
app.post('/api/redefinir-senha', async (req, res) => {
    try {
        const { email, novaSenha } = req.body;
        
        if (!validarEmail(email)) {
            return res.status(400).json({ erro: 'E-mail inválido' });
        }
        
        if (!novaSenha || novaSenha.length < 8) {
            return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
        }
        
        const usuario = db.usuarios.find(u => u.email === email);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const senhaHash = await bcrypt.hash(novaSenha, 10);
        usuario.senha = senhaHash;
        usuario.atualizadoEm = new Date().toISOString();
        
        res.json({ mensagem: 'Senha redefinida com sucesso' });
    } catch (erro) {
        console.error('Erro na redefinição:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Verificar e-mail
app.post('/api/verificar-email', (req, res) => {
    try {
        const { codigo } = req.body;
        
        if (!codigo || codigo.length !== 6) {
            return res.status(400).json({ erro: 'Código inválido' });
        }
        
        // Simulação - código correto: 123456
        if (codigo === '123456') {
            res.json({ mensagem: 'E-mail verificado com sucesso' });
        } else {
            res.status(400).json({ erro: 'Código incorreto' });
        }
    } catch (erro) {
        console.error('Erro na verificação:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ============================================
// ROTAS DE CATÁLOGO (públicas)
// ============================================

// Listar produtos
app.get('/api/produtos', (req, res) => {
    try {
        const { tipo, genero, busca } = req.query;
        
        let produtos = db.produtos.filter(p => p.status === 'disponivel');
        
        if (tipo) {
            produtos = produtos.filter(p => p.tipo === tipo);
        }
        
        if (genero) {
            produtos = produtos.filter(p => p.genero === genero);
        }
        
        if (busca) {
            produtos = produtos.filter(p => 
                p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                p.genero.toLowerCase().includes(busca.toLowerCase())
            );
        }
        
        res.json({ produtos });
    } catch (erro) {
        console.error('Erro ao listar produtos:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Detalhes do produto
app.get('/api/produtos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produto = db.produtos.find(p => p.id === id);
        
        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }
        
        res.json({ produto });
    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ============================================
// ROTAS DE USUÁRIO (autenticadas)
// ============================================

// Perfil do usuário
app.get('/api/usuario/perfil', autenticarToken, (req, res) => {
    try {
        const usuario = db.usuarios.find(u => u.id === req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        res.json({
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                telefone: usuario.telefone,
                plano: usuario.plano,
                status: usuario.status,
                criadoEm: usuario.criadoEm
            }
        });
    } catch (erro) {
        console.error('Erro ao buscar perfil:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar perfil
app.put('/api/usuario/perfil', autenticarToken, (req, res) => {
    try {
        const { nome, telefone, cpf } = req.body;
        const usuario = db.usuarios.find(u => u.id === req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        if (nome) usuario.nome = nome;
        if (telefone) usuario.telefone = telefone;
        if (cpf) usuario.cpf = cpf;
        usuario.atualizadoEm = new Date().toISOString();
        
        res.json({ mensagem: 'Perfil atualizado', usuario });
    } catch (erro) {
        console.error('Erro ao atualizar perfil:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Pedidos do usuário
app.get('/api/usuario/pedidos', autenticarToken, (req, res) => {
    try {
        const pedidos = db.pedidos.filter(p => p.usuarioId === req.usuario.id);
        res.json({ pedidos });
    } catch (erro) {
        console.error('Erro ao listar pedidos:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Assinatura do usuário
app.get('/api/usuario/assinatura', autenticarToken, (req, res) => {
    try {
        const assinatura = db.assinaturas.find(a => a.usuarioId === req.usuario.id);
        res.json({ assinatura: assinatura || null });
    } catch (erro) {
        console.error('Erro ao buscar assinatura:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ============================================
// ROTAS DE CHECKOUT
// ============================================

// Criar pedido
app.post('/api/checkout', autenticarToken, (req, res) => {
    try {
        const { itens, cupom, metodoPagamento } = req.body;
        
        if (!itens || itens.length === 0) {
            return res.status(400).json({ erro: 'Carrinho vazio' });
        }
        
        // Calcular totais
        let subtotal = 0;
        const itensDetalhados = itens.map(item => {
            const produto = db.produtos.find(p => p.id === item.produtoId);
            if (!produto) {
                throw new Error('Produto não encontrado');
            }
            subtotal += produto.preco * item.quantidade;
            return {
                produtoId: produto.id,
                titulo: produto.titulo,
                preco: produto.preco,
                quantidade: item.quantidade || 1
            };
        });
        
        // Aplicar cupom
        let desconto = 0;
        if (cupom) {
            const cupomEncontrado = db.cupons.find(c => c.codigo === cupom && c.status === 'ativo');
            if (cupomEncontrado) {
                if (cupomEncontrado.tipo === 'porcentagem') {
                    desconto = subtotal * (cupomEncontrado.valor / 100);
                } else {
                    desconto = cupomEncontrado.valor;
                }
            }
        }
        
        const total = subtotal - desconto;
        
        // Criar pedido
        const novoPedido = {
            id: db.pedidos.length + 1,
            numero: gerarNumeroPedido(),
            usuarioId: req.usuario.id,
            itens: itensDetalhados,
            subtotal,
            desconto,
            total,
            status: 'pendente',
            metodoPagamento,
            criadoEm: new Date().toISOString()
        };
        
        db.pedidos.push(novoPedido);
        
        res.status(201).json({
            mensagem: 'Pedido criado com sucesso',
            pedido: novoPedido
        });
    } catch (erro) {
        console.error('Erro no checkout:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// Dashboard admin
app.get('/api/admin/dashboard', autenticarAdmin, (req, res) => {
    try {
        const totalUsuarios = db.usuarios.length;
        const totalProdutos = db.produtos.length;
        const totalPedidos = db.pedidos.length;
        const totalAssinaturas = db.assinaturas.filter(a => a.status === 'ativa').length;
        const receitaTotal = db.pedidos
            .filter(p => p.status === 'pago')
            .reduce((acc, p) => acc + p.total, 0);
        
        res.json({
            estatisticas: {
                totalUsuarios,
                totalProdutos,
                totalPedidos,
                totalAssinaturas,
                receitaTotal
            }
        });
    } catch (erro) {
        console.error('Erro no dashboard:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Listar usuários (admin)
app.get('/api/admin/usuarios', autenticarAdmin, (req, res) => {
    try {
        const usuarios = db.usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            plano: u.plano,
            status: u.status,
            criadoEm: u.criadoEm
        }));
        res.json({ usuarios });
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Gerenciar produtos (admin)
app.post('/api/admin/produtos', autenticarAdmin, (req, res) => {
    try {
        const { titulo, tipo, genero, ano, preco, descricao } = req.body;
        
        const novoProduto = {
            id: db.produtos.length + 1,
            titulo,
            tipo,
            genero,
            ano,
            preco,
            descricao,
            status: 'disponivel',
            criadoEm: new Date().toISOString()
        };
        
        db.produtos.push(novoProduto);
        res.status(201).json({ mensagem: 'Produto criado', produto: novoProduto });
    } catch (erro) {
        console.error('Erro ao criar produto:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Gerenciar cupons (admin)
app.post('/api/admin/cupons', autenticarAdmin, (req, res) => {
    try {
        const { codigo, tipo, valor, maximoUsos, validade } = req.body;
        
        const novoCupom = {
            id: db.cupons.length + 1,
            codigo,
            tipo,
            valor,
            usos: 0,
            maximoUsos,
            validade,
            status: 'ativo'
        };
        
        db.cupons.push(novoCupom);
        res.status(201).json({ mensagem: 'Cupom criado', cupom: novoCupom });
    } catch (erro) {
        console.error('Erro ao criar cupom:', erro);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ============================================
// ROTA 404
// ============================================
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// ============================================
// INICIALIZAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log('============================================');
    console.log('🚀 StreamPremium Server');
    console.log('============================================');
    console.log(`📡 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('============================================');
    console.log('📚 Rotas disponíveis:');
    console.log('   POST /api/cadastro');
    console.log('   POST /api/login');
    console.log('   POST /api/admin/login');
    console.log('   GET  /api/produtos');
    console.log('   GET  /api/usuario/perfil');
    console.log('   POST /api/checkout');
    console.log('   GET  /api/admin/dashboard');
    console.log('============================================');
});
