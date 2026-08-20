// ============================================
// STREAMPREMIUM - JAVASCRIPT DO CHECKOUT
// ============================================

// ========== CONFIGURAÇÕES ==========
const CHECKOUT_CONFIG = {
    API_URL: 'http://localhost:3000/api',
    CHAVE_CARRINHO: 'streampremium_carrinho',
    CHAVE_CUPOM: 'streampremium_cupom',
    CHAVE_PEDIDO: 'streampremium_pedido'
};

// ========== CLASSE CHECKOUT ==========
class Checkout {
    constructor() {
        this.carrinho = [];
        this.cupom = null;
        this.metodoPagamento = 'cartao';
        this.inicializar();
    }

    // Inicializar checkout
    inicializar() {
        this.carregarCarrinho();
        this.obterElementos();
        this.adicionarEventos();
        this.renderizarResumo();
    }

    // Carregar carrinho
    carregarCarrinho() {
        try {
            this.carrinho = JSON.parse(localStorage.getItem(CHECKOUT_CONFIG.CHAVE_CARRINHO)) || [];
            this.cupom = JSON.parse(localStorage.getItem(CHECKOUT_CONFIG.CHAVE_CUPOM)) || null;
        } catch (erro) {
            this.carrinho = [];
            this.cupom = null;
        }
    }

    // Obter elementos
    obterElementos() {
        this.formulario = document.getElementById('checkoutFormulario');
        this.resumoItens = document.getElementById('resumoItens');
        this.subtotalElemento = document.getElementById('subtotal');
        this.descontoElemento = document.getElementById('desconto');
        this.totalElemento = document.getElementById('total');
        this.botaoConfirmar = document.getElementById('botaoConfirmar');
        
        // Campos de endereço
        this.inputCEP = document.getElementById('cep');
        this.inputEndereco = document.getElementById('endereco');
        this.inputCidade = document.getElementById('cidade');
        this.inputEstado = document.getElementById('estado');
        
        // Campos de cartão
        this.inputCartao = document.getElementById('numeroCartao');
        this.inputValidade = document.getElementById('validade');
        this.inputCVV = document.getElementById('cvv');
        this.inputNomeCartao = document.getElementById('nomeCartao');
        
        // Métodos de pagamento
        this.metodosPagamento = document.querySelectorAll('[data-metodo]');
    }

    // Adicionar eventos
    adicionarEventos() {
        // Formatação de CEP
        if (this.inputCEP) {
            this.inputCEP.addEventListener('input', () => {
                this.inputCEP.value = this.formatarCEP(this.inputCEP.value);
            });
        }

        // Formatação de cartão
        if (this.inputCartao) {
            this.inputCartao.addEventListener('input', () => {
                this.inputCartao.value = this.formatarCartao(this.inputCartao.value);
            });
        }

        // Formatação de validade
        if (this.inputValidade) {
            this.inputValidade.addEventListener('input', () => {
                this.inputValidade.value = this.formatarValidade(this.inputValidade.value);
            });
        }

        // Formatação de CVV
        if (this.inputCVV) {
            this.inputCVV.addEventListener('input', () => {
                this.inputCVV.value = this.inputCVV.value.replace(/\D/g, '');
            });
        }

        // Métodos de pagamento
        this.metodosPagamento.forEach(metodo => {
            metodo.addEventListener('click', () => {
                this.metodosPagamento.forEach(m => m.classList.remove('ativo'));
                metodo.classList.add('ativo');
                this.metodoPagamento = metodo.getAttribute('data-metodo');
                this.atualizarCamposPagamento();
            });
        });

        // Botão confirmar
        if (this.botaoConfirmar) {
            this.botaoConfirmar.addEventListener('click', (e) => {
                e.preventDefault();
                this.processarPagamento();
            });
        }

        // Buscar CEP
        if (this.inputCEP) {
            this.inputCEP.addEventListener('blur', () => {
                this.buscarEnderecoPorCEP();
            });
        }
    }

    // Formatar CEP
    formatarCEP(valor) {
        return valor.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
    }

    // Formatar cartão
    formatarCartao(valor) {
        return valor.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }

    // Formatar validade
    formatarValidade(valor) {
        return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
    }

    // Atualizar campos de pagamento
    atualizarCamposPagamento() {
        const camposCartao = document.getElementById('camposCartao');
        const camposPix = document.getElementById('camposPix');
        const camposBoleto = document.getElementById('camposBoleto');
        
        if (camposCartao) camposCartao.style.display = this.metodoPagamento === 'cartao' ? 'block' : 'none';
        if (camposPix) camposPix.style.display = this.metodoPagamento === 'pix' ? 'block' : 'none';
        if (camposBoleto) camposBoleto.style.display = this.metodoPagamento === 'boleto' ? 'block' : 'none';
    }

