-- ============================================
-- STREAMPREMIUM - TABELA DE CUPONS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE CUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS cupons (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    
    -- Tipo e valor
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    
    -- Uso
    usos INT DEFAULT 0,
    maximo_usos INT DEFAULT 100,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ativo',
    
    -- Datas
    validade TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_codigo_cupom (codigo),
    INDEX idx_status_cupom (status),
    INDEX idx_validade (validade),
    INDEX idx_tipo_cupom (tipo)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE CUPONS DE EXEMPLO
-- ============================================

-- Cupom de boas-vindas (10% de desconto)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('BEMVINDO10', 'porcentagem', 10.00, 245, 500, '2025-12-31 23:59:59', 'ativo');

-- Cupom Premium (20% de desconto)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('PREMIUM20', 'porcentagem', 20.00, 189, 300, '2025-06-30 23:59:59', 'ativo');

-- Cupom de frete grátis (valor fixo)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('FRETE50', 'valor_fixo', 50.00, 87, 100, '2024-12-15 23:59:59', 'ativo');

-- Cupom Black Friday (30% de desconto) - Expirado
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('BLACKFRIDAY', 'porcentagem', 30.00, 567, 1000, '2024-11-30 23:59:59', 'expirado');

-- Cupom de aniversário (15% de desconto) - Inativo
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('ANIVERSARIO', 'porcentagem', 15.00, 0, 200, '2025-03-31 23:59:59', 'inativo');

-- Cupom Stream (25% de desconto)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('STREAM25', 'porcentagem', 25.00, 312, 500, '2025-02-28 23:59:59', 'ativo');

-- Cupom de Natal (valor fixo)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('NATAL20', 'valor_fixo', 20.00, 45, 150, '2024-12-25 23:59:59', 'ativo');

-- Cupom de Ano Novo (40% de desconto)
INSERT INTO cupons (codigo, tipo, valor, usos, maximo_usos, validade, status) VALUES
('ANONOVO40', 'porcentagem', 40.00, 0, 300, '2025-01-05 23:59:59', 'ativo');

-- ============================================
-- TABELA DE USO DE CUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS cupom_usos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cupom_id INT NOT NULL,
    usuario_id INT NOT NULL,
    pedido_id INT,
    valor_desconto DECIMAL(10,2) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cupom_id) REFERENCES cupons(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    INDEX idx_cupom_uso (cupom_id),
    INDEX idx_usuario_uso (usuario_id),
    INDEX idx_pedido_uso (pedido_id)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE USOS DE CUPONS
-- ============================================

-- João usou BEMVINDO10
INSERT INTO cupom_usos (cupom_id, usuario_id, pedido_id, valor_desconto) VALUES
(1, 1, 1, 4.98);

-- Maria usou PREMIUM20
INSERT INTO cupom_usos (cupom_id, usuario_id, pedido_id, valor_desconto) VALUES
(2, 2, 2, 9.98);

-- Pedro usou STREAM25
INSERT INTO cupom_usos (cupom_id, usuario_id, pedido_id, valor_desconto) VALUES
(6, 3, 3, 6.23);

-- Roberto usou FRETE50
INSERT INTO cupom_usos (cupom_id, usuario_id, pedido_id, valor_desconto) VALUES
(3, 7, 7, 4.49);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar se cupom é válido
DELIMITER //
CREATE FUNCTION verificar_cupom_valido(
    p_codigo VARCHAR(50)
)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE cupom_valido BOOLEAN;
    
    SELECT COUNT(*) > 0 INTO cupom_valido
    FROM cupons
    WHERE codigo = UPPER(p_codigo)
    AND status = 'ativo'
    AND validade > NOW()
    AND usos < maximo_usos;
    
    RETURN cupom_valido;
END//
DELIMITER ;

-- Função para calcular desconto
DELIMITER //
CREATE FUNCTION calcular_desconto_cupom(
    p_codigo VARCHAR(50),
    p_valor_compra DECIMAL(10,2)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_tipo VARCHAR(20);
    DECLARE v_valor DECIMAL(10,2);
    DECLARE v_desconto DECIMAL(10,2);
    
    SELECT tipo, valor INTO v_tipo, v_valor
    FROM cupons
    WHERE codigo = UPPER(p_codigo)
    AND status = 'ativo'
    AND validade > NOW()
    AND usos < maximo_usos
    LIMIT 1;
    
    IF v_tipo = 'porcentagem' THEN
        SET v_desconto = p_valor_compra * (v_valor / 100);
    ELSE
        SET v_desconto = v_valor;
    END IF;
    
    RETURN COALESCE(v_desconto, 0);
END//
DELIMITER ;

-- ============================================
-- PROCEDURES
-- ============================================

-- Procedure para criar novo cupom
DELIMITER //
CREATE PROCEDURE criar_novo_cupom(
    IN p_codigo VARCHAR(50),
    IN p_tipo VARCHAR(20),
    IN p_valor DECIMAL(10,2),
    IN p_maximo_usos INT,
    IN p_dias_validade INT
)
BEGIN
    INSERT INTO cupons (codigo, tipo, valor, maximo_usos, validade, status)
    VALUES (
        UPPER(p_codigo),
        p_tipo,
        p_valor,
        p_maximo_usos,
        DATE_ADD(NOW(), INTERVAL p_dias_validade DAY),
        'ativo'
    );
    
    SELECT LAST_INSERT_ID() as cupom_id;
END//
DELIMITER ;

-- Procedure para usar cupom
DELIMITER //
CREATE PROCEDURE usar_cupom(
    IN p_codigo VARCHAR(50),
    IN p_usuario_id INT,
    IN p_pedido_id INT,
    IN p_valor_compra DECIMAL(10,2)
)
BEGIN
    DECLARE v_cupom_id INT;
    DECLARE v_valor_desconto DECIMAL(10,2);
    
    -- Buscar cupom válido
    SELECT id INTO v_cupom_id
    FROM cupons
    WHERE codigo = UPPER(p_codigo)
    AND status = 'ativo'
    AND validade > NOW()
    AND usos < maximo_usos
    LIMIT 1;
    
    IF v_cupom_id IS NOT NULL THEN
        -- Calcular desconto
        SET v_valor_desconto = calcular_desconto_cupom(p_codigo, p_valor_compra);
        
        -- Registrar uso
        INSERT INTO cupom_usos (cupom_id, usuario_id, pedido_id, valor_desconto)
        VALUES (v_cupom_id, p_usuario_id, p_pedido_id, v_valor_desconto);
        
        -- Incrementar contador
        UPDATE cupons SET usos = usos + 1 WHERE id = v_cupom_id;
        
        SELECT TRUE as sucesso, v_valor_desconto as desconto, 'Cupom aplicado com sucesso' as mensagem;
    ELSE
        SELECT FALSE as sucesso, 0 as desconto, 'Cupom inválido ou expirado' as mensagem;
    END IF;
END//
DELIMITER ;

-- Procedure para desativar cupom
DELIMITER //
CREATE PROCEDURE desativar_cupom(
    IN p_cupom_id INT
)
BEGIN
    UPDATE cupons SET status = 'inativo' WHERE id = p_cupom_id;
    SELECT ROW_COUNT() as cupons_atualizados;
END//
DELIMITER ;

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os cupons ativos
-- SELECT * FROM cupons WHERE status = 'ativo' AND validade > NOW();

-- Buscar cupons por tipo
-- SELECT * FROM cupons WHERE tipo = 'porcentagem';

-- Buscar cupons mais usados
-- SELECT * FROM cupons ORDER BY usos DESC;

-- Buscar cupons que expiram em breve
-- SELECT * FROM cupons WHERE validade < DATE_ADD(NOW(), INTERVAL 7 DAY) AND status = 'ativo';

-- Verificar uso de cupom por usuário
-- SELECT * FROM cupom_usos WHERE usuario_id = 1;

-- ============================================
-- VIEWS
-- ============================================

-- View de cupons ativos
CREATE OR REPLACE VIEW vw_cupons_ativos AS
SELECT 
    c.id,
    c.codigo,
    c.tipo,
    c.valor,
    c.usos,
    c.maximo_usos,
    c.validade,
    DATEDIFF(c.validade, NOW()) as dias_restantes,
    ROUND((c.usos / c.maximo_usos) * 100, 2) as percentual_uso
FROM cupons c
WHERE c.status = 'ativo'
AND c.validade > NOW();

-- View de estatísticas de cupons
CREATE OR REPLACE VIEW vw_estatisticas_cupons AS
SELECT 
    c.id,
    c.codigo,
    c.tipo,
    c.valor,
    c.usos,
    c.maximo_usos,
    COUNT(cu.id) as total_usos_registrados,
    SUM(cu.valor_desconto) as total_desconto_gerado
FROM cupons c
LEFT JOIN cupom_usos cu ON c.id = cu.cupom_id
GROUP BY c.id;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca combinada
CREATE INDEX idx_status_validade ON cupons(status, validade);

-- Índice para busca de código
CREATE INDEX idx_codigo_busca ON cupons(codigo);

-- ============================================
-- EVENTOS (Desativação automática)
-- ============================================

-- Evento para desativar cupons expirados diariamente
DELIMITER //
CREATE EVENT IF NOT EXISTS evt_desativar_cupons_expirados
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    UPDATE cupons
    SET status = 'expirado'
    WHERE status = 'ativo'
    AND validade < NOW();
END//
DELIMITER ;
