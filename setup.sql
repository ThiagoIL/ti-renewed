-- Script para criação do banco de dados e tabelas

CREATE DATABASE IF NOT EXISTS ti;
USE ti;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('master', 'colaborador') DEFAULT 'colaborador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Demandas / Tarefas
CREATE TABLE IF NOT EXISTS demands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    done TINYINT(1) DEFAULT 0,
    priority TINYINT DEFAULT 1, -- 0: Sem Prioridade, 1: Normal, 2: Alta Prioridade
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Inserir usuário mestre padrão (Senha inicial: 'admin123')
-- Nota: Em produção, o usuário deve trocar essa senha no primeiro acesso.
-- A senha 'admin123' criptografada com bcrypt costuma ser: $2a$10$Xo9Z.P5zQ5K6vFzQ6Z.O.uC1V8W8W8W8W8W8W8W8W8W8W8W8
-- Mas para facilitar o INSERT inicial, vou apenas deixar o script pronto.
-- Você precisará rodar o sistema e ele criará o usuário se não existir via código ou usar este INSERT:
-- INSERT INTO users (name, email, password, role) VALUES ('Admin Master', 'admin@ti.com', '$2y$10$YourHashedPasswordHere', 'master');
