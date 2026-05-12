"use client";
import { useState } from "react";
import { X, Send, User, MapPin, Phone, Heart, FileText, AlertCircle } from "lucide-react";

interface Props {
  profil: any;
  onClose: () => void;
}

export default function ModificationRequestModal({ profil, onClose }: Props) {
  const [formData, setFormData] = useState({
    typeDemande: "SITUATION_FAMILIALE",
    nouveauStatutMarital: profil.situationFamiliale || "",
    nouvelleAdresse: "",
    nouveauTelephone: profil.telephone || "",
    contactUrgence: profil.contactUrgence || "",
    detailsSupplementaires: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for SITUATION_FAMILIALE
    if (formData.typeDemande === "SITUATION_FAMILIALE") {
      if (formData.nouveauStatutMarital === (profil.situationFamiliale || "")) {
        setError("Veuillez sélectionner un statut différent de votre situation actuelle.");
        return;
      }
      if (!file) {
        setError("Un document justificatif est obligatoire pour modifier votre situation familiale.");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/requetes/submit-administrative", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData, type: "ADMINISTRATIVE" })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Step 2: Upload File if provided
        if (file) {
          const fileData = new FormData();
          fileData.append("file", file);
          await fetch(`http://localhost:8080/api/requetes/${data.idRequete}/upload-justificatif`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fileData
          });
        }

        setSuccess(true);
        window.alert("Votre demande de modification a été envoyée avec succès au service RH.");
        setTimeout(onClose, 3500);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Une erreur est survenue lors de l'envoi de la demande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
         
         {/* Modal Header */}
         <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div>
               <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Demande de Modification</h2>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Les changements seront validés par le service RH</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100">
               <X size={20} />
            </button>
         </div>

         {success ? (
           <div className="p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center translate-x-1/2 mx-auto shadow-lg border border-emerald-100 mb-8">
                 <Send size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Demande Envoyée !</h3>
              <p className="text-gray-500 font-bold text-sm max-w-xs mx-auto">Votre dossier est maintenant dans la file d'attente RH. Vous recevrez une notification après validation.</p>
           </div>
         ) : (
           <form onSubmit={handleSubmit} className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 
                 {/* Select Type */}
                 <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Nature de la demande</label>
                    <select 
                      value={formData.typeDemande}
                      onChange={(e) => setFormData({...formData, typeDemande: e.target.value})}
                      className="w-full p-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all"
                    >
                       <option value="SITUATION_FAMILIALE">Modification Situation Familiale</option>
                       <option value="CONTACT">Changement Coordonnées (Tel, Adresse)</option>
                       <option value="URGENCE">Mise à jour Contact Urgence</option>
                    </select>
                 </div>

                 {/* Conditional Fields */}
                 {formData.typeDemande === "SITUATION_FAMILIALE" && (
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Nouveau Statut Marital</label>
                       <div className="flex gap-4">
                          {["CELIBATAIRE", "MARIE", "DIVORCE", "VEUF"].map(status => (
                             <button
                               type="button"
                               key={status}
                               onClick={() => setFormData({...formData, nouveauStatutMarital: status})}
                               className={`flex-1 p-3 rounded-xl border text-[10px] font-black transition-all ${
                                 formData.nouveauStatutMarital === status 
                                   ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                   : "bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:text-blue-500"
                               }`}
                             >
                                {status === "CELIBATAIRE" && <User size={12} className="inline mr-2 mb-0.5" />}
                                {status}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {formData.typeDemande === "CONTACT" && (
                    <>
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Nouveau Téléphone</label>
                          <div className="relative">
                             <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                             <input 
                               type="text"
                               placeholder="06 00 00 00 00"
                               value={formData.nouveauTelephone}
                               onChange={(e) => setFormData({...formData, nouveauTelephone: e.target.value})}
                               className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Nouvelle Adresse</label>
                          <div className="relative">
                             <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                             <input 
                               type="text"
                               placeholder="Ex: 52 Rue des Glycines..."
                               value={formData.nouvelleAdresse}
                               onChange={(e) => setFormData({...formData, nouvelleAdresse: e.target.value})}
                               className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all"
                             />
                          </div>
                       </div>
                    </>
                 )}

                 {formData.typeDemande === "URGENCE" && (
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Contact d'Urgence (Nom & Tél)</label>
                       <div className="relative">
                          <Heart size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text"
                            placeholder="Ex: Jean Dupont - 06 11 22 33 44"
                            value={formData.contactUrgence}
                            onChange={(e) => setFormData({...formData, contactUrgence: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all"
                          />
                       </div>
                    </div>
                 )}

                 <div className="col-span-2 grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Commentaires / Détails</label>
                       <div className="relative">
                          <FileText size={14} className="absolute left-4 top-5 text-gray-400" />
                          <textarea 
                            rows={2}
                            placeholder="Précisez la raison..."
                            value={formData.detailsSupplementaires}
                            onChange={(e) => setFormData({...formData, detailsSupplementaires: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all resize-none"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Pièce Justificative (Obligatoire)</label>
                       <div className="relative">
                          <input 
                            type="file"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-2xl outline-none font-bold text-xs transition-all cursor-pointer file:hidden"
                          />
                          <p className="text-[9px] text-gray-400 mt-1 italic">{file ? `Fichier prêt: ${file.name}` : "Cliquez pour sélectionner un PDF ou Image"}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                 <button 
                   type="button"
                   onClick={onClose}
                   className="flex-1 py-4 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
                 >
                    Annuler
                 </button>
                 <button 
                   type="submit"
                   disabled={loading}
                   className={`flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    {loading ? "Traitement..." : <><Send size={16}/> Soumettre la demande</>}
                 </button>
              </div>
           </form>
         )}
      </div>
    </div>
  );
}
