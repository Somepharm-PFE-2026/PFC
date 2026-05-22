"use client";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { 
  Calendar, Clock, FileText, Fingerprint, Timer, 
  RotateCcw, Briefcase, ShieldAlert, ChevronRight, ChevronLeft, Megaphone,
  TrendingUp, TrendingDown, ArrowUpRight, Activity, CheckCircle2, XCircle, AlertCircle,
  Loader2, Plus
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUI } from "../../../context/UIContext";

// --- Premium Admin Panel Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, color = "blue", href }: any) => {
  const colorClasses: Record<string, { bg: string, text: string }> = {
    teal: { bg: "bg-teal-50", text: "text-teal-600" },
    blue: { bg: "bg-sky-50", text: "text-sky-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  const cardContent = (
    <div className="h-full bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 ${selectedColor.bg} ${selectedColor.text} rounded-2xl shadow-sm border border-white`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50 ${trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-heading font-black text-slate-800 relative z-10 drop-shadow-sm">{value}</h3>
      <p className="text-sm font-bold text-slate-600 mt-1 relative z-10">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 font-medium mt-1 relative z-10">{subtitle}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{cardContent}</Link>;
  }
  return cardContent;
};

const CommunicationNudge = ({ annonces }: any) => {
  const importantUnread = annonces.filter((a: any) => 
    !a.isRead && 
    a.priority === 'URGENT' && 
    (new Date().getTime() - new Date(a.datePublication).getTime() > 24 * 60 * 60 * 1000)
  );

  if (importantUnread.length === 0) return null;

  return (
    <Link href="/employee/communication" className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-200/50 p-6 lg:p-8 rounded-[2rem] flex items-center justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 mb-8 relative overflow-hidden">
       <div className="absolute inset-0 bg-white/40 pointer-events-none" />
       <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 animate-pulse">
             <ShieldAlert size={28} />
          </div>
          <div className="pr-4">
             <h4 className="text-amber-900 font-heading font-black text-base drop-shadow-sm">Action Requise</h4>
             <p className="text-amber-800/80 text-sm font-bold mt-0.5">Vous avez {importantUnread.length} communication(s) urgente(s) non lue(s)</p>
          </div>
       </div>
       <div className="p-3 bg-white/80 backdrop-blur-md rounded-xl shadow-sm text-amber-600 group-hover:translate-x-1 group-hover:bg-white group-hover:shadow-md transition-all shrink-0 relative z-10">
          <ChevronRight size={20} />
       </div>
    </Link>
  );
};

