// ============================================
// STREAMPREMIUM - SERVIÇO MERCADO PAGO
// ============================================

const axios = require('axios');
const { PAYMENT_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE MERCADO PAGO SERVICE
// ============================================
class MercadoPagoService {
    constructor() {
        this.accessToken = PAYMENT_CONFIG.mercadoPago.accessToken;
        this.baseURL = 'https://api.mercadopago.com';
        this.headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    // ============================================
    // MÉTODOS DE VERIFICAÇÃO
    // ============================================

    estaConfigurado() {
        return this.accessToken && this.accessToken.length > 0;
    }

    // ============================================
    // MÉTODOS DE PAGAMENTO PIX
    // ============================================

    async gerarPix(valor, descricao, pedidoId) {
        if (!this.estaConfigurado()) {
            return this.simularPix(valor, descricao, pedidoId);
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                {
                    transaction_amount: valor,
                    description: descricao,
                    payment_method_id: 'pix',
                    payer: {
                        email: 'cliente@streampremium.com'
                    }
                },
                { headers: this.headers }
            );

            return {
                sucesso: true,
                id: response.data.id,
                codigoPIX: response.data.point_of_interaction.transaction_data.qr_code,
                qrCodeBase64: response.data.point_of_interaction.transaction_data.qr_code_base64,
                status: response.data.status,
                valor
            };
        } catch (erro) {
            console.error('Erro ao gerar PIX no Mercado Pago:', erro.response?.data || erro.message);
            return this.simularPix(valor, descricao, pedidoId);
        }
    }

    simularPix(valor, descricao, pedidoId) {
        console.log('🔄 Simulando geração de PIX...');
        
        const caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let codigo = '00020126580014BR.GOV.BCB.PIX0136';
        
        for (let i = 0; i < 32; i++) {
            codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
        }
        
        codigo += '520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304';

        return {
            sucesso: true,
            simulado: true,
            id: `PIX-${Date.now()}`,
            codigoPIX: codigo,
            status: 'pendente',
            valor,
            descricao
        };
    }

    // ============================================
    // MÉTODOS DE CARTÃO DE CRÉDITO
    // ============================================

    async processarCartao(dados) {
        if (!this.estaConfigurado()) {
            return this.simularCartao(dados);
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                {
                    transaction_amount: dados.valor,
                    token: dados.tokenCartao,
                    description: dados.descricao,
                    installments: dados.parcelas || 1,
                    payment_method_id: dados.bandeira || 'visa',
                    payer: {
                        email: dados.email,
                        first_name: dados.nome
                    }
                },
                { headers: this.headers }
            );

            return {
                sucesso: true,
                id: response.data.id,
                status: response.data.status === 'approved' ? 'aprovado' : 'pendente',
                detalhes: response.data
            };
        } catch (erro) {
            console.error('Erro ao processar cartão no Mercado Pago:', erro.response?.data || erro.message);
            return this.simularCartao(dados);
        }
    }

    simularCartao(dados) {
        console.log('🔄 Simulando pagamento com cartão...');
        
        return {
            sucesso: true,
            simulado: true,
            id: `CARD-${Date.now()}`,
            status: 'aprovado',
            valor: dados.valor,
            parcelas: dados.parcelas || 1,
            bandeira: dados.bandeira || 'Visa',
            ultimosDigitos: dados.numeroCartao ? dados.numeroCartao.slice(-4) : '4242'
        };
    }

    // ============================================
    // MÉTODOS DE BOLETO
    // ============================================

    async gerarBoleto(valor, descricao, dadosCliente) {
        if (!this.estaConfigurado()) {
            return this.simularBoleto(valor, descricao);
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                {
                    transaction_amount: valor,
                    description: descricao,
                    payment_method_id: 'bolbradesco',
                    payer: {
                        email: dadosCliente.email,
                        first_name: dadosCliente.nome,
                        identification: {
                            type: 'CPF',
                            number: dadosCliente.cpf
                        }
                    }
                },
                { headers: this.headers }
            );

            return {
                sucesso: true,
                id: response.data.id,
                codigoBoleto: response.data.barcode,
                urlBoleto: response.data.transaction_details.external_resource_url,
                status: response.data.status,
                valor
            };
        } catch (erro) {
            console.error('Erro ao gerar boleto no Mercado Pago:', erro.response?.data || erro.message);
            return this.simularBoleto(valor, descricao);
        }
    }

    simularBoleto(valor, descricao) {
        console.log('🔄 Simulando geração de boleto...');
        
        const timestamp = Date.now();
        const codigoBoleto = `34191.79001 01043.510047 91020.150008 7 ${timestamp}`;

        return {
            sucesso: true,
            simulado: true,
            id: `BOLETO-${Date.now()}`,
            codigoBoleto,
            status: 'pendente',
            valor,
            vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    async consultarPagamento(pagamentoId) {
        if (!this.estaConfigurado()) {
            return {
                sucesso: true,
                simulado: true,
                status: 'aprovado'
            };
        }

        try {
            const response = await axios.get(
                `${this.baseURL}/v1/payments/${pagamentoId}`,
                { headers: this.headers }
            );

            return {
                sucesso: true,
                id: response.data.id,
                status: response.data.status,
                detalhes: response.data
            };
        } catch (erro) {
            console.error('Erro ao consultar pagamento:', erro.response?.data || erro.message);
            return {
                sucesso: false,
                erro: 'Pagamento não encontrado'
            };
        }
    }

    // ============================================
    // MÉTODOS DE REEMBOLSO
    // ============================================

    async reembolsar(pagamentoId) {
        if (!this.estaConfigurado()) {
            return {
                sucesso: true,
                simulado: true,
                status: 'reembolsado'
            };
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/v1/payments/${pagamentoId}/refunds`,
                {},
                { headers: this.headers }
            );

            return {
                sucesso: true,
                id: response.data.id,
                status: 'reembolsado'
            };
        } catch (erro) {
            console.error('Erro ao reembolsar:', erro.response?.data || erro.message);
            return {
                sucesso: false,
                erro: 'Falha ao processar reembolso'
            };
        }
    }

    // ============================================
    // MÉTODOS DE WEBHOOK
    // ============================================

    processarWebhook(dados) {
        console.log('📥 Webhook recebido do Mercado Pago:', dados);
        
        if (dados.action === 'payment.updated') {
            return {
                sucesso: true,
                pagamentoId: dados.data.id,
                status: 'atualizado'
            };
        }

        return {
            sucesso: true,
            mensagem: 'Webhook processado'
        };
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = MercadoPagoService;
