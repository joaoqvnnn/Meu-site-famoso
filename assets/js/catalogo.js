// ============================================
// STREAMPREMIUM - JAVASCRIPT DO CATÁLOGO
// ============================================

// ========== CONFIGURAÇÕES ==========
const CATALOGO_CONFIG = {
    API_URL: 'http://localhost:3000/api',
    ITENS_POR_PAGINA: 12,
    DEBOUNCE_DELAY: 300
};

// ========== CLASSE CATÁLOGO ==========
class Catalogo {
    constructor() {
        this.produtos = [];
        this.filtros = {
            categoria: 'todos',
            busca: '',
            tipo: 'todos',
            ordenacao: 'relevancia'
        };
        this.paginaAtual = 1;
        this.totalPaginas = 1;
        this.carregando = false;
        
        this.inicializar();
    }

    // Inicializar catálogo
    inicializar() {
        this.obterElementos();
        this.adicionarEventos();
        this.carregarProdutos();
    }

    // Obter elementos do DOM
    obterElementos() {
        this.grid = document.getElementById('catalogoGrid');
        this.inputBusca = document.getElementById('inputBusca');
        this.containerCategorias = document.getElementById('containerCategorias');
        this.containerTipos = document.getElementById('containerTipos');
        this.selectOrdenacao = document.getElementById('selectOrdenacao');
        this.contadorResultados = document.getElementById('contadorResultados');
        this.botaoCarregarMais = document.getElementById('botaoCarregarMais');
        this.loader = document.getElementById('catalogoLoader');
    }

    // Adicionar eventos
    adicionarEventos() {
        // Busca com debounce
        if (this.inputBusca) {
            this.inputBusca.addEventListener('input', Utils.debounce(() => {
                this.filtros.busca = this.inputBusca.value;
                this.paginaAtual = 1;
                this.carregarProdutos();
            }, CATALOGO_CONFIG.DEBOUNCE_DELAY));
        }

        // Categorias
        if (this.containerCategorias) {
            this.containerCategorias.addEventListener('click', (e) => {
                const chip = e.target.closest('[data-categoria]');
                if (chip) {
                    this.filtros.categoria = chip.getAttribute('data-categoria');
                    this.atualizarChipsAtivos(this.containerCategorias, chip);
                    this.paginaAtual = 1;
                    this.carregarProdutos();
                }
            });
        }

        // Tipos
        if (this.containerTipos) {
            this.containerTipos.addEventListener('click', (e) => {
                const chip = e.target.closest('[data-tipo]');
                if (chip) {
                    this.filtros.tipo = chip.getAttribute('data-tipo');
                    this.atualizarChipsAtivos(this.containerTipos, chip);
                    this.paginaAtual = 1;
                    this.carregarProdutos();
                }
            });
        }

        // Ordenação
        if (this.selectOrdenacao) {
            this.selectOrdenacao.addEventListener('change', () => {
                this.filtros.ordenacao = this.selectOrdenacao.value;
                this.paginaAtual = 1;
                this.carregarProdutos();
            });
        }

        // Carregar mais
        if (this.botaoCarregarMais) {
            this.botaoCarregarMais.addEventListener('click', () => {
                this.paginaAtual++;
                this.carregarProdutos(true);
            });
        }
    }

    // Atualizar chips ativos
    atualizarChipsAtivos(container, chipAtivo) {
        container.querySelectorAll('[data-categoria], [data-tipo]').forEach(chip => {
            chip.classList.remove('ativa');
        });
        chipAtivo.classList.add('ativa');
    }

