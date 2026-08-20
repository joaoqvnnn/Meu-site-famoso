// ============================================
// STREAMPREMIUM - CORRETOR DE LINKS AUTOMÁTICO
// Este arquivo corrige TODOS os links entre páginas
// ============================================

(function() {
    
    // ========== LISTA DE PÁGINAS ==========
    const PAGINAS = [
        'index.html',
        'login.html',
        'cadastro.html',
        'catalogo.html',
        'produto.html',
        'carrinho.html',
        'checkout.html',
        'configuracao.html',
        'contato.html',
        'meus-pedidos.html',
        'meus-produtos.html',
        'minha-conta.html',
        'minhas-assinaturas.html',
        'pagamento-falhou.html',
        'pagamento-pendente.html',
        'pagamento-sucesso.html',
        'pagamentos.html',
        'privacidade.html',
        'recuperar-senha.html',
        'redefinir-senha.html',
        'termos.html',
        'verificar-email.html',
        'compra-aprovada.html',
        'pagamento-recusado.html',
        'assinatura-vencendo.html',
        'admin-login.html',
        'admin-dashboard.html',
        'usuarios.html',
        'usuario.html',
        'produtos.html',
        'pedidos.html',
        'pedido.html',
        'assinaturas.html',
        'cupons.html',
        'banners.html',
        'emails.html',
        'relatorios.html',
        'configuracoes.html',
        'administradores.html'
    ];
    
    // ========== FUNÇÃO CORRIGIR LINK ==========
    function corrigirLink(url) {
        if (!url) return url;
        
        // Ignorar links externos
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        
        // Ignorar âncoras
        if (url.startsWith('#')) return url;
        
        // Ignorar javascript
        if (url.startsWith('javascript:')) return url;
        
        // Ignorar se já tem frontend/
        if (url.includes('frontend/')) return url;
        
        // Se for uma página .html conhecida
        if (PAGINAS.includes(url)) {
            return 'frontend/' + url;
        }
        
        // Se termina com .html
        if (url.endsWith('.html')) {
            return 'frontend/' + url;
        }
        
        return url;
    }
    
    // ========== CORRIGIR LINKS <a> ==========
    function corrigirTodosLinks() {
        document.querySelectorAll('a[href]').forEach(link => {
            const hrefAtual = link.getAttribute('href');
            const hrefCorrigido = corrigirLink(hrefAtual);
            if (hrefAtual !== hrefCorrigido) {
                link.setAttribute('href', hrefCorrigido);
            }
        });
    }
    
    // ========== CORRIGIR FORMULÁRIOS ==========
    function corrigirFormularios() {
        document.querySelectorAll('form[action]').forEach(form => {
            const actionAtual = form.getAttribute('action');
            const actionCorrigido = corrigirLink(actionAtual);
            if (actionAtual !== actionCorrigido) {
                form.setAttribute('action', actionCorrigido);
            }
        });
    }
    
    // ========== CORRIGIR REDIRECIONAMENTOS ==========
    function corrigirRedirecionamentos() {
        // Interceptar window.location.href
        const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
        
        // Interceptar clicks em elementos com data-redirect
        document.addEventListener('click', function(e) {
            const elemento = e.target.closest('[data-redirect]');
            if (elemento) {
                const url = elemento.getAttribute('data-redirect');
                const urlCorrigida = corrigirLink(url);
                if (url !== urlCorrigida) {
                    e.preventDefault();
                    window.location.href = urlCorrigida;
                }
            }
        });
    }
    
    // ========== EXECUTAR AO CARREGAR ==========
    document.addEventListener('DOMContentLoaded', function() {
        corrigirTodosLinks();
        corrigirFormularios();
        corrigirRedirecionamentos();
    });
    
    // ========== EXECUTAR IMEDIATAMENTE ==========
    corrigirTodosLinks();
    corrigirFormularios();
    
    // ========== MONITORAR MUDANÇAS ==========
    const observador = new MutationObserver(function() {
        corrigirTodosLinks();
        corrigirFormularios();
    });
    
    observador.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();
