// ============================================
// STREAMPREMIUM - GERENCIADOR DE TEMA
// ============================================

// ========== CONFIGURAÇÕES ==========
const TEMA_CONFIG = {
    CHAVE_STORAGE: 'streampremium_theme',
    TEMAS_SUPORTADOS: ['claro', 'escuro', 'sistema'],
    TEMA_PADRAO: 'sistema',
    TRANSICAO_DURACAO: 350
};

// ========== CLASSE GERENCIADOR DE TEMA ==========
class GerenciadorTema {
    constructor() {
        this.temaAtual = this.obterTemaSalvo();
        this.inicializar();
    }

    // Obter tema salvo no localStorage
    obterTemaSalvo() {
        try {
            const tema = localStorage.getItem(TEMA_CONFIG.CHAVE_STORAGE);
            return TEMA_CONFIG.TEMAS_SUPORTADOS.includes(tema) ? tema : TEMA_CONFIG.TEMA_PADRAO;
        } catch (erro) {
            return TEMA_CONFIG.TEMA_PADRAO;
        }
    }

    // Salvar tema no localStorage
    salvarTema(tema) {
        try {
            localStorage.setItem(TEMA_CONFIG.CHAVE_STORAGE, tema);
        } catch (erro) {
            console.warn('Não foi possível salvar o tema:', erro);
        }
    }

    // Aplicar tema ao documento
    aplicarTema(tema) {
        this.temaAtual = tema;
        this.salvarTema(tema);

        // Remover atributos anteriores
        document.body.removeAttribute('data-tema');
        
        // Aplicar novo tema
        if (tema === 'sistema') {
            document.body.setAttribute('data-tema', 'sistema');
        } else {
            document.body.setAttribute('data-tema', tema);
        }

        // Atualizar botões de tema
        this.atualizarBotoesTema();

        // Disparar evento de mudança
        this.dispararEventoMudanca(tema);
    }

    // Atualizar estado dos botões de tema
    atualizarBotoesTema() {
        document.querySelectorAll('[data-tema-opcao]').forEach(btn => {
            const temaBtn = btn.getAttribute('data-tema-opcao');
            if (temaBtn === this.temaAtual) {
                btn.classList.add('ativo');
            } else {
                btn.classList.remove('ativo');
            }
        });
    }

    // Disparar evento de mudança de tema
    dispararEventoMudanca(tema) {
        const evento = new CustomEvent('tema:alterado', {
            detail: { tema }
        });
        document.dispatchEvent(evento);
    }

    // Alternar entre temas
    alternarTema() {
        const temas = ['claro', 'escuro', 'sistema'];
        const indiceAtual = temas.indexOf(this.temaAtual);
        const proximoIndice = (indiceAtual + 1) % temas.length;
        this.aplicarTema(temas[proximoIndice]);
    }

    // Definir tema claro
    definirTemaClaro() {
        this.aplicarTema('claro');
    }

    // Definir tema escuro
    definirTemaEscuro() {
        this.aplicarTema('escuro');
    }

    // Definir tema sistema
    definirTemaSistema() {
        this.aplicarTema('sistema');
    }

    // Verificar se sistema está em modo escuro
    sistemaEhEscuro() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Verificar se tema atual é escuro
    ehTemaEscuro() {
        if (this.temaAtual === 'escuro') return true;
        if (this.temaAtual === 'sistema') return this.sistemaEhEscuro();
        return false;
    }

    // Inicializar
    inicializar() {
        // Aplicar tema salvo
        this.aplicarTema(this.temaAtual);

        // Adicionar eventos aos botões de tema
        document.querySelectorAll('[data-tema-opcao]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tema = btn.getAttribute('data-tema-opcao');
                this.aplicarTema(tema);
            });
        });

        // Monitorar mudanças do sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleMudancaSistema = () => {
                if (this.temaAtual === 'sistema') {
                    this.aplicarTema('sistema');
                }
            };

            // Para navegadores modernos
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleMudancaSistema);
            } 
            // Para navegadores antigos
            else if (mediaQuery.addListener) {
                mediaQuery.addListener(handleMudancaSistema);
            }
        }
    }
}

// ========== FUNÇÕES AUXILIARES ==========
function inicializarTema() {
    const gerenciador = new GerenciadorTema();
    window.gerenciadorTema = gerenciador;
    return gerenciador;
}

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
document.addEventListener('DOMContentLoaded', () => {
    if (!window.gerenciadorTema) {
        inicializarTema();
    }
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GerenciadorTema, inicializarTema };
} else {
    window.GerenciadorTema = GerenciadorTema;
    window.inicializarTema = inicializarTema;
}
