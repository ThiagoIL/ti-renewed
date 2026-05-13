import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle, 
  BarChart3, PieChart as PieChartIcon, TrendingUp
} from "lucide-react";

interface Demand {
  id: number;
  name: string;
  description: string;
  done: number;
  priority: number;
  created_at: string;
}

export default function Stats() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

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
  const highPriority = demands.filter(d => d.priority).length;
  const normalPriority = total - highPriority;

  const statusData = [
    { name: 'Concluídas', value: completed, color: '#10b981' },
    { name: 'Pendentes', value: pending, color: '#f59e0b' },
  ];

  const priorityData = [
    { name: 'Alta', value: highPriority, color: '#f43f5e' },
    { name: 'Normal', value: normalPriority, color: '#3b82f6' },
  ];

  // Agrupamento por dia (últimos 7 dias simplificado)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const historyData = last7Days.map(date => {
    const count = demands.filter(d => d.created_at.startsWith(date)).length;
    return { date: date.split('-').slice(1).reverse().join('/'), count };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel Executivo</h1>
          <p className="text-slate-500 font-medium">Indicadores de desempenho e fluxo de trabalho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          label="Total de Chamados" 
          value={total} 
          icon={TrendingUp} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="Concluídos" 
          value={completed} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
          subtitle={`${((completed/total)*100 || 0).toFixed(1)}% de eficácia`}
        />
        <StatCard 
          label="Pendentes" 
          value={pending} 
          icon={Clock} 
          color="bg-amber-500" 
          subtitle="Aguardando ação"
        />
        <StatCard 
          label="Alta Prioridade" 
          value={highPriority} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          subtitle="Atenção necessária"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Status */}
        <div className="glass-card p-8 group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">Distribuição por Status</h2>
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Prioridade */}
        <div className="glass-card p-8 group hover:border-rose-200 transition-colors">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">Carga por Prioridade</h2>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
        <div className="glass-card p-8 lg:col-span-2 group hover:border-slate-300 transition-colors">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800">Novas Demandas (Últimos 7 dias)</h2>
              </div>
           </div>
           <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                   <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group hover:translate-y-[-4px] transition-all">
      <div className={`${color} absolute top-0 left-0 w-1 h-full opacity-60`}></div>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h3 className="text-3xl font-black text-slate-900">{value}</h3>
          {subtitle && <p className="text-[10px] font-medium text-slate-400">{subtitle}</p>}
        </div>
        <div className={`${color} bg-opacity-10 p-2 rounded-xl`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}
