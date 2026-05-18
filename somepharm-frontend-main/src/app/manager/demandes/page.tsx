"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import DemandeModal from "./DemandeModal";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useUI } from "../../../context/UIContext";
import { 
  X, 
  Check, 
  AlertCircle, 
  Download, 
  Filter, 
  SortAsc, 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Clock,
  Paperclip,
  Trash2,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function DemandesPage() {
  const { addToast } = useUI();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [userSolde, setUserSolde] = useState<number | string>("--");
  
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [refuseIsDoc, setRefuseIsDoc] = useState(false);
  
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean, id: string, isDoc: boolean } | null>(null);
  
  // Filtering & Sorting State
  const [filterType, setFilterType] = useState("ALL"); 
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");

  const [initialCategory, setInitialCategory] = useState("CONGE");

  const [responseRequest, setResponseRequest] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      const decoded: any = jwtDecode(savedToken);
      let role = decoded.role;
      if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
      setUser({ ...decoded, role });
      fetchData(savedToken, decoded.role);

      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
          const cat = params.get("cat");
          if (cat) setInitialCategory(cat);
          setIsModalOpen(true);
      }
    }
  }, []);

  const fetchData = async (t: string, role: string) => {
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
         allRequests.push(...conges.map((c: any) => ({ ...c, _group: 'CONGE' })));
      }
      if (resDoc.ok) {
         const docs = await resDoc.json();
         allRequests.push(...docs.filter((d: any) => d.typeDocument !== 'BON_SORTIE').map((d: any) => ({ ...d, _group: 'DOCUMENT' })));
      }

      setRequests(allRequests);

      if (resProfile.ok) {
        const data = await resProfile.json();
        setUserSolde(data.soldeConges ?? 0);
      }
    } catch (err) { console.error(err); }
  };

  const filteredAndSortedRequests = requests
    .filter(req => {
      if (filterType !== "ALL" && req._group !== filterType) return false;
      if (filterStatus !== "ALL") {
        const status = req.statutCycleVie;
        if (filterStatus === "PENDING" && !status.includes("EN_ATTENTE") && !status.includes("VALIDE_MANAGER") && status !== "ATTENTE") return false;
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

  const handleCancel = async () => {
    if (!cancelDialog) return;
    const { id, isDoc } = cancelDialog;
    try {
      const baseUrl = isDoc ? "http://localhost:8080/api/demandes-documents" : "http://localhost:8080/api/demandes";
      const res = await fetch(`${baseUrl}/${id}/annuler`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        addToast("success", "Demande annulée avec succès");
        fetchData(token, user?.role);
        setCancelDialog(null);
      } else {
        addToast("error", "Erreur lors de l'annulation");
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
        addToast("success", "Statut mis à jour");
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
              addToast("success", "Téléchargement lancé");
          } else {
              addToast("error", "Erreur: Document non disponible");
          }
      } catch (err) { console.error(err); }
  }

  const handleResponseSubmit = async () => {
    if (!responseRequest) return;
    setIsSubmittingResponse(true);
    
    try {
      const formData = new FormData();
      if (responseFile) formData.append("file", responseFile);
      formData.append("comment", responseText);

      const res = await fetch(`http://localhost:8080/api/requetes/${responseRequest.idRequete}/upload-justificatif`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        addToast("success", "Réponse envoyée avec succès");
        setResponseRequest(null);
        setResponseText("");
        setResponseFile(null);
        fetchData(token, user?.role);
      } else {
        addToast("error", "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur technique");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">Gestion des Demandes</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez et gérez vos requêtes RH</p>
        </div>
        {(user?.role === "EMPLOYE" || user?.role === "MANAGER") && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-teal-700 active:scale-[0.97] transition-all"
          >
            <Plus size={18} />
            <span>Nouvelle Demande</span>
          </button>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Solde de Congé</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">
              {typeof userSolde === 'number' ? userSolde.toFixed(1) : userSolde}
            </span>
            <span className="text-slate-400 font-medium text-sm italic">Jours</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Demandes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-slate-900">{filteredAndSortedRequests.length}</span>
            <span className="text-slate-400 font-medium text-sm italic">Dossiers</span>
          </div>
        </div>
        {requests.some(r => r.statutCycleVie === "ATTENTE") && (
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-amber-900 font-bold text-sm">Action Requise</p>
              <p className="text-amber-700 text-xs font-medium">{requests.filter(r => r.statutCycleVie === "ATTENTE").length} demande(s) en suspens</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Content Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Command Bar */}
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <h2 className="font-heading font-bold text-slate-800">Historique</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <select 
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">Tous les types</option>
                <option value="CONGE">🌴 Congés</option>
                <option value="DOCUMENT">📄 Documents</option>
              </select>

              <select 
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">🕒 En attente</option>
                <option value="APPROVED">✅ Approuvés</option>
                <option value="REJECTED">❌ Refusés</option>
              </select>

              <select 
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="NEWEST">Plus récents</option>
                <option value="OLDEST">Plus anciens</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Demande</th>
                <th className="px-6 py-4">Période / Motif</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedRequests.length > 0 ? filteredAndSortedRequests.map((req: any) => {
                const isApproved = req.statutCycleVie === 'APPROUVE' || req.statutCycleVie === 'APPROUVÉ';
                const isDoc = req._group === 'DOCUMENT';
                const isCancellable = !isApproved && !req.statutCycleVie.includes("REFUSE") && req.statutCycleVie !== "ANNULE" && req.statutCycleVie !== "ANNULÉ";

                return (
                <tr key={`${req._group}-${req.idRequete}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isDoc ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {isDoc ? 'Doc' : 'Congé'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 capitalize">
                        {(isDoc ? req.typeDocument : req.typeConge).replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                     {!isDoc ? (
                         <div className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                            {req.dateDebut} <ChevronRight size={12} className="text-slate-300" /> {req.dateFin}
                         </div>
                     ) : null}
                     <p className="text-xs text-slate-500 max-w-[180px] lg:max-w-[240px] truncate" title={req.motif || req.description}>
                       {req.motif || req.description || "Aucun motif spécifié."}
                     </p>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                        req.statutCycleVie === 'ATTENTE' ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                        req.statutCycleVie.includes('REFUSE') ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                        req.statutCycleVie.startsWith('ANNUL') ? 'bg-slate-50 border-slate-200 text-slate-400' :
                        'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {req.statutCycleVie === "EN_ATTENTE_MANAGER" ? "Attente Manager" :
                         req.statutCycleVie === "EN_ATTENTE_CHEF_DEPT" ? "Attente Dept Head" :
                         req.statutCycleVie === "EN_ATTENTE_RH" ? "Attente RH" :
                         req.statutCycleVie === "VALIDE_MANAGER" ? "Validé Manager" :
                         req.statutCycleVie === "APPROUVE" ? "Approuvé" : 
                         req.statutCycleVie === "ATTENTE" ? "Action Requise" :
                         req.statutCycleVie.startsWith("ANNUL") ? "Annulée" :
                         req.statutCycleVie === "REFUSE" ? "Refusé" : req.statutCycleVie.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isApproved && (
                          <button 
                             onClick={() => handleDownload(req.idRequete)}
                             className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm group-hover:scale-105"
                             title="Télécharger"
                          >
                             <Download size={16} />
                          </button>
                      )}
                      {req.statutCycleVie === 'ATTENTE' && (
                          <button 
                             onClick={() => setResponseRequest(req)}
                             className="px-3 py-1.5 bg-amber-500 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-amber-600 transition-all shadow-sm"
                          >
                             Répondre
                          </button>
                      )}
                      {isCancellable && (
                          <button 
                             onClick={() => setCancelDialog({ isOpen: true, id: req.idRequete, isDoc })}
                             className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                             title="Annuler"
                          >
                             <Trash2 size={16} />
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Aucune demande ne correspond à vos critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refusal Modal */}
      <Modal isOpen={!!refuseId} onClose={() => setRefuseId(null)} title="Motif du Refus">
        <div className="space-y-4">
           <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
             <AlertCircle className="text-rose-600 shrink-0" size={20} />
             <p className="text-rose-800 text-xs font-semibold">Un motif est obligatoire pour refuser cette demande.</p>
           </div>
           <textarea 
             className="w-full bg-white border border-slate-200 rounded-xl p-4 font-medium text-slate-700 focus:border-rose-500 outline-none min-h-[120px] resize-none transition-all"
             placeholder="Ex: Période de forte activité, justificatif incomplet..."
             value={refuseComment}
             onChange={(e) => setRefuseComment(e.target.value)}
           />
           <div className="flex gap-3 pt-2">
             <button onClick={() => setRefuseId(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">Annuler</button>
             <button 
               onClick={() => handleUpdateStatus(refuseId!, 'REFUSE', refuseComment, refuseIsDoc)} 
               disabled={!refuseComment.trim()}
               className="flex-[2] bg-rose-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
             >
               Confirmer le Refus
             </button>
           </div>
        </div>
      </Modal>

      {/* Response Modal */}
      <Modal isOpen={!!responseRequest} onClose={() => setResponseRequest(null)} title="Réponse RH">
        {responseRequest && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Message RH</p>
              <p className="text-sm font-medium text-slate-700 italic">"{responseRequest.commentaireAction || "Merci de nous fournir des informations complémentaires."}"</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Votre Réponse</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl p-4 font-medium text-slate-700 focus:border-teal-500 outline-none min-h-[100px] resize-none transition-all"
                placeholder="Détaillez ici les informations demandées..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Justificatif (PDF, Image)</label>
              <div className="relative group border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer">
                <input 
                  type="file" 
                  onChange={(e) => setResponseFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Paperclip className="text-slate-400 group-hover:text-teal-600 transition-colors" size={24} />
                  <p className="text-xs font-semibold text-slate-500">{responseFile ? responseFile.name : "Cliquez pour attacher un fichier"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setResponseRequest(null)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Annuler</button>
              <button 
                onClick={handleResponseSubmit}
                disabled={isSubmittingResponse || !responseText.trim()}
                className="flex-[2] flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-teal-700 transition disabled:opacity-50"
              >
                {isSubmittingResponse ? <Loader2 size={18} className="animate-spin" /> : null}
                <span>Soumettre</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Dialog */}
      <ConfirmDialog 
        isOpen={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        onConfirm={handleCancel}
        title="Annuler la demande"
        description="Voulez-vous vraiment annuler cette demande ? Cette action est irréversible."
        isDestructive={true}
        confirmText="Annuler la demande"
      />

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