// ============================================
// STREAMPREMIUM - SERVIÇO DE E-MAIL
// ============================================

const nodemailer = require('nodemailer');
const { EMAIL_CONFIG } = require('../config/configuracao');

// ============================================
// CLASSE EMAIL SERVICE
// ============================================
class EmailService {
    constructor() {
        this.transporter = null;
        this.inicializar();
    }

    // ============================================
    // INICIALIZAÇÃO
    // ============================================

    inicializar() {
        if (EMAIL_CONFIG.user && EMAIL_CONFIG.password) {
            this.transporter = nodemailer.createTransport({
                host: EMAIL_CONFIG.host,
                port: EMAIL_CONFIG.port,
                secure: EMAIL_CONFIG.secure,
                auth: {
                    user: EMAIL_CONFIG.user,
                    pass: EMAIL_CONFIG.password
                }
            });
            console.log('📧 Serviço de e-mail configurado com sucesso');
        } else {
            console.log('⚠️ Serviço de e-mail em modo simulação (sem credenciais SMTP)');
        }
    }

    // ============================================
    // MÉTODOS DE ENVIO
    // ============================================

    async enviar(destinatario, assunto, conteudo) {
        if (!this.transporter) {
            // Modo simulação
            console.log('============================================');
            console.log('📧 E-MAIL SIMULADO');
            console.log('============================================');
            console.log(`Para: ${destinatario}`);
            console.log(`Assunto: ${assunto}`);
            console.log(`Conteúdo: ${conteudo.substring(0, 200)}...`);
            console.log('============================================');
            
            return {
                sucesso: true,
                simulado: true,
                destinatario,
                assunto
            };
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
                to: destinatario,
                subject: assunto,
                html: conteudo
            });

