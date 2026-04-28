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
// ValidationDetailWorkspace is now handled by AdminLayout

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

  const handleAction = async (id: number, action: string, comment: string) => {
    // 🛡️ Reliability FIX: Pull fresh token directly from localStorage to avoid stale closure
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
        
        // 🔄 REFRESH: Fetch the queue again using the fresh token
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
        return status === "EN_ATTENTE_MANAGER" || status === "ATTENTE";
      }
      if (activeTab === "ARCHIVES") {
        return ["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ANNULE", "ANNULÉ"].includes(status);
      }
      return true;
    })
    .sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());

  return (
    <div className="p-10 bg-gray-50 min-h-screen relative">
      <div className="flex justify-between items-end mb-10">
        <div>
           <div className="bg-blue-600/10 text-blue-600 px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-200">
             HR Administration Portal
           </div>
           <h1 className="text-4xl font-black text-gray-800 italic uppercase leading-none">Validation & File d'attente</h1>
           <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Suivi global et validation finale des dossiers</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border shadow-sm rounded-2xl px-4 py-1.5">
               <Filter className="text-gray-400" size={16} />
               <select 
                 value={typeFilter}
                 onChange={(e) => setTypeFilter(e.target.value)}
                 className="bg-transparent outline-none font-black text-[10px] uppercase tracking-widest text-gray-700 py-2.5 cursor-pointer"
               >
                 <option value="ALL">Tous les Types</option>
                 <option value="CONGE">Congés</option>
                 <option value="DOCUMENT">Documents</option>
                 <option value="NUDGE">Rappels (Nudge)</option>
               </select>
            </div>
            <div className="relative w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Rechercher Matricule..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-white border shadow-sm rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm text-gray-700"
               />
            </div>
            <button 
              onClick={() => fetchData(token)}
              className="bg-white hover:bg-gray-50 text-blue-600 px-10 py-4 rounded-2xl border shadow-sm font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Clock size={16} /> Actualiser
            </button>
        </div>
      </div>

      <div className="flex gap-2 mb-10 bg-white p-2 rounded-3xl w-fit shadow-sm border">
        {[
          { id: "A_TRAITER", label: "À Traiter", icon: <Check size={16}/>, count: requests.filter(r => ["VALIDE_MANAGER", "EN_ATTENTE_RH"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, color: "text-blue-600", activeBg: "bg-blue-600 text-white" },
          { id: "EN_COURS", label: "En cours (Suivi)", icon: <Clock size={16}/>, count: requests.filter(r => ["EN_ATTENTE_MANAGER", "ATTENTE"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, color: "text-amber-600", activeBg: "bg-amber-600 text-white" },
          { id: "ARCHIVES", label: "Historique", icon: <AlertCircle size={16}/>, count: requests.filter(r => ["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ANNULE", "ANNULÉ"].includes(r.statutCycleVie?.toUpperCase()?.trim())).length, color: "text-gray-500", activeBg: "bg-gray-800 text-white" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
              activeTab === tab.id ? `${tab.activeBg} shadow-lg` : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.icon} {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[9px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
               {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b">
            <tr>
              <th className="px-10 py-6">ID & Type</th>
              <th className="px-10 py-6">Demandeur</th>
              <th className="px-10 py-6">État Actuel</th>
              <th className="px-10 py-6">Date Dépôt</th>
              <th className="px-10 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
               <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold animate-pulse">Initialisation...</td></tr>
            ) : filteredRequests.map((req) => (
                <tr 
                  key={req.idRequete} 
                  onClick={() => setActiveHRRequest(req)}
                  className="hover:bg-blue-50/30 cursor-pointer transition-all group"
                >
                <td className="px-10 py-8 text-sm font-black text-gray-800">
                   #{req.idRequete} <span className="ml-2 text-[10px] text-gray-400 font-bold uppercase">
                     {req.type === 'DOCUMENT' ? (req.typeDocument?.replace(/_/g, " ") || "DOCUMENT") :
                      req.type === 'CONGE' ? (req.typeConge?.nom || "CONGÉ") :
                      (req.typeDemande || "DOSSIER")}
                   </span>
                </td>
                <td className="px-10 py-8">
                  <p className="font-black text-gray-800 uppercase tracking-tight">{req.demandeur?.matricule}</p>
                </td>
                <td className="px-10 py-8">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${
                    req.statutCycleVie === "VALIDE_MANAGER" ? "bg-green-50 border-green-100 text-green-600" :
                    "bg-gray-50 border-gray-200 text-gray-500"
                  }`}>
                    {req.statutCycleVie.replace(/_/g, " ")}
                  </div>
                </td>
                <td className="px-10 py-8 text-xs font-bold text-gray-500">
                   {new Date(req.dateSoumission).toLocaleDateString()}
                </td>
                <td className="px-10 py-8 text-right">
                   <ChevronRight className="text-gray-300 group-hover:text-blue-600 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global Workspace is now handled in AdminLayout at the root level */}
    </div>
  );
}
