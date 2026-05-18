"use client";
import React, { useEffect, useState } from "react";
import { 
  Users, ArrowRight, FileText, Database, Activity, 
  HardDrive, ShieldAlert, Settings, ShieldCheck, Zap, AlertTriangle
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Internal Icon Fix - Defined before use to avoid hoisting issues
const LayoutDashboard = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);

const StatCard = ({ title, value, label, icon: Icon, trend, href }: any) => {
  const content = (
    <div className="h-full bg-slate-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-yellow-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-yellow-500/30 hover:shadow-[0_12px_40px_rgba(234,179,8,0.06)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
      {/* Decorative Gold Radial Glow on hover */}
      <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-all duration-700 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-400 shadow-sm border border-yellow-500/10 group-hover:scale-105 transition-transform">
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
      </div>
      
      <div className="flex items-baseline gap-3 z-10 relative">
        <p className="text-4xl font-extrabold text-white tracking-tight tabular-nums">{value}</p>
        {trend && (
          <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-400 text-[10px] font-bold uppercase mt-3 tracking-widest z-10 relative">{label}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
};

export default function HRDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    fetchDashboardData(token);
  }, []);

  const fetchDashboardData = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-12 animate-pulse text-blue-400 uppercase font-black tracking-widest">Initialisation du Centre de Commande...</div>;

  const adminData = stats.hrAdminData || {};
  const superData = stats.superAdminData || {};

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl shadow-yellow-500/20 shrink-0">
             <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Command Center</h1>
            <p className="text-yellow-500/80 font-bold uppercase text-[10px] tracking-widest mt-2">Supervision SomePharm — {stats.dateDuJour || new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          <NotificationCenter />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <StatCard title="Effectif" value={adminData.totalHeadcount || 0} label="Collaborateurs Actifs" icon={Users} trend="+2.4%" href="/hr/collaborateurs" />
        <StatCard title="Absentéisme" value={`${adminData.absenteeismRate || "0.0"}%`} label="Taux de Présence Global" icon={Activity} href="/hr/temps-presence" />

        
        {/* NEW: ATTENDANCE ANOMALIES WIDGET */}
        <Link href="/hr/temps-presence" className="bg-slate-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-yellow-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-yellow-500/30 hover:shadow-[0_12px_40px_rgba(234,179,8,0.06)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
           <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-yellow-500/5 blur-3xl group-hover:bg-yellow-500/10 transition-all duration-700 pointer-events-none" />
           <div className="flex justify-between items-center mb-6 z-10 relative">
              <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-400 shadow-sm border border-yellow-500/10 group-hover:scale-105 transition-transform">
                 <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Anomalies Temps</span>
           </div>
           <div className="flex items-baseline gap-3 z-10 relative">
              <p className="text-4xl font-extrabold text-white tracking-tight">{adminData.attendanceAnomaliesCount || 0}</p>
              {adminData.attendanceAnomaliesCount > 0 && (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg animate-pulse">ACTION REQUISE</span>
              )}
           </div>
           <p className="text-slate-400 text-[10px] font-bold uppercase mt-3 tracking-widest z-10 relative">Erreurs de pointage à régler</p>
        </Link>

        <Link href="/hr/validation-rh" className="bg-slate-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-yellow-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-yellow-500/30 hover:shadow-[0_12px_40px_rgba(234,179,8,0.06)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group overflow-hidden relative block">
          <div className="absolute -right-10 -bottom-10 text-yellow-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><ShieldCheck size={160} /></div>
          <div className="z-10 relative">
             <div className="flex justify-between items-center mb-6">
                <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-400 shadow-sm border border-yellow-500/10"><Zap size={24} /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Flux RH</span>
             </div>
             <div className="flex items-baseline gap-3">
                <p className="text-4xl font-extrabold text-white tracking-tight">{adminData.globalPendingCount || 0}</p>
             </div>
             <p className="text-slate-400 text-[10px] font-bold uppercase mt-3 tracking-widest">En attente de signature</p>
          </div>
        </Link>
      </div>

      <Link href="/hr/validation-rh" className="bg-slate-950/40 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.15)] relative overflow-hidden text-white border border-yellow-500/10 hover:border-yellow-500/30 hover:shadow-[0_12px_40px_rgba(234,179,8,0.06)] hover:-translate-y-1 transition-all duration-500 block group">
        <div className="absolute right-0 top-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
           <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
              <div className="bg-yellow-500/10 p-5 rounded-[1.8rem] border border-yellow-500/20 text-yellow-400 group-hover:scale-105 transition-transform duration-500 shrink-0">
                 <ShieldAlert size={40} className="sm:w-12 sm:h-12" />
              </div>
              <div>
                 <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">Flux Critique</h2>
                 <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm">Surveillance administrative. {adminData.globalUrgentPendingCount} dossiers prioritaires nécessitent votre attention.</p>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="flex-1 xl:flex-none bg-yellow-500/5 backdrop-blur-md px-6 sm:px-10 py-4 sm:py-6 rounded-[1.8rem] sm:rounded-[2rem] border border-yellow-500/10 text-center">
                 <p className="text-2xl sm:text-3xl font-extrabold text-rose-500">{adminData.globalUrgentPendingCount}</p>
                 <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 mt-1 tracking-wider">Alertes &gt; 48h</p>
              </div>
              <div className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-6 sm:px-10 py-4 sm:py-6 rounded-[1.8rem] sm:rounded-[2rem] font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all shadow-xl shadow-yellow-500/10">
                 Accéder au flux <ArrowRight size={16} />
              </div>
           </div>
        </div>
      </Link>

      {stats.role === 'SUPER_ADMIN' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-white/5">
            <div className="lg:col-span-2 bg-gray-900/40 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 backdrop-blur-md">
               <h3 className="text-white font-black text-lg flex items-center gap-3 mb-8 italic uppercase">
                  <Database size={20} className="text-yellow-500" /> System Audit Logs
               </h3>
               <div className="space-y-3 font-mono">
                  {(superData.recentLogs || []).map((log: any, i: number) => (
                    <div key={i} className="bg-white/5 p-4 rounded-2xl text-[10px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-white/5">
                       <div className="flex gap-2 shrink-0">
                          <span className="text-yellow-400 font-bold">[{log.timestamp?.split('T')[1].substring(0,8)}]</span>
                          <span className={`font-black uppercase ${log.typeAction.includes('FAILURE') ? 'text-red-500' : 'text-green-500'}`}>{log.typeAction}</span>
                       </div>
                       <span className="text-gray-300 truncate sm:tracking-tight flex-1">{log.description}</span>
                       <span className="sm:ml-auto text-yellow-500/50 font-black uppercase tracking-wider">{log.auteur}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
                <div className="bg-gray-900/40 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/5 backdrop-blur-md">
                   <h3 className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mb-6">Status Infrastructure</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                         <span>Database (PSQL)</span>
                         <span className="text-green-500">{superData.dbStatus}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                         <span>Storage Usage</span>
                         <span className="text-yellow-500">{superData.storageUsage} / 50 GB</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                         <div className="bg-yellow-500 h-full" style={{ width: `${(superData.storageUsage / 50) * 100}%` }}></div>
                      </div>
                   </div>
                </div>
                <div className="bg-red-500/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-red-500/20">
                   <h3 className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 animate-pulse"><ShieldAlert size={14} /> Panic Mode</h3>
                   <button className="w-full py-4 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs hover:bg-red-700 transition">Activer Maintenance</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}

