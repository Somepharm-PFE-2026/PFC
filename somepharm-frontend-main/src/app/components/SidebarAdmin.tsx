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
  Settings
} from "lucide-react";

export default function SidebarAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarRetracted, setSidebarRetracted, activeModalCount, activeHRRequest } = useUI();
  const [userRole, setUserRole] = React.useState<string | null>(null);

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
    <div className={`fixed left-6 top-6 bottom-6 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 rounded-[3rem] p-6 pt-0 flex flex-col z-50 overflow-hidden transition-all duration-700 ease-in-out
      ${isSidebarRetracted ? "w-28 shadow-none border-gray-100/50" : "w-80 shadow-gray-200/40"}
      ${activeModalCount > 0 ? "blur-[2px] opacity-40 pointer-events-none scale-[0.98]" : "blur-0 opacity-100"}
      ${activeHRRequest ? "opacity-100 scale-100" : ""}
    `}>
      
      {/* BUTTERY SMOOTH BRANDING ENGINE */}
      <div className="relative h-28 flex flex-col items-center justify-center pt-2 mb-4">
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Full Logo - 15% Shorter Scaling */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out px-[8%]
            ${isSidebarRetracted ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-90"}
          `}>
             <img src="/logo.png" alt="SomePharm" className="w-full h-auto object-contain" />
          </div>

          {/* Mini Logo - Cut Version */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out
            ${isSidebarRetracted ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none"}
          `}>
             <div 
               onClick={() => setSidebarRetracted(false)}
               className="w-16 h-16 rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all hover:scale-105"
             >
               <img src="/logo_small.png" alt="SP" className="w-12 h-12 object-contain" />
             </div>
          </div>
        </div>

        {/* PERFECT ACTION TOGGLE */}
        {!isSidebarRetracted && (
          <button 
            onClick={() => setSidebarRetracted(true)}
            className="absolute -right-2 top-8 p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:shadow-lg transition-all z-20 group"
          >
            <ShieldCheck size={16} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-3 relative z-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center rounded-2xl font-black text-sm transition-all duration-300 group
                ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
                ${isActive 
                  ? "bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30 hover:translate-x-1" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-blue-600 hover:translate-x-1"}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 3 : 2} className="shrink-0" />
              {!isSidebarRetracted && (
                <span className="tracking-tight uppercase text-[10px] font-bold tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
        {userRole?.includes("SUPER_ADMIN") && (
          <div className="pt-4 mt-4 border-t border-gray-50">
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-gray-950 transition-all group
                ${isSidebarRetracted ? "justify-center" : ""}`}
            >
              <ShieldCheck size={22} className="group-hover:rotate-12 transition-transform" />
              {!isSidebarRetracted && <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Root Console</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-6 border-t border-gray-100 relative z-10 space-y-2">
        <Link
          href="/hr/profil"
          className={`flex items-center rounded-2xl font-black text-sm transition-all
            ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
            ${pathname === "/hr/profil" ? "bg-gray-50 text-blue-600" : "text-gray-400 hover:text-blue-600"}`}
        >
          <User size={20} className="shrink-0" />
          {!isSidebarRetracted && <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Mon Profil</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center transition-all text-red-400 font-black text-sm hover:bg-red-50 hover:text-red-600 rounded-2xl
            ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isSidebarRetracted && <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}
