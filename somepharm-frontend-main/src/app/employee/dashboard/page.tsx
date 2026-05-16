"use client";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { 
  Calendar, Clock, FileText, Fingerprint, Timer, 
  RotateCcw, Briefcase, ShieldAlert, ChevronRight, Megaphone,
  TrendingUp, TrendingDown, ArrowUpRight, Activity, CheckCircle2, XCircle, AlertCircle,
  Loader2, Plus
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUI } from "../../../context/UIContext";

// --- Premium Admin Panel Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, color = "teal" }: any) => {
  const colorClasses: Record<string, { bg: string, text: string }> = {
    teal: { bg: "bg-teal-50", text: "text-teal-600" },
    blue: { bg: "bg-sky-50", text: "text-sky-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600" },
  };

  const selectedColor = colorClasses[color] || colorClasses.teal;

  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
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
        <div className="bg-white/60 p-4 rounded-2xl text-teal-600 border border-white shadow-sm group-hover:scale-105 transition-transform">
          <Timer size={28} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 backdrop-blur-md p-6 lg:p-8 rounded-[1.5rem] border border-white shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <Clock className="text-teal-500 w-8 h-8" />
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
               className="w-full md:w-auto bg-teal-600 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
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
            <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-xl flex items-center gap-3 w-full md:w-auto">
               <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                 <CheckCircle2 size={20} />
               </div>
               <div>
                 <p className="text-emerald-800 font-bold text-sm">Journée Terminée</p>
                 <p className="text-emerald-600 text-xs font-medium">E: {pointage.heureEntree?.substring(0,5)} | S: {pointage.heureSortie?.substring(0,5)}</p>
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetchDashboardData(token);
    fetchPointageStatus(token);
    fetchAnnonces(token);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Premium Organic Header Section */}
      <header className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/30 border border-teal-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden mb-8">
        {/* Soft decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 border-l-4 border-teal-500 pl-5">
          <h1 className="text-3xl lg:text-4xl font-heading font-black italic text-slate-800 tracking-tight drop-shadow-sm">
            Bienvenue
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Aperçu de votre activité au {stats.dateDuJour || new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/employee/demandes?new=true&cat=CONGE" className="whitespace-nowrap bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2">
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
          color="teal"
        />
        <StatCard 
          title="Heure d'Entrée" 
          value={pointage?.heureEntree ? pointage.heureEntree.substring(0,5) : "--:--"} 
          subtitle={pointage?.heureEntree ? "Enregistrée" : "En attente"} 
          icon={ArrowUpRight} 
          color="blue"
        />
        <StatCard 
          title="Heure de Sortie" 
          value={pointage?.heureSortie ? pointage.heureSortie.substring(0,5) : "--:--"} 
          subtitle={pointage?.heureSortie ? "Enregistrée" : "Non pointée"} 
          icon={Clock} 
          color="purple"
        />
        <StatCard 
          title="Requêtes en cours" 
          value={(data.recentRequests || []).filter((r: any) => r.statutCycleVie?.includes('ATTENTE')).length || 0} 
          subtitle="En validation" 
          icon={FileText} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          <PunchWidget pointage={pointage} handlePointage={handlePointage} loadingPointage={loadingPointage} timeString={timeString} />
          
          {/* Recent Activity Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-white flex justify-between items-center bg-white/40">
              <div>
                <h3 className="font-heading font-black text-slate-800 text-lg drop-shadow-sm">Dernières Requêtes</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Suivi de vos dossiers</p>
              </div>
              <Link href="/employee/demandes" className="text-xs text-teal-600 font-bold uppercase tracking-widest hover:text-teal-700 flex items-center gap-1">
                Tout voir <ChevronRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-white/20 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-white">
                    <th className="p-4 pl-8">Type</th>
                    <th className="p-4">Détails</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 pr-8 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(data.recentRequests || []).length > 0 ? data.recentRequests.map((req: any, i: number) => {
                    const isDoc = req._group === 'DOCUMENT';
                    const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
                    const isRefused = req.statutCycleVie?.includes('REFUSE');
                    
                    const label = isDoc 
                      ? (req.typeDocument || "Document").replace(/_/g, " ").toLowerCase()
                      : (req.typeConge || "Congé").replace(/_/g, " ").toLowerCase();

                    return (
                    <tr key={i} className="border-b border-white/50 last:border-0 hover:bg-white/60 transition-colors">
                      <td className="p-4 pl-8">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm border border-white ${isDoc ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'}`}>
                          {isDoc ? <FileText size={12} /> : <Calendar size={12} />}
                          {isDoc ? 'Doc' : 'Congé'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-bold capitalize">{label}</td>
                      <td className="p-4 text-slate-500 font-bold">{new Date(req.dateSoumission).toLocaleDateString()}</td>
                      <td className="p-4 pr-8 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shadow-sm border border-white ${
                          isApproved ? 'bg-emerald-50 text-emerald-700' : 
                          isRefused ? 'bg-rose-50 text-rose-700' : 
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {isApproved ? <CheckCircle2 size={12} /> : isRefused ? <XCircle size={12} /> : <AlertCircle size={12} />}
                          {req.statutCycleVie.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  )}) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-400 text-sm font-bold italic">Aucune requête récente trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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

          <div className="bg-slate-900 rounded-[2rem] p-6 lg:p-8 text-white relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="text-xl font-heading font-black mb-2 drop-shadow-sm">Centre d'aide</h4>
            <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
              Besoin d'assistance avec vos outils digitaux ou vos requêtes RH ?
            </p>
            <button className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              Support Technique
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const QuickActionLink = ({ href, icon: Icon, label }: any) => (
  <Link href={href} className="flex items-center justify-between p-4 rounded-[1.25rem] border border-white/50 bg-white/40 hover:bg-white hover:border-white hover:shadow-md transition-all group">
     <div className="flex items-center gap-3">
       <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-teal-600 transition-colors border border-slate-100">
         <Icon size={18} />
       </div>
       <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
     </div>
     <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </Link>
);
