// ============================================
// STREAMPREMIUM - SERVIÇO DE ASSINATURAS
// ============================================

const { PLANS_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE ASSINATURA SERVICE
// ============================================
class AssinaturaService {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // MÉTODOS DE PLANOS
    // ============================================

    listarPlanosDisponiveis() {
        return Object.keys(PLANS_CONFIG).map(key => ({
            id: key,
            nome: PLANS_CONFIG[key].nome,
            preco: PLANS_CONFIG[key].preco,
            recursos: PLANS_CONFIG[key].recursos,
            ativo: true
        }));
    }

    buscarPlano(planoId) {
        const plano = PLANS_CONFIG[planoId];
        
        if (!plano) {
            return null;
        }

        return {
            id: planoId,
            nome: plano.nome,
            preco: plano.preco,
            recursos: plano.recursos
        };
    }

    validarPlano(planoId) {
        return PLANS_CONFIG[planoId] !== undefined;
    }

    // ============================================
    // MÉTODOS DE ASSINATURA
    // ============================================

    criarAssinatura(usuarioId, planoId, metodoPagamento = 'cartao') {
        const plano = this.buscarPlano(planoId);

        if (!plano) {
            return {
                sucesso: false,
                erro: 'Plano inválido'
            };
        }

        // Verificar assinatura ativa
        const assinaturaAtiva = this.banco.buscarUm('assinaturas', {
            usuarioId,
            status: 'ativa'
        });

        if (assinaturaAtiva) {
            return {
                sucesso: false,
                erro: 'Usuário já possui assinatura ativa'
            };
        }

        const agora = new Date();
        const proximaCobranca = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);

        const assinatura = this.banco.inserir('assinaturas', {
            usuarioId,
            plano: planoId,
            valor: plano.preco,
            status: 'ativa',
            inicio: agora.toISOString(),
            proximaCobranca: proximaCobranca.toISOString(),
            metodoPagamento,
            criadoEm: agora.toISOString(),
            atualizadoEm: agora.toISOString()
        });

        // Registrar pagamento inicial
        this.banco.inserir('pagamentos', {
            usuarioId,
            assinaturaId: assinatura.id,
            valor: plano.preco,
            metodo: metodoPagamento,
            status: 'aprovado',
            descricao: `Assinatura ${plano.nome}`,
            criadoEm: agora.toISOString()
        });

        return {
            sucesso: true,
            assinatura
        };
    }

    cancelarAssinatura(assinaturaId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                erro: 'Assinatura não encontrada'
            };
        }

        if (assinatura.status !== 'ativa') {
            return {
                sucesso: false,
                erro: 'Assinatura não está ativa'
            };
        }

        this.banco.atualizar('assinaturas', assinaturaId, {
            status: 'cancelada',
            canceladoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            mensagem: 'Assinatura cancelada com sucesso'
        };
    }

    renovarAssinatura(assinaturaId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);

        if (!assinatura) {
            return {
                sucesso: false,
                erro: 'Assinatura não encontrada'
            };
        }

        const plano = this.buscarPlano(assinatura.plano);
        const agora = new Date();
        const novaCobranca = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Registrar pagamento da renovação
        this.banco.inserir('pagamentos', {
            usuarioId: assinatura.usuarioId,
            assinaturaId: assinatura.id,
            valor: plano.preco,
            metodo: assinatura.metodoPagamento || 'cartao',
            status: 'aprovado',
            descricao: `Renovação de assinatura ${plano.nome}`,
            criadoEm: agora.toISOString()
        });

        // Atualizar próxima cobrança
        this.banco.atualizar('assinaturas', assinaturaId, {
            proximaCobranca: novaCobranca.toISOString(),
            atualizadoEm: agora.toISOString()
        });

        return {
            sucesso: true,
            mensagem: 'Assinatura renovada com sucesso'
        };
    }

    atualizarPlano(assinaturaId, novoPlanoId) {
        const assinatura = this.banco.buscarPorId('assinaturas', assinaturaId);
        const novoPlano = this.buscarPlano(novoPlanoId);

        if (!assinatura) {
            return {
                sucesso: false,
                erro: 'Assinatura não encontrada'
            };
        }

        if (!novoPlano) {
            return {
                sucesso: false,
                erro: 'Plano inválido'
            };
        }

        this.banco.atualizar('assinaturas', assinaturaId, {
            plano: novoPlanoId,
            valor: novoPlano.preco,
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            mensagem: `Plano atualizado para ${novoPlano.nome}`
        };
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    buscarAssinaturaUsuario(usuarioId) {
        return this.banco.buscarUm('assinaturas', {
            usuarioId,
            status: 'ativa'
        });
    }

    listarAssinaturasUsuario(usuarioId) {
        return this.banco.buscarTodos('assinaturas', { usuarioId });
    }

    listarTodasAssinaturas(filtros = {}) {
        let assinaturas = this.banco.buscarTodos('assinaturas');

        if (filtros.status) {
            assinaturas = assinaturas.filter(a => a.status === filtros.status);
        }

        if (filtros.plano) {
            assinaturas = assinaturas.filter(a => a.plano === filtros.plano);
        }

        return assinaturas;
    }

    // ============================================
    // MÉTODOS DE VERIFICAÇÃO
    // ============================================

    verificarAssinaturaAtiva(usuarioId) {
        const assinatura = this.buscarAssinaturaUsuario(usuarioId);

        if (!assinatura) {
            return {
                ativa: false,
                mensagem: 'Usuário não possui assinatura'
            };
        }

        if (assinatura.status !== 'ativa') {
            return {
                ativa: false,
                mensagem: 'Assinatura não está ativa'
            };
        }

        // Verificar se está expirada
        const proximaCobranca = new Date(assinatura.proximaCobranca);
        if (proximaCobranca < new Date()) {
            this.banco.atualizar('assinaturas', assinatura.id, {
                status: 'expirada',
                atualizadoEm: new Date().toISOString()
            });

            return {
                ativa: false,
                mensagem: 'Assinatura expirada'
            };
        }

        return {
            ativa: true,
            assinatura
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    obterEstatisticas() {
        const assinaturas = this.banco.buscarTodos('assinaturas');

        return {
            total: assinaturas.length,
            ativas: assinaturas.filter(a => a.status === 'ativa').length,
            canceladas: assinaturas.filter(a => a.status === 'cancelada').length,
            expiradas: assinaturas.filter(a => a.status === 'expirada').length,
            receitaMensal: assinaturas
                .filter(a => a.status === 'ativa')
                .reduce((acc, a) => acc + a.valor, 0),
            porPlano: {
                gratuito: assinaturas.filter(a => a.plano === 'gratuito').length,
                basico: assinaturas.filter(a => a.plano === 'basico').length,
                premium: assinaturas.filter(a => a.plano === 'premium').length,
                familia: assinaturas.filter(a => a.plano === 'familia').length
            }
        };
    }

    // ============================================
    // MÉTODOS DE PROCESSAMENTO AUTOMÁTICO
    // ============================================

    processarRenovacoesPendentes() {
        const assinaturasAtivas = this.banco.buscarTodos('assinaturas', { status: 'ativa' });
        const renovadas = [];
        const falhas = [];

        assinaturasAtivas.forEach(assinatura => {
            const proximaCobranca = new Date(assinatura.proximaCobranca);
            const hoje = new Date();

            if (proximaCobranca <= hoje) {
                const resultado = this.renovarAssinatura(assinatura.id);
                
                if (resultado.sucesso) {
                    renovadas.push(assinatura.id);
                } else {
                    falhas.push({
                        assinaturaId: assinatura.id,
                        erro: resultado.erro
                    });
                }
            }
        });

        return {
            sucesso: true,
            renovadas,
            falhas
        };
    }

    notificarExpiracaoProxima() {
        const assinaturasAtivas = this.banco.buscarTodos('assinaturas', { status: 'ativa' });
        const notificacoes = [];

        assinaturasAtivas.forEach(assinatura => {
            const proximaCobranca = new Date(assinatura.proximaCobranca);
            const hoje = new Date();
            const diasRestantes = Math.ceil((proximaCobranca - hoje) / (1000 * 60 * 60 * 24));

            if (diasRestantes <= 3 && diasRestantes >= 0) {
                notificacoes.push({
                    assinaturaId: assinatura.id,
                    usuarioId: assinatura.usuarioId,
                    diasRestantes,
                    proximaCobranca: assinatura.proximaCobranca
                });
            }
        });

        return {
            sucesso: true,
            notificacoes
        };
    }

    // ============================================
    // MÉTODOS DE BENEFÍCIOS
    // ============================================

    obterBeneficiosPlano(planoId) {
        const plano = this.buscarPlano(planoId);

        if (!plano) {
            return [];
        }

        return plano.recursos;
    }

    verificarBeneficio(usuarioId, beneficio) {
        const assinatura = this.buscarAssinaturaUsuario(usuarioId);

        if (!assinatura || assinatura.status !== 'ativa') {
            return false;
        }

        const recursos = this.obterBeneficiosPlano(assinatura.plano);
        return recursos.includes(beneficio);
    }

    obterLimiteTelas(usuarioId) {
        const assinatura = this.buscarAssinaturaUsuario(usuarioId);

        if (!assinatura) {
            return 1;
        }

        const limites = {
            gratuito: 1,
            basico: 1,
            premium: 4,
            familia: 6
        };

        return limites[assinatura.plano] || 1;
    }

    obterQualidadeMaxima(usuarioId) {
        const assinatura = this.buscarAssinaturaUsuario(usuarioId);

        if (!assinatura) {
            return '480p';
        }

        const qualidades = {
            gratuito: '480p',
            basico: '720p',
            premium: '4K',
            familia: '4K'
        };

        return qualidades[assinatura.plano] || '480p';
    }

    podeBaixarOffline(usuarioId) {
        const assinatura = this.buscarAssinaturaUsuario(usuarioId);

        if (!assinatura) {
            return false;
        }

        return ['premium', 'familia'].includes(assinatura.plano);
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = AssinaturaService;
