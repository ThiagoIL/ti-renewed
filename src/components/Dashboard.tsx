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
      await api.post("/demands", formData);
      setShowAddModal(false);
      setFormData({ name: "", description: "", priority: false });
      fetchDemands();
    } catch (err) {
      alert("Erro ao criar demanda");
    }
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
          <h1 className="text-3xl font-mono font-black uppercase tracking-tighter">Fluxo de Demandas</h1>
          <p className="text-sm font-mono opacity-60 italic">Gestão de chamados e solicitações do TI</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 font-mono font-bold uppercase hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_#141414] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <Plus className="w-5 h-5" />
          Nova Demanda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-[#141414] p-4 font-mono text-sm">
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text" 
            placeholder="BUSCAR TAREFA..."
            className="w-full pl-10 pr-4 py-2 border-b border-[#141414]/20 focus:border-[#141414] outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Filter className="w-4 h-4 self-center opacity-30" />
           <select 
              className="flex-1 bg-transparent border-b border-[#141414]/20 outline-none uppercase text-xs font-bold"
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
           >
             <option value="all">TODAS</option>
             <option value="pending">PENDENTES</option>
             <option value="done">CONCLUÍDAS</option>
           </select>
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] opacity-40">
           <span>TOTAL: {filteredDemands.length}</span>
           <span>|</span>
           <span>PENDENTES: {demands.filter(d => !d.done).length}</span>
        </div>
      </div>

      <div className="border border-[#141414] bg-white divide-y divide-[#141414]">
        <div className="hidden md:grid grid-cols-12 bg-gray-100 p-4 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <div className="col-span-1">STATUS</div>
          <div className="col-span-6">DESCRIÇÃO DA DEMANDA</div>
          <div className="col-span-2">PRIORIDADE</div>
          <div className="col-span-3 text-right">AÇÕES</div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono opacity-50 uppercase animate-pulse">Sincronizando Banco de Dados...</div>
        ) : filteredDemands.length === 0 ? (
          <div className="p-8 text-center font-mono opacity-50 uppercase">Nenhuma demanda encontrada</div>
        ) : (
          filteredDemands.map((demand) => (
            <div key={demand.id} className="grid grid-cols-1 md:grid-cols-12 p-4 items-center gap-4 hover:bg-yellow-50 transition-colors group">
              <div className="col-span-1">
                <button 
                  onClick={() => handleToggleDone(demand)}
                  className={`p-2 transition-colors ${demand.done ? 'text-green-600' : 'text-gray-300 hover:text-[#141414]'}`}
                >
                  {demand.done ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
              </div>
              
              <div className="col-span-6">
                <div className={`font-mono font-bold uppercase tracking-tight ${demand.done ? 'line-through opacity-40' : ''}`}>
                  {demand.name}
                </div>
                <div className="text-[10px] font-mono opacity-50 uppercase">
                  ID: {demand.id} | CRIADO EM: {new Date(demand.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="col-span-2">
                {demand.priority ? (
                  <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-1 uppercase border border-red-200">
                    ALTA PRIORIDADE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono opacity-40 uppercase">Normal</span>
                )}
              </div>

              <div className="col-span-3">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setSelectedDemand(demand)}
                    className="p-2 border border-[#141414]/10 hover:bg-[#141414] hover:text-white transition-all group/btn"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 border border-[#141414]/10 hover:bg-[#141414] hover:text-white transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  {isDeleting === demand.id ? (
                    <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                      <button 
                         onClick={() => handleDelete(demand.id)}
                         className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase"
                      >
                        CONFIRMAR
                      </button>
                      <button 
                         onClick={() => setIsDeleting(null)}
                         className="bg-gray-200 text-[#141414] text-[10px] font-bold px-2 py-1 uppercase"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsDeleting(demand.id)}
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ADICIONAR */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white border-2 border-[#141414] p-8 shadow-[12px_12px_0px_0px_#141414]"
            >
              <h2 className="text-2xl font-mono font-black uppercase mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Registrar Demanda
              </h2>
              <form onSubmit={handleAdd} className="space-y-4 font-mono">
                <div>
                  <label className="block text-[10px] uppercase opacity-50 mb-1">Título da Tarefa</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border-b-2 border-[#141414] py-2 focus:bg-yellow-50 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase opacity-50 mb-1">Descrição Detalhada</label>
                  <textarea 
                    rows={4}
                    className="w-full border-2 border-[#141414] p-2 focus:bg-yellow-50 outline-none resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2">
                   <input 
                    type="checkbox" 
                    id="prio"
                    className="w-4 h-4 accent-[#141414]"
                    checked={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.checked})}
                   />
                   <label htmlFor="prio" className="text-xs uppercase font-bold cursor-pointer">Alta Prioridade?</label>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border-2 border-[#141414] py-3 text-xs font-bold uppercase transition-colors hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 text-xs font-bold uppercase transition-opacity hover:opacity-90 shadow-[4px_4px_0px_0px_#141414]"
                  >
                    Salvar Demanda
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
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white border border-[#141414] p-1 shadow-[16px_16px_0px_0px_#141414]"
            >
              <div className="border border-[#141414] p-8">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-3xl font-mono font-black uppercase tracking-tighter leading-none mb-1">
                        {selectedDemand.name}
                      </h2>
                      <p className="text-[10px] font-mono opacity-50 uppercase italic">
                        REQUISITADO EM {new Date(selectedDemand.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => setSelectedDemand(null)} className="p-2 border border-[#141414] hover:bg-red-100 transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="mb-8">
                   <div className="text-[10px] font-bold uppercase opacity-30 mb-2 font-mono">Descrição do Chamado:</div>
                   <div className="bg-gray-50 border border-dashed border-[#141414]/20 p-6 font-mono text-sm leading-relaxed min-h-[150px]">
                      {selectedDemand.description || "Nenhuma descrição fornecida."}
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="border border-[#141414]/10 p-3 bg-gray-50">
                       <div className="opacity-40 uppercase">STATUS ATUAL</div>
                       <div className="font-bold uppercase flex items-center gap-2 mt-1">
                          {selectedDemand.done ? (
                            <><CheckCircle className="w-3 h-3 text-green-600" /> CONCLUÍDO</>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-orange-500" /> PENDENTE</>
                          )}
                       </div>
                    </div>
                    <div className="border border-[#141414]/10 p-3 bg-gray-50">
                       <div className="opacity-40 uppercase">PROTOCOLO</div>
                       <div className="font-bold uppercase mt-1">#{selectedDemand.id.toString().padStart(6, '0')}</div>
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
