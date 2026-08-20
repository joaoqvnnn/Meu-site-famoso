// ============================================
// STREAMPREMIUM - ROTAS DE PAGAMENTOS
// ============================================

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG, PAYMENT_CONFIG } = require('../config/configuracao');

const router = express.Router();

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
// FUNÇÕES AUXILIARES
// ============================================
function gerarCodigoPIX() {
    const caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '00020126580014BR.GOV.BCB.PIX0136';
    
    for (let i = 0; i < 32; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    codigo += '520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304';
    
    return codigo;
}

// ============================================
// ROTAS DE USUÁRIO
// ============================================

// GET /api/pagamentos
// Listar pagamentos do usuário autenticado
router.get('/', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const pagamentos = banco.buscarTodos('pagamentos', { usuarioId: req.usuario.id });

        res.json({
            sucesso: true,
            pagamentos
        });
    } catch (erro) {
        console.error('Erro ao listar pagamentos:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/pagamentos/:id
// Buscar pagamento específico
router.get('/:id', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const pagamento = banco.buscarPorId('pagamentos', id);

        if (!pagamento || pagamento.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pagamento não encontrado' 
            });
        }

        res.json({
            sucesso: true,
            pagamento
        });
    } catch (erro) {
        console.error('Erro ao buscar pagamento:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/pagamentos/pix/gerar
// Gerar pagamento PIX
router.post('/pix/gerar', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { pedidoId } = req.body;

        const pedido = banco.buscarPorId('pedidos', pedidoId);
        if (!pedido || pedido.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        const codigoPIX = gerarCodigoPIX();
        
        const pagamento = banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId: req.usuario.id,
            valor: pedido.total,
            metodo: 'pix',
            codigoPIX,
            status: 'pendente',
            expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: 'Código PIX gerado com sucesso',
            pagamento: {
                id: pagamento.id,
                codigoPIX,
                valor: pedido.total,
                expiraEm: pagamento.expiraEm
            }
        });
    } catch (erro) {
        console.error('Erro ao gerar PIX:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/pagamentos/cartao
// Processar pagamento com cartão
router.post('/cartao', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { pedidoId, numeroCartao, nomeCartao, validade, cvv, parcelas } = req.body;

        const pedido = banco.buscarPorId('pedidos', pedidoId);
        if (!pedido || pedido.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        // Validações básicas
        if (!numeroCartao || numeroCartao.replace(/\D/g, '').length < 13) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Número do cartão inválido' 
            });
        }

        if (!nomeCartao || nomeCartao.length < 3) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Nome no cartão inválido' 
            });
        }

        if (!validade || !/^\d{2}\/\d{2}$/.test(validade)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Data de validade inválida' 
            });
        }

        if (!cvv || cvv.length < 3) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'CVV inválido' 
            });
        }

        // Simular processamento
        const valorParcela = pedido.total / (parcelas || 1);

        const pagamento = banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId: req.usuario.id,
            valor: pedido.total,
            metodo: 'cartao',
            status: 'aprovado',
            detalhes: {
                bandeira: 'Visa',
                ultimosDigitos: numeroCartao.slice(-4),
                parcelas: parcelas || 1,
                valorParcela
            },
            criadoEm: new Date().toISOString()
        });

        // Atualizar pedido
        banco.atualizar('pedidos', pedido.id, {
            status: 'pago',
            atualizadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: 'Pagamento aprovado com sucesso',
            pagamento
        });
    } catch (erro) {
        console.error('Erro ao processar cartão:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/pagamentos/boleto
// Gerar boleto
router.post('/boleto', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { pedidoId } = req.body;

        const pedido = banco.buscarPorId('pedidos', pedidoId);
        if (!pedido || pedido.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pedido não encontrado' 
            });
        }

        const codigoBoleto = '34191.79001 01043.510047 91020.150008 7 ' + Date.now();

        const pagamento = banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId: req.usuario.id,
            valor: pedido.total,
            metodo: 'boleto',
            codigoBoleto,
            status: 'pendente',
            vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: 'Boleto gerado com sucesso',
            pagamento: {
                id: pagamento.id,
                codigoBoleto,
                valor: pedido.total,
                vencimento: pagamento.vencimento
            }
        });
    } catch (erro) {
        console.error('Erro ao gerar boleto:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/pagamentos/:id/reembolsar
// Solicitar reembolso
router.post('/:id/reembolsar', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const pagamento = banco.buscarPorId('pagamentos', id);

        if (!pagamento || pagamento.usuarioId !== req.usuario.id) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pagamento não encontrado' 
            });
        }

        if (pagamento.status !== 'aprovado') {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Apenas pagamentos aprovados podem ser reembolsados' 
            });
        }

        banco.atualizar('pagamentos', id, {
            status: 'reembolsado',
            reembolsadoEm: new Date().toISOString()
        });

        // Atualizar pedido
        const pedido = banco.buscarPorId('pedidos', pagamento.pedidoId);
        if (pedido) {
            banco.atualizar('pedidos', pedido.id, {
                status: 'cancelado',
                atualizadoEm: new Date().toISOString()
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Reembolso realizado com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao reembolsar:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/pagamentos/admin/todos
// Listar todos os pagamentos (admin)
router.get('/admin/todos', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { status, metodo, busca, limit, page } = req.query;

        let pagamentos = banco.buscarTodos('pagamentos');

        // Filtrar por status
        if (status) {
            pagamentos = pagamentos.filter(p => p.status === status);
        }

        // Filtrar por método
        if (metodo) {
            pagamentos = pagamentos.filter(p => p.metodo === metodo);
        }

        // Buscar por ID ou usuário
        if (busca) {
            pagamentos = pagamentos.filter(p => 
                p.id.toString().includes(busca) ||
                p.usuarioId.toString().includes(busca)
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = pagamentos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        pagamentos = pagamentos.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const pagamentosComUsuario = pagamentos.map(pagamento => {
            const usuario = banco.buscarPorId('usuarios', pagamento.usuarioId);
            return {
                ...pagamento,
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
            pagamentos: pagamentosComUsuario
        });
    } catch (erro) {
        console.error('Erro ao listar pagamentos admin:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/pagamentos/admin/:id/status
// Atualizar status do pagamento (admin)
router.put('/admin/:id/status', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const pagamento = banco.buscarPorId('pagamentos', id);

        if (!pagamento) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Pagamento não encontrado' 
            });
        }

        const statusValidos = ['pendente', 'aprovado', 'falhou', 'reembolsado', 'cancelado'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Status inválido' 
            });
        }

        banco.atualizar('pagamentos', id, {
            status,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pedido se necessário
        if (status === 'aprovado') {
            const pedido = banco.buscarPorId('pedidos', pagamento.pedidoId);
            if (pedido) {
                banco.atualizar('pedidos', pedido.id, {
                    status: 'pago',
                    atualizadoEm: new Date().toISOString()
                });
            }
        }

        res.json({
            sucesso: true,
            mensagem: 'Status do pagamento atualizado',
            pagamento: banco.buscarPorId('pagamentos', id)
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
