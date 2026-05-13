import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Activity, Terminal } from "lucide-react";

interface Log {
  id: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id: number;
  details: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.get("/audit");
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-green-100 text-green-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Atividade</h1>
          <p className="text-slate-500 font-medium">Log de auditoria e operações de sistema</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 text-white text-[11px] font-bold flex items-center gap-3 border-l-4 border-blue-500 shadow-xl overflow-hidden">
           <Terminal className="w-4 h-4 text-blue-400" />
           <span className="uppercase tracking-widest opacity-80">Monitoramento em Tempo Real - Banco de Dados Operacional</span>
        </div>

        <div className="glass-card overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <tr>
                      <th className="p-4">DATA/HORA</th>
                      <th className="p-4">EXECUTOR</th>
                      <th className="p-4">OPERAÇÃO</th>
                      <th className="p-4">MÓDULO</th>
                      <th className="p-4">DETALHES DA AÇÃO</th>
                   </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                   {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                         <td className="p-4 text-slate-400 font-medium whitespace-nowrap text-[11px]">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                         </td>
                         <td className="p-4 font-bold text-slate-700">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                               {log.user_name || "SISTEMA"}
                            </div>
                         </td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${getActionColor(log.action)}`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="p-4 font-mono text-[10px] text-slate-400">
                            {log.target_type} <span className="opacity-40">#{log.target_id}</span>
                         </td>
                         <td className="p-4 font-bold text-slate-600 text-xs">
                            {log.details}
                         </td>
                      </tr>
                   ))}
                   {logs.length === 0 && (
                     <tr>
                       <td colSpan={5} className="p-12 text-center text-slate-400 font-medium italic">Nenhum evento registrado no momento.</td>
                     </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
    </div>
  );
}
