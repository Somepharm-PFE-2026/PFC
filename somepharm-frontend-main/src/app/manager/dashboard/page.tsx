"use client";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { 
  Calendar, Clock, Users, UserMinus, 
  ArrowRight, Fingerprint, Timer, CheckCircle2,
  AlertTriangle, ShieldCheck
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Internal Specialized Components ---

const PunchWidget = ({ pointage, handlePointage, loadingPointage, timeString }: any) => {
  const isEntered = pointage?.typePointage === 'ENTREE';
  const isExited = pointage?.typePointage === 'SORTIE';

  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-gray-800 relative overflow-hidden group">
      <div className="absolute -right-20 -top-20 opacity-5 text-white group-hover:rotate-12 transition-transform duration-1000"><Fingerprint size={300} /></div>
      <div className="flex items-center gap-6 z-10">
        <div className="bg-gray-800 p-5 rounded-3xl text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
          <Timer size={36} />
        </div>
        <div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-1">Pointeur Personnel</p>
          <h2 className="text-5xl font-black text-white tracking-tighter font-mono">{timeString}</h2>
        </div>
      </div>
      <div className="z-10">
        {!pointage ? (
           <button onClick={handlePointage} disabled={loadingPointage} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-500 transition-all flex items-center gap-3">
             <Fingerprint size={20} /> Pointer l'Entrée
           </button>
        ) : isEntered ? (
           <button onClick={handlePointage} disabled={loadingPointage} className="bg-amber-500 text-gray-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3">
             <Fingerprint size={20} /> Pointer la Sortie
           </button>
        ) : (
          <div className="bg-gray-800 border border-gray-700 px-8 py-4 rounded-2xl flex items-center gap-4">
             <CheckCircle2 className="text-green-500" size={24} />
             <div>
                <p className="text-green-500 font-black uppercase tracking-widest text-xs">Journée Terminée</p>
                <p className="text-gray-400 text-[10px] font-bold mt-1">E: {pointage.heureEntree?.substring(0,5)} | S: {pointage.heureSortie?.substring(0,5)}</p>
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
  const [pointage, setPointage] = useState<any>(null);
  const [loadingPointage, setLoadingPointage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    fetchDashboardData(token);
    fetchPointageStatus(token);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
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

  if (loading) return <div className="p-8 animate-pulse text-gray-400 uppercase font-black tracking-widest">Pilotage Équipe en cours...</div>;

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const data = stats.managerData || {};
  
  // Filter for SUN-THU only (Working Days in Algeria context)
  // We use the definitive dayName from backend to avoid timezone shifts found in Date objects
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
    <div className="max-w-[1500px] mx-auto space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Pilotage Équipe</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Status du service au {stats.dateDuJour}</p>
        </div>
        <NotificationCenter />
      </header>

      <PunchWidget pointage={pointage} handlePointage={handlePointage} loadingPointage={loadingPointage} timeString={timeString} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PRESENCE HUD */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
             <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-6">Taux de Présence (Jour)</p>
             <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                   <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                     strokeDasharray={440} 
                     strokeDashoffset={440 - (440 * (data.presenceRateToday || 0)) / 100}
                     strokeLinecap="round"
                     className="text-amber-500 transition-all duration-1000 ease-out" 
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl font-black text-gray-900">{data.presenceRateToday || 0}%</span>
                </div>
             </div>
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{data.teamAttendanceCount} / {data.teamTotalCount} Présents</p>
          </div>

          {/* PLANNING ENGINE (NAVIGABLE SUN-THU) */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden relative">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-gray-800 font-black text-sm italic uppercase tracking-tighter flex items-center gap-2">
                       <Calendar className="text-amber-500" size={16} /> Planning Service (5J)
                   </h3>
                   <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                       {weekIndex === 0 ? "Semaine Actuelle" : `Suivant (+${weekIndex * 7}j)`}
                   </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {data.isUnderstaffedAlert && (
                       <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100 animate-pulse">Alerte Sous-Effectif</div>
                    )}
                    
                    <div className="flex bg-gray-50 rounded-2xl p-1 border border-gray-100">
                        <button 
                            onClick={() => setWeekIndex(0)}
                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${weekIndex === 0 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Actuel
                        </button>
                        <div className="flex gap-1 ml-2">
                            <button 
                                onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
                                disabled={weekIndex === 0}
                                className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ArrowRight className="rotate-180" size={14} />
                            </button>
                            <button 
                                onClick={() => setWeekIndex(Math.min(4, weekIndex + 1))}
                                disabled={weekIndex === 4}
                                className="p-2 rounded-xl bg-gray-900 text-white shadow-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-colors"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
             </div>

             <div key={weekIndex} className="grid grid-cols-5 gap-4 transition-all duration-700 animate-in fade-in slide-in-from-right-8 ease-out">
                {currentWeek.map((day: any, i: number) => (
                   <div key={i} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-500 ${
                      day.isCritical ? 'bg-red-50 border-red-200 text-red-600 scale-105 shadow-lg shadow-red-100' : 
                      day.absenceCount > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 
                      'bg-gray-50 border-gray-50 text-gray-400'
                   }`}>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{translateDay(day.dayName)}</div>
                      <div className="text-3xl font-black">{day.absenceCount}</div>
                      <div className="text-[9px] font-bold mt-2 opacity-40">{day.dayLabel}</div>
                   </div>
                ))}
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-orange-200 border-t-8">
             <h3 className="text-gray-800 font-black text-sm italic uppercase tracking-tighter flex items-center gap-2 mb-6"><Clock className="text-orange-500" size={16} /> Retards</h3>
             <div className="space-y-3">
                {data.lateAlerts?.length > 0 ? data.lateAlerts.map((alert: any, i: number) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                      <span className="text-xs font-black text-orange-900">{alert.matricule}</span>
                      <span className="text-[9px] font-bold text-orange-600">{alert.heure}</span>
                   </div>
                )) : <p className="text-gray-400 text-[10px] font-bold uppercase">Aucun retard</p>}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-red-200 border-t-8">
             <h3 className="text-gray-800 font-black text-sm italic uppercase tracking-tighter flex items-center gap-2 mb-6"><UserMinus className="text-red-500" size={16} /> Absents</h3>
             <div className="space-y-3">
                {data.absentsToday?.length > 0 ? data.absentsToday.map((abs: any, i: number) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <span className="text-xs font-black text-red-900">{abs.matricule}</span>
                      <span className="text-[9px] font-black uppercase text-red-600">{abs.reason}</span>
                   </div>
                )) : <p className="text-gray-400 text-[10px] font-bold uppercase">Effectif Complet</p>}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-blue-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-800 font-black text-sm italic uppercase tracking-tighter flex items-center gap-2"><ShieldCheck className="text-blue-500" size={16} /> Validations</h3>
                {data.urgentPendingCount > 0 && <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full animate-bounce">Urgent</span>}
             </div>
             <div className="p-4 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center justify-between group">
                <div>
                   <p className="text-amber-900 font-black text-3xl italic tracking-tighter">{data.pendingActionCount}</p>
                   <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Attentes</p>
                </div>
                <Link href="/manager/gestion-demandes" className="bg-amber-500 text-white p-3 rounded-2xl hover:bg-amber-600 transition shadow-lg group-hover:scale-110"><ArrowRight size={24} /></Link>
             </div>
          </div>
      </div>
    </div>
  );
}
