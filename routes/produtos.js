// ============================================
// STREAMPREMIUM - ROTAS DE PRODUTOS
// ============================================

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/configuracao');

const router = express.Router();

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO (OPCIONAL PARA ADMIN)
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
// ROTAS PÚBLICAS
// ============================================

// GET /api/produtos
// Listar todos os produtos disponíveis
router.get('/', (req, res) => {
    try {
        const banco = req.banco;
        const { tipo, genero, busca, destaque, limit, page } = req.query;

        let produtos = banco.buscarTodos('produtos', { status: 'disponivel' });

        // Filtrar por tipo
        if (tipo) {
            produtos = produtos.filter(p => p.tipo === tipo);
        }

        // Filtrar por gênero
        if (genero) {
            produtos = produtos.filter(p => p.genero === genero);
        }

        // Filtrar por destaque
        if (destaque !== undefined) {
            produtos = produtos.filter(p => p.destaque === (destaque === 'true'));
        }

        // Buscar por texto
        if (busca) {
            const termo = busca.toLowerCase();
            produtos = produtos.filter(p => 
                p.titulo.toLowerCase().includes(termo) ||
                p.genero.toLowerCase().includes(termo) ||
                p.descricao.toLowerCase().includes(termo)
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = produtos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        produtos = produtos.slice(offset, offset + limitNum);

        res.json({
            sucesso: true,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            produtos
        });
    } catch (erro) {
        console.error('Erro ao listar produtos:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/produtos/destaques
// Listar produtos em destaque
router.get('/destaques', (req, res) => {
    try {
        const banco = req.banco;
        const produtos = banco.buscarTodos('produtos', { 
            status: 'disponivel',
            destaque: true
        });

        res.json({
            sucesso: true,
            produtos
        });
    } catch (erro) {
        console.error('Erro ao listar destaques:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/produtos/categorias
// Listar categorias/gêneros disponíveis
router.get('/categorias', (req, res) => {
    try {
        const banco = req.banco;
        const produtos = banco.buscarTodos('produtos');
        const categorias = [...new Set(produtos.map(p => p.genero))].sort();

        res.json({
            sucesso: true,
            categorias
        });
    } catch (erro) {
        console.error('Erro ao listar categorias:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/produtos/:id
// Buscar produto por ID
router.get('/:id', (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const produto = banco.buscarPorId('produtos', id);

        if (!produto || produto.status !== 'disponivel') {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Produto não encontrado' 
            });
        }

        res.json({
            sucesso: true,
            produto
        });
    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/produtos/:id/avaliacoes
// Buscar avaliações de um produto
router.get('/:id/avaliacoes', (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const avaliacoes = banco.buscarTodos('avaliacoes', { produtoId: id });

        res.json({
            sucesso: true,
            avaliacoes
        });
    } catch (erro) {
        console.error('Erro ao buscar avaliações:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// POST /api/produtos
// Criar novo produto (admin)
router.post('/', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { titulo, tipo, genero, ano, duracao, preco, descricao, destaque } = req.body;

        // Validações
        if (!titulo || titulo.trim().length < 2) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Título é obrigatório' 
            });
        }

        if (!tipo || !['filme', 'serie', 'documentario'].includes(tipo)) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Tipo inválido. Use: filme, serie ou documentario' 
            });
        }

        if (!preco || preco <= 0) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Preço deve ser maior que zero' 
            });
        }

        const novoProduto = banco.inserir('produtos', {
            titulo: titulo.trim(),
            tipo,
            genero: genero || 'Outros',
            ano: ano || new Date().getFullYear(),
            duracao: duracao || '',
            avaliacao: 0,
            preco,
            descricao: descricao || '',
            status: 'disponivel',
            destaque: destaque || false,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Produto criado com sucesso',
            produto: novoProduto
        });
    } catch (erro) {
        console.error('Erro ao criar produto:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// PUT /api/produtos/:id
// Atualizar produto (admin)
router.put('/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const produto = banco.buscarPorId('produtos', id);

        if (!produto) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Produto não encontrado' 
            });
        }

        const { titulo, tipo, genero, ano, duracao, preco, descricao, destaque, status } = req.body;

        const dadosAtualizados = {
            atualizadoEm: new Date().toISOString()
        };

        if (titulo) dadosAtualizados.titulo = titulo.trim();
        if (tipo) dadosAtualizados.tipo = tipo;
        if (genero) dadosAtualizados.genero = genero;
        if (ano) dadosAtualizados.ano = ano;
        if (duracao) dadosAtualizados.duracao = duracao;
        if (preco) dadosAtualizados.preco = preco;
        if (descricao) dadosAtualizados.descricao = descricao;
        if (destaque !== undefined) dadosAtualizados.destaque = destaque;
        if (status) dadosAtualizados.status = status;

        banco.atualizar('produtos', id, dadosAtualizados);

        const produtoAtualizado = banco.buscarPorId('produtos', id);

        res.json({
            sucesso: true,
            mensagem: 'Produto atualizado com sucesso',
            produto: produtoAtualizado
        });
    } catch (erro) {
        console.error('Erro ao atualizar produto:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// DELETE /api/produtos/:id
// Excluir produto (admin)
router.delete('/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const produto = banco.buscarPorId('produtos', id);

        if (!produto) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Produto não encontrado' 
            });
        }

        banco.remover('produtos', id);

        res.json({
            sucesso: true,
            mensagem: 'Produto excluído com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao excluir produto:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/produtos/:id/avaliacoes
// Adicionar avaliação a um produto
router.post('/:id/avaliacoes', (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const { usuarioId, nota, comentario } = req.body;
        const produto = banco.buscarPorId('produtos', id);

        if (!produto) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Produto não encontrado' 
            });
        }

        if (!nota || nota < 1 || nota > 10) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Nota deve estar entre 1 e 10' 
            });
        }

        const novaAvaliacao = banco.inserir('avaliacoes', {
            produtoId: id,
            usuarioId: usuarioId || null,
            nota,
            comentario: comentario || '',
            criadoEm: new Date().toISOString()
        });

        // Atualizar média de avaliação do produto
        const avaliacoes = banco.buscarTodos('avaliacoes', { produtoId: id });
        const media = avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length;
        
        banco.atualizar('produtos', id, {
            avaliacao: parseFloat(media.toFixed(1)),
            atualizadoEm: new Date().toISOString()
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Avaliação adicionada com sucesso',
            avaliacao: novaAvaliacao
        });
    } catch (erro) {
        console.error('Erro ao adicionar avaliação:', erro);
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
