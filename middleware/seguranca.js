// ============================================
// STREAMPREMIUM - MIDDLEWARE DE SEGURANÇA
// ============================================

const { RATE_LIMIT_CONFIG, SECURITY_CONFIG } = require('../config/configuracao');

// ============================================
// FUNÇÕES DE SEGURANÇA
// ============================================

// Middleware de Rate Limiting
function rateLimiter() {
    const requisicoes = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const agora = Date.now();
        const janela = RATE_LIMIT_CONFIG.windowMs;

        if (!requisicoes.has(ip)) {
            requisicoes.set(ip, []);
        }

        const timestamps = requisicoes.get(ip);
        const requisicoesRecentes = timestamps.filter(t => agora - t < janela);

        if (requisicoesRecentes.length >= RATE_LIMIT_CONFIG.max) {
            return res.status(429).json({
                sucesso: false,
                erro: RATE_LIMIT_CONFIG.message,
                codigo: 'RATE_LIMIT_EXCEDIDO',
                tentarNovamenteEm: Math.ceil((janela - (agora - requisicoesRecentes[0])) / 1000)
            });
        }

        requisicoesRecentes.push(agora);
        requisicoes.set(ip, requisicoesRecentes);

        next();
    };
}

// Middleware de validação de Content-Type
function validarContentType(req, res, next) {
    const contentType = req.headers['content-type'];

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                sucesso: false,
                erro: 'Content-Type deve ser application/json',
                codigo: 'CONTENT_TYPE_INVALIDO'
            });
        }
    }

    next();
}

// Middleware para sanitizar inputs
function sanitizarInput(req, res, next) {
    if (req.body) {
        req.body = sanitizarObjeto(req.body);
    }
    next();
}

function sanitizarObjeto(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sanitizado = {};

    for (const [chave, valor] of Object.entries(obj)) {
        sanitizado[chave] = sanitizarValor(valor);
    }

    return sanitizado;
}

function sanitizarValor(valor) {
    if (typeof valor === 'string') {
        // Remover scripts e tags HTML
        let sanitizado = valor.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitizado = sanitizado.replace(/<[^>]*>/g, '');
        sanitizado = sanitizado.replace(/javascript:/gi, '');
        sanitizado = sanitizado.replace(/on\w+="[^"]*"/gi, '');
        sanitizado = sanitizado.replace(/on\w+='[^']*'/gi, '');
        
        // Remover espaços extras
        sanitizado = sanitizado.trim();
        
        return sanitizado;
    }

    if (typeof valor === 'object' && valor !== null) {
        return sanitizarObjeto(valor);
    }

    if (Array.isArray(valor)) {
        return valor.map(item => sanitizarValor(item));
    }

    return valor;
}

// Middleware para verificar tamanho do payload
function limitarPayload(req, res, next) {
    const limite = 10 * 1024 * 1024; // 10MB

    let tamanho = 0;

    req.on('data', (chunk) => {
        tamanho += chunk.length;

        if (tamanho > limite) {
            res.status(413).json({
                sucesso: false,
                erro: 'Payload muito grande',
                codigo: 'PAYLOAD_MUITO_GRANDE'
            });
            req.destroy();
        }
    });

    next();
}

// Middleware para adicionar headers de segurança
function adicionarHeadersSeguranca(req, res, next) {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Habilitar XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevenir informações de tecnologia
    res.setHeader('X-Powered-By', '');

    // Política de referência
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissões de recursos
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
}

// Middleware para verificar origens permitidas
function verificarOrigem(req, res, next) {
    const origem = req.headers['origin'];
    const origensPermitidas = process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',') : 
        ['http://localhost:3000'];

    if (origem) {
        if (origensPermitidas.includes(origem) || origensPermitidas.includes('*')) {
            res.setHeader('Access-Control-Allow-Origin', origem);
        }
    }

    next();
}

