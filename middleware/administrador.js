// ============================================
// STREAMPREMIUM - MIDDLEWARE ADMINISTRADOR
// ============================================

const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/configuracao');

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO ADMIN
// ============================================

// Middleware principal para autenticar administrador
function autenticarAdministrador(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Token não fornecido',
            codigo: 'TOKEN_NAO_FORNECIDO'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm],
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });

        // Verificar se é token de admin
        if (decoded.tipo !== 'admin') {
            return res.status(403).json({
                sucesso: false,
                erro: 'Acesso negado. Requer permissão de administrador',
                codigo: 'ACESSO_NEGADO'
            });
        }

        // Buscar administrador no banco
        const banco = req.banco;
        const admin = banco.buscarPorId('administradores', decoded.id);

        if (!admin) {
            return res.status(404).json({
                sucesso: false,
                erro: 'Administrador não encontrado',
                codigo: 'ADMIN_NAO_ENCONTRADO'
            });
        }

        // Verificar status
        if (admin.status !== 'ativo') {
            return res.status(403).json({
                sucesso: false,
                erro: 'Conta administrativa desativada',
                codigo: 'CONTA_DESATIVADA'
            });
        }

        req.admin = {
            ...decoded,
            cargo: admin.cargo,
            nome: admin.nome
        };
        
        req.adminCompleto = admin;
        req.token = token;
        next();
    } catch (erro) {
        if (erro.name === 'TokenExpiredError') {
            return res.status(401).json({
                sucesso: false,
                erro: 'Token expirado',
                codigo: 'TOKEN_EXPIRADO'
            });
        }

        if (erro.name === 'JsonWebTokenError') {
            return res.status(401).json({
                sucesso: false,
                erro: 'Token inválido',
                codigo: 'TOKEN_INVALIDO'
            });
        }

        return res.status(403).json({
            sucesso: false,
            erro: 'Falha na autenticação',
            codigo: 'FALHA_AUTENTICACAO'
        });
    }
}

// Middleware para verificar cargo de super administrador
function autenticarSuperAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Administrador não autenticado',
            codigo: 'NAO_AUTENTICADO'
        });
    }

    if (req.admin.cargo !== 'super') {
        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso restrito ao super administrador',
            codigo: 'ACESSO_RESTRITO'
        });
    }

    next();
}

// Middleware para verificar cargo de administrador ou superior
function autenticarAdminOuSuper(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Administrador não autenticado',
            codigo: 'NAO_AUTENTICADO'
        });
    }

    const cargosPermitidos = ['admin', 'super'];

    if (!cargosPermitidos.includes(req.admin.cargo)) {
        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso restrito a administradores',
            codigo: 'ACESSO_RESTRITO'
        });
    }

    next();
}

// Middleware para verificar permissões específicas
function verificarPermissaoAdmin(permissao) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Acesso negado',
                codigo: 'ACESSO_NEGADO'
            });
        }

        const permissoes = {
            // Usuários
            'listar_usuarios': ['super', 'admin'],
            'criar_usuario': ['super', 'admin'],
            'editar_usuario': ['super', 'admin'],
            'excluir_usuario': ['super'],
            
            // Produtos
            'listar_produtos': ['super', 'admin'],
            'criar_produto': ['super', 'admin'],
            'editar_produto': ['super', 'admin'],
            'excluir_produto': ['super'],
            
            // Pedidos
            'listar_pedidos': ['super', 'admin'],
            'atualizar_pedido': ['super', 'admin'],
            'cancelar_pedido': ['super', 'admin'],
            
            // Assinaturas
            'listar_assinaturas': ['super', 'admin'],
            'gerenciar_assinaturas': ['super', 'admin'],
            
            // Pagamentos
            'listar_pagamentos': ['super', 'admin'],
            'gerenciar_pagamentos': ['super', 'admin'],
            'reembolsar': ['super'],
            
            // Cupons
            'listar_cupons': ['super', 'admin'],
            'criar_cupom': ['super', 'admin'],
            'excluir_cupom': ['super'],
            
            // Banners
            'listar_banners': ['super', 'admin'],
            'criar_banner': ['super', 'admin'],
            'excluir_banner': ['super'],
            
            // E-mails
            'listar_emails': ['super', 'admin'],
            'enviar_emails': ['super', 'admin'],
            
            // Administradores
            'listar_administradores': ['super'],
            'criar_administrador': ['super'],
            'excluir_administrador': ['super'],
            
            // Relatórios
            'ver_relatorios': ['super', 'admin'],
            
            // Configurações
            'configurar_sistema': ['super']
        };

        const cargosPermitidos = permissoes[permissao];

        if (!cargosPermitidos) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Permissão inválida',
                codigo: 'PERMISSAO_INVALIDA'
            });
        }

        if (!cargosPermitidos.includes(req.admin.cargo)) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Você não tem permissão para esta ação',
                codigo: 'PERMISSAO_NEGADA'
            });
        }

        next();
    };
}

// Middleware para verificar se administrador está ativo
function verificarAdminAtivo(req, res, next) {
    const banco = req.banco;

    if (!req.admin || !req.admin.id) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Administrador não autenticado',
            codigo: 'NAO_AUTENTICADO'
        });
    }

    const admin = banco.buscarPorId('administradores', req.admin.id);

    if (!admin) {
        return res.status(404).json({
            sucesso: false,
            erro: 'Administrador não encontrado',
            codigo: 'ADMIN_NAO_ENCONTRADO'
        });
    }

    if (admin.status !== 'ativo') {
        return res.status(403).json({
            sucesso: false,
            erro: 'Conta administrativa desativada',
            codigo: 'CONTA_DESATIVADA'
        });
    }

    next();
}

// Middleware para registrar atividade do administrador
function registrarAtividade(req, res, next) {
    const banco = req.banco;

    if (req.admin && req.admin.id) {
        const atividade = {
            adminId: req.admin.id,
            nome: req.admin.nome,
            acao: `${req.method} ${req.originalUrl}`,
            data: new Date().toISOString(),
            ip: req.ip
        };

        // Registrar atividade (se houver tabela de logs)
        if (banco.dados.logs) {
            banco.inserir('logs', atividade);
        } else {
            console.log(`📝 [ADMIN] ${atividade.nome} - ${atividade.acao} - ${atividade.data}`);
        }
    }

    next();
}

// Middleware para verificar IP permitido (opcional)
function verificarIPPermitido(ipsPermitidos) {
    return (req, res, next) => {
        const ipCliente = req.ip || req.connection.remoteAddress;

        if (!ipsPermitidos || ipsPermitidos.length === 0) {
            return next();
        }

        if (ipsPermitidos.includes(ipCliente)) {
            return next();
        }

        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso negado para este IP',
            codigo: 'IP_NAO_PERMITIDO'
        });
    };
}

// Middleware para verificar horário de acesso (opcional)
function verificarHorarioAcesso(horarioInicio, horarioFim) {
    return (req, res, next) => {
        const agora = new Date();
        const horaAtual = agora.getHours() + agora.getMinutes() / 60;

        if (horaAtual >= horarioInicio && horaAtual <= horarioFim) {
            return next();
        }

        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso permitido apenas em horário comercial',
            codigo: 'FORA_HORARIO'
        });
    };
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    autenticarAdministrador,
    autenticarSuperAdmin,
    autenticarAdminOuSuper,
    verificarPermissaoAdmin,
    verificarAdminAtivo,
    registrarAtividade,
    verificarIPPermitido,
    verificarHorarioAcesso
};
