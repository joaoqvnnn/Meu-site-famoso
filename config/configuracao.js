// ============================================
// STREAMPREMIUM - CONFIGURAÇÕES GERAIS
// ============================================

require('dotenv').config();

// ============================================
// CONFIGURAÇÕES DO SERVIDOR
// ============================================
const SERVER_CONFIG = {
    // Porta do servidor
    port: parseInt(process.env.PORT) || 3000,
    
    // Ambiente de execução
    ambiente: process.env.NODE_ENV || 'development',
    
    // URL base da aplicação
    urlBase: process.env.URL_BASE || 'http://localhost:3000',
    
    // Diretório de arquivos estáticos
    diretorioPublico: 'public',
    
    // Diretório de uploads
    diretorioUploads: process.env.UPLOAD_DIR || 'uploads',
    
    // Tamanho máximo de upload (em MB)
    tamanhoMaximoUpload: parseInt(process.env.MAX_UPLOAD_SIZE) || 50
};

// ============================================
// CONFIGURAÇÕES JWT (Autenticação)
// ============================================
const JWT_CONFIG = {
    // Chave secreta para assinatura dos tokens
    secret: process.env.JWT_SECRET || 'streampremium_super_secret_key_2024',
    
    // Tempo de expiração do token
    expiresIn: process.env.JWT_EXPIRES || '7d',
    
    // Algoritmo de assinatura
    algorithm: 'HS256',
    
    // Issuer (emissor) do token
    issuer: 'streampremium-api',
    
    // Audience (destinatário) do token
    audience: 'streampremium-clients'
};

// ============================================
// CONFIGURAÇÕES CORS
// ============================================
const CORS_CONFIG = {
    // Origens permitidas
    origins: (process.env.CORS_ORIGINS || '*').split(','),
    
    // Métodos HTTP permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    // Headers permitidos
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    
    // Expor headers
    exposedHeaders: ['Content-Length', 'X-Total-Count'],
    
    // Permitir credenciais
    credentials: true,
    
    // Tempo de cache do preflight
    maxAge: 86400
};

// ============================================
// CONFIGURAÇÕES DE RATE LIMIT
// ============================================
const RATE_LIMIT_CONFIG = {
    // Janela de tempo (em milissegundos)
    windowMs: 60 * 1000, // 1 minuto
    
    // Número máximo de requisições por janela
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    
    // Mensagem de erro
    message: 'Muitas requisições. Tente novamente mais tarde.',
    
    // Headers informativos
    standardHeaders: true,
    legacyHeaders: false
};

// ============================================
// CONFIGURAÇÕES DE E-MAIL (SMTP)
// ============================================
const EMAIL_CONFIG = {
    // Servidor SMTP
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    
    // Porta SMTP
    port: parseInt(process.env.SMTP_PORT) || 587,
    
    // Usuário SMTP
    user: process.env.SMTP_USER || '',
    
    // Senha SMTP
    password: process.env.SMTP_PASSWORD || '',
    
    // E-mail de origem
    from: process.env.EMAIL_FROM || 'suporte@streampremium.com',
    
    // Nome do remetente
    fromName: 'StreamPremium',
    
    // Usar TLS
    secure: false,
    
    // Requer autenticação
    requireAuth: true
};

// ============================================
// CONFIGURAÇÕES DE PAGAMENTO
// ============================================
const PAYMENT_CONFIG = {
    // Stripe
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publicKey: process.env.STRIPE_PUBLIC_KEY || ''
    },
    
    // Mercado Pago
    mercadoPago: {
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
    },
    
    // PayPal
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
    },
    
    // Moeda padrão
    moeda: 'BRL',
    
    // País padrão
    pais: 'BR'
};

// ============================================
// CONFIGURAÇÕES DE LOG
// ============================================
const LOG_CONFIG = {
    // Nível de log
    nivel: process.env.LOG_LEVEL || 'info',
    
    // Formato de data
    formatoData: 'YYYY-MM-DD HH:mm:ss',
    
    // Cores no console
    cores: true,
    
    // Salvar logs em arquivo
    salvarEmArquivo: true,
    
    // Diretório de logs
    diretorioLogs: 'logs',
    
    // Nome do arquivo de log
    nomeArquivo: 'streampremium.log'
};

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================
const SECURITY_CONFIG = {
    // Hash de senha
    bcryptSaltRounds: 10,
    
    // Comprimento mínimo da senha
    senhaMinLength: 8,
    
    // Comprimento máximo da senha
    senhaMaxLength: 64,
    
    // Requer caracteres especiais na senha
    requerCaracteresEspeciais: true,
    
    // Requer números na senha
    requerNumeros: true,
    
    // Requer letras maiúsculas na senha
    requerMaiusculas: true,
    
    // Número máximo de tentativas de login
    maxTentativasLogin: 5,
    
    // Tempo de bloqueio (em minutos)
    tempoBloqueio: 15,
    
    // Habilitar 2FA
    habilitar2FA: true
};

