/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./lib/api";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminUsers from "./components/AdminUsers";
import AuditLogs from "./components/AuditLogs";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";

interface User {
  id: number;
  name: string;
  email: string;
  role: "master" | "colaborador";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.get("/auth/me");
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => setUser(userData);
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
      <div className="flex items-center justify-center min-h-screen bg-[#E4E3E0] font-sans">
        <div className="text-xl font-mono animate-pulse">CARREGANDO SISTEMA...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
          {user && <Navbar />}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? <Login /> : <Navigate to="/" />} 
              />
              <Route 
                path="/" 
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
