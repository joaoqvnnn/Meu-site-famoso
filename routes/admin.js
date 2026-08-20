// ============================================
// STREAMPREMIUM - ROTAS ADMINISTRATIVAS
// ============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG, SECURITY_CONFIG } = require('../config/configuracao');

const router = express.Router();

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO ADMIN
// ============================================
function autenticarAdmin(req, res, next) {
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
        if (decoded.tipo !== 'admin') {
            return res.status(403).json({ 
                sucesso: false,
                erro: 'Acesso negado. Requer permissão de administrador' 
            });
        }
        req.admin = decoded;
        next();
    } catch (erro) {
        return res.status(403).json({ 
            sucesso: false,
            erro: 'Token inválido ou expirado' 
        });
    }
}

// ============================================
// ROTAS DE DASHBOARD
// ============================================

// GET /api/admin/dashboard
// Dashboard com estatísticas gerais
router.get('/dashboard', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;

        const totalUsuarios = banco.contar('usuarios');
        const usuariosAtivos = banco.contar('usuarios', { status: 'ativo' });
        const usuariosNovos = banco.buscarTodos('usuarios').filter(u => {
            const criadoEm = new Date(u.criadoEm);
            const agora = new Date();
            const diff = (agora - criadoEm) / (1000 * 60 * 60 * 24);
            return diff <= 30;
        }).length;

        const totalProdutos = banco.contar('produtos');
        const produtosDisponiveis = banco.contar('produtos', { status: 'disponivel' });

        const totalPedidos = banco.contar('pedidos');
        const pedidosPagos = banco.contar('pedidos', { status: 'pago' });
        const pedidosPendentes = banco.contar('pedidos', { status: 'pendente' });

        const totalAssinaturas = banco.contar('assinaturas', { status: 'ativa' });
        const receitaTotal = banco.buscarTodos('pedidos')
            .filter(p => p.status === 'pago')
            .reduce((acc, p) => acc + p.total, 0);

        const totalCupons = banco.contar('cupons');
        const cuponsAtivos = banco.contar('cupons', { status: 'ativo' });

        // Dados para gráfico (últimos 7 dias)
        const ultimos7Dias = [];
        for (let i = 6; i >= 0; i--) {
            const data = new Date();
            data.setDate(data.getDate() - i);
            const dia = data.toISOString().split('T')[0];
            
            const pedidosDia = banco.buscarTodos('pedidos').filter(p => 
                p.criadoEm && p.criadoEm.startsWith(dia)
            ).length;
            
            const usuariosDia = banco.buscarTodos('usuarios').filter(u => 
                u.criadoEm && u.criadoEm.startsWith(dia)
            ).length;

            ultimos7Dias.push({
                data: dia,
                pedidos: pedidosDia,
                usuarios: usuariosDia
            });
        }

        res.json({
            sucesso: true,
            estatisticas: {
                usuarios: {
                    total: totalUsuarios,
                    ativos: usuariosAtivos,
                    novos: usuariosNovos
                },
                produtos: {
                    total: totalProdutos,
                    disponiveis: produtosDisponiveis
                },
                pedidos: {
                    total: totalPedidos,
                    pagos: pedidosPagos,
                    pendentes: pedidosPendentes
                },
                assinaturas: totalAssinaturas,
                receitaTotal,
                cupons: {
                    total: totalCupons,
                    ativos: cuponsAtivos
                }
            },
            grafico: ultimos7Dias
        });
    } catch (erro) {
        console.error('Erro no dashboard:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS DE ADMINISTRADORES
// ============================================

// GET /api/admin/administradores
// Listar administradores
router.get('/administradores', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const administradores = banco.buscarTodos('administradores').map(admin => ({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            cargo: admin.cargo,
            status: admin.status,
            ultimoAcesso: admin.ultimoAcesso,
            criadoEm: admin.criadoEm
        }));

        res.json({
            sucesso: true,
            administradores
        });
    } catch (erro) {
        console.error('Erro ao listar administradores:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/admin/administradores
// Criar novo administrador
router.post('/administradores', autenticarAdmin, async (req, res) => {
    try {
        const banco = req.banco;
        const { nome, email, senha, cargo } = req.body;

        // Validações
        if (!nome || nome.trim().length < 3) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Nome deve ter no mínimo 3 caracteres' 
            });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'E-mail inválido' 
            });
        }

        if (!senha || senha.length < 8) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Senha deve ter no mínimo 8 caracteres' 
            });
        }

        // Verificar se e-mail já existe
        const adminExistente = banco.buscarUm('administradores', { email });
        if (adminExistente) {
            return res.status(409).json({ 
                sucesso: false,
                erro: 'E-mail já cadastrado' 
            });
        }

        const senhaHash = await bcrypt.hash(senha, SECURITY_CONFIG.bcryptSaltRounds);

        const novoAdmin = banco.inserir('administradores', {
            nome: nome.trim(),
            email: email.toLowerCase(),
            senha: senhaHash,
            cargo: cargo || 'admin',
            status: 'ativo',
            ultimoAcesso: null,
            criadoEm: new Date().toISOString()
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Administrador criado com sucesso',
            administrador: {
                id: novoAdmin.id,
                nome: novoAdmin.nome,
                email: novoAdmin.email,
                cargo: novoAdmin.cargo
            }
        });
    } catch (erro) {
        console.error('Erro ao criar administrador:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/admin/administradores/:id
// Atualizar administrador
router.put('/administradores/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const admin = banco.buscarPorId('administradores', id);

        if (!admin) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Administrador não encontrado' 
            });
        }

        const { nome, cargo, status } = req.body;
        const dadosAtualizados = {};

        if (nome) dadosAtualizados.nome = nome.trim();
        if (cargo) dadosAtualizados.cargo = cargo;
        if (status) dadosAtualizados.status = status;

        banco.atualizar('administradores', id, dadosAtualizados);

        res.json({
            sucesso: true,
            mensagem: 'Administrador atualizado com sucesso',
            administrador: banco.buscarPorId('administradores', id)
        });
    } catch (erro) {
        console.error('Erro ao atualizar administrador:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// DELETE /api/admin/administradores/:id
// Excluir administrador
router.delete('/administradores/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const admin = banco.buscarPorId('administradores', id);

        if (!admin) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Administrador não encontrado' 
            });
        }

        // Impedir exclusão do último super admin
        if (admin.cargo === 'super') {
            const superAdmins = banco.buscarTodos('administradores', { cargo: 'super' });
            if (superAdmins.length <= 1) {
                return res.status(400).json({ 
                    sucesso: false,
                    erro: 'Não é possível excluir o último super administrador' 
                });
            }
        }

        banco.remover('administradores', id);

        res.json({
            sucesso: true,
            mensagem: 'Administrador excluído com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao excluir administrador:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS DE RELATÓRIOS
// ============================================

// GET /api/admin/relatorios/vendas
// Relatório de vendas
router.get('/relatorios/vendas', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { periodo } = req.query;

        let dias = 30;
        if (periodo === '7dias') dias = 7;
        if (periodo === '90dias') dias = 90;
        if (periodo === '12meses') dias = 365;

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);

        const pedidos = banco.buscarTodos('pedidos', { status: 'pago' })
            .filter(p => new Date(p.criadoEm) >= dataLimite);

        const vendasPorDia = [];
        const vendasPorProduto = {};

        pedidos.forEach(pedido => {
            const dia = pedido.criadoEm.split('T')[0];
            const existente = vendasPorDia.find(v => v.data === dia);
            
            if (existente) {
                existente.total += pedido.total;
                existente.quantidade++;
            } else {
                vendasPorDia.push({
                    data: dia,
                    total: pedido.total,
                    quantidade: 1
                });
            }

            pedido.itens.forEach(item => {
                if (vendasPorProduto[item.titulo]) {
                    vendasPorProduto[item.titulo].quantidade += item.quantidade;
                    vendasPorProduto[item.titulo].receita += item.preco * item.quantidade;
                } else {
                    vendasPorProduto[item.titulo] = {
                        quantidade: item.quantidade,
                        receita: item.preco * item.quantidade
                    };
                }
            });
        });

        const receitaTotal = pedidos.reduce((acc, p) => acc + p.total, 0);

        res.json({
            sucesso: true,
            periodo: dias,
            receitaTotal,
            totalPedidos: pedidos.length,
            vendasPorDia,
            vendasPorProduto: Object.keys(vendasPorProduto).map(titulo => ({
                titulo,
                ...vendasPorProduto[titulo]
            })).sort((a, b) => b.receita - a.receita)
        });
    } catch (erro) {
        console.error('Erro no relatório de vendas:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/admin/relatorios/usuarios
// Relatório de usuários
router.get('/relatorios/usuarios', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const usuarios = banco.buscarTodos('usuarios');

        const porPlano = {
            gratuito: 0,
            basico: 0,
            premium: 0,
            familia: 0
        };

        const porStatus = {
            ativo: 0,
            inativo: 0,
            suspenso: 0
        };

        const porMes = {};

        usuarios.forEach(usuario => {
            if (porPlano[usuario.plano] !== undefined) {
                porPlano[usuario.plano]++;
            }

            if (porStatus[usuario.status] !== undefined) {
                porStatus[usuario.status]++;
            }

            const mes = usuario.criadoEm ? usuario.criadoEm.substring(0, 7) : 'desconhecido';
            porMes[mes] = (porMes[mes] || 0) + 1;
        });

        res.json({
            sucesso: true,
            totalUsuarios: usuarios.length,
            porPlano,
            porStatus,
            porMes
        });
    } catch (erro) {
        console.error('Erro no relatório de usuários:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS DE CONFIGURAÇÕES
// ============================================

// GET /api/admin/configuracoes
// Buscar configurações
router.get('/configuracoes', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const configuracoes = banco.buscarTodos('configuracoes') || {};

        res.json({
            sucesso: true,
            configuracoes
        });
    } catch (erro) {
        console.error('Erro ao buscar configurações:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/admin/configuracoes
// Atualizar configurações
router.put('/configuracoes', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const novasConfig = req.body;

        // Simular salvamento
        res.json({
            sucesso: true,
            mensagem: 'Configurações atualizadas com sucesso',
            configuracoes: novasConfig
        });
    } catch (erro) {
        console.error('Erro ao atualizar configurações:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = router;
