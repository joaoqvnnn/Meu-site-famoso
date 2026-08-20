// ============================================
// STREAMPREMIUM - CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAÇÕES DO BANCO DE DADOS
// ============================================
const DB_CONFIG = {
    // Tipo de banco: 'sqlite', 'mysql', 'postgres', 'mongodb'
    type: process.env.DB_TYPE || 'sqlite',
    
    // SQLite
    sqlite: {
        filename: path.join(__dirname, 'database', 'streampremium.db')
    },
    
    // MySQL
    mysql: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        database: process.env.DB_NAME || 'streampremium',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        charset: 'utf8mb4'
    },
    
    // PostgreSQL
    postgres: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'streampremium',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },
    
    // MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/streampremium'
    }
};

// ============================================
// BANCO DE DADOS EM MEMÓRIA (SIMULADO)
// ============================================
class BancoDados {
    constructor() {
        this.dados = {
            usuarios: [],
            produtos: [],
            pedidos: [],
            assinaturas: [],
            cupons: [],
            banners: [],
            emails: [],
            administradores: [],
            categorias: [],
            avaliacoes: [],
            pagamentos: [],
            notificacoes: []
        };
        
        this.contadores = {
            usuarios: 0,
            produtos: 0,
            pedidos: 0,
            assinaturas: 0,
            cupons: 0,
            banners: 0,
            emails: 0,
            administradores: 0,
            categorias: 0,
            avaliacoes: 0,
            pagamentos: 0,
            notificacoes: 0
        };
    }
    
    // Gerar próximo ID
    proximoId(tabela) {
        this.contadores[tabela]++;
        return this.contadores[tabela];
    }
    
    // Inserir registro
    inserir(tabela, dados) {
        const id = this.proximoId(tabela);
        const registro = { id, ...dados };
        this.dados[tabela].push(registro);
        return registro;
    }
    
    // Buscar por ID
    buscarPorId(tabela, id) {
        return this.dados[tabela].find(item => item.id === id);
    }
    
    // Buscar todos
    buscarTodos(tabela, filtro = {}) {
        let resultados = this.dados[tabela];
        
        // Aplicar filtros
        Object.keys(filtro).forEach(chave => {
            resultados = resultados.filter(item => item[chave] === filtro[chave]);
        });
        
        return resultados;
    }
    
    // Buscar um
    buscarUm(tabela, filtro = {}) {
        return this.dados[tabela].find(item => {
            return Object.keys(filtro).every(chave => item[chave] === filtro[chave]);
        });
    }
    
    // Atualizar registro
    atualizar(tabela, id, novosDados) {
        const index = this.dados[tabela].findIndex(item => item.id === id);
        if (index !== -1) {
            this.dados[tabela][index] = {
                ...this.dados[tabela][index],
                ...novosDados,
                id: id // Garantir que o ID não seja alterado
            };
            return this.dados[tabela][index];
        }
        return null;
    }
    
    // Remover registro
    remover(tabela, id) {
        const index = this.dados[tabela].findIndex(item => item.id === id);
        if (index !== -1) {
            const removido = this.dados[tabela][index];
            this.dados[tabela].splice(index, 1);
            return removido;
        }
        return null;
    }
    
    // Contar registros
    contar(tabela, filtro = {}) {
        let resultados = this.dados[tabela];
        
        Object.keys(filtro).forEach(chave => {
            resultados = resultados.filter(item => item[chave] === filtro[chave]);
        });
        
        return resultados.length;
    }
    
    // Salvar em arquivo (persistência)
    salvarEmArquivo(caminho) {
        try {
            const diretorio = path.dirname(caminho);
            if (!fs.existsSync(diretorio)) {
                fs.mkdirSync(diretorio, { recursive: true });
            }
            
            const dadosParaSalvar = {
                dados: this.dados,
                contadores: this.contadores,
                salvoEm: new Date().toISOString()
            };
            
            fs.writeFileSync(caminho, JSON.stringify(dadosParaSalvar, null, 2));
            return true;
        } catch (erro) {
            console.error('Erro ao salvar banco de dados:', erro);
            return false;
        }
    }
    
    // Carregar de arquivo (persistência)
    carregarDeArquivo(caminho) {
        try {
            if (fs.existsSync(caminho)) {
                const dadosCarregados = JSON.parse(fs.readFileSync(caminho, 'utf8'));
                this.dados = dadosCarregados.dados || this.dados;
                this.contadores = dadosCarregados.contadores || this.contadores;
                return true;
            }
            return false;
        } catch (erro) {
            console.error('Erro ao carregar banco de dados:', erro);
            return false;
        }
    }
    
