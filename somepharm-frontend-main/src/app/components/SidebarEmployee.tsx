"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "../../context/UIContext";
import { 
  LayoutDashboard, 
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

export default function SidebarEmployee() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarRetracted, setSidebarRetracted, activeModalCount } = useUI();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        let role = payload.role;
        if (role && role.startsWith("ROLE_")) {
            role = role.replace("ROLE_", "");
        }
        setUserRole(role);
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

  const menuItems: Array<{ name: string, path: string, icon: any, badge?: number }> = [
    { name: "Tableau de Bord", path: "/employee/dashboard", icon: LayoutDashboard },
    { name: "Mes Demandes", path: "/employee/demandes", icon: FileText },
    { name: "Communication", path: "/employee/communication", icon: Megaphone, badge: unreadCount },
    { name: "Bons de Sortie", path: "/employee/bons-de-sortie", icon: QrCode },
    { name: "Mes Documents", path: "/employee/documents", icon: Folder },
    { name: "Mon Profil", path: "/employee/profil", icon: User },
    { name: "Paramètres", path: "/employee/settings", icon: Settings },
  ];

  if (userRole === "SECURITY_AGENTS") {
    menuItems.push({ name: "Contrôle d'Accès", path: "/employee/security-scanner", icon: QrCode, badge: 0 } as any);
  }

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
              hidden lg:flex
            `}>
               <div 
                 onClick={() => setSidebarRetracted(false)}
                 className="w-16 h-16 rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all hover:scale-105"
               >
                 <img src="/logo_small.png" alt="SP" className="w-12 h-12 object-contain" />
               </div>
            </div>
          </div>

          {/* Action Toggle (Desktop Only) */}
          {!isSidebarRetracted && (
            <button 
              onClick={() => setSidebarRetracted(true)}
              className="hidden lg:flex absolute -right-2 top-8 p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 hover:shadow-lg transition-all z-20 group"
            >
              <User size={16} className="group-hover:rotate-12 transition-transform opacity-40" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 lg:space-y-3 overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center rounded-2xl font-semibold text-sm transition-all duration-300 group
                  ${isSidebarRetracted ? "lg:justify-center p-3 lg:p-4" : "gap-4 px-5 lg:px-6 py-3 lg:py-4"}
                  ${isActive 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                    : "text-slate-500 hover:bg-teal-50 hover:text-teal-700"}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <div className={`flex-1 flex items-center justify-between ${isSidebarRetracted ? 'lg:hidden' : ''}`}>
                  <span className="tracking-wide whitespace-nowrap">{item.name}</span>
                  {(item.badge || 0) > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${isActive ? 'bg-white text-teal-700' : 'bg-rose-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {/* Red dot for retracted state */}
                {isSidebarRetracted && (item.badge || 0) > 0 && (
                  <div className="hidden lg:block absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 lg:pt-6 mt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-rose-500 font-semibold text-sm hover:bg-rose-50 hover:text-rose-700 rounded-2xl transition-all
              ${isSidebarRetracted ? "lg:justify-center p-3 lg:p-4" : "gap-4 px-5 lg:px-6 py-3 lg:py-4"}`}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`${isSidebarRetracted ? 'lg:hidden' : ''} whitespace-nowrap`}>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}
