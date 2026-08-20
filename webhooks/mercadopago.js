// ============================================
// STREAMPREMIUM - WEBHOOKS MERCADO PAGO
// ============================================

const express = require('express');
const router = express.Router();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function processarPagamento(banco, dadosPagamento) {
    console.log('🔔 Processando webhook de pagamento...');
    console.log('Dados recebidos:', JSON.stringify(dadosPagamento, null, 2));

    const { id, status, external_reference, transaction_amount } = dadosPagamento;

    // Buscar pagamento pelo ID do Mercado Pago
    const pagamento = banco.buscarUm('pagamentos', { 
        mercadoPagoId: id 
    });

    if (!pagamento) {
        console.log(`⚠️ Pagamento ${id} não encontrado no banco`);
        return { sucesso: false, erro: 'Pagamento não encontrado' };
    }

    // Mapear status do Mercado Pago para status interno
    const mapaStatus = {
        'approved': 'aprovado',
        'pending': 'pendente',
        'in_process': 'processando',
        'rejected': 'falhou',
        'refunded': 'reembolsado',
        'cancelled': 'cancelado',
        'expired': 'expirado'
    };

    const statusInterno = mapaStatus[status] || status;

    // Atualizar pagamento
    banco.atualizar('pagamentos', pagamento.id, {
        status: statusInterno,
        atualizadoEm: new Date().toISOString(),
        webhookRecebido: new Date().toISOString()
    });

    // Se pagamento aprovado, atualizar pedido
    if (statusInterno === 'aprovado') {
        const pedido = banco.buscarPorId('pedidos', pagamento.pedidoId);
        if (pedido) {
            banco.atualizar('pedidos', pedido.id, {
                status: 'pago',
                atualizadoEm: new Date().toISOString()
            });
        }
    }

    // Se pagamento reembolsado, cancelar pedido
    if (statusInterno === 'reembolsado') {
        const pedido = banco.buscarPorId('pedidos', pagamento.pedidoId);
        if (pedido) {
            banco.atualizar('pedidos', pedido.id, {
                status: 'cancelado',
                atualizadoEm: new Date().toISOString()
            });
        }
    }

    console.log(`✅ Pagamento ${id} atualizado para: ${statusInterno}`);
    return { sucesso: true, status: statusInterno };
}

function processarAssinatura(banco, dadosAssinatura) {
    console.log('🔔 Processando webhook de assinatura...');

    const { id, status, external_reference } = dadosAssinatura;

    const assinatura = banco.buscarUm('assinaturas', {
        mercadoPagoId: id
    });

    if (!assinatura) {
        console.log(`⚠️ Assinatura ${id} não encontrada`);
        return { sucesso: false, erro: 'Assinatura não encontrada' };
    }

    const mapaStatus = {
        'authorized': 'ativa',
        'paused': 'pendente',
        'cancelled': 'cancelada',
        'expired': 'expirada'
    };

    const statusInterno = mapaStatus[status] || status;

    banco.atualizar('assinaturas', assinatura.id, {
        status: statusInterno,
        atualizadoEm: new Date().toISOString()
    });

    console.log(`✅ Assinatura ${id} atualizada para: ${statusInterno}`);
    return { sucesso: true, status: statusInterno };
}

// ============================================
// ROTAS DE WEBHOOK
// ============================================

// POST /api/webhooks/mercado-pago/pagamentos
// Webhook para pagamentos
router.post('/mercado-pago/pagamentos', (req, res) => {
    try {
        const banco = req.banco;
        const dados = req.body;

        console.log('============================================');
        console.log('📥 WEBHOOK MERCADO PAGO - PAGAMENTOS');
        console.log('============================================');

        const resultado = processarPagamento(banco, dados);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Webhook processado com sucesso',
            resultado
        });
    } catch (erro) {
        console.error('Erro ao processar webhook:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar webhook'
        });
    }
});

// POST /api/webhooks/mercado-pago/assinaturas
// Webhook para assinaturas
router.post('/mercado-pago/assinaturas', (req, res) => {
    try {
        const banco = req.banco;
        const dados = req.body;

        console.log('============================================');
        console.log('📥 WEBHOOK MERCADO PAGO - ASSINATURAS');
        console.log('============================================');

        const resultado = processarAssinatura(banco, dados);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Webhook processado com sucesso',
            resultado
        });
    } catch (erro) {
        console.error('Erro ao processar webhook:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar webhook'
        });
    }
});

// POST /api/webhooks/mercado-pago/notificacoes
// Webhook genérico para notificações
router.post('/mercado-pago/notificacoes', (req, res) => {
    try {
        const banco = req.banco;
        const dados = req.body;

        console.log('============================================');
        console.log('📥 WEBHOOK MERCADO PAGO - NOTIFICAÇÕES');
        console.log('============================================');
        console.log('Tipo:', dados.type);
        console.log('Ação:', dados.action);
        console.log('Dados:', JSON.stringify(dados.data, null, 2));

        // Registrar notificação
        banco.inserir('notificacoes', {
            tipo: dados.type,
            acao: dados.action,
            dados: JSON.stringify(dados.data),
            criadoEm: new Date().toISOString()
        });

        res.status(200).json({
            sucesso: true,
            mensagem: 'Notificação recebida'
        });
    } catch (erro) {
        console.error('Erro ao processar notificação:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar notificação'
        });
    }
});

// POST /api/webhooks/mercado-pago/geral
// Webhook geral (pega todos)
router.post('/mercado-pago/geral', (req, res) => {
    try {
        const banco = req.banco;
        const dados = req.body;

        console.log('============================================');
        console.log('📥 WEBHOOK MERCADO PAGO - GERAL');
        console.log('============================================');

        const { type, action, data } = dados;

        // Registrar no histórico
        banco.inserir('webhooks', {
            origem: 'mercado_pago',
            tipo: type,
            acao: action,
            dados: JSON.stringify(data),
            criadoEm: new Date().toISOString()
        });

        // Processar conforme o tipo
        let resultado = { sucesso: true };

        if (type === 'payment') {
            resultado = processarPagamento(banco, data);
        } else if (type === 'subscription') {
            resultado = processarAssinatura(banco, data);
        }

        res.status(200).json({
            sucesso: true,
            mensagem: 'Webhook processado',
            resultado
        });
    } catch (erro) {
        console.error('Erro no webhook geral:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar webhook'
        });
    }
});

// GET /api/webhooks/mercado-pago/status
// Verificar status do webhook
router.get('/mercado-pago/status', (req, res) => {
    res.json({
        sucesso: true,
        status: 'ativo',
        webhooksRegistrados: [
            'pagamentos',
            'assinaturas',
            'notificacoes',
            'geral'
        ]
    });
});

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = router;
