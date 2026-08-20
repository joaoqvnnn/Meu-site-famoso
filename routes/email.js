// ============================================
// STREAMPREMIUM - ROTAS DE E-MAILS
// ============================================

const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { JWT_CONFIG, EMAIL_CONFIG } = require('../config/configuracao');

const router = express.Router();

// ============================================
// CONFIGURAÇÃO DO TRANSPORTER DE E-MAIL
// ============================================
let transporter = null;

function inicializarTransporter() {
    if (EMAIL_CONFIG.user && EMAIL_CONFIG.password) {
        transporter = nodemailer.createTransport({
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            secure: EMAIL_CONFIG.secure,
            auth: {
                user: EMAIL_CONFIG.user,
                pass: EMAIL_CONFIG.password
            }
        });
    } else {
        console.log('⚠️ Email transporter não configurado. Usando modo simulação.');
    }
}

inicializarTransporter();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
async function enviarEmail(destinatario, assunto, conteudo) {
    if (!transporter) {
        // Modo simulação
        console.log(`📧 Email simulado:`);
        console.log(`   Para: ${destinatario}`);
        console.log(`   Assunto: ${assunto}`);
        console.log(`   Conteúdo: ${conteudo.substring(0, 100)}...`);
        return { sucesso: true, simulado: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
            to: destinatario,
            subject: assunto,
            html: conteudo
        });
        return { sucesso: true, simulado: false, messageId: info.messageId };
    } catch (erro) {
        console.error('Erro ao enviar email:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

function gerarTemplateEmail(titulo, corpo) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0a0a0a; color: #fff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>StreamPremium</h1>
                </div>
                <div class="content">
                    <h2>${titulo}</h2>
                    ${corpo}
                </div>
                <div class="footer">
                    <p>© 2024 StreamPremium. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ============================================
// MIDDLEWARES
// ============================================
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            sucesso: false,
            erro: 'Token não fornecido' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret);
        req.usuario = decoded;
        next();
    } catch (erro) {
        return res.status(403).json({ 
            sucesso: false,
            erro: 'Token inválido ou expirado' 
        });
    }
}

function autenticarAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            sucesso: false,
            erro: 'Token não fornecido' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret);
        if (decoded.tipo !== 'admin') {
            return res.status(403).json({ 
                sucesso: false,
                erro: 'Acesso negado. Requer permissão de administrador' 
            });
        }
        req.admin = decoded;
        next();
    } catch (erro) {
        return res.status(403).json({ 
            sucesso: false,
            erro: 'Token inválido ou expirado' 
        });
    }
}

// ============================================
// ROTAS DE USUÁRIO
// ============================================

