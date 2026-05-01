"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    ShieldCheck, UserCheck, Key, Smartphone, 
    Ticket, UserSearch, FileText, LogIn, 
    Mail, QrCode, FileType, Activity, 
    Database, LogOut, LayoutDashboard,
    Hexagon, Zap, Cpu, Terminal, Users
} from "lucide-react";

export default function SidebarSuperAdmin() {
    const pathname = usePathname();

    const modules = [
        {
            title: "🔐 Activation & Accès",
            items: [
                { name: "1.1 Activation des Profils", path: "/admin/activation", icon: UserCheck, color: "text-red-500" },
                { name: "1.2 Monitoring des Passwords", path: "/admin/monitoring", icon: Key, color: "text-orange-500" },
            ]
        },
        {
            title: "👤 Identité & Support",
            items: [
                { name: "2.1 Gestion Collaborateurs", path: "/admin/collaborateurs", icon: Users, color: "text-blue-600" },

                { name: "2.2 Tickets Reset Password", path: "/admin/tickets", icon: Ticket, color: "text-purple-500" },
            ]
        },
        {
            title: "📓 La Boîte Noire",
            items: [
                { name: "3.1 Audit Trail complet", path: "/admin/audit", icon: FileText, color: "text-emerald-500" },
            ]
        },
        {
            title: "⚙️ Configuration",
            items: [
                { name: "4.1 Service Mail (SMTP)", path: "/admin/config-mail", icon: Mail, color: "text-pink-500" },
                { name: "4.2 Paramètres QR Code", path: "/admin/config-qr", icon: QrCode, color: "text-yellow-500" },
                { name: "4.3 Templates PDF", path: "/admin/config-pdf", icon: FileType, color: "text-sky-500" },
            ]
        },
        {
            title: "📊 Infrastructure",
            items: [
                { name: "5.1 État Services", path: "/admin/health", icon: Activity, color: "text-rose-500" },
                { name: "5.2 Backup & Storage", path: "/admin/storage", icon: Database, color: "text-violet-500" },
            ]
        }
    ];

    return (
        <aside className="w-80 h-screen bg-[#050505] text-gray-400 flex flex-col sticky top-0 overflow-y-auto no-scrollbar border-r border-white/[0.03] shadow-[25px_0_50px_-20px_rgba(0,0,0,0.8)] z-50">
            {/* --- TOP GLOW EFFECT --- */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-600/10 to-transparent pointer-events-none" />

            {/* --- LOGO / BRAND --- */}
            <div className="p-12 relative">
                <div className="flex items-center gap-5 group cursor-default">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-1000" />
                        <div className="w-14 h-14 bg-gradient-to-tr from-red-600 to-red-950 rounded-[1.25rem] flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] relative border border-white/10 rotate-3 group-hover:rotate-0 transition-all duration-700">
                            <ShieldCheck size={32} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Some<span className="text-red-600">Admin</span></h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1.5 opacity-60">System Root</p>
                    </div>
                </div>
            </div>

            {/* --- STATUS BADGE --- */}
            <div className="px-10 mb-10">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex items-center gap-4 group hover:border-red-600/30 transition-all">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Core Engine</p>
                        <p className="text-xs font-black text-gray-200 tracking-tight">Active & Synchronized</p>
                    </div>
                    <Zap size={14} className="text-yellow-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* --- NAVIGATION --- */}
            <nav className="flex-1 px-8 space-y-12 pb-16">
                {/* COCKPIT LINK */}
                <div className="space-y-3">
                    <Link 
                        href="/admin/dashboard"
                        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 ${
                            pathname === "/admin/dashboard" 
                                ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] scale-[1.05]" 
                                : "hover:bg-white/5 hover:text-white"
                        }`}
                    >
                        <LayoutDashboard size={20} className={pathname === "/admin/dashboard" ? "text-red-600" : "text-gray-500 group-hover:text-red-600"} />
                        <span className="text-[13px] font-black uppercase tracking-widest italic">Le Cockpit</span>
                    </Link>
                </div>

                {modules.map((module, idx) => (
                    <div key={idx} className="space-y-5">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 bg-red-600/40 rounded-full" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic">
                                {module.title}
                            </h2>
                        </div>
                        
                        <div className="space-y-1">
                            {module.items.map((item, i) => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={i}
                                        href={item.path}
                                        className={`group flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-500 relative overflow-hidden ${
                                            isActive 
                                                ? "bg-red-600 text-white shadow-[0_15px_40px_-10px_rgba(220,38,38,0.5)] translate-x-2" 
                                                : "hover:bg-white/[0.02] hover:text-white"
                                        }`}
                                    >
                                        <item.icon size={18} className={isActive ? "text-white" : `${item.color} opacity-40 group-hover:opacity-100 transition-all`} />
                                        <span className={`text-[12px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                                            {item.name}
                                        </span>
                                        {isActive && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* --- FOOTER LOGOUT --- */}
            <div className="p-8 mt-auto bg-gradient-to-t from-black/60 to-transparent">
                <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-3xl group hover:bg-red-600/10 transition-all">
                    <button 
                        onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                        className="w-full flex items-center gap-4 text-gray-500 group-hover:text-red-500 transition-all"
                    >
                        <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-inner">
                            <LogOut size={18} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Terminer Session</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
