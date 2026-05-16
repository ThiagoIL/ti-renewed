import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = 3000;

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Validação de variáveis de ambiente críticas
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("ERRO CRÍTICO: JWT_SECRET não configurado no ambiente de produção.");
}
const SECRET_KEY = JWT_SECRET || "sebastiao_fallback_secret_only_for_dev";

// Segurança Básica com Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Desativado para facilitar integração com Vite dev server se necessário
}));

app.use(express.json());
app.use(cookieParser());

// Limitador de taxa para login (Prevenção de Brute Force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas por IP
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do Banco de Dados
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ti",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool: any = null;

async function runMigrations() {
  console.log("Iniciando migrações do banco de dados...");

  // 1. Tabela de Usuários
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('master', 'colaborador') NOT NULL DEFAULT 'colaborador',
      theme VARCHAR(10) DEFAULT 'light',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrações incrementais para 'users'
  try {
    await pool.execute("ALTER TABLE users MODIFY id INT UNSIGNED AUTO_INCREMENT");
    await pool.execute("ALTER TABLE users ADD COLUMN role ENUM('master', 'colaborador') NOT NULL DEFAULT 'colaborador'");
    await pool.execute("ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT 'light'");
  } catch (e) {}

  // 2. Tabela de Demandas
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS demands (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      priority INT DEFAULT 1,
      done TINYINT(1) DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrações incrementais para 'demands'
  try {
    await pool.execute("ALTER TABLE demands MODIFY id INT UNSIGNED AUTO_INCREMENT");
    await pool.execute("ALTER TABLE demands ADD COLUMN sort_order INT DEFAULT 0");
  } catch (e) {}
  
  try {
    // Tenta adicionar a coluna. Se já existir, vai para o próximo passo.
    await pool.execute("ALTER TABLE demands ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {
    // Se a coluna já existir, garante que ela tenha o DEFAULT correto
    try {
      await pool.execute("ALTER TABLE demands MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    } catch (err) {}
  }
  
  try {
    // Corrigir registros com data zerada ou nula ou com erro de epoch (Fix: Removed explicit '0000-00-00' comparison for strict mode support)
    await pool.execute("UPDATE demands SET created_at = NOW() WHERE created_at IS NULL OR created_at < '1971-01-01'");
  } catch (e) {}

  // 3. Tabela de Auditoria
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED,
      action VARCHAR(255) NOT NULL,
      target_type VARCHAR(50),
      target_id INT UNSIGNED,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  try {
    await pool.execute("ALTER TABLE audit_logs MODIFY id INT UNSIGNED AUTO_INCREMENT");
    await pool.execute("ALTER TABLE audit_logs MODIFY user_id INT UNSIGNED");
    await pool.execute("ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}

  // 4. Criar usuário Master inicial se não houver nenhum
  const [rows]: any = await pool.execute("SELECT * FROM users WHERE role = 'master' LIMIT 1");
  if (rows.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin Master", "admin@ti.com", hashedPassword, "master"]
    );
    console.log("Usuário Master padrão inicializado: admin@ti.com / admin123");
  }

  console.log("Migrações concluídas com sucesso.");
}

async function connectDB() {
  try {
    pool = mysql.createPool(dbConfig);
    // Testar conexão
    const connection = await pool.getConnection();
    console.log("Conectado ao MySQL com sucesso!");
    connection.release();

    await runMigrations();
  } catch (error: any) {
    console.error("ERRO CRÍTICO: Falha ao conectar ou inicializar o banco de dados.");
    console.error(`Mensagem: ${error.message}`);
    console.error("Verifique suas configurações no arquivo .env");
  }
}

connectDB();

// Middleware de Autenticação
interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: "master" | "colaborador";
    theme: "light" | "dark";
  };
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token;

  if (!token) {
     res.status(401).json({ error: "Não autorizado" });
     return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    req.user = decoded;
    next();
  } catch (error) {
     res.status(401).json({ error: "Token inválido" });
  }
};

const isMaster = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "master") {
     res.status(403).json({ error: "Acesso negado: Apenas administradores Master" });
     return;
  }
  next();
};

// Funções Auxiliares de Auditoria
async function logAction(userId: number, action: string, targetType: string, targetId: number | null, details: string) {
  if (!pool) return;
  try {
    const [result]: any = await pool.execute(
      "INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, action, targetType, targetId, details]
    );

    // Buscar o log recém criado para obter o nome do usuário etc (se necessário) ou apenas emitir para refetch
    io.emit("log_added");
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}

// --- API ROUTES ---

// Auth
app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
       res.status(401).json({ error: "E-mail ou senha incorretos" });
       return;
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
       res.status(401).json({ error: "E-mail ou senha incorretos" });
       return;
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, theme: user.theme || 'light' },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, theme: user.theme || 'light' });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout realizado com sucesso" });
});

app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT id, name, email, role, theme FROM users WHERE id = ?", [req.user?.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

