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
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SidebarManager() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarRetracted, setSidebarRetracted, activeModalCount } = useUI();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSecurityManager, setIsSecurityManager] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  // Close mobile sidebar when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const teamItems: Array<{ name: string; path: string; icon: any; badge?: number }> = [
    { name: "Tableau de Bord", path: "/manager/dashboard", icon: LayoutDashboard },
    { name: "Mon Équipe", path: "/manager/mon-equipe", icon: Users },
    { name: "Gestion des Demandes", path: "/manager/gestion-demandes", icon: CheckSquare },
  ];

  if (isSecurityManager) {
    teamItems.push({ name: "Contrôle d'Accès", path: "/manager/security-scanner", icon: QrCode, badge: 0 });
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
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <img src="/logo.png" alt="SomePharm" className="h-8 object-contain" />
        </div>
        <div className="flex items-center gap-2">
           <User size={20} className="text-slate-400" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed top-0 bottom-0 left-0 lg:top-6 lg:bottom-6 lg:left-6 bg-white lg:bg-white/95 lg:backdrop-blur-md shadow-2xl lg:shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-r lg:border border-slate-100 lg:rounded-[3rem] p-6 pt-6 flex flex-col z-50 transition-all duration-500 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isSidebarRetracted ? "lg:w-28 shadow-none border-slate-100/50" : "w-[280px] lg:w-80 shadow-slate-200/40"}
        ${activeModalCount > 0 ? "lg:blur-[2px] lg:opacity-40 lg:pointer-events-none lg:scale-[0.98]" : "blur-0 opacity-100"}
      `}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors z-50"
        >
          <X size={20} />
        </button>

        {/* Branding Engine */}
        <div className="relative h-24 lg:h-28 flex flex-col items-center justify-center pt-2 mb-6 lg:mb-4 shrink-0">
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Full Logo */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out px-[8%]
              ${isSidebarRetracted ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-90"}
            `}>
               <img src="/logo.png" alt="SomePharm" className="w-full h-auto object-contain" />
            </div>

            {/* Mini Logo */}
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

          {/* Desktop Retract Toggle */}
          {!isSidebarRetracted && (
            <button 
              onClick={() => setSidebarRetracted(true)}
              className="hidden lg:block absolute -right-2 top-8 p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 hover:shadow-lg transition-all z-20 group"
            >
              <QrCode size={16} className="group-hover:rotate-12 transition-transform opacity-40" />
            </button>
          )}
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
          
          <div>
            {(!isSidebarRetracted || isMobileOpen) && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-4 animate-in fade-in duration-500">Pilotage d'Équipe</p>
            )}
            <nav className="space-y-2">
              {teamItems.map((item:any) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center rounded-2xl font-bold text-sm transition-all duration-300 relative group
                      ${(isSidebarRetracted && !isMobileOpen) ? "justify-center p-4" : "gap-4 px-6 py-4"}
                      ${isActive 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                        : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"}`}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                    {(!isSidebarRetracted || isMobileOpen) && (
                      <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="tracking-tight whitespace-nowrap">{item.name}</span>
                        {item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {(isSidebarRetracted && !isMobileOpen) && item.badge > 0 && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
             {(!isSidebarRetracted || isMobileOpen) && (
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-4 animate-in fade-in duration-500">Espace Personnel</p>
             )}
            <nav className="space-y-2">
              {personalItems.map((item:any) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center rounded-2xl font-bold text-sm transition-all duration-300 relative group
                      ${(isSidebarRetracted && !isMobileOpen) ? "justify-center p-4" : "gap-4 px-6 py-4"}
                      ${isActive 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                        : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"}`}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                    {(!isSidebarRetracted || isMobileOpen) && (
                      <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="tracking-tight whitespace-nowrap">{item.name}</span>
                        {item.badge > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {(isSidebarRetracted && !isMobileOpen) && item.badge > 0 && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-rose-500 font-bold text-sm hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all
              ${(isSidebarRetracted && !isMobileOpen) ? "justify-center p-4" : "gap-4 px-6 py-4"}`}
          >
            <LogOut size={20} className="shrink-0" />
            {(!isSidebarRetracted || isMobileOpen) && <span className="whitespace-nowrap">Déconnexion</span>}
          </button>
        </div>
      </div>
    </>
  );
}
