import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { 
  Plus, CheckCircle2, Circle, AlertCircle, 
  Trash2, Edit3, Eye, Search, Filter,
  CheckCircle, Clock,
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

type FilterType = "all" | "pending" | "done" | "high" | "normal" | "none";

export default function Dashboard() {
  const location = useLocation();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [activeTab, setActiveTab] = useState<"pending" | "done">("pending");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", description: "", priority: 1 }); // 1 = Normal default

  useEffect(() => {
    fetchDemands();
    
    // Check for filter in navigation state
    if (location.state?.filter) {
      const newFilter = location.state.filter;
      
      if (newFilter === "total") {
        setFilter("all");
        setActiveTab("pending");
      } else if (newFilter === "completed" || newFilter === "done") {
        setFilter("all"); // Mostra todas as prioridades mas na aba concluídos
        setActiveTab("done");
      } else if (newFilter === "pending") {
        setFilter("all");
        setActiveTab("pending");
      } else {
        // Assume que é um filtro de prioridade
        setFilter(newFilter as any);
        setActiveTab("pending");
      }
    }
  }, [location.state]);

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
      const payload = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority
      };

      if (editingDemand) {
        await api.put(`/demands/${editingDemand.id}`, {
          ...editingDemand,
          ...payload
        });
      } else {
        await api.post("/demands", payload);
      }
      setShowAddModal(false);
      setEditingDemand(null);
      setFormData({ name: "", description: "", priority: 1 });
      fetchDemands();
    } catch (err: any) {
      alert(`Erro no sistema: ` + err.message);
    }
  };

  const handleEdit = (demand: Demand) => {
    setEditingDemand(demand);
    setFormData({ 
      name: demand.name, 
      description: demand.description, 
      priority: demand.priority 
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
    let matchesPriority = true;
    
    if (filter === "high") matchesPriority = d.priority === 2;
    else if (filter === "normal") matchesPriority = d.priority === 1;
    else if (filter === "none") matchesPriority = d.priority === 0;

    return matchesSearch && matchesPriority;
  });

  const pendingDemands = filteredDemands.filter(d => !d.done);
  const doneDemands = filteredDemands.filter(d => !!d.done);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-sans font-black text-slate-900 dark:text-white tracking-tight">TI Demandas</h1>
          <p className="text-slate-500 font-medium">Gestão centralizada de chamados de TI</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingDemand(null);
            setFormData({ name: "", description: "", priority: 1 });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg dark:shadow-none active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Demanda
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {filter !== "all" && (
          <button 
            onClick={() => setFilter("all")}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-tight"
          >
            Filtro Ativo: {filter} <X className="w-3 h-3" />
          </button>
        )}
        <div className="flex-1" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 glass-card dark:bg-slate-900 dark:border-slate-800 p-4 flex-grow w-full md:w-auto">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar chamado..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Filter className="w-4 h-4 self-center text-slate-400" />
             <select 
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                value={filter}
                onChange={(e: any) => setFilter(e.target.value)}
             >
               <option value="all">TODAS PRIORIDADES</option>
               <option value="high">ALTA PRIORIDADE</option>
               <option value="normal">NORMAL</option>
               <option value="none">SEM PRIORIDADE</option>
             </select>
          </div>
          <div className="flex items-center justify-end gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
             <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Visualizando: {(activeTab === "pending" ? pendingDemands : doneDemands).length}</span>
             <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded">Pendentes: {demands.filter(d => !d.done).length}</span>
          </div>
        </div>
      </div>      
      
      <div className="glass-card dark:bg-slate-900 dark:border-slate-800 overflow-hidden border-none shadow-xl">
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "pending" 
                ? "border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-900/10" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            Pendentes ({pendingDemands.length})
          </button>
          <button 
            onClick={() => setActiveTab("done")}
            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "done" 
                ? "border-green-600 text-green-600 bg-green-50/30 dark:bg-green-900/10" 
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            Concluídos ({doneDemands.length})
          </button>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Sincronizando Banco de Dados...</div>
            ) : (activeTab === "pending" ? pendingDemands : doneDemands).length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic">Nenhum chamado encontrado nesta categoria</div>
            ) : (
              (activeTab === "pending" ? pendingDemands : doneDemands).map((demand) => (
                <div 
                  key={demand.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 soft-shadow hover:border-blue-200 dark:hover:border-blue-900 transition-all group flex flex-col md:flex-row md:items-center gap-6"
                >
                  <div className="flex-shrink-0">
                    <button 
                      onClick={() => handleToggleDone(demand)}
                      className={`p-3 rounded-2xl transition-all ${demand.done ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:scale-110 hover:text-blue-500'}`}
                    >
                      {demand.done ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                    </button>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      {demand.priority === 2 ? (
                        <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[9px] font-black px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900 uppercase">Alta Prio</span>
                      ) : demand.priority === 1 ? (
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900 uppercase">Normal</span>
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 text-[9px] font-black px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 uppercase">Sem Prio</span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded leading-none">#{demand.id}</span>
                    </div>
                    <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-100 ${demand.done ? 'line-through opacity-40' : ''}`}>
                      {demand.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-xs text-slate-400 flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         Criado em {demand.created_at ? new Date(demand.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button 
                      onClick={() => setSelectedDemand(demand)}
                      className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleEdit(demand)}
                      className="p-3 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <Edit3 className="w-6 h-6" />
                    </button>
                    
                    {isDeleting === demand.id ? (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                        <button 
                           onClick={() => handleDelete(demand.id)}
                           className="bg-rose-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg hover:bg-rose-700"
                        >
                          EXCLUIR
                        </button>
                        <button 
                           onClick={() => setIsDeleting(null)}
                           className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-2 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsDeleting(demand.id)}
                        className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingDemand ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição do Problema</label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva detalhadamente a situação..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-slate-900 dark:text-white"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-2">
                   <div className="flex flex-col items-center gap-2">
                      <input 
                       type="radio" 
                       id="prio_sem"
                       name="priority"
                       className="w-5 h-5 accent-slate-600 cursor-pointer"
                       checked={formData.priority === 0}
                       onChange={() => setFormData({...formData, priority: 0})}
                      />
                      <label htmlFor="prio_sem" className="text-[10px] font-bold text-slate-500 cursor-pointer text-center uppercase">Sem Prioridade</label>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <input 
                       type="radio" 
                       id="prio_normal"
                       name="priority"
                       className="w-5 h-5 accent-blue-600 cursor-pointer"
                       checked={formData.priority === 1}
                       onChange={() => setFormData({...formData, priority: 1})}
                      />
                      <label htmlFor="prio_normal" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer text-center uppercase">Normal</label>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <input 
                       type="radio" 
                       id="prio_alta"
                       name="priority"
                       className="w-5 h-5 accent-rose-600 cursor-pointer"
                       checked={formData.priority === 2}
                       onChange={() => setFormData({...formData, priority: 2})}
                      />
                      <label htmlFor="prio_alta" className="text-[10px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer text-center uppercase">Alta Prioridade</label>
                   </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg dark:shadow-none active:scale-95"
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
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedDemand.done ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400'}`}>
                          {selectedDemand.done ? 'Concluído' : 'Em Aberto'}
                        </span>
                        {selectedDemand.priority === 2 ? (
                          <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Alta Prioridade</span>
                        ) : selectedDemand.priority === 1 ? (
                          <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Normal</span>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Sem Prioridade</span>
                        )}
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {selectedDemand.name}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium uppercase mt-2">
                        {selectedDemand.created_at 
                          ? `Aberto em ${new Date(selectedDemand.created_at).toLocaleString('pt-BR')}`
                          : 'Data de registro não disponível'
                        }
                      </p>
                    </div>
                    <button onClick={() => setSelectedDemand(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="space-y-6">
                   <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 min-h-[160px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedDemand.description || "Nenhum detalhe adicional fornecido."}
                   </div>

                   <div className="flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white">
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
