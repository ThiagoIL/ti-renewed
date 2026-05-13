import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { ShieldCheck, UserPlus, Key, UserMinus } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "colaborador" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get("/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", formData);
      setShowAdd(false);
      setFormData({ name: "", email: "", password: "", role: "colaborador" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-mono font-black uppercase tracking-tighter">Corpo Técnico</h1>
          <p className="text-sm font-mono opacity-60 italic">Gestão de acessos e permissões do sistema</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#141414] text-[#E4E3E0] px-4 py-2 font-mono font-bold uppercase text-xs flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {showAdd ? "Fechar" : "Novo Usuário"}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border-2 border-[#141414] p-6 animate-in slide-in-from-top duration-300">
           <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Nome Completo</label>
                <input 
                  type="text" required
                  className="w-full border-b border-[#141414] py-1 font-mono text-sm outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">E-mail Corporativo</label>
                <input 
                  type="email" required
                  className="w-full border-b border-[#141414] py-1 font-mono text-sm outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Senha Provisória</label>
                <input 
                  type="password" required
                  className="w-full border-b border-[#141414] py-1 font-mono text-sm outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Perfil</label>
                <select 
                  className="w-full border-b border-[#141414] py-1 font-mono text-sm outline-none uppercase font-bold"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="colaborador">COLABORADOR</option>
                  <option value="master">MASTER (ADMIN)</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-between items-center pt-4">
                 {error && <span className="text-red-600 text-xs font-mono font-bold uppercase">{error}</span>}
                 <button className="bg-[#141414] text-white px-8 py-2 text-xs font-bold uppercase ml-auto">Salvar Colaborador</button>
              </div>
           </form>
        </div>
      )}

      <div className="bg-white border border-[#141414] divide-y divide-[#141414]">
        <div className="grid grid-cols-12 p-3 bg-gray-100 text-[9px] font-bold uppercase opacity-50">
           <div className="col-span-1">ID</div>
           <div className="col-span-4">COLABORADOR</div>
           <div className="col-span-3">E-MAIL</div>
           <div className="col-span-2 text-center">NÍVEL</div>
           <div className="col-span-2 text-right">CRIADO EM</div>
        </div>
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-12 p-4 items-center font-mono text-sm hover:bg-gray-50 transition-colors">
            <div className="col-span-1 opacity-30 text-xs">#{u.id.toString().padStart(3, '0')}</div>
            <div className="col-span-4 font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-none flex items-center justify-center text-xs">
                {u.name.charAt(0)}
              </div>
              {u.name}
            </div>
            <div className="col-span-3 text-xs opacity-60 underline decoration-dotted">{u.email}</div>
            <div className="col-span-2 flex justify-center">
              <span className={`text-[10px] px-2 py-1 border font-bold ${
                u.role === "master" ? "border-purple-600 text-purple-600 bg-purple-50" : "border-[#141414]/20 opacity-50"
              }`}>
                {u.role.toUpperCase()}
              </span>
            </div>
            <div className="col-span-2 text-right text-[10px] opacity-40 italic">
               {new Date(u.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
