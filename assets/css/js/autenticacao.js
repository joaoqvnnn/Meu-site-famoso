// ============================================
// STREAMPREMIUM - GESTÃO DE AUTENTICAÇÃO
// ============================================

// ========== CONFIGURAÇÕES ==========
const AUTH_CONFIG = {
    CHAVE_TOKEN: 'streampremium_token',
    CHAVE_USUARIO: 'streampremium_usuario',
    CHAVE_ADMIN: 'streampremium_admin',
    CHAVE_SESSAO: 'streampremium_sessao',
    EXPIRACAO_SESSAO: 7 * 24 * 60 * 60 * 1000, // 7 dias
    API_URL: 'http://localhost:3000/api'
};

// ========== CLASSE GESTOR DE AUTENTICAÇÃO ==========
class GestorAutenticacao {
    constructor() {
        this.token = null;
        this.usuario = null;
        this.inicializar();
    }

    // Inicializar carregando dados salvos
    inicializar() {
        this.token = this.obterToken();
        this.usuario = this.obterUsuario();
    }

    // ========== TOKEN ==========
    obterToken() {
        try {
            return localStorage.getItem(AUTH_CONFIG.CHAVE_TOKEN);
        } catch (erro) {
            return null;
        }
    }

    salvarToken(token) {
        try {
            localStorage.setItem(AUTH_CONFIG.CHAVE_TOKEN, token);
            this.token = token;
        } catch (erro) {
            console.error('Erro ao salvar token:', erro);
        }
    }

    removerToken() {
        try {
            localStorage.removeItem(AUTH_CONFIG.CHAVE_TOKEN);
            this.token = null;
        } catch (erro) {
            console.error('Erro ao remover token:', erro);
        }
    }

    // ========== USUÁRIO ==========
    obterUsuario() {
        try {
            const usuario = localStorage.getItem(AUTH_CONFIG.CHAVE_USUARIO);
            return usuario ? JSON.parse(usuario) : null;
        } catch (erro) {
            return null;
        }
    }

    salvarUsuario(usuario) {
        try {
            localStorage.setItem(AUTH_CONFIG.CHAVE_USUARIO, JSON.stringify(usuario));
            this.usuario = usuario;
        } catch (erro) {
            console.error('Erro ao salvar usuário:', erro);
        }
    }

    removerUsuario() {
        try {
            localStorage.removeItem(AUTH_CONFIG.CHAVE_USUARIO);
            this.usuario = null;
        } catch (erro) {
            console.error('Erro ao remover usuário:', erro);
        }
    }

    // ========== SESSÃO ==========
    criarSessao(token, usuario) {
        this.salvarToken(token);
        this.salvarUsuario(usuario);
        
        const sessao = {
            criadaEm: Date.now(),
            expiraEm: Date.now() + AUTH_CONFIG.EXPIRACAO_SESSAO,
            usuario: usuario
        };
        
        try {
            localStorage.setItem(AUTH_CONFIG.CHAVE_SESSAO, JSON.stringify(sessao));
        } catch (erro) {
            console.error('Erro ao criar sessão:', erro);
        }
    }

    destruirSessao() {
        this.removerToken();
        this.removerUsuario();
        
        try {
            localStorage.removeItem(AUTH_CONFIG.CHAVE_SESSAO);
        } catch (erro) {
            console.error('Erro ao destruir sessão:', erro);
        }
    }

    verificarSessaoValida() {
        try {
            const sessao = localStorage.getItem(AUTH_CONFIG.CHAVE_SESSAO);
            if (!sessao) return false;
            
            const dados = JSON.parse(sessao);
            return dados.expiraEm > Date.now();
        } catch (erro) {
            return false;
        }
    }

    // ========== ESTADO DE AUTENTICAÇÃO ==========
    estaAutenticado() {
        return this.token !== null && this.usuario !== null && this.verificarSessaoValida();
    }

    ehAdmin() {
        return this.usuario !== null && this.usuario.tipo === 'admin';
    }

    // ========== LOGIN ==========
    async login(email, senha) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const dados = await response.json();

            if (!dados.sucesso) {
                return {
                    sucesso: false,
                    erro: dados.erro || 'Falha no login'
                };
            }

            this.criarSessao(dados.token, dados.usuario);

            return {
                sucesso: true,
                usuario: dados.usuario
            };
        } catch (erro) {
            console.error('Erro no login:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão. Tente novamente.'
            };
        }
    }

    // ========== LOGIN ADMIN ==========
    async loginAdmin(email, senha) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const dados = await response.json();

            if (!dados.sucesso) {
                return {
                    sucesso: false,
                    erro: dados.erro || 'Falha no login'
                };
            }

            this.criarSessao(dados.token, {
                ...dados.admin,
                tipo: 'admin'
            });

            return {
                sucesso: true,
                admin: dados.admin
            };
        } catch (erro) {
            console.error('Erro no login admin:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão. Tente novamente.'
            };
        }
    }

    // ========== CADASTRO ==========
    async cadastrar(dadosCadastro) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosCadastro)
            });

            const dados = await response.json();

            if (!dados.sucesso) {
                return {
                    sucesso: false,
                    erro: dados.erro || 'Falha no cadastro'
                };
            }

            this.criarSessao(dados.token, dados.usuario);

            return {
                sucesso: true,
                usuario: dados.usuario
            };
        } catch (erro) {
            console.error('Erro no cadastro:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão. Tente novamente.'
            };
        }
    }

    // ========== LOGOUT ==========
    logout() {
        this.destruirSessao();
        window.location.href = 'login.html';
    }

    // ========== RECUPERAÇÃO DE SENHA ==========
    async recuperarSenha(email) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/recuperar-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            return await response.json();
        } catch (erro) {
            console.error('Erro na recuperação:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão'
            };
        }
    }

    // ========== REDEFINIÇÃO DE SENHA ==========
    async redefinirSenha(token, novaSenha) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/redefinir-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, novaSenha })
            });

            return await response.json();
        } catch (erro) {
            console.error('Erro na redefinição:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão'
            };
        }
    }

    // ========== VERIFICAÇÃO DE E-MAIL ==========
    async verificarEmail(codigo) {
        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/verificar-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codigo })
            });

            return await response.json();
        } catch (erro) {
            console.error('Erro na verificação:', erro);
            return {
                sucesso: false,
                erro: 'Erro de conexão'
            };
        }
    }

    // ========== HEADERS AUTORIZADOS ==========
    obterHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // ========== VERIFICAÇÃO DE TOKEN ==========
    async verificarToken() {
        if (!this.token) {
            return { sucesso: false, valido: false };
        }

        try {
            const response = await fetch(AUTH_CONFIG.API_URL + '/auth/verificar-token', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            return await response.json();
        } catch (erro) {
            return { sucesso: false, valido: false };
        }
    }
}

// ========== FUNÇÃO AUXILIAR ==========
function inicializarAutenticacao() {
    const gestor = new GestorAutenticacao();
    window.gestorAutenticacao = gestor;
    return gestor;
}

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
document.addEventListener('DOMContentLoaded', () => {
    if (!window.gestorAutenticacao) {
        inicializarAutenticacao();
    }
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GestorAutenticacao, inicializarAutenticacao };
} else {
    window.GestorAutenticacao = GestorAutenticacao;
    window.inicializarAutenticacao = inicializarAutenticacao;
}
