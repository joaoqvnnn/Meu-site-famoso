// ============================================
// STREAMPREMIUM - ROTAS DE PEDIDOS
// ============================================

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/configuracao');

const router = express.Router();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function gerarNumeroPedido() {
    const ano = new Date().getFullYear();
    const numero = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    return `#SP-${ano}-${numero}`;
}

// ============================================
// MIDDLEWARES
// ============================================
function autenticarToken(req, res, next) {
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
        req.usuario = decoded;
        next();
    } catch (erro) {
        return res.status(403).json({ 
            sucesso: false,
            erro: 'Token inválido ou expirado' 
        });
    }
}

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
// ROTAS DE USUÁRIO
// ============================================

// POST /api/pedidos
// Criar novo pedido (checkout)
router.post('/', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { itens, cupom, metodoPagamento } = req.body;

        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Carrinho vazio' 
            });
        }

        // Calcular totais
        let subtotal = 0;
        const itensDetalhados = [];

        for (const item of itens) {
            const produto = banco.buscarPorId('produtos', item.produtoId);
            
            if (!produto || produto.status !== 'disponivel') {
                return res.status(400).json({ 
                    sucesso: false,
                    erro: `Produto ID ${item.produtoId} não encontrado ou indisponível` 
                });
            }

            const quantidade = item.quantidade || 1;
            const precoTotal = produto.preco * quantidade;
            subtotal += precoTotal;

            itensDetalhados.push({
                produtoId: produto.id,
                titulo: produto.titulo,
                preco: produto.preco,
                quantidade
            });
        }

        // Aplicar cupom
        let desconto = 0;
        if (cupom) {
            const cupomEncontrado = banco.buscarUm('cupons', { 
                codigo: cupom.toUpperCase(),
                status: 'ativo'
            });

            if (cupomEncontrado) {
                // Verificar validade
                if (new Date(cupomEncontrado.validade) > new Date()) {
                    // Verificar usos
                    if (cupomEncontrado.usos < cupomEncontrado.maximoUsos) {
                        if (cupomEncontrado.tipo === 'porcentagem') {
                            desconto = subtotal * (cupomEncontrado.valor / 100);
                        } else {
                            desconto = cupomEncontrado.valor;
                        }
                        
                        // Incrementar usos
                        banco.atualizar('cupons', cupomEncontrado.id, {
                            usos: cupomEncontrado.usos + 1
                        });
                    }
                }
            }
        }

        const total = subtotal - desconto;

        // Criar pedido
        const novoPedido = banco.inserir('pedidos', {
            numero: gerarNumeroPedido(),
            usuarioId: req.usuario.id,
            itens: itensDetalhados,
            subtotal,
            desconto,
            total,
            status: 'pendente',
            metodoPagamento: metodoPagamento || 'cartao',
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Registrar pagamento
        banco.inserir('pagamentos', {
            pedidoId: novoPedido.id,
            usuarioId: req.usuario.id,
            valor: total,
            metodo: metodoPagamento || 'cartao',
            status: 'pendente',
            criadoEm: new Date().toISOString()
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Pedido criado com sucesso',
            pedido: novoPedido
        });
    } catch (erro) {
        console.error('Erro ao criar pedido:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/pedidos
// Listar pedidos do usuário autenticado
router.get('/', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const pedidos = banco.buscarTodos('pedidos', { usuarioId: req.usuario.id });

        res.json({
            sucesso: true,
            pedidos
        });
    } catch (erro) {
        console.error('Erro ao listar pedidos:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/pedidos/:id
// Buscar pedido específico do usuário
router.get('/:id', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const pedido = banco.buscarPorId('pedidos', id);

        if (!pedido || pedido.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        res.json({
            sucesso: true,
            pedido
        });
    } catch (erro) {
        console.error('Erro ao buscar pedido:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/pedidos/:id/cancelar
// Cancelar pedido
router.post('/:id/cancelar', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const pedido = banco.buscarPorId('pedidos', id);

        if (!pedido || pedido.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        if (pedido.status !== 'pendente') {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Apenas pedidos pendentes podem ser cancelados' 
            });
        }

        banco.atualizar('pedidos', id, {
            status: 'cancelado',
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pagamento
        const pagamento = banco.buscarUm('pagamentos', { pedidoId: id });
        if (pagamento) {
            banco.atualizar('pagamentos', pagamento.id, {
                status: 'cancelado'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Pedido cancelado com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao cancelar pedido:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/pedidos/admin/todos
// Listar todos os pedidos (admin)
router.get('/admin/todos', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { status, busca, limit, page } = req.query;

        let pedidos = banco.buscarTodos('pedidos');

        // Filtrar por status
        if (status) {
            pedidos = pedidos.filter(p => p.status === status);
        }

        // Buscar por número ou usuário
        if (busca) {
            const termo = busca.toLowerCase();
            pedidos = pedidos.filter(p => 
                p.numero.toLowerCase().includes(termo) ||
                p.usuarioId.toString().includes(termo)
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = pedidos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        pedidos = pedidos.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const pedidosComUsuario = pedidos.map(pedido => {
            const usuario = banco.buscarPorId('usuarios', pedido.usuarioId);
            return {
                ...pedido,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null
            };
        });

        res.json({
            sucesso: true,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            pedidos: pedidosComUsuario
        });
    } catch (erro) {
        console.error('Erro ao listar pedidos admin:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/pedidos/admin/:id
// Buscar pedido específico (admin)
router.get('/admin/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const pedido = banco.buscarPorId('pedidos', id);

        if (!pedido) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        const usuario = banco.buscarPorId('usuarios', pedido.usuarioId);
        const pagamento = banco.buscarUm('pagamentos', { pedidoId: id });

        res.json({
            sucesso: true,
            pedido: {
                ...pedido,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null,
                pagamento: pagamento || null
            }
        });
    } catch (erro) {
        console.error('Erro ao buscar pedido admin:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/pedidos/admin/:id/status
// Atualizar status do pedido (admin)
router.put('/admin/:id/status', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const pedido = banco.buscarPorId('pedidos', id);

        if (!pedido) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        const statusValidos = ['pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Status inválido' 
            });
        }

        banco.atualizar('pedidos', id, {
            status,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pagamento
        const pagamento = banco.buscarUm('pagamentos', { pedidoId: id });
        if (pagamento) {
            banco.atualizar('pagamentos', pagamento.id, {
                status: status === 'pago' ? 'aprovado' : status
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Status do pedido atualizado',
            pedido: banco.buscarPorId('pedidos', id)
        });
    } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
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
