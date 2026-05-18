"use client";
import { useState, useEffect } from "react";
import { useUI } from "../../../context/UIContext";
import Modal from "../../../components/ui/Modal";
import { Loader2 } from "lucide-react";

interface DemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  initialCategory?: string;
}

export default function DemandeModal({ isOpen, onClose, onSuccess, token, initialCategory }: DemandeModalProps) {
  const [category, setCategory] = useState(initialCategory || "CONGE");
  const { addToast } = useUI();

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  const [formDataConge, setFormDataConge] = useState({
    typeConge: "Congé Annuel",
    dateDebut: "",
    dateFin: "",
    motif: "",
  });

  const [formDataDoc, setFormDataDoc] = useState({ 
    typeDocument: "ATTESTATION_TRAVAIL", 
    motif: "",
  });

   const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
   const [userBalance, setUserBalance] = useState<number | null>(null);
   const [holidays, setHolidays] = useState<any[]>([]);

   useEffect(() => {
     if (isOpen) {
       fetchLeaveTypes();
       fetchUserBalance();
       fetchHolidays();
     }
   }, [isOpen]);

  const [loading, setLoading] = useState(false);

  const fetchUserBalance = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/utilisateurs/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.soldeConges);
      }
    } catch (err) {
      console.error("Error fetching user balance:", err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/config/holidays", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  };

  const checkIsHoliday = (date: Date) => {
    if (!date || isNaN(date.getTime())) return false;
    
    // Normalize to YYYY-MM-DD for comparison
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    return holidays.some(h => {
      const hDate = new Date(h.date);
      if (isNaN(hDate.getTime())) return false;
      
      const hy = hDate.getFullYear();
      const hm = hDate.getMonth();
      const hd = hDate.getDate();

      if (h.recurrenceType === "ANNUEL") {
        return hm === m && hd === d;
      } else if (h.recurrenceType === "PERIODIQUE") {
        const yearsDiff = y - hy;
        const interval = h.recurrenceInterval || 1;
        return yearsDiff >= 0 && yearsDiff % interval === 0 && hm === m && hd === d;
      } else { // UNIQUE
        return hy === y && hm === m && hd === d;
      }
    });
  };

  const calculateWorkingDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    let count = 0;
    let cur = new Date(start);
    const last = new Date(end);
    
    if (isNaN(cur.getTime()) || isNaN(last.getTime())) return 0;
    
    let loopLimit = 0;
    while (cur <= last && loopLimit < 500) {
      const day = cur.getDay();
      // En Algérie, le week-end = Vendredi (5) et Samedi (6)
      if (day !== 5 && day !== 6 && !checkIsHoliday(new Date(cur))) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
      loopLimit++;
    }
    return count;
  };

  const calculateMaxEndDate = (start: string, balance: number) => {
    if (!start || balance <= 0) return "";
    let count = 0;
    let cur = new Date(start);
    if (isNaN(cur.getTime())) return "";

    let loopLimit = 0;
    while (count < balance && loopLimit < 1000) {
      const day = cur.getDay();
      if (day !== 5 && day !== 6 && !checkIsHoliday(new Date(cur))) {
        count++;
      }
      if (count < balance) {
        cur.setDate(cur.getDate() + 1);
      }
      loopLimit++;
    }
    return cur.toISOString().split('T')[0];
  };

  const requestedDays = calculateWorkingDays(formDataConge.dateDebut, formDataConge.dateFin);
  
  const isAnnualLeave = formDataConge.typeConge === "Congé Annuel";
  const maxEndDate = (isAnnualLeave && userBalance && userBalance > 0) ? calculateMaxEndDate(formDataConge.dateDebut, userBalance) : "";
  const isBalanceExceeded = isAnnualLeave && userBalance !== null && requestedDays > userBalance;
  
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (isAnnualLeave && formDataConge.dateFin && maxEndDate && formDataConge.dateFin > maxEndDate) {
      if (userBalance !== null && userBalance > 0) {
         setFormDataConge(prev => ({ ...prev, dateFin: maxEndDate }));
      }
    }
  }, [formDataConge.dateFin, maxEndDate, userBalance, isAnnualLeave]);

  const fetchLeaveTypes = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/config/leave-types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveTypes(data);
        if (data.length > 0) {
            const hasAnnual = data.some((t: any) => t.nom === "Congé Annuel");
            if (!hasAnnual) {
                setFormDataConge(prev => ({ ...prev, typeConge: data[0].nom }));
            }
        }
      }
    } catch (err) {
      console.error("Error fetching leave types:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category === "CONGE") {
        if (new Date(formDataConge.dateFin) < new Date(formDataConge.dateDebut)) {
          addToast("error", "La date de fin ne peut pas être avant la date de début !");
          setLoading(false);
          return;
        }

        const selectedType = leaveTypes.find(t => t.nom === formDataConge.typeConge);
        const payload = {
          ...formDataConge,
          typeConge: selectedType ? { idTypeConge: selectedType.idTypeConge } : null
        };

        const res = await fetch("http://localhost:8080/api/demandes/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payload, type: "CONGE" }),
        });

        if (res.ok) {
          addToast("success", "Demande de congé soumise avec succès");
          onSuccess();
          onClose();
          setFormDataConge({ typeConge: "Congé Annuel", dateDebut: "", dateFin: "", motif: "" });
        } else {
          addToast("error", `Erreur: ${await res.text()}`);
        }

      } else {
        const payload = {
            typeDocument: formDataDoc.typeDocument,
            description: formDataDoc.motif,
        };

        const res = await fetch("http://localhost:8080/api/demandes-documents/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payload, type: "DOCUMENT" }),
        });

        if (res.ok) {
          addToast("success", "Demande de document soumise avec succès");
          onSuccess();
          onClose();
          setFormDataDoc({ 
            typeDocument: "ATTESTATION_TRAVAIL", 
            motif: "",
          });
        } else {
          addToast("error", `Erreur: ${await res.text()}`);
        }
      }
    } catch (err) {
      addToast("error", "Erreur lors de la soumission");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Demande">
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl mb-6">
        <button 
          type="button"
          onClick={() => setCategory("CONGE")}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm ${category === 'CONGE' ? 'bg-white text-sky-700' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}
        >
          Absence / Congé
        </button>
        <button 
          type="button"
          onClick={() => setCategory("ATTESTATION")}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-sm ${category === 'ATTESTATION' ? 'bg-white text-sky-700' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}
        >
          Document RH
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
          
        {category === "CONGE" ? (
          <>
            {userBalance !== null && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex justify-between items-center mb-2">
                <span className="text-sky-700 font-semibold text-sm">Solde actuel:</span>
                <span className="text-sky-700 font-bold">{userBalance} jours</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Nature de l'absence</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                value={formDataConge.typeConge}
                onChange={(e) => setFormDataConge({ ...formDataConge, typeConge: e.target.value })}
              >
                {leaveTypes.map((type) => (
                  <option key={type.idTypeConge} value={type.nom}>{type.nom}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Du (Inclus)</label>
                <input
                  type="date"
                  required
                  min={minDate}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                  value={formDataConge.dateDebut}
                  onChange={(e) => setFormDataConge({ ...formDataConge, dateDebut: e.target.value, dateFin: "" })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Au (Inclus)</label>
                <input
                  type="date"
                  required
                  disabled={!formDataConge.dateDebut}
                  max={maxEndDate || undefined}
                  className={`w-full bg-white border rounded-xl p-3 font-medium outline-none transition-all disabled:opacity-50 ${isBalanceExceeded ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30 text-rose-900' : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-900'}`}
                  value={formDataConge.dateFin}
                  onChange={(e) => setFormDataConge({ ...formDataConge, dateFin: e.target.value })}
                />
              </div>
            </div>

            {formDataConge.dateDebut && formDataConge.dateFin && (
              <div className={`p-3 rounded-xl flex items-center justify-between border ${isBalanceExceeded ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-xs font-semibold text-slate-500">Durée calculée:</span>
                <span className={`text-sm font-bold ${isBalanceExceeded ? 'text-rose-600' : 'text-slate-800'}`}>
                  {requestedDays} jour{requestedDays > 1 ? 's' : ''} ouvrable{requestedDays > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {isBalanceExceeded && (
              <p className="text-rose-500 text-xs font-semibold flex items-center gap-1 mt-1">
                ⚠️ Votre solde est insuffisant ({userBalance} jours max)
              </p>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Justification / Motif</label>
              <textarea
                placeholder="Expliquez brièvement la raison..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none min-h-[100px] resize-none transition-all"
                value={formDataConge.motif}
                onChange={(e) => setFormDataConge({ ...formDataConge, motif: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Type de Document</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                value={formDataDoc.typeDocument}
                onChange={(e) => setFormDataDoc({ ...formDataDoc, typeDocument: e.target.value })}
              >
                <option value="ATTESTATION_TRAVAIL">Attestation de Travail</option>
                <option value="ATTESTATION_SALAIRE">Attestation de Salaire</option>
                <option value="RELEVE_EMOLUMENTS">Relevé des Émoluments</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Remarques (Optionnel)</label>
              <textarea
                placeholder="Précisez tout commentaire ou information utile..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none min-h-[120px] resize-none transition-all"
                value={formDataDoc.motif}
                onChange={(e) => setFormDataDoc({ ...formDataDoc, motif: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-[0.97] transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || (category === "CONGE" && isBalanceExceeded)}
            className="flex-[2] flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-sky-700 active:scale-[0.97] transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>{loading ? "Envoi..." : "Soumettre la demande"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}