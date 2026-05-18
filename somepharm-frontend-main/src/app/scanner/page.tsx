"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ScanLine, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  Timer,
  History as HistoryIcon,
  ArrowRightLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [tokenQr, setTokenQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"SCAN" | "HISTORY">("SCAN");
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    if (activeTab === "HISTORY") fetchHistory();
  }, [router, activeTab]);

  const fetchHistory = async () => {
    const jwt = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/api/sorties/scan-history`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        setScanHistory(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenQr) return;
    
    setLoading(true);
    setScanResult(null);
    setError("");
    const jwt = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8080/api/sorties/scan/${tokenQr}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setScanResult(data);
        setTokenQr(""); // Clear the input after success
      } else {
        setError(data.message || "Erreur lors de la vérification.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen font-sans flex flex-col items-center relative overflow-x-hidden">
      <div 
        className="fixed inset-0 z-[-2]"
        style={{
          backgroundImage: 'url("/bg-security.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-[2px] z-[-1] pointer-events-none" />
      
      {/* Header HUD */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
           <div className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border border-blue-500/20 mb-4">
             <ShieldCheck size={14} /> Terminal Sécurité Somepharm
           </div>
           <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Contrôle d'Accès</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-800 p-1.5 rounded-2xl border border-gray-700 shadow-xl">
             <button 
               onClick={() => setActiveTab("SCAN")}
               className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SCAN' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <ScanLine size={16} /> Scanner
             </button>
             <button 
               onClick={() => setActiveTab("HISTORY")}
               className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
             >
               <HistoryIcon size={16} /> Historique
             </button>
          </div>
          <button 
            onClick={handleLogout}
            className="p-3.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl border border-red-500/20 transition-all shadow-xl flex items-center justify-center"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {activeTab === "SCAN" ? (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Scanner Input Section */}
          <div className="bg-gray-800 rounded-[3rem] border border-gray-700 p-10 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
             
             <form onSubmit={handleScan} className="w-full space-y-8">
                <div className="relative h-64 bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-700 flex flex-col items-center justify-center overflow-hidden group">
                   <div className="absolute top-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                   <ScanLine size={80} className="text-gray-800 group-hover:text-gray-700 transition-colors duration-500" />
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Veuillez scanner le QR Code</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Entrée Manuelle (Token UUID)</label>
                  <input
                    type="text"
                    value={tokenQr}
                    onChange={(e) => setTokenQr(e.target.value)}
                    placeholder="token-uuid-unique..."
                    className="w-full bg-gray-900 border-2 border-gray-700 p-5 rounded-2xl text-center text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-gray-900 font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl shadow-xl hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Vérification..." : "Vérifier l'Autorisation"}
                </button>
             </form>
          </div>

          {/* Detailed Result Section */}
          <div className="bg-gray-800 rounded-[3rem] border border-gray-700 p-10 shadow-2xl relative">
             {!scanResult && !error && (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShieldCheck size={100} className="text-gray-600 mb-6" />
                  <h3 className="text-xl font-black text-gray-600 uppercase tracking-widest">En attente de scan</h3>
                  <p className="text-gray-600 font-bold text-xs mt-2">Scannez un bon pour voir les détails de l'employé</p>
               </div>
             )}

             {error && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 border border-red-500/20 shadow-lg shadow-red-500/5">
                    <AlertTriangle size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Accès Refusé</h3>
                  <div className="mt-4 px-6 py-3 bg-red-500/20 rounded-xl text-red-300 font-black text-xs uppercase tracking-widest border border-red-500/30">
                     {error}
                  </div>
                </div>
             )}

             {scanResult && (
                <div className="h-full flex flex-col animate-in slide-in-from-right duration-500">
                   <div className="flex items-center gap-6 mb-10">
                      <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                         <User size={40} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white uppercase italic leading-none">{scanResult.nomComplet}</h3>
                         <p className="text-blue-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
                           <span className="px-2 py-0.5 bg-blue-500/20 rounded-md border border-blue-500/30">{scanResult.matricule}</span>
                           <span>• {scanResult.departement}</span>
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calendar size={12} /> Jour Prévu
                         </p>
                         <p className="text-lg font-black text-white">{scanResult.dateDemande}</p>
                      </div>
                      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Timer size={12} /> Période Autorisée
                         </p>
                         <p className="text-lg font-black text-white">{scanResult.periodeDemandee}</p>
                      </div>
                   </div>

                   <div className="flex-1 bg-gray-900/50 p-8 rounded-[2rem] border border-gray-700/50 mb-10">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Motif de la sortie</p>
                      <p className="text-gray-300 font-bold italic leading-relaxed">"{scanResult.motif || "Besoins personnels"}"</p>
                   </div>

                   <div className={`p-6 rounded-[2rem] flex items-center justify-between shadow-2xl border-2 ${
                     scanResult.typeScan === 'SORTIE' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-amber-500 border-amber-400 text-white'
                   }`}>
                      <div className="flex items-center gap-4">
                         <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                           <ArrowRightLeft size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mouvement Enregistré</p>
                            <p className="text-xl font-black uppercase italic tracking-tighter">{scanResult.message}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase opacity-60">Heure Locale</p>
                         <p className="text-2xl font-black italic">{scanResult.heureScan}</p>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-gray-800 rounded-[3rem] border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in duration-500">
           <div className="p-10 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Registre des Passages</h2>
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Vos 20 derniers scans de sécurité</p>
              </div>
              <button 
                onClick={fetchHistory}
                className="p-4 bg-gray-900 rounded-2xl text-blue-400 hover:text-white hover:bg-blue-600 transition-all border border-gray-700"
              >
                <Clock size={20} />
              </button>
           </div>

           <div className="divide-y divide-gray-700/50">
              {scanHistory.length === 0 ? (
                <div className="p-20 text-center opacity-30">
                   <HistoryIcon size={64} className="mx-auto mb-6" />
                   <p className="font-black uppercase tracking-widest text-xs">Aucun scan enregistré pour le moment</p>
                </div>
              ) : scanHistory.map((log: any) => (
                <div key={log.idLog} className="p-8 hover:bg-gray-700/30 transition-all group flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        log.description.includes('SORTIE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                         <ArrowRightLeft size={20} />
                      </div>
                      <div>
                         <p className="text-white font-black uppercase tracking-tight">{log.description}</p>
                         <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                           Agent: {log.auteur} • {isMounted ? new Date(log.timestamp).toLocaleString('fr-FR') : "..."}
                         </p>
                      </div>
                   </div>
                   <ChevronRight className="text-gray-600 group-hover:text-blue-500 transition-all" />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Custom CSS for the scan line animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}