    // Buscar endereço por CEP
    async buscarEnderecoPorCEP() {
        if (!this.inputCEP) return;
        
        const cep = this.inputCEP.value.replace(/\D/g, '');
        
        if (cep.length !== 8) return;
        
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await response.json();
            
            if (!dados.erro) {
                if (this.inputEndereco) this.inputEndereco.value = `${dados.logradouro}, ${dados.bairro}`;
                if (this.inputCidade) this.inputCidade.value = dados.localidade;
                if (this.inputEstado) this.inputEstado.value = dados.uf;
            }
        } catch (erro) {
            console.error('Erro ao buscar CEP:', erro);
        }
    }

    // Renderizar resumo
    renderizarResumo() {
        if (!this.resumoItens) return;
        
        this.resumoItens.innerHTML = '';
        
        this.carrinho.forEach(item => {
            const div = document.createElement('div');
            div.className = 'resumo-item';
            div.innerHTML = `
                <span class="resumo-item-nome">${item.titulo} (${item.quantidade}x)</span>
                <span class="resumo-item-preco">${Utils.formatarPreco(item.preco * item.quantidade)}</span>
            `;
            this.resumoItens.appendChild(div);
        });
        
        this.atualizarTotais();
    }

    // Calcular subtotal
    calcularSubtotal() {
        return this.carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
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
    }

    // Validar formulário
    validarFormulario() {
        // Validar endereço
        const cep = this.inputCEP ? this.inputCEP.value.replace(/\D/g, '') : '';
        const endereco = this.inputEndereco ? this.inputEndereco.value : '';
        const cidade = this.inputCidade ? this.inputCidade.value : '';
        const estado = this.inputEstado ? this.inputEstado.value : '';
        
        if (cep.length !== 8) {
            ToastManager.erro('CEP inválido');
            return false;
        }
        
        if (!endereco || endereco.length < 5) {
            ToastManager.erro('Endereço inválido');
            return false;
        }
        
        if (!cidade || cidade.length < 2) {
            ToastManager.erro('Cidade inválida');
            return false;
        }
        
        if (!estado || estado.length !== 2) {
            ToastManager.erro('Estado inválido');
            return false;
        }
        
        // Validar cartão se método for cartão
        if (this.metodoPagamento === 'cartao') {
            const cartao = this.inputCartao ? this.inputCartao.value.replace(/\D/g, '') : '';
            const validade = this.inputValidade ? this.inputValidade.value : '';
            const cvv = this.inputCVV ? this.inputCVV.value : '';
            const nomeCartao = this.inputNomeCartao ? this.inputNomeCartao.value : '';
            
            if (cartao.length < 13 || cartao.length > 16) {
                ToastManager.erro('Número do cartão inválido');
                return false;
            }
            
            if (!/^\d{2}\/\d{2}$/.test(validade)) {
                ToastManager.erro('Validade do cartão inválida');
                return false;
            }
            
            if (cvv.length < 3 || cvv.length > 4) {
                ToastManager.erro('CVV inválido');
                return false;
            }
            
            if (nomeCartao.length < 3) {
                ToastManager.erro('Nome no cartão inválido');
                return false;
            }
        }
        
        return true;
    }

    // Processar pagamento
    async processarPagamento() {
        if (!this.validarFormulario()) {
            return;
        }
        
        if (this.carrinho.length === 0) {
            ToastManager.erro('Carrinho vazio');
            return;
        }
        
        // Desabilitar botão
        this.botaoConfirmar.disabled = true;
        this.botaoConfirmar.textContent = 'Processando...';
        
        try {
            const dadosPedido = {
                itens: this.carrinho.map(item => ({
                    produtoId: item.id,
                    quantidade: item.quantidade
                })),
                cupom: this.cupom ? this.cupom.codigo : null,
                metodoPagamento: this.metodoPagamento,
                endereco: {
                    cep: this.inputCEP.value,
                    endereco: this.inputEndereco.value,
                    cidade: this.inputCidade.value,
                    estado: this.inputEstado.value
                }
            };
            
            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Criar pedido
            const pedido = {
                numero: '#SP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
                total: this.calcularTotal(),
                metodo: this.metodoPagamento,
                data: new Date().toISOString()
            };
            
            // Salvar pedido
            localStorage.setItem(CHECKOUT_CONFIG.CHAVE_PEDIDO, JSON.stringify(pedido));
            
            // Limpar carrinho
            localStorage.removeItem(CHECKOUT_CONFIG.CHAVE_CARRINHO);
            localStorage.removeItem(CHECKOUT_CONFIG.CHAVE_CUPOM);
            
            // Redirecionar conforme método
            if (this.metodoPagamento === 'pix') {
                window.location.href = 'pagamento-pendente.html';
            } else if (this.metodoPagamento === 'cartao') {
                window.location.href = 'compra-aprovada.html';
            } else {
                window.location.href = 'pagamento-pendente.html';
            }
        } catch (erro) {
            console.error('Erro no processamento:', erro);
            ToastManager.erro('Erro ao processar pagamento');
            
            this.botaoConfirmar.disabled = false;
            this.botaoConfirmar.textContent = 'Confirmar pagamento';
        }
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    window.checkout = new Checkout();
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Checkout };
} else {
    window.Checkout = Checkout;
}
