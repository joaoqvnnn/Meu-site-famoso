// ============================================
// STREAMPREMIUM - JAVASCRIPT DO PAINEL ADMIN
// ============================================

// ========== CONFIGURAÇÕES ==========
const ADMIN_CONFIG = {
    API_URL: 'http://localhost:3000/api',
    CHAVE_TOKEN: 'streampremium_token',
    CHAVE_ADMIN: 'streampremium_admin',
    ITENS_POR_PAGINA: 10
};

// ========== CLASSE PAINEL ADMIN ==========
class PainelAdmin {
    constructor() {
        this.token = null;
        this.admin = null;
        this.inicializar();
    }

    // Inicializar painel
    inicializar() {
        this.verificarAutenticacao();
        this.obterElementos();
        this.adicionarEventos();
        this.carregarDashboard();
    }

    // Verificar autenticação
    verificarAutenticacao() {
        this.token = localStorage.getItem(ADMIN_CONFIG.CHAVE_TOKEN);
        this.admin = JSON.parse(localStorage.getItem(ADMIN_CONFIG.CHAVE_ADMIN) || 'null');
        
        if (!this.token || !this.admin || this.admin.tipo !== 'admin') {
            window.location.href = 'admin-login.html';
            return;
        }
    }

    // Obter elementos
    obterElementos() {
        // Sidebar
        this.sidebar = document.getElementById('adminSidebar');
        this.menuLinks = document.querySelectorAll('[data-menu]');
        
        // Conteúdo
        this.conteudo = document.getElementById('adminConteudo');
        
        // Estatísticas
        this.statsUsuarios = document.getElementById('statsUsuarios');
        this.statsProdutos = document.getElementById('statsProdutos');
        this.statsPedidos = document.getElementById('statsPedidos');
        this.statsReceita = document.getElementById('statsReceita');
        
        // Botões
        this.botaoLogout = document.getElementById('botaoLogout');
    }

