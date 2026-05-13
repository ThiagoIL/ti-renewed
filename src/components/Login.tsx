import { useState, FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../App";
import { Shield } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await api.post("/auth/login", { email, password });
      login(user);
    } catch (err: any) {
      setError(err.message || "Falha entrar no sistema");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#141414] p-3 mb-4">
            <Shield className="w-8 h-8 text-[#E4E3E0]" />
          </div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-tighter">
            Gestão de TI
          </h1>
          <p className="text-sm font-mono opacity-60">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase opacity-50 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              className="w-full border-b border-[#141414] py-2 focus:outline-none focus:border-b-2 font-mono"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase opacity-50 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              className="w-full border-b border-[#141414] py-2 focus:outline-none focus:border-b-2 font-mono"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 text-xs font-mono uppercase">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-mono font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-top border-dashed border-[#141414] border-t opacity-40">
           <p className="text-[10px] font-mono text-center">
             SISTEMA DE GESTÃO DE TI v2.0
           </p>
        </div>
      </div>
    </div>
  );
}
