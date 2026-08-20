// ============================================
// STREAMPREMIUM - CONTROLLER DE PEDIDOS
// ============================================

// ============================================
// CLASSE PEDIDO CONTROLLER
// ============================================
class PedidoController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    gerarNumeroPedido() {
        const ano = new Date().getFullYear();
        const numero = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        return `#SP-${ano}-${numero}`;
    }

    calcularTotais(itens, cupomCodigo = null) {
        let subtotal = 0;
        const itensDetalhados = [];

        for (const item of itens) {
            const produto = this.banco.buscarPorId('produtos', item.produtoId);

            if (!produto || produto.status !== 'disponivel') {
                throw new Error(`Produto ID ${item.produtoId} não encontrado ou indisponível`);
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
        if (cupomCodigo) {
            const cupom = this.banco.buscarUm('cupons', {
                codigo: cupomCodigo.toUpperCase(),
                status: 'ativo'
            });

            if (cupom) {
                if (new Date(cupom.validade) > new Date()) {
                    if (cupom.usos < cupom.maximoUsos) {
                        if (cupom.tipo === 'porcentagem') {
                            desconto = subtotal * (cupom.valor / 100);
                        } else {
                            desconto = cupom.valor;
                        }

                        this.banco.atualizar('cupons', cupom.id, {
                            usos: cupom.usos + 1
                        });
                    }
                }
            }
        }

        const total = subtotal - desconto;

        return {
            subtotal,
            desconto,
            total,
            itensDetalhados
        };
    }

    // ============================================
    // MÉTODOS DE USUÁRIO
    // ============================================

    criarPedido(usuarioId, dados) {
        try {
            const { itens, cupom, metodoPagamento } = dados;

            if (!itens || !Array.isArray(itens) || itens.length === 0) {
                return {
                    sucesso: false,
                    status: 400,
                    erro: 'Carrinho vazio'
                };
            }

            const totais = this.calcularTotais(itens, cupom);

            const novoPedido = this.banco.inserir('pedidos', {
                numero: this.gerarNumeroPedido(),
                usuarioId,
                itens: totais.itensDetalhados,
                subtotal: totais.subtotal,
                desconto: totais.desconto,
                total: totais.total,
                status: 'pendente',
                metodoPagamento: metodoPagamento || 'cartao',
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            });

            // Registrar pagamento pendente
            this.banco.inserir('pagamentos', {
                pedidoId: novoPedido.id,
                usuarioId,
                valor: totais.total,
                metodo: metodoPagamento || 'cartao',
                status: 'pendente',
                criadoEm: new Date().toISOString()
            });

            return {
                sucesso: true,
                status: 201,
                mensagem: 'Pedido criado com sucesso',
                pedido: novoPedido
            };
        } catch (erro) {
            return {
                sucesso: false,
                status: 400,
                erro: erro.message
            };
        }
    }

    listarPedidosUsuario(usuarioId) {
        const pedidos = this.banco.buscarTodos('pedidos', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            pedidos
        };
    }

    buscarPedidoUsuario(usuarioId, pedidoId) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido || pedido.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        return {
            sucesso: true,
            status: 200,
            pedido
        };
    }

    cancelarPedidoUsuario(usuarioId, pedidoId) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido || pedido.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        if (pedido.status !== 'pendente') {
            return {
                sucesso: false,
                status: 400,
                erro: 'Apenas pedidos pendentes podem ser cancelados'
            };
        }

        this.banco.atualizar('pedidos', pedidoId, {
            status: 'cancelado',
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pagamento
        const pagamento = this.banco.buscarUm('pagamentos', { pedidoId });
        if (pagamento) {
            this.banco.atualizar('pagamentos', pagamento.id, {
                status: 'cancelado'
            });
        }

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Pedido cancelado com sucesso'
        };
    }

    // ============================================
    // MÉTODOS ADMINISTRATIVOS
    // ============================================

    listarTodosPedidos(filtros = {}) {
        const { status, busca, limit, page } = filtros;

        let pedidos = this.banco.buscarTodos('pedidos');

        if (status) {
            pedidos = pedidos.filter(p => p.status === status);
        }

        if (busca) {
            const termo = busca.toLowerCase();
            pedidos = pedidos.filter(p =>
                p.numero.toLowerCase().includes(termo) ||
                p.usuarioId.toString().includes(termo)
            );
        }

        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = pedidos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        pedidos = pedidos.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const pedidosComUsuario = pedidos.map(pedido => {
            const usuario = this.banco.buscarPorId('usuarios', pedido.usuarioId);
            return {
                ...pedido,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null
            };
        });

        return {
            sucesso: true,
            status: 200,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            pedidos: pedidosComUsuario
        };
    }

    buscarPedidoAdmin(pedidoId) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        const usuario = this.banco.buscarPorId('usuarios', pedido.usuarioId);
        const pagamento = this.banco.buscarUm('pagamentos', { pedidoId });

        return {
            sucesso: true,
            status: 200,
            pedido: {
                ...pedido,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null,
                pagamento: pagamento || null
            }
        };
    }

    atualizarStatusPedido(pedidoId, novoStatus) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        const statusValidos = ['pendente', 'pago', 'processando', 'enviado', 'entregue', 'cancelado'];

        if (!statusValidos.includes(novoStatus)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Status inválido'
            };
        }

        this.banco.atualizar('pedidos', pedidoId, {
            status: novoStatus,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pagamento
        const pagamento = this.banco.buscarUm('pagamentos', { pedidoId });
        if (pagamento) {
            let statusPagamento = novoStatus;
            if (novoStatus === 'pago') statusPagamento = 'aprovado';
            if (novoStatus === 'cancelado') statusPagamento = 'cancelado';
            
            this.banco.atualizar('pagamentos', pagamento.id, {
                status: statusPagamento
            });
        }

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Status atualizado com sucesso',
            pedido: this.banco.buscarPorId('pedidos', pedidoId)
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    obterEstatisticas() {
        const pedidos = this.banco.buscarTodos('pedidos');

        const estatisticas = {
            total: pedidos.length,
            pagos: pedidos.filter(p => p.status === 'pago').length,
            pendentes: pedidos.filter(p => p.status === 'pendente').length,
            processando: pedidos.filter(p => p.status === 'processando').length,
            enviados: pedidos.filter(p => p.status === 'enviado').length,
            entregues: pedidos.filter(p => p.status === 'entregue').length,
            cancelados: pedidos.filter(p => p.status === 'cancelado').length,
            receitaTotal: pedidos
                .filter(p => p.status === 'pago')
                .reduce((acc, p) => acc + p.total, 0)
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
module.exports = PedidoController;
