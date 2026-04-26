"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "../../context/UIContext";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  Folder, 
  User, 
  LogOut, 
  QrCode,
  Megaphone,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SidebarManager() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarRetracted, setSidebarRetracted, activeModalCount } = useUI();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSecurityManager, setIsSecurityManager] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const dept: string = payload.departement || "";
        const poste: string = payload.poste || "";
        setIsSecurityManager(
          dept.toUpperCase() === "SECURITE" ||
          poste.toUpperCase().startsWith("RESPONSABLE DE SECURITE")
        );
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
  }, []);

    useEffect(() => {
      const checkResetStatus = async () => {
          const token = localStorage.getItem("token");
          if (!token) return;
          try {
              const res = await fetch("http://localhost:8080/api/admin/tickets/my-status", {
                  headers: { "Authorization": `Bearer ${token}` },
                  cache: "no-store"
              });
              if (res.ok) {
                  const data = await res.json();
                  if (data.status === "ENVOYÉ" || data.status === "EN_ATTENTE_EMPLOYÉ") {
                      const isOnPasswordPage = window.location.pathname.includes("change-password") || 
                                             window.location.href.includes("change-password");
                      if (!isOnPasswordPage) {
                          localStorage.clear();
                          window.location.href = "/login";
                      }
                  }
              }
          } catch (err) { console.error(err); }
      };
      const interval = setInterval(checkResetStatus, 30000);
      return () => clearInterval(interval);
    }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/annonces/unread-count", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) setUnreadCount(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const teamItems: Array<{ name: string; path: string; icon: any; badge?: number }> = [
    { name: "Tableau de Bord", path: "/manager/dashboard", icon: LayoutDashboard },
    { name: "Mon Équipe", path: "/manager/mon-equipe", icon: Users },
    { name: "Gestion des Demandes", path: "/manager/gestion-demandes", icon: CheckSquare },
  ];

  if (isSecurityManager) {
    teamItems.push({ name: "Contrôle d'Accès", path: "/employee/security-scanner", icon: QrCode, badge: 0 });
  }

  const personalItems = [
    { name: "Mes Demandes", path: "/manager/demandes", icon: FileText },
    { name: "Communication", path: "/manager/communication", icon: Megaphone, badge: unreadCount },
    { name: "Bons de Sortie", path: "/manager/bons-de-sortie", icon: QrCode },
    { name: "Mes Documents", path: "/manager/documents", icon: Folder },
    { name: "Mon Profil", path: "/manager/profil", icon: User },
    { name: "Paramètres", path: "/manager/settings", icon: Settings },
  ];

  return (
    <div className={`fixed left-6 top-6 bottom-6 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 rounded-[3rem] p-6 pt-0 flex flex-col z-50 transition-all duration-500 ease-in-out
      ${isSidebarRetracted ? "w-28 shadow-none border-gray-100/50" : "w-80 shadow-gray-200/40"}
      ${activeModalCount > 0 ? "blur-[2px] opacity-40 pointer-events-none scale-[0.98]" : "blur-0 opacity-100"}
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
            className="absolute -right-2 top-8 p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-amber-600 hover:shadow-lg transition-all z-20 group"
          >
            <QrCode size={16} className="group-hover:rotate-12 transition-transform opacity-40" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
        <div>
          {!isSidebarRetracted && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-4 animate-in fade-in duration-500">Pilotage d'Équipe</p>}
          <nav className="space-y-2">
            {teamItems.map((item:any) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center rounded-2xl font-black text-sm transition-all duration-300 relative
                    ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
                    ${isActive 
                      ? "bg-amber-500 text-white shadow-xl shadow-amber-100" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-amber-600"}`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} className="shrink-0" />
                  {!isSidebarRetracted && (
                    <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="tracking-tight whitespace-nowrap">{item.name}</span>
                      {item.badge > 0 && (
                        <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isSidebarRetracted && item.badge > 0 && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-amber-600 rounded-full border-2 border-white shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
           {!isSidebarRetracted && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-4 animate-in fade-in duration-500">Espace Personnel</p>}
          <nav className="space-y-2">
            {personalItems.map((item:any) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center rounded-2xl font-black text-sm transition-all duration-300 relative
                    ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-100" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-blue-600"}`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} className="shrink-0" />
                  {!isSidebarRetracted && (
                    <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="tracking-tight whitespace-nowrap">{item.name}</span>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isSidebarRetracted && item.badge > 0 && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center text-red-400 font-black text-sm hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all
            ${isSidebarRetracted ? "justify-center p-4" : "gap-4 px-6 py-4"}`}
        >
          <LogOut size={20} className="shrink-0" />
          {!isSidebarRetracted && <span className="whitespace-nowrap">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}
