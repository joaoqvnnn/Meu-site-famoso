// ============================================
// STREAMPREMIUM - CONTROLLER DE PAGAMENTOS
// ============================================

// ============================================
// CLASSE PAGAMENTO CONTROLLER
// ============================================
class PagamentoController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    gerarCodigoPIX() {
        const caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let codigo = '00020126580014BR.GOV.BCB.PIX0136';

        for (let i = 0; i < 32; i++) {
            codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
        }

        codigo += '520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304';

        return codigo;
    }

    gerarCodigoBoleto() {
        const timestamp = Date.now();
        return `34191.79001 01043.510047 91020.150008 7 ${timestamp}`;
    }

    validarCartao(numeroCartao) {
        return numeroCartao && numeroCartao.replace(/\D/g, '').length >= 13;
    }

    validarValidade(validade) {
        return validade && /^\d{2}\/\d{2}$/.test(validade);
    }

    validarCVV(cvv) {
        return cvv && cvv.length >= 3 && cvv.length <= 4;
    }

    // ============================================
    // MÉTODOS DE USUÁRIO
    // ============================================

    listarPagamentosUsuario(usuarioId) {
        const pagamentos = this.banco.buscarTodos('pagamentos', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            pagamentos
        };
    }

    buscarPagamentoUsuario(usuarioId, pagamentoId) {
        const pagamento = this.banco.buscarPorId('pagamentos', pagamentoId);

        if (!pagamento || pagamento.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pagamento não encontrado'
            };
        }

        return {
            sucesso: true,
            status: 200,
            pagamento
        };
    }

    gerarPix(usuarioId, pedidoId) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido || pedido.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        const codigoPIX = this.gerarCodigoPIX();

        const pagamento = this.banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId,
            valor: pedido.total,
            metodo: 'pix',
            codigoPIX,
            status: 'pendente',
            expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Código PIX gerado com sucesso',
            pagamento: {
                id: pagamento.id,
                codigoPIX,
                valor: pedido.total,
                expiraEm: pagamento.expiraEm
            }
        };
    }

    processarCartao(usuarioId, dados) {
        const { pedidoId, numeroCartao, nomeCartao, validade, cvv, parcelas } = dados;

        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido || pedido.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        // Validações
        if (!this.validarCartao(numeroCartao)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Número do cartão inválido'
            };
        }

        if (!nomeCartao || nomeCartao.length < 3) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Nome no cartão inválido'
            };
        }

        if (!this.validarValidade(validade)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Data de validade inválida'
            };
        }

        if (!this.validarCVV(cvv)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'CVV inválido'
            };
        }

        const numParcelas = parseInt(parcelas) || 1;
        const valorParcela = pedido.total / numParcelas;

        const pagamento = this.banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId,
            valor: pedido.total,
            metodo: 'cartao',
            status: 'aprovado',
            detalhes: {
                bandeira: 'Visa',
                ultimosDigitos: numeroCartao.slice(-4),
                parcelas: numParcelas,
                valorParcela
            },
            criadoEm: new Date().toISOString()
        });

        // Atualizar pedido
        this.banco.atualizar('pedidos', pedido.id, {
            status: 'pago',
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Pagamento aprovado com sucesso',
            pagamento
        };
    }

    gerarBoleto(usuarioId, pedidoId) {
        const pedido = this.banco.buscarPorId('pedidos', pedidoId);

        if (!pedido || pedido.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pedido não encontrado'
            };
        }

        const codigoBoleto = this.gerarCodigoBoleto();

        const pagamento = this.banco.inserir('pagamentos', {
            pedidoId: pedido.id,
            usuarioId,
            valor: pedido.total,
            metodo: 'boleto',
            codigoBoleto,
            status: 'pendente',
            vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Boleto gerado com sucesso',
            pagamento: {
                id: pagamento.id,
                codigoBoleto,
                valor: pedido.total,
                vencimento: pagamento.vencimento
            }
        };
    }

    reembolsarPagamento(usuarioId, pagamentoId) {
        const pagamento = this.banco.buscarPorId('pagamentos', pagamentoId);

        if (!pagamento || pagamento.usuarioId !== usuarioId) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pagamento não encontrado'
            };
        }

        if (pagamento.status !== 'aprovado') {
            return {
                sucesso: false,
                status: 400,
                erro: 'Apenas pagamentos aprovados podem ser reembolsados'
            };
        }

        this.banco.atualizar('pagamentos', pagamentoId, {
            status: 'reembolsado',
            reembolsadoEm: new Date().toISOString()
        });

        // Atualizar pedido
        const pedido = this.banco.buscarPorId('pedidos', pagamento.pedidoId);
        if (pedido) {
            this.banco.atualizar('pedidos', pedido.id, {
                status: 'cancelado',
                atualizadoEm: new Date().toISOString()
            });
        }

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Reembolso realizado com sucesso'
        };
    }

    // ============================================
    // MÉTODOS ADMINISTRATIVOS
    // ============================================

    listarTodosPagamentos(filtros = {}) {
        const { status, metodo, busca, limit, page } = filtros;

        let pagamentos = this.banco.buscarTodos('pagamentos');

        if (status) {
            pagamentos = pagamentos.filter(p => p.status === status);
        }

        if (metodo) {
            pagamentos = pagamentos.filter(p => p.metodo === metodo);
        }

        if (busca) {
            pagamentos = pagamentos.filter(p =>
                p.id.toString().includes(busca) ||
                p.usuarioId.toString().includes(busca)
            );
        }

        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = pagamentos.length;
        const totalPaginas = Math.ceil(total / limitNum);
        pagamentos = pagamentos.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const pagamentosComUsuario = pagamentos.map(pagamento => {
            const usuario = this.banco.buscarPorId('usuarios', pagamento.usuarioId);
            return {
                ...pagamento,
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
            pagamentos: pagamentosComUsuario
        };
    }

    buscarPagamentoAdmin(pagamentoId) {
        const pagamento = this.banco.buscarPorId('pagamentos', pagamentoId);

        if (!pagamento) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pagamento não encontrado'
            };
        }

        const usuario = this.banco.buscarPorId('usuarios', pagamento.usuarioId);
        const pedido = this.banco.buscarPorId('pedidos', pagamento.pedidoId);

        return {
            sucesso: true,
            status: 200,
            pagamento: {
                ...pagamento,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null,
                pedido: pedido ? {
                    numero: pedido.numero,
                    status: pedido.status
                } : null
            }
        };
    }

    atualizarStatusPagamento(pagamentoId, novoStatus) {
        const pagamento = this.banco.buscarPorId('pagamentos', pagamentoId);

        if (!pagamento) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Pagamento não encontrado'
            };
        }

        const statusValidos = ['pendente', 'aprovado', 'falhou', 'reembolsado', 'cancelado'];

        if (!statusValidos.includes(novoStatus)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Status inválido'
            };
        }

        this.banco.atualizar('pagamentos', pagamentoId, {
            status: novoStatus,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar pedido se necessário
        if (novoStatus === 'aprovado') {
            const pedido = this.banco.buscarPorId('pedidos', pagamento.pedidoId);
            if (pedido) {
                this.banco.atualizar('pedidos', pedido.id, {
                    status: 'pago',
                    atualizadoEm: new Date().toISOString()
                });
            }
        }

        if (novoStatus === 'cancelado') {
            const pedido = this.banco.buscarPorId('pedidos', pagamento.pedidoId);
            if (pedido) {
                this.banco.atualizar('pedidos', pedido.id, {
                    status: 'cancelado',
                    atualizadoEm: new Date().toISOString()
                });
            }
        }

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Status atualizado com sucesso',
            pagamento: this.banco.buscarPorId('pagamentos', pagamentoId)
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    obterEstatisticas() {
        const pagamentos = this.banco.buscarTodos('pagamentos');

        const estatisticas = {
            total: pagamentos.length,
            aprovados: pagamentos.filter(p => p.status === 'aprovado').length,
            pendentes: pagamentos.filter(p => p.status === 'pendente').length,
            falhas: pagamentos.filter(p => p.status === 'falhou').length,
            reembolsados: pagamentos.filter(p => p.status === 'reembolsado').length,
            cancelados: pagamentos.filter(p => p.status === 'cancelado').length,
            receitaTotal: pagamentos
                .filter(p => p.status === 'aprovado')
                .reduce((acc, p) => acc + p.valor, 0),
            porMetodo: {
                cartao: pagamentos.filter(p => p.metodo === 'cartao').length,
                pix: pagamentos.filter(p => p.metodo === 'pix').length,
                boleto: pagamentos.filter(p => p.metodo === 'boleto').length
            }
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
module.exports = PagamentoController;
