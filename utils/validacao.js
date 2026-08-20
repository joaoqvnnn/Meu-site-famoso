// ============================================
// STREAMPREMIUM - UTILITÁRIOS DE VALIDAÇÃO
// ============================================

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE E-MAIL
// ============================================

function validarEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valido: false, erro: 'E-mail não fornecido' };
    }

    const emailLimpo = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailLimpo)) {
        return { valido: false, erro: 'Formato de e-mail inválido' };
    }

    if (emailLimpo.length > 254) {
        return { valido: false, erro: 'E-mail muito longo' };
    }

    return { valido: true, email: emailLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE SENHA
// ============================================

function validarSenha(senha, opcoes = {}) {
    const {
        minLength = 8,
        maxLength = 64,
        requerMaiuscula = true,
        requerMinuscula = true,
        requerNumero = true,
        requerEspecial = true
    } = opcoes;

    if (!senha || typeof senha !== 'string') {
        return { valido: false, erro: 'Senha não fornecida' };
    }

    if (senha.length < minLength) {
        return { valido: false, erro: `Senha deve ter no mínimo ${minLength} caracteres` };
    }

    if (senha.length > maxLength) {
        return { valido: false, erro: `Senha deve ter no máximo ${maxLength} caracteres` };
    }

    if (requerMaiuscula && !/[A-Z]/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter letras maiúsculas' };
    }

    if (requerMinuscula && !/[a-z]/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter letras minúsculas' };
    }

    if (requerNumero && !/\d/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter números' };
    }

    if (requerEspecial && !/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
        return { valido: false, erro: 'Senha deve conter caracteres especiais' };
    }

    return { valido: true };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE NOME
// ============================================

function validarNome(nome, opcoes = {}) {
    const { minLength = 3, maxLength = 100, permitirNumeros = false } = opcoes;

    if (!nome || typeof nome !== 'string') {
        return { valido: false, erro: 'Nome não fornecido' };
    }

    const nomeLimpo = nome.trim();

    if (nomeLimpo.length < minLength) {
        return { valido: false, erro: `Nome deve ter no mínimo ${minLength} caracteres` };
    }

    if (nomeLimpo.length > maxLength) {
        return { valido: false, erro: `Nome deve ter no máximo ${maxLength} caracteres` };
    }

    if (!permitirNumeros && /\d/.test(nomeLimpo)) {
        return { valido: false, erro: 'Nome não deve conter números' };
    }

    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(nomeLimpo)) {
        return { valido: false, erro: 'Nome contém caracteres inválidos' };
    }

    return { valido: true, nome: nomeLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE CPF
// ============================================

function validarCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') {
        return { valido: false, erro: 'CPF não fornecido' };
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
        return { valido: false, erro: 'CPF deve ter 11 dígitos' };
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
        return { valido: false, erro: 'CPF inválido' };
    }

    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpfLimpo[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    if (resto !== parseInt(cpfLimpo[9])) {
        return { valido: false, erro: 'CPF inválido' };
    }

    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpfLimpo[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    if (resto !== parseInt(cpfLimpo[10])) {
        return { valido: false, erro: 'CPF inválido' };
    }

    return { valido: true, cpf: cpfLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE TELEFONE
// ============================================

function validarTelefone(telefone) {
    if (!telefone || typeof telefone !== 'string') {
        return { valido: false, erro: 'Telefone não fornecido' };
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');

    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 13) {
        return { valido: false, erro: 'Telefone deve ter entre 10 e 13 dígitos' };
    }

    return { valido: true, telefone: telefoneLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE CEP
// ============================================

function validarCEP(cep) {
    if (!cep || typeof cep !== 'string') {
        return { valido: false, erro: 'CEP não fornecido' };
    }

    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
        return { valido: false, erro: 'CEP deve ter 8 dígitos' };
    }

    return { valido: true, cep: cepLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE CARTÃO
// ============================================

function validarNumeroCartao(numeroCartao) {
    if (!numeroCartao || typeof numeroCartao !== 'string') {
        return { valido: false, erro: 'Número do cartão não fornecido' };
    }

    const cartaoLimpo = numeroCartao.replace(/\D/g, '');

    if (cartaoLimpo.length < 13 || cartaoLimpo.length > 16) {
        return { valido: false, erro: 'Número do cartão deve ter entre 13 e 16 dígitos' };
    }

    // Algoritmo de Luhn
    let soma = 0;
    let alternar = false;

    for (let i = cartaoLimpo.length - 1; i >= 0; i--) {
        let digito = parseInt(cartaoLimpo[i]);

        if (alternar) {
            digito *= 2;
            if (digito > 9) {
                digito -= 9;
            }
        }

        soma += digito;
        alternar = !alternar;
    }

    if (soma % 10 !== 0) {
        return { valido: false, erro: 'Número do cartão inválido' };
    }

    return { valido: true, cartao: cartaoLimpo };
}

function validarValidadeCartao(validade) {
    if (!validade || typeof validade !== 'string') {
        return { valido: false, erro: 'Validade não fornecida' };
    }

    const validadeRegex = /^(\d{2})\/(\d{2})$/;
    const match = validade.match(validadeRegex);

    if (!match) {
        return { valido: false, erro: 'Formato de validade inválido (MM/AA)' };
    }

    const mes = parseInt(match[1]);
    const ano = parseInt(match[2]) + 2000;

    if (mes < 1 || mes > 12) {
        return { valido: false, erro: 'Mês inválido' };
    }

    const agora = new Date();
    const validadeDate = new Date(ano, mes, 1);

    if (validadeDate < agora) {
        return { valido: false, erro: 'Cartão expirado' };
    }

    return { valido: true };
}

function validarCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') {
        return { valido: false, erro: 'CVV não fornecido' };
    }

    const cvvLimpo = cvv.replace(/\D/g, '');

    if (cvvLimpo.length < 3 || cvvLimpo.length > 4) {
        return { valido: false, erro: 'CVV deve ter 3 ou 4 dígitos' };
    }

    return { valido: true, cvv: cvvLimpo };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE DATA
// ============================================

function validarData(data, formato = 'YYYY-MM-DD') {
    if (!data || typeof data !== 'string') {
        return { valido: false, erro: 'Data não fornecida' };
    }

    const dataRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = data.match(dataRegex);

    if (!match) {
        return { valido: false, erro: 'Formato de data inválido (YYYY-MM-DD)' };
    }

    const ano = parseInt(match[1]);
    const mes = parseInt(match[2]);
    const dia = parseInt(match[3]);

    if (mes < 1 || mes > 12) {
        return { valido: false, erro: 'Mês inválido' };
    }

    if (dia < 1 || dia > 31) {
        return { valido: false, erro: 'Dia inválido' };
    }

    const dataObj = new Date(ano, mes - 1, dia);

    if (dataObj.getFullYear() !== ano || dataObj.getMonth() !== mes - 1 || dataObj.getDate() !== dia) {
        return { valido: false, erro: 'Data inválida' };
    }

    return { valido: true, data: dataObj };
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE URL
// ============================================

function validarURL(url) {
    if (!url || typeof url !== 'string') {
        return { valido: false, erro: 'URL não fornecida' };
    }

    try {
        const urlObj = new URL(url);
        return { valido: true, url: urlObj };
    } catch (erro) {
        return { valido: false, erro: 'URL inválida' };
    }
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE CÓDIGOS
// ============================================

function validarCodigoVerificacao(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return { valido: false, erro: 'Código não fornecido' };
    }

    const codigoLimpo = codigo.replace(/\D/g, '');

    if (codigoLimpo.length !== 6) {
        return { valido: false, erro: 'Código deve ter 6 dígitos' };
    }

    return { valido: true, codigo: codigoLimpo };
}

function validarCodigoCupom(codigo) {
    if (!codigo || typeof codigo !== 'string') {
        return { valido: false, erro: 'Código do cupom não fornecido' };
    }

    const codigoLimpo = codigo.trim().toUpperCase();

    if (codigoLimpo.length < 3 || codigoLimpo.length > 20) {
        return { valido: false, erro: 'Código deve ter entre 3 e 20 caracteres' };
    }

    if (!/^[A-Z0-9-]+$/.test(codigoLimpo)) {
        return { valido: false, erro: 'Código contém caracteres inválidos' };
    }

    return { valido: true, codigo: codigoLimpo };
}

// ============================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================

function sanitizarTexto(texto) {
    if (!texto || typeof texto !== 'string') {
        return '';
    }

    let sanitizado = texto.trim();
    sanitizado = sanitizado.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitizado = sanitizado.replace(/<[^>]*>/g, '');
    sanitizado = sanitizado.replace(/javascript:/gi, '');
    sanitizado = sanitizado.replace(/on\w+="[^"]*"/gi, '');
    sanitizado = sanitizado.replace(/on\w+='[^']*'/gi, '');

    return sanitizado;
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = {
    validarEmail,
    validarSenha,
    validarNome,
    validarCPF,
    validarTelefone,
    validarCEP,
    validarNumeroCartao,
    validarValidadeCartao,
    validarCVV,
    validarData,
    validarURL,
    validarCodigoVerificacao,
    validarCodigoCupom,
    sanitizarTexto
};
