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
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#141414] dark:border-slate-800 p-8 shadow-[8px_8px_0px_0px_#141414] dark:shadow-none transition-colors">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#141414] dark:bg-blue-600 p-3 mb-4 rounded-xl">
            <Shield className="w-8 h-8 text-[#E4E3E0] dark:text-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-1">
            TI Demandas
          </h1>
          <p className="text-sm font-medium opacity-40 dark:text-slate-400">Infraestrutura e Suporte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5">
              E-mail Corporativo
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
              placeholder="seu@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5">
              Chave de Acesso
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-bold uppercase flex items-center gap-2">
               <Shield className="w-4 h-4" />
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl dark:shadow-none active:scale-95"
          >
            {loading ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
           <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 text-center uppercase tracking-widest">
             Sede Tecnológica v2.1
           </p>
        </div>
      </div>
    </div>
  );
}
