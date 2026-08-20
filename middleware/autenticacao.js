// ============================================
// STREAMPREMIUM - MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/configuracao');

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO
// ============================================

// Middleware para autenticar usuário comum
function autenticarUsuario(req, res, next) {
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

        // Verificar se é token de usuário
        if (decoded.tipo !== 'usuario') {
            return res.status(403).json({
                sucesso: false,
                erro: 'Token inválido para este recurso',
                codigo: 'TOKEN_TIPO_INVALIDO'
            });
        }

        req.usuario = decoded;
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

// Middleware para autenticar administrador
function autenticarAdmin(req, res, next) {
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

        req.admin = decoded;
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

// Middleware para autenticar ambos (usuário ou admin)
function autenticarQualquer(req, res, next) {
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

        req.usuario = decoded;
        req.token = token;

        // Definir flag de admin
        if (decoded.tipo === 'admin') {
            req.admin = decoded;
            req.ehAdmin = true;
        } else {
            req.ehAdmin = false;
        }

        next();
    } catch (erro) {
        if (erro.name === 'TokenExpiredError') {
            return res.status(401).json({
                sucesso: false,
                erro: 'Token expirado',
                codigo: 'TOKEN_EXPIRADO'
            });
        }

        return res.status(403).json({
            sucesso: false,
            erro: 'Token inválido',
            codigo: 'TOKEN_INVALIDO'
        });
    }
}

// Middleware opcional (não bloqueia se não houver token)
function autenticarOpcional(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.usuario = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm],
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });

        req.usuario = decoded;
        req.token = token;
        next();
    } catch (erro) {
        req.usuario = null;
        next();
    }
}

// Middleware para verificar permissões específicas
function verificarPermissao(permissao) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Acesso negado',
                codigo: 'ACESSO_NEGADO'
            });
        }

        const permissoes = {
            'gerenciar_usuarios': ['super', 'admin'],
            'gerenciar_produtos': ['super', 'admin'],
            'gerenciar_pedidos': ['super', 'admin'],
            'gerenciar_assinaturas': ['super', 'admin'],
            'gerenciar_cupons': ['super', 'admin'],
            'gerenciar_banners': ['super', 'admin'],
            'gerenciar_emails': ['super', 'admin'],
            'gerenciar_administradores': ['super'],
            'ver_relatorios': ['super', 'admin'],
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

// Middleware para verificar se usuário está ativo
function verificarUsuarioAtivo(req, res, next) {
    const banco = req.banco;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Usuário não autenticado',
            codigo: 'NAO_AUTENTICADO'
        });
    }

    const usuario = banco.buscarPorId('usuarios', req.usuario.id);

    if (!usuario) {
        return res.status(404).json({
            sucesso: false,
            erro: 'Usuário não encontrado',
            codigo: 'USUARIO_NAO_ENCONTRADO'
        });
    }

    if (usuario.status !== 'ativo') {
        return res.status(403).json({
            sucesso: false,
            erro: 'Conta suspensa ou inativa',
            codigo: 'CONTA_INATIVA'
        });
    }

    req.usuarioCompleto = usuario;
    next();
}

// Middleware para verificar se e-mail foi verificado
function verificarEmailConfirmado(req, res, next) {
    const banco = req.banco;

    if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Usuário não autenticado',
            codigo: 'NAO_AUTENTICADO'
        });
    }

    const usuario = banco.buscarPorId('usuarios', req.usuario.id);

    if (!usuario) {
        return res.status(404).json({
            sucesso: false,
            erro: 'Usuário não encontrado',
            codigo: 'USUARIO_NAO_ENCONTRADO'
        });
    }

    if (!usuario.verificado) {
        return res.status(403).json({
            sucesso: false,
            erro: 'E-mail não verificado',
            codigo: 'EMAIL_NAO_VERIFICADO'
        });
    }

    next();
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    autenticarUsuario,
    autenticarAdmin,
    autenticarQualquer,
    autenticarOpcional,
    verificarPermissao,
    verificarUsuarioAtivo,
    verificarEmailConfirmado
};