    // Carregar produtos
    async carregarProdutos(acumular = false) {
        if (this.carregando) return;
        
        this.carregando = true;
        this.mostrarLoader();
        
        try {
            const params = new URLSearchParams({
                categoria: this.filtros.categoria,
                tipo: this.filtros.tipo,
                busca: this.filtros.busca,
                ordenacao: this.filtros.ordenacao,
                pagina: this.paginaAtual,
                limite: CATALOGO_CONFIG.ITENS_POR_PAGINA
            });
            
            const response = await fetch(`${CATALOGO_CONFIG.API_URL}/produtos?${params}`);
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.produtos = acumular ? [...this.produtos, ...dados.produtos] : dados.produtos;
                this.totalPaginas = dados.totalPaginas || 1;
                this.paginaAtual = dados.paginaAtual || 1;
                
                this.renderizarProdutos(acumular);
                this.atualizarContador(dados.total);
                this.atualizarBotaoCarregarMais();
            } else {
                ToastManager.erro(dados.erro || 'Erro ao carregar produtos');
            }
        } catch (erro) {
            console.error('Erro ao carregar catálogo:', erro);
            ToastManager.erro('Erro de conexão ao carregar catálogo');
        } finally {
            this.carregando = false;
            this.esconderLoader();
        }
    }

    // Renderizar produtos
    renderizarProdutos(acumular = false) {
        if (!this.grid) return;
        
        if (!acumular) {
            this.grid.innerHTML = '';
        }
        
        if (this.produtos.length === 0 && !acumular) {
            this.renderizarVazio();
            return;
        }
        
        this.produtos.forEach((produto, index) => {
            const card = this.criarCardProduto(produto, index);
            this.grid.appendChild(card);
        });
    }

    // Criar card de produto
    criarCardProduto(produto, index) {
        const card = document.createElement('div');
        card.className = 'filme-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const badgeTipo = produto.tipo === 'filme' ? 'FILME' : 
                          produto.tipo === 'serie' ? 'SÉRIE' : 'DOC';
        
        card.innerHTML = `
            <div class="filme-poster">
                <span class="filme-poster-placeholder">🎬</span>
                <span class="filme-badge ${produto.destaque ? 'destaque' : ''}">${badgeTipo}</span>
                <div class="filme-overlay">
                    <button class="botao-play" data-id="${produto.id}" aria-label="Assistir">
                        ▶
                    </button>
                </div>
            </div>
            <div class="filme-info">
                <h3 class="filme-titulo">${produto.titulo}</h3>
                <div class="filme-meta">
                    <span>${produto.ano}</span>
                    <span>•</span>
                    <span class="filme-avaliacao">★ ${produto.avaliacao || 'N/A'}</span>
                    <span>•</span>
                    <span>${Utils.formatarPreco(produto.preco)}</span>
                </div>
            </div>
        `;
        
        // Evento de clique no card
        card.addEventListener('click', () => {
            window.location.href = `produto.html?id=${produto.id}`;
        });
        
        // Evento de clique no botão play
        const botaoPlay = card.querySelector('.botao-play');
        botaoPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reproduzirProduto(produto);
        });
        
        return card;
    }

    // Renderizar estado vazio
    renderizarVazio() {
        this.grid.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🔍</div>
                <h3 style="color: var(--texto-secundario);">Nenhum produto encontrado</h3>
                <p style="color: var(--texto-secundario);">Tente ajustar sua busca ou filtros</p>
            </div>
        `;
    }

    // Atualizar contador
    atualizarContador(total) {
        if (this.contadorResultados) {
            this.contadorResultados.textContent = `${total} ${total === 1 ? 'resultado' : 'resultados'} encontrados`;
        }
    }

    // Atualizar botão carregar mais
    atualizarBotaoCarregarMais() {
        if (this.botaoCarregarMais) {
            if (this.paginaAtual < this.totalPaginas) {
                this.botaoCarregarMais.style.display = 'block';
            } else {
                this.botaoCarregarMais.style.display = 'none';
            }
        }
    }

    // Mostrar loader
    mostrarLoader() {
        if (this.loader) {
            this.loader.style.display = 'flex';
        }
    }

    // Esconder loader
    esconderLoader() {
        if (this.loader) {
            this.loader.style.display = 'none';
        }
    }

    // Reproduzir produto
    reproduzirProduto(produto) {
        ToastManager.info(`Reproduzindo: ${produto.titulo}`);
        // window.location.href = `player.html?id=${produto.id}`;
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    window.catalogo = new Catalogo();
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Catalogo };
} else {
    window.Catalogo = Catalogo;
}
