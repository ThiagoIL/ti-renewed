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
    <nav className="bg-white border-b border-[#141414]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-mono font-black italic tracking-tighter uppercase">
              TI.CORE
            </Link>
            
            <div className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all ${
                    location.pathname === item.path
                      ? "bg-[#141414] text-[#E4E3E0]"
                      : "hover:bg-gray-100"
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
              className={`flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase bg-gray-100 border border-transparent hover:border-[#141414] transition-all ${
                location.pathname === '/perfil' ? 'border-[#141414] bg-white' : ''
              }`}
            >
              <User className="w-4 h-4" />
              <div className="flex flex-col leading-none">
                 <span className="font-bold">{user?.name}</span>
                 <span className="text-[9px] opacity-60">{user?.role}</span>
              </div>
            </Link>
            
            <button
              onClick={logout}
              className="p-2 hover:bg-red-100 text-red-600 transition-colors"
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
