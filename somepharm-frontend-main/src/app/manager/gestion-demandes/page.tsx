"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, XCircle, CheckCircle, Clock } from "lucide-react";
import { jwtDecode } from "jwt-decode";

export default function ValidationManagerPage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refusal State
  const [refuseId, setRefuseId] = useState<number | null>(null);
  const [refuseComment, setRefuseComment] = useState("");

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
      const res = await fetch("http://localhost:8080/api/demandes/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let all = await res.json();
        const pending = all.filter((d: any) => d.statutCycleVie === "EN_ATTENTE_MANAGER");
        
        // 🚀 SORT BY URGENCY FIRST
        pending.sort((a: any, b: any) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime();
        });

        setDemandes(pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string, commentaire: string = "") => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/api/demandes/${id}/statut?statut=${status}&commentaire=${encodeURIComponent(commentaire)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDemandes(demandes.filter((d) => d.idRequete !== id));
        setRefuseId(null);
        setRefuseComment("");
        alert(`Demande ${status.toLowerCase()} avec succès !`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 font-black text-blue-600 animate-pulse">CHARGEMENT DES DEMANDES...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Validation Équipe</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Niveau 1 (Manager)</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        {(demandes.length === 0) ? (
           <div className="text-center py-20">
             <CheckSquare size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-gray-400 font-black uppercase tracking-widest">aucune demande à approuver</p>
           </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div 
                key={demande.idRequete} 
                className={`border-4 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 transition-all shadow-sm
                  ${demande.urgent 
                    ? 'border-amber-400 bg-amber-50/50 animate-in fade-in duration-500 ring-4 ring-amber-100' 
                    : 'border-gray-50 bg-white hover:border-blue-100'}`}
              >
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${demande.urgent ? 'bg-amber-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {demande.typeConge || (demande._group || 'DOC')}
                    </span>
                    {demande.urgent && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 shadow-md">
                        ⚠️ URGENT - RELANCE RH
                      </span>
                    )}
                    <span className="text-sm font-black text-gray-800 uppercase">{demande.demandeurMatricule}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-500">
                    Période: {demande.dateDebut} au {demande.dateFin}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 italic mt-1 truncate max-w-md">
                     Note: {demande.motif || demande.description || "Pas de note."}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Identified: Managers MUST NOT validate their own requests. Ownership Check enforced (Trimmed + Case-Insensitive). */}
                  {demande.demandeurMatricule?.trim().toLowerCase() !== currentUser?.sub?.trim().toLowerCase() ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(demande.idRequete, "VALIDE_MANAGER")}
                        className="flex-1 md:flex-none bg-blue-600 text-white hover:bg-black px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} /> Approuver
                      </button>
                      <button 
                        onClick={() => { setRefuseId(demande.idRequete); }}
                        className="flex-1 md:flex-none bg-white text-red-600 border-2 border-red-100 hover:bg-red-600 hover:text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Refuser
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-2 rounded-full border border-blue-100 italic">
                      Dossier Personnel (Validation RH)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- REFUSAL MODAL --- */}
      {refuseId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 font-sans">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-red-50 animate-in zoom-in duration-200">
            <div className="bg-red-600 p-8 text-white flex items-center gap-4">
               <XCircle size={32} />
               <div>
                  <h3 className="font-black uppercase tracking-widest text-lg italic">Motif du Refus</h3>
                  <p className="text-red-100 text-xs font-bold">Cette note sera visible par l'employé et le RH.</p>
               </div>
            </div>
            <div className="p-8 space-y-4">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Justification obligatoire</label>
               <textarea 
                 className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-medium text-gray-700 focus:border-red-500 outline-none transition-all h-32 resize-none"
                 placeholder="Expliquez pourquoi cette demande ne peut pas être acceptée..."
                 value={refuseComment}
                 onChange={(e) => setRefuseComment(e.target.value)}
               />
               <div className="flex gap-4 pt-2">
                 <button onClick={() => {setRefuseId(null); setRefuseComment("");}} className="flex-1 px-6 py-4 rounded-xl font-black text-gray-400 uppercase text-xs hover:bg-gray-100 transition">Annuler</button>
                 <button 
                   onClick={() => handleUpdateStatus(refuseId, 'REFUSE', refuseComment)} 
                   disabled={!refuseComment.trim()}
                   className="flex-[2] bg-red-600 text-white px-6 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-red-700 transition disabled:opacity-30"
                 >
                   Confirmer le Refus
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}