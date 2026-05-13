import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_padrao";

app.use(express.json());
app.use(cookieParser());

// Configuração do Banco de Dados
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ti",
};

let pool: any = null;

async function connectDB() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log("Conectado ao MySQL com sucesso!");
    
    // Teste de conexão e criação do admin inicial se necessário
    const [rows]: any = await pool.execute("SELECT * FROM users WHERE role = 'master' LIMIT 1");
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await pool.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Admin Master", "admin@ti.com", hashedPassword, "master"]
      );
      console.log("Usuário Master padrão criado (admin@ti.com / admin123)");
    }
  } catch (error) {
    console.error("Erro ao conectar ao MySQL:", error);
    // Se falhar o MySQL aqui no preview (sem banco local), o app vai dar erro nas chamadas de API.
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
  };
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token;

  if (!token) {
     res.status(401).json({ error: "Não autorizado" });
     return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
    await pool.execute(
      "INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [userId, action, targetType, targetId, details]
    );
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}

// --- API ROUTES ---

// Auth
app.post("/api/auth/login", async (req: Request, res: Response) => {
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
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout realizado com sucesso" });
});

app.get("/api/auth/me", authenticate, (req: AuthRequest, res) => {
  res.json(req.user);
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
    const [rows]: any = await pool.execute("SELECT * FROM demands ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar demandas" });
  }
});

app.post("/api/demands", authenticate, async (req: AuthRequest, res) => {
  const { name, description, priority } = req.body;
  try {
    // Garantir que priority seja um número válido (0, 1 ou 2)
    const prioValue = (priority !== undefined && priority !== null) ? parseInt(priority.toString()) : 1;
    
    const [result]: any = await pool.execute(
      "INSERT INTO demands (name, description, priority, done) VALUES (?, ?, ?, ?)",
      [name || "Sem Nome", description || "", prioValue, 0]
    );
    
    await logAction(req.user!.id, "CREATE_DEMAND", "demands", result.insertId, `Criou demanda: ${name}`);
    res.status(201).json({ id: result.insertId, name, description, priority: prioValue, done: 0 });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
