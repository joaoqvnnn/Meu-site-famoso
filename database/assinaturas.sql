-- ============================================
-- STREAMPREMIUM - TABELA DE ASSINATURAS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE ASSINATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS assinaturas (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    
    -- Plano
    plano VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ativa',
    metodo_pagamento VARCHAR(20),
    
    -- Datas
    inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proxima_cobranca TIMESTAMP,
    cancelado_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_usuario_assinatura (usuario_id),
    INDEX idx_status_assinatura (status),
    INDEX idx_plano_assinatura (plano),
    INDEX idx_proxima_cobranca (proxima_cobranca)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE ASSINATURAS DE EXEMPLO
-- ============================================

-- Assinatura 1: João (Premium)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(1, 'premium', 29.90, 'ativa', 'cartao', '2024-01-15 10:00:00', '2024-12-15 10:00:00');

-- Assinatura 2: Maria (Básico)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(2, 'basico', 14.90, 'ativa', 'pix', '2024-02-22 10:00:00', '2024-12-22 10:00:00');

-- Assinatura 3: Pedro (Família)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(3, 'familia', 49.90, 'ativa', 'cartao', '2024-03-10 10:00:00', '2024-12-10 10:00:00');

-- Assinatura 4: Ana (Premium - Pendente)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(4, 'premium', 29.90, 'pendente', 'boleto', '2024-04-05 10:00:00', '2024-12-05 10:00:00');

-- Assinatura 5: Carlos (Básico - Cancelada)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca, cancelado_em) VALUES
(5, 'basico', 14.90, 'cancelada', 'cartao', '2024-05-18 10:00:00', '2024-12-18 10:00:00', '2024-11-18 15:30:00');

-- Assinatura 6: Juliana (Premium)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(6, 'premium', 29.90, 'ativa', 'cartao', '2024-06-30 10:00:00', '2024-12-30 10:00:00');

-- Assinatura 7: Roberto (Família - Expirada)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(7, 'familia', 49.90, 'expirada', 'cartao', '2024-07-12 10:00:00', '2024-11-12 10:00:00');

-- Assinatura 8: Fernanda (Básico - Pendente)
INSERT INTO assinaturas (usuario_id, plano, valor, status, metodo_pagamento, inicio, proxima_cobranca) VALUES
(8, 'basico', 14.90, 'pendente', 'pix', '2024-08-25 10:00:00', '2024-12-25 10:00:00');

-- ============================================
-- TABELA DE PLANOS
-- ============================================
CREATE TABLE IF NOT EXISTS planos (
    id VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    recursos JSON,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Inserir planos
INSERT INTO planos (id, nome, preco, recursos) VALUES
('gratuito', 'Gratuito', 0.00, JSON_ARRAY(
    'Acesso limitado ao catálogo',
    'Qualidade SD (480p)',
    '1 tela simultânea',
    'Com anúncios'
)),
('basico', 'Básico', 14.90, JSON_ARRAY(
    'Acesso ao catálogo básico',
    'Qualidade HD (720p)',
    '1 tela simultânea',
    'Sem anúncios'
)),
('premium', 'Premium', 29.90, JSON_ARRAY(
    'Acesso ilimitado a todo catálogo',
    'Qualidade 4K Ultra HD',
    '4 telas simultâneas',
    'Downloads offline',
    'Sem anúncios'
)),
('familia', 'Família', 49.90, JSON_ARRAY(
    'Acesso ilimitado a todo catálogo',
    'Qualidade 4K Ultra HD',
    '6 telas simultâneas',
    'Downloads offline',
    'Perfis para toda família',
    'Sem anúncios'
));

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todas as assinaturas ativas
-- SELECT * FROM assinaturas WHERE status = 'ativa';

-- Buscar assinatura de um usuário
-- SELECT * FROM assinaturas WHERE usuario_id = 1 AND status = 'ativa';

-- Buscar assinaturas por plano
-- SELECT * FROM assinaturas WHERE plano = 'premium';

-- Calcular receita mensal de assinaturas ativas
-- SELECT SUM(valor) as receita_mensal FROM assinaturas WHERE status = 'ativa';

-- Buscar assinaturas que vencem em breve
-- SELECT * FROM assinaturas WHERE status = 'ativa' AND proxima_cobranca < DATE_ADD(NOW(), INTERVAL 7 DAY);

-- Buscar assinaturas canceladas no último mês
-- SELECT * FROM assinaturas WHERE status = 'cancelada' AND cancelado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Atualizar status de uma assinatura
-- UPDATE assinaturas SET status = 'cancelada', cancelado_em = NOW() WHERE id = 1;

-- Renovar assinatura
-- UPDATE assinaturas SET proxima_cobranca = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = 1;

-- ============================================
-- VIEWS
-- ============================================

-- View de assinaturas com informações do usuário
CREATE OR REPLACE VIEW vw_assinaturas_detalhadas AS
SELECT 
    a.id,
    a.usuario_id,
    u.nome as nome_usuario,
    u.email as email_usuario,
    a.plano,
    p.nome as nome_plano,
    a.valor,
    a.status,
    a.metodo_pagamento,
    a.inicio,
    a.proxima_cobranca,
    a.cancelado_em,
    a.criado_em
FROM assinaturas a
JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN planos p ON a.plano = p.id;

-- View de receita por plano
CREATE OR REPLACE VIEW vw_receita_por_plano AS
SELECT 
    plano,
    COUNT(*) as total_assinaturas,
    COUNT(CASE WHEN status = 'ativa' THEN 1 END) as assinaturas_ativas,
    SUM(CASE WHEN status = 'ativa' THEN valor ELSE 0 END) as receita_mensal
FROM assinaturas
GROUP BY plano;

-- View de renovações próximas
CREATE OR REPLACE VIEW vw_renovacoes_proximas AS
SELECT 
    a.id,
    a.usuario_id,
    u.nome as nome_usuario,
    u.email as email_usuario,
    a.plano,
    a.valor,
    a.proxima_cobranca,
    DATEDIFF(a.proxima_cobranca, NOW()) as dias_restantes
FROM assinaturas a
JOIN usuarios u ON a.usuario_id = u.id
WHERE a.status = 'ativa'
AND DATEDIFF(a.proxima_cobranca, NOW()) <= 7;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca combinada
CREATE INDEX idx_status_plano ON assinaturas(status, plano);

-- Índice para busca de renovações
CREATE INDEX idx_renovacao ON assinaturas(status, proxima_cobranca);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar plano do usuário quando assinatura muda
DELIMITER //
CREATE TRIGGER trg_assinatura_atualizada
AFTER UPDATE ON assinaturas
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status OR NEW.plano != OLD.plano THEN
        IF NEW.status = 'ativa' THEN
            UPDATE usuarios SET plano = NEW.plano WHERE id = NEW.usuario_id;
        ELSEIF NEW.status IN ('cancelada', 'expirada') THEN
            UPDATE usuarios SET plano = 'gratuito' WHERE id = NEW.usuario_id;
        END IF;
    END IF;
END//
DELIMITER ;

-- Trigger para registrar cancelamento
DELIMITER //
CREATE TRIGGER trg_assinatura_cancelada
BEFORE UPDATE ON assinaturas
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelada' AND OLD.status != 'cancelada' THEN
        SET NEW.cancelado_em = NOW();
    END IF;
END//
DELIMITER ;
