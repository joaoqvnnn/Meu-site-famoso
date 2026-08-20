// ============================================
// STREAMPREMIUM - ROTAS DE ASSINATURAS
// ============================================

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG, PLANS_CONFIG } = require('../config/configuracao');

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
// ROTAS PÚBLICAS
// ============================================

// GET /api/assinaturas/planos
// Listar planos disponíveis
router.get('/planos', (req, res) => {
    try {
        const planos = Object.keys(PLANS_CONFIG).map(key => ({
            id: key,
            nome: PLANS_CONFIG[key].nome,
            preco: PLANS_CONFIG[key].preco,
            recursos: PLANS_CONFIG[key].recursos
        }));

        res.json({
            sucesso: true,
            planos
        });
    } catch (erro) {
        console.error('Erro ao listar planos:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS DE USUÁRIO
// ============================================

// GET /api/assinaturas/minha
// Buscar assinatura do usuário autenticado
router.get('/minha', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const assinatura = banco.buscarUm('assinaturas', { usuarioId: req.usuario.id });

        res.json({
            sucesso: true,
            assinatura: assinatura || null
        });
    } catch (erro) {
        console.error('Erro ao buscar assinatura:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/assinaturas/assinar
// Criar/assinar um plano
router.post('/assinar', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { plano } = req.body;

        // Validar plano
        if (!PLANS_CONFIG[plano]) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Plano inválido' 
            });
        }

        // Buscar assinatura existente
        const assinaturaExistente = banco.buscarUm('assinaturas', { 
            usuarioId: req.usuario.id,
            status: 'ativa'
        });

        if (assinaturaExistente) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Você já possui uma assinatura ativa. Cancele antes de assinar outro plano.' 
            });
        }

        const valor = PLANS_CONFIG[plano].preco;

        // Criar assinatura
        const novaAssinatura = banco.inserir('assinaturas', {
            usuarioId: req.usuario.id,
            plano,
            valor,
            status: 'ativa',
            inicio: new Date().toISOString(),
            proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar plano do usuário
        banco.atualizar('usuarios', req.usuario.id, {
            plano,
            atualizadoEm: new Date().toISOString()
        });

        // Registrar pagamento
        banco.inserir('pagamentos', {
            usuarioId: req.usuario.id,
            assinaturaId: novaAssinatura.id,
            valor,
            metodo: 'cartao',
            status: 'aprovado',
            descricao: `Assinatura ${PLANS_CONFIG[plano].nome}`,
            criadoEm: new Date().toISOString()
        });

        res.status(201).json({
            sucesso: true,
            mensagem: `Assinatura ${PLANS_CONFIG[plano].nome} realizada com sucesso`,
            assinatura: novaAssinatura
        });
    } catch (erro) {
        console.error('Erro ao assinar plano:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/assinaturas/upgrade
// Fazer upgrade do plano
router.put('/upgrade', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const { novoPlano } = req.body;

        if (!PLANS_CONFIG[novoPlano]) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Plano inválido' 
            });
        }

        const assinatura = banco.buscarUm('assinaturas', { 
            usuarioId: req.usuario.id,
            status: 'ativa'
        });

        if (!assinatura) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Você não possui assinatura ativa' 
            });
        }

        const novoValor = PLANS_CONFIG[novoPlano].preco;

        banco.atualizar('assinaturas', assinatura.id, {
            plano: novoPlano,
            valor: novoValor,
            atualizadoEm: new Date().toISOString()
        });

        banco.atualizar('usuarios', req.usuario.id, {
            plano: novoPlano,
            atualizadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: `Plano atualizado para ${PLANS_CONFIG[novoPlano].nome}`,
            assinatura: banco.buscarPorId('assinaturas', assinatura.id)
        });
    } catch (erro) {
        console.error('Erro ao fazer upgrade:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// DELETE /api/assinaturas/cancelar
// Cancelar assinatura
router.delete('/cancelar', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const assinatura = banco.buscarUm('assinaturas', { 
            usuarioId: req.usuario.id,
            status: 'ativa'
        });

        if (!assinatura) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Você não possui assinatura ativa' 
            });
        }

        banco.atualizar('assinaturas', assinatura.id, {
            status: 'cancelada',
            canceladoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar usuário para plano gratuito
        banco.atualizar('usuarios', req.usuario.id, {
            plano: 'gratuito',
            atualizadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: true,
            mensagem: 'Assinatura cancelada com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao cancelar assinatura:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/assinaturas/historico
// Histórico de assinaturas do usuário
router.get('/historico', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const historico = banco.buscarTodos('assinaturas', { usuarioId: req.usuario.id });

        res.json({
            sucesso: true,
            historico
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/assinaturas/admin/todas
// Listar todas as assinaturas (admin)
router.get('/admin/todas', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { status, plano, busca, limit, page } = req.query;

        let assinaturas = banco.buscarTodos('assinaturas');

        // Filtrar por status
        if (status) {
            assinaturas = assinaturas.filter(a => a.status === status);
        }

        // Filtrar por plano
        if (plano) {
            assinaturas = assinaturas.filter(a => a.plano === plano);
        }

        // Buscar por usuário
        if (busca) {
            const termo = busca.toLowerCase();
            assinaturas = assinaturas.filter(a => 
                a.usuarioId.toString().includes(termo)
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = assinaturas.length;
        const totalPaginas = Math.ceil(total / limitNum);
        assinaturas = assinaturas.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const assinaturasComUsuario = assinaturas.map(assinatura => {
            const usuario = banco.buscarPorId('usuarios', assinatura.usuarioId);
            return {
                ...assinatura,
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
            assinaturas: assinaturasComUsuario
        });
    } catch (erro) {
        console.error('Erro ao listar assinaturas admin:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/assinaturas/admin/:id/status
// Atualizar status da assinatura (admin)
router.put('/admin/:id/status', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const assinatura = banco.buscarPorId('assinaturas', id);

        if (!assinatura) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Assinatura não encontrada' 
            });
        }

        const statusValidos = ['ativa', 'cancelada', 'expirada', 'pendente'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Status inválido' 
            });
        }

        banco.atualizar('assinaturas', id, {
            status,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar usuário se necessário
        if (status === 'cancelada' || status === 'expirada') {
            banco.atualizar('usuarios', assinatura.usuarioId, {
                plano: 'gratuito',
                atualizadoEm: new Date().toISOString()
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Status da assinatura atualizado',
            assinatura: banco.buscarPorId('assinaturas', id)
        });
    } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/assinaturas/admin/estatisticas
// Estatísticas de assinaturas (admin)
router.get('/admin/estatisticas', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const todasAssinaturas = banco.buscarTodos('assinaturas');

        const estatisticas = {
            total: todasAssinaturas.length,
            ativas: todasAssinaturas.filter(a => a.status === 'ativa').length,
            canceladas: todasAssinaturas.filter(a => a.status === 'cancelada').length,
            expiradas: todasAssinaturas.filter(a => a.status === 'expirada').length,
            pendentes: todasAssinaturas.filter(a => a.status === 'pendente').length,
            receitaMensal: todasAssinaturas
                .filter(a => a.status === 'ativa')
                .reduce((acc, a) => acc + a.valor, 0),
            porPlano: {
                gratuito: todasAssinaturas.filter(a => a.plano === 'gratuito').length,
                basico: todasAssinaturas.filter(a => a.plano === 'basico').length,
                premium: todasAssinaturas.filter(a => a.plano === 'premium').length,
                familia: todasAssinaturas.filter(a => a.plano === 'familia').length
            }
        };

        res.json({
            sucesso: true,
            estatisticas
        });
    } catch (erro) {
        console.error('Erro ao buscar estatísticas:', erro);
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
