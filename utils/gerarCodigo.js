// ============================================
// STREAMPREMIUM - UTILITÁRIOS DE GERAÇÃO DE CÓDIGOS
// ============================================

// ============================================
// FUNÇÕES DE GERAÇÃO DE CÓDIGOS
// ============================================

// Gerar código de verificação (6 dígitos)
function gerarCodigoVerificacao() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gerar código de recuperação (8 caracteres alfanuméricos)
function gerarCodigoRecuperacao() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    
    for (let i = 0; i < 8; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    return codigo;
}

// Gerar código de cupom
function gerarCodigoCupom(prefixo = 'CUPOM') {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sufixo = '';
    
    for (let i = 0; i < 6; i++) {
        sufixo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    return `${prefixo}-${sufixo}`;
}

// Gerar código de pedido
function gerarNumeroPedido() {
    const ano = new Date().getFullYear();
    const numero = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    return `#SP-${ano}-${numero}`;
}

// Gerar código PIX
function gerarCodigoPIX() {
    const caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '00020126580014BR.GOV.BCB.PIX0136';
    
    for (let i = 0; i < 32; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    codigo += '520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304';
    
    return codigo;
}

// Gerar código de boleto
function gerarCodigoBoleto() {
    const timestamp = Date.now();
    return `34191.79001 01043.510047 91020.150008 7 ${timestamp}`;
}

// Gerar token de acesso
function gerarTokenAcesso() {
    const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    
    for (let i = 0; i < 64; i++) {
        token += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    return token;
}

// Gerar token de refresh
function gerarTokenRefresh() {
    const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    
    for (let i = 0; i < 128; i++) {
        token += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    return token;
}

// Gerar ID único (UUID v4)
function gerarUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Gerar código de rastreamento
function gerarCodigoRastreamento() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    let codigo = '';
    
    for (let i = 0; i < 2; i++) {
        codigo += letras[Math.floor(Math.random() * letras.length)];
    }
    
    for (let i = 0; i < 9; i++) {
        codigo += numeros[Math.floor(Math.random() * numeros.length)];
    }
    
    codigo += 'BR';
    
    return codigo;
}

// Gerar código de referência
function gerarCodigoReferencia(prefixo = 'REF') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefixo}-${timestamp}-${aleatorio}`;
}

// Gerar senha aleatória
function gerarSenhaAleatoria(tamanho = 12) {
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiais = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const todos = maiusculas + minusculas + numeros + especiais;
    let senha = '';
    
    // Garantir pelo menos um de cada tipo
    senha += maiusculas[Math.floor(Math.random() * maiusculas.length)];
    senha += minusculas[Math.floor(Math.random() * minusculas.length)];
    senha += numeros[Math.floor(Math.random() * numeros.length)];
    senha += especiais[Math.floor(Math.random() * especiais.length)];
    
    // Completar o restante
    for (let i = senha.length; i < tamanho; i++) {
        senha += todos[Math.floor(Math.random() * todos.length)];
    }
    
    // Embaralhar
    return senha.split('').sort(() => Math.random() - 0.5).join('');
}

// Gerar código de convite
function gerarCodigoConvite() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    
    for (let i = 0; i < 10; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    return codigo;
}

// Gerar código de promoção
function gerarCodigoPromocao() {
    const adjetivos = ['SUPER', 'MEGA', 'ULTRA', 'POWER', 'MAX', 'TOP', 'PRO'];
    const adjetivo = adjetivos[Math.floor(Math.random() * adjetivos.length)];
    const numero = Math.floor(Math.random() * 90 + 10);
    return `${adjetivo}${numero}`;
}

// Gerar hash simples (para IDs externos)
function gerarHashSimples(texto) {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
        const char = texto.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// Gerar código de verificação de dispositivo
function gerarCodigoDispositivo() {
    const timestamp = Date.now();
    const aleatorio = Math.floor(Math.random() * 10000);
    return `${timestamp}-${aleatorio}`;
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    gerarCodigoVerificacao,
    gerarCodigoRecuperacao,
    gerarCodigoCupom,
    gerarNumeroPedido,
    gerarCodigoPIX,
    gerarCodigoBoleto,
    gerarTokenAcesso,
    gerarTokenRefresh,
    gerarUUID,
    gerarCodigoRastreamento,
    gerarCodigoReferencia,
    gerarSenhaAleatoria,
    gerarCodigoConvite,
    gerarCodigoPromocao,
    gerarHashSimples,
    gerarCodigoDispositivo
};
