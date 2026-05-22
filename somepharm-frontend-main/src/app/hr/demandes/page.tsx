"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import DemandeModal from "./DemandeModal";
import { X, Check, AlertCircle, Download, FileText, Sparkles, Calendar, Clock, RefreshCw } from "lucide-react";

export default function DemandesPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [userSolde, setUserSolde] = useState<number | string>("--");
  
  const [refuseId, setRefuseId] = useState<string | null>(null);
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
         const taggedConges = (Array.isArray(conges) ? conges : []).map((c: any) => ({ ...c, _group: 'CONGE' }));
         allRequests.push(...taggedConges);
      }
      if (resDoc.ok) {
         const docs = await resDoc.json();
         const taggedDocs = (Array.isArray(docs) ? docs : []).map((d: any) => ({ ...d, _group: 'DOCUMENT' }));
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

  const handleCancel = async (id: string, isDoc: boolean) => {
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

  const handleUpdateStatus = async (id: string, newStatus: string, commentaire: string = "", isDoc: boolean) => {
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

  const handleDownload = async (idRequete: string) => {
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-10 rounded-[3.5rem]">
         <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl">
               <FileText size={40} />
            </div>
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                  Demandes <span className="text-indigo-400">Portal</span>
               </h1>
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  Historique & Initialisation des requêtes de congés ou documents
               </p>
            </div>
         </div>

         <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 px-6 py-4 rounded-[2rem] text-slate-300 font-bold text-xs uppercase tracking-wider backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            {user?.sub} <span className="text-indigo-400">({user?.role})</span>
         </div>
      </div>

      {/* STATS HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Solde de Congé Actuel</p>
          <p className="text-6xl font-black text-white flex items-baseline gap-2">
            {typeof userSolde === 'number' ? userSolde.toFixed(2) : userSolde} <span className="text-xl font-bold text-indigo-400 italic uppercase">Jours</span>
          </p> 
        </div>
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Dossiers Affichés</p>
          <p className="text-6xl font-black text-white flex items-baseline gap-2">
            {filteredAndSortedRequests.length} <span className="text-xl font-bold text-purple-400 italic uppercase">Dossiers</span>
          </p>
        </div>
      </div>

      {/* LIST TABLE CONTAINER */}
      <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_20px_rgba(99,102,241,0.05)] rounded-[3rem] overflow-hidden">
        
        {/* --- PREMIUM COMMAND CENTER --- */}
        <div className="p-10 bg-slate-950/50 border-b border-slate-800/80 relative">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
            
            {/* Title & Stats HUD */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"></div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                  HISTORIQUE DES DEMANDES
                </h2>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Flux de Données Actif</span>
                 </div>
                 <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full border border-slate-800">
                    {filteredAndSortedRequests.length} Dossiers Identifiés
                 </div>
              </div>
            </div>

            {/* Action & Filter HUD */}
            <div className="flex flex-col xl:flex-row items-center gap-6 w-full xl:w-auto">
              {(user?.role === "EMPLOYE" || user?.role === "MANAGER") && (
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="w-full xl:w-auto bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest shrink-0"
                >
                  + Initialiser une demande
                </button>
              )}

              {/* --- ADAPTIVE FILTER HUD --- */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-md p-2 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-800/80 w-full xl:w-auto">
                
                {/* Type Filter */}
                <div className="relative w-full sm:w-auto">
                  <select 
                    className="appearance-none bg-slate-950 border border-slate-800/80 text-white rounded-[1.5rem] pl-10 pr-8 py-3 font-black outline-none focus:border-indigo-500/30 text-[10px] uppercase tracking-widest transition-all cursor-pointer w-full"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">Toutes les demandes</option>
                    <option value="CONGE">🌴 Congés</option>
                    <option value="DOCUMENT">📄 Documents</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                     <AlertCircle size={14} />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative w-full sm:w-auto">
                  <select 
                    className="appearance-none bg-slate-950 border border-slate-800/80 text-white rounded-[1.5rem] pl-10 pr-8 py-3 font-black outline-none focus:border-indigo-500/30 text-[10px] uppercase tracking-widest transition-all cursor-pointer w-full"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">Tous les Statuts</option>
                    <option value="PENDING">🕒 Attente</option>
                    <option value="APPROVED">✅ Approuvés</option>
                    <option value="REJECTED">❌ Refusés</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
                     <Check size={14} />
                  </div>
                </div>

                {/* Sort Order */}
                <div className="relative w-full sm:w-auto">
                  <select 
                    className="appearance-none bg-indigo-600 text-slate-950 border border-indigo-500 rounded-[1.5rem] pl-10 pr-8 py-3 font-black outline-none text-[10px] uppercase tracking-widest transition-all cursor-pointer w-full"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="NEWEST" className="bg-slate-950 text-white">Plus récents</option>
                    <option value="OLDEST" className="bg-slate-950 text-white">Plus anciens</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-950 pointer-events-none">
                     <Download size={14} className="rotate-180" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/40 border-b border-slate-800/80 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-8">Détails de la Demande</th>
                <th className="p-8">Période / Motif</th>
                <th className="p-8">Statut</th>
                <th className="p-8 text-center">Action / Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAndSortedRequests.map((req: any) => {
                const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
                const isDoc = req._group === 'DOCUMENT';
                const isCancellable = !isApproved && !req.statutCycleVie.includes("REFUSE") && req.statutCycleVie !== "ANNULE" && req.statutCycleVie !== "ANNULÉ";

                return (
                <tr key={`${req._group}-${req.idRequete}`} className="hover:bg-indigo-500/5 transition-colors border-b border-slate-800/60">
                  
                  {/* DÉTAILS DE LA DEMANDE (Type + Employé) */}
                  <td className="p-8">
                    <div className="flex items-center gap-3 mb-1">
                       <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isDoc ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-indigo-500/10 border border-slate-800 text-indigo-300'}`}>
                          {isDoc ? 'DOCUMENT' : 'CONGÉ'}
                       </span>
                    </div>
                    <p className="font-black text-white capitalize text-base italic">
                      {isDoc 
                        ? req.typeDocument.replace(/_/g, ' ').toLowerCase() 
                        : req.typeConge.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    {(user?.role === "MANAGER" || user?.role === "RH_ADMIN" || user?.role === "SUPER_ADMIN") && (
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        De: <span className="text-indigo-400 font-black">{req.demandeurMatricule}</span>
                      </p>
                    )}
                  </td>

                  <td className="p-8">
                     {!isDoc ? (
                         <div className="text-sm font-black text-slate-200 mb-1 flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-400" />
                            {req.dateDebut} <span className="text-indigo-400 mx-1">→</span> {req.dateFin}
                         </div>
                     ) : req.typeDocument === 'BON_SORTIE' ? (
                         <div className="text-sm font-black text-slate-200 mb-1 flex items-center gap-2">
                            <Clock size={14} className="text-purple-400" />
                            {req.heureDebut} <span className="text-purple-400 mx-1">→</span> {req.heureFin}
                         </div>
                     ) : null}
                     <p className="text-[10px] font-bold text-slate-500 max-w-[200px] truncate uppercase tracking-tight" title={req.motif || req.description}>
                       {req.motif || req.description || "Aucune justification."}
                     </p>
                  </td>
                  
                  <td className="p-8">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                        isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                        req.statutCycleVie.includes('REFUSE') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                      }`}>
                        {req.statutCycleVie === "EN_ATTENTE_MANAGER" ? "⌛ Attente Manager" :
                         req.statutCycleVie === "EN_ATTENTE_RH" ? "⌛ Attente RH" :
                         req.statutCycleVie === "VALIDE_MANAGER" ? "🛡️ Validé Manager" :
                         req.statutCycleVie === "APPROUVE" ? "✅ Approuvé" : 
                         req.statutCycleVie === "REFUSE" ? "❌ Refusé" : req.statutCycleVie}
                      </span>
                      {req.commentaireAction && (
                        <span className="text-[9px] text-slate-500 font-bold italic mt-1 border-l-2 border-slate-800 pl-2">
                          Note: {req.commentaireAction}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-8 text-center flex flex-col justify-center items-center gap-2">
                    {/* Action Validation (Managers/RH view) */}
                    {user?.role === "MANAGER" && !isDoc && req.statutCycleVie === "EN_ATTENTE_MANAGER" && (
                      <div className="flex gap-2">
                        {req.demandeurMatricule?.trim().toLowerCase() !== user?.sub?.trim().toLowerCase() ? (
                          <>
                            <button onClick={() => handleUpdateStatus(req.idRequete, 'VALIDE_MANAGER', "", false)} className="bg-indigo-500/10 border border-slate-800 text-indigo-300 p-3 rounded-xl hover:bg-indigo-600 hover:text-slate-950 transition shadow-md"><Check size={16} /></button>
                            <button onClick={() => { setRefuseId(req.idRequete); setRefuseIsDoc(false); }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl hover:bg-rose-600 hover:text-white transition shadow-md"><X size={16} /></button>
                          </>
                        ) : (
                          <span className="text-[9px] font-black text-indigo-400 uppercase italic bg-indigo-500/10 border border-slate-800 px-2 py-1 rounded-md">Dossier Personnel</span>
                        )}
                      </div>
                    )}

                    {/* 📥 Download Button for Employee when APPROVED */}
                    {isApproved && (
                        <button 
                           onClick={() => handleDownload(req.idRequete)}
                           className="bg-slate-900 border border-slate-800/80 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-slate-950 transition shadow-md flex items-center gap-2"
                        >
                           <Download size={14} /> Générer
                        </button>
                    )}

                    {/* ❌ CANCEL BUTTON (Visible for anyone when their own request is still pending) */}
                    {isCancellable && (
                        <button 
                           onClick={() => handleCancel(req.idRequete, isDoc)}
                           className="text-rose-400 font-black text-[9px] uppercase tracking-widest hover:text-rose-300 hover:underline transition-all mt-2"
                        >
                           Annuler la demande
                        </button>
                    )}

                    {(!isApproved && !isCancellable && user?.role === "EMPLOYE") && (
                        <span className="text-slate-500 font-bold text-[10px] uppercase">En Cours</span>
                    )}
                  </td>

                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {refuseId && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-md rounded-[3rem] overflow-hidden animate-in zoom-in duration-200 backdrop-blur-xl">
            <div className="bg-rose-950/30 p-8 border-b border-rose-500/10 text-rose-400 flex items-center gap-4">
               <AlertCircle size={32} />
               <div>
                  <h3 className="font-black uppercase tracking-widest text-lg italic">Refuser le dossier</h3>
                  <p className="text-slate-400 text-xs font-bold">Un motif est obligatoire pour cette action.</p>
               </div>
            </div>
            <div className="p-8 space-y-6">
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Motif du refus</label>
               <textarea 
                 className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-medium text-slate-300 placeholder:text-slate-600 focus:border-rose-500 outline-none transition-all h-32 resize-none"
                 placeholder="Ex: Période de forte activité..."
                 value={refuseComment}
                 onChange={(e) => setRefuseComment(e.target.value)}
               />
               <div className="flex gap-4 pt-2">
                 <button onClick={() => {setRefuseId(null); setRefuseComment("");}} className="flex-1 bg-slate-800 text-slate-400 hover:text-white py-4 rounded-xl font-black uppercase text-xs transition">Annuler</button>
                 <button 
                   onClick={() => handleUpdateStatus(refuseId, 'REFUSE', refuseComment, refuseIsDoc)} 
                   disabled={!refuseComment.trim()}
                   className="flex-[2] bg-gradient-to-r from-rose-600 to-red-700 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:from-rose-500 hover:to-red-600 transition disabled:opacity-30"
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
