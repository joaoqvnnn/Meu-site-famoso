// ============================================
// STREAMPREMIUM - JAVASCRIPT DO CARRINHO
// ============================================

// ========== CONFIGURAÇÕES ==========
const CARRINHO_CONFIG = {
    CHAVE_STORAGE: 'streampremium_carrinho',
    API_URL: 'http://localhost:3000/api',
    CUPOM_CHAVE: 'streampremium_cupom'
};

// ========== CLASSE CARRINHO ==========
class Carrinho {
    constructor() {
        this.itens = [];
        this.cupom = null;
        this.inicializar();
    }

    // Inicializar carrinho
    inicializar() {
        this.carregarCarrinho();
        this.obterElementos();
        this.adicionarEventos();
        this.renderizar();
    }

    // Carregar carrinho do localStorage
    carregarCarrinho() {
        try {
            const carrinhoSalvo = localStorage.getItem(CARRINHO_CONFIG.CHAVE_STORAGE);
            this.itens = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
            
            const cupomSalvo = localStorage.getItem(CARRINHO_CONFIG.CUPOM_CHAVE);
            this.cupom = cupomSalvo ? JSON.parse(cupomSalvo) : null;
        } catch (erro) {
            this.itens = [];
            this.cupom = null;
        }
    }

    // Salvar carrinho no localStorage
    salvarCarrinho() {
        try {
            localStorage.setItem(CARRINHO_CONFIG.CHAVE_STORAGE, JSON.stringify(this.itens));
            if (this.cupom) {
                localStorage.setItem(CARRINHO_CONFIG.CUPOM_CHAVE, JSON.stringify(this.cupom));
            } else {
                localStorage.removeItem(CARRINHO_CONFIG.CUPOM_CHAVE);
            }
        } catch (erro) {
            console.error('Erro ao salvar carrinho:', erro);
        }
    }

    // Obter elementos do DOM
    obterElementos() {
        this.containerItens = document.getElementById('carrinhoItens');
        this.contadorItens = document.getElementById('contadorItens');
        this.subtotalElemento = document.getElementById('subtotal');
        this.descontoElemento = document.getElementById('desconto');
        this.totalElemento = document.getElementById('total');
        this.botaoCheckout = document.getElementById('botaoCheckout');
        this.botaoLimpar = document.getElementById('botaoLimpar');
        this.containerVazio = document.getElementById('carrinhoVazio');
        this.containerCheio = document.getElementById('carrinhoCheio');
        this.inputCupom = document.getElementById('inputCupom');
        this.botaoAplicarCupom = document.getElementById('botaoAplicarCupom');
        this.cupomInfo = document.getElementById('cupomInfo');
    }

