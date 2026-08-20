-- ============================================
-- STREAMPREMIUM - TABELA DE PEDIDOS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    
    -- Valores
    subtotal DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente',
    metodo_pagamento VARCHAR(20),
    
    -- Datas
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_numero (numero),
    INDEX idx_usuario_pedido (usuario_id),
    INDEX idx_status_pedido (status),
    INDEX idx_criado_em_pedido (criado_em)
) ENGINE=InnoDB;

-- ============================================
-- CRIAÇÃO DA TABELA DE ITENS DO PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS pedido_itens (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    
    -- Informações
    titulo VARCHAR(255),
    preco DECIMAL(10,2) NOT NULL,
    quantidade INT DEFAULT 1,
    
    -- Chaves estrangeiras
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    
    -- Índices
    INDEX idx_pedido_item (pedido_id),
    INDEX idx_produto_item (produto_id)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE PEDIDOS DE EXEMPLO
-- ============================================

-- Pedido 1: Usuário João (id=1)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-001234', 1, 49.80, 0.00, 49.80, 'pago', 'cartao');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(1, 1, 'Duna: Parte 2', 29.90, 1),
(1, 3, 'Interestelar', 19.90, 1);

-- Pedido 2: Usuário Maria (id=2)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-001198', 2, 49.90, 0.00, 49.90, 'processando', 'pix');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(2, 2, 'Breaking Bad - T1', 49.90, 1);

-- Pedido 3: Usuário Pedro (id=3)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-001150', 3, 24.90, 0.00, 24.90, 'pago', 'cartao');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(3, 4, 'A Origem', 24.90, 1);

-- Pedido 4: Usuário Ana (id=4)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-001089', 4, 39.90, 0.00, 39.90, 'pendente', 'boleto');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(4, 5, 'Stranger Things - T1', 39.90, 1);

-- Pedido 5: Usuário Carlos (id=5) - Cancelado
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-001034', 5, 34.90, 0.00, 34.90, 'cancelado', 'cartao');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(5, 6, 'Planeta Terra II', 34.90, 1);

-- Pedido 6: Usuário Juliana (id=6)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-000987', 6, 49.80, 0.00, 49.80, 'pago', 'pix');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(6, 7, 'Toy Story 4', 24.90, 1),
(6, 8, 'Rick and Morty', 24.90, 1);

-- Pedido 7: Usuário Roberto (id=7) - Com desconto
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-000923', 7, 44.90, 4.49, 40.41, 'pago', 'cartao');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(7, 9, 'One Piece', 44.90, 1);

-- Pedido 8: Usuário Fernanda (id=8)
INSERT INTO pedidos (numero, usuario_id, subtotal, desconto, total, status, metodo_pagamento) VALUES
('#SP-2024-000856', 8, 29.90, 0.00, 29.90, 'entregue', 'cartao');

INSERT INTO pedido_itens (pedido_id, produto_id, titulo, preco, quantidade) VALUES
(8, 10, 'Cosmos', 29.90, 1);

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os pedidos de um usuário
-- SELECT * FROM pedidos WHERE usuario_id = 1;

-- Buscar pedidos com itens
-- SELECT p.*, pi.* FROM pedidos p
-- JOIN pedido_itens pi ON p.id = pi.pedido_id
-- WHERE p.usuario_id = 1;

-- Buscar pedidos por status
-- SELECT * FROM pedidos WHERE status = 'pago';

-- Buscar pedidos recentes
-- SELECT * FROM pedidos ORDER BY criado_em DESC LIMIT 10;

-- Calcular receita total de pedidos pagos
-- SELECT SUM(total) as receita_total FROM pedidos WHERE status = 'pago';

-- Buscar pedidos de um período específico
-- SELECT * FROM pedidos WHERE criado_em BETWEEN '2024-01-01' AND '2024-12-31';

-- Atualizar status de um pedido
-- UPDATE pedidos SET status = 'entregue' WHERE id = 1;

-- Cancelar pedido
-- UPDATE pedidos SET status = 'cancelado' WHERE id = 5;

-- ============================================
-- VIEWS
-- ============================================

-- View de pedidos com informações do usuário
CREATE OR REPLACE VIEW vw_pedidos_detalhados AS
SELECT 
    p.id,
    p.numero,
    p.usuario_id,
    u.nome as nome_usuario,
    u.email as email_usuario,
    p.subtotal,
    p.desconto,
    p.total,
    p.status,
    p.metodo_pagamento,
    p.criado_em,
    p.atualizado_em,
    COUNT(pi.id) as total_itens
FROM pedidos p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN pedido_itens pi ON p.id = pi.pedido_id
GROUP BY p.id;

-- View de receita por dia
CREATE OR REPLACE VIEW vw_receita_diaria AS
SELECT 
    DATE(criado_em) as data,
    COUNT(*) as total_pedidos,
    SUM(total) as receita_total,
    AVG(total) as ticket_medio
FROM pedidos
WHERE status = 'pago'
GROUP BY DATE(criado_em);

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca de pedidos recentes
CREATE INDEX idx_pedidos_recentes ON pedidos(criado_em DESC);

-- Índice para busca combinada de status e data
CREATE INDEX idx_status_data ON pedidos(status, criado_em);

-- Índice para busca de itens por produto
CREATE INDEX idx_itens_produto ON pedido_itens(produto_id, quantidade);
