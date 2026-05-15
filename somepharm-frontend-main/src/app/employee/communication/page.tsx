"use client";
import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { useUI } from "../../../context/UIContext";
import { 
  Megaphone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Eye,
  FileText,
  X,
  Download,
  Paperclip,
  Maximize2,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function EmployeeCommunicationPage() {
  const { addToast } = useUI();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnonce, setSelectedAnnonce] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/annonces/targeted", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setAnnonces(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/annonces/${id}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setAnnonces((prev: any) => prev.map((a: any) => a.idAnnonce === id ? { ...a, isRead: true } : a));
        addToast("success", "Message marqué comme lu");
      }
    } catch (err) { console.error(err); }
  };

  const isImage = (url: string) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-teal-500" />
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      {/* HEADER */}
      <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 uppercase">
            Fil <span className="text-teal-600">d'Actualités</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs mt-1 flex items-center gap-2">
            <Megaphone size={14} className="text-teal-500" />
            Communications officielles de SomePharm
          </p>
        </div>
        <div className="bg-teal-50 p-4 rounded-2xl hidden sm:block">
           <Megaphone size={32} className="text-teal-600" />
        </div>
      </div>

      {/* FEED */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
         {annonces.length > 0 ? annonces.map((annonce: any) => (
           <div 
             key={annonce.idAnnonce} 
             onClick={() => setSelectedAnnonce(annonce)}
             className={`bg-white rounded-2xl border shadow-sm p-5 lg:p-6 transition-all hover:shadow-md relative flex flex-col md:flex-row gap-4 lg:gap-6 cursor-pointer group
               ${annonce.priority === "URGENT" ? "border-rose-100 bg-rose-50/10" : "border-slate-100"}
               ${annonce.isRead ? "opacity-70" : "ring-2 ring-teal-500/10 border-teal-100"}`}
           >
              <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                     <TypeBadge type={annonce.typeAnnonce} />
                     <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Calendar size={12} /> {new Date(annonce.datePublication).toLocaleDateString()}
                     </span>
                     {annonce.priority === "URGENT" && (
                        <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                           <ShieldAlert size={10} /> Urgent
                        </span>
                     )}
                     {annonce.attachmentUrl && (
                        <span className="text-teal-600 flex items-center gap-1 text-[9px] font-bold uppercase bg-teal-50 px-2 py-0.5 rounded">
                           <Paperclip size={10} /> Joint
                        </span>
                     )}
                  </div>

                  <h2 className="text-lg lg:text-xl font-heading font-bold text-slate-900 leading-tight mb-2 truncate">
                    {annonce.titre}
                  </h2>
                  
                  <div 
                    className="text-slate-500 text-sm font-medium line-clamp-2 mb-4 prose prose-slate"
                    dangerouslySetInnerHTML={{ __html: annonce.contenu }}
                  />

                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-teal-600 text-[10px]">
                        {annonce.auteur?.matricule?.substring(0, 2)}
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">Par {annonce.auteur?.prenom} {annonce.auteur?.nom}</p>
                  </div>
              </div>

              <div className="flex md:flex-col justify-between items-center md:items-end gap-3" onClick={(e) => e.stopPropagation()}>
                  {!annonce.isRead ? (
                    <button 
                      onClick={() => markAsRead(annonce.idAnnonce)}
                      className="bg-teal-600 text-white px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 hover:bg-teal-700 active:scale-95 transition-all font-bold text-[10px] uppercase"
                    >
                       <CheckCircle2 size={14} /> Lu
                    </button>
                  ) : (
                    <div className="text-emerald-600 flex items-center gap-1.5 font-bold text-[10px] uppercase px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                       <CheckCircle2 size={12} /> Consulté
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:text-teal-600 group-hover:bg-teal-50 transition-all hidden md:block">
                     <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
              </div>
           </div>
         )) : (
           <div className="bg-white p-12 rounded-2xl border border-slate-100 flex flex-col items-center gap-4 text-center">
             <AlertCircle size={48} className="text-slate-200" />
             <p className="text-slate-400 font-medium italic">Aucune communication pour le moment.</p>
           </div>
         )}
      </div>

      {/* DETAIL MODAL */}
      <Modal 
        isOpen={!!selectedAnnonce} 
        onClose={() => { setSelectedAnnonce(null); setShowPreview(false); }} 
        title="Détail du message"
        maxWidth={showPreview ? "max-w-6xl" : "max-w-2xl"}
      >
        {selectedAnnonce && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`flex-1 space-y-6 ${showPreview ? 'lg:max-w-sm' : ''}`}>
              <div className="flex flex-wrap items-center gap-3">
                 <TypeBadge type={selectedAnnonce.typeAnnonce} />
                 {selectedAnnonce.priority === "URGENT" && (
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">Urgent</span>
                 )}
              </div>

              <h3 className="text-xl font-heading font-bold text-slate-900 leading-tight">
                {selectedAnnonce.titre}
              </h3>

              <div 
                className="text-slate-600 text-sm font-medium leading-relaxed prose prose-slate ql-editor ql-viewer"
                dangerouslySetInnerHTML={{ __html: selectedAnnonce.contenu }}
              />

              {selectedAnnonce.attachmentUrl && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm border border-slate-100">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Document joint disponible</p>
                    <button 
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-teal-600 text-[10px] font-bold uppercase hover:underline"
                    >
                      {showPreview ? "Cacher l'aperçu" : "Afficher l'aperçu"}
                    </button>
                  </div>
                  <a 
                    href={`http://localhost:8080${selectedAnnonce.attachmentUrl}`}
                    target="_blank"
                    className="p-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all"
                  >
                    <Download size={18} />
                  </a>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-teal-600 text-xs">
                    {selectedAnnonce.auteur?.matricule?.substring(0, 2)}
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Par {selectedAnnonce.auteur?.prenom} {selectedAnnonce.auteur?.nom} (RH)</p>
                </div>
                
                {!selectedAnnonce.isRead && (
                   <button 
                     onClick={() => { markAsRead(selectedAnnonce.idAnnonce); setSelectedAnnonce(null); }}
                     className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                   >
                     <CheckCircle2 size={16} /> Marquer comme lu
                   </button>
                )}
              </div>
            </div>

            {showPreview && selectedAnnonce.attachmentUrl && (
              <div className="flex-1 h-[400px] lg:h-[600px] bg-slate-100 rounded-xl overflow-hidden shadow-inner relative">
                 {isImage(selectedAnnonce.attachmentUrl) ? (
                   <img 
                     src={`http://localhost:8080${selectedAnnonce.attachmentUrl}`} 
                     alt="Preview" 
                     className="w-full h-full object-contain"
                   />
                 ) : (
                   <iframe 
                     src={`http://localhost:8080${selectedAnnonce.attachmentUrl}`} 
                     className="w-full h-full border-none bg-white"
                     title="PDF Preview"
                   />
                 )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const configs: any = {
    NEWS: { label: "News", icon: <Megaphone size={12}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    EVENT: { label: "Événement", icon: <Calendar size={12}/>, color: "bg-blue-50 text-blue-600 border-blue-100" },
    NOTE_SERVICE: { label: "Note de Service", icon: <FileText size={12}/>, color: "bg-amber-50 text-amber-600 border-amber-100" },
  };
  const config = configs[type] || configs.NEWS;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[9px] uppercase tracking-wider ${config.color}`}>
       {config.icon} {config.label}
    </div>
  );
}
