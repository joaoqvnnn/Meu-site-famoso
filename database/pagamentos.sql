-- ============================================
-- STREAMPREMIUM - TABELA DE PAGAMENTOS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE PAGAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS pagamentos (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    usuario_id INT NOT NULL,
    assinatura_id INT,
    
    -- Valores
    valor DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente',
    
    -- Dados específicos
    codigo_pix TEXT,
    codigo_boleto TEXT,
    detalhes JSON,
    
    -- Datas
    expira_em TIMESTAMP NULL,
    reembolsado_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_usuario_pagamento (usuario_id),
    INDEX idx_pedido_pagamento (pedido_id),
    INDEX idx_status_pagamento (status),
    INDEX idx_metodo (metodo),
    INDEX idx_criado_em_pagamento (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE PAGAMENTOS DE EXEMPLO
-- ============================================

-- Pagamento 1: Pedido 1 (João) - Cartão
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, detalhes) VALUES
(1, 1, 49.80, 'cartao', 'aprovado', JSON_OBJECT(
    'bandeira', 'Visa',
    'ultimos_digitos', '4242',
    'parcelas', 2,
    'valor_parcela', 24.90
));

-- Pagamento 2: Pedido 2 (Maria) - PIX
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, codigo_pix, expira_em) VALUES
(2, 2, 49.90, 'pix', 'pendente', '00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304AB12', DATE_ADD(NOW(), INTERVAL 30 MINUTE));

-- Pagamento 3: Pedido 3 (Pedro) - Cartão
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, detalhes) VALUES
(3, 3, 24.90, 'cartao', 'aprovado', JSON_OBJECT(
    'bandeira', 'Mastercard',
    'ultimos_digitos', '5555',
    'parcelas', 1,
    'valor_parcela', 24.90
));

-- Pagamento 4: Pedido 4 (Ana) - Boleto
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, codigo_boleto, expira_em) VALUES
(4, 4, 39.90, 'boleto', 'pendente', '34191.79001 01043.510047 91020.150008 7 12345678901234567', DATE_ADD(NOW(), INTERVAL 3 DAY));

-- Pagamento 5: Pedido 5 (Carlos) - Cartão (falhou)
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, detalhes) VALUES
(5, 5, 34.90, 'cartao', 'falhou', JSON_OBJECT(
    'motivo', 'Cartão recusado pela operadora',
    'codigo_erro', 'CARD_DECLINED'
));

-- Pagamento 6: Pedido 6 (Juliana) - PIX (aprovado)
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, codigo_pix) VALUES
(6, 6, 49.80, 'pix', 'aprovado', '00020126580014BR.GOV.BCB.PIX0136b2c3d4e5-f6a7-8901-bcde-f23456789012520400005303986540510.005802BR5909StreamPrem6009Sao Paulo62070503***6304CD34');

-- Pagamento 7: Pedido 7 (Roberto) - Cartão
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, detalhes) VALUES
(7, 7, 40.41, 'cartao', 'aprovado', JSON_OBJECT(
    'bandeira', 'Visa',
    'ultimos_digitos', '0001',
    'parcelas', 1,
    'valor_parcela', 40.41
));

-- Pagamento 8: Pedido 8 (Fernanda) - Cartão
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, detalhes) VALUES
(8, 8, 29.90, 'cartao', 'aprovado', JSON_OBJECT(
    'bandeira', 'Elo',
    'ultimos_digitos', '7890',
    'parcelas', 1,
    'valor_parcela', 29.90
));

-- Pagamento 9: Assinatura (João) - Cartão
INSERT INTO pagamentos (usuario_id, assinatura_id, valor, metodo, status, descricao) VALUES
(1, 1, 29.90, 'cartao', 'aprovado', 'Assinatura Premium - Dezembro');

