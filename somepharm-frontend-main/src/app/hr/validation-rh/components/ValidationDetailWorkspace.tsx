"use client";
import React, { useState, useEffect } from "react";
import { useUI } from "../../../../context/UIContext";
import { 
  User, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Info,
  Download
} from "lucide-react";
import LiveChronometer from "./LiveChronometer";

interface ValidationDetailWorkspaceProps {
  request: any;
  onClose: () => void;
  onAction: (id: number, action: string, comment: string) => void;
}

export default function ValidationDetailWorkspace({ request, onClose, onAction }: ValidationDetailWorkspaceProps) {
  const [modalComment, setModalComment] = useState("");
  const [commentModalConfig, setCommentModalConfig] = useState<{ isOpen: boolean, type: "REFUSE" | "ATTENTE" }>({ isOpen: false, type: "REFUSE" });
  const { setSidebarRetracted } = useUI();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setSidebarRetracted(true);
    return () => {
      document.body.style.overflow = "auto";
      setSidebarRetracted(false);
    };
  }, [setSidebarRetracted]);

  const calculateSeniority = (joinDate: string) => {
    if (!joinDate) return "N/A";
    const start = new Date(joinDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return years + " ans, " + months + " mois";
  };

  const isAdministrative = request.typeDemande !== undefined;
  const requestTypeLabel = isAdministrative ? "Administrative" : (request.typeConge ? "Conge" : "Document");

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/60 cursor-alias"
        style={{ transform: "translateZ(0)" }}
        onClick={onClose}
      />

      <div className="flex-1 ml-[104px] relative flex items-center justify-center p-6 lg:p-12 xl:p-16">
        <div className="relative w-full h-full max-w-[1450px] max-h-[850px] bg-white shadow-[0_40px_150px_rgba(0,0,0,0.3)] border border-white/50 rounded-[4.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
          
          <div className="bg-white border-b px-8 py-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
               <div className="bg-blue-600 p-3 rounded-2xl text-white">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Espace de Validation RH</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dossier #{request.idRequete} | Type: {requestTypeLabel}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-800">
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex">
            
            <div className="w-1/3 border-r overflow-y-auto p-8 space-y-8 bg-white/50">
               <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <User size={18} strokeWidth={3} />
                  <h3 className="font-black text-xs uppercase tracking-widest">Recapitulatif de la demande</h3>
               </div>

               <div className="bg-white rounded-3xl p-6 border shadow-sm border-blue-50">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl border border-blue-100">
                      {request.demandeur?.matricule?.substring(0, 2) || "??"}
                   </div>
                   <div>
                      <p className="font-black text-gray-800 text-lg uppercase leading-tight">
                        {request.demandeur?.nom && request.demandeur?.prenom 
                          ? `${request.demandeur.prenom} ${request.demandeur.nom}` 
                          : (request.demandeur?.matricule || "Utilisateur Inconnu")}
                      </p>
                      <p className="text-xs text-blue-600 font-bold">
                        {request.demandeur?.dateEmbauche 
                          ? `Ancienneté: ${calculateSeniority(request.demandeur.dateEmbauche)}` 
                          : "Date d'embauche non renseignée"}
                      </p>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Département</span>
                      <span className="font-black text-gray-700">{request.demandeur?.departement || "Général"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Matricule</span>
                      <span className="font-black text-gray-500">{request.demandeur?.matricule || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Objet</span>
                      <span className="font-black text-blue-600 uppercase">
                        {request.typeDemande || (request.typeConge ? request.typeConge.nom : null) || request.typeDocument || "Demande"}
                      </span>
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Justification Employé</label>
                 <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 italic text-gray-700 text-sm leading-relaxed">
                    {request.description || request.motif || "Aucun commentaire additionnel fourni."}
                 </div>
               </div>

               <div className="space-y-4 pt-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Justificatifs Web / Cloud</label>
                 <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                     <Info className="text-blue-500" size={18} />
                     <p className="text-xs font-bold text-blue-800">Preuve administrative chargee sur le serveur local.</p>
                   </div>
                    <button 
                      onClick={() => {
                        if (request.justificatifUrl) {
                          window.open(`http://localhost:8080${request.justificatifUrl}`, "_blank");
                        } else {
                          alert("Aucun justificatif numérique n'est encore rattaché à ce dossier.");
                        }
                      }}
                      className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                        request.justificatifUrl 
                          ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-700' 
                          : 'bg-white text-gray-300 border-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <Download size={14} /> {request.justificatifUrl ? "Voir le justificatif" : "Indisponible"}
                    </button>
                 </div>
               </div>
            </div>

            <div className="w-1/3 border-r overflow-y-auto p-8 space-y-8">
               <div className="flex items-center gap-3 text-amber-600 mb-2">
                  <History size={18} strokeWidth={3} />
                  <h3 className="font-black text-xs uppercase tracking-widest">Historique du Workflow</h3>
               </div>

               <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                 
                 <div className="relative">
                   <div className="absolute -left-[30px] top-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Depot du dossier</p>
                   <p className="text-sm font-black text-gray-800">{new Date(request.dateSoumission).toLocaleString("fr-FR")}</p>
                   <p className="text-xs text-gray-500 font-medium">Demande initiee par l'employe.</p>
                 </div>

                 {request.dateActionManager || ["VALIDE_MANAGER", "APPROUVÉ", "REFUSE", "ATTENTE"].includes(request.statutCycleVie) ? (
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avis du Manager</p>
                      <p className="text-sm font-black text-gray-800">Approuve par {request.nomManagerAction || "Manager N+1"}</p>
                      <p className="text-xs text-gray-400 font-bold mb-3 italic">
                        {request.dateActionManager ? new Date(request.dateActionManager).toLocaleString("fr-FR") : "Signé électroniquement"}
                      </p>
                      <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-xs text-green-800 italic font-medium">
                        {request.commentaireManager || "Approuve sans commentaire."}
                      </div>
                    </div>
                  ) : (
                    <div className="relative opacity-50">
                      <div className="absolute -left-[30px] top-1 w-5 h-5 bg-gray-300 rounded-full border-4 border-white shadow-sm"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avis du Manager</p>
                      <p className="text-sm font-black text-gray-800">En attente de validation N+1</p>
                    </div>
                  )}

                 <div className="relative pt-4">
                    <div className="absolute -left-[30px] top-4 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                    <LiveChronometer startTime={request.dateArriveeRh || request.dateActionManager || request.dateSoumission} />
                 </div>

               </div>
            </div>

            <div className="w-1/3 overflow-y-auto p-8 bg-gray-100/50 flex flex-col justify-between">
               <div className="space-y-8">
                 <div className="flex items-center gap-3 text-gray-800 mb-2">
                    <ShieldCheck size={18} strokeWidth={3} />
                    <h3 className="font-black text-xs uppercase tracking-widest">
                      {["APPROUVE", "APPROUVÉ", "REFUSE", "ATTENTE"].includes(request.statutCycleVie) ? "Resultat du Traitement" : "Actions de validation"}
                    </h3>
                 </div>

                 {["APPROUVE", "APPROUVÉ", "REFUSE", "ATTENTE"].includes(request.statutCycleVie) ? (
                   <div className="space-y-6">
                      <div className={`p-10 rounded-[2.5rem] border-2 shadow-xl flex flex-col items-center text-center gap-6 animate-in zoom-in duration-300 ${
                        (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                        request.statutCycleVie === "REFUSE" ? "bg-red-50 border-red-100 text-red-600" :
                        "bg-amber-50 border-amber-100 text-amber-600"
                      }`}>
                         <div className={`p-5 rounded-3xl ${
                           (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "bg-emerald-500" :
                           request.statutCycleVie === "REFUSE" ? "bg-red-500" : "bg-amber-500"
                         } text-white shadow-lg`}>
                            {(request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? <CheckCircle2 size={40} /> :
                             request.statutCycleVie === "REFUSE" ? <XCircle size={40} /> : <Clock size={40} />}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status Final</p>
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter">
                              {(request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "Dossier Valide" :
                               request.statutCycleVie === "REFUSE" ? "Dossier Refuse" : "Mis en attente"}
                            </h4>
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] border shadow-sm space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b pb-4">
                            <span className="text-gray-400">Date de Traitement</span>
                            <span className="text-gray-800 text-right">{new Date().toLocaleString("fr-FR")}</span>
                         </div>
                         {request.commentaireAction && (
                           <div className="pt-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Commentaire RH</span>
                             <p className="text-xs font-medium text-gray-700 italic border-l-4 border-gray-200 pl-4 py-1">
                               {request.commentaireAction}
                             </p>
                           </div>
                         )}
                         <div className="flex items-center gap-3 pt-4 text-emerald-600 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <CheckCircle2 size={16} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Synchronisation Systeme OK</p>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <>
                     <p className="text-sm font-medium text-gray-600 bg-white p-6 rounded-3xl border shadow-sm">
                       En cliquant sur Valider, vous declenchez la cloture du dossier et la generation automatique du document PDF iText.
                     </p>

                     <div className="space-y-4">
                        <button 
                          onClick={() => onAction(request.idRequete, "APPROUVE", "")}
                          disabled={request.statutCycleVie === "EN_ATTENTE_MANAGER"}
                          className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] disabled:opacity-30 disabled:grayscale"
                        >
                          <CheckCircle2 size={24} /> Valider la demande
                        </button>

                        <button 
                          onClick={() => setCommentModalConfig({ isOpen: true, type: "ATTENTE" })}
                          disabled={request.statutCycleVie === "ATTENTE"}
                          className="w-full bg-white text-amber-600 border border-amber-200 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Clock size={18} /> Mettre en attente
                        </button>

                        <button 
                          onClick={() => setCommentModalConfig({ isOpen: true, type: "REFUSE" })}
                          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={18} /> Refuser le dossier
                        </button>
                     </div>
                   </>
                 )}
               </div>

               <div className="bg-white border p-6 rounded-[2rem] flex items-center gap-4">
                  <Info className="text-blue-500 shrink-0" size={24} />
                  <p className="text-[10px] font-bold text-gray-400 leading-normal">
                    La validation finale synchronisera automatiquement les donnees individuelles de l'employe dans le systeme central.
                  </p>
               </div>
            </div>

          </div>
        </div>
      </div>

      {commentModalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[200] p-6 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
             <div className={`${commentModalConfig.type === 'REFUSE' ? 'bg-red-600' : 'bg-amber-600'} p-8 text-white`}>
                <h3 className="text-xl font-black uppercase italic tracking-widest">
                  {commentModalConfig.type === 'REFUSE' ? "Motif du Refus" : "Justification d'Attente"}
                </h3>
                <p className={`${commentModalConfig.type === 'REFUSE' ? 'text-red-100' : 'text-amber-100'} text-xs font-bold mt-1`}>
                  {commentModalConfig.type === 'REFUSE' 
                    ? "Expliquez à l'employé pourquoi sa demande est rejetée." 
                    : "Précisez les pièces ou informations manquantes."}
                </p>
             </div>
             <div className="p-8 space-y-6">
               <textarea 
                  className={`w-full h-40 bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-800 outline-none transition-all resize-none shadow-inner ${
                    commentModalConfig.type === 'REFUSE' ? 'focus:border-red-500' : 'focus:border-amber-500'
                  }`}
                  placeholder={commentModalConfig.type === 'REFUSE' ? "Justification RH (Ex: Justificatif illisible)..." : "Précisions manquantes (Ex: Copie CNI, Photo)..."}
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
               />
               <div className="flex gap-4">
                 <button onClick={() => setCommentModalConfig({ ...commentModalConfig, isOpen: false })} className="flex-1 py-4 font-black uppercase text-xs text-gray-400 hover:text-gray-800 transition">Annuler</button>
                 <button 
                   onClick={() => { onAction(request.idRequete, commentModalConfig.type, modalComment); setCommentModalConfig({ ...commentModalConfig, isOpen: false }); setModalComment(""); }}
                   disabled={!modalComment.trim()}
                   className={`flex-[2] text-white font-black uppercase text-xs py-4 rounded-2xl shadow-xl transition disabled:opacity-30 ${
                     commentModalConfig.type === 'REFUSE' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                   }`}
                 >
                   Confirmer l'action
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
