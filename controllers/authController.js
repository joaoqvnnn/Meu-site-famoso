// ============================================
// STREAMPREMIUM - CONTROLLER DE AUTENTICAÇÃO
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_CONFIG, SECURITY_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE AUTH CONTROLLER
// ============================================
class AuthController {
    constructor(banco) {
        this.banco = banco;
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validarSenha(senha) {
        if (!senha || senha.length < SECURITY_CONFIG.senhaMinLength) {
            return { 
                valido: false, 
                erro: `Senha deve ter no mínimo ${SECURITY_CONFIG.senhaMinLength} caracteres` 
            };
        }

        if (SECURITY_CONFIG.requerMaiusculas && !/[A-Z]/.test(senha)) {
            return { 
                valido: false, 
                erro: 'Senha deve conter letras maiúsculas' 
            };
        }

        if (SECURITY_CONFIG.requerNumeros && !/\d/.test(senha)) {
            return { 
                valido: false, 
                erro: 'Senha deve conter números' 
            };
        }

        if (SECURITY_CONFIG.requerCaracteresEspeciais && !/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
            return { 
                valido: false, 
                erro: 'Senha deve conter caracteres especiais' 
            };
        }

        return { valido: true };
    }

    gerarToken(usuario, tipo = 'usuario') {
        return jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                tipo
            },
            JWT_CONFIG.secret,
            {
                expiresIn: JWT_CONFIG.expiresIn,
                algorithm: JWT_CONFIG.algorithm,
                issuer: JWT_CONFIG.issuer,
                audience: JWT_CONFIG.audience
            }
        );
    }

    verificarToken(token) {
        try {
            return jwt.verify(token, JWT_CONFIG.secret);
        } catch (erro) {
            return null;
        }
    }

    // ============================================
    // MÉTODOS DE AUTENTICAÇÃO
    // ============================================

    async cadastrar(dados) {
        const { nome, email, senha, cpf, telefone } = dados;

        // Validar nome
        if (!nome || nome.trim().length < 3) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'Nome deve ter no mínimo 3 caracteres' 
            };
        }

        // Validar e-mail
        if (!this.validarEmail(email)) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'E-mail inválido' 
            };
        }

        // Validar senha
        const validacaoSenha = this.validarSenha(senha);
        if (!validacaoSenha.valido) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: validacaoSenha.erro 
            };
        }

        // Verificar se e-mail já existe
        const usuarioExistente = this.banco.buscarUm('usuarios', { email: email.toLowerCase() });
        if (usuarioExistente) {
            return { 
                sucesso: false, 
                status: 409, 
                erro: 'E-mail já cadastrado' 
            };
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, SECURITY_CONFIG.bcryptSaltRounds);

        // Criar usuário
        const novoUsuario = this.banco.inserir('usuarios', {
            nome: nome.trim(),
            email: email.toLowerCase(),
            senha: senhaHash,
            cpf: cpf || null,
            telefone: telefone || null,
            plano: 'gratuito',
            status: 'ativo',
            verificado: false,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Gerar token
        const token = this.gerarToken(novoUsuario, 'usuario');

        return {
            sucesso: true,
            status: 201,
            token,
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                plano: novoUsuario.plano,
                verificado: novoUsuario.verificado
            }
        };
    }

    async login(dados) {
        const { email, senha } = dados;

        // Validar e-mail
        if (!this.validarEmail(email)) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'E-mail inválido' 
            };
        }

        // Buscar usuário
        const usuario = this.banco.buscarUm('usuarios', { email: email.toLowerCase() });
        if (!usuario) {
            return { 
                sucesso: false, 
                status: 401, 
                erro: 'Credenciais inválidas' 
            };
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return { 
                sucesso: false, 
                status: 401, 
                erro: 'Credenciais inválidas' 
            };
        }

        // Verificar status
        if (usuario.status !== 'ativo') {
            return { 
                sucesso: false, 
                status: 403, 
                erro: 'Conta suspensa ou inativa' 
            };
        }

        // Atualizar último acesso
        this.banco.atualizar('usuarios', usuario.id, {
            ultimoAcesso: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        });

        // Gerar token
        const token = this.gerarToken(usuario, 'usuario');

        return {
            sucesso: true,
            status: 200,
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano,
                verificado: usuario.verificado
            }
        };
    }

    async loginAdmin(dados) {
        const { email, senha } = dados;

        // Validar e-mail
        if (!this.validarEmail(email)) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'E-mail inválido' 
            };
        }

        // Buscar administrador
        const admin = this.banco.buscarUm('administradores', { email: email.toLowerCase() });
        if (!admin) {
            return { 
                sucesso: false, 
                status: 401, 
                erro: 'Credenciais inválidas' 
            };
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, admin.senha);
        if (!senhaValida) {
            return { 
                sucesso: false, 
                status: 401, 
                erro: 'Credenciais inválidas' 
            };
        }

        // Verificar status
        if (admin.status !== 'ativo') {
            return { 
                sucesso: false, 
                status: 403, 
                erro: 'Conta administrativa desativada' 
            };
        }

        // Atualizar último acesso
        this.banco.atualizar('administradores', admin.id, {
            ultimoAcesso: new Date().toISOString()
        });

        // Gerar token
        const token = this.gerarToken({ ...admin, nome: admin.nome }, 'admin');

        return {
            sucesso: true,
            status: 200,
            token,
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                cargo: admin.cargo
            }
        };
    }

    async recuperarSenha(dados) {
        const { email } = dados;

        if (!this.validarEmail(email)) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'E-mail inválido' 
            };
        }

        const usuario = this.banco.buscarUm('usuarios', { email: email.toLowerCase() });

        if (usuario) {
            // Gerar token de recuperação
            const tokenRecuperacao = jwt.sign(
                { id: usuario.id, email: usuario.email, tipo: 'recuperacao' },
                JWT_CONFIG.secret,
                { expiresIn: '1h' }
            );

            // Registrar e-mail
            this.banco.inserir('emails', {
                destinatario: email,
                assunto: 'Recuperação de senha',
                tipo: 'Segurança',
                status: 'enviado',
                conteudo: `Token de recuperação: ${tokenRecuperacao}`,
                criadoEm: new Date().toISOString()
            });

            return {
                sucesso: true,
                status: 200,
                mensagem: 'Instruções enviadas',
                token: tokenRecuperacao // Em produção, enviar por e-mail
            };
        }

        // Por segurança, sempre retornar sucesso
        return {
            sucesso: true,
            status: 200,
            mensagem: 'Se o e-mail existir, enviaremos instruções'
        };
    }

    async redefinirSenha(dados) {
        const { token, novaSenha } = dados;

        if (!token) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'Token não fornecido' 
            };
        }

        const validacaoSenha = this.validarSenha(novaSenha);
        if (!validacaoSenha.valido) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: validacaoSenha.erro 
            };
        }

        // Verificar token
        const decoded = this.verificarToken(token);
        if (!decoded || decoded.tipo !== 'recuperacao') {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'Token inválido ou expirado' 
            };
        }

        // Buscar usuário
        const usuario = this.banco.buscarPorId('usuarios', decoded.id);
        if (!usuario) {
            return { 
                sucesso: false, 
                status: 404, 
                erro: 'Usuário não encontrado' 
            };
        }

        // Hash da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, SECURITY_CONFIG.bcryptSaltRounds);

        // Atualizar senha
        this.banco.atualizar('usuarios', usuario.id, {
            senha: senhaHash,
            atualizadoEm: new Date().toISOString()
        });

        return {
            sucesso: true,
            status: 200,
            mensagem: 'Senha redefinida com sucesso'
        };
    }

    verificarEmail(dados) {
        const { codigo } = dados;

        if (!codigo || codigo.length !== 6) {
            return { 
                sucesso: false, 
                status: 400, 
                erro: 'Código inválido' 
            };
        }

        // Simulação - código correto: 123456
        if (codigo === '123456') {
            return {
                sucesso: true,
                status: 200,
                mensagem: 'E-mail verificado com sucesso'
            };
        }

        return { 
            sucesso: false, 
            status: 400, 
            erro: 'Código incorreto' 
        };
    }

    logout() {
        return {
            sucesso: true,
            status: 200,
            mensagem: 'Logout realizado com sucesso'
        };
    }

    verificarTokenValido(token) {
        const decoded = this.verificarToken(token);
        
        if (!decoded) {
            return {
                sucesso: false,
                valido: false,
                erro: 'Token inválido ou expirado'
            };
        }

        return {
            sucesso: true,
            valido: true,
            usuario: decoded
        };
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = AuthController;