-- Pagamento 10: Reembolso (Roberto)
INSERT INTO pagamentos (pedido_id, usuario_id, valor, metodo, status, reembolsado_em) VALUES
(7, 7, -40.41, 'cartao', 'reembolsado', NOW());

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os pagamentos de um usuário
-- SELECT * FROM pagamentos WHERE usuario_id = 1;

-- Buscar pagamentos por status
-- SELECT * FROM pagamentos WHERE status = 'aprovado';

-- Buscar pagamentos por método
-- SELECT * FROM pagamentos WHERE metodo = 'pix';

-- Calcular receita total de pagamentos aprovados
-- SELECT SUM(valor) as receita_total FROM pagamentos WHERE status = 'aprovado';

-- Buscar pagamentos pendentes que expiram em breve
-- SELECT * FROM pagamentos WHERE status = 'pendente' AND expira_em < DATE_ADD(NOW(), INTERVAL 10 MINUTE);

-- Buscar reembolsos
-- SELECT * FROM pagamentos WHERE status = 'reembolsado';

-- ============================================
-- VIEWS
-- ============================================

-- View de pagamentos com informações do usuário
CREATE OR REPLACE VIEW vw_pagamentos_detalhados AS
SELECT 
    pg.id,
    pg.pedido_id,
    pg.usuario_id,
    u.nome as nome_usuario,
    u.email as email_usuario,
    pg.assinatura_id,
    pg.valor,
    pg.metodo,
    pg.status,
    pg.codigo_pix,
    pg.codigo_boleto,
    pg.expira_em,
    pg.reembolsado_em,
    pg.criado_em,
    pg.atualizado_em
FROM pagamentos pg
JOIN usuarios u ON pg.usuario_id = u.id;

-- View de receita por método
CREATE OR REPLACE VIEW vw_receita_por_metodo AS
SELECT 
    metodo,
    COUNT(*) as total_pagamentos,
    SUM(CASE WHEN status = 'aprovado' THEN valor ELSE 0 END) as receita_aprovada,
    SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as receita_pendente,
    SUM(CASE WHEN status = 'reembolsado' THEN valor ELSE 0 END) as total_reembolsado
FROM pagamentos
GROUP BY metodo;

-- View de pagamentos por dia
CREATE OR REPLACE VIEW vw_pagamentos_diarios AS
SELECT 
    DATE(criado_em) as data,
    COUNT(*) as total_pagamentos,
    SUM(CASE WHEN status = 'aprovado' THEN valor ELSE 0 END) as receita_total,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as pagamentos_aprovados,
    COUNT(CASE WHEN status = 'falhou' THEN 1 END) as pagamentos_falhos
FROM pagamentos
GROUP BY DATE(criado_em);

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca de pagamentos por período
CREATE INDEX idx_pagamentos_periodo ON pagamentos(criado_em DESC);

-- Índice para busca combinada de status e método
CREATE INDEX idx_status_metodo ON pagamentos(status, metodo);

-- Índice para busca de pagamentos expirando
CREATE INDEX idx_pagamentos_expira ON pagamentos(status, expira_em);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar status do pedido quando pagamento é aprovado
DELIMITER //
CREATE TRIGGER trg_pagamento_aprovado
AFTER UPDATE ON pagamentos
FOR EACH ROW
BEGIN
    IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
        UPDATE pedidos SET status = 'pago' WHERE id = NEW.pedido_id;
    END IF;
    
    IF NEW.status = 'reembolsado' AND OLD.status != 'reembolsado' THEN
        UPDATE pedidos SET status = 'cancelado' WHERE id = NEW.pedido_id;
    END IF;
END//
DELIMITER ;

-- Trigger para atualizar status do pedido quando pagamento falha
DELIMITER //
CREATE TRIGGER trg_pagamento_falhou
AFTER UPDATE ON pagamentos
FOR EACH ROW
BEGIN
    IF NEW.status = 'falhou' AND OLD.status != 'falhou' THEN
        UPDATE pedidos SET status = 'pendente' WHERE id = NEW.pedido_id;
    END IF;
END//
DELIMITER ;