// ============================================
// CONFIGURAÇÕES DE CACHE
// ============================================
const CACHE_CONFIG = {
    // Habilitar cache
    habilitado: true,
    
    // Tempo de vida do cache (em segundos)
    ttl: 300, // 5 minutos
    
    // Redis (se disponível)
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || ''
    }
};

// ============================================
// CONFIGURAÇÕES DE ARQUIVOS
// ============================================
const FILE_CONFIG = {
    // Tipos de arquivo permitidos
    tiposPermitidos: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4'
    ],
    
    // Extensões permitidas
    extensoesPermitidas: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4'],
    
    // Tamanho máximo (em bytes)
    tamanhoMaximo: 50 * 1024 * 1024, // 50MB
    
    // Nome do arquivo
    gerarNomeArquivo: (originalName) => {
        const timestamp = Date.now();
        const extensao = require('path').extname(originalName);
        const nomeBase = require('path').basename(originalName, extensao)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
        return `${nomeBase}-${timestamp}${extensao}`;
    }
};

// ============================================
// CONFIGURAÇÕES DE PLANOS
// ============================================
const PLANS_CONFIG = {
    gratuito: {
        nome: 'Gratuito',
        preco: 0,
        recursos: [
            'Acesso limitado ao catálogo',
            'Qualidade SD (480p)',
            '1 tela simultânea',
            'Com anúncios'
        ]
    },
    basico: {
        nome: 'Básico',
        preco: 14.90,
        recursos: [
            'Acesso ao catálogo básico',
            'Qualidade HD (720p)',
            '1 tela simultânea',
            'Sem anúncios'
        ]
    },
    premium: {
        nome: 'Premium',
        preco: 29.90,
        recursos: [
            'Acesso ilimitado a todo catálogo',
            'Qualidade 4K Ultra HD',
            '4 telas simultâneas',
            'Downloads offline',
            'Sem anúncios'
        ]
    },
    familia: {
        nome: 'Família',
        preco: 49.90,
        recursos: [
            'Acesso ilimitado a todo catálogo',
            'Qualidade 4K Ultra HD',
            '6 telas simultâneas',
            'Downloads offline',
            'Perfis para toda família',
            'Sem anúncios'
        ]
    }
};

// ============================================
// CONFIGURAÇÕES DE IDIOMAS SUPORTADOS
// ============================================
const LANGUAGES_CONFIG = {
    padrao: 'pt-BR',
    suportados: [
        { codigo: 'pt-BR', nome: 'Português (Brasil)' },
        { codigo: 'pt-PT', nome: 'Português (Portugal)' },
        { codigo: 'en', nome: 'English' },
        { codigo: 'es', nome: 'Español' },
        { codigo: 'fr', nome: 'Français' }
    ]
};

// ============================================
// CONFIGURAÇÕES DE NOTIFICAÇÕES
// ============================================
const NOTIFICATION_CONFIG = {
    // Tipos de notificação
    tipos: [
        'novo_cadastro',
        'novo_pedido',
        'pagamento_falho',
        'novo_comentario',
        'novo_episodio',
        'promocao'
    ],
    
    // Canais disponíveis
    canais: ['email', 'push', 'in_app'],
    
    // Preferências padrão
    preferenciasPadrao: {
        novo_cadastro: true,
        novo_pedido: true,
        pagamento_falho: true,
        novo_comentario: false,
        novo_episodio: true,
        promocao: true
    }
};

// ============================================
// EXPORTAÇÕES
// ============================================
module.exports = {
    SERVER_CONFIG,
    JWT_CONFIG,
    CORS_CONFIG,
    RATE_LIMIT_CONFIG,
    EMAIL_CONFIG,
    PAYMENT_CONFIG,
    LOG_CONFIG,
    SECURITY_CONFIG,
    CACHE_CONFIG,
    FILE_CONFIG,
    PLANS_CONFIG,
    LANGUAGES_CONFIG,
    NOTIFICATION_CONFIG
};
