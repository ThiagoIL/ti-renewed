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
          <h1 className="text-3xl font-mono font-black uppercase tracking-tighter">Histórico de Auditoria</h1>
          <p className="text-sm font-mono opacity-60 italic">Linha do tempo de todas as ações sensíveis no sistema</p>
        </div>

        <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono text-[10px] flex items-center gap-2 border-l-4 border-red-500">
           <Terminal className="w-4 h-4" />
           REGISTRO CRIPTOGRÁFICO DE OPERAÇÕES DO BANCO DE DADOS
        </div>

        <div className="bg-white border border-[#141414] overflow-hidden">
           <table className="w-full font-mono text-left">
              <thead className="bg-gray-100 text-[10px] uppercase font-bold border-b border-[#141414]">
                 <tr>
                    <th className="p-4">DATA/HORA</th>
                    <th className="p-4">USUÁRIO</th>
                    <th className="p-4">OPERAÇÃO</th>
                    <th className="p-4">DESTINO</th>
                    <th className="p-4">DETALHES</th>
                 </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                 {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-yellow-50 transition-colors">
                       <td className="p-4 opacity-40 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                       </td>
                       <td className="p-4 font-bold border-r border-[#141414]/5">
                          {log.user_name || "SISTEMA"}
                       </td>
                       <td className="p-4">
                          <span className={`px-2 py-0.5 font-bold uppercase ${getActionColor(log.action)}`}>
                             {log.action}
                          </span>
                       </td>
                       <td className="p-4 italic opacity-60">
                          {log.target_type} ({log.target_id})
                       </td>
                       <td className="p-4 leading-relaxed font-bold tracking-tight">
                          {log.details}
                       </td>
                    </tr>
                 ))}
                 {logs.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-12 text-center opacity-30 italic">Nenhum registro de auditoria encontrado.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
    </div>
  );
}
