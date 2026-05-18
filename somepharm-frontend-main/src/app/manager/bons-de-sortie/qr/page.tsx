"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function MonPassQRPage() {
  const router = useRouter();
  const [activeSortie, setActiveSortie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    fetchMesSorties(token);
  }, [router]);

  const fetchMesSorties = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/sorties/mes-sorties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Determine the active sortie (either EN_ATTENTE or EN_COURS). We usually only have one active at a time.
        // We sort by id descending just in case.
        data.sort((a: any, b: any) => b.id - a.id);
        const active = data.find((s: any) => s.statut === "EN_ATTENTE" || s.statut === "EN_COURS");
        setActiveSortie(active || null);
      }
    } catch (err) {
      console.error("Erreur chargement sorties:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return (
         <div className="flex justify-center items-center h-screen bg-gray-50">
             <div className="animate-pulse text-gray-400 font-black tracking-widest uppercase">Chargement de votre Pass...</div>
         </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col items-center justify-center p-4">
      
       <div className="mb-8 text-center">
         <h1 className="text-3xl font-black text-gray-800 italic uppercase flex items-center justify-center gap-3">
             <QrCode size={32} className="text-blue-600" /> Mon Pass QR
         </h1>
         <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">
             Présentez ce code à l'agent de sécurité lors de votre passage
         </p>
       </div>

       {activeSortie ? (
           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-gray-100 flex flex-col items-center transition-all hover:scale-[1.02]">
               <div className="mb-6 px-4 py-2 bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest rounded-xl border border-blue-100 flex items-center gap-2">
                   <ShieldAlert size={16} /> PASS ACTIF #{activeSortie.id}
               </div>

               <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
                   <QRCodeSVG value={activeSortie.tokenQr} size={256} level="H" />
               </div>

               <p className="mt-8 text-gray-800 font-black text-xl uppercase italic">
                   {activeSortie.statut === 'EN_COURS' ? 'SORTIE EN COURS' : 'PRÊT À SCANNER'}
               </p>
               <p className="text-gray-400 font-bold text-xs tracking-widest mt-1 uppercase">
                   Autorisation: {activeSortie.dureeEstimeeHeures} Heure(s)
               </p>
           </div>
       ) : (
           <div className="bg-white p-12 rounded-[3rem] shadow-lg border border-gray-100 flex flex-col items-center max-w-md text-center">
               <div className="bg-gray-50 p-6 rounded-full text-gray-300 mb-6">
                   <CheckCircle2 size={48} />
               </div>
               <h2 className="text-xl font-black text-gray-800 uppercase italic">Aucun pass actif</h2>
               <p className="text-gray-500 font-medium text-sm mt-4">
                   Vous n'avez aucune demande de sortie en attente ou en cours. Veuillez faire une nouvelle demande si nécessaire.
               </p>
               <button 
                  onClick={() => router.push('/bons-de-sortie')}
                  className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg"
               >
                   Demander une sortie
               </button>
           </div>
       )}

    </div>
  );
}
