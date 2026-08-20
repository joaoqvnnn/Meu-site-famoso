// ============================================
// STREAMPREMIUM - CONTROLLER DE ASSINATURAS
// ============================================

const { PLANS_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE ASSINATURA CONTROLLER
// ============================================
class AssinaturaController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    obterPlanos() {
        return Object.keys(PLANS_CONFIG).map(key => ({
            id: key,
            nome: PLANS_CONFIG[key].nome,
            preco: PLANS_CONFIG[key].preco,
            recursos: PLANS_CONFIG[key].recursos
        }));
    }

    validarPlano(plano) {
        return PLANS_CONFIG[plano] !== undefined;
    }

    calcularProximaCobranca() {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    // ============================================
    // MÉTODOS PÚBLICOS
    // ============================================

    listarPlanos() {
        const planos = this.obterPlanos();

        return {
            sucesso: true,
            status: 200,
            planos
        };
    }

    // ============================================
    // MÉTODOS DE USUÁRIO
    // ============================================

    buscarAssinaturaUsuario(usuarioId) {
        const assinatura = this.banco.buscarUm('assinaturas', { 
            usuarioId,
            status: 'ativa'
        });

        return {
            sucesso: true,
            status: 200,
            assinatura: assinatura || null
        };
    }

    criarAssinatura(usuarioId, plano) {
        if (!this.validarPlano(plano)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Plano inválido'
            };
        }

        // Verificar se já tem assinatura ativa
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

        const valor = PLANS_CONFIG[plano].preco;

        const novaAssinatura = this.banco.inserir('assinaturas', {
            usuarioId,
            plano,
            valor,
            status: 'ativa',
            inicio: new Date().toISOString(),
            proximaCobranca: this.calcularProximaCobranca(),
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar plano do usuário
        this.banco.atualizar('usuarios', usuarioId, {
            plano,
            atualizadoEm: new Date().toISOString()
        });

        // Registrar pagamento
        this.banco.inserir('pagamentos', {
            usuarioId,
            assinaturaId: novaAssinatura.id,
            valor,
            metodo: 'cartao',
            status: 'aprovado',
            descricao: `Assinatura ${PLANS_CONFIG[plano].nome}`,
            criadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: `Assinatura ${PLANS_CONFIG[plano].nome} realizada com sucesso`,
            assinatura: novaAssinatura
        };
    }

    fazerUpgrade(usuarioId, novoPlano) {
        if (!this.validarPlano(novoPlano)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Plano inválido'
            };
        }

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

        const novoValor = PLANS_CONFIG[novoPlano].preco;

        this.banco.atualizar('assinaturas', assinatura.id, {
            plano: novoPlano,
            valor: novoValor,
            atualizadoEm: new Date().toISOString()
        });

        this.banco.atualizar('usuarios', usuarioId, {
            plano: novoPlano,
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: `Plano atualizado para ${PLANS_CONFIG[novoPlano].nome}`,
            assinatura: this.banco.buscarPorId('assinaturas', assinatura.id)
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

    listarHistoricoUsuario(usuarioId) {
        const historico = this.banco.buscarTodos('assinaturas', { usuarioId });

        return {
            sucesso: true,
            status: 200,
            historico
        };
    }

    // ============================================
    // MÉTODOS ADMINISTRATIVOS
    // ============================================

    listarTodasAssinaturas(filtros = {}) {
        const { status, plano, busca, limit, page } = filtros;

        let assinaturas = this.banco.buscarTodos('assinaturas');

        if (status) {
            assinaturas = assinaturas.filter(a => a.status === status);
        }

        if (plano) {
            assinaturas = assinaturas.filter(a => a.plano === plano);
        }

        if (busca) {
            assinaturas = assinaturas.filter(a =>
                a.usuarioId.toString().includes(busca)
            );
        }

        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = assinaturas.length;
        const totalPaginas = Math.ceil(total / limitNum);
        assinaturas = assinaturas.slice(offset, offset + limitNum);

        // Adicionar informações do usuário
        const assinaturasComUsuario = assinaturas.map(assinatura => {
            const usuario = this.banco.buscarPorId('usuarios', assinatura.usuarioId);
            return {
                ...assinatura,
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
            assinaturas: assinaturasComUsuario
        };
    }

    buscarAssinaturaAdmin(assinaturaId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Assinatura não encontrada'
            };
        }

        const usuario = this.banco.buscarPorId('usuarios', assinatura.usuarioId);

        return {
            sucesso: true,
            status: 200,
            assinatura: {
                ...assinatura,
                usuario: usuario ? {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                } : null
            }
        };
    }

    atualizarStatusAssinatura(assinaturaId, novoStatus) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Assinatura não encontrada'
            };
        }

        const statusValidos = ['ativa', 'cancelada', 'expirada', 'pendente'];

        if (!statusValidos.includes(novoStatus)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Status inválido'
            };
        }

        this.banco.atualizar('assinaturas', assinaturaId, {
            status: novoStatus,
            atualizadoEm: new Date().toISOString()
        });

        // Atualizar usuário se necessário
        if (novoStatus === 'cancelada' || novoStatus === 'expirada') {
            this.banco.atualizar('usuarios', assinatura.usuarioId, {
                plano: 'gratuito',
                atualizadoEm: new Date().toISOString()
            });
        }

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Status da assinatura atualizado',
            assinatura: this.banco.buscarPorId('assinaturas', assinaturaId)
        };
    }

    excluirAssinatura(assinaturaId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Assinatura não encontrada'
            };
        }

        this.banco.remover('assinaturas', assinaturaId);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Assinatura excluída com sucesso'
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    obterEstatisticas() {
        const assinaturas = this.banco.buscarTodos('assinaturas');

        const estatisticas = {
            total: assinaturas.length,
            ativas: assinaturas.filter(a => a.status === 'ativa').length,
            canceladas: assinaturas.filter(a => a.status === 'cancelada').length,
            expiradas: assinaturas.filter(a => a.status === 'expirada').length,
            pendentes: assinaturas.filter(a => a.status === 'pendente').length,
            receitaMensal: assinaturas
                .filter(a => a.status === 'ativa')
                .reduce((acc, a) => acc + a.valor, 0),
            porPlano: {
                gratuito: assinaturas.filter(a => a.plano === 'gratuito').length,
                basico: assinaturas.filter(a => a.plano === 'basico').length,
                premium: assinaturas.filter(a => a.plano === 'premium').length,
                familia: assinaturas.filter(a => a.plano === 'familia').length
            },
            renovacoesHoje: assinaturas.filter(a => {
                const proximaCobranca = new Date(a.proximaCobranca);
                const hoje = new Date();
                return proximaCobranca.toDateString() === hoje.toDateString();
            }).length
        };

        return {
            sucesso: true,
            status: 200,
            estatisticas
        };
    }

    // ============================================
    // MÉTODOS DE RENOVAÇÃO
    // ============================================

    renovarAssinatura(assinaturaId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Assinatura não encontrada'
            };
        }

        if (assinatura.status !== 'ativa') {
            return {
                sucesso: false,
                status: 400,
                erro: 'Apenas assinaturas ativas podem ser renovadas'
            };
        }

        // Registrar pagamento da renovação
        this.banco.inserir('pagamentos', {
            usuarioId: assinatura.usuarioId,
            assinaturaId: assinatura.id,
            valor: assinatura.valor,
            metodo: 'cartao',
            status: 'aprovado',
            descricao: `Renovação de assinatura - ${PLANS_CONFIG[assinatura.plano]?.nome || assinatura.plano}`,
            criadoEm: new Date().toISOString()
        });

        // Atualizar próxima cobrança
        this.banco.atualizar('assinaturas', assinaturaId, {
            proximaCobranca: this.calcularProximaCobranca(),
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Assinatura renovada com sucesso',
            assinatura: this.banco.buscarPorId('assinaturas', assinaturaId)
        };
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = AssinaturaController;
