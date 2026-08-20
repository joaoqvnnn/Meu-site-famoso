// ============================================
// CORRIGIR LINKS AUTOMATICAMENTE
// Este script redireciona todos os links
// ============================================

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    
    // Corrigir todos os links <a>
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        
        // Ignorar links externos e âncoras
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript')) {
            return;
        }
        
        // Ignorar links que já começam com frontend/
        if (href.startsWith('frontend/')) {
            return;
        }
        
        // Se o link termina com .html
        if (href.endsWith('.html')) {
            link.setAttribute('href', 'frontend/' + href);
        }
    });
    
    // Corrigir formulários
    document.querySelectorAll('form[action]').forEach(form => {
        const action = form.getAttribute('action');
        
        if (action && action.endsWith('.html')) {
            form.setAttribute('action', 'frontend/' + action);
        }
    });
    
    // Corrigir redirecionamentos JavaScript
    const originalLocation = window.location.href;
    
    // Interceptar window.location.href = 'pagina.html'
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
        if (url && url.endsWith('.html') && !url.startsWith('frontend/')) {
            url = 'frontend/' + url;
        }
        return originalAssign.call(window.location, url);
    };
    
    // Interceptar window.location = 'pagina.html'
    Object.defineProperty(window, 'location', {
        get: function() {
            return window.location;
        },
        set: function(url) {
            if (typeof url === 'string' && url.endsWith('.html') && !url.startsWith('frontend/')) {
                url = 'frontend/' + url;
            }
            window.location.href = url;
        }
    });
});