const PunchWidget = ({ pointage, handlePointage, loadingPointage, timeString }: any) => {
  const isEntered = pointage?.typePointage === 'ENTREE';
  const isExited = pointage?.typePointage === 'SORTIE';

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 lg:p-8 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-heading font-black text-slate-800">Contrôle d'Accès</h3>
          <p className="text-sm font-bold text-slate-500 mt-1">Enregistrez votre présence journalière</p>
        </div>
        <div className="bg-white/60 p-4 rounded-2xl text-sky-600 border border-white shadow-sm group-hover:scale-105 transition-transform">
          <Timer size={28} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 backdrop-blur-md p-6 lg:p-8 rounded-[1.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <Clock className="text-sky-500 w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Heure Locale</p>
            <h2 className="text-3xl lg:text-4xl font-heading font-black text-slate-900 tracking-tight drop-shadow-sm">{timeString}</h2>
          </div>
        </div>
        
        <div className="w-full md:w-auto">
          {!pointage || (isExited && false) ? ( 
             <button 
               onClick={handlePointage} disabled={loadingPointage}
               className="w-full md:w-auto bg-sky-600 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               {loadingPointage ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
               <span>Pointer l'Entrée</span>
             </button>
          ) : isEntered ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="text-center sm:text-right bg-white px-4 py-2 rounded-lg border border-slate-200 w-full sm:w-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrée à</p>
                <p className="text-slate-800 font-bold">{pointage.heureEntree?.substring(0,5)}</p>
              </div>
              <button 
                onClick={handlePointage} disabled={loadingPointage}
                className="w-full sm:w-auto bg-amber-500 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loadingPointage ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
                <span>Pointer la Sortie</span>
              </button>
            </div>
          ) : (
            <div className="bg-sky-50 border border-sky-100 px-6 py-4 rounded-xl flex items-center gap-3 w-full md:w-auto">
               <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                 <CheckCircle2 size={20} />
               </div>
               <div>
                 <p className="text-sky-800 font-bold text-sm">Journée Terminée</p>
                 <p className="text-sky-600 text-xs font-medium">E: {pointage.heureEntree?.substring(0,5)} | S: {pointage.heureSortie?.substring(0,5)}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function EmployeeDashboard() {
  const { addToast } = useUI();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pointage, setPointage] = useState<any>(null);
  const [loadingPointage, setLoadingPointage] = useState(false);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const router = useRouter();

  // Unified sliding component and presence chart states
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [monthlyPointages, setMonthlyPointages] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  // Touch Swipe for mobile carousel
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetchDashboardData(token);
    fetchPointageStatus(token);
    fetchAnnonces(token);
    fetchSystemConfig(token);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchMonthlyPointages(token, selectedMonth);
  }, [selectedMonth]);

  const fetchSystemConfig = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/config/system", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemConfig(data);
      }
    } catch (err) {
      console.error("Error fetching system config:", err);
    }
  };

  const fetchMonthlyPointages = async (token: string, date: Date) => {
    setLoadingMonthly(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const startDate = new Date(year, month, 1, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();
      
      const res = await fetch(`http://localhost:8080/api/pointage/my-pointages?start=${startStr}&end=${endStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyPointages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching monthly pointages:", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && activeSlide === 0) {
      setActiveSlide(1);
    } else if (isRightSwipe && activeSlide === 1) {
      setActiveSlide(0);
    }
  };

  const fetchAnnonces = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/annonces/targeted", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setAnnonces(Array.isArray(d) ? d : []); }
    } catch (err) { console.error(err); }
  };

  const fetchDashboardData = async (token: string) => {
    try {
      const [resStats, resConge, resDoc] = await Promise.all([
        fetch("http://localhost:8080/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/demandes/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/demandes-documents/me", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        
        let allRequests: any[] = [];
        if (resConge.ok) {
           const conges = await resConge.json();
           allRequests.push(...(Array.isArray(conges) ? conges : []).map((c: any) => ({ ...c, _group: 'CONGE' })));
        }
        if (resDoc.ok) {
           const docs = await resDoc.json();
           allRequests.push(...(Array.isArray(docs) ? docs : []).map((d: any) => ({ ...d, _group: 'DOCUMENT' })));
        }

        const sortedRecent = allRequests
          .sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime())
          .slice(0, 5);

        setStats({
          ...statsData,
          employeeData: {
            ...statsData.employeeData,
            recentRequests: sortedRecent
          }
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPointageStatus = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/pointage/statut-jour", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.text();
        if (data) setPointage(JSON.parse(data));
      }
    } catch (err) { console.error("Erreur pointage:", err); }
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
      if (res.ok) {
        addToast("success", "Pointage enregistré");
        fetchPointageStatus(token);
      } else {
        addToast("error", "Erreur lors du pointage");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur réseau");
    } finally { setLoadingPointage(false); }
  };

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const data = stats.employeeData || {};

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-sky-500" />
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Premium Organic Header Section */}
      <header className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 bg-gradient-to-br from-sky-50/80 via-white to-blue-50/30 border border-sky-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden mb-8">
        {/* Soft decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 border-l-4 border-sky-500 pl-5">
          <h1 className="text-3xl lg:text-4xl font-heading font-black italic text-slate-800 tracking-tight drop-shadow-sm">
            Bienvenue
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Aperçu de votre activité au {stats.dateDuJour || new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/employee/demandes?new=true&cat=CONGE" className="whitespace-nowrap bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition-all flex items-center gap-2">
            <Plus size={16} /> Nouveau Congé
          </Link>
        </div>
      </header>

      <CommunicationNudge annonces={annonces} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Solde Congés" 
          value={data.soldeConges != null ? Number(data.soldeConges).toFixed(1) : "0.0"} 
          subtitle="Jours restants" 
          icon={Briefcase} 
          color="blue"
          href="/employee/demandes"
        />
        <StatCard 
          title="Heure d'Entrée" 
          value={pointage?.heureEntree ? pointage.heureEntree.substring(0,5) : "--:--"} 
          subtitle={pointage?.heureEntree ? "Enregistrée" : "En attente"} 
          icon={ArrowUpRight} 
          color="blue"
          href="/employee/profil"
        />
        <StatCard 
          title="Heure de Sortie" 
          value={pointage?.heureSortie ? pointage.heureSortie.substring(0,5) : "--:--"} 
          subtitle={pointage?.heureSortie ? "Enregistrée" : "Non pointée"} 
          icon={Clock} 
          color="purple"
          href="/employee/profil"
        />
        <StatCard 
          title="Requêtes en cours" 
          value={(data.recentRequests || []).filter((r: any) => r.statutCycleVie?.includes('ATTENTE')).length || 0} 
          subtitle="En validation" 
          icon={FileText} 
          color="orange"
          href="/employee/demandes"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Content Area - Swipeable Carousel Component */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          
          <div 
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative p-4 md:p-6"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            
            {/* Unified Header with Month Navigation and Slide Selector Switch */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100/50 mb-6">
              
              {/* Dynamic Month Selector */}
              <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white rounded-xl hover:shadow-sm text-slate-500 hover:text-sky-600 active:scale-95 transition-all"
                  title="Mois précédent"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
                <span className="text-xs font-black text-slate-700 min-w-[130px] text-center uppercase tracking-wider select-none">
                  {selectedMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white rounded-xl hover:shadow-sm text-slate-500 hover:text-sky-600 active:scale-95 transition-all"
                  title="Mois suivant"
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Slider Toggle (Pill Switcher) */}
              <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 relative border border-slate-200/50 w-full sm:w-auto shrink-0 shadow-inner">
                <button
                  onClick={() => setActiveSlide(0)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 w-1/2 sm:w-auto ${
                    activeSlide === 0 
                      ? "bg-white text-sky-600 shadow-md border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setActiveSlide(1)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 w-1/2 sm:w-auto ${
                    activeSlide === 1 
                      ? "bg-white text-sky-600 shadow-md border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Présence Mensuelle
                </button>
              </div>
            </div>

            {/* Horizontal Slides Container */}
            <div className="relative overflow-hidden w-full">
              <div 
                className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ transform: `translateX(-${activeSlide * 50}%)` }}
              >
                
                {/* SLIDE 1: Access Control & Recent Requests */}
                <div className="w-1/2 px-1 md:px-3 space-y-6">
                  
                  {/* Punch widget */}
                  <PunchWidget pointage={pointage} handlePointage={handlePointage} loadingPointage={loadingPointage} timeString={timeString} />
                  
                  {/* Recent Activity Table (Filtered by selected month) */}
                  <div className="bg-white/90 rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                      <div>
                        <h3 className="font-heading font-black text-slate-800 text-base drop-shadow-sm">Dernières Requêtes</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Suivi au {selectedMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <Link href="/employee/demandes" className="text-[10px] text-sky-600 font-black uppercase tracking-widest hover:text-sky-700 flex items-center gap-1">
                        Tout voir <ChevronRight size={12} />
                      </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50/40 text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                            <th className="p-4 pl-6">Type</th>
                            <th className="p-4">Détails</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 pr-6 text-right">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {(() => {
                            const filteredRequests = (data.recentRequests || []).filter((req: any) => {
                              const reqDate = new Date(req.dateSoumission);
                              return reqDate.getFullYear() === selectedMonth.getFullYear() && reqDate.getMonth() === selectedMonth.getMonth();
                            });

                            if (filteredRequests.length > 0) {
                              return filteredRequests.map((req: any, i: number) => {
                                const isDoc = req._group === 'DOCUMENT';
                                const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
                                const isRefused = req.statutCycleVie?.includes('REFUSE');
                                
                                const label = isDoc 
                                  ? (req.typeDocument || "Document").replace(/_/g, " ").toLowerCase()
                                  : (req.typeConge || "Congé").replace(/_/g, " ").toLowerCase();

                                return (
                                  <tr key={i} className="border-b border-slate-100/50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-4 pl-6">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm border border-white ${isDoc ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'}`}>
                                        {isDoc ? <FileText size={10} /> : <Calendar size={10} />}
                                        {isDoc ? 'Doc' : 'Congé'}
                                      </span>
                                    </td>
                                    <td className="p-4 text-slate-700 font-bold capitalize">{label}</td>
                                    <td className="p-4 text-slate-500 font-bold">{new Date(req.dateSoumission).toLocaleDateString()}</td>
                                    <td className="p-4 pr-6 text-right">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm border border-white ${
                                        isApproved ? 'bg-emerald-50 text-emerald-700' : 
                                        isRefused ? 'bg-rose-50 text-rose-700' : 
                                        'bg-amber-50 text-amber-700'
                                      }`}>
                                        {isApproved ? <CheckCircle2 size={10} /> : isRefused ? <XCircle size={10} /> : <AlertCircle size={10} />}
                                        {req.statutCycleVie.replace(/_/g, " ")}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            } else {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-10 text-center text-slate-400 text-xs font-bold italic">
                                    Aucune requête soumise en {selectedMonth.toLocaleDateString("fr-FR", { month: "long" })}.
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* SLIDE 2: Presence Bar Chart */}
                <div className="w-1/2 px-1 md:px-3">
                  <div className="bg-white/95 rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-heading font-black text-slate-800">Calendrier de Présence</h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">Vos pointages enregistrés</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-sky-600 border border-slate-100 shadow-sm shrink-0">
                        <Activity size={24} />
                      </div>
                    </div>

                    {/* Chart Core logic */}
                    {(() => {
                      const startHour = parseInt(systemConfig?.workingHoursStart?.split(":")[0]) || 8;
                      const endHour = (parseInt(systemConfig?.workingHoursEnd?.split(":")[0]) || 17) + 3;
                      const range = endHour - startHour;
                      
                      const hoursArray = [];
                      for (let h = startHour; h <= endHour; h++) {
                        hoursArray.push(h);
                      }

                      const year = selectedMonth.getFullYear();
                      const month = selectedMonth.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                      const getDayPresenceIntervals = (dayNum: number) => {
                        const dayPointages = monthlyPointages.filter(p => {
                          const pDate = new Date(p.horodatage);
                          return pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === dayNum;
                        }).sort((a, b) => new Date(a.horodatage).getTime() - new Date(b.horodatage).getTime());

                        const intervals: { startDecimal: number, endDecimal: number, isAnomaly: boolean, rawStart: string, rawEnd: string, isOngoing: boolean }[] = [];
                        
                        for (let i = 0; i < dayPointages.length; i++) {
                          if (dayPointages[i].typePointage === 'ENTREE') {
                            const entryTime = new Date(dayPointages[i].horodatage);
                            const isAnomaly = dayPointages[i].statut === 'RETARD' || dayPointages[i].statut === 'ANOMALIE';
                            
                            const startDecimal = entryTime.getHours() + entryTime.getMinutes() / 60;
                            const rawStart = entryTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            
                            let exitDecimal = startDecimal;
                            let rawEnd = "--:--";
                            let exitFound = false;
                            let isOngoing = false;
                            
                            for (let j = i + 1; j < dayPointages.length; j++) {
                              if (dayPointages[j].typePointage === 'SORTIE') {
                                const exitTime = new Date(dayPointages[j].horodatage);
                                exitDecimal = exitTime.getHours() + exitTime.getMinutes() / 60;
                                rawEnd = exitTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                i = j;
                                exitFound = true;
                                break;
                              }
                            }
                            
                            if (!exitFound) {
                              const isToday = new Date().toDateString() === entryTime.toDateString();
                              if (isToday) {
                                const now = new Date();
                                exitDecimal = now.getHours() + now.getMinutes() / 60;
                                rawEnd = "En cours";
                                isOngoing = true;
                              } else {
                                exitDecimal = Math.min(endHour, startDecimal + 8);
                                rawEnd = "--:--";
                                isOngoing = true;
                              }
                            }
                            
                            intervals.push({ 
                              startDecimal, 
                              endDecimal: Math.max(startDecimal + 0.1, exitDecimal), 
                              isAnomaly,
                              rawStart,
                              rawEnd,
                              isOngoing
                            });
                          }
                        }
                        return intervals;
                      };

                      const chartHeight = 350;
                      const paddingTop = 25;
                      const paddingBottom = 30;
                      const gridHeight = chartHeight - paddingTop - paddingBottom;

                      const svgWidth = 850;
                      const paddingLeft = 20;
                      const paddingRight = 20;
                      const gridWidth = svgWidth - paddingLeft - paddingRight;

                      return (
                        <div className="space-y-4">
                          
                          {/* Legend */}
                          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm" />
                              <span>Présence</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm" />
                              <span>Retard / Anomalie</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm" />
                              <span>En cours</span>
                            </div>
                          </div>

                          {/* Graphical container */}
                          <div className="flex relative bg-slate-50/50 rounded-3xl border border-slate-100 p-4 overflow-hidden">
                            
                            {/* Fixed Hours Y-Axis */}
                            <div className="relative w-12 shrink-0 py-1 border-r border-slate-100" style={{ height: `${chartHeight}px` }}>
                              {hoursArray.map((h) => {
                                const y = paddingTop + ((endHour - h) / range) * gridHeight;
                                return (
                                  <div 
                                    key={h} 
                                    className="absolute right-3 -translate-y-1/2 text-[9px] font-black text-slate-400/80 tracking-tight"
                                    style={{ top: `${y}px` }}
                                  >
                                    {h < 10 ? `0${h}` : h}h
                                  </div>
                                );
                              })}
                            </div>

                            {/* Scrollable grid layout */}
                            <div className="overflow-x-auto scrollbar-thin grow relative pl-2">
                              <div className="relative" style={{ width: `${svgWidth}px` }}>
                                
                                {/* Absolute Floating Tooltip inside scroll container */}
                                {hoveredDay && (
                                  <div 
                                    className="absolute bg-slate-900 text-white text-[10px] font-bold px-3 py-2.5 rounded-2xl shadow-xl border border-slate-800 pointer-events-none z-30 transition-all duration-150 animate-in fade-in zoom-in-95"
                                    style={{
                                      left: `${Math.max(10, Math.min(svgWidth - 170, hoveredDay.x - 80))}px`,
                                      top: `${Math.max(5, hoveredDay.y - 85)}px`,
                                      width: '160px'
                                    }}
                                  >
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900" />
                                    <p className="font-heading font-black text-slate-200 border-b border-slate-800 pb-1 mb-1 text-[11px]">
                                      Jour {hoveredDay.dayNum}
                                    </p>
                                    {hoveredDay.intervals.length === 0 ? (
                                      <p className="text-slate-500 italic font-bold">Aucune entrée</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {hoveredDay.intervals.map((int: any, idx: number) => (
                                          <div key={idx} className="flex flex-col">
                                            <span className="flex items-center gap-1.5 text-slate-300 font-extrabold">
                                              <span className={`w-1.5 h-1.5 rounded-full ${int.isOngoing ? 'bg-emerald-400' : int.isAnomaly ? 'bg-amber-400' : 'bg-sky-400'}`} />
                                              {int.rawStart} - {int.rawEnd}
                                            </span>
                                            {int.isAnomaly && (
                                              <span className="text-[8px] text-amber-400 font-extrabold uppercase mt-0.5 pl-3">
                                                En retard
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <svg viewBox={`0 0 ${svgWidth} ${chartHeight}`} className="w-full h-[350px]">
                                  <defs>
                                    <linearGradient id="normalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#38bdf8" />
                                      <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                    <linearGradient id="anomalyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#fbbf24" />
                                      <stop offset="100%" stopColor="#ea580c" />
                                    </linearGradient>
                                    <linearGradient id="ongoingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="#34d399" />
                                      <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                  </defs>

                                  {/* Grid Lines */}
                                  {hoursArray.map((h) => {
                                    const y = paddingTop + ((endHour - h) / range) * gridHeight;
                                    return (
                                      <line
                                        key={h}
                                        x1={paddingLeft}
                                        y1={y}
                                        x2={svgWidth - paddingRight}
                                        y2={y}
                                        stroke="#f8fafc"
                                        strokeWidth="1.5"
                                      />
                                    );
                                  })}

                                  {/* Render bars and hover hotspots */}
                                  {daysArray.map((d) => {
                                    const x = paddingLeft + ((d - 0.5) / daysInMonth) * gridWidth;
                                    const intervals = getDayPresenceIntervals(d);
                                    const barWidth = 8;

                                    return (
                                      <g key={d} className="group/day">
                                        {/* Soft Column Spotlight Background on Hover */}
                                        <rect
                                          x={x - 13}
                                          y={paddingTop - 6}
                                          width={26}
                                          height={gridHeight + 12}
                                          rx={6}
                                          className="fill-transparent group-hover/day:fill-slate-500/[0.04] transition-all duration-300 pointer-events-none"
                                        />

                                        {intervals.map((int, idx) => {
                                          const clamp = (val: number, minVal: number, maxVal: number) => Math.max(minVal, Math.min(maxVal, val));
                                          const yStart = paddingTop + ((endHour - clamp(int.startDecimal, startHour, endHour)) / range) * gridHeight;
                                          const yEnd = paddingTop + ((endHour - clamp(int.endDecimal, startHour, endHour)) / range) * gridHeight;
                                          const barHeight = Math.max(8, yStart - yEnd);

                                          const gradientId = int.isOngoing ? "url(#ongoingGrad)" : int.isAnomaly ? "url(#anomalyGrad)" : "url(#normalGrad)";
                                          const glowClass = int.isOngoing 
                                            ? "group-hover/day:drop-shadow-[0_2px_8px_rgba(52,211,153,0.45)]" 
                                            : int.isAnomaly 
                                              ? "group-hover/day:drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]" 
                                              : "group-hover/day:drop-shadow-[0_2px_8px_rgba(56,189,248,0.45)]";

                                          return (
                                            <rect
                                              key={idx}
                                              x={x - barWidth / 2}
                                              y={yEnd}
                                              width={barWidth}
                                              height={barHeight}
                                              fill={gradientId}
                                              rx={barWidth / 2}
                                              className={`transition-all duration-300 group-hover/day:brightness-105 ${glowClass}`}
                                            />
                                          );
                                        })}

                                        {/* Invisible Column Hotspot for Hover and Touch */}
                                        <rect
                                          x={x - 12}
                                          y={paddingTop}
                                          width={24}
                                          height={gridHeight}
                                          fill="transparent"
                                          className="cursor-pointer"
                                          onMouseEnter={() => {
                                            const maxEndDecimal = intervals.length > 0 ? Math.max(...intervals.map(i => i.endDecimal)) : 0;
                                            const topY = intervals.length > 0 
                                              ? paddingTop + ((endHour - Math.min(endHour, maxEndDecimal)) / range) * gridHeight
                                              : paddingTop + gridHeight / 2;
                                            setHoveredDay({ dayNum: d, intervals, x, y: topY });
                                          }}
                                          onMouseLeave={() => setHoveredDay(null)}
                                          onTouchStart={() => {
                                            const maxEndDecimal = intervals.length > 0 ? Math.max(...intervals.map(i => i.endDecimal)) : 0;
                                            const topY = intervals.length > 0 
                                              ? paddingTop + ((endHour - Math.min(endHour, maxEndDecimal)) / range) * gridHeight
                                              : paddingTop + gridHeight / 2;
                                            setHoveredDay({ dayNum: d, intervals, x, y: topY });
                                          }}
                                        />

                                        {/* Axis Tick labels */}
                                        <text
                                          x={x}
                                          y={chartHeight - 8}
                                          textAnchor="middle"
                                          className={`text-[9px] font-black text-slate-400 fill-slate-400 transition-colors ${
                                            intervals.length > 0 ? "group-hover/day:fill-sky-500 group-hover/day:font-black" : ""
                                          }`}
                                        >
                                          {d}
                                        </text>
                                      </g>
                                    );
                                  })}
                                </svg>

                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 lg:p-8">
            <h3 className="font-heading font-black text-slate-800 mb-1 text-lg drop-shadow-sm">Raccourcis</h3>
            <p className="text-xs text-slate-400 font-bold mb-6 uppercase tracking-widest">Actions fréquentes</p>
            
            <div className="space-y-3">
              <QuickActionLink 
                href="/employee/demandes?new=true&cat=ATTESTATION" 
                icon={FileText} 
                label="Attestation de Travail" 
              />
              <QuickActionLink 
                href="/employee/documents" 
                icon={RotateCcw} 
                label="Fiches de Paie" 
              />
              <QuickActionLink 
                href="/employee/profil" 
                icon={Fingerprint} 
                label="Informations Profil" 
              />
              <QuickActionLink 
                href="/employee/bons-de-sortie" 
                icon={ChevronRight} 
                label="Bons de Sortie" 
              />
            </div>
          </div>


        </div>

      </div>
    </div>
  );
}

const QuickActionLink = ({ href, icon: Icon, label }: any) => (
  <Link href={href} className="flex items-center justify-between p-4 rounded-[1.25rem] border border-white/50 bg-white/40 hover:bg-white hover:border-white hover:shadow-md transition-all group">
     <div className="flex items-center gap-3">
       <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-sky-600 transition-colors border border-slate-100">
         <Icon size={18} />
       </div>
       <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
     </div>
     <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </Link>
);
