// ============================================
// STREAMPREMIUM - JAVASCRIPT GLOBAL
// ============================================

// ========== CONFIGURAÇÕES GLOBAIS ==========
const CONFIG = {
    API_URL: 'http://localhost:3000/api',
    TOKEN_KEY: 'streampremium_token',
    USER_KEY: 'streampremium_usuario',
    THEME_KEY: 'streampremium_theme',
    CART_KEY: 'streampremium_carrinho',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
};

// ========== UTILITÁRIOS GERAIS ==========
const Utils = {
    // Formatar preço
    formatarPreco(valor) {
        return 'R$ ' + parseFloat(valor).toFixed(2).replace('.', ',');
    },

    // Formatar data
    formatarData(data, formato = 'pt-BR') {
        if (!data) return '';
        const d = new Date(data);
        return d.toLocaleDateString(formato);
    },

    // Formatar data e hora
    formatarDataHora(data) {
        if (!data) return '';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Debounce
    debounce(fn, delay = CONFIG.DEBOUNCE_DELAY) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    // Validar e-mail
    validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validar senha forte
    validarSenhaForte(senha) {
        const criterios = {
            comprimento: senha.length >= 8,
            maiuscula: /[A-Z]/.test(senha),
            minuscula: /[a-z]/.test(senha),
            numero: /\d/.test(senha),
            especial: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
        };
        return {
            valida: Object.values(criterios).filter(v => v).length >= 4,
            criterios
        };
    },

    // Gerar ID único
    gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    // Sanitizar texto
    sanitizarTexto(texto) {
        if (!texto) return '';
        return texto.replace(/<[^>]*>/g, '').trim();
    },

    // Copiar para clipboard
    async copiarTexto(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (erro) {
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    }
};

// ========== GERENCIAMENTO DE TEMA ==========
const TemaManager = {
    // Obter tema salvo
    obterTema() {
        return localStorage.getItem(CONFIG.THEME_KEY) || 'sistema';
    },

    // Aplicar tema
    aplicarTema(tema) {
        document.body.setAttribute('data-tema', tema);
        localStorage.setItem(CONFIG.THEME_KEY, tema);
        
        // Atualizar botões de tema
        document.querySelectorAll('[data-tema-opcao]').forEach(btn => {
            if (btn.getAttribute('data-tema-opcao') === tema) {
                btn.classList.add('ativa');
            } else {
                btn.classList.remove('ativa');
            }
        });
    },

    // Inicializar tema
    inicializar() {
        const tema = this.obterTema();
        this.aplicarTema(tema);
        
        // Adicionar eventos aos botões
        document.querySelectorAll('[data-tema-opcao]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tema = btn.getAttribute('data-tema-opcao');
                this.aplicarTema(tema);
            });
        });
        
        // Monitorar mudanças do sistema
        if (tema === 'sistema' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.obterTema() === 'sistema') {
                    this.aplicarTema('sistema');
                }
            });
        }
    }
};

// ========== GERENCIAMENTO DE AUTENTICAÇÃO ==========
const AuthManager = {
    // Obter token
    obterToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Obter usuário
    obterUsuario() {
        const usuario = localStorage.getItem(CONFIG.USER_KEY);
        return usuario ? JSON.parse(usuario) : null;
    },

    // Salvar sessão
    salvarSessao(token, usuario) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(usuario));
    },

    // Verificar se está autenticado
    estaAutenticado() {
        return !!this.obterToken();
    },

    // Verificar se é admin
    ehAdmin() {
        const usuario = this.obterUsuario();
        return usuario && usuario.tipo === 'admin';
    },

    // Fazer logout
    logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        window.location.href = 'login.html';
    },

    // Obter headers com token
    obterHeaders() {
        const token = this.obterToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }
};

// ========== GERENCIAMENTO DE CARRINHO ==========
const CartManager = {
    // Obter carrinho
    obterCarrinho() {
        const carrinho = localStorage.getItem(CONFIG.CART_KEY);
        return carrinho ? JSON.parse(carrinho) : [];
    },

    // Salvar carrinho
    salvarCarrinho(carrinho) {
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(carrinho));
    },

    // Adicionar item
    adicionarItem(produto, quantidade = 1) {
        const carrinho = this.obterCarrinho();
        const existente = carrinho.find(item => item.id === produto.id);
        
        if (existente) {
            existente.quantidade += quantidade;
        } else {
            carrinho.push({ ...produto, quantidade });
        }
        
        this.salvarCarrinho(carrinho);
        return carrinho;
    },

    // Remover item
    removerItem(produtoId) {
        const carrinho = this.obterCarrinho().filter(item => item.id !== produtoId);
        this.salvarCarrinho(carrinho);
        return carrinho;
    },

    // Atualizar quantidade
    atualizarQuantidade(produtoId, quantidade) {
        const carrinho = this.obterCarrinho();
        const item = carrinho.find(i => i.id === produtoId);
        
        if (item) {
            item.quantidade = Math.max(1, quantidade);
        }
        
        this.salvarCarrinho(carrinho);
        return carrinho;
    },

    // Limpar carrinho
    limparCarrinho() {
        localStorage.removeItem(CONFIG.CART_KEY);
    },

    // Calcular total
    calcularTotal() {
        return this.obterCarrinho().reduce((total, item) => total + (item.preco * item.quantidade), 0);
    },

    // Contar itens
    contarItens() {
        return this.obterCarrinho().reduce((total, item) => total + item.quantidade, 0);
    }
};

