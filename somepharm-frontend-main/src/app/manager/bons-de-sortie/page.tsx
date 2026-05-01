"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Clock, ArrowRight, CheckCircle2, QrCode as qrIcon, Download, Info, XCircle, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function BonDeSortiePage() {
  const router = useRouter();
  
  // New unified state matching DemandeModal
  const [formData, setFormData] = useState({
    heureDebut: "09",
    minuteDebut: "00",
    heureFin: "10",
    minuteFin: "00",
    motif: ""
  });

  const [sorties, setSorties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    // Simple decoding to get the matricule for the QR content later
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setUser(JSON.parse(jsonPayload));
    } catch (e) { console.error(e); }

    fetchMesSorties(token);
  }, [router]);

  // Strict minute synchronization
  useEffect(() => {
    if (formData.minuteFin !== formData.minuteDebut) {
        setFormData(prev => ({ ...prev, minuteFin: prev.minuteDebut }));
    }
  }, [formData.minuteDebut]);

  const fetchMesSorties = async (token: string) => {
    try {
      // Unified endpoint
      const res = await fetch("http://localhost:8080/api/demandes-documents/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter only for Exit Permits
        const filtered = data.filter((d: any) => d.typeDocument === "BON_SORTIE");
        setSorties(filtered);
      }
    } catch (err) {
      console.error("Erreur chargement sorties:", err);
    }
  };

  const demanderSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    
    try {
      const payload = {
          typeDocument: "BON_SORTIE",
          description: formData.motif,
          heureDebut: `${formData.heureDebut}:${formData.minuteDebut}`,
          heureFin: `${formData.heureFin}:${formData.minuteFin}`
      };

      const res = await fetch(`http://localhost:8080/api/demandes-documents/submit`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...payload, type: "DOCUMENT" })
      });
      
      if (res.ok) {
        fetchMesSorties(token || "");
        setFormData({ ...formData, motif: "" });
      } else {
        const errData = await res.json();
        setError(errData.message || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error("Erreur demande:", err);
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  };

  const annulerSortie = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://localhost:8080/api/demandes-documents/${id}/annuler`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            fetchMesSorties(token || "");
        }
    } catch (err) {
        console.error("Erreur annulation:", err);
    }
  };

  const handleDownload = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://localhost:8080/api/documents/download/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Bon_de_Sortie.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    } catch (e) {
        console.error(e);
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter">Bons de Sortie</h1>
            <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">Live QR</span>
        </div>
        <div className="bg-white shadow-sm border px-6 py-2 rounded-2xl font-bold text-blue-600 flex items-center gap-2">
          <Shield size={18} /> Digital Verification
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row gap-8 items-start">
        
        {/* --- FORMULAIRE DE DEMANDE --- */}
        <div className="w-full 2xl:w-1/3 order-1">
          <div className="bg-white rounded-[2rem] shadow-xl border p-8 2xl:sticky 2xl:top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase">Nouvelle Sortie</h2>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-bold leading-relaxed">{error}</p>
                </div>
            )}

            <form onSubmit={demanderSortie} className="space-y-6">
              
              <div className="flex flex-col gap-6">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Période de Sortie (Début)</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <select 
                                className="w-full bg-white border-2 border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-blue-500 shadow-sm appearance-none"
                                value={formData.heureDebut}
                                onChange={(e) => setFormData({...formData, heureDebut: e.target.value})}
                            >
                                {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                    <option key={h} value={h}>{h} Heures</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <select 
                                className="w-full bg-white border-2 border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-blue-500 shadow-sm appearance-none"
                                value={formData.minuteDebut}
                                onChange={(e) => setFormData({...formData, minuteDebut: e.target.value})}
                            >
                                <option value="00">00 Min</option>
                                <option value="30">30 Min</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Période de Sortie (Fin prévue)</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <select 
                                className="w-full bg-white border-2 border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-blue-500 shadow-sm appearance-none"
                                value={formData.heureFin}
                                onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                            >
                                {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                    <option key={h} value={h}>{h} Heures</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <select 
                                className="w-full bg-gray-200 border-2 border-gray-200 p-3 rounded-xl font-bold text-gray-400 cursor-not-allowed appearance-none"
                                value={formData.minuteFin}
                                disabled
                            >
                                <option value="00">00 Min</option>
                                <option value="30">30 Min</option>
                            </select>
                        </div>
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                   Motif de la sortie
                </label>
                <textarea
                  value={formData.motif}
                  onChange={(e) => setFormData({...formData, motif: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-medium text-gray-700 min-h-[100px] focus:outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="Rendez-vous médical, urgent..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {loading ? "Chargement..." : "Demander l'Autorisation"}
              </button>
            </form>
          </div>
        </div>

        {/* --- HISTORIQUE DES SORTIES --- */}
        <div className="w-full 2xl:w-2/3 order-2 space-y-4">
          <div className="flex items-center justify-between pl-2">
            <h2 className="text-lg font-black text-gray-400 uppercase tracking-widest">Historique des sorties</h2>
            <div className="text-xs font-bold text-gray-400 flex items-center gap-1 italic"><Info size={14}/> Les codes QR s'activent après validation.</div>
          </div>
          
          {sorties.length === 0 ? (
             <div className="bg-white rounded-[2rem] border border-dashed border-gray-300 p-16 text-center">
                <Shield className="mx-auto text-gray-200 mb-4" size={64} />
                <p className="text-gray-400 font-black uppercase tracking-tight">Aucun bon de sortie actif</p>
             </div>
          ) : (
            sorties.map((sortie, index) => {
              const isApproved = sortie.statutCycleVie === 'APPROUVE' || sortie.statutCycleVie === 'APPROUVÉ';
              const isCancelled = sortie.statutCycleVie === 'ANNULÉ';
              const isCancellable = !isApproved && !isCancelled && !sortie.statutCycleVie.includes('REFUSE');
              const qrData = `BON_SORTIE|${user?.sub || 'EMP'}|${new Date(sortie.dateSoumission).toLocaleDateString()}|${sortie.heureDebut}-${sortie.heureFin}|VALIDATED_SOMEPHARM`;
              
              return (
              <div key={sortie.idRequete} className="bg-white rounded-[2rem] shadow-sm border p-8 flex flex-col md:flex-row items-center gap-8 justify-between transition-all hover:shadow-xl hover:border-blue-100 group">
                
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border flex items-center gap-1 ${
                      isApproved ? 'bg-green-50 text-green-600 border-green-100 shadow-sm shadow-green-50' :
                      sortie.statutCycleVie.includes('REFUSE') ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                    }`}>
                      {isApproved && <CheckCircle2 size={12}/>}
                      {sortie.statutCycleVie}
                    </span>
                    <span className="text-gray-300 text-xs font-black italic uppercase tracking-tighter">REF: #{sortie.idRequete}</span>
                  </div>
                  
                  <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                        {sortie.heureDebut} <span className="text-blue-300 mx-1">→</span> {sortie.heureFin}
                      </h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Période du {new Date(sortie.dateSoumission).toLocaleDateString()}</p>
                  </div>

                  <p className="text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-xl border-l-4 border-gray-200">
                    {sortie.description || "Aucun motif précisé."}
                  </p>

                  {isCancellable && (
                      <button 
                        onClick={() => annulerSortie(sortie.idRequete)}
                        className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase hover:text-red-600 transition-colors mt-2"
                      >
                        <XCircle size={14} className="lucide lucide-x-circle" /> Annuler la demande
                      </button>
                  )}
                </div>

                {/* --- QR CODE SECTION (APPROUVÉ) --- */}
                <div className="flex flex-col items-center justify-center gap-4">
                    {isApproved ? (
                        <div className="relative group/qr p-4 bg-white border-2 border-gray-100 rounded-[2rem] shadow-inner transition-all hover:bg-gray-50">
                            <QRCodeSVG 
                                value={qrData}
                                size={120}
                                level="H"
                                includeMargin={false}
                                className="transition-transform group-hover/qr:scale-110 duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity bg-black/5 rounded-[2rem]">
                                <Download 
                                    size={24} 
                                    className="text-blue-600 bg-white p-2 rounded-full cursor-pointer shadow-lg"
                                    onClick={() => handleDownload(sortie.idRequete)}
                                />
                            </div>
                        </div>
                    ) : isCancelled ? (
                        <div className="w-[152px] h-[152px] bg-gray-50 border-2 border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-200 p-6 text-center">
                            <XCircle size={32} className="mb-2 opacity-10 lucide lucide-x-circle" />
                            <p className="text-[9px] font-black uppercase leading-tight">Demande Annulée</p>
                        </div>
                    ) : (
                        <div className="w-[152px] h-[152px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-300 p-6 text-center">
                            <Clock size={32} className="mb-2 opacity-20" />
                            <p className="text-[9px] font-black uppercase leading-tight">En attente de validation RH</p>
                        </div>
                    )}
                    {isApproved && <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Prêt pour scan</p>}
                </div>

              </div>
            )})
          )}
        </div>
        </div>
      </div>
    </div>
  );
}