// POST /api/emails/enviar
// Enviar e-mail (para usuários autenticados)
router.post('/enviar', autenticarToken, async (req, res) => {
    try {
        const banco = req.banco;
        const { destinatario, assunto, mensagem } = req.body;

        if (!destinatario || !assunto || !mensagem) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Destinatário, assunto e mensagem são obrigatórios' 
            });
        }

        const corpoEmail = gerarTemplateEmail(assunto, `<p>${mensagem}</p>`);
        const resultado = await enviarEmail(destinatario, assunto, corpoEmail);

        // Registrar e-mail
        const emailRegistro = banco.inserir('emails', {
            usuarioId: req.usuario.id,
            destinatario,
            assunto,
            tipo: 'personalizado',
            status: resultado.sucesso ? 'enviado' : 'falhou',
            conteudo: mensagem,
            criadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: resultado.sucesso,
            mensagem: resultado.sucesso ? 'E-mail enviado com sucesso' : 'Falha ao enviar e-mail',
            email: emailRegistro
        });
    } catch (erro) {
        console.error('Erro ao enviar email:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// GET /api/emails/historico
// Histórico de e-mails do usuário
router.get('/historico', autenticarToken, (req, res) => {
    try {
        const banco = req.banco;
        const emails = banco.buscarTodos('emails', { usuarioId: req.usuario.id });

        res.json({
            sucesso: true,
            emails
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/emails/verificar
// Enviar e-mail de verificação
router.post('/verificar', autenticarToken, async (req, res) => {
    try {
        const banco = req.banco;
        const usuario = banco.buscarPorId('usuarios', req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Usuário não encontrado' 
            });
        }

        const codigo = Math.floor(100000 + Math.random() * 900000);
        const corpoEmail = gerarTemplateEmail(
            'Verificação de E-mail',
            `<p>Olá ${usuario.nome},</p>
             <p>Seu código de verificação é:</p>
             <h2 style="text-align:center;font-size:32px;letter-spacing:5px;">${codigo}</h2>
             <p>Este código expira em 30 minutos.</p>`
        );

        const resultado = await enviarEmail(usuario.email, 'Código de Verificação', corpoEmail);

        res.json({
            sucesso: resultado.sucesso,
            mensagem: 'Código de verificação enviado',
            codigo: codigo // Em produção, não retornar o código
        });
    } catch (erro) {
        console.error('Erro ao enviar verificação:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/emails/admin/todos
// Listar todos os e-mails (admin)
router.get('/admin/todos', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const { status, tipo, busca, limit, page } = req.query;

        let emails = banco.buscarTodos('emails');

        // Filtrar por status
        if (status) {
            emails = emails.filter(e => e.status === status);
        }

        // Filtrar por tipo
        if (tipo) {
            emails = emails.filter(e => e.tipo === tipo);
        }

        // Buscar por destinatário ou assunto
        if (busca) {
            const termo = busca.toLowerCase();
            emails = emails.filter(e => 
                e.destinatario.toLowerCase().includes(termo) ||
                e.assunto.toLowerCase().includes(termo)
            );
        }

        // Paginação
        const limitNum = parseInt(limit) || 20;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;
        const total = emails.length;
        const totalPaginas = Math.ceil(total / limitNum);
        emails = emails.slice(offset, offset + limitNum);

        res.json({
            sucesso: true,
            total,
            totalPaginas,
            paginaAtual: pageNum,
            emails
        });
    } catch (erro) {
        console.error('Erro ao listar emails:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/emails/admin/enviar-para-todos
// Enviar e-mail para todos os usuários (admin)
router.post('/admin/enviar-para-todos', autenticarAdmin, async (req, res) => {
    try {
        const banco = req.banco;
        const { assunto, mensagem } = req.body;

        if (!assunto || !mensagem) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Assunto e mensagem são obrigatórios' 
            });
        }

        const usuarios = banco.buscarTodos('usuarios', { status: 'ativo' });
        const corpoEmail = gerarTemplateEmail(assunto, `<p>${mensagem}</p>`);

        let enviados = 0;
        let falhas = 0;

        for (const usuario of usuarios) {
            const resultado = await enviarEmail(usuario.email, assunto, corpoEmail);
            
            banco.inserir('emails', {
                destinatario: usuario.email,
                assunto,
                tipo: 'marketing',
                status: resultado.sucesso ? 'enviado' : 'falhou',
                conteudo: mensagem,
                criadoEm: new Date().toISOString()
            });

            if (resultado.sucesso) {
                enviados++;
            } else {
                falhas++;
            }
        }

        res.json({
            sucesso: true,
            mensagem: `E-mails enviados: ${enviados}, Falhas: ${falhas}`,
            totalEnviados: enviados,
            totalFalhas: falhas
        });
    } catch (erro) {
        console.error('Erro ao enviar para todos:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// POST /api/emails/admin/enviar-para-usuario
// Enviar e-mail para um usuário específico (admin)
router.post('/admin/enviar-para-usuario', autenticarAdmin, async (req, res) => {
    try {
        const banco = req.banco;
        const { usuarioId, assunto, mensagem } = req.body;

        if (!usuarioId || !assunto || !mensagem) {
            return res.status(400).json({ 
                sucesso: false,
                erro: 'Usuário, assunto e mensagem são obrigatórios' 
            });
        }

        const usuario = banco.buscarPorId('usuarios', usuarioId);
        if (!usuario) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Usuário não encontrado' 
            });
        }

        const corpoEmail = gerarTemplateEmail(assunto, `<p>${mensagem}</p>`);
        const resultado = await enviarEmail(usuario.email, assunto, corpoEmail);

        const emailRegistro = banco.inserir('emails', {
            destinatario: usuario.email,
            assunto,
            tipo: 'administrativo',
            status: resultado.sucesso ? 'enviado' : 'falhou',
            conteudo: mensagem,
            criadoEm: new Date().toISOString()
        });

        res.json({
            sucesso: resultado.sucesso,
            mensagem: resultado.sucesso ? 'E-mail enviado com sucesso' : 'Falha ao enviar e-mail',
            email: emailRegistro
        });
    } catch (erro) {
        console.error('Erro ao enviar para usuário:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// DELETE /api/emails/admin/:id
// Excluir e-mail (admin)
router.delete('/admin/:id', autenticarAdmin, (req, res) => {
    try {
        const banco = req.banco;
        const id = parseInt(req.params.id);
        const email = banco.buscarPorId('emails', id);

        if (!email) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'E-mail não encontrado' 
            });
        }

        banco.remover('emails', id);

        res.json({
            sucesso: true,
            mensagem: 'E-mail excluído com sucesso'
        });
    } catch (erro) {
        console.error('Erro ao excluir email:', erro);
        res.status(500).json({ 
            sucesso: false,
            erro: 'Erro interno do servidor' 
        });
    }
});

// ============================================
// EXPORTAÇÃO
// ============================================
module.exports = router;
