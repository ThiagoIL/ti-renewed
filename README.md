# TI Demandas - Sistema de Gestão

## Configuração do Banco de Dados

Este sistema utiliza **MySQL** como banco de dados.

### 1. Variáveis de Ambiente
Renomeie o arquivo `.env.example` para `.env` (ou crie um novo) e configure as credenciais:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=ti
```

### 2. Migrações e Inicialização

O sistema possui dois modos de inicialização do banco:

#### Automático (Recomendado)
Ao rodar `npm run dev` ou `npm start`, o arquivo `server.ts` executará automaticamente as queries de `CREATE TABLE IF NOT EXISTS`. Ele também criará um usuário administrador padrão caso a tabela de usuários esteja vazia:
- **E-mail:** admin@ti.com
- **Senha:** admin123

#### Manual (Script SQL)
Caso prefira criar a estrutura manualmente ou precise importar em um novo servidor:
1. Localize o arquivo `setup.sql` na raiz do projeto.
2. Execute o conteúdo desse arquivo no seu gerenciador de banco de dados (MySQL Workbench, HeidiSQL, PHPMyAdmin ou via CLI).
3. Comando CLI: `mysql -u seu_usuario -p ti < setup.sql`

## Correção de Datas
Se você encontrar erros de "Incorrect datetime value: '0000-00-00 00:00:00'", o sistema já possui uma lógica de limpeza automática no `server.ts` que converte essas datas inválidas para a data atual (`NOW()`), garantindo compatibilidade com o Modo Estrito do MySQL.
