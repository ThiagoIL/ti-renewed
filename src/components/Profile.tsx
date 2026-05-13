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
          <h1 className="text-3xl font-mono font-black uppercase tracking-tighter">Segurança da Conta</h1>
          <p className="text-sm font-mono opacity-60 italic">Atualize suas credenciais de acesso</p>
        </div>

        <div className="bg-white border-2 border-[#141414] p-8 shadow-[10px_10px_0px_0px_#141414]">
           <form onSubmit={handleSubmit} className="space-y-6 font-mono">
              <div>
                <label className="block text-[10px] uppercase opacity-50 mb-1">Senha Atual</label>
                <input 
                  type="password" required
                  className="w-full border-b border-[#141414] py-2 focus:border-b-2 outline-none"
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                />
              </div>

              <div className="pt-4 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase opacity-50 mb-1">Nova Senha</label>
                  <input 
                    type="password" required
                    className="w-full border-b border-[#141414] py-2 focus:border-b-2 outline-none"
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase opacity-50 mb-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" required
                    className="w-full border-b border-[#141414] py-2 focus:border-b-2 outline-none"
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
              </div>

              {status && (
                <div className={`p-4 text-xs font-bold uppercase ${
                  status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  <div className="flex items-center gap-2">
                    {status.type === "error" && <ShieldAlert className="w-4 h-4" />}
                    {status.message}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#141414] text-white py-4 font-bold uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Atualizar Credenciais
              </button>
           </form>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-6 font-mono text-[11px] leading-relaxed italic opacity-70">
           Lembre-se: Use senhas fortes combinando letras, números e caracteres especiais. 
           A alteração forçada de senha será registrada no log de auditoria do sistema.
        </div>
    </div>
  );
}
