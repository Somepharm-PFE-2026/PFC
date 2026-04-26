"use client";
import { useState, useEffect } from "react";

interface DemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  initialCategory?: string;
}

export default function DemandeModal({ isOpen, onClose, onSuccess, token, initialCategory }: DemandeModalProps) {
  const [category, setCategory] = useState(initialCategory || "CONGE");

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const [formDataConge, setFormDataConge] = useState({
    typeConge: "CONGE_ANNUEL",
    dateDebut: "",
    dateFin: "",
    motif: "",
  });

  const [formDataDoc, setFormDataDoc] = useState({ 
    typeDocument: "ATTESTATION_TRAVAIL", 
    motif: "",
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    heureDebut: "09",
    minuteDebut: "00",
    heureFin: "10",
    minuteFin: "00"
  });

  const [loading, setLoading] = useState(false);
  
  // Strict synchronization for minute selection in Bons de Sortie
  useEffect(() => {
    if (formDataDoc.typeDocument === "BON_SORTIE" && formDataDoc.minuteFin !== formDataDoc.minuteDebut) {
      setFormDataDoc(prev => ({ ...prev, minuteFin: prev.minuteDebut }));
    }
  }, [formDataDoc.minuteDebut, formDataDoc.typeDocument]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category === "CONGE") {
        if (new Date(formDataConge.dateFin) < new Date(formDataConge.dateDebut)) {
          alert("La date de fin ne peut pas être avant la date de début !");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:8080/api/demandes/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...formDataConge, type: "CONGE" }),
        });

        if (res.ok) {
          onSuccess();
          onClose();
          setFormDataConge({ typeConge: "CONGE_ANNUEL", dateDebut: "", dateFin: "", motif: "" });
        } else {
          alert(`Erreur: ${await res.text()}`);
        }

      } else {
        // Document submission
        const payload = {
            type: "DOCUMENT",
            typeDocument: formDataDoc.typeDocument,
            description: formDataDoc.motif,
            mois: formDataDoc.typeDocument === "FICHE_PAIE" ? formDataDoc.mois : null,
            annee: formDataDoc.typeDocument === "FICHE_PAIE" ? formDataDoc.annee : null,
            heureDebut: formDataDoc.typeDocument === "BON_SORTIE" ? `${formDataDoc.heureDebut}:${formDataDoc.minuteDebut}` : null,
            heureFin: formDataDoc.typeDocument === "BON_SORTIE" ? `${formDataDoc.heureFin}:${formDataDoc.minuteFin}` : null
        };

        const res = await fetch("http://localhost:8080/api/demandes-documents/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          onSuccess();
          onClose();
          setFormDataDoc({ 
            typeDocument: "ATTESTATION_TRAVAIL", 
            motif: "",
            mois: new Date().getMonth() + 1,
            annee: new Date().getFullYear(),
            heureDebut: "09",
            minuteDebut: "00",
            heureFin: "10",
            minuteFin: "00"
          });
        } else {
          alert(`Erreur: ${await res.text()}`);
        }
      }
    } catch (err) {
      console.error("Erreur soumission:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-8 text-white relative">
          <h2 className="text-2xl font-black italic uppercase tracking-widest">Nouvelle Demande</h2>
          <p className="text-blue-100 text-xs font-bold mt-1">Sélectionnez le type de requête</p>
          
          <div className="absolute -bottom-5 left-8 right-8 flex gap-2">
             <button 
                type="button"
                onClick={() => setCategory("CONGE")}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest border-2 transition-all shadow-md ${category === 'CONGE' ? 'bg-white text-blue-600 border-white' : 'bg-blue-700/50 text-blue-100 border-transparent hover:bg-blue-700'}`}
             >
                Absence / Congé
             </button>
             <button 
                type="button"
                onClick={() => setCategory("ATTESTATION")}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest border-2 transition-all shadow-md ${category === 'ATTESTATION' ? 'bg-white text-blue-600 border-white' : 'bg-blue-700/50 text-blue-100 border-transparent hover:bg-blue-700'}`}
             >
                Document RH
             </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-12 space-y-6">
            
          {category === "CONGE" ? (
             <>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nature de l'absence</label>
                  <select
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-blue-500 outline-none transition-all"
                    value={formDataConge.typeConge}
                    onChange={(e) => setFormDataConge({ ...formDataConge, typeConge: e.target.value })}
                  >
                    <option value="CONGE_ANNUEL">🌴 Congé Annuel</option>
                    <option value="MALADIE">🩺 Congé Maladie</option>
                    <option value="MATERNITE">👶 Congé Maternité / Paternité</option>
                    <option value="MARIAGE">💍 Évènement Familial (Mariage)</option>
                    <option value="DECES">🕯️ Évènement Familial (Décès)</option>
                    <option value="SANS_SOLDE">🚫 Congé Sans Solde</option>
                    <option value="RECUPERATION">⏳ Récupération</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Du (Inclus)</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-blue-500"
                      value={formDataConge.dateDebut}
                      onChange={(e) => setFormDataConge({ ...formDataConge, dateDebut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Au (Inclus)</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-blue-500"
                      value={formDataConge.dateFin}
                      onChange={(e) => setFormDataConge({ ...formDataConge, dateFin: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Justification / Motif</label>
                  <textarea
                    placeholder="Expliquez brièvement la raison de votre demande..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 outline-none focus:border-blue-500 min-h-[80px] resize-none"
                    value={formDataConge.motif}
                    onChange={(e) => setFormDataConge({ ...formDataConge, motif: e.target.value })}
                  />
                </div>
             </>
          ) : (
             <>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type de Document</label>
                  <select
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 focus:border-blue-500 outline-none transition-all"
                    value={formDataDoc.typeDocument}
                    onChange={(e) => setFormDataDoc({ ...formDataDoc, typeDocument: e.target.value })}
                  >
                    <option value="ATTESTATION_TRAVAIL">Attestation de Travail</option>
                    <option value="ATTESTATION_SALAIRE">Attestation de Salaire</option>
                    <option value="RELEVE_EMOLUMENTS">Relevé des Émoluments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Remarques (Optionnel)</label>
                  <textarea
                    placeholder="Précisez toute information utile pour le service RH..."
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 outline-none focus:border-blue-500 min-h-[100px] resize-none"
                    value={formDataDoc.motif}
                    onChange={(e) => setFormDataDoc({ ...formDataDoc, motif: e.target.value })}
                  />
                </div>
             </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-400 uppercase text-xs hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}