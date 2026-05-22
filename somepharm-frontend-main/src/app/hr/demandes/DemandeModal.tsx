"use client";
import { useState, useEffect } from "react";
import { useUI } from "../../../context/UIContext";
import { AlertCircle, Calendar, Clock, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface DemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  initialCategory?: string;
}

export default function DemandeModal({ isOpen, onClose, onSuccess, token, initialCategory }: DemandeModalProps) {
  const [category, setCategory] = useState(initialCategory || "CONGE");
  const { incrementModalCount, decrementModalCount } = useUI();

  // Handle sidebar blurring when modal is active
  useEffect(() => {
    if (isOpen) {
      incrementModalCount();
      return () => decrementModalCount();
    }
  }, [isOpen, incrementModalCount, decrementModalCount]);

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
  
  // 🛡️ Only restrict balance for Annual Leave
  const isAnnualLeave = formDataConge.typeConge === "Congé Annuel";
  const maxEndDate = (isAnnualLeave && userBalance && userBalance > 0) ? calculateMaxEndDate(formDataConge.dateDebut, userBalance) : "";
  const isBalanceExceeded = isAnnualLeave && userBalance !== null && requestedDays > userBalance;
  
  // 🕒 Tomorrow calculation
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  // 🛡️ STRICT ENFORCEMENT: Snap dateFin back to max ONLY if balance is critical
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
          onSuccess();
          onClose();
          setFormDataConge({ typeConge: "Congé Annuel", dateDebut: "", dateFin: "", motif: "" });
        } else {
          alert(`Erreur: ${await res.text()}`);
        }

      } else {
        // Document submission
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
          onSuccess();
          onClose();
          setFormDataDoc({ 
            typeDocument: "ATTESTATION_TRAVAIL", 
            motif: "",
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-lg rounded-[3rem] overflow-hidden animate-in zoom-in duration-300 backdrop-blur-xl flex flex-col">
        
        {/* HEADER */}
        <div className="bg-slate-950/80 p-8 border-b border-slate-800/80 text-white relative">
          <h2 className="text-2xl font-black italic uppercase tracking-widest text-white">Nouvelle Demande</h2>
          <p className="text-slate-400 text-xs font-bold mt-1">Sélectionnez le type de requête</p>
          
          <div className="absolute -bottom-5 left-8 right-8 flex gap-2 z-10">
             <button 
                type="button"
                onClick={() => setCategory("CONGE")}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all shadow-md ${category === 'CONGE' ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-transparent' : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                Absence / Congé
             </button>
             <button 
                type="button"
                onClick={() => setCategory("ATTESTATION")}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all shadow-md ${category === 'ATTESTATION' ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-transparent' : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
                Document RH
             </button>
          </div>

          {category === "CONGE" && userBalance !== null && (
            <div className="absolute top-4 right-8 bg-indigo-500/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-indigo-400">
              <span className="text-[10px] font-black uppercase tracking-tighter">Solde: {userBalance}j</span>
            </div>
          )}
        </div>


        <form onSubmit={handleSubmit} className="p-8 pt-12 space-y-6">
            
          {category === "CONGE" ? (
             <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nature de l'absence</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-bold text-white focus:border-indigo-500/40 outline-none transition-all cursor-pointer"
                    value={formDataConge.typeConge}
                    onChange={(e) => setFormDataConge({ ...formDataConge, typeConge: e.target.value })}
                  >
                    {leaveTypes.map((type) => (
                      <option key={type.idTypeConge} value={type.nom} className="bg-slate-900 text-white">
                         {type.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Du (Inclus)</label>
                    <input
                      type="date"
                      required
                      min={minDate}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-bold text-white outline-none focus:border-indigo-500/40"
                      value={formDataConge.dateDebut}
                      onChange={(e) => setFormDataConge({ ...formDataConge, dateDebut: e.target.value, dateFin: "" })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Au (Inclus)</label>
                    <input
                      type="date"
                      required
                      disabled={!formDataConge.dateDebut}
                      min={formDataConge.dateDebut || minDate}
                      max={maxEndDate || undefined}
                      className={`w-full bg-slate-950 border ${isBalanceExceeded ? 'border-rose-500 bg-rose-500/5' : 'border-slate-800/80'} rounded-2xl p-4 font-bold text-white outline-none focus:border-indigo-500/40 disabled:opacity-50`}
                      value={formDataConge.dateFin}
                      onChange={(e) => setFormDataConge({ ...formDataConge, dateFin: e.target.value })}
                    />
                  </div>
                </div>

                {formDataConge.dateDebut && formDataConge.dateFin && (
                  <div className={`p-4 rounded-2xl flex items-center justify-between border ${isBalanceExceeded ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-indigo-500/5 border-slate-800/80 text-indigo-400'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durée calculée:</span>
                    <span className="text-sm font-black">
                      {requestedDays} jour{requestedDays > 1 ? 's' : ''} ouvrable{requestedDays > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {isBalanceExceeded && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-rose-400 text-[10px] font-black uppercase animate-bounce">
                    <ShieldAlert size={14} />
                    <span>Votre solde est insuffisant ({userBalance} jours max)</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justification / Motif</label>
                  <textarea
                    placeholder="Expliquez brièvement la raison de votre demande..."
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-medium text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 min-h-[80px] resize-none"
                    value={formDataConge.motif}
                    onChange={(e) => setFormDataConge({ ...formDataConge, motif: e.target.value })}
                  />
                </div>
             </>
          ) : (
             <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type de Document</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-bold text-white focus:border-indigo-500/40 outline-none transition-all cursor-pointer"
                    value={formDataDoc.typeDocument}
                    onChange={(e) => setFormDataDoc({ ...formDataDoc, typeDocument: e.target.value })}
                  >
                    <option value="ATTESTATION_TRAVAIL" className="bg-slate-900 text-white">Attestation de Travail</option>
                    <option value="ATTESTATION_SALAIRE" className="bg-slate-900 text-white">Attestation de Salaire</option>
                    <option value="RELEVE_EMOLUMENTS" className="bg-slate-900 text-white">Relevé des Émoluments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarques (Optionnel)</label>
                  <textarea
                    placeholder="Précisez toute information utile pour le service RH..."
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-medium text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/40 min-h-[100px] resize-none"
                    value={formDataDoc.motif}
                    onChange={(e) => setFormDataDoc({ ...formDataDoc, motif: e.target.value })}
                  />
                </div>
             </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 text-slate-400 hover:text-white py-4 rounded-xl font-black uppercase text-xs transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (category === "CONGE" && isBalanceExceeded)}
              className="flex-[2] bg-gradient-to-r from-indigo-600 to-sky-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:opacity-90 transition disabled:opacity-30"
            >
              {loading ? "Envoi en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
