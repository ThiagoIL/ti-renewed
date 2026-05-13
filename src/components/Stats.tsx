import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle, 
  BarChart3, PieChart as PieChartIcon, TrendingUp
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

export default function Stats() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemands();
  }, []);

  const handleCardClick = (filter: string) => {
    navigate("/demandas", { state: { filter } });
  };

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

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
        Gerando indicadores...
      </div>
    );
  }

  const total = demands.length;
  const completed = demands.filter(d => d.done).length;
  const pending = total - completed;
  const highPriority = demands.filter(d => d.priority === 2).length;
  const normalPriority = demands.filter(d => d.priority === 1).length;
  const noPriority = total - highPriority - normalPriority;

  const statusData = [
    { name: 'Concluídas', value: completed, color: '#10b981' },
    { name: 'Pendentes', value: pending, color: '#f59e0b' },
  ];

  const priorityData = [
    { name: 'Alta', value: highPriority, color: '#f43f5e' },
    { name: 'Normal', value: normalPriority, color: '#3b82f6' },
    { name: 'Sem Prio', value: noPriority, color: '#94a3b8' },
  ];

  // Agrupamento por dia (últimos 7 dias simplificado)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const historyData = last7Days.map(date => {
    const count = demands.filter(d => d.created_at && d.created_at.toString().startsWith(date)).length;
    return { date: date.split('-').slice(1).reverse().join('/'), count };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel Executivo</h1>
          <p className="text-slate-500 font-medium">Clique nos cartões para explorar os detalhes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard 
          label="Total" 
          value={total} 
          icon={TrendingUp} 
          color="bg-blue-600" 
          onClick={() => handleCardClick("total")}
        />
        <StatCard 
          label="Concluídos" 
          value={completed} 
          icon={CheckCircle2} 
          color="bg-emerald-600" 
          onClick={() => handleCardClick("done")}
          subtitle={`${((completed/total)*100 || 0).toFixed(0)}%`}
        />
        <StatCard 
          label="Pendentes" 
          value={pending} 
          icon={Clock} 
          color="bg-amber-600" 
          onClick={() => handleCardClick("pending")}
        />
        <StatCard 
          label="Alta Prio" 
          value={highPriority} 
          icon={AlertTriangle} 
          color="bg-rose-600" 
          onClick={() => handleCardClick("high")}
        />
        <StatCard 
          label="Normal" 
          value={normalPriority} 
          icon={BarChart3} 
          color="bg-sky-600" 
          onClick={() => handleCardClick("normal")}
        />
        <StatCard 
          label="Sem Prio" 
          value={noPriority} 
          icon={LayoutDashboard} 
          color="bg-slate-500" 
          onClick={() => handleCardClick("none")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Status */}
        <div className="glass-card dark:bg-slate-900 dark:border-slate-800 p-8 group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Distribuição por Status</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-colors-slate-900)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Prioridade */}
        <div className="glass-card dark:bg-slate-900 dark:border-slate-800 p-8 group hover:border-rose-200 transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Carga por Prioridade</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-colors-slate-900)' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Tendência */}
        <div className="glass-card dark:bg-slate-900 dark:border-slate-800 p-8 lg:col-span-2 group hover:border-slate-300 transition-colors">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Novas Demandas (Últimos 7 dias)</h2>
              </div>
           </div>
           <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                   <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-colors-slate-900)' }}
                      itemStyle={{ color: '#fff' }}
                   />
                   <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtitle, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`glass-card dark:bg-slate-900 dark:border-slate-800 p-6 relative overflow-hidden group hover:translate-y-[-4px] transition-all text-left w-full`}
    >
      <div className={`${color} absolute top-0 left-0 w-1 h-full opacity-60`}></div>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h3>
          {subtitle && <p className="text-[10px] font-medium text-slate-400">{subtitle}</p>}
        </div>
        <div className={`${color} bg-opacity-10 p-2 rounded-xl group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </button>
  );
}