// ========== API CLIENT ==========
const ApiClient = {
    // GET
    async get(endpoint) {
        try {
            const response = await fetch(CONFIG.API_URL + endpoint, {
                headers: AuthManager.obterHeaders()
            });
            return await response.json();
        } catch (erro) {
            console.error('Erro na requisição GET:', erro);
            throw erro;
        }
    },

    // POST
    async post(endpoint, dados) {
        try {
            const response = await fetch(CONFIG.API_URL + endpoint, {
                method: 'POST',
                headers: AuthManager.obterHeaders(),
                body: JSON.stringify(dados)
            });
            return await response.json();
        } catch (erro) {
            console.error('Erro na requisição POST:', erro);
            throw erro;
        }
    },

    // PUT
    async put(endpoint, dados) {
        try {
            const response = await fetch(CONFIG.API_URL + endpoint, {
                method: 'PUT',
                headers: AuthManager.obterHeaders(),
                body: JSON.stringify(dados)
            });
            return await response.json();
        } catch (erro) {
            console.error('Erro na requisição PUT:', erro);
            throw erro;
        }
    },

    // DELETE
    async delete(endpoint) {
        try {
            const response = await fetch(CONFIG.API_URL + endpoint, {
                method: 'DELETE',
                headers: AuthManager.obterHeaders()
            });
            return await response.json();
        } catch (erro) {
            console.error('Erro na requisição DELETE:', erro);
            throw erro;
        }
    }
};

// ========== NOTIFICAÇÕES (TOAST) ==========
const ToastManager = {
    // Criar container
    criarContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
        return container;
    },

    // Mostrar toast
    mostrar(mensagem, tipo = 'info', duracao = 3000) {
        const container = this.criarContainer();
        const toast = document.createElement('div');
        
        const cores = {
            sucesso: { bg: '#10b981', cor: '#ffffff' },
            erro: { bg: '#ef4444', cor: '#ffffff' },
            aviso: { bg: '#f59e0b', cor: '#ffffff' },
            info: { bg: '#3b82f6', cor: '#ffffff' }
        };
        
        const cor = cores[tipo] || cores.info;
        
        toast.style.cssText = `
            background: ${cor.bg};
            color: ${cor.cor};
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: toastIn 0.3s ease;
            cursor: pointer;
        `;
        
        toast.textContent = mensagem;
        toast.addEventListener('click', () => toast.remove());
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duracao);
    },

    // Toast de sucesso
    sucesso(mensagem) {
        this.mostrar(mensagem, 'sucesso');
    },

    // Toast de erro
    erro(mensagem) {
        this.mostrar(mensagem, 'erro');
    },

    // Toast de aviso
    aviso(mensagem) {
        this.mostrar(mensagem, 'aviso');
    },

    // Toast de info
    info(mensagem) {
        this.mostrar(mensagem, 'info');
    }
};

// ========== CARREGAMENTO (LOADER) ==========
const LoaderManager = {
    // Mostrar loader
    mostrar() {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9998;
            `;
            
            const spinner = document.createElement('div');
            spinner.style.cssText = `
                width: 50px;
                height: 50px;
                border: 3px solid #ffffff;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 0.7s linear infinite;
            `;
            
            loader.appendChild(spinner);
            document.body.appendChild(loader);
        }
    },

    // Esconder loader
    esconder() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }
};

// ========== ANIMAÇÕES CSS ==========
const estiloAnimacoes = `
    @keyframes toastIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;

// Adicionar estilos de animação
const styleSheet = document.createElement('style');
styleSheet.textContent = estiloAnimacoes;
document.head.appendChild(styleSheet);

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tema
    TemaManager.inicializar();
    
    // Verificar autenticação em páginas protegidas
    const paginasProtegidas = ['minha-conta.html', 'meus-pedidos.html', 'meus-produtos.html', 'minhas-assinaturas.html'];
    const paginaAtual = window.location.pathname.split('/').pop();
    
    if (paginasProtegidas.includes(paginaAtual) && !AuthManager.estaAutenticado()) {
        window.location.href = 'login.html';
    }
});

// ========== EXPORTAÇÃO ==========
window.StreamPremium = {
    CONFIG,
    Utils,
    TemaManager,
    AuthManager,
    CartManager,
    ApiClient,
    ToastManager,
    LoaderManager
};