// Middleware para prevenir SQL Injection (simulado)
function prevenirSQLInjection(req, res, next) {
    if (req.body) {
        const padroesPerigosos = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
            /(--)/,
            /(;)/,
            /(')/,
            /(\bOR\b.*=.*\bOR\b)/i,
            /(\bUNION\b.*\bSELECT\b)/i
        ];

        const valores = JSON.stringify(req.body);

        for (const padrao of padroesPerigosos) {
            if (padrao.test(valores)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Entrada inválida detectada',
                    codigo: 'ENTRADA_INVALIDA'
                });
            }
        }
    }

    next();
}

// Middleware para prevenir XSS (simulado)
function prevenirXSS(req, res, next) {
    if (req.body) {
        const padroesXSS = [
            /<script/i,
            /javascript:/i,
            /onerror/i,
            /onload/i,
            /onclick/i,
            /<img/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /<link/i,
            /<meta/i,
            /<style/i
        ];

        const valores = JSON.stringify(req.body);

        for (const padrao of padroesXSS) {
            if (padrao.test(valores)) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Conteúdo malicioso detectado',
                    codigo: 'XSS_DETECTADO'
                });
            }
        }
    }

    next();
}

// Middleware para verificar tentativas de login
function monitorarTentativasLogin() {
    const tentativas = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const agora = Date.now();
        const janela = SECURITY_CONFIG.tempoBloqueio * 60 * 1000;

        if (!tentativas.has(ip)) {
            tentativas.set(ip, []);
        }

        const timestamps = tentativas.get(ip);
        const tentativasRecentes = timestamps.filter(t => agora - t < janela);

        if (tentativasRecentes.length >= SECURITY_CONFIG.maxTentativasLogin) {
            return res.status(429).json({
                sucesso: false,
                erro: 'Muitas tentativas de login. Tente novamente mais tarde.',
                codigo: 'MUITAS_TENTATIVAS'
            });
        }

        req.tentativasLogin = {
            registrar: () => {
                tentativasRecentes.push(agora);
                tentativas.set(ip, tentativasRecentes);
            },
            limpar: () => {
                tentativas.delete(ip);
            }
        };

        next();
    };
}

// Middleware para validar formato de e-mail
function validarFormatoEmail(req, res, next) {
    const email = req.body?.email;

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Formato de e-mail inválido',
                codigo: 'EMAIL_INVALIDO'
            });
        }
    }

    next();
}

// Middleware para validar formato de CPF
function validarFormatoCPF(req, res, next) {
    const cpf = req.body?.cpf;

    if (cpf) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        
        if (!cpfRegex.test(cpf)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Formato de CPF inválido',
                codigo: 'CPF_INVALIDO'
            });
        }
    }

    next();
}

// Middleware para validar formato de telefone
function validarFormatoTelefone(req, res, next) {
    const telefone = req.body?.telefone;

    if (telefone) {
        const telefoneRegex = /^\+55\s\d{2}\s\d{5}-\d{4}$/;
        
        if (!telefoneRegex.test(telefone)) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Formato de telefone inválido',
                codigo: 'TELEFONE_INVALIDO'
            });
        }
    }

    next();
}

// Middleware para verificar força da senha
function verificarForcaSenha(req, res, next) {
    const senha = req.body?.senha || req.body?.novaSenha;

    if (senha) {
        const forca = {
            comprimento: senha.length >= 8,
            maiuscula: /[A-Z]/.test(senha),
            minuscula: /[a-z]/.test(senha),
            numero: /\d/.test(senha),
            especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
        };

        const pontuacao = Object.values(forca).filter(v => v).length;

        if (pontuacao < 4) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Senha muito fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais.',
                codigo: 'SENHA_FRACA',
                requisitos: forca
            });
        }
    }

    next();
}

// Middleware para verificar se é HTTPS (produção)
function verificarHTTPS(req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.status(403).json({
                sucesso: false,
                erro: 'Conexão HTTPS obrigatória',
                codigo: 'HTTPS_OBRIGATORIO'
            });
        }
    }

    next();
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    rateLimiter,
    validarContentType,
    sanitizarInput,
    limitarPayload,
    adicionarHeadersSeguranca,
    verificarOrigem,
    prevenirSQLInjection,
    prevenirXSS,
    monitorarTentativasLogin,
    validarFormatoEmail,
    validarFormatoCPF,
    validarFormatoTelefone,
    verificarForcaSenha,
    verificarHTTPS
};
