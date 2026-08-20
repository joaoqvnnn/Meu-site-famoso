-- ============================================
-- STREAMPREMIUM - TABELA DE PRODUTOS
-- ============================================

-- Usar banco de dados
USE streampremium;

-- ============================================
-- CRIAÇÃO DA TABELA DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS produtos (
    -- Identificação
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    
    -- Informações
    genero VARCHAR(100),
    ano INT,
    duracao VARCHAR(50),
    avaliacao DECIMAL(3,1) DEFAULT 0.0,
    preco DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    imagem VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'disponivel',
    destaque BOOLEAN DEFAULT FALSE,
    
    -- Datas
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_tipo (tipo),
    INDEX idx_genero (genero),
    INDEX idx_status_produto (status),
    INDEX idx_destaque (destaque),
    INDEX idx_ano (ano),
    INDEX idx_preco (preco),
    FULLTEXT INDEX ft_titulo_descricao (titulo, descricao)
) ENGINE=InnoDB;

-- ============================================
-- INSERÇÃO DE PRODUTOS
-- ============================================

-- Filmes
INSERT INTO produtos (titulo, tipo, genero, ano, duracao, avaliacao, preco, descricao, status, destaque) VALUES
('Duna: Parte 2', 'filme', 'Ficção Científica', 2024, '2h 46min', 8.9, 29.90, 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família. Enfrentando uma escolha entre o amor de sua vida e o destino do universo.', 'disponivel', TRUE),
('Interestelar', 'filme', 'Ficção Científica', 2014, '2h 49min', 8.7, 19.90, 'Um grupo de exploradores viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.', 'disponivel', FALSE),
('A Origem', 'filme', 'Ação', 2010, '2h 28min', 8.8, 24.90, 'Um ladrão especializado em extrair segredos dos sonhos recebe uma missão impossível: plantar uma ideia na mente de um alvo.', 'disponivel', FALSE),
('Oppenheimer', 'filme', 'Drama', 2023, '3h 00min', 8.6, 24.90, 'A história do físico J. Robert Oppenheimer e seu papel no desenvolvimento da bomba atômica.', 'disponivel', TRUE),
('Mad Max: Estrada da Fúria', 'filme', 'Ação', 2015, '2h 00min', 8.1, 19.90, 'Em um mundo pós-apocalíptico, Max se junta a Furiosa para fugir de um tirano.', 'disponivel', FALSE),
('John Wick 4', 'filme', 'Ação', 2023, '2h 49min', 8.1, 29.90, 'John Wick enfrenta seus inimigos mais mortais em uma batalha final.', 'disponivel', FALSE),
('A Sociedade da Neve', 'filme', 'Drama', 2023, '2h 24min', 7.9, 24.90, 'A história real de sobreviventes de um acidente aéreo nos Andes.', 'disponivel', FALSE),
('Hereditário', 'filme', 'Terror', 2018, '2h 07min', 7.3, 14.90, 'Uma família é assombrada por eventos sobrenaturais após a morte da avó.', 'disponivel', FALSE),
('O Massacre da Serra Elétrica', 'filme', 'Terror', 1974, '1h 23min', 7.4, 9.90, 'Um grupo de jovens encontra uma família de canibais no Texas.', 'disponivel', FALSE);

-- Séries
INSERT INTO produtos (titulo, tipo, genero, ano, duracao, avaliacao, preco, descricao, status, destaque) VALUES
('Breaking Bad - T1', 'serie', 'Drama', 2008, '45min/ep', 9.5, 49.90, 'Um professor de química do ensino médio se torna traficante de drogas após ser diagnosticado com câncer terminal.', 'disponivel', TRUE),
('Stranger Things - T1', 'serie', 'Terror', 2016, '50min/ep', 8.7, 39.90, 'Uma cidade pequena é assombrada por eventos sobrenaturais e experimentos secretos do governo.', 'disponivel', TRUE),
('The Office', 'serie', 'Comédia', 2005, '22min/ep', 9.0, 34.90, 'Um documentário sobre a vida dos funcionários de um escritório de papel.', 'disponivel', FALSE),
('Friends', 'serie', 'Comédia', 1994, '22min/ep', 8.9, 29.90, 'Seis amigos vivem em Manhattan e enfrentam as alegrias e desafios da vida adulta.', 'disponivel', FALSE),
('Suits', 'serie', 'Drama', 2011, '42min/ep', 8.4, 39.90, 'Um advogado brilhante sem diploma consegue emprego em um escritório de advocacia.', 'disponivel', FALSE),
('The Last of Us', 'serie', 'Drama', 2023, '50min/ep', 8.8, 49.90, 'Um sobrevivente é encarregado de escoltar uma adolescente através de um mundo pós-apocalíptico.', 'disponivel', TRUE),
('Ted Lasso', 'serie', 'Comédia', 2020, '30min/ep', 8.8, 34.90, 'Um treinador de futebol americano é contratado para treinar um time de futebol inglês.', 'disponivel', FALSE);

-- Documentários
INSERT INTO produtos (titulo, tipo, genero, ano, duracao, avaliacao, preco, descricao, status, destaque) VALUES
('Planeta Terra II', 'documentario', 'Natureza', 2016, '50min/ep', 9.5, 34.90, 'Uma jornada épica pelos habitats mais fascinantes do planeta.', 'disponivel', TRUE),
('Cosmos', 'documentario', 'Ciência', 2014, '43min/ep', 9.3, 29.90, 'Uma viagem pelo universo com Neil deGrasse Tyson.', 'disponivel', FALSE),
('O Dilema das Redes', 'documentario', 'Tecnologia', 2020, '1h 34min', 7.6, 14.90, 'Ex-funcionários do Vale do Silício revelam os perigos das redes sociais.', 'disponivel', FALSE);

-- Animações
INSERT INTO produtos (titulo, tipo, genero, ano, duracao, avaliacao, preco, descricao, status, destaque) VALUES
('Toy Story 4', 'animacao', 'Animação', 2019, '1h 40min', 7.8, 24.90, 'Woody e Buzz embarcam em uma nova aventura para encontrar Forky.', 'disponivel', FALSE),
('Rick and Morty', 'animacao', 'Animação', 2013, '22min/ep', 9.1, 39.90, 'Um cientista leva seu neto em aventuras interdimensionalmente perigosas.', 'disponivel', FALSE),
('Demon Slayer', 'animacao', 'Animação', 2019, '24min/ep', 8.5, 34.90, 'Um jovem se torna caçador de demônios para vingar sua família.', 'disponivel', FALSE),
('One Piece', 'animacao', 'Animação', 1999, '24min/ep', 8.9, 44.90, 'Um jovem pirata busca o tesouro supremo para se tornar o Rei dos Piratas.', 'disponivel', FALSE);

-- ============================================
-- TABELA DE CATEGORIAS
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nome_categoria (nome)
) ENGINE=InnoDB;

