// ============================================
// STREAMPREMIUM - CONTROLLER DE USUÁRIOS
// ============================================

const bcrypt = require('bcryptjs');
const { SECURITY_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE USUARIO CONTROLLER
// ============================================
class UsuarioController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // MÉTODOS DE PERFIL
    // ============================================

    buscarPerfil(usuarioId) {
        const usuario = this.banco.buscarPorId('usuarios', usuarioId);

        if (!usuario) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Usuário não encontrado'
            };
        }

        return {
            sucesso: true,
            status: 200,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cpf: usuario.cpf,
                telefone: usuario.telefone,
                plano: usuario.plano,
                status: usuario.status,
                verificado: usuario.verificado || false,
                criadoEm: usuario.criadoEm,
                ultimoAcesso: usuario.ultimoAcesso
            }
        };
    }

    atualizarPerfil(usuarioId, dados) {
        const { nome, telefone, cpf } = dados;
        const usuario = this.banco.buscarPorId('usuarios', usuarioId);

        if (!usuario) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Usuário não encontrado'
            };
        }

        // Validar nome
        if (nome !== undefined && nome.trim().length < 3) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Nome deve ter no mínimo 3 caracteres'
            };
        }

        const dadosAtualizados = {
            atualizadoEm: new Date().toISOString()
        };

        if (nome) dadosAtualizados.nome = nome.trim();
        if (telefone) dadosAtualizados.telefone = telefone;
        if (cpf) dadosAtualizados.cpf = cpf;

        this.banco.atualizar('usuarios', usuarioId, dadosAtualizados);

        const usuarioAtualizado = this.banco.buscarPorId('usuarios', usuarioId);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Perfil atualizado com sucesso',
            usuario: {
                id: usuarioAtualizado.id,
                nome: usuarioAtualizado.nome,
                email: usuarioAtualizado.email,
                telefone: usuarioAtualizado.telefone,
                cpf: usuarioAtualizado.cpf
            }
        };
    }

    async alterarSenha(usuarioId, dados) {
        const { senhaAtual, novaSenha } = dados;
        const usuario = this.banco.buscarPorId('usuarios', usuarioId);

        if (!usuario) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Usuário não encontrado'
            };
        }

        if (!senhaAtual || !novaSenha) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Senha atual e nova senha são obrigatórias'
            };
        }

        // Verificar senha atual
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaValida) {
            return {
                sucesso: false,
                status: 401,
                erro: 'Senha atual incorreta'
            };
        }

        // Validar nova senha
        if (novaSenha.length < SECURITY_CONFIG.senhaMinLength) {
            return {
                sucesso: false,
                status: 400,
                erro: `Nova senha deve ter no mínimo ${SECURITY_CONFIG.senhaMinLength} caracteres`
            };
        }

        // Hash da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, SECURITY_CONFIG.bcryptSaltRounds);

        this.banco.atualizar('usuarios', usuarioId, {
            senha: senhaHash,
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Senha alterada com sucesso'
        };
    }

    async excluirConta(usuarioId, senha) {
        const usuario = this.banco.buscarPorId('usuarios', usuarioId);

        if (!usuario) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Usuário não encontrado'
            };
        }

        // Verificar senha
        if (senha) {
            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return {
                    sucesso: false,
                    status: 401,
                    erro: 'Senha incorreta'
                };
            }
        }

        // Excluir registros relacionados
        this.banco.remover('usuarios', usuarioId);

        // Excluir assinatura
        const assinatura = this.banco.buscarUm('assinaturas', { usuarioId });
        if (assinatura) {
            this.banco.remover('assinaturas', assinatura.id);
        }

        // Excluir pedidos
        const pedidos = this.banco.buscarTodos('pedidos', { usuarioId });
        pedidos.forEach(pedido => {
            this.banco.remover('pedidos', pedido.id);
        });

        // Excluir pagamentos
        const pagamentos = this.banco.buscarTodos('pagamentos', { usuarioId });
        pagamentos.forEach(pagamento => {
            this.banco.remover('pagamentos', pagamento.id);
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Conta excluída com sucesso'
        };
    }

    // ============================================
    // MÉTODOS DE PEDIDOS
    // ============================================

    listarPedidos(usuarioId) {
        const pedidos = this.banco.buscarTodos('pedidos', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            pedidos
        };
    }

    buscarPedido(usuarioId, pedidoId) {
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

    cancelarPedido(usuarioId, pedidoId) {
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

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Pedido cancelado com sucesso'
        };
    }

    // ============================================
    // MÉTODOS DE ASSINATURA
    // ============================================

    buscarAssinatura(usuarioId) {
        const assinatura = this.banco.buscarUm('assinaturas', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            assinatura: assinatura || null
        };
    }

    criarAssinatura(usuarioId, plano) {
        const planosValidos = ['gratuito', 'basico', 'premium', 'familia'];
        
        if (!planosValidos.includes(plano)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Plano inválido'
            };
        }

        const assinaturaExistente = this.banco.buscarUm('assinaturas', { 
            usuarioId,
            status: 'ativa'
        });

        if (assinaturaExistente) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Você já possui uma assinatura ativa'
            };
        }

        const valores = {
            gratuito: 0,
            basico: 14.90,
            premium: 29.90,
            familia: 49.90
        };

        const novaAssinatura = this.banco.inserir('assinaturas', {
            usuarioId,
            plano,
            valor: valores[plano],
            status: 'ativa',
            inicio: new Date().toISOString(),
            proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            criadoEm: new Date().toISOString()
        });

        this.banco.atualizar('usuarios', usuarioId, {
            plano,
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Assinatura criada com sucesso',
            assinatura: novaAssinatura
        };
    }

    cancelarAssinatura(usuarioId) {
        const assinatura = this.banco.buscarUm('assinaturas', { 
            usuarioId,
            status: 'ativa'
        });

        if (!assinatura) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Você não possui assinatura ativa'
            };
        }

        this.banco.atualizar('assinaturas', assinatura.id, {
            status: 'cancelada',
            canceladoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        this.banco.atualizar('usuarios', usuarioId, {
            plano: 'gratuito',
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Assinatura cancelada com sucesso'
        };
    }

    // ============================================
    // MÉTODOS DE PRODUTOS COMPRADOS
    // ============================================

    listarProdutosComprados(usuarioId) {
        const pedidos = this.banco.buscarTodos('pedidos', { 
            usuarioId,
            status: 'pago'
        });

        let produtos = [];
        pedidos.forEach(pedido => {
            pedido.itens.forEach(item => {
                const produto = this.banco.buscarPorId('produtos', item.produtoId);
                if (produto) {
                    produtos.push({
                        ...produto,
                        dataCompra: pedido.criadoEm,
                        numeroPedido: pedido.numero
                    });
                }
            });
        });

        return {
            sucesso: true,
            status: 200,
            produtos
        };
    }

    // ============================================
    // MÉTODOS DE PAGAMENTOS
    // ============================================

    listarPagamentos(usuarioId) {
        const pagamentos = this.banco.buscarTodos('pagamentos', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            pagamentos
        };
    }

    buscarPagamento(usuarioId, pagamentoId) {
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
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = UsuarioController;
