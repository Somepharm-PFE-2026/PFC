"use client";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { 
  Calendar, Clock, FileText, Fingerprint, Timer, 
  RotateCcw, Briefcase, ShieldAlert, ChevronRight, Megaphone
} from "lucide-react";
import NotificationCenter from "../../components/NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Internal Specialized Components ---

const CommunicationNudge = ({ annonces }: any) => {
  const importantUnread = annonces.filter((a: any) => 
    !a.isRead && 
    a.priority === 'URGENT' && 
    (new Date().getTime() - new Date(a.datePublication).getTime() > 24 * 60 * 60 * 1000)
  );

  if (importantUnread.length === 0) return null;

  return (
    <Link href="/employee/communication" className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-amber-100 transition-all">
       <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100 animate-pulse">
             <ShieldAlert size={28} />
          </div>
          <div>
             <h4 className="text-amber-900 font-black text-sm uppercase italic tracking-tighter">Action Requise</h4>
             <p className="text-amber-700 text-[10px] font-bold uppercase tracking-widest mt-1">Vous avez {importantUnread.length} communication(s) urgente(s) non lue(s) depuis +24h</p>
          </div>
       </div>
       <div className="p-3 bg-white rounded-xl shadow-sm text-amber-500 group-hover:translate-x-1 transition-transform">
          <ChevronRight size={20} />
       </div>
    </Link>
  );
};

const QuickActionBar = () => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 group hover:shadow-md transition-shadow">
     <div className="flex-1">
        <h4 className="text-gray-800 font-black text-sm italic uppercase tracking-tighter">Accès Rapide</h4>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Actions prioritaires pour votre autonomie</p>
     </div>
     <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/employee/demandes?new=true&cat=CONGE" className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2">
           <Calendar size={12} /> Demander un Congé
        </Link>
        <Link href="/employee/demandes?new=true&cat=ATTESTATION" className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center gap-2">
           <FileText size={12} /> Demander une Attestation
        </Link>
        <Link href="/employee/demandes" className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
           <RotateCcw size={12} /> Dernier Bulletin
        </Link>
     </div>
  </div>
);

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
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-1">Heure Locale Serveur</p>
          <h2 className="text-5xl font-black text-white tracking-tighter font-mono">{timeString}</h2>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-end z-10 w-full md:w-auto">
        {!pointage || (isExited && false) ? ( 
           <button 
             onClick={handlePointage} disabled={loadingPointage}
             className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_40px_-10px_#2563eb] hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-3"
           >
             <Fingerprint size={20} /> Pointer l'Entrée
           </button>
        ) : isEntered ? (
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-right hidden md:block">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Entrée validée à</p>
              <p className="text-white font-mono font-bold">{pointage.heureEntree?.substring(0,5)}</p>
            </div>
            <button 
              onClick={handlePointage} disabled={loadingPointage}
              className="w-full md:w-auto bg-amber-500 text-gray-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_40px_-10px_#f59e0b] hover:bg-amber-400 hover:scale-105 transition-all flex items-center gap-3"
            >
              <Fingerprint size={20} /> Pointer la Sortie
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 px-8 py-4 rounded-2xl flex items-center gap-4 w-full md:w-auto">
             <svg className="text-green-500 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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

export default function EmployeeDashboard() {
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
      if (res.ok) fetchPointageStatus(token);
    } catch (err) { console.error(err); } finally { setLoadingPointage(false); }
  };

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const data = stats.employeeData || {};

  if (loading) return <div className="p-8 animate-pulse text-gray-400 uppercase font-black tracking-widest">Chargement de votre espace...</div>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Bienvenue</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Votre situation au {stats.dateDuJour}</p>
        </div>
        <NotificationCenter />
      </header>

      <PunchWidget pointage={pointage} handlePointage={handlePointage} loadingPointage={loadingPointage} timeString={timeString} />
      
      <CommunicationNudge annonces={annonces} />

      <QuickActionBar />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden relative group">
           <div className="absolute -right-4 -bottom-4 text-blue-50/50 group-hover:scale-110 transition-transform duration-700"><Briefcase size={160} /></div>
           <div className="z-10">
              <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-2">Solde de Congés</p>
              <h3 className="text-6xl font-black text-blue-600 tracking-tighter">{data.soldeConges != null ? Number(data.soldeConges).toFixed(2) : "0.00"} <span className="text-xl">Jours</span></h3>
              <p className="text-gray-400 text-xs mt-2 font-medium italic">Disponibles immédiatement</p>
           </div>
           <div className="z-10 bg-blue-50 p-4 rounded-3xl">
              <Calendar size={32} className="text-blue-500" />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-6">Dernières Requêtes</p>
          <div className="space-y-4">
            {(data.recentRequests || []).length > 0 ? data.recentRequests.map((req: any, i: number) => {
              const isDoc = req._group === 'DOCUMENT';
              const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
              
              const label = isDoc 
                ? (req.typeDocument || "Document").replace(/_/g, " ").toLowerCase()
                : (req.typeConge || "Congé").replace(/_/g, " ").toLowerCase();

              return (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isDoc ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {isDoc ? 'DOCUMENT' : 'CONGÉ'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-gray-800 capitalize leading-none">
                    {label}
                  </span>
                </div>
                
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${
                  isApproved ? 'bg-green-50 border-green-100 text-green-600' : 
                  req.statutCycleVie.includes('REFUSE') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  {req.statutCycleVie === "EN_ATTENTE_MANAGER" ? "Attente Manager" :
                   req.statutCycleVie === "EN_ATTENTE_RH" ? "Attente RH" :
                   req.statutCycleVie === "VALIDE_MANAGER" ? "Validé Manager" :
                   req.statutCycleVie === "APPROUVE" ? "✅ Approuvé" : 
                   req.statutCycleVie === "REFUSE" ? "❌ Refusé" : req.statutCycleVie.replace(/_/g, " ")}
                </span>
              </div>
            )}) : <p className="text-gray-400 text-xs italic">Aucune requête récente</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
