"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  Download, 
  Info, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Plus,
  ChevronRight,
  FileText
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useUI } from "../../../context/UIContext";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function BonDeSortiePage() {
  const router = useRouter();
  const { addToast } = useUI();
  
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
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        setUser(JSON.parse(jsonPayload));
    } catch (e) { console.error(e); }

    fetchConfig(token);
    fetchMesSorties(token);
  }, [router]);

  const fetchConfig = async (token: string) => {
    try {
        const res = await fetch("http://localhost:8080/api/config/system", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setConfig(data);
            if (data.workingHoursStart) {
                const startH = data.workingHoursStart.split(':')[0];
                const endH = (parseInt(startH) + 1).toString().padStart(2, '0');
                setFormData(prev => ({ ...prev, heureDebut: startH, heureFin: endH }));
            }
        } else {
            setConfig({ workingHoursStart: "08:00", workingHoursEnd: "17:00" });
        }
    } catch (err) {
        setConfig({ workingHoursStart: "08:00", workingHoursEnd: "17:00" });
    }
  }

  useEffect(() => {
    if (formData.minuteFin !== formData.minuteDebut) {
        setFormData(prev => ({ ...prev, minuteFin: prev.minuteDebut }));
    }
  }, [formData.minuteDebut]);

  const fetchMesSorties = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/demandes-documents/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSorties(data.filter((d: any) => d.typeDocument === "BON_SORTIE"));
      }
    } catch (err) { console.error(err); }
  };

  const demanderSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    
    try {
      const payload = {
          type: "DOCUMENT",
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
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        addToast("success", "Demande de sortie envoyée");
        fetchMesSorties(token || "");
        setFormData({ ...formData, motif: "" });
      } else {
        const errData = await res.json();
        setError(errData.message || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Erreur technique lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelDialog) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://localhost:8080/api/demandes-documents/${cancelDialog}/annuler`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            addToast("success", "Demande annulée");
            fetchMesSorties(token || "");
            setCancelDialog(null);
        } else {
            addToast("error", "Impossible d'annuler");
        }
    } catch (err) { console.error(err); }
  };

  const handleDownload = async (id: string) => {
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
            addToast("success", "Téléchargement lancé");
        }
    } catch (e) { console.error(e); }
  }

  const getStartHours = () => {
    const cfg = config || { workingHoursStart: "08:00", workingHoursEnd: "18:00" };
    const start = parseInt(cfg.workingHoursStart?.split(':')[0]) || 8;
    const end = parseInt(cfg.workingHoursEnd?.split(':')[0]) || 18;
    const hours = [];
    for (let h = start; h < end; h++) {
        hours.push(h.toString().padStart(2, '0'));
    }
    return hours;
  };

  const getEndHours = () => {
    const cfg = config || { workingHoursEnd: "18:00" };
    const start = parseInt(formData.heureDebut) || 8;
    const end = parseInt(cfg.workingHoursEnd?.split(':')[0]) || 18;
    const hours = [];
    for (let h = start + 1; h <= end; h++) {
        hours.push(h.toString().padStart(2, '0'));
    }
    return hours;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/30 border border-teal-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden mb-2">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 border-l-4 border-teal-500 pl-5">
          <h1 className="text-3xl lg:text-4xl font-heading font-black italic text-slate-800 tracking-tight drop-shadow-sm">Bons de Sortie</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">Gérez vos autorisations de sortie temporaires</p>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-teal-600 font-bold text-sm shadow-sm">
            <Shield size={18} /> 
            <span>Vérification Digitale</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Form Section */}
        <div className="xl:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-600 p-2.5 rounded-xl text-white">
                <Plus size={20} />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-800">Nouvelle Sortie</h2>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-600">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                </div>
            )}

            <form onSubmit={demanderSortie} className="space-y-5">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Début de la sortie</label>
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-bold text-slate-700 outline-none focus:border-teal-500 shadow-sm cursor-pointer"
                            value={formData.heureDebut}
                            onChange={(e) => {
                                const h = e.target.value;
                                setFormData({...formData, heureDebut: h, heureFin: (parseInt(h)+1).toString().padStart(2, '0')});
                            }}
                        >
                            {getStartHours().map(h => (
                                <option key={h} value={h}>{h} h</option>
                            ))}
                        </select>
                        <select 
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-bold text-slate-700 outline-none focus:border-teal-500 shadow-sm cursor-pointer"
                            value={formData.minuteDebut}
                            onChange={(e) => setFormData({...formData, minuteDebut: e.target.value})}
                        >
                            <option value="00">00 min</option>
                            <option value="30">30 min</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fin prévue</label>
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-bold text-slate-700 outline-none focus:border-teal-500 shadow-sm cursor-pointer"
                            value={formData.heureFin}
                            onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                        >
                            {getEndHours().map(h => (
                                <option key={h} value={h}>{h} h</option>
                            ))}
                        </select>
                        <select 
                            className="w-full bg-slate-200 border border-slate-200 p-2.5 rounded-lg font-bold text-slate-400 cursor-not-allowed"
                            value={formData.minuteFin}
                            disabled
                        >
                            <option value="00">00 min</option>
                            <option value="30">30 min</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Motif</label>
                  <textarea
                    value={formData.motif}
                    onChange={(e) => setFormData({...formData, motif: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-semibold text-slate-700 min-h-[80px] focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none"
                    placeholder="Raison de la sortie..."
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Chargement..." : "Soumettre la demande"}
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Historique</h2>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 italic">
              <Info size={14} className="text-teal-500" /> Codes QR actifs après validation
            </div>
          </div>

          {sorties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center gap-3">
               <Shield size={48} className="text-slate-100" />
               <p className="text-slate-400 font-semibold text-sm italic">Aucun bon de sortie enregistré</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sorties.map((sortie) => {
                const isApproved = sortie.statutCycleVie === 'APPROUVE' || sortie.statutCycleVie === 'APPROUVÉ';
                const isCancelled = sortie.statutCycleVie === 'ANNULÉ' || sortie.statutCycleVie === 'ANNULE';
                const isRefused = sortie.statutCycleVie?.includes('REFUSE') || sortie.statutCycleVie?.includes('REFUSÉ');
                const isCancellable = !isApproved && !isCancelled && !isRefused;
                const qrData = `BON_SORTIE|${user?.sub || 'EMP'}|${new Date(sortie.dateSoumission).toLocaleDateString()}|${sortie.heureDebut}-${sortie.heureFin}|VALIDATED_SOMEPHARM`;
                
                return (
                  <div key={sortie.idRequete} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center gap-6 justify-between transition-all hover:shadow-md group">
                    
                    <div className="flex-1 space-y-4 text-center sm:text-left min-w-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border flex items-center gap-1.5 ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          isCancelled ? 'bg-slate-50 text-slate-400 border-slate-200' :
                          isRefused ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                        }`}>
                          {isApproved ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                          {sortie.statutCycleVie.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300 text-[10px] font-bold uppercase tabular-nums">#{sortie.idRequete}</span>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                          {sortie.heureDebut} <ChevronRight size={16} className="text-slate-300" /> {sortie.heureFin}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Date: {new Date(sortie.dateSoumission).toLocaleDateString()}</p>
                      </div>
      
                      <div className="bg-slate-50 p-3 rounded-xl border-l-4 border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 line-clamp-2" title={sortie.description}>
                          {sortie.description || "Aucun motif précisé."}
                        </p>
                      </div>
      
                      {isCancellable && (
                        <button 
                          onClick={() => setCancelDialog(sortie.idRequete)}
                          className="text-[10px] font-bold text-rose-500 uppercase hover:text-rose-700 hover:underline flex items-center gap-1 mx-auto sm:mx-0"
                        >
                          <XCircle size={14} /> Annuler la demande
                        </button>
                      )}
                    </div>
     
                    <div className="shrink-0 flex flex-col items-center gap-3">
                      {isApproved ? (
                        <div className="relative group/qr p-3 bg-white border border-slate-100 rounded-2xl shadow-sm transition-all hover:bg-slate-50">
                          <QRCodeSVG value={qrData} size={100} level="H" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity bg-slate-900/10 rounded-2xl">
                            <button 
                              onClick={() => handleDownload(sortie.idRequete)}
                              className="p-2 bg-white text-teal-600 rounded-full shadow-lg hover:scale-110 transition-all"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-[124px] h-[124px] rounded-2xl flex flex-col items-center justify-center p-4 text-center border ${isCancelled ? 'bg-slate-50 border-slate-100' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                           {isCancelled ? <XCircle size={24} className="text-slate-200 mb-1" /> : <Clock size={24} className="text-slate-200 mb-1 animate-pulse" />}
                           <p className="text-[8px] font-bold text-slate-400 uppercase leading-tight">{isCancelled ? "Annulée" : "En cours"}</p>
                        </div>
                      )}
                      {isApproved && <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">Prêt</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        onConfirm={confirmCancel}
        title="Annuler le bon"
        description="Voulez-vous vraiment annuler ce bon de sortie ?"
        isDestructive={true}
      />
    </div>
  );
}