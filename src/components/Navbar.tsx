import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { LogOut, User, ClipboardList, Users, History, ShieldAlert } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Demandas", icon: ClipboardList },
    ...(user?.role === "master" ? [
      { path: "/admin/usuarios", label: "Usuários", icon: Users },
      { path: "/admin/auditoria", label: "Auditoria", icon: ShieldAlert },
    ] : []),
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-10">
            <Link to="/" className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <ClipboardList className="w-5 h-5" />
              </div>
              TI Demandas
            </Link>
            
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    location.pathname === item.path
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/perfil" 
              className={`flex items-center gap-3 px-4 py-2 text-xs uppercase font-bold rounded-xl transition-all border ${
                location.pathname === '/perfil' 
                  ? 'border-blue-200 bg-blue-50 text-blue-700' 
                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <div className="flex flex-col leading-tight">
                 <span className="font-black text-[11px]">{user?.name}</span>
                 <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">{user?.role}</span>
              </div>
            </Link>
            
            <button
              onClick={logout}
              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
