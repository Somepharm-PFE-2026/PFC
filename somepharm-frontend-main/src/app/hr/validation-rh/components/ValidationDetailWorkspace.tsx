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
  onAction: (id: string, action: string, comment: string) => void;
  isOwnRequest?: boolean;
}

export default function ValidationDetailWorkspace({ request, onClose, onAction, isOwnRequest }: ValidationDetailWorkspaceProps) {
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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-alias"
        style={{ transform: "translateZ(0)" }}
        onClick={onClose}
      />

      <div className="flex-1 ml-[104px] relative flex items-center justify-center p-6 lg:p-12 xl:p-16">
        <div className="relative w-full h-full max-w-[1450px] max-h-[850px] bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-[4.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 text-white backdrop-blur-xl">
          
          <div className="bg-slate-950/50 border-b border-slate-800/80 px-8 py-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl border border-slate-800">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Espace de Validation RH</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dossier #{request.idRequete} | Type: {requestTypeLabel}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white">
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex">
            
            {/* COLUMN 1 */}
            <div className="w-1/3 border-r border-slate-800/80 overflow-y-auto p-8 space-y-8 bg-slate-950/10">
               <div className="flex items-center gap-3 text-indigo-400 mb-2">
                  <User size={18} strokeWidth={3} />
                  <h3 className="font-black text-xs uppercase tracking-widest">Recapitulatif de la demande</h3>
               </div>

               <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-3xl p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl border border-slate-800">
                       {request.demandeur?.matricule?.substring(0, 2) || "??"}
                    </div>
                    <div>
                       <p className="font-black text-white text-lg uppercase leading-tight">
                         {request.demandeur?.nom && request.demandeur?.prenom 
                           ? `${request.demandeur.prenom} ${request.demandeur.nom}` 
                           : (request.demandeur?.matricule || "Utilisateur Inconnu")}
                       </p>
                       <p className="text-xs text-indigo-400 font-bold mt-1">
                         {request.demandeur?.dateEmbauche 
                           ? `Ancienneté: ${calculateSeniority(request.demandeur.dateEmbauche)}` 
                           : "Date d'embauche non renseignée"}
                       </p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">Département</span>
                       <span className="font-black text-slate-200">{request.demandeur?.departement?.nomDept || "Général"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">Matricule</span>
                       <span className="font-black text-slate-400">{request.demandeur?.matricule || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">Objet</span>
                       <span className="font-black text-indigo-400 uppercase">
                         {request.typeDemande || (request.typeConge ? request.typeConge.nom : null) || request.typeDocument || "Demande"}
                       </span>
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Justification Employé</label>
                  <div className="bg-slate-950/85 border border-slate-800/60 rounded-3xl p-6 italic text-slate-300 text-sm leading-relaxed">
                     {request.description || request.motif || "Aucun commentaire additionnel fourni."}
                  </div>
               </div>

               <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Justificatifs Web / Cloud</label>
                  <div className="bg-indigo-500/5 border border-slate-800/80 rounded-3xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Info className="text-indigo-400" size={18} />
                      <p className="text-xs font-bold text-slate-300">Preuve administrative chargee sur le serveur local.</p>
                    </div>
                     <button 
                       onClick={() => {
                         if (request.justificatifUrl) {
                           window.open(`http://localhost:8080${request.justificatifUrl}`, "_blank");
                         } else {
                           alert("Aucun justificatif numérique n'est encore rattaché à ce dossier.");
                         }
                       }}
                       className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                         request.justificatifUrl 
                           ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold hover:opacity-90 shadow-md' 
                           : 'bg-slate-950 text-slate-500 border border-slate-900 cursor-not-allowed'
                       }`}
                     >
                       <Download size={14} /> {request.justificatifUrl ? "Voir le justificatif" : "Indisponible"}
                     </button>
                  </div>
               </div>
            </div>

            {/* COLUMN 2 */}
            <div className="w-1/3 border-r border-slate-800/80 overflow-y-auto p-8 space-y-8">
               <div className="flex items-center gap-3 text-indigo-400 mb-2">
                  <History size={18} strokeWidth={3} />
                  <h3 className="font-black text-xs uppercase tracking-widest">Historique du Workflow</h3>
               </div>

               <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-500/10">
                 
                 <div className="relative">
                    <div className="absolute -left-[30px] top-1 w-5 h-5 bg-indigo-600 rounded-full border-4 border-slate-900 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Depot du dossier</p>
                    <p className="text-sm font-black text-slate-200">{new Date(request.dateSoumission).toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Demande initiee par l'employe.</p>
                 </div>

                 {request.dateActionManager || ["VALIDE_MANAGER", "APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie) ? (
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avis du Manager</p>
                      <p className="text-sm font-black text-slate-200">Approuve par {request.nomManagerAction || "Manager N+1"}</p>
                      <p className="text-xs text-slate-500 font-bold mb-3 italic">
                        {request.dateActionManager ? new Date(request.dateActionManager).toLocaleString("fr-FR") : "Signé électroniquement"}
                      </p>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-400 italic font-medium">
                        {request.commentaireManager || "Approuve sans commentaire."}
                      </div>
                    </div>
                 ) : (
                    <div className="relative opacity-50">
                      <div className="absolute -left-[30px] top-1 w-5 h-5 bg-slate-700 rounded-full border-4 border-slate-900 shadow-sm"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avis du Manager</p>
                      <p className="text-sm font-black text-slate-400">En attente de validation N+1</p>
                    </div>
                 )}

                 <div className="relative pt-4">
                    <div className={`absolute -left-[30px] top-4 w-6 h-6 rounded-full border-4 border-slate-900 shadow-lg ${["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie) ? 'bg-slate-700' : 'bg-rose-500 animate-pulse'}`}></div>
                    <LiveChronometer 
                      startTime={request.dateArriveeRh || request.dateActionManager || request.dateSoumission} 
                      isStopped={["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie)} 
                    />
                 </div>

                 {["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie) && (
                    <div className="relative animate-in fade-in duration-500">
                      <div className={`absolute -left-[30px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 shadow-[0_0_10px_rgba(99,102,241,0.3)] ${
                        (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                        (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                        'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      }`}></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Décision RH</p>
                      <p className="text-sm font-black text-slate-200 text-indigo-200">
                        {(request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "Dossier validé et approuvé" :
                         (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? "Dossier refusé" :
                         "Dossier mis en attente de justificatifs"}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mb-3 italic">
                        Signé électroniquement par le Service RH
                      </p>
                      {request.commentaireAction && (
                        <div className={`border p-4 rounded-2xl text-xs italic font-medium ${
                          (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                          {request.commentaireAction}
                        </div>
                      )}
                    </div>
                 )}
               </div>
            </div>

            {/* COLUMN 3 */}
            <div className="w-1/3 overflow-y-auto p-8 bg-slate-950/10 flex flex-col justify-between">
               <div className="space-y-8">
                 <div className="flex items-center gap-3 text-white mb-2">
                    <ShieldCheck size={18} strokeWidth={3} />
                    <h3 className="font-black text-xs uppercase tracking-widest">
                      {["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie) ? "Resultat du Traitement" : "Actions de validation"}
                    </h3>
                 </div>

                 {["APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "ATTENTE"].includes(request.statutCycleVie) ? (
                   <div className="space-y-6">
                      <div className={`p-10 rounded-[2.5rem] border shadow-xl flex flex-col items-center text-center gap-6 animate-in zoom-in duration-300 ${
                        (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                        "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      }`}>
                         <div className={`p-5 rounded-3xl ${
                           (request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "bg-emerald-500 text-slate-950" :
                           (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? "bg-rose-500 text-slate-950" : "bg-amber-500 text-slate-950"
                         } shadow-lg`}>
                            {(request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? <CheckCircle2 size={40} /> :
                             (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? <XCircle size={40} /> : <Clock size={40} />}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status Final</p>
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter">
                              {(request.statutCycleVie === "APPROUVE" || request.statutCycleVie === "APPROUVÉ") ? "Dossier Valide" :
                               (request.statutCycleVie === "REFUSE" || request.statutCycleVie === "REFUSÉ") ? "Dossier Refuse" : "Dossier en suspens"}
                            </h4>
                         </div>
                      </div>

                      <div className="bg-slate-950/85 p-8 rounded-[2rem] border border-slate-800/80 space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b border-slate-800/80 pb-4">
                            <span className="text-slate-400">Date de Traitement</span>
                            <span className="text-slate-200 text-right">{new Date().toLocaleString("fr-FR")}</span>
                         </div>
                         {request.commentaireAction && (
                           <div className="pt-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Commentaire RH</span>
                             <p className="text-xs font-medium text-slate-300 italic border-l-4 border-indigo-500/30 pl-4 py-1">
                               {request.commentaireAction}
                             </p>
                           </div>
                         )}
                         <div className="flex items-center gap-3 pt-4 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 size={16} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Synchronisation Systeme OK</p>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <>
                     <p className="text-sm font-medium text-slate-300 bg-slate-950/85 p-6 rounded-3xl border border-slate-800/80">
                       En cliquant sur Valider, vous declenchez la cloture du dossier et la generation automatique du document PDF iText.
                     </p>

                     <div className="space-y-4">
                        {isOwnRequest ? (
                           <div className="bg-indigo-500/5 border border-slate-800 p-8 rounded-[2rem] text-center space-y-4 animate-in fade-in duration-500">
                              <ShieldCheck className="mx-auto text-indigo-400" size={32} />
                              <p className="text-sm font-black text-indigo-400 uppercase italic">Dossier Personnel</p>
                              <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                                 Vous ne pouvez pas valider votre propre dossier. Ce dossier doit être traité par un autre administrateur RH.
                              </p>
                           </div>
                        ) : (
                           <>
                             <button 
                               onClick={() => onAction(request.idRequete, "APPROUVE", "")}
                               disabled={request.statutCycleVie === "EN_ATTENTE_MANAGER"}
                               className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:opacity-90 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(99,102,241,0.15)] disabled:opacity-30 disabled:grayscale"
                             >
                               <CheckCircle2 size={24} /> Valider la demande
                             </button>

                             <button 
                               onClick={() => setCommentModalConfig({ isOpen: true, type: "REFUSE" })}
                               className="w-full bg-rose-500/10 text-rose-400 border border-rose-500/20 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                             >
                               <XCircle size={18} /> Refuser le dossier
                             </button>
                           </>
                        )}
                     </div>
                   </>
                 )}
               </div>

               <div className="bg-slate-950/85 border border-slate-800/80 p-6 rounded-[2rem] flex items-center gap-4">
                  <Info className="text-indigo-400 shrink-0" size={24} />
                  <p className="text-[10px] font-bold text-slate-400 leading-normal">
                    La validation finale synchronisera automatiquement les donnees individuelles de l'employe dans le systeme central.
                  </p>
               </div>
            </div>

          </div>
        </div>
      </div>

      {commentModalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex justify-center items-center z-[200] p-6 backdrop-blur-md">
           <div className="bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-md rounded-[3rem] overflow-hidden animate-in zoom-in duration-200">
             <div className={`${commentModalConfig.type === 'REFUSE' ? 'bg-rose-900/60 border-b border-rose-800/80' : 'bg-indigo-950/60 border-b border-indigo-900/80'} p-8 text-white`}>
                 <h3 className="text-xl font-black uppercase italic tracking-widest">
                   {commentModalConfig.type === 'REFUSE' ? "Motif du Refus" : "Justification d'Attente"}
                 </h3>
                 <p className={`${commentModalConfig.type === 'REFUSE' ? 'text-rose-300' : 'text-indigo-300'} text-xs font-bold mt-1`}>
                   {commentModalConfig.type === 'REFUSE' 
                     ? "Expliquez à l'employé pourquoi sa demande est rejetée." 
                     : "Précisez les pièces ou informations manquantes."}
                 </p>
             </div>
             <div className="p-8 space-y-6">
                <textarea 
                   className={`w-full h-40 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-bold text-white outline-none transition-all resize-none shadow-inner ${
                     commentModalConfig.type === 'REFUSE' ? 'focus:border-rose-500' : 'focus:border-indigo-500'
                   }`}
                   placeholder={commentModalConfig.type === 'REFUSE' ? "Justification RH (Ex: Justificatif illisible)..." : "Précisions manquantes (Ex: Copie CNI, Photo)..."}
                   value={modalComment}
                   onChange={(e) => setModalComment(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={() => setCommentModalConfig({ ...commentModalConfig, isOpen: false })} className="flex-1 py-4 font-black uppercase text-xs text-slate-400 hover:text-white transition">Annuler</button>
                  <button 
                    onClick={() => { onAction(request.idRequete, commentModalConfig.type, modalComment); setCommentModalConfig({ ...commentModalConfig, isOpen: false }); setModalComment(""); }}
                    disabled={!modalComment.trim()}
                    className={`flex-[2] text-slate-950 font-black uppercase text-xs py-4 rounded-2xl shadow-xl transition disabled:opacity-30 ${
                      commentModalConfig.type === 'REFUSE' ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-90'
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

