-- ============================================
-- STREAMPREMIUM - TABELA DE USUÁRIOS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    
    -- Preferências
    plano VARCHAR(20) DEFAULT 'gratuito',
    status VARCHAR(20) DEFAULT 'ativo',
    verificado BOOLEAN DEFAULT FALSE,
    avatar VARCHAR(255),
    
    -- Datas
    ultimo_acesso TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_email (email),
    INDEX idx_cpf (cpf),
    INDEX idx_status (status),
    INDEX idx_plano (plano),
    INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE USUÁRIOS DE TESTE
-- ============================================

-- Usuário 1: Premium
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('João da Silva', 'joao.silva@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '123.456.789-00', '+55 44 99869-1568', 'premium', 'ativo', TRUE);

-- Usuário 2: Básico
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Maria Oliveira', 'maria.oliveira@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '987.654.321-00', '+55 44 98765-4321', 'basico', 'ativo', TRUE);

-- Usuário 3: Família
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Pedro Santos', 'pedro.santos@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '456.789.123-00', '+55 44 91234-5678', 'familia', 'ativo', TRUE);

-- Usuário 4: Gratuito (pendente)
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Ana Costa', 'ana.costa@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '789.123.456-00', '+55 44 92345-6789', 'gratuito', 'pendente', FALSE);

-- Usuário 5: Premium (inativo)
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Carlos Pereira', 'carlos.pereira@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '321.654.987-00', '+55 44 93456-7890', 'premium', 'inativo', TRUE);

-- Usuário 6: Básico
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Juliana Almeida', 'juliana.almeida@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '654.987.321-00', '+55 44 94567-8901', 'basico', 'ativo', TRUE);

-- Usuário 7: Família
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Roberto Nunes', 'roberto.nunes@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '147.258.369-00', '+55 44 95678-9012', 'familia', 'ativo', TRUE);

-- Usuário 8: Gratuito
-- Senha: senha123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, plano, status, verificado) VALUES
('Fernanda Lima', 'fernanda.lima@email.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', '258.369.147-00', '+55 44 96789-0123', 'gratuito', 'ativo', TRUE);

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os usuários ativos
-- SELECT * FROM usuarios WHERE status = 'ativo';

-- Buscar usuários por plano
-- SELECT * FROM usuarios WHERE plano = 'premium';

-- Contar usuários por plano
-- SELECT plano, COUNT(*) as total FROM usuarios GROUP BY plano;

-- Buscar usuários criados nos últimos 30 dias
-- SELECT * FROM usuarios WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Atualizar status de um usuário
-- UPDATE usuarios SET status = 'inativo' WHERE id = 1;

-- Excluir usuário
-- DELETE FROM usuarios WHERE id = 1;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca por nome
CREATE INDEX idx_nome ON usuarios(nome);

-- Índice para busca combinada
CREATE INDEX idx_status_plano ON usuarios(status, plano);

-- Índice fulltext para busca
ALTER TABLE usuarios ADD FULLTEXT INDEX ft_nome_email (nome, email);
