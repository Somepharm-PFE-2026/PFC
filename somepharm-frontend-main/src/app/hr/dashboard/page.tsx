"use client";
import React, { useEffect, useState } from "react";
import { 
  Users, ArrowRight, FileText, Database, Activity, 
  HardDrive, ShieldAlert, Settings, ShieldCheck, Zap, AlertTriangle
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";

const StatCard = ({ title, value, label, icon: Icon, color, trend }: any) => (
  <div className={`bg-white p-8 rounded-[3rem] shadow-sm border-b-8 ${color} hover:-translate-y-1 transition-all duration-300`}>
    <div className="flex justify-between items-center mb-4">
      <div className={`p-4 rounded-2xl ${color.replace('border-', 'bg-').replace('600', '50').replace('400', '50').replace('500', '50')}`}>
        <Icon size={24} className={color.replace('border-', 'text-')} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <p className="text-4xl font-black text-gray-900">{value}</p>
      {trend && <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-md">{trend}</span>}
    </div>
    <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-wider">{label}</p>
  </div>
);

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
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
             <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Command Center</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Supervision SomePharm — {stats.dateDuJour}</p>
          </div>
        </div>
        <NotificationCenter />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Effectif" value={adminData.totalHeadcount || 0} label="Collaborateurs Actifs" icon={Users} color="border-blue-600" trend="+2.4%" />
        <StatCard title="Absentéisme" value={`${adminData.absenteeismRate || "0.0"}%`} label="Taux de Présence Global" icon={Activity} color="border-red-500" />

        
        {/* NEW: ATTENDANCE ANOMALIES WIDGET */}
        <Link href="/hr/temps-presence" className="bg-white p-8 rounded-[3rem] shadow-sm border-b-8 border-amber-500 hover:-translate-y-1 transition-all duration-300 group">
           <div className="flex justify-between items-center mb-4">
              <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                 <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Anomalies Temps</span>
           </div>
           <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-gray-900">{adminData.attendanceAnomaliesCount || 0}</p>
              {adminData.attendanceAnomaliesCount > 0 && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md animate-pulse">ACTION REQUISE</span>
              )}
           </div>
           <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-wider">Erreurs de pointage à régler</p>
        </Link>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 text-blue-50/50 group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={140} /></div>
          <div className="z-10">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Zap size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Flux RH</span>
             </div>
             <p className="text-4xl font-black text-gray-900">{adminData.globalPendingCount}</p>
             <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-wider text-center">En attente de signature</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-white border border-white/5 backdrop-blur-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="bg-blue-600/20 p-6 rounded-[2rem] border border-blue-500/30">
                 <ShieldAlert size={48} className="text-blue-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter">Flux Critique</h2>
                 <p className="text-gray-400 text-sm mt-1 max-w-sm">Surveillance administrative. {adminData.globalUrgentPendingCount} dossiers prioritaires nécessitent votre attention.</p>
              </div>
           </div>
           <div className="flex gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none bg-white/5 backdrop-blur-md px-10 py-6 rounded-[2rem] border border-white/10 text-center">
                 <p className="text-3xl font-black text-red-500">{adminData.globalUrgentPendingCount}</p>
                 <p className="text-[10px] font-black uppercase text-gray-500 mt-1">Alertes &gt; 48h</p>
              </div>
              <Link href="/hr/validation-rh" className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40">
                 Accéder au flux <ArrowRight size={18} />
              </Link>
           </div>
        </div>
      </div>

      {stats.role === 'SUPER_ADMIN' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-white/5">
            <div className="lg:col-span-2 bg-gray-900/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md">
               <h3 className="text-white font-black text-lg flex items-center gap-3 mb-8 italic uppercase italic">
                  <Database size={20} className="text-blue-500" /> System Audit Logs
               </h3>
               <div className="space-y-3 font-mono">
                  {(superData.recentLogs || []).map((log: any, i: number) => (
                    <div key={i} className="bg-white/5 p-4 rounded-2xl text-[10px] flex gap-4 border border-white/5">
                       <span className="text-blue-400 font-bold shrink-0">[{log.timestamp?.split('T')[1].substring(0,8)}]</span>
                       <span className={`font-black uppercase shrink-0 ${log.typeAction.includes('FAILURE') ? 'text-red-500' : 'text-green-500'}`}>{log.typeAction}</span>
                       <span className="text-gray-400 truncate tracking-tight">{log.description}</span>
                       <span className="ml-auto text-blue-500/50 font-black">{log.auteur}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-6">
                <div className="bg-gray-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-md">
                   <h3 className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mb-6">Status Infrastructure</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                         <span>Database (PSQL)</span>
                         <span className="text-green-500">{superData.dbStatus}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                         <span>Storage Usage</span>
                         <span className="text-blue-500">{superData.storageUsage} / 50 GB</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                         <div className="bg-blue-600 h-full" style={{ width: `${(superData.storageUsage / 50) * 100}%` }}></div>
                      </div>
                   </div>
                </div>
                <div className="bg-red-500/5 p-8 rounded-[3rem] border border-red-500/20">
                   <h3 className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 animate-pulse"><ShieldAlert size={14} /> Panic Mode</h3>
                   <button className="w-full py-4 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-xs hover:bg-red-700 transition">Activer Maintenance</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}

// Internal Icon Fix
const LayoutDashboard = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);
