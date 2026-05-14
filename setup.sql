-- SEBASTIÃO (Sistema de Gestão de Demandas de TI)
-- Script de Inicialização de Banco de Dados

-- 1. Criação do Banco de Dados (se necessário)
-- CREATE DATABASE IF NOT EXISTS ti;
-- USE ti;

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('master', 'colaborador') NOT NULL DEFAULT 'colaborador',
    theme VARCHAR(10) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Demandas (Tarefas)
CREATE TABLE IF NOT EXISTS demands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INT DEFAULT 1, -- 0: Normal, 1: Alta, 2: Baixa (ou conforme sua lógica de visualização)
    done TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Auditoria
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

-- 5. Usuário Administrador Padrão (Opcional se o app não criar)
-- Senha padrão: admin123 (Criptografada abaixo via bcrypt)
-- INSERT INTO users (name, email, password, role) 
-- VALUES ('Admin Master', 'admin@ti.com', '$2a$10$7R6vL1R.XFEx.bH1P.U9E.f7X1hN/b/k/mN.rN.rN.rN.rN.rN.rN', 'master')
-- ON DUPLICATE KEY UPDATE email=email;

-- INSTRUCÕES DE USO:
-- a) Copie este conteúdo e execute no seu console MySQL ou utilize o PHPMyAdmin.
-- b) Certifique-se de configurar as variáveis de ambiente no arquivo .env (DB_HOST, DB_USER, etc).
-- c) O sistema também tenta criar estas tabelas automaticamente ao iniciar (server.ts).
