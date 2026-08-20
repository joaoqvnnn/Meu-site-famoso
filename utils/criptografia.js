// ============================================
// STREAMPREMIUM - UTILITÁRIOS DE CRIPTOGRAFIA
// ============================================

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ============================================
// CONFIGURAÇÕES
// ============================================
const ALGORITMO = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const DIGEST = 'sha256';

// ============================================
// FUNÇÕES DE HASH
// ============================================

// Gerar hash de senha
async function hashSenha(senha) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(senha, saltRounds);
        return hash;
    } catch (erro) {
        console.error('Erro ao gerar hash de senha:', erro);
        throw erro;
    }
}

// Verificar senha
async function verificarSenha(senha, hash) {
    try {
        return await bcrypt.compare(senha, hash);
    } catch (erro) {
        console.error('Erro ao verificar senha:', erro);
        return false;
    }
}

// Gerar hash SHA-256
function hashSHA256(texto) {
    return crypto.createHash('sha256').update(texto).digest('hex');
}

// Gerar hash SHA-512
function hashSHA512(texto) {
    return crypto.createHash('sha512').update(texto).digest('hex');
}

// Gerar hash MD5 (não recomendado para senhas)
function hashMD5(texto) {
    return crypto.createHash('md5').update(texto).digest('hex');
}

// Gerar hash HMAC
function hashHMAC(texto, chaveSecreta) {
    return crypto.createHmac('sha256', chaveSecreta).update(texto).digest('hex');
}

// ============================================
// FUNÇÕES DE CRIPTOGRAFIA SIMÉTRICA
// ============================================

// Gerar chave a partir de senha
function gerarChave(senha, salt) {
    return crypto.pbkdf2Sync(senha, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

// Criptografar texto
function criptografar(texto, chaveSecreta) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const chave = gerarChave(chaveSecreta, salt);
        
        const cipher = crypto.createCipheriv(ALGORITMO, chave, iv);
        
        let textoCriptografado = cipher.update(texto, 'utf8', 'hex');
        textoCriptografado += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            iv: iv.toString('hex'),
            salt: salt.toString('hex'),
            tag: tag.toString('hex'),
            dados: textoCriptografado
        };
    } catch (erro) {
        console.error('Erro ao criptografar:', erro);
        return null;
    }
}

// Descriptografar texto
function descriptografar(dadosCriptografados, chaveSecreta) {
    try {
        const { iv, salt, tag, dados } = dadosCriptografados;
        
        const ivBuffer = Buffer.from(iv, 'hex');
        const saltBuffer = Buffer.from(salt, 'hex');
        const tagBuffer = Buffer.from(tag, 'hex');
        
        const chave = gerarChave(chaveSecreta, saltBuffer);
        
        const decipher = crypto.createDecipheriv(ALGORITMO, chave, ivBuffer);
        decipher.setAuthTag(tagBuffer);
        
        let textoDescriptografado = decipher.update(dados, 'hex', 'utf8');
        textoDescriptografado += decipher.final('utf8');
        
        return textoDescriptografado;
    } catch (erro) {
        console.error('Erro ao descriptografar:', erro);
        return null;
    }
}

// Criptografar objeto JSON
function criptografarObjeto(objeto, chaveSecreta) {
    const jsonString = JSON.stringify(objeto);
    return criptografar(jsonString, chaveSecreta);
}

// Descriptografar objeto JSON
function descriptografarObjeto(dadosCriptografados, chaveSecreta) {
    const jsonString = descriptografar(dadosCriptografados, chaveSecreta);
    
    if (!jsonString) {
        return null;
    }
    
    try {
        return JSON.parse(jsonString);
    } catch (erro) {
        return null;
    }
}

// ============================================
// FUNÇÕES DE TOKENS
// ============================================

// Gerar token aleatório
function gerarTokenAleatorio(tamanho = 32) {
    return crypto.randomBytes(tamanho).toString('hex');
}

// Gerar token de acesso
function gerarTokenAcesso() {
    return gerarTokenAleatorio(32);
}

// Gerar token de refresh
function gerarTokenRefresh() {
    return gerarTokenAleatorio(64);
}

// Gerar token de verificação
function gerarTokenVerificacao() {
    return gerarTokenAleatorio(16);
}

// ============================================
// FUNÇÕES DE ASSINATURA
// ============================================

// Gerar assinatura HMAC
function gerarAssinatura(dados, chaveSecreta) {
    const payload = typeof dados === 'string' ? dados : JSON.stringify(dados);
    return crypto.createHmac('sha256', chaveSecreta).update(payload).digest('hex');
}

// Verificar assinatura
function verificarAssinatura(dados, assinatura, chaveSecreta) {
    const assinaturaEsperada = gerarAssinatura(dados, chaveSecreta);
    
    // Comparação segura (evitar timing attack)
    const buffer1 = Buffer.from(assinatura);
    const buffer2 = Buffer.from(assinaturaEsperada);
    
    if (buffer1.length !== buffer2.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(buffer1, buffer2);
}

// ============================================
// FUNÇÕES DE CODIFICAÇÃO
// ============================================

// Codificar Base64
function codificarBase64(texto) {
    return Buffer.from(texto).toString('base64');
}

// Decodificar Base64
function decodificarBase64(textoCodificado) {
    return Buffer.from(textoCodificado, 'base64').toString('utf8');
}

// Codificar URL
function codificarURL(texto) {
    return encodeURIComponent(texto);
}

// Decodificar URL
function decodificarURL(textoCodificado) {
    return decodeURIComponent(textoCodificado);
}

// ============================================
// FUNÇÕES DE MASCARAMENTO
// ============================================

// Mascarar e-mail
function mascararEmail(email) {
    const [usuario, dominio] = email.split('@');
    
    if (!dominio) {
        return email;
    }
    
    const usuarioMascarado = usuario.length > 2 
        ? usuario.substring(0, 2) + '***' + usuario.substring(usuario.length - 1)
        : usuario.substring(0, 1) + '***';
    
    return `${usuarioMascarado}@${dominio}`;
}

// Mascarar cartão de crédito
function mascararCartao(numeroCartao) {
    const ultimosDigitos = numeroCartao.slice(-4);
    return `•••• •••• •••• ${ultimosDigitos}`;
}

// Mascarar CPF
function mascararCPF(cpf) {
    return `***.***.***-${cpf.slice(-2)}`;
}

// Mascarar telefone
function mascararTelefone(telefone) {
    const ultimosDigitos = telefone.slice(-4);
    return `(**) *****-${ultimosDigitos}`;
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

// Verificar se senha é forte
function verificarForcaSenha(senha) {
    return {
        comprimento: senha.length >= 8,
        maiuscula: /[A-Z]/.test(senha),
        minuscula: /[a-z]/.test(senha),
        numero: /\d/.test(senha),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha),
        pontuacao: 0
    };
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    // Hash
    hashSenha,
    verificarSenha,
    hashSHA256,
    hashSHA512,
    hashMD5,
    hashHMAC,
    
    // Criptografia
    criptografar,
    descriptografar,
    criptografarObjeto,
    descriptografarObjeto,
    
    // Tokens
    gerarTokenAleatorio,
    gerarTokenAcesso,
    gerarTokenRefresh,
    gerarTokenVerificacao,
    
    // Assinatura
    gerarAssinatura,
    verificarAssinatura,
    
    // Codificação
    codificarBase64,
    decodificarBase64,
    codificarURL,
    decodificarURL,
    
    // Mascaramento
    mascararEmail,
    mascararCartao,
    mascararCPF,
    mascararTelefone,
    
    // Validação
    verificarForcaSenha
};
