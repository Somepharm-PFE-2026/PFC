"use client";
import React, { useState, useEffect } from "react";
import { ShieldAlert, X, CheckCircle2, Megaphone, FileText, Calendar, Download, Maximize2 } from "lucide-react";

export default function UrgentAnnouncementPopup() {
  const [urgentAnnonce, setUrgentAnnonce] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchUrgentAnnonces();
  }, []);

  const fetchUrgentAnnonces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 1. Fetch user profile to get activationDate
      const profileRes = await fetch("http://localhost:8080/api/utilisateurs/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      let activationDate: Date | null = null;
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.activationDate) {
          activationDate = new Date(profile.activationDate);
          // Set to start of day for comparison
          activationDate.setHours(0, 0, 0, 0);
        }
      }

      // 2. Fetch announcements
      const res = await fetch("http://localhost:8080/api/annonces/targeted", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const urgent = data.find((a: any) => {
          // Base conditions
          if (a.priority !== "URGENT" || a.isRead) return false;
          
          // Activation date check: Only show if published on or after activation
          if (activationDate) {
            const pubDate = new Date(a.datePublication);
            if (pubDate < activationDate) return false;
          }
          
          return true;
        });
        setUrgentAnnonce(urgent);
      }
    } catch (err) {
      console.error("Failed to fetch urgent annonces", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmed || !urgentAnnonce) return;

    try {
      const res = await fetch(`http://localhost:8080/api/annonces/${urgentAnnonce.idAnnonce}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setUrgentAnnonce(null);
        setConfirmed(false);
        setShowPreview(false);
        fetchUrgentAnnonces();
      }
    } catch (err) {
      console.error("Failed to confirm announcement", err);
    }
  };

  const isImage = (url: string) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  };

  if (!urgentAnnonce) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-2xl z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className={`bg-white rounded-[4rem] shadow-2xl overflow-hidden border-4 border-red-500/20 animate-in zoom-in-95 duration-300 flex flex-col transition-all
         ${showPreview ? "max-w-[95vw] h-[95vh]" : "max-w-2xl max-h-[90vh]"}`}>
        
        <div className="bg-red-600 p-8 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-4">
             <ShieldAlert size={32} />
             <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Information Urgente</h3>
                <p className="text-[9px] font-bold uppercase opacity-80 line-clamp-1">{urgentAnnonce.titre}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {urgentAnnonce.attachmentUrl && (
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  className={`p-3 rounded-xl flex items-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all
                    ${showPreview ? "bg-white text-red-600 shadow-lg" : "bg-red-700 text-white hover:bg-red-800"}`}
                >
                   <Maximize2 size={16} /> {showPreview ? "Texte" : "Aperçu"}
                </button>
             )}
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
           <div className={`p-10 space-y-8 overflow-y-auto custom-scrollbar transition-all ${showPreview ? "md:w-1/3 border-r" : "w-full"}`}>
              {!showPreview && (
                 <div className="flex items-center gap-4 text-gray-400">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Calendar size={14} /> {new Date(urgentAnnonce.datePublication).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest ml-auto">Par RH</span>
                 </div>
              )}

              {!showPreview && (
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-tight">
                  {urgentAnnonce.titre}
                </h2>
              )}

              <div 
                className="text-gray-600 font-medium leading-relaxed prose prose-red max-w-none bg-red-50/20 p-8 rounded-[2.5rem] border border-red-50 ql-editor ql-viewer"
                dangerouslySetInnerHTML={{ __html: urgentAnnonce.contenu }}
              />

              {urgentAnnonce.attachmentUrl && !showPreview && (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-red-600">
                      <FileText size={20} />
                      <span className="text-[10px] font-black uppercase">Document Joint</span>
                   </div>
                   <a 
                     href={`http://localhost:8080${urgentAnnonce.attachmentUrl}`}
                     target="_blank"
                     className="bg-white p-3 rounded-xl shadow-sm text-red-600"
                   >
                      <Download size={18} />
                   </a>
                </div>
              )}

              <div className="space-y-6 pt-4">
                 <label className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-100">
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all
                       ${confirmed ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-200"}`}>
                       {confirmed && <CheckCircle2 size={18} />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span className="text-xs font-black uppercase text-gray-700 tracking-tight">
                      J'ai pris connaissance de cette information
                    </span>
                 </label>

                 <button 
                   onClick={handleConfirm}
                   disabled={!confirmed}
                   className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3
                     ${confirmed 
                       ? "bg-red-600 text-white shadow-red-200 hover:bg-red-700 scale-105" 
                       : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                 >
                    <CheckCircle2 size={20} /> Valider
                 </button>
              </div>
           </div>

           {showPreview && urgentAnnonce.attachmentUrl && (
              <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
                 {isImage(urgentAnnonce.attachmentUrl) ? (
                   <img 
                     src={`http://localhost:8080${urgentAnnonce.attachmentUrl}`} 
                     alt="Preview" 
                     className="max-w-full max-h-full object-contain rounded-[2.5rem] shadow-2xl"
                   />
                 ) : (
                   <iframe 
                     src={`http://localhost:8080${urgentAnnonce.attachmentUrl}`} 
                     className="w-full h-full rounded-[2.5rem] border-none bg-white shadow-2xl"
                     title="PDF Preview"
                   />
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
