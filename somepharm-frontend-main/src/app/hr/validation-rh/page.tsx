"use client";
import { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Check, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search,
  ChevronRight
} from "lucide-react";
import { useUI } from "../../../context/UIContext";

export default function ValidationRHPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  
  const [activeTab, setActiveTab] = useState<"A_TRAITER" | "EN_COURS" | "ARCHIVES">("A_TRAITER");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const { setActiveHRRequest } = useUI();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchData(savedToken);
    }

    // Listen for global actions from the layout-level workspace
    const handleGlobalAction = (e: any) => {
      const { id, action, comment } = e.detail;
      handleAction(id, action, comment);
    };
    window.addEventListener("hr-action-triggered", handleGlobalAction);
    return () => window.removeEventListener("hr-action-triggered", handleGlobalAction);
  }, []);

  const fetchData = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/requetes/hr-queue`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("HR Queue Fetched Data:", data);
        setRequests(data);
      }
    } catch (err) {
      console.error("Queue Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string, comment: string) => {
    // Fresh token directly from localStorage to avoid stale closure
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("Votre session a expiré. Veuillez vous reconnecter.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/requetes/${id}/hr-action?action=${action}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ comment })
      });
      if (res.ok) {
        // Clear the active request to close the detail panel
        setActiveHRRequest(null);
        
        // Refresh the queue
        await fetchData(currentToken);
        
        alert("Action enregistrée avec succès !");
      } else {
        const errorText = await res.text();
        console.error("Validation Error:", errorText);
        alert("Erreur lors de la validation (" + res.status + ") : " + errorText);
      }
    } catch (err) {
      console.error("Action Error:", err);
      alert("Une erreur technique est survenue. Veuillez vérifier votre connexion au serveur.");
    }
  };

  const filteredRequests = requests
    .filter(req => {
      // Search by Matricule
      if (searchTerm && !req.demandeur?.matricule?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // Filter by Type
      if (typeFilter !== "ALL" && req.type !== typeFilter) return false;

      // Filter by Tab/Status
      const status = req.statutCycleVie?.toUpperCase()?.trim();
      if (activeTab === "A_TRAITER") {
        return status === "VALIDE_MANAGER" || status === "EN_ATTENTE_RH";
      }
      if (activeTab === "EN_COURS") {
        return status === "EN_ATTENTE_MANAGER" || status === "EN_ATTENTE_CHEF_DEPT" || status === "ATTENTE";
      }
      if (activeTab === "ARCHIVES") {
        return ["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ANNULE", "ANNULÉ"].includes(status);
      }
      return true;
    })
    .sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-3 border border-slate-800">
             HR Administration Portal
           </div>
           <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Validation & <span className="text-indigo-400">File d'attente</span></h1>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Suivi global et validation finale des dossiers</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-4 py-1.5">
               <Filter className="text-slate-500" size={16} />
               <select 
                 value={typeFilter}
                 onChange={(e) => setTypeFilter(e.target.value)}
                 className="bg-transparent outline-none font-black text-[10px] uppercase tracking-widest text-white py-2.5 cursor-pointer"
               >
                 <option value="ALL" className="bg-slate-900 text-white">Tous les Types</option>
                 <option value="CONGE" className="bg-slate-900 text-white">Congés</option>
                 <option value="DOCUMENT" className="bg-slate-900 text-white">Documents</option>
                 <option value="NUDGE" className="bg-slate-900 text-white">Rappels (Nudge)</option>
               </select>
            </div>
            <div className="relative w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 type="text" 
                 placeholder="Rechercher Matricule..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl outline-none focus:border-indigo-500/30 text-sm text-white placeholder:text-slate-500 transition-all font-bold"
               />
            </div>
            <button 
              onClick={() => fetchData(token)}
              className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:opacity-90 shadow-lg flex items-center gap-2"
            >
              <Clock size={16} /> Actualiser
            </button>
        </div>
      </div>

      <div className="flex gap-2 mb-10 bg-slate-950/60 p-2 rounded-3xl w-fit border border-slate-800/80 backdrop-blur-sm">
        {[
          { id: "A_TRAITER", label: "À Traiter", icon: <Check size={16}/>, count: requests.filter(r => ["VALIDE_MANAGER", "EN_ATTENTE_RH"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, activeBg: "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md font-black" },
          { id: "EN_COURS", label: "En cours (Suivi)", icon: <Clock size={16}/>, count: requests.filter(r => ["EN_ATTENTE_MANAGER", "EN_ATTENTE_CHEF_DEPT", "ATTENTE"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, activeBg: "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md font-black" },
          { id: "ARCHIVES", label: "Historique", icon: <AlertCircle size={16}/>, count: requests.filter(r => ["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ANNULE", "ANNULÉ"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, activeBg: "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md font-black" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id ? tab.activeBg : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
            }`}
          >
            {tab.icon} {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[9px] ${activeTab === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 border border-slate-800/80 text-indigo-400/85'}`}>
               {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[3rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950/30 text-indigo-400/70 text-[10px] uppercase font-black tracking-widest border-b border-slate-800/80">
            <tr>
              <th className="px-10 py-6">ID & Type</th>
              <th className="px-10 py-6">Demandeur</th>
              <th className="px-10 py-6">État Actuel</th>
              <th className="px-10 py-6">Date Dépôt</th>
              <th className="px-10 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
               <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold animate-pulse">Initialisation...</td></tr>
            ) : filteredRequests.map((req) => (
                <tr 
                  key={req.idRequete} 
                  onClick={() => setActiveHRRequest(req)}
                  className="hover:bg-indigo-500/5 cursor-pointer transition-all group"
                >
                <td className="px-10 py-8 text-sm font-black text-white">
                   #{req.idRequete} <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase">
                     {req.type === 'DOCUMENT' ? (req.typeDocument?.replace(/_/g, " ") || "DOCUMENT") :
                      req.type === 'CONGE' ? (req.typeConge?.nom || "CONGÉ") :
                      (req.typeDemande || "DOSSIER")}
                   </span>
                </td>
                <td className="px-10 py-8">
                  <p className="font-black text-slate-200 uppercase tracking-tight">{req.demandeur?.matricule}</p>
                </td>
                <td className="px-10 py-8">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${
                    req.statutCycleVie === "VALIDE_MANAGER" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    "bg-slate-900 border-slate-800/80 text-indigo-400"
                  }`}>
                    {req.statutCycleVie.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="px-10 py-8 text-xs font-bold text-slate-400">
                   {new Date(req.dateSoumission).toLocaleDateString()}
                </td>
                <td className="px-10 py-8 text-right">
                   <ChevronRight className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
