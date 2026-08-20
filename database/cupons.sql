-- ============================================
-- STREAMPREMIUM - TABELA DE CÓDIGOS DE VERIFICAÇÃO
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE CÓDIGOS DE VERIFICAÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS codigos_verificacao (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    email VARCHAR(255),
    
    -- Código
    codigo VARCHAR(10) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    
    -- Status
    usado BOOLEAN DEFAULT FALSE,
    
    -- Datas
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usado_em TIMESTAMP NULL,
    
    -- Chaves estrangeiras
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_codigo (codigo),
    INDEX idx_email_verificacao (email),
    INDEX idx_usuario_verificacao (usuario_id),
    INDEX idx_tipo_verificacao (tipo),
    INDEX idx_expiracao (expira_em),
    INDEX idx_status_uso (usado)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE CÓDIGOS DE EXEMPLO
-- ============================================

-- Código de verificação de e-mail para João (id=1)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(1, 'joao.silva@email.com', '123456', 'verificacao_email', DATE_ADD(NOW(), INTERVAL 30 MINUTE));

-- Código de recuperação de senha para Maria (id=2)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(2, 'maria.oliveira@email.com', 'ABCD1234', 'recuperacao_senha', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Código de verificação de e-mail para Pedro (id=3)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(3, 'pedro.santos@email.com', '987654', 'verificacao_email', DATE_ADD(NOW(), INTERVAL 30 MINUTE));

-- Código de verificação de dispositivo para Ana (id=4)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(4, 'ana.costa@email.com', 'DEV123456', 'verificacao_dispositivo', DATE_ADD(NOW(), INTERVAL 15 MINUTE));

-- Código de recuperação de senha para Carlos (id=5)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(5, 'carlos.pereira@email.com', 'EFGH5678', 'recuperacao_senha', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- Código de verificação de e-mail para Juliana (id=6) - Já usado
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, usado, expira_em, usado_em) VALUES
(6, 'juliana.almeida@email.com', '456789', 'verificacao_email', TRUE, DATE_ADD(NOW(), INTERVAL -10 MINUTE), NOW());

-- Código de verificação de e-mail para Roberto (id=7) - Expirado
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(7, 'roberto.nunes@email.com', '789123', 'verificacao_email', DATE_ADD(NOW(), INTERVAL -5 MINUTE));

-- Código de recuperação de senha para Fernanda (id=8)
INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em) VALUES
(8, 'fernanda.lima@email.com', 'IJKL9012', 'recuperacao_senha', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para gerar código de verificação
DELIMITER //
CREATE FUNCTION gerar_codigo_verificacao()
RETURNS VARCHAR(6)
DETERMINISTIC
BEGIN
    RETURN LPAD(FLOOR(RAND() * 1000000), 6, '0');
END//
DELIMITER ;

-- Função para verificar se código é válido
DELIMITER //
CREATE FUNCTION verificar_codigo_valido(
    p_email VARCHAR(255),
    p_codigo VARCHAR(10),
    p_tipo VARCHAR(50)
)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE codigo_valido BOOLEAN;
    
    SELECT COUNT(*) > 0 INTO codigo_valido
    FROM codigos_verificacao
    WHERE email = p_email
    AND codigo = p_codigo
    AND tipo = p_tipo
    AND usado = FALSE
    AND expira_em > NOW();
    
    RETURN codigo_valido;
END//
DELIMITER ;

-- ============================================
-- PROCEDURES
-- ============================================

-- Procedure para gerar novo código de verificação
DELIMITER //
CREATE PROCEDURE gerar_novo_codigo(
    IN p_usuario_id INT,
    IN p_email VARCHAR(255),
    IN p_tipo VARCHAR(50),
    IN p_minutos_expiracao INT
)
BEGIN
    DECLARE v_codigo VARCHAR(10);
    
    -- Gerar código baseado no tipo
    IF p_tipo = 'verificacao_email' THEN
        SET v_codigo = LPAD(FLOOR(RAND() * 1000000), 6, '0');
    ELSEIF p_tipo = 'recuperacao_senha' THEN
        SET v_codigo = CONCAT(
            SUBSTRING(MD5(RAND()), 1, 4),
            SUBSTRING(MD5(RAND()), 1, 4)
        );
    ELSE
        SET v_codigo = CONCAT('DEV', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
    END IF;
    
    -- Invalidar códigos anteriores do mesmo tipo
    UPDATE codigos_verificacao
    SET usado = TRUE, usado_em = NOW()
    WHERE usuario_id = p_usuario_id
    AND tipo = p_tipo
    AND usado = FALSE;
    
    -- Inserir novo código
    INSERT INTO codigos_verificacao (usuario_id, email, codigo, tipo, expira_em)
    VALUES (p_usuario_id, p_email, v_codigo, p_tipo, DATE_ADD(NOW(), INTERVAL p_minutos_expiracao MINUTE));
    
    -- Retornar o código gerado
    SELECT v_codigo as codigo_gerado;
END//
DELIMITER ;

-- Procedure para usar código de verificação
DELIMITER //
CREATE PROCEDURE usar_codigo_verificacao(
    IN p_email VARCHAR(255),
    IN p_codigo VARCHAR(10),
    IN p_tipo VARCHAR(50)
)
BEGIN
    DECLARE v_codigo_id INT;
    
    -- Buscar código válido
    SELECT id INTO v_codigo_id
    FROM codigos_verificacao
    WHERE email = p_email
    AND codigo = p_codigo
    AND tipo = p_tipo
    AND usado = FALSE
    AND expira_em > NOW()
    LIMIT 1;
    
    IF v_codigo_id IS NOT NULL THEN
        -- Marcar como usado
        UPDATE codigos_verificacao
        SET usado = TRUE, usado_em = NOW()
        WHERE id = v_codigo_id;
        
        SELECT TRUE as sucesso, 'Código validado com sucesso' as mensagem;
    ELSE
        SELECT FALSE as sucesso, 'Código inválido ou expirado' as mensagem;
    END IF;
END//
DELIMITER ;

-- Procedure para limpar códigos expirados
DELIMITER //
CREATE PROCEDURE limpar_codigos_expirados()
BEGIN
    DELETE FROM codigos_verificacao
    WHERE expira_em < NOW()
    AND usado = FALSE;
    
    SELECT ROW_COUNT() as codigos_removidos;
END//
DELIMITER ;

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar códigos válidos de um usuário
-- SELECT * FROM codigos_verificacao WHERE usuario_id = 1 AND usado = FALSE AND expira_em > NOW();

-- Buscar códigos por tipo
-- SELECT * FROM codigos_verificacao WHERE tipo = 'verificacao_email';

-- Buscar códigos expirados
-- SELECT * FROM codigos_verificacao WHERE expira_em < NOW() AND usado = FALSE;

-- Contar códigos gerados por dia
-- SELECT DATE(criado_em) as data, COUNT(*) as total FROM codigos_verificacao GROUP BY DATE(criado_em);

-- ============================================
-- VIEWS
-- ============================================

-- View de códigos ativos
CREATE OR REPLACE VIEW vw_codigos_ativos AS
SELECT 
    cv.id,
    cv.usuario_id,
    u.nome as nome_usuario,
    cv.email,
    cv.codigo,
    cv.tipo,
    cv.expira_em,
    cv.criado_em,
    TIMESTAMPDIFF(MINUTE, NOW(), cv.expira_em) as minutos_restantes
FROM codigos_verificacao cv
LEFT JOIN usuarios u ON cv.usuario_id = u.id
WHERE cv.usado = FALSE
AND cv.expira_em > NOW();

-- View de estatísticas de códigos
CREATE OR REPLACE VIEW vw_estatisticas_codigos AS
SELECT 
    tipo,
    COUNT(*) as total_gerados,
    COUNT(CASE WHEN usado = TRUE THEN 1 END) as total_usados,
    COUNT(CASE WHEN usado = FALSE AND expira_em < NOW() THEN 1 END) as total_expirados,
    COUNT(CASE WHEN usado = FALSE AND expira_em > NOW() THEN 1 END) as total_ativos
FROM codigos_verificacao
GROUP BY tipo;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca combinada
CREATE INDEX idx_email_tipo ON codigos_verificacao(email, tipo);

-- Índice para busca de códigos ativos
CREATE INDEX idx_codigos_ativos ON codigos_verificacao(usado, expira_em);

-- ============================================
-- EVENTOS (Limpeza automática)
-- ============================================

-- Evento para limpar códigos expirados a cada hora
DELIMITER //
CREATE EVENT IF NOT EXISTS evt_limpar_codigos_expirados
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM codigos_verificacao
    WHERE expira_em < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND usado = FALSE;
END//
DELIMITER ;