            return {
                sucesso: true,
                simulado: false,
                messageId: info.messageId,
                destinatario,
                assunto
            };
        } catch (erro) {
            console.error('Erro ao enviar e-mail:', erro);
            return {
                sucesso: false,
                erro: erro.message,
                destinatario,
                assunto
            };
        }
    }

    async enviarParaMultiplos(destinatarios, assunto, conteudo) {
        const resultados = [];

        for (const destinatario of destinatarios) {
            const resultado = await this.enviar(destinatario, assunto, conteudo);
            resultados.push(resultado);
        }

        const enviados = resultados.filter(r => r.sucesso).length;
        const falhas = resultados.filter(r => !r.sucesso).length;

        return {
            sucesso: true,
            totalDestinatarios: destinatarios.length,
            enviados,
            falhas,
            resultados
        };
    }

    // ============================================
    // MÉTODOS DE TEMPLATES
    // ============================================

    gerarTemplateBase(titulo, corpo) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: #0a0a0a;
                        color: #ffffff;
                        padding: 25px;
                        text-align: center;
                        border-radius: 15px 15px 0 0;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        letter-spacing: 1px;
                    }
                    .content {
                        background: #ffffff;
                        padding: 30px;
                        border-radius: 0 0 15px 15px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .content h2 {
                        color: #0a0a0a;
                        margin-top: 0;
                    }
                    .button {
                        display: inline-block;
                        background: #0a0a0a;
                        color: #ffffff !important;
                        padding: 12px 25px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 15px 0;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #999;
                        text-align: center;
                    }
                    .code {
                        font-size: 32px;
                        letter-spacing: 8px;
                        font-weight: bold;
                        text-align: center;
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>▶ StreamPremium</h1>
                    </div>
                    <div class="content">
                        <h2>${titulo}</h2>
                        ${corpo}
                    </div>
                    <div class="footer">
                        <p>© 2024 StreamPremium. Todos os direitos reservados.</p>
                        <p>Este é um e-mail automático. Não responda esta mensagem.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    templateBoasVindas(nomeUsuario) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Bem-vindo ao <strong>StreamPremium</strong>! Estamos muito felizes em ter você conosco.</p>
            <p>Com sua conta, você pode:</p>
            <ul>
                <li>Assistir filmes e séries exclusivos</li>
                <li>Baixar conteúdo para assistir offline</li>
                <li>Receber recomendações personalizadas</li>
            </ul>
            <p>Comece a explorar nosso catálogo agora mesmo!</p>
            <a href="#" class="button">🎬 Explorar catálogo</a>
        `;

        return this.gerarTemplateBase('Bem-vindo ao StreamPremium!', corpo);
    }

    templateVerificacaoEmail(nomeUsuario, codigo) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Para verificar seu e-mail, use o código abaixo:</p>
            <div class="code">${codigo}</div>
            <p>Este código expira em <strong>30 minutos</strong>.</p>
            <p>Se você não solicitou esta verificação, ignore este e-mail.</p>
        `;

        return this.gerarTemplateBase('Código de Verificação', corpo);
    }

    templateRecuperacaoSenha(nomeUsuario, linkRecuperacao) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${linkRecuperacao}" class="button">🔑 Redefinir senha</a>
            <p>Este link expira em <strong>1 hora</strong>.</p>
            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        `;

        return this.gerarTemplateBase('Recuperação de Senha', corpo);
    }

    templateConfirmacaoPedido(nomeUsuario, pedido) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Seu pedido foi confirmado com sucesso!</p>
            <p><strong>Número do pedido:</strong> ${pedido.numero}</p>
            <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
            <p>Você pode acompanhar o status do seu pedido na sua conta.</p>
            <a href="#" class="button">📦 Ver meus pedidos</a>
        `;

        return this.gerarTemplateBase('Pedido Confirmado', corpo);
    }

    templateConfirmacaoPagamento(nomeUsuario, pagamento) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Seu pagamento foi processado com sucesso!</p>
            <p><strong>Valor:</strong> R$ ${pagamento.valor.toFixed(2)}</p>
            <p><strong>Método:</strong> ${pagamento.metodo}</p>
            <p>Obrigado por escolher o StreamPremium!</p>
        `;

        return this.gerarTemplateBase('Pagamento Confirmado', corpo);
    }

    templateAssinaturaAtivada(nomeUsuario, plano) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>Sua assinatura <strong>${plano.nome}</strong> foi ativada com sucesso!</p>
            <p>Aproveite todos os benefícios do seu plano:</p>
            <ul>
                ${plano.recursos.map(recurso => `<li>${recurso}</li>`).join('')}
            </ul>
            <a href="#" class="button">🎬 Começar a assistir</a>
        `;

        return this.gerarTemplateBase('Assinatura Ativada', corpo);
    }

    templatePromocao(nomeUsuario, promocao) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>🔥 Promoção especial para você!</p>
            <p><strong>${promocao.titulo}</strong></p>
            <p>${promocao.descricao}</p>
            <p>Use o cupom: <strong>${promocao.codigo}</strong></p>
            <a href="#" class="button">🎁 Aproveitar oferta</a>
        `;

        return this.gerarTemplateBase('Promoção Especial', corpo);
    }

    templateNotificacao(nomeUsuario, titulo, mensagem) {
        const corpo = `
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            <p>${mensagem}</p>
        `;

        return this.gerarTemplateBase(titulo, corpo);
    }

    // ============================================
    // MÉTODOS DE ENVIO ESPECÍFICOS
    // ============================================

    async enviarBoasVindas(usuario) {
        const conteudo = this.templateBoasVindas(usuario.nome);
        return await this.enviar(usuario.email, 'Bem-vindo ao StreamPremium!', conteudo);
    }

    async enviarVerificacaoEmail(usuario, codigo) {
        const conteudo = this.templateVerificacaoEmail(usuario.nome, codigo);
        return await this.enviar(usuario.email, 'Código de Verificação', conteudo);
    }

    async enviarRecuperacaoSenha(usuario, link) {
        const conteudo = this.templateRecuperacaoSenha(usuario.nome, link);
        return await this.enviar(usuario.email, 'Recuperação de Senha', conteudo);
    }

    async enviarConfirmacaoPedido(usuario, pedido) {
        const conteudo = this.templateConfirmacaoPedido(usuario.nome, pedido);
        return await this.enviar(usuario.email, 'Pedido Confirmado', conteudo);
    }

    async enviarConfirmacaoPagamento(usuario, pagamento) {
        const conteudo = this.templateConfirmacaoPagamento(usuario.nome, pagamento);
        return await this.enviar(usuario.email, 'Pagamento Confirmado', conteudo);
    }

    async enviarAssinaturaAtivada(usuario, plano) {
        const conteudo = this.templateAssinaturaAtivada(usuario.nome, plano);
        return await this.enviar(usuario.email, 'Assinatura Ativada', conteudo);
    }

    async enviarPromocao(usuario, promocao) {
        const conteudo = this.templatePromocao(usuario.nome, promocao);
        return await this.enviar(usuario.email, 'Promoção Especial', conteudo);
    }

    async enviarNotificacao(usuario, titulo, mensagem) {
        const conteudo = this.templateNotificacao(usuario.nome, titulo, mensagem);
        return await this.enviar(usuario.email, titulo, conteudo);
    }

    async enviarParaTodos(usuarios, titulo, mensagem) {
        const resultados = [];

        for (const usuario of usuarios) {
            const conteudo = this.templateNotificacao(usuario.nome, titulo, mensagem);
            const resultado = await this.enviar(usuario.email, titulo, conteudo);
            resultados.push({
                usuarioId: usuario.id,
                email: usuario.email,
                ...resultado
            });
        }

        return resultados;
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = EmailService;
