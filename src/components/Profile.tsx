import { useState, FormEvent } from "react";
import { api } from "../lib/api";
import { KeyRound, ShieldAlert } from "lucide-react";

export default function Profile() {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (passwords.new !== passwords.confirm) {
      setStatus({ type: "error", message: "As novas senhas não coincidem" });
      return;
    }

    try {
      await api.post("/users/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setStatus({ type: "success", message: "Senha atualizada com sucesso!" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
       <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Segurança da Conta</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Proteja sua conta alterando sua senha periodicamente</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 shadow-soft dark:shadow-none">
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 mb-8 flex items-center gap-4">
                 <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                    <KeyRound className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Gerenciamento de Senha</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Use pelo menos 8 caracteres para maior segurança</p>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Senha Atual</label>
                <input 
                  type="password" required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nova Senha</label>
                  <input 
                    type="password" required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar Senha</label>
                  <input 
                    type="password" required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl text-xs font-bold uppercase ${
                  status.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40"
                }`}>
                  <div className="flex items-center gap-2">
                    {status.type === "error" && <ShieldAlert className="w-4 h-4" />}
                    {status.message}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl dark:shadow-none active:scale-95"
              >
                Atualizar Chave de Acesso
              </button>
           </form>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-2xl text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed italic">
           Aviso: A troca de credenciais invalida sessões ativas em outros navegadores. 
           Suas ações de segurança são monitoradas pelo controle de auditoria institucional.
        </div>
    </div>
  );
}
