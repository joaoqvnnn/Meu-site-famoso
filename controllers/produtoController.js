// ============================================
// STREAMPREMIUM - CONTROLLER DE PRODUTOS
// ============================================

// ============================================
// CLASSE PRODUTO CONTROLLER
// ============================================
class ProdutoController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // MÉTODOS PÚBLICOS
    // ============================================

    listarProdutos(filtros = {}) {
        const { tipo, genero, busca, destaque, limit, page, status } = filtros;

        let produtos = this.banco.buscarTodos('produtos', { 
            status: status || 'disponivel' 
        });

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
            produtos = produtos.filter(p => p.destaque === (destaque === 'true' || destaque === true));
        }

        // Buscar por texto
        if (busca) {
            const termo = busca.toLowerCase();
            produtos = produtos.filter(p =>
                p.titulo.toLowerCase().includes(termo) ||
                p.genero.toLowerCase().includes(termo) ||
                (p.descricao && p.descricao.toLowerCase().includes(termo))
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = produtos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        produtos = produtos.slice(offset, offset + limitNum);

        return {
            sucesso: true,
            status: 200,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            produtos
        };
    }

    listarDestaques() {
        const produtos = this.banco.buscarTodos('produtos', {
            status: 'disponivel',
            destaque: true
        });

        return {
            sucesso: true,
            status: 200,
            produtos
        };
    }

    listarCategorias() {
        const produtos = this.banco.buscarTodos('produtos');
        const categorias = [...new Set(produtos.map(p => p.genero))].sort();

        return {
            sucesso: true,
            status: 200,
            categorias
        };
    }

    buscarProduto(produtoId) {
        const produto = this.banco.buscarPorId('produtos', produtoId);

        if (!produto || produto.status !== 'disponivel') {
            return {
                sucesso: false,
                status: 404,
                erro: 'Produto não encontrado'
            };
        }

        return {
            sucesso: true,
            status: 200,
            produto
        };
    }

    listarAvaliacoes(produtoId) {
        const avaliacoes = this.banco.buscarTodos('avaliacoes', { produtoId });

        return {
            sucesso: true,
            status: 200,
            avaliacoes
        };
    }

    adicionarAvaliacao(produtoId, dados) {
        const { usuarioId, nota, comentario } = dados;
        const produto = this.banco.buscarPorId('produtos', produtoId);

        if (!produto) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Produto não encontrado'
            };
        }

        if (!nota || nota < 1 || nota > 10) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Nota deve estar entre 1 e 10'
            };
        }

        const novaAvaliacao = this.banco.inserir('avaliacoes', {
            produtoId,
            usuarioId: usuarioId || null,
            nota,
            comentario: comentario || '',
            criadoEm: new Date().toISOString()
        });

        // Atualizar média de avaliação
        const avaliacoes = this.banco.buscarTodos('avaliacoes', { produtoId });
        const media = avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length;

        this.banco.atualizar('produtos', produtoId, {
            avaliacao: parseFloat(media.toFixed(1)),
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Avaliação adicionada com sucesso',
            avaliacao: novaAvaliacao
        };
    }

    // ============================================
    // MÉTODOS ADMINISTRATIVOS
    // ============================================

    criarProduto(dados) {
        const { titulo, tipo, genero, ano, duracao, preco, descricao, destaque } = dados;

        // Validações
        if (!titulo || titulo.trim().length < 2) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Título é obrigatório'
            };
        }

        if (!tipo || !['filme', 'serie', 'documentario'].includes(tipo)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Tipo inválido. Use: filme, serie ou documentario'
            };
        }

        if (!preco || preco <= 0) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Preço deve ser maior que zero'
            };
        }

        const novoProduto = this.banco.inserir('produtos', {
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

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Produto criado com sucesso',
            produto: novoProduto
        };
    }

    atualizarProduto(produtoId, dados) {
        const produto = this.banco.buscarPorId('produtos', produtoId);

        if (!produto) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Produto não encontrado'
            };
        }

        const { titulo, tipo, genero, ano, duracao, preco, descricao, destaque, status } = dados;
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

        this.banco.atualizar('produtos', produtoId, dadosAtualizados);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Produto atualizado com sucesso',
            produto: this.banco.buscarPorId('produtos', produtoId)
        };
    }

    excluirProduto(produtoId) {
        const produto = this.banco.buscarPorId('produtos', produtoId);

        if (!produto) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Produto não encontrado'
            };
        }

        this.banco.remover('produtos', produtoId);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Produto excluído com sucesso'
        };
    }

    listarTodosProdutos(filtros = {}) {
        const { tipo, genero, busca, status, limit, page } = filtros;

        let produtos = this.banco.buscarTodos('produtos');

        if (tipo) {
            produtos = produtos.filter(p => p.tipo === tipo);
        }

        if (genero) {
            produtos = produtos.filter(p => p.genero === genero);
        }

        if (status) {
            produtos = produtos.filter(p => p.status === status);
        }

        if (busca) {
            const termo = busca.toLowerCase();
            produtos = produtos.filter(p =>
                p.titulo.toLowerCase().includes(termo) ||
                p.genero.toLowerCase().includes(termo)
            );
        }

        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = produtos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        produtos = produtos.slice(offset, offset + limitNum);

        return {
            sucesso: true,
            status: 200,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            produtos
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    obterEstatisticas() {
        const produtos = this.banco.buscarTodos('produtos');

        const estatisticas = {
            total: produtos.length,
            disponiveis: produtos.filter(p => p.status === 'disponivel').length,
            indisponiveis: produtos.filter(p => p.status !== 'disponivel').length,
            destaques: produtos.filter(p => p.destaque).length,
            porTipo: {
                filmes: produtos.filter(p => p.tipo === 'filme').length,
                series: produtos.filter(p => p.tipo === 'serie').length,
                documentarios: produtos.filter(p => p.tipo === 'documentario').length
            },
            mediaAvaliacao: produtos.reduce((acc, p) => acc + (p.avaliacao || 0), 0) / produtos.length
        };

        return {
            sucesso: true,
            status: 200,
            estatisticas
        };
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = ProdutoController;
