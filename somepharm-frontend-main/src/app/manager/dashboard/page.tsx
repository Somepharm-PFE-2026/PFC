"use client";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Calendar, Clock, Users, UserMinus,
  ArrowRight, Fingerprint, Timer, CheckCircle2,
  AlertTriangle, ShieldCheck, RefreshCw, Loader2
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Internal Specialized Components ---

const PunchWidget = ({ pointage, handlePointage, loadingPointage, timeString }: any) => {
  const isEntered = pointage?.typePointage === 'ENTREE';
  const isExited = pointage?.typePointage === 'SORTIE';

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8 relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all">
      <div className="absolute -right-20 -top-20 opacity-[0.03] text-teal-900 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
        <Fingerprint size={300} />
      </div>
      <div className="flex items-center gap-4 lg:gap-6 z-10 w-full md:w-auto">
        <div className="bg-white/60 p-4 rounded-2xl text-teal-500 shadow-sm border border-white group-hover:scale-105 transition-transform shrink-0">
          <Timer size={32} />
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Pointeur Personnel</p>
          <h2 className="text-4xl lg:text-5xl font-black font-heading text-slate-800 tracking-tight tabular-nums drop-shadow-sm">{timeString}</h2>
        </div>
      </div>
      <div className="z-10 w-full md:w-auto">
        {!pointage ? (
           <button 
             onClick={handlePointage} disabled={loadingPointage} 
             className="w-full md:w-auto bg-teal-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-teal-600/20 hover:bg-teal-500 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             {loadingPointage ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
             Pointer l'Entrée
           </button>
        ) : isEntered ? (
           <button 
             onClick={handlePointage} disabled={loadingPointage} 
             className="w-full md:w-auto bg-amber-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             {loadingPointage ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
             Pointer la Sortie
           </button>
        ) : (
          <div className="bg-slate-800 border border-slate-700 px-6 py-4 rounded-xl flex items-center gap-4 w-full md:w-auto">
             <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
             <div>
                <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Journée Terminée</p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">E: {pointage.heureEntree?.substring(0,5)} | S: {pointage.heureSortie?.substring(0,5)}</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ManagerDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [pointage, setPointage] = useState<any>(null);
  const [loadingPointage, setLoadingPointage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetchDashboardData(token);
    fetchPointageStatus(token);

    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Refresh team data every 30 seconds so presence, absences and late alerts stay live
    const dataPoller = setInterval(() => {
      const t = localStorage.getItem("token");
      if (t) fetchDashboardData(t);
    }, 30000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(dataPoller);
    };
  }, []);

  const fetchDashboardData = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setStats(await res.json());
        setLastRefreshed(new Date());
      } else {
        const errBody = await res.text();
        console.error(`[Dashboard] API error ${res.status}:`, errBody);
      }
    } catch (err) { console.error("[Dashboard] Fetch failed:", err); } finally { setLoading(false); }
  };

  const fetchPointageStatus = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/pointage/statut-jour", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.text();
        if (data) setPointage(JSON.parse(data));
      }
    } catch (err) { console.error(err); }
  };

  const handlePointage = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingPointage(true);
    try {
      const res = await fetch("http://localhost:8080/api/pointage/action", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPointageStatus(token);
    } catch (err) { console.error(err); } finally { setLoadingPointage(false); }
  };

  const [weekIndex, setWeekIndex] = useState(0);

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const data = stats.managerData || {};
  
  // Filter for SUN-THU only (Working Days in Algeria context)
  const heatmap = (data.teamCapacityHeatmap || []).filter((d: any) => {
    const name = (d.dayName || "").toUpperCase();
    return name !== 'FRI' && name !== 'SAT';
  });
  const currentWeek = heatmap.slice(weekIndex * 5, (weekIndex * 5) + 5);

  const translateDay = (day: string) => {
    const dict: Record<string, string> = {
      'SUN': 'DIM', 'MON': 'LUN', 'TUE': 'MAR', 'WED': 'MER', 'THU': 'JEU'
    };
    return dict[day.toUpperCase()] || day;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">Pilotage d'Équipe</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              Status du service au {stats.dateDuJour}
            </p>
            {lastRefreshed && (
              <span className="hidden sm:inline text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                · Mis à jour {lastRefreshed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { const t = localStorage.getItem("token"); if (t) fetchDashboardData(t); }}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-sm transition-all"
            title="Actualiser"
          >
            <RefreshCw size={16} />
          </button>
          <NotificationCenter />
        </div>
      </header>

      <PunchWidget pointage={pointage} handlePointage={handlePointage} loadingPointage={loadingPointage} timeString={timeString} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* PRESENCE HUD */}
          <Link href="/manager/mon-equipe" className="bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col items-center justify-center text-center hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 block">
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6">Taux de Présence (Jour)</p>
             <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                   <circle cx="18" cy="18" r="15.9" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                   <circle cx="18" cy="18" r="15.9" stroke="currentColor" strokeWidth="3" fill="transparent" 
                      strokeDasharray="100" 
                      strokeDashoffset={100 - (data.presenceRateToday || 0)}
                      strokeLinecap="round"
                      className="text-teal-500 transition-all duration-1000 ease-out" 
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-3xl lg:text-4xl font-heading font-bold text-slate-900 tabular-nums">{data.presenceRateToday || 0}%</span>
                </div>
             </div>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{data.teamAttendanceCount} / {data.teamTotalCount} Présents</p>
          </Link>

          {/* PLANNING ENGINE (NAVIGABLE SUN-THU) */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                   <h3 className="text-slate-800 font-heading font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                       <Calendar className="text-teal-500" size={16} /> Planning Service (5J)
                   </h3>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                       {weekIndex === 0 ? "Semaine Actuelle" : `Suivant (+${weekIndex * 7}j)`}
                   </p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {data.isUnderstaffedAlert && (
                       <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-rose-100 animate-pulse">Alerte Sous-Effectif</div>
                    )}
                    
                    <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100 ml-auto">
                        <button 
                            onClick={() => setWeekIndex(0)}
                            className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${weekIndex === 0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Actuel
                        </button>
                        <div className="flex gap-1 ml-1">
                            <button 
                                onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
                                disabled={weekIndex === 0}
                                className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                <ArrowRight className="rotate-180" size={14} />
                            </button>
                            <button 
                                onClick={() => setWeekIndex(Math.min(4, weekIndex + 1))}
                                disabled={weekIndex === 4}
                                className="p-2 rounded-lg bg-teal-600 text-white shadow-sm shadow-teal-600/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
             </div>

             <div key={weekIndex} className="grid grid-cols-5 gap-2 lg:gap-4 transition-all duration-700 animate-in fade-in slide-in-from-right-8 ease-out">
                {currentWeek.map((day: any, i: number) => (
                   <div key={i} className={`flex flex-col items-center justify-center p-4 lg:p-6 rounded-[1.25rem] border transition-all duration-500 shadow-sm hover:-translate-y-1 ${
                      day.isCritical ? 'bg-rose-50/80 border-rose-200 text-rose-600' : 
                      day.absenceCount > 0 ? 'bg-amber-50/80 border-amber-200 text-amber-700' : 
                      'bg-white/60 border-white text-slate-500'
                   }`}>
                      <div className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">{translateDay(day.dayName)}</div>
                      <div className="text-2xl lg:text-3xl font-heading font-bold">{day.absenceCount}</div>
                      <div className="text-[8px] lg:text-[9px] font-semibold mt-2 opacity-50 hidden sm:block truncate w-full text-center">{day.dayLabel}</div>
                   </div>
                ))}
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Link href="/manager/mon-equipe" className="bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 block">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
              <h3 className="text-slate-800 font-heading font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-6"><Clock className="text-orange-500" size={16} /> Retards</h3>
              <div className="space-y-3">
                 {data.lateAlerts?.length > 0 ? data.lateAlerts.map((alert: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                       <span className="text-xs font-bold text-orange-900">{alert.matricule}</span>
                       <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">{alert.heure}</span>
                    </div>
                 )) : <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Aucun retard</p>}
              </div>
          </Link>

          <Link href="/manager/mon-equipe" className="bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 block">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
              <h3 className="text-slate-800 font-heading font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-6"><UserMinus className="text-rose-500" size={16} /> Absents</h3>
              <div className="space-y-3">
                 {data.absentsToday?.length > 0 ? data.absentsToday.map((abs: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                       <span className="text-xs font-bold text-rose-900">{abs.matricule}</span>
                       <span className="text-[9px] font-bold uppercase text-rose-600 bg-rose-100 px-2 py-1 rounded-md">{abs.reason}</span>
                    </div>
                 )) : <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Effectif Complet</p>}
              </div>
          </Link>

          <Link href="/manager/gestion-demandes" className="bg-white/80 backdrop-blur-xl p-6 lg:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 block group">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-800 font-heading font-bold text-sm uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="text-teal-500" size={16} /> Validations</h3>
                {data.urgentPendingCount > 0 && <span className="bg-rose-500 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm animate-pulse">Urgent</span>}
             </div>
             <div className="p-5 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between group-hover:bg-teal-100/50 transition-colors">
                <div>
                   <p className="text-teal-900 font-heading font-bold text-3xl">{data.pendingActionCount}</p>
                   <p className="text-[10px] text-teal-600 font-bold uppercase mt-1 tracking-widest">En Attente</p>
                </div>
                <div className="bg-teal-600 text-white p-3 rounded-xl transition-all group-hover:scale-110"><ArrowRight size={20} /></div>
             </div>
          </Link>
      </div>
    </div>
  );
}
