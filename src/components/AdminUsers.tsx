import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { ShieldCheck, UserPlus, Key, UserMinus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
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
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post("/users", formData);
      }
      setShowAdd(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "colaborador" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    setShowAdd(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setIsDeleting(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir usuário");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Corpo Técnico</h1>
          <p className="text-slate-500 font-medium">Gestão de acessos e permissões do sistema</p>
        </div>
        <button 
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setEditingUser(null);
              setFormData({ name: "", email: "", password: "", role: "colaborador" });
            } else {
              setShowAdd(true);
            }
          }}
          className={`px-4 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2 transition-all ${
            showAdd ? "bg-slate-100 text-slate-600" : "bg-blue-600 text-white shadow-lg shadow-blue-100"
          }`}
        >
          {showAdd ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAdd ? "Cancelar" : "Novo Usuário"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-8 border border-blue-100 shadow-xl shadow-blue-50"
          >
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                {editingUser ? "Atualizar Privilégios" : "Credenciar Novo Colaborador"}
             </h3>
             <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                  <input 
                    type="email" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Senha {editingUser ? "(Opcional)" : "Provisória"}</label>
                  <input 
                    type="password" required={!editingUser}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    placeholder={editingUser ? "Mantenha em branco para não alterar" : ""}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Perfil de Acesso</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="master">Administrador Master</option>
                  </select>
                </div>
                <div className="md:col-span-4 flex justify-between items-center pt-4 border-t border-slate-50">
                   {error && <span className="bg-rose-50 text-rose-600 text-xs px-3 py-1 rounded-full font-bold uppercase">{error}</span>}
                   <button className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase ml-auto hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                     {editingUser ? "Salvar Alterações" : "Finalizar Cadastro"}
                   </button>
                </div>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 p-4 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
           <div className="col-span-1">ID</div>
           <div className="col-span-4 font-bold">COLABORADOR</div>
           <div className="col-span-2">E-MAIL</div>
           <div className="col-span-2 text-center font-bold">NÍVEL</div>
           <div className="col-span-3 text-right">AÇÕES</div>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50/50 transition-colors">
              <div className="col-span-1 font-mono text-[10px] text-slate-400">#{u.id.toString().padStart(3, '0')}</div>
              <div className="col-span-4 font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-inner flex items-center justify-center font-black text-sm">
                  {u.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  {u.name}
                  <span className="md:hidden text-[9px] text-slate-400 font-medium">{u.email}</span>
                </div>
              </div>
              <div className="col-span-2 text-xs text-slate-500 font-medium truncate">{u.email}</div>
              <div className="col-span-2 flex justify-center">
                <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-tighter ${
                  u.role === "master" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {u.role.toUpperCase()}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                 <button 
                  onClick={() => handleEdit(u)}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                  title="Editar Usuário"
                 >
                    <Key className="w-4 h-4" />
                 </button>
                 
                 {isDeleting === u.id ? (
                    <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
                       <button onClick={() => handleDelete(u.id)} className="bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-lg">CONFIRMAR</button>
                       <button onClick={() => setIsDeleting(null)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded-lg"><X className="w-3 h-3"/></button>
                    </div>
                 ) : (
                    <button 
                      onClick={() => setIsDeleting(u.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Excluir Usuário"
                    >
                       <UserMinus className="w-4 h-4" />
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
