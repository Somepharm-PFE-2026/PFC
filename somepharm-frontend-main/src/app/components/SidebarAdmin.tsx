"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "../../context/UIContext";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  CalendarRange, 
  User,
  LogOut,
  Megaphone,
  Clock,
  Lock,
  Cog,
  Settings,
  Menu,
  X
} from "lucide-react";

export default function SidebarAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarRetracted, setSidebarRetracted, activeModalCount, activeHRRequest } = useUI();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
  }, []);

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const canAccessSettings = userRole === "ROLE_HR_MANAGER" || userRole === "ROLE_RH_ADMIN";

  const menuItems = [
    { name: "Command Center", path: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Collaborateurs", path: "/hr/collaborateurs", icon: Users },
    { name: "Validation & Demandes Admin", path: "/hr/validation-rh", icon: ShieldCheck },
    { name: "Gestion des Congés", path: "/hr/gestion-conges", icon: CalendarRange },
    { name: "Temps & Présence", path: "/hr/temps-presence", icon: Clock },
    { name: "Communication", path: "/hr/communication", icon: Megaphone },
    { name: "Paie & Documents", path: "/hr/paie-documents", icon: Lock },
    ...(canAccessSettings ? [{ name: "Paramètrage RH", path: "/hr/settings", icon: Cog }] : []),
    { name: "Paramètres Compte", path: "/hr/settings-account", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <img src="/logo.png" alt="SomePharm" className="h-8 object-contain brightness-0 invert drop-shadow-sm" />
        </div>
        <div className="flex items-center gap-2">
           <User size={20} className="text-indigo-400" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`fixed top-0 bottom-0 left-0 lg:top-6 lg:bottom-6 lg:left-6 bg-slate-950/90 backdrop-blur-2xl text-slate-100 shadow-2xl lg:shadow-[0_12px_40px_rgba(99,102,241,0.1)] border-r lg:border border-white/10 lg:rounded-[3rem] p-6 pt-6 flex flex-col z-50 overflow-hidden transition-all duration-700 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isSidebarRetracted ? "lg:w-28 shadow-none border-white/10" : "w-[280px] lg:w-80"}
        ${activeModalCount > 0 ? "lg:blur-[2px] lg:opacity-40 lg:pointer-events-none lg:scale-[0.98]" : "blur-0 opacity-100"}
        ${activeHRRequest ? "opacity-100 scale-100" : ""}
      `}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors z-50"
        >
          <X size={20} />
        </button>
      
      {/* BUTTERY SMOOTH BRANDING ENGINE */}
      <div className="relative h-28 flex flex-col items-center justify-center pt-2 mb-4">
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Full Logo - 15% Shorter Scaling */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out px-[8%]
            ${isSidebarRetracted ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-90"}
          `}>
             <img src="/logo.png" alt="SomePharm" className="w-full h-auto object-contain brightness-0 invert drop-shadow-sm" />
          </div>

          {/* Mini Logo - Cut Version */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out
            ${isSidebarRetracted ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"}
          `}>
             <div 
               onClick={() => setSidebarRetracted(false)}
               className="w-16 h-16 rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all hover:scale-105"
             >
               <img src="/logo_small.png" alt="SP" className="w-12 h-12 object-contain brightness-0 invert drop-shadow-sm" />
             </div>
          </div>
        </div>

        {/* PERFECT ACTION TOGGLE */}
        {!isSidebarRetracted && (
          <button 
            onClick={() => setSidebarRetracted(true)}
            className="absolute -right-2 top-8 p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 hover:shadow-lg transition-all z-20 group"
          >
            <ShieldCheck size={16} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center rounded-2xl font-bold text-sm transition-all duration-300 relative group
                ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
                ${isActive 
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5 hover:translate-x-1" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              {!isSidebarRetracted && (
                <span className="tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
        {userRole?.includes("SUPER_ADMIN") && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-400 shadow-lg shadow-red-500/5 hover:bg-red-600 hover:text-white transition-all group
                ${isSidebarRetracted ? "justify-center" : ""}`}
            >
              <ShieldCheck size={22} className="group-hover:rotate-12 transition-transform" />
              {!isSidebarRetracted && <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Root Console</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-6 mt-2 border-t border-white/10 shrink-0">
        <Link
          href="/hr/profil"
          className={`flex items-center rounded-2xl font-bold text-sm transition-all duration-300 relative group
            ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
            ${pathname === "/hr/profil" 
              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5 hover:translate-x-1" 
              : "text-slate-400 hover:bg-white/10 hover:text-white hover:translate-x-1"}`}
        >
          <User size={20} className="shrink-0" />
          {!isSidebarRetracted && <span className="tracking-tight whitespace-nowrap">Mon Profil</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center text-rose-400 font-bold text-sm hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl transition-all
            ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isSidebarRetracted && <span className="whitespace-nowrap">Déconnexion</span>}
        </button>
      </div>
    </div>
  </>
);
}
