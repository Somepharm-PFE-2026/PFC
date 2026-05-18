"use client";
import { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import { useUI } from "../../../../context/UIContext";
import { 
  X, 
  Send, 
  User, 
  MapPin, 
  Phone, 
  Heart, 
  FileText, 
  AlertCircle,
  Upload,
  Loader2
} from "lucide-react";

interface Props {
  profil: any;
  onClose: () => void;
}

export default function ModificationRequestModal({ profil, onClose }: Props) {
  const { addToast } = useUI();
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
        addToast("success", "Demande envoyée avec succès");
        setTimeout(onClose, 2000);
      } else {
        const errText = await res.text();
        setError(errText || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Erreur technique lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Mise à jour du profil">
      {success ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-heading font-bold text-slate-900">Demande Envoyée</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Votre demande est en cours de traitement par le service RH. Vous recevrez une notification bientôt.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Nature selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nature de la demande</label>
              <select 
                value={formData.typeDemande}
                onChange={(e) => setFormData({...formData, typeDemande: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm focus:border-sky-500 focus:bg-white transition-all"
              >
                 <option value="SITUATION_FAMILIALE">Modification Situation Familiale</option>
                 <option value="CONTACT">Changement Coordonnées (Tél, Adresse)</option>
                 <option value="URGENCE">Mise à jour Contact d'Urgence</option>
              </select>
            </div>

            {/* Situation Familiale */}
            {formData.typeDemande === "SITUATION_FAMILIALE" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nouveau Statut</label>
                <div className="grid grid-cols-2 gap-2">
                  {["CELIBATAIRE", "MARIE", "DIVORCE", "VEUF"].map(status => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setFormData({...formData, nouveauStatutMarital: status})}
                      className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all uppercase ${
                        formData.nouveauStatutMarital === status 
                          ? "bg-sky-600 text-white border-sky-600 shadow-sm" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-sky-200"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {formData.typeDemande === "CONTACT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="06 00 00 00 00"
                      value={formData.nouveauTelephone}
                      onChange={(e) => setFormData({...formData, nouveauTelephone: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm focus:border-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Adresse</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Adresse complète..."
                      value={formData.nouvelleAdresse}
                      onChange={(e) => setFormData({...formData, nouvelleAdresse: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm focus:border-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {formData.typeDemande === "URGENCE" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contact d'Urgence (Nom & Tél)</label>
                <div className="relative">
                  <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Ex: Jean Dupont - 06 11 22 33 44"
                    value={formData.contactUrgence}
                    onChange={(e) => setFormData({...formData, contactUrgence: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm focus:border-sky-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Détails (Optionnel)</label>
                <textarea 
                  rows={2}
                  placeholder="Justification..."
                  value={formData.detailsSupplementaires}
                  onChange={(e) => setFormData({...formData, detailsSupplementaires: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-sm focus:border-sky-500 focus:bg-white transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Justificatif (Image/PDF)</label>
                <div className="relative group h-[78px]">
                  <input 
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 group-hover:border-sky-500 transition-all">
                    <Upload size={16} className="text-slate-400 group-hover:text-sky-600 mb-1" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate px-2 w-full text-center">
                      {file ? file.name : "Joindre un fichier"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
              <AlertCircle size={16} />
              <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16}/>}
              <span>Soumettre</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function CheckCircle2({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