    // Adicionar eventos
    adicionarEventos() {
        // Navegação
        this.menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = link.getAttribute('data-menu');
                this.navegarPara(menu);
            });
        });
        
        // Logout
        if (this.botaoLogout) {
            this.botaoLogout.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    // Obter headers
    obterHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Navegar para seção
    navegarPara(menu) {
        // Atualizar links ativos
        this.menuLinks.forEach(link => {
            if (link.getAttribute('data-menu') === menu) {
                link.classList.add('ativo');
            } else {
                link.classList.remove('ativo');
            }
        });
        
        // Carregar conteúdo
        switch (menu) {
            case 'dashboard':
                this.carregarDashboard();
                break;
            case 'usuarios':
                this.carregarUsuarios();
                break;
            case 'produtos':
                this.carregarProdutos();
                break;
            case 'pedidos':
                this.carregarPedidos();
                break;
            case 'assinaturas':
                this.carregarAssinaturas();
                break;
            case 'cupons':
                this.carregarCupons();
                break;
            case 'relatorios':
                this.carregarRelatorios();
                break;
            case 'configuracoes':
                this.carregarConfiguracoes();
                break;
            default:
                this.carregarDashboard();
        }
    }

    // Carregar dashboard
    async carregarDashboard() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_URL}/admin/dashboard`, {
                headers: this.obterHeaders()
            });
            
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.atualizarEstatisticas(dados.estatisticas);
                this.renderizarDashboard(dados);
            }
        } catch (erro) {
            console.error('Erro ao carregar dashboard:', erro);
        }
    }

    // Atualizar estatísticas
    atualizarEstatisticas(estatisticas) {
        if (this.statsUsuarios && estatisticas.usuarios) {
            this.statsUsuarios.textContent = estatisticas.usuarios.total;
        }
        
        if (this.statsProdutos && estatisticas.produtos) {
            this.statsProdutos.textContent = estatisticas.produtos.total;
        }
        
        if (this.statsPedidos && estatisticas.pedidos) {
            this.statsPedidos.textContent = estatisticas.pedidos.total;
        }
        
        if (this.statsReceita && estatisticas.receitaTotal !== undefined) {
            this.statsReceita.textContent = Utils.formatarPreco(estatisticas.receitaTotal);
        }
    }

    // Renderizar dashboard
    renderizarDashboard(dados) {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-stats-grid">
                    <div class="admin-stat-card">
                        <div class="admin-stat-icone">👥</div>
                        <div class="admin-stat-valor">${dados.estatisticas?.usuarios?.total || 0}</div>
                        <div class="admin-stat-rotulo">Usuários</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icone">🎬</div>
                        <div class="admin-stat-valor">${dados.estatisticas?.produtos?.total || 0}</div>
                        <div class="admin-stat-rotulo">Produtos</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icone">📦</div>
                        <div class="admin-stat-valor">${dados.estatisticas?.pedidos?.total || 0}</div>
                        <div class="admin-stat-rotulo">Pedidos</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icone">💰</div>
                        <div class="admin-stat-valor">${Utils.formatarPreco(dados.estatisticas?.receitaTotal || 0)}</div>
                        <div class="admin-stat-rotulo">Receita</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Carregar usuários
    async carregarUsuarios() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_URL}/admin/usuarios`, {
                headers: this.obterHeaders()
            });
            
            const dados = await response.json();
            
            if (dados.sucesso && this.conteudo) {
                this.conteudo.innerHTML = this.renderizarTabelaUsuarios(dados.usuarios);
            }
        } catch (erro) {
            console.error('Erro ao carregar usuários:', erro);
        }
    }

    // Renderizar tabela de usuários
    renderizarTabelaUsuarios(usuarios) {
        let linhas = '';
        
        usuarios.forEach(usuario => {
            linhas += `
                <tr>
                    <td>${usuario.id}</td>
                    <td>${usuario.nome}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.plano}</td>
                    <td><span class="admin-status-badge ${usuario.status}">${usuario.status}</span></td>
                    <td>
                        <div class="admin-acoes">
                            <button class="admin-botao-acao editar" data-id="${usuario.id}">✏️</button>
                            <button class="admin-botao-acao excluir" data-id="${usuario.id}">🗑</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        return `
            <div class="admin-tabela-container">
                <table class="admin-tabela">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Plano</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `;
    }

    // Carregar produtos
    async carregarProdutos() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = `
            <div class="admin-pagina-header">
                <div>
                    <h2 class="admin-pagina-titulo">Produtos</h2>
                    <p class="admin-pagina-subtitulo">Gerencie o catálogo</p>
                </div>
                <button class="admin-botao-adicionar">➕ Adicionar</button>
            </div>
            <p style="color: var(--texto-secundario);">Carregando produtos...</p>
        `;
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_URL}/produtos`, {
                headers: this.obterHeaders()
            });
            
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.conteudo.innerHTML = this.renderizarGridProdutos(dados.produtos);
            }
        } catch (erro) {
            console.error('Erro ao carregar produtos:', erro);
        }
    }

    // Renderizar grid de produtos
    renderizarGridProdutos(produtos) {
        let cards = '';
        
        produtos.forEach(produto => {
            cards += `
                <div class="admin-card">
                    <h4>${produto.titulo}</h4>
                    <p>${produto.tipo} - ${produto.genero}</p>
                    <p>${Utils.formatarPreco(produto.preco)}</p>
                    <span class="admin-status-badge ${produto.status}">${produto.status}</span>
                    <div class="admin-acoes">
                        <button class="admin-botao-acao editar">✏️</button>
                        <button class="admin-botao-acao excluir">🗑</button>
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="admin-pagina-header">
                <div>
                    <h2 class="admin-pagina-titulo">Produtos</h2>
                    <p class="admin-pagina-subtitulo">Gerencie o catálogo</p>
                </div>
                <button class="admin-botao-adicionar">➕ Adicionar</button>
            </div>
            <div class="admin-card-grid">${cards}</div>
        `;
    }

    // Carregar pedidos
    async carregarPedidos() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = '<p style="color: var(--texto-secundario);">Carregando pedidos...</p>';
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_URL}/pedidos/admin/todos`, {
                headers: this.obterHeaders()
            });
            
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.conteudo.innerHTML = this.renderizarTabelaPedidos(dados.pedidos);
            }
        } catch (erro) {
            console.error('Erro ao carregar pedidos:', erro);
        }
    }

    // Renderizar tabela de pedidos
    renderizarTabelaPedidos(pedidos) {
        let linhas = '';
        
        pedidos.forEach(pedido => {
            linhas += `
                <tr>
                    <td>${pedido.numero}</td>
                    <td>${pedido.usuario?.nome || 'N/A'}</td>
                    <td>${Utils.formatarPreco(pedido.total)}</td>
                    <td><span class="admin-status-badge ${pedido.status}">${pedido.status}</span></td>
                    <td>${new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <div class="admin-acoes">
                            <button class="admin-botao-acao editar">👁</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        return `
            <div class="admin-pagina-header">
                <div>
                    <h2 class="admin-pagina-titulo">Pedidos</h2>
                    <p class="admin-pagina-subtitulo">Acompanhe todos os pedidos</p>
                </div>
            </div>
            <div class="admin-tabela-container">
                <table class="admin-tabela">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `;
    }

    // Carregar assinaturas
    async carregarAssinaturas() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = '<p style="color: var(--texto-secundario);">Carregando assinaturas...</p>';
        
        try {
            const response = await fetch(`${ADMIN_CONFIG.API_URL}/assinaturas/admin/todas`, {
                headers: this.obterHeaders()
            });
            
            const dados = await response.json();
            
            if (dados.sucesso) {
                this.conteudo.innerHTML = this.renderizarTabelaAssinaturas(dados.assinaturas);
            }
        } catch (erro) {
            console.error('Erro ao carregar assinaturas:', erro);
        }
    }

    // Renderizar tabela de assinaturas
    renderizarTabelaAssinaturas(assinaturas) {
        let linhas = '';
        
        assinaturas.forEach(assinatura => {
            linhas += `
                <tr>
                    <td>${assinatura.usuario?.nome || 'N/A'}</td>
                    <td>${assinatura.plano}</td>
                    <td>${Utils.formatarPreco(assinatura.valor)}</td>
                    <td><span class="admin-status-badge ${assinatura.status}">${assinatura.status}</span></td>
                    <td>${new Date(assinatura.proximaCobranca).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <div class="admin-acoes">
                            <button class="admin-botao-acao editar">✏️</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        return `
            <div class="admin-pagina-header">
                <div>
                    <h2 class="admin-pagina-titulo">Assinaturas</h2>
                    <p class="admin-pagina-subtitulo">Gerencie assinaturas</p>
                </div>
            </div>
            <div class="admin-tabela-container">
                <table class="admin-tabela">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Plano</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Próxima cobrança</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `;
    }

    // Carregar cupons
    async carregarCupons() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = '<p style="color: var(--texto-secundario);">Carregando cupons...</p>';
    }

    // Carregar relatórios
    async carregarRelatorios() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = '<p style="color: var(--texto-secundario);">Carregando relatórios...</p>';
    }

    // Carregar configurações
    async carregarConfiguracoes() {
        if (!this.conteudo) return;
        
        this.conteudo.innerHTML = '<p style="color: var(--texto-secundario);">Carregando configurações...</p>';
    }

    // Logout
    logout() {
        localStorage.removeItem(ADMIN_CONFIG.CHAVE_TOKEN);
        localStorage.removeItem(ADMIN_CONFIG.CHAVE_ADMIN);
        window.location.href = 'admin-login.html';
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    window.painelAdmin = new PainelAdmin();
});

// ========== EXPORTAÇÃO ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PainelAdmin };
} else {
    window.PainelAdmin = PainelAdmin;
}
