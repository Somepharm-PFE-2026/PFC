"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import DemandeModal from "./DemandeModal";
import { X, Check, AlertCircle, Download } from "lucide-react";

export default function DemandesPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [userSolde, setUserSolde] = useState<number | string>("--");
  
  const [refuseId, setRefuseId] = useState<number | null>(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [refuseIsDoc, setRefuseIsDoc] = useState(false);
  
  // Filtering & Sorting State
  const [filterType, setFilterType] = useState("ALL"); // ALL, CONGE, DOCUMENT
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, PENDING, APPROVED, REJECTED
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST, OLDEST

  // URL Parameter Handling for Quick Actions
  const [initialCategory, setInitialCategory] = useState("CONGE");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      const decoded: any = jwtDecode(savedToken);
      let role = decoded.role;
      if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
      setUser({ ...decoded, role });
      fetchData(savedToken, decoded.role);

      // Check URL for ?new=true&cat=...
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
          const cat = params.get("cat");
          if (cat) setInitialCategory(cat);
          setIsModalOpen(true);
      }
    }
  }, []);

  const fetchData = async (t: string, role: string) => {
    // 💡 Separation of Concerns: History page should show PERSONAL files for Managers, 
    // while Team Validation is handled in its own tab. Only RH Sees 'all' here.
    const endpointConge = role === "RH_ADMIN" || role === "SUPER_ADMIN" || role === "HR_MANAGER" ? "/api/demandes/all" : "/api/demandes/me";
    const endpointDoc = role === "RH_ADMIN" || role === "SUPER_ADMIN" || role === "HR_MANAGER" ? "/api/demandes-documents/all" : "/api/demandes-documents/me";

    try {
      const [resConge, resDoc, resProfile] = await Promise.all([
        fetch(`http://localhost:8080${endpointConge}`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`http://localhost:8080${endpointDoc}`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`http://localhost:8080/api/utilisateurs/me`, { headers: { Authorization: `Bearer ${t}` } })
      ]);

      let allRequests = [];
      if (resConge.ok) {
         const conges = await resConge.json();
         const taggedConges = conges.map((c: any) => ({ ...c, _group: 'CONGE' }));
         allRequests.push(...taggedConges);
      }
      if (resDoc.ok) {
         const docs = await resDoc.json();
         const filteredDocs = docs.filter((d: any) => d.typeDocument !== 'BON_SORTIE');
         const taggedDocs = filteredDocs.map((d: any) => ({ ...d, _group: 'DOCUMENT' }));
         allRequests.push(...taggedDocs);
      }

      setRequests(allRequests);

      if (resProfile.ok) {
        const data = await resProfile.json();
        setUserSolde(data.soldeConges ?? 0);
      }
    } catch (err) { console.error(err); }
  };

  // --- Logic for Filtering and Sorting ---
  const filteredAndSortedRequests = requests
    .filter(req => {
      // 1. Type Filter
      if (filterType !== "ALL" && req._group !== filterType) return false;
      
      // 2. Status Filter
      if (filterStatus !== "ALL") {
        const status = req.statutCycleVie;
        if (filterStatus === "PENDING" && !status.includes("EN_ATTENTE") && !status.includes("VALIDE_MANAGER")) return false;
        if (filterStatus === "APPROVED" && !status.includes("APPROUV")) return false;
        if (filterStatus === "REJECTED" && !status.includes("REFUSE")) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dateSoumission).getTime();
      const dateB = new Date(b.dateSoumission).getTime();
      return sortOrder === "NEWEST" ? dateB - dateA : dateA - dateB;
    });

  const handleCancel = async (id: number, isDoc: boolean) => {
    if (!confirm("Voulez-vous vraiment annuler cette demande ?")) return;
    try {
      const baseUrl = isDoc ? "http://localhost:8080/api/demandes-documents" : "http://localhost:8080/api/demandes";
      const res = await fetch(`${baseUrl}/${id}/annuler`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData(token, user?.role);
      } else {
        const err = await res.text();
        alert("Erreur: " + err);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id: number, newStatus: string, commentaire: string = "", isDoc: boolean) => {
    try {
      const baseUrl = isDoc ? "http://localhost:8080/api/demandes-documents" : "http://localhost:8080/api/demandes";
      const res = await fetch(`${baseUrl}/${id}/statut?statut=${newStatus}&commentaire=${encodeURIComponent(commentaire)}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setRefuseId(null);
        setRefuseComment("");
        fetchData(token, user?.role);
      }
    } catch (err) { console.error(err); }
  };

  const handleDownload = async (idRequete: number) => {
      try {
          const res = await fetch(`http://localhost:8080/api/documents/download/${idRequete}`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = "Document_Somepharm.pdf";
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
          } else {
              alert("Erreur de téléchargement. La demande n'est peut-être pas encore approuvée.");
          }
      } catch (err) {
          console.error(err);
      }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-gray-800 italic uppercase">Somepharm Portal</h1>
        <div className="bg-white shadow-sm border px-6 py-2 rounded-2xl font-bold text-blue-600">
          {user?.sub} ({user?.role})
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-blue-600">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4">Solde de Congé Actuel</p>
          <p className="text-7xl font-black text-gray-900 flex items-baseline gap-2">
            {typeof userSolde === 'number' ? userSolde.toFixed(2) : userSolde} <span className="text-2xl font-bold text-gray-300 italic uppercase">Jours</span>
          </p> 
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-purple-500">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4">Dossiers Affichés</p>
          <p className="text-7xl font-black text-gray-800">{filteredAndSortedRequests.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100/50">
        
        {/* --- PREMIUM COMMAND CENTER --- */}
        <div className="p-10 bg-gradient-to-br from-gray-50 to-white border-b relative">
          <div className="flex flex-col xl:flex-row justify-between items-start gap-10">
            
            {/* Title & Stats HUD */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">
                  HISTORIQUE
                </h2>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flux de Données Actif</span>
                 </div>
                 <div className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full">
                    {filteredAndSortedRequests.length} Dossiers Identifiés
                 </div>
              </div>
            </div>

            {/* Action & Filter HUD (Unified Row) */}
            <div className="flex flex-col xl:flex-row items-center gap-6 w-full xl:w-auto">
              {(user?.role === "EMPLOYE" || user?.role === "MANAGER") && (
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="group relative w-full xl:w-auto bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 overflow-hidden shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2 tracking-[0.1em] text-[10px] uppercase">
                    + Initialiser une demande
                  </span>
                </button>
              )}

              {/* --- ADAPTIVE FILTER HUD --- */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-inner w-full md:w-auto">
                
                {/* Type Filter */}
                <div className="group relative w-full sm:w-auto">
                  <select 
                    className="appearance-none bg-white border border-gray-100 rounded-[1.5rem] pl-10 pr-8 py-3 font-black text-gray-700 outline-none focus:ring-2 ring-blue-500/20 text-[10px] uppercase tracking-widest transition-all hover:bg-gray-50 cursor-pointer shadow-sm w-full"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">Toutes les demandes</option>
                    <option value="CONGE">🌴 Congés</option>
                    <option value="DOCUMENT">📄 Documents</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors">
                     <AlertCircle size={14} />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="group relative">
                  <select 
                    className="appearance-none bg-white border border-gray-100 rounded-[1.5rem] pl-10 pr-8 py-3 font-black text-gray-700 outline-none focus:ring-2 ring-purple-500/20 text-[10px] uppercase tracking-widest transition-all hover:bg-gray-50 cursor-pointer shadow-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">Tous les Statuts</option>
                    <option value="PENDING">🕒 Attente</option>
                    <option value="APPROVED">✅ Approuvés</option>
                    <option value="REJECTED">❌ Refusés</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-600 transition-colors">
                     <Check size={14} />
                  </div>
                </div>

                {/* Sort Order */}
                <div className="group relative">
                  <select 
                    className="appearance-none bg-gray-900 border border-gray-800 rounded-[1.5rem] pl-10 pr-8 py-3 font-black text-white outline-none focus:ring-2 ring-white/10 text-[10px] uppercase tracking-widest transition-all hover:bg-black cursor-pointer shadow-xl"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="NEWEST">Plus récents</option>
                    <option value="OLDEST">Plus anciens</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                     <Download size={14} className="rotate-180" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-[11px] uppercase font-black border-b">
            <tr>
              <th className="p-8">Détails de la Demande</th>
              <th className="p-8">Période / Motif</th>
              <th className="p-8">Statut</th>
              <th className="p-8 text-center">Action / Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAndSortedRequests.map((req: any) => {
              const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
              const isDoc = req._group === 'DOCUMENT';
              const isCancellable = !isApproved && !req.statutCycleVie.includes("REFUSE") && req.statutCycleVie !== "ANNULE" && req.statutCycleVie !== "ANNULÉ";

              return (
              <tr key={`${req._group}-${req.idRequete}`} className="hover:bg-blue-50/30 transition-colors">
                
                {/* DÉTAILS DE LA DEMANDE (Type + Employé) */}
                <td className="p-8">
                  <div className="flex items-center gap-3 mb-1">
                     <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isDoc ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isDoc ? 'DOCUMENT' : 'CONGÉ'}
                     </span>
                  </div>
                  <p className="font-black text-gray-900 capitalize">
                    {isDoc 
                      ? req.typeDocument.replace(/_/g, ' ').toLowerCase() 
                      : req.typeConge.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  {(user?.role === "MANAGER" || user?.role === "RH_ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "HR_MANAGER") && (
                    <p className="text-xs text-gray-500 font-bold mt-1">
                      De: <span className="text-blue-600 font-black">{req.demandeurMatricule}</span>
                    </p>
                  )}
                </td>

                <td className="p-8">
                   {!isDoc ? (
                       <div className="text-sm font-black text-gray-800 mb-1">
                          {req.dateDebut} <span className="text-blue-500 mx-1">→</span> {req.dateFin}
                       </div>
                   ) : null}
                   <p className="text-[10px] font-bold text-gray-400 max-w-[200px] truncate uppercase tracking-tight" title={req.motif || req.description}>
                     {req.motif || req.description || "Aucune justification."}
                   </p>
                </td>
                
                <td className="p-8">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                      isApproved ? 'bg-green-50 border-green-200 text-green-700' : 
                      req.statutCycleVie.includes('REFUSE') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {req.statutCycleVie === "EN_ATTENTE_MANAGER" ? "⌛ Attente Manager" :
                       req.statutCycleVie === "EN_ATTENTE_RH" ? "⌛ Attente RH" :
                       req.statutCycleVie === "VALIDE_MANAGER" ? "🛡️ Validé Manager" :
                       req.statutCycleVie === "APPROUVE" ? "✅ Approuvé" : 
                       req.statutCycleVie === "REFUSE" ? "❌ Refusé" : req.statutCycleVie}
                    </span>
                    {req.commentaireAction && (
                      <span className="text-[9px] text-gray-400 font-bold italic mt-1 border-l-2 border-gray-200 pl-2">
                        Note: {req.commentaireAction}
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-8 text-center flex justify-center gap-2">
                  {/* Action Validation (Managers/RH view) but keep in mind that the new RH Validation page will handle RH validations, this is mostly for the employee's history. But since we use one component, let's keep basic Manager controls here for leaves. Document requests skip Manager so they only show here as EN_ATTENTE_RH */}
                  {user?.role === "MANAGER" && !isDoc && req.statutCycleVie === "EN_ATTENTE_MANAGER" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(req.idRequete, 'VALIDE_MANAGER', "", false)} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-md"><Check size={16} /></button>
                      <button onClick={() => { setRefuseId(req.idRequete); setRefuseIsDoc(false); }} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition shadow-md"><X size={16} /></button>
                    </div>
                  )}

                  {/* 📥 Download Button for Employee when APPROVED */}
                  {isApproved && (isDoc || !isDoc) && (
                      <button 
                         onClick={() => handleDownload(req.idRequete)}
                         className="bg-gray-900 border border-gray-800 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-md flex items-center gap-2"
                      >
                         <Download size={14} className="text-blue-400" /> Générer
                      </button>
                  )}

                  {/* ❌ CANCEL BUTTON (Visible for anyone when their own request is still pending) */}
                  {isCancellable && (user?.role === "EMPLOYE" || user?.role === "MANAGER" || user?.role === "RH_ADMIN" || user?.role === "HR_MANAGER" || user?.role === "SUPER_ADMIN") && (
                      <button 
                         onClick={() => handleCancel(req.idRequete, isDoc)}
                         className="text-red-500 font-black text-[9px] uppercase tracking-widest hover:text-red-700 hover:underline transition-all mt-2"
                      >
                         Annuler la demande
                      </button>
                  )}

                  {(!isApproved && !isCancellable && user?.role === "EMPLOYE") && (
                      <span className="text-gray-300 font-bold text-[10px] uppercase">En Attente</span>
                  )}
                </td>

              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {refuseId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-red-50 animate-in zoom-in duration-200">
            <div className="bg-red-600 p-8 text-white flex items-center gap-4">
               <AlertCircle size={32} />
               <div>
                  <h3 className="font-black uppercase tracking-widest text-lg italic">Refuser le dossier</h3>
                  <p className="text-red-100 text-xs font-bold">Un motif est obligatoire pour cette action.</p>
               </div>
            </div>
            <div className="p-8 space-y-4">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Motif du refus</label>
               <textarea 
                 className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 focus:border-red-500 outline-none transition-all h-32 resize-none"
                 placeholder="Ex: Période de forte activité..."
                 value={refuseComment}
                 onChange={(e) => setRefuseComment(e.target.value)}
               />
               <div className="flex gap-4 pt-2">
                 <button onClick={() => {setRefuseId(null); setRefuseComment("");}} className="flex-1 px-6 py-4 rounded-xl font-black text-gray-400 uppercase text-xs hover:bg-gray-100 transition">Annuler</button>
                 <button 
                   onClick={() => handleUpdateStatus(refuseId, 'REFUSE', refuseComment, refuseIsDoc)} 
                   disabled={!refuseComment.trim()}
                   className="flex-[2] bg-red-600 text-white px-6 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-red-700 transition disabled:opacity-30"
                 >
                   Confirmer
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
      <DemandeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchData(token, user?.role)} 
        token={token} 
        initialCategory={initialCategory}
      />
    </div>
  );
}