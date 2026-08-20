-- ============================================
-- STREAMPREMIUM - TABELA DE ADMINISTRADORES
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS administradores (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    
    -- Cargo e permissões
    cargo VARCHAR(20) DEFAULT 'admin',
    status VARCHAR(20) DEFAULT 'ativo',
    
    -- Datas
    ultimo_acesso TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_email_admin (email),
    INDEX idx_cargo (cargo),
    INDEX idx_status_admin (status),
    INDEX idx_criado_em_admin (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE ADMINISTRADORES
-- ============================================

-- Super Administrador
-- Senha: admin123 (hash bcrypt)
INSERT INTO administradores (nome, email, senha, cargo, status) VALUES
('Carlos Eduardo', 'admin@streampremium.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', 'super', 'ativo');

-- Administrador
-- Senha: admin123 (hash bcrypt)
INSERT INTO administradores (nome, email, senha, cargo, status) VALUES
('Ana Beatriz', 'ana.admin@streampremium.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', 'admin', 'ativo');

-- Moderador
-- Senha: admin123 (hash bcrypt)
INSERT INTO administradores (nome, email, senha, cargo, status) VALUES
('Pedro Henrique', 'pedro.mod@streampremium.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', 'moderador', 'ativo');

-- Administrador Inativo
-- Senha: admin123 (hash bcrypt)
INSERT INTO administradores (nome, email, senha, cargo, status) VALUES
('Mariana Costa', 'mariana.admin@streampremium.com', '$2a$10$XK4bP8sV7qY6wZ3jN5mH0uR1tE2sD4fG5hJ6kL8mN9oP0qR1sT2u', 'admin', 'inativo');

-- ============================================
-- TABELA DE PERMISSÕES
-- ============================================
CREATE TABLE IF NOT EXISTS permissoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nome_permissao (nome)
) ENGINE=InnoDB;

-- Inserir permissões padrão
INSERT INTO permissoes (nome, descricao) VALUES
('gerenciar_usuarios', 'Gerenciar usuários da plataforma'),
('gerenciar_produtos', 'Gerenciar produtos do catálogo'),
('gerenciar_pedidos', 'Gerenciar pedidos dos usuários'),
('gerenciar_assinaturas', 'Gerenciar assinaturas'),
('gerenciar_pagamentos', 'Gerenciar pagamentos'),
('gerenciar_cupons', 'Gerenciar cupons de desconto'),
('gerenciar_banners', 'Gerenciar banners da página'),
('gerenciar_emails', 'Gerenciar e-mails transacionais'),
('gerenciar_administradores', 'Gerenciar administradores'),
('ver_relatorios', 'Ver relatórios e estatísticas'),
('configurar_sistema', 'Configurar sistema');

-- ============================================
-- TABELA DE RELAÇÃO ADMIN-PERMISSÃO
-- ============================================
CREATE TABLE IF NOT EXISTS administrador_permissoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT NOT NULL,
    permissao_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE CASCADE,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_admin_permissao (administrador_id, permissao_id)
) ENGINE=InnoDB;

-- Atribuir todas as permissões ao super admin (id=1)
INSERT INTO administrador_permissoes (administrador_id, permissao_id)
SELECT 1, id FROM permissoes;

-- Atribuir permissões básicas ao admin (id=2)
INSERT INTO administrador_permissoes (administrador_id, permissao_id)
SELECT 2, id FROM permissoes 
WHERE nome IN ('gerenciar_usuarios', 'gerenciar_produtos', 'gerenciar_pedidos', 'ver_relatorios');

-- Atribuir permissões limitadas ao moderador (id=3)
INSERT INTO administrador_permissoes (administrador_id, permissao_id)
SELECT 3, id FROM permissoes 
WHERE nome IN ('gerenciar_produtos', 'gerenciar_pedidos');

-- ============================================
-- TABELA DE LOGS DE ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS logs_administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    administrador_id INT,
    acao VARCHAR(255) NOT NULL,
    descricao TEXT,
    ip VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (administrador_id) REFERENCES administradores(id) ON DELETE SET NULL,
    INDEX idx_logs_admin (administrador_id),
    INDEX idx_logs_criado (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os administradores ativos
-- SELECT * FROM administradores WHERE status = 'ativo';

-- Buscar administradores por cargo
-- SELECT * FROM administradores WHERE cargo = 'super';

-- Buscar permissões de um administrador
-- SELECT p.* FROM permissoes p
-- JOIN administrador_permissoes ap ON p.id = ap.permissao_id
-- WHERE ap.administrador_id = 1;

-- Verificar se um administrador tem uma permissão específica
-- SELECT COUNT(*) > 0 as tem_permissao
-- FROM administrador_permissoes ap
-- JOIN permissoes p ON ap.permissao_id = p.id
-- WHERE ap.administrador_id = 1 AND p.nome = 'gerenciar_usuarios';

-- Atualizar cargo de um administrador
-- UPDATE administradores SET cargo = 'super' WHERE id = 2;

-- Desativar administrador
-- UPDATE administradores SET status = 'inativo' WHERE id = 3;

-- Excluir administrador
-- DELETE FROM administradores WHERE id = 4;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca combinada
CREATE INDEX idx_cargo_status ON administradores(cargo, status);
