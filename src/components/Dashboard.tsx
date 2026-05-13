import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { 
  Plus, CheckCircle2, Circle, AlertCircle, 
  Trash2, Edit3, Eye, Search, Filter,
  CheckCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Demand {
  id: number;
  name: string;
  description: string;
  done: number;
  priority: number;
  created_at: string;
}

export default function Dashboard() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", description: "", priority: false });

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const data = await api.get("/demands");
      setDemands(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingDemand) {
        await api.put(`/demands/${editingDemand.id}`, {
          ...editingDemand,
          name: formData.name,
          description: formData.description,
          priority: formData.priority ? 1 : 0
        });
      } else {
        await api.post("/demands", formData);
      }
      setShowAddModal(false);
      setEditingDemand(null);
      setFormData({ name: "", description: "", priority: false });
      fetchDemands();
    } catch (err: any) {
      alert(`Erro ao ${editingDemand ? 'atualizar' : 'criar'} demanda: ` + err.message);
    }
  };

  const handleEdit = (demand: Demand) => {
    setEditingDemand(demand);
    setFormData({ 
      name: demand.name, 
      description: demand.description, 
      priority: !!demand.priority 
    });
    setShowAddModal(true);
  };

  const handleToggleDone = async (demand: Demand) => {
    try {
      await api.put(`/demands/${demand.id}`, {
        ...demand,
        done: demand.done ? 0 : 1
      });
      fetchDemands();
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/demands/${id}`);
      setIsDeleting(null);
      fetchDemands();
    } catch (err) {
      alert("Erro ao excluir demanda");
    }
  };

  const filteredDemands = demands.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" ? true : filter === "done" ? d.done : !d.done;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-sans font-black text-slate-900 tracking-tight">TI Demandas</h1>
          <p className="text-slate-500 font-medium">Gestão centralizada de chamados de TI</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingDemand(null);
            setFormData({ name: "", description: "", priority: false });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Demanda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 glass-card p-4">
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar chamado..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Filter className="w-4 h-4 self-center text-slate-400" />
           <select 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
           >
             <option value="all">TODAS</option>
             <option value="pending">PENDENTES</option>
             <option value="done">CONCLUÍDAS</option>
           </select>
        </div>
        <div className="flex items-center justify-end gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
           <span className="bg-slate-100 px-2 py-1 rounded">Total: {filteredDemands.length}</span>
           <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">Pendentes: {demands.filter(d => !d.done).length}</span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 bg-slate-50/50 border-b border-slate-100 p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-1">STATUS</div>
          <div className="col-span-6">DESCRIÇÃO DO CHAMADO</div>
          <div className="col-span-2">PRIORIDADE</div>
          <div className="col-span-3 text-right">AÇÕES</div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Sincronizando Banco de Dados...</div>
          ) : filteredDemands.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium italic">Nenhum chamado encontrado</div>
          ) : (
            filteredDemands.map((demand) => (
              <div key={demand.id} className="grid grid-cols-1 md:grid-cols-12 p-4 items-center gap-4 hover:bg-slate-50/80 transition-colors group">
                <div className="col-span-1 flex justify-center">
                  <button 
                    onClick={() => handleToggleDone(demand)}
                    className={`p-2 rounded-full transition-all ${demand.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300 hover:text-slate-500'}`}
                  >
                    {demand.done ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                </div>
                
                <div className="col-span-6">
                  <div className={`text-base font-bold text-slate-800 ${demand.done ? 'line-through opacity-40' : ''}`}>
                    {demand.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">#{demand.id}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase italic">Criado em {new Date(demand.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  {demand.priority ? (
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-full border border-rose-100">
                      ALTA PRIORIDADE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Normal</span>
                  )}
                </div>

                <div className="col-span-3">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedDemand(demand)}
                      title="Ver detalhes"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(demand)}
                      title="Editar"
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    
                    {isDeleting === demand.id ? (
                      <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                        <button 
                           onClick={() => handleDelete(demand.id)}
                           className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-rose-700"
                        >
                          CONFIRMAR
                        </button>
                        <button 
                           onClick={() => setIsDeleting(null)}
                           className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-300"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsDeleting(demand.id)}
                        title="Excluir"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL ADICIONAR / EDITAR */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl border border-slate-200"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingDemand ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {editingDemand ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                {editingDemand ? 'Editar Chamado' : 'Registrar Chamado'}
              </h2>
              <form onSubmit={handleAdd} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Título do Chamado</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Instalar impressora no financeiro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição do Problema</label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva detalhadamente a situação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <input 
                    type="checkbox" 
                    id="prio"
                    className="w-5 h-5 rounded-md accent-blue-600 cursor-pointer"
                    checked={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.checked})}
                   />
                   <label htmlFor="prio" className="text-sm font-bold text-slate-700 cursor-pointer">Definir como ALTA PRIORIDADE</label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    {editingDemand ? 'Salvar Alterações' : 'Salvar Chamado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL VISUALIZAÇÃO */}
      <AnimatePresence>
        {selectedDemand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
               onClick={() => setSelectedDemand(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-1 shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedDemand.done ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {selectedDemand.done ? 'Concluído' : 'Em Aberto'}
                        </span>
                        {selectedDemand.priority ? (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Urgente</span>
                        ) : null}
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {selectedDemand.name}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium uppercase mt-2">
                        Aberto em {new Date(selectedDemand.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => setSelectedDemand(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="space-y-6">
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-[160px] text-slate-700 leading-relaxed">
                      {selectedDemand.description || "Nenhum detalhe adicional fornecido."}
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Protocolo de Registro</span>
                        <span className="text-lg font-black font-mono">#{selectedDemand.id.toString().padStart(6, '0')}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedDemand(null)}
                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        FECHAR DETALHES
                      </button>
                   </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
