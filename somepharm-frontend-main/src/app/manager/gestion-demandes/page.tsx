"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, XCircle, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useUI } from "../../../context/UIContext";
import Modal from "../../../components/ui/Modal";

export default function ValidationManagerPage() {
  const router = useRouter();
  const { addToast } = useUI();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refusal State
  const [refuseId, setRefuseId] = useState<string | null>(null);
  const [refuseComment, setRefuseComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
        const decoded: any = jwtDecode(token);
        let role = decoded.role;
        if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
        setCurrentUser({ ...decoded, role });
    } catch (e) {
        console.error("Token decode error", e);
    }

    fetchPendingRequests(token);
  }, [router]);

  const fetchPendingRequests = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/requetes/manager-queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let pending = await res.json();
        
        // SORT BY URGENCY FIRST
        pending.sort((a: any, b: any) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime();
        });

        setDemandes(pending);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, commentaire: string = "") => {
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/api/requetes/${id}/manager-validate`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
           action: status,
           comment: commentaire
        })
      });

      if (res.ok) {
        setDemandes(demandes.filter((d) => d.idRequete !== id));
        setRefuseId(null);
        setRefuseComment("");
        addToast("success", `Demande ${status === 'VALIDE_MANAGER' ? 'approuvée' : 'refusée'} avec succès`);
      } else {
        const err = await res.text();
        addToast("error", `Erreur: ${err}`);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur technique");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="border-b border-slate-100 pb-6">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">Validation Équipe</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Niveau 1 (Manager)</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
        {(demandes.length === 0) ? (
           <div className="text-center py-20 animate-in zoom-in-95 duration-500">
             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckSquare size={32} className="text-slate-300" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucune demande en attente</p>
             <p className="text-slate-400 text-xs mt-2">Votre équipe est à jour !</p>
           </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div 
                key={demande.idRequete} 
                className={`border rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all group
                  ${demande.urgent 
                    ? 'border-rose-200 bg-rose-50/30' 
                    : 'border-slate-100 bg-white hover:border-teal-200 hover:shadow-md'}`}
              >
                
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      demande.statutCycleVie.startsWith('ANNUL') ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                      demande.urgent ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-700 border border-teal-100'
                    }`}>
                      {demande.statutCycleVie === "EN_ATTENTE_MANAGER" ? "⌛ Attente Manager" :
                       demande.statutCycleVie === "EN_ATTENTE_CHEF_DEPT" ? "🛡️ Attente Dept Head" :
                       demande.statutCycleVie.startsWith('ANNUL') ? "⚪ Annulée" :
                       demande.type === 'CONGE' ? (demande.typeConge || 'CONGÉ') : 
                       demande.type === 'DOCUMENT' ? (demande.typeDocument?.replace(/_/g, ' ') || 'DOCUMENT') : 
                       'DEMANDE'}
                    </span>
                    {demande.urgent && (
                      <span className="bg-rose-500 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1.5 shadow-sm">
                        <AlertTriangle size={12} /> URGENT
                      </span>
                    )}
                    <span className="text-sm font-heading font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
                      {demande.demandeurMatricule}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    {demande.type === 'CONGE' 
                      ? `Période: ${demande.dateDebut} au ${demande.dateFin}`
                      : demande.type === 'DOCUMENT' && demande.typeDocument === 'BON_SORTIE'
                      ? `Sortie: ${demande.heureDebut} → ${demande.heureFin}`
                      : `Soumis le: ${new Date(demande.dateSoumission).toLocaleDateString()}`
                    }
                  </p>
                  <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500">
                       <span className="font-bold text-slate-700">Note:</span> {demande.description || demande.motif || "Pas de description fournie."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                  {/* Status Check: If Cancelled or Refused, show badge only */}
                  {demande.statutCycleVie === "ANNULÉ" || demande.statutCycleVie === "ANNULE" ? (
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-6 py-3 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                       <XCircle size={16} /> Demande Annulée
                    </span>
                  ) : demande.demandeurMatricule?.trim().toLowerCase() !== currentUser?.sub?.trim().toLowerCase() ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(demande.idRequete, "VALIDE_MANAGER")}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> Approuver
                      </button>
                      <button 
                        onClick={() => { setRefuseId(demande.idRequete); }}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 px-6 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Refuser
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-50 px-4 py-3 rounded-xl border border-teal-100 flex justify-center text-center">
                      Dossier Personnel (RH)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- REFUSAL MODAL --- */}
      <Modal
        isOpen={!!refuseId}
        onClose={() => { setRefuseId(null); setRefuseComment(""); }}
        title="Motif du Refus"
      >
        <div className="space-y-4 text-slate-900">
           <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 text-rose-700 mb-6">
             <AlertTriangle size={20} className="shrink-0 mt-0.5" />
             <div>
               <p className="text-sm font-bold">Justification requise</p>
               <p className="text-xs mt-1">Cette note sera visible par l'employé et le service RH pour justifier ce refus.</p>
             </div>
           </div>
           
           <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Commentaire</label>
           <textarea 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-teal-500 focus:bg-white outline-none transition-all h-32 resize-none"
             placeholder="Expliquez pourquoi cette demande est refusée..."
             value={refuseComment}
             onChange={(e) => setRefuseComment(e.target.value)}
           />
           
           <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
             <button 
               onClick={() => {setRefuseId(null); setRefuseComment("");}} 
               className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
             >
               Annuler
             </button>
             <button 
               onClick={() => {
                 if (refuseId) handleUpdateStatus(refuseId, 'REFUSE', refuseComment);
               }} 
               disabled={!refuseComment.trim() || isSubmitting}
               className="w-full sm:w-auto bg-rose-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
             >
               {isSubmitting ? "Traitement..." : "Confirmer le Refus"}
             </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}