    // Resetar banco
    resetar() {
        Object.keys(this.dados).forEach(tabela => {
            this.dados[tabela] = [];
        });
        Object.keys(this.contadores).forEach(tabela => {
            this.contadores[tabela] = 0;
        });
    }
    
    // Exportar dados
    exportar() {
        return JSON.stringify(this.dados, null, 2);
    }
    
    // Importar dados
    importar(dadosJSON) {
        try {
            const dadosImportados = JSON.parse(dadosJSON);
            this.dados = { ...this.dados, ...dadosImportados };
            return true;
        } catch (erro) {
            console.error('Erro ao importar dados:', erro);
            return false;
        }
    }
}

// ============================================
// SEED - DADOS INICIAIS
// ============================================
function popularBanco(banco) {
    // Usuários
    banco.inserir('usuarios', {
        nome: 'João da Silva',
        email: 'joao.silva@email.com',
        senha: '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u',
        cpf: '123.456.789-00',
        telefone: '+55 44 99869-1568',
        plano: 'premium',
        status: 'ativo',
        criadoEm: '2024-01-15T10:00:00Z',
        atualizadoEm: '2024-12-15T14:30:00Z'
    });
    
    banco.inserir('usuarios', {
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@email.com',
        senha: '$2a$10$Y7mN3pQ5rS8tU2vW4xZ6aB1cD3eF5gH7iJ9kL2mN4oP6qR0sT1u',
        cpf: '987.654.321-00',
        telefone: '+55 44 98765-4321',
        plano: 'basico',
        status: 'ativo',
        criadoEm: '2024-02-22T10:00:00Z',
        atualizadoEm: '2024-12-14T22:00:00Z'
    });
    
    // Produtos
    banco.inserir('produtos', {
        titulo: 'Duna: Parte 2',
        tipo: 'filme',
        genero: 'Ficção Científica',
        ano: 2024,
        duracao: '2h 46min',
        avaliacao: 8.9,
        preco: 29.90,
        descricao: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
        status: 'disponivel',
        destaque: true,
        criadoEm: '2024-01-01T00:00:00Z'
    });
    
    banco.inserir('produtos', {
        titulo: 'Breaking Bad - T1',
        tipo: 'serie',
        genero: 'Drama',
        ano: 2008,
        duracao: '45min/ep',
        avaliacao: 9.5,
        preco: 49.90,
        descricao: 'Um professor de química do ensino médio se torna traficante de drogas após ser diagnosticado com câncer terminal.',
        status: 'disponivel',
        destaque: true,
        criadoEm: '2024-01-01T00:00:00Z'
    });
    
    banco.inserir('produtos', {
        titulo: 'Interestelar',
        tipo: 'filme',
        genero: 'Ficção Científica',
        ano: 2014,
        duracao: '2h 49min',
        avaliacao: 8.7,
        preco: 19.90,
        descricao: 'Um grupo de exploradores viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.',
        status: 'disponivel',
        destaque: false,
        criadoEm: '2024-01-01T00:00:00Z'
    });
    
    // Administradores
    banco.inserir('administradores', {
        nome: 'Carlos Eduardo',
        email: 'admin@streampremium.com',
        senha: '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u',
        cargo: 'super',
        status: 'ativo',
        ultimoAcesso: null,
        criadoEm: '2024-01-01T00:00:00Z'
    });
    
    // Cupons
    banco.inserir('cupons', {
        codigo: 'BEMVINDO10',
        tipo: 'porcentagem',
        valor: 10,
        usos: 0,
        maximoUsos: 500,
        validade: '2024-12-31T23:59:59Z',
        status: 'ativo',
        criadoEm: '2024-01-01T00:00:00Z'
    });
    
    // Banners
    banco.inserir('banners', {
        titulo: 'Duna: Parte 2 - Em destaque',
        posicao: 'hero',
        inicio: '2024-12-01T00:00:00Z',
        fim: '2024-12-31T23:59:59Z',
        status: 'ativo',
        criadoEm: '2024-12-01T00:00:00Z'
    });
    
    console.log('✅ Banco de dados populado com dados iniciais');
}

// ============================================
// INICIALIZAR BANCO
// ============================================
function inicializarBanco() {
    const banco = new BancoDados();
    
    // Tentar carregar dados persistidos
    const arquivoBanco = path.join(__dirname, 'database', 'streampremium.json');
    const carregou = banco.carregarDeArquivo(arquivoBanco);
    
    if (!carregou) {
        // Popular com dados iniciais
        popularBanco(banco);
        banco.salvarEmArquivo(arquivoBanco);
    }
    
    return banco;
}

// ============================================
// EXPORTAÇÕES
// ============================================
module.exports = {
    DB_CONFIG,
    BancoDados,
    inicializarBanco,
    popularBanco
};