    // Adicionar eventos
    adicionarEventos() {
        // Botão checkout
        if (this.botaoCheckout) {
            this.botaoCheckout.addEventListener('click', () => {
                this.irParaCheckout();
            });
        }

        // Botão limpar
        if (this.botaoLimpar) {
            this.botaoLimpar.addEventListener('click', () => {
                this.limparCarrinho();
            });
        }

        // Aplicar cupom
        if (this.botaoAplicarCupom) {
            this.botaoAplicarCupom.addEventListener('click', () => {
                this.aplicarCupom();
            });
        }

        // Enter no input de cupom
        if (this.inputCupom) {
            this.inputCupom.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.aplicarCupom();
                }
            });
        }
    }

    // Adicionar item ao carrinho
    adicionarItem(produto, quantidade = 1) {
        const itemExistente = this.itens.find(item => item.id === produto.id);
        
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            this.itens.push({
                id: produto.id,
                titulo: produto.titulo,
                tipo: produto.tipo,
                preco: produto.preco,
                quantidade: quantidade,
                imagem: produto.imagem || null
            });
        }
        
        this.salvarCarrinho();
        this.renderizar();
        ToastManager.sucesso(`${produto.titulo} adicionado ao carrinho`);
    }

    // Remover item do carrinho
    removerItem(produtoId) {
        this.itens = this.itens.filter(item => item.id !== produtoId);
        this.salvarCarrinho();
        this.renderizar();
        ToastManager.info('Item removido do carrinho');
    }

    // Atualizar quantidade
    atualizarQuantidade(produtoId, novaQuantidade) {
        const item = this.itens.find(i => i.id === produtoId);
        
        if (item) {
            item.quantidade = Math.max(1, novaQuantidade);
            
            if (item.quantidade === 0) {
                this.removerItem(produtoId);
                return;
            }
            
            this.salvarCarrinho();
            this.renderizar();
        }
    }

    // Limpar carrinho
    limparCarrinho() {
        if (confirm('Tem certeza que deseja limpar o carrinho?')) {
            this.itens = [];
            this.cupom = null;
            this.salvarCarrinho();
            this.renderizar();
            ToastManager.info('Carrinho limpo');
        }
    }

    // Aplicar cupom
    async aplicarCupom() {
        if (!this.inputCupom) return;
        
        const codigo = this.inputCupom.value.trim().toUpperCase();
        
        if (!codigo) {
            ToastManager.aviso('Digite um código de cupom');
            return;
        }
        
        try {
            const response = await fetch(`${CARRINHO_CONFIG.API_URL}/cupons/validar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo })
            });
            
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.cupom = dados.cupom;
                this.salvarCarrinho();
                this.renderizar();
                ToastManager.sucesso('Cupom aplicado com sucesso!');
            } else {
                ToastManager.erro(dados.erro || 'Cupom inválido');
            }
        } catch (erro) {
            ToastManager.erro('Erro ao validar cupom');
        }
    }

    // Remover cupom
    removerCupom() {
        this.cupom = null;
        this.salvarCarrinho();
        this.renderizar();
        ToastManager.info('Cupom removido');
    }

    // Calcular subtotal
    calcularSubtotal() {
        return this.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    }

    // Calcular desconto
    calcularDesconto() {
        if (!this.cupom) return 0;
        
        const subtotal = this.calcularSubtotal();
        
        if (this.cupom.tipo === 'porcentagem') {
            return subtotal * (this.cupom.valor / 100);
        }
        
        return Math.min(this.cupom.valor, subtotal);
    }

    // Calcular total
    calcularTotal() {
        return this.calcularSubtotal() - this.calcularDesconto();
    }

    // Contar itens
    contarItens() {
        return this.itens.reduce((total, item) => total + item.quantidade, 0);
    }

    // Renderizar carrinho
    renderizar() {
        // Atualizar contador
        if (this.contadorItens) {
            const totalItens = this.contarItens();
            this.contadorItens.textContent = totalItens;
        }

        // Verificar se carrinho está vazio
        if (this.itens.length === 0) {
            if (this.containerVazio) this.containerVazio.style.display = 'block';
            if (this.containerCheio) this.containerCheio.style.display = 'none';
            return;
        }

        // Mostrar carrinho cheio
        if (this.containerVazio) this.containerVazio.style.display = 'none';
        if (this.containerCheio) this.containerCheio.style.display = 'block';

        // Renderizar itens
        if (this.containerItens) {
            this.containerItens.innerHTML = '';
            
            this.itens.forEach(item => {
                const itemElemento = this.criarItemElemento(item);
                this.containerItens.appendChild(itemElemento);
            });
        }

        // Atualizar totais
        this.atualizarTotais();
    }

    // Criar elemento de item
    criarItemElemento(item) {
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        
        div.innerHTML = `
            <div class="carrinho-item-imagem">
                <span>🎬</span>
            </div>
            <div class="carrinho-item-info">
                <h4 class="carrinho-item-titulo">${item.titulo}</h4>
                <p class="carrinho-item-tipo">${item.tipo}</p>
                <p class="carrinho-item-preco">${Utils.formatarPreco(item.preco)}</p>
            </div>
            <div class="carrinho-item-quantidade">
                <button class="botao-quantidade" data-acao="diminuir" data-id="${item.id}">−</button>
                <span class="quantidade-valor">${item.quantidade}</span>
                <button class="botao-quantidade" data-acao="aumentar" data-id="${item.id}">+</button>
            </div>
            <div class="carrinho-item-total">
                ${Utils.formatarPreco(item.preco * item.quantidade)}
            </div>
            <button class="botao-remover" data-id="${item.id}" aria-label="Remover item">
                🗑
            </button>
        `;
        
        // Eventos de quantidade
        div.querySelectorAll('.botao-quantidade').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const acao = btn.getAttribute('data-acao');
                const item = this.itens.find(i => i.id === id);
                
                if (item) {
                    const novaQuantidade = acao === 'aumentar' ? item.quantidade + 1 : item.quantidade - 1;
                    this.atualizarQuantidade(id, novaQuantidade);
                }
            });
        });
        
        // Evento de remover
        div.querySelector('.botao-remover').addEventListener('click', () => {
            this.removerItem(item.id);
        });
        
        return div;
    }

    // Atualizar totais
    atualizarTotais() {
        const subtotal = this.calcularSubtotal();
        const desconto = this.calcularDesconto();
        const total = this.calcularTotal();
        
        if (this.subtotalElemento) {
            this.subtotalElemento.textContent = Utils.formatarPreco(subtotal);
        }
        
        if (this.descontoElemento) {
            this.descontoElemento.textContent = desconto > 0 ? `-${Utils.formatarPreco(desconto)}` : 'R$ 0,00';
        }
        
        if (this.totalElemento) {
            this.totalElemento.textContent = Utils.formatarPreco(total);
        }
        
        // Atualizar cupom
        this.atualizarCupomInfo();
    }

    // Atualizar informação do cupom
    atualizarCupomInfo() {
        if (this.cupomInfo) {
            if (this.cupom) {
                this.cupomInfo.innerHTML = `
                    <span>Cupom ${this.cupom.codigo} aplicado</span>
                    <button class="botao-remover-cupom" id="botaoRemoverCupom">✕</button>
                `;
                
                const botaoRemover = document.getElementById('botaoRemoverCupom');
                if (botaoRemover) {
                    botaoRemover.addEventListener('click', () => this.removerCupom());
                }
            } else {
                this.cupomInfo.innerHTML = '';
            }
        }
    }

    // Ir para checkout
    irParaCheckout() {
        if (this.itens.length === 0) {
            ToastManager.aviso('Seu carrinho está vazio');
            return;
        }
        
        window.location.href = 'checkout.html';
    }
}

// ========== FUNÇÕES AUXILIARES ==========
function adicionarAoCarrinho(produtoId, quantidade = 1) {
    // Buscar produto
    fetch(`${CARRINHO_CONFIG.API_URL}/produtos/${produtoId}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.sucesso) {
                if (!window.carrinho) {
                    window.carrinho = new Carrinho();
                }
                window.carrinho.adicionarItem(dados.produto, quantidade);
            }
        })
        .catch(erro => {
            console.error('Erro ao adicionar ao carrinho:', erro);
        });
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    window.carrinho = new Carrinho();
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Carrinho, adicionarAoCarrinho };
} else {
    window.Carrinho = Carrinho;
    window.adicionarAoCarrinho = adicionarAoCarrinho;
}
