// ============================================
// STREAMPREMIUM - CONTROLLER ADMINISTRATIVO
// ============================================

const bcrypt = require('bcryptjs');
const { SECURITY_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE ADMIN CONTROLLER
// ============================================
class AdminController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // MÉTODOS DE DASHBOARD
    // ============================================

    obterDashboard() {
        const totalUsuarios = this.banco.contar('usuarios');
        const usuariosAtivos = this.banco.contar('usuarios', { status: 'ativo' });
        const usuariosNovos = this.banco.buscarTodos('usuarios').filter(u => {
            const criadoEm = new Date(u.criadoEm);
            const agora = new Date();
            const diff = (agora - criadoEm) / (1000 * 60 * 60 * 24);
            return diff <= 30;
        }).length;

        const totalProdutos = this.banco.contar('produtos');
        const produtosDisponiveis = this.banco.contar('produtos', { status: 'disponivel' });

        const totalPedidos = this.banco.contar('pedidos');
        const pedidosPagos = this.banco.contar('pedidos', { status: 'pago' });
        const pedidosPendentes = this.banco.contar('pedidos', { status: 'pendente' });

        const totalAssinaturas = this.banco.contar('assinaturas', { status: 'ativa' });
        
        const receitaTotal = this.banco.buscarTodos('pedidos')
            .filter(p => p.status === 'pago')
            .reduce((acc, p) => acc + p.total, 0);

        const totalCupons = this.banco.contar('cupons');
        const cuponsAtivos = this.banco.contar('cupons', { status: 'ativo' });

        const totalPagamentos = this.banco.contar('pagamentos');
        const pagamentosAprovados = this.banco.contar('pagamentos', { status: 'aprovado' });

        // Dados para gráfico (últimos 7 dias)
        const ultimos7Dias = [];
        for (let i = 6; i >= 0; i--) {
            const data = new Date();
            data.setDate(data.getDate() - i);
            const dia = data.toISOString().split('T')[0];

            const pedidosDia = this.banco.buscarTodos('pedidos').filter(p =>
                p.criadoEm && p.criadoEm.startsWith(dia)
            ).length;

            const usuariosDia = this.banco.buscarTodos('usuarios').filter(u =>
                u.criadoEm && u.criadoEm.startsWith(dia)
            ).length;

            const receitaDia = this.banco.buscarTodos('pedidos')
                .filter(p => p.status === 'pago' && p.criadoEm && p.criadoEm.startsWith(dia))
                .reduce((acc, p) => acc + p.total, 0);

            ultimos7Dias.push({
                data: dia,
                pedidos: pedidosDia,
                usuarios: usuariosDia,
                receita: receitaDia
            });
        }

        return {
            sucesso: true,
            status: 200,
            estatisticas: {
                usuarios: {
                    total: totalUsuarios,
                    ativos: usuariosAtivos,
                    novos: usuariosNovos
                },
                produtos: {
                    total: totalProdutos,
                    disponiveis: produtosDisponiveis
                },
                pedidos: {
                    total: totalPedidos,
                    pagos: pedidosPagos,
                    pendentes: pedidosPendentes
                },
                assinaturas: totalAssinaturas,
                receitaTotal,
                cupons: {
                    total: totalCupons,
                    ativos: cuponsAtivos
                },
                pagamentos: {
                    total: totalPagamentos,
                    aprovados: pagamentosAprovados
                }
            },
            grafico: ultimos7Dias
        };
    }

    // ============================================
    // MÉTODOS DE ADMINISTRADORES
    // ============================================

    listarAdministradores() {
        const administradores = this.banco.buscarTodos('administradores').map(admin => ({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            cargo: admin.cargo,
            status: admin.status,
            ultimoAcesso: admin.ultimoAcesso,
            criadoEm: admin.criadoEm
        }));

        return {
            sucesso: true,
            status: 200,
            administradores
        };
    }

    async criarAdministrador(dados) {
        const { nome, email, senha, cargo } = dados;

        if (!nome || nome.trim().length < 3) {
            return {
                sucesso: false,
                status: 400,
                erro: 'Nome deve ter no mínimo 3 caracteres'
            };
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return {
                sucesso: false,
                status: 400,
                erro: 'E-mail inválido'
            };
        }

        if (!senha || senha.length < SECURITY_CONFIG.senhaMinLength) {
            return {
                sucesso: false,
                status: 400,
                erro: `Senha deve ter no mínimo ${SECURITY_CONFIG.senhaMinLength} caracteres`
            };
        }

        const adminExistente = this.banco.buscarUm('administradores', { email: email.toLowerCase() });
        if (adminExistente) {
            return {
                sucesso: false,
                status: 409,
                erro: 'E-mail já cadastrado'
            };
        }

        const senhaHash = await bcrypt.hash(senha, SECURITY_CONFIG.bcryptSaltRounds);

        const novoAdmin = this.banco.inserir('administradores', {
            nome: nome.trim(),
            email: email.toLowerCase(),
            senha: senhaHash,
            cargo: cargo || 'admin',
            status: 'ativo',
            ultimoAcesso: null,
            criadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 201,
            mensagem: 'Administrador criado com sucesso',
            administrador: {
                id: novoAdmin.id,
                nome: novoAdmin.nome,
                email: novoAdmin.email,
                cargo: novoAdmin.cargo
            }
        };
    }

    atualizarAdministrador(adminId, dados) {
        const admin = this.banco.buscarPorId('administradores', adminId);

        if (!admin) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Administrador não encontrado'
            };
        }

        const { nome, cargo, status } = dados;
        const dadosAtualizados = {};

        if (nome) dadosAtualizados.nome = nome.trim();
        if (cargo) dadosAtualizados.cargo = cargo;
        if (status) dadosAtualizados.status = status;

        this.banco.atualizar('administradores', adminId, dadosAtualizados);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Administrador atualizado com sucesso',
            administrador: this.banco.buscarPorId('administradores', adminId)
        };
    }

    excluirAdministrador(adminId) {
        const admin = this.banco.buscarPorId('administradores', adminId);

        if (!admin) {
            return {
                sucesso: false,
                status: 404,
                erro: 'Administrador não encontrado'
            };
        }

        // Impedir exclusão do último super admin
        if (admin.cargo === 'super') {
            const superAdmins = this.banco.buscarTodos('administradores', { cargo: 'super' });
            if (superAdmins.length <= 1) {
                return {
                    sucesso: false,
                    status: 400,
                    erro: 'Não é possível excluir o último super administrador'
                };
            }
        }

        this.banco.remover('administradores', adminId);

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Administrador excluído com sucesso'
        };
    }

    // ============================================
    // MÉTODOS DE RELATÓRIOS
    // ============================================

    gerarRelatorioVendas(periodo = '30dias') {
        let dias = 30;
        if (periodo === '7dias') dias = 7;
        if (periodo === '90dias') dias = 90;
        if (periodo === '12meses') dias = 365;

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);

        const pedidos = this.banco.buscarTodos('pedidos', { status: 'pago' })
            .filter(p => new Date(p.criadoEm) >= dataLimite);

        const vendasPorDia = [];
        const vendasPorProduto = {};

        pedidos.forEach(pedido => {
            const dia = pedido.criadoEm.split('T')[0];
            const existente = vendasPorDia.find(v => v.data === dia);

            if (existente) {
                existente.total += pedido.total;
                existente.quantidade++;
            } else {
                vendasPorDia.push({
                    data: dia,
                    total: pedido.total,
                    quantidade: 1
                });
            }

            pedido.itens.forEach(item => {
                if (vendasPorProduto[item.titulo]) {
                    vendasPorProduto[item.titulo].quantidade += item.quantidade;
                    vendasPorProduto[item.titulo].receita += item.preco * item.quantidade;
                } else {
                    vendasPorProduto[item.titulo] = {
                        quantidade: item.quantidade,
                        receita: item.preco * item.quantidade
                    };
                }
            });
        });

        const receitaTotal = pedidos.reduce((acc, p) => acc + p.total, 0);

        return {
            sucesso: true,
            status: 200,
            periodo: dias,
            receitaTotal,
            totalPedidos: pedidos.length,
            ticketMedio: pedidos.length > 0 ? receitaTotal / pedidos.length : 0,
            vendasPorDia,
            vendasPorProduto: Object.keys(vendasPorProduto).map(titulo => ({
                titulo,
                ...vendasPorProduto[titulo]
            })).sort((a, b) => b.receita - a.receita)
        };
    }

    gerarRelatorioUsuarios() {
        const usuarios = this.banco.buscarTodos('usuarios');

        const porPlano = {
            gratuito: 0,
            basico: 0,
            premium: 0,
            familia: 0
        };

        const porStatus = {
            ativo: 0,
            inativo: 0,
            suspenso: 0
        };

        const porMes = {};

        usuarios.forEach(usuario => {
            if (porPlano[usuario.plano] !== undefined) {
                porPlano[usuario.plano]++;
            }

            if (porStatus[usuario.status] !== undefined) {
                porStatus[usuario.status]++;
            }

            const mes = usuario.criadoEm ? usuario.criadoEm.substring(0, 7) : 'desconhecido';
            porMes[mes] = (porMes[mes] || 0) + 1;
        });

        return {
            sucesso: true,
            status: 200,
            totalUsuarios: usuarios.length,
            porPlano,
            porStatus,
            porMes
        };
    }

    gerarRelatorioAssinaturas() {
        const assinaturas = this.banco.buscarTodos('assinaturas');

        return {
            sucesso: true,
            status: 200,
            total: assinaturas.length,
            ativas: assinaturas.filter(a => a.status === 'ativa').length,
            canceladas: assinaturas.filter(a => a.status === 'cancelada').length,
            receitaMensal: assinaturas
                .filter(a => a.status === 'ativa')
                .reduce((acc, a) => acc + a.valor, 0)
        };
    }

    // ============================================
    // MÉTODOS DE CONFIGURAÇÕES
    // ============================================

    obterConfiguracoes() {
        return {
            sucesso: true,
            status: 200,
            configuracoes: {
                plataforma: {
                    nome: 'StreamPremium',
                    email: 'suporte@streampremium.com',
                    idioma: 'pt-BR',
                    fusoHorario: 'America/Sao_Paulo'
                },
                seguranca: {
                    doisFatores: true,
                    bloqueioTentativas: true,
                    expiracaoSessao: 60
                },
                notificacoes: {
                    novosCadastros: true,
                    novosPedidos: true,
                    pagamentosFalhos: false
                }
            }
        };
    }

    atualizarConfiguracoes(novasConfig) {
        return {
            sucesso: true,
            status: 200,
            mensagem: 'Configurações atualizadas com sucesso',
            configuracoes: novasConfig
        };
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS GERAIS
    // ============================================

    obterEstatisticasGerais() {
        const estatisticas = {
            usuarios: {
                total: this.banco.contar('usuarios'),
                ativos: this.banco.contar('usuarios', { status: 'ativo' })
            },
            produtos: {
                total: this.banco.contar('produtos'),
                disponiveis: this.banco.contar('produtos', { status: 'disponivel' })
            },
            pedidos: {
                total: this.banco.contar('pedidos'),
                pagos: this.banco.contar('pedidos', { status: 'pago' })
            },
            assinaturas: {
                total: this.banco.contar('assinaturas'),
                ativas: this.banco.contar('assinaturas', { status: 'ativa' })
            },
            pagamentos: {
                total: this.banco.contar('pagamentos'),
                aprovados: this.banco.contar('pagamentos', { status: 'aprovado' })
            },
            cupons: {
                total: this.banco.contar('cupons'),
                ativos: this.banco.contar('cupons', { status: 'ativo' })
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
module.exports = AdminController;
