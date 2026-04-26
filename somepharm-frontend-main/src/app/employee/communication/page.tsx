"use client";
import React, { useState, useEffect } from "react";
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
  Maximize2
} from "lucide-react";

export default function EmployeeCommunicationPage() {
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
        setAnnonces(annonces.map((a: any) => a.idAnnonce === id ? { ...a, isRead: true } : a));
      }
    } catch (err) { console.error(err); }
  };

  const isImage = (url: string) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  };

  const isPdf = (url: string) => {
    if (!url) return false;
    return url.match(/\.(pdf)$/) != null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
            Fil <span className="text-blue-600">d'Actualités</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
            <Megaphone size={14} className="text-blue-500" />
            Restez informé des dernières nouvelles de SomePharm
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-[2.5rem]">
           <Megaphone size={32} className="text-blue-600" />
        </div>
      </div>

      {/* FEED */}
      <div className="space-y-6">
         {annonces.map((annonce: any) => (
           <div 
             key={annonce.idAnnonce} 
             onClick={() => setSelectedAnnonce(annonce)}
             className={`bg-white rounded-[3rem] border-2 shadow-sm p-8 transition-all hover:shadow-xl relative group flex flex-col md:flex-row gap-8 cursor-pointer
               ${annonce.priority === "URGENT" ? "border-red-100 bg-red-50/5" : "border-gray-50"}
               ${annonce.isRead ? "opacity-75 grayscale-[0.5]" : "ring-4 ring-blue-50/50 border-blue-50"}`}
           >
              <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                     <TypeBadge type={annonce.typeAnnonce} />
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} /> {new Date(annonce.datePublication).toLocaleDateString()}
                     </span>
                     {annonce.priority === "URGENT" && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-2">
                           <ShieldAlert size={10} /> Urgent
                        </span>
                     )}
                     {annonce.attachmentUrl && (
                        <span className="text-blue-600 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter bg-blue-50 px-3 py-1 rounded-lg">
                           <Paperclip size={10} /> Document Joint
                        </span>
                     )}
                  </div>

                  <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-4 uppercase">
                    {annonce.titre}
                  </h2>
                  
                  <div 
                    className="text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2 overflow-hidden prose prose-sm ql-editor ql-viewer"
                    dangerouslySetInnerHTML={{ __html: annonce.contenu }}
                  />

                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-blue-600 text-[10px]">
                        {annonce.auteur?.matricule?.substring(0, 2)}
                     </div>
                     <p className="text-[9px] font-black text-gray-400 uppercase">Par {annonce.auteur?.prenom} {annonce.auteur?.nom} (RH)</p>
                  </div>
              </div>

              <div className="flex flex-col justify-between items-end gap-4" onClick={(e) => e.stopPropagation()}>
                  {!annonce.isRead ? (
                    <button 
                      onClick={() => markAsRead(annonce.idAnnonce)}
                      className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center gap-3 hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                       <CheckCircle2 size={16} /> Marquer comme lu
                    </button>
                  ) : (
                    <div className="text-emerald-500 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                       <CheckCircle2 size={14} /> Lu
                    </div>
                  )}

                  <button 
                    onClick={() => setSelectedAnnonce(annonce)}
                    className="p-4 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                  >
                     <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
           </div>
         ))}
      </div>

      {/* DETAIL MODAL */}
      {selectedAnnonce && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className={`bg-white w-full rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col transition-all
              ${showPreview ? "max-w-[95vw] h-[95vh]" : "max-w-3xl max-h-[90vh]"}`}>
              
              <div className="p-8 border-b flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-4">
                    <TypeBadge type={selectedAnnonce.typeAnnonce} />
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter line-clamp-1">{selectedAnnonce.titre}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Détails de la publication</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {selectedAnnonce.attachmentUrl && (
                      <button 
                        onClick={() => setShowPreview(!showPreview)}
                        className={`p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest
                          ${showPreview ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                      >
                         <Maximize2 size={20} /> {showPreview ? "Quitter Aperçu" : "Aperçu"}
                      </button>
                    )}
                    <button onClick={() => { setSelectedAnnonce(null); setShowPreview(false); }} className="p-4 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
                       <X size={24} />
                    </button>
                 </div>
              </div>

              <div className={`flex-1 flex flex-col md:flex-row overflow-hidden`}>
                 <div className={`p-10 overflow-y-auto custom-scrollbar transition-all ${showPreview ? "md:w-1/3 border-r" : "w-full"}`}>
                    <div 
                        className="text-gray-600 font-medium leading-relaxed prose prose-blue max-w-none ql-editor ql-viewer mb-10"
                        dangerouslySetInnerHTML={{ __html: selectedAnnonce.contenu }}
                    />

                    {selectedAnnonce.attachmentUrl && !showPreview && (
                        <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                 <FileText size={20} />
                              </div>
                              <p className="text-blue-900 font-black text-[10px] uppercase italic tracking-tighter">Fichier disponible</p>
                           </div>
                           <a 
                             href={`http://localhost:8080${selectedAnnonce.attachmentUrl}`}
                             target="_blank"
                             className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-200 hover:scale-110 transition-all"
                           >
                              <Download size={18} />
                           </a>
                        </div>
                    )}

                    <div className="pt-10 border-t border-gray-100 mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-blue-600 text-xs">
                              {selectedAnnonce.auteur?.matricule?.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-800 uppercase">{selectedAnnonce.auteur?.prenom} {selectedAnnonce.auteur?.nom}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Équipe RH</p>
                            </div>
                        </div>

                        {!selectedAnnonce.isRead && (
                           <button 
                             onClick={() => { markAsRead(selectedAnnonce.idAnnonce); setSelectedAnnonce(null); setShowPreview(false); }}
                             className="w-full bg-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-emerald-100 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                           >
                              <CheckCircle2 size={16} /> J'ai lu ce message
                           </button>
                        )}
                    </div>
                 </div>

                 {showPreview && selectedAnnonce.attachmentUrl && (
                    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                       {isImage(selectedAnnonce.attachmentUrl) ? (
                         <img 
                           src={`http://localhost:8080${selectedAnnonce.attachmentUrl}`} 
                           alt="Preview" 
                           className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
                         />
                       ) : (
                         <iframe 
                           src={`http://localhost:8080${selectedAnnonce.attachmentUrl}`} 
                           className="w-full h-full rounded-2xl border-none bg-white shadow-xl"
                           title="PDF Preview"
                         />
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[8px] uppercase tracking-widest ${config.color}`}>
       {config.icon} {config.label}
    </div>
  );
}
