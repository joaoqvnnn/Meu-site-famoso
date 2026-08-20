-- ============================================
-- STREAMPREMIUM - SCHEMA DO BANCO DE DADOS
-- ============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS streampremium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE streampremium;

-- ============================================
-- TABELA: USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    plano VARCHAR(20) DEFAULT 'gratuito',
    status VARCHAR(20) DEFAULT 'ativo',
    verificado BOOLEAN DEFAULT FALSE,
    avatar VARCHAR(255),
    ultimo_acesso TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_cpf (cpf),
    INDEX idx_status (status),
    INDEX idx_plano (plano)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(20) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'ativo',
    ultimo_acesso TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_admin (email),
    INDEX idx_cargo (cargo)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    genero VARCHAR(100),
    ano INT,
    duracao VARCHAR(50),
    avaliacao DECIMAL(3,1) DEFAULT 0.0,
    preco DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    imagem VARCHAR(255),
    status VARCHAR(20) DEFAULT 'disponivel',
    destaque BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_genero (genero),
    INDEX idx_status_produto (status),
    INDEX idx_destaque (destaque),
    FULLTEXT INDEX ft_titulo_descricao (titulo, descricao)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    metodo_pagamento VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_numero (numero),
    INDEX idx_usuario_pedido (usuario_id),
    INDEX idx_status_pedido (status)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: ITENS DO PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    titulo VARCHAR(255),
    preco DECIMAL(10,2) NOT NULL,
    quantidade INT DEFAULT 1,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    INDEX idx_pedido_item (pedido_id),
    INDEX idx_produto_item (produto_id)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: ASSINATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS assinaturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    plano VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativa',
    inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proxima_cobranca TIMESTAMP,
    cancelado_em TIMESTAMP NULL,
    metodo_pagamento VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_assinatura (usuario_id),
    INDEX idx_status_assinatura (status),
    INDEX idx_plano_assinatura (plano)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: PAGAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    usuario_id INT NOT NULL,
    assinatura_id INT,
    valor DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    codigo_pix TEXT,
    codigo_boleto TEXT,
    detalhes JSON,
    expira_em TIMESTAMP NULL,
    reembolsado_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id) ON DELETE SET NULL,
    INDEX idx_usuario_pagamento (usuario_id),
    INDEX idx_status_pagamento (status),
    INDEX idx_metodo (metodo)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: CUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS cupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    usos INT DEFAULT 0,
    maximo_usos INT DEFAULT 100,
    validade TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codigo_cupom (codigo),
    INDEX idx_status_cupom (status)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: BANNERS
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    posicao VARCHAR(50),
    imagem VARCHAR(255),
    inicio TIMESTAMP,
    fim TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_banner (status),
    INDEX idx_posicao (posicao)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: E-MAILS
-- ============================================
CREATE TABLE IF NOT EXISTS emails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    destinatario VARCHAR(255) NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    status VARCHAR(20) DEFAULT 'enviado',
    conteudo TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_destinatario (destinatario),
    INDEX idx_status_email (status),
    INDEX idx_tipo_email (tipo)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: AVALIAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    usuario_id INT,
    nota DECIMAL(2,1) NOT NULL,
    comentario TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_produto_avaliacao (produto_id),
    INDEX idx_usuario_avaliacao (usuario_id)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(50),
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_notificacao (usuario_id),
    INDEX idx_lida (lida)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT,
    usuario_id INT,
    acao VARCHAR(255) NOT NULL,
    descricao TEXT,
    ip VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_logs_criado (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- TABELA: TOKENS
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    token VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    expira_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_token_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Inserir administrador padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO administradores (nome, email, senha, cargo, status) VALUES
('Carlos Eduardo', 'admin@streampremium.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', 'super', 'ativo');

-- Inserir usuário de teste
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('João da Silva', 'joao.silva@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '123.456.789-00', '+55 44 99869-1568', 'premium', 'ativo', TRUE);

-- Inserir produtos de exemplo
INSERT INTO produtos (titulo, tipo, genero, ano, duracao, avaliacao, preco, descricao, status, destaque) VALUES
('Duna: Parte 2', 'filme', 'Ficção Científica', 2024, '2h 46min', 8.9, 29.90, 'Paul Atreides se une a Chani e aos Fremen...', 'disponivel', TRUE),
('Breaking Bad - T1', 'serie', 'Drama', 2008, '45min/ep', 9.5, 49.90, 'Um professor de química se torna traficante...', 'disponivel', TRUE),
('Interestelar', 'filme', 'Ficção Científica', 2014, '2h 49min', 8.7, 19.90, 'Um grupo de exploradores viaja através de um buraco de minhoca...', 'disponivel', FALSE),
('Stranger Things - T1', 'serie', 'Terror', 2016, '50min/ep', 8.7, 39.90, 'Uma cidade pequena é assombrada por eventos sobrenaturais...', 'disponivel', FALSE);

-- Inserir cupons de exemplo
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('BEMVINDO10', 'porcentagem', 10.00, 0, 500, '2025-12-31 23:59:59', 'ativo'),
('PREMIUM20', 'porcentagem', 20.00, 0, 300, '2025-06-30 23:59:59', 'ativo');

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca rápida de pedidos recentes
CREATE INDEX idx_pedidos_recentes ON pedidos(criado_em DESC);

-- Índice para busca de pagamentos por período
CREATE INDEX idx_pagamentos_periodo ON pagamentos(criado_em DESC);

-- Índice para notificações não lidas
CREATE INDEX idx_notificacoes_nao_lidas ON notificacoes(usuario_id, lida);