-- Inserir categorias
INSERT INTO categorias (nome, descricao) VALUES
('Ação', 'Filmes e séries de ação e aventura'),
('Comédia', 'Conteúdo humorístico e divertido'),
('Drama', 'Histórias dramáticas e emocionantes'),
('Ficção Científica', 'Histórias futuristas e científicas'),
('Terror', 'Conteúdo de suspense e terror'),
('Animação', 'Animações e desenhos'),
('Natureza', 'Documentários sobre a natureza'),
('Ciência', 'Documentários científicos'),
('Tecnologia', 'Documentários sobre tecnologia');

-- ============================================
-- TABELA DE RELAÇÃO PRODUTO-CATEGORIA
-- ============================================
CREATE TABLE IF NOT EXISTS produto_categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY uk_produto_categoria (produto_id, categoria_id)
) ENGINE=InnoDB;

-- ============================================
-- CONSULTAS ÚTEIS
-- ============================================

-- Buscar todos os produtos disponíveis
-- SELECT * FROM produtos WHERE status = 'disponivel';

-- Buscar produtos em destaque
-- SELECT * FROM produtos WHERE destaque = TRUE AND status = 'disponivel';

-- Buscar produtos por tipo
-- SELECT * FROM produtos WHERE tipo = 'filme';

-- Buscar produtos por gênero
-- SELECT * FROM produtos WHERE genero = 'Ação';

-- Buscar produtos mais bem avaliados
-- SELECT * FROM produtos WHERE status = 'disponivel' ORDER BY avaliacao DESC;

-- Buscar produtos com preço abaixo de 20
-- SELECT * FROM produtos WHERE preco < 20.00;

-- Atualizar preço de um produto
-- UPDATE produtos SET preco = 34.90 WHERE id = 1;

-- Marcar produto como destaque
-- UPDATE produtos SET destaque = TRUE WHERE id = 2;

-- Excluir produto
-- DELETE FROM produtos WHERE id = 10;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índice para busca combinada
CREATE INDEX idx_tipo_status ON produtos(tipo, status);

-- Índice para ordenação por avaliação
CREATE INDEX idx_avaliacao ON produtos(avaliacao DESC);

-- Índice para ordenação por preço
CREATE INDEX idx_preco_ordenacao ON produtos(preco ASC);