// Atualizar Tema
app.put("/api/auth/theme", authenticate, async (req: AuthRequest, res) => {
  const { theme } = req.body;
  if (theme !== "light" && theme !== "dark") {
    res.status(400).json({ error: "Tema inválido" });
    return;
  }

  try {
    await pool.execute("UPDATE users SET theme = ? WHERE id = ?", [theme, req.user!.id]);
    console.log(`Tema atualizado para usuário ${req.user!.id}: ${theme}`);
    
    // Atualizar o cookie com o novo tema
    const token = jwt.sign(
      { ...req.user, theme },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tema" });
  }
});

// Usuários (Apenas Master)
app.get("/api/users", authenticate, isMaster, async (req, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT id, name, email, role, created_at FROM users");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.post("/api/users", authenticate, isMaster, async (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any = await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
    
    await logAction(req.user!.id, "CREATE_USER", "users", result.insertId, `Criou usuário: ${email}`);
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
       res.status(400).json({ error: "Este e-mail já está em uso" });
       return;
    }
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.put("/api/users/:id", authenticate, isMaster, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        "UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?",
        [name, email, role, hashedPassword, id]
      );
    } else {
      await pool.execute(
        "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
        [name, email, role, id]
      );
    }
    await logAction(req.user!.id, "UPDATE_USER", "users", parseInt(id), `Atualizou usuário: ${email}`);
    res.json({ id, name, email, role });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

app.delete("/api/users/:id", authenticate, isMaster, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.execute("SELECT email FROM users WHERE id = ?", [id]);
    const userEmail = rows[0]?.email || id;

    if (parseInt(id) === req.user!.id) {
      res.status(400).json({ error: "Não é possível excluir a si mesmo" });
      return;
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    await logAction(req.user!.id, "DELETE_USER", "users", parseInt(id), `Deletou usuário: ${userEmail}`);
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

// Alterar Senha (Geral)
app.post("/api/users/change-password", authenticate, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  try {
    const [rows]: any = await pool.execute("SELECT password FROM users WHERE id = ?", [userId]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
       res.status(400).json({ error: "Senha atual incorreta" });
       return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId]);
    
    await logAction(userId, "CHANGE_PASSWORD", "users", userId, "Alterou a própria senha");
    res.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
});

// Demandas / Tarefas
app.get("/api/demands", authenticate, async (req, res) => {
  try {
    const [rows]: any = await pool.execute("SELECT * FROM demands ORDER BY sort_order ASC, created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar demandas" });
  }
});

app.put("/api/demands/reorder", authenticate, async (req: AuthRequest, res: Response) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      for (const item of orders) {
        await connection.execute(
          "UPDATE demands SET sort_order = ? WHERE id = ?",
          [item.sort_order, item.id]
        );
      }
      await connection.commit();
      io.emit("demand_reordered", orders);
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao reordenar" });
  }
});

app.post("/api/demands", authenticate, async (req: AuthRequest, res) => {
  const { name, description, priority } = req.body;
  try {
    // Garantir que priority seja um número válido (0, 1 ou 2)
    const prioValue = (priority !== undefined && priority !== null) ? parseInt(priority.toString()) : 1;
    
    // Pegar o menor sort_order atual para colocar a nova demanda no topo (menor valor = início da lista)
    const [orders]: any = await pool.execute("SELECT MIN(sort_order) as minOrder FROM demands");
    const nextOrder = (orders[0].minOrder !== null) ? orders[0].minOrder - 1 : 0;

    // Inserimos com NOW() explicitamente para garantir que a data seja gravada mesmo se houver conflito de configuração de servidor
    const [result]: any = await pool.execute(
      "INSERT INTO demands (name, description, priority, done, sort_order, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [name || "Sem Nome", description || "", prioValue, 0, nextOrder]
    );
    
    // Buscamos o registro inserido para retornar com a data correta do banco
    const [rows]: any = await pool.execute("SELECT * FROM demands WHERE id = ?", [result.insertId]);
    const newDemand = rows[0];

    await logAction(req.user!.id, "CREATE_DEMAND", "demands", result.insertId, `Criou demanda: ${name}`);
    io.emit("demand_created", newDemand);
    res.status(201).json(newDemand);
  } catch (error: any) {
    console.error("Erro ao criar demanda:", error);
    res.status(500).json({ error: "Erro ao criar demanda no servidor: " + error.message });
  }
});

app.put("/api/demands/:id", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, priority, done } = req.body;
  try {
    await pool.execute(
      "UPDATE demands SET name = ?, description = ?, priority = ?, done = ? WHERE id = ?",
      [name, description, priority ?? 0, done ? 1 : 0, id]
    );
    
    await logAction(req.user!.id, "UPDATE_DEMAND", "demands", parseInt(id), `Atualizou demanda: ${name}`);
    io.emit("demand_updated", { id, name, description, priority, done });
    res.json({ id, name, description, priority, done });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar demanda" });
  }
});

app.delete("/api/demands/:id", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    // Buscar nome para o log antes de deletar
    const [rows]: any = await pool.execute("SELECT name FROM demands WHERE id = ?", [id]);
    const demandName = rows[0]?.name || id;

    await pool.execute("DELETE FROM demands WHERE id = ?", [id]);
    
    await logAction(req.user!.id, "DELETE_DEMAND", "demands", parseInt(id), `Deletou demanda: ${demandName}`);
    io.emit("demand_deleted", id);
    res.json({ message: "Demanda excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir demanda" });
  }
});

// Auditoria (Apenas Master)
app.get("/api/audit", authenticate, isMaster, async (req, res) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar auditoria" });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
