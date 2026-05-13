/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./lib/api";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Stats from "./components/Stats";
import AdminUsers from "./components/AdminUsers";
import AuditLogs from "./components/AuditLogs";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";

interface User {
  id: number;
  name: string;
  email: string;
  role: "master" | "colaborador";
  theme: "light" | "dark";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (user) {
      try {
        await api.put("/auth/theme", { theme: newTheme });
        setUser({ ...user, theme: newTheme });
      } catch (error) {
        console.error("Erro ao salvar tema no perfil", error);
      }
    }
  };

  const checkAuth = async () => {
    try {
      const userData = await api.get("/auth/me");
      setUser(userData);
      if (userData.theme) {
        setTheme(userData.theme);
        localStorage.setItem("theme", userData.theme);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    if (userData.theme) {
      setTheme(userData.theme);
      localStorage.setItem("theme", userData.theme);
    }
  };
  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
      setUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
           <div className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Iniciando Ambiente...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, theme, toggleTheme, login, logout }}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
          {user && <Navbar />}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to="/" />} 
              />
              <Route 
                path="/" 
                element={user ? <Stats /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/demandas" 
                element={user ? <Dashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/perfil" 
                element={user ? <Profile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/admin/usuarios" 
                element={user?.role === "master" ? <AdminUsers /> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin/auditoria" 
                element={user?.role === "master" ? <AuditLogs /> : <Navigate to="/" />} 
              />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
