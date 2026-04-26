"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { 
  Megaphone, 
  Plus, 
  Pin, 
  Trash2, 
  Calendar, 
  FileText, 
  Info, 
  PartyPopper,
  X,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  Users,
  Target,
  ShieldAlert,
  Search,
  Eye,
  Paperclip,
  Loader2,
  Download,
  AlertCircle,
  File,
  BarChart3,
  Globe,
  MapPin,
  Briefcase
} from "lucide-react";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CommunicationPage() {
  const [annonces, setAnnonces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [sites, setSites] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const fileInputRef = useRef(null);

  const [newPost, setNewPost] = useState({
    titre: "",
    contenu: "",
    typeAnnonce: "NEWS",
    isPinned: false,
    targetType: "GENERAL",
    targetValue: "",
    priority: "NORMAL",
    status: "PUBLISHED",
    attachmentUrl: ""
  });

  useEffect(() => {
    fetchAnnonces();
    fetchSupportData();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/annonces", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        const annoncesWithStats = await Promise.all(data.map(async (a) => {
           const sRes = await fetch(`http://localhost:8080/api/annonces/${a.idAnnonce}/stats`, {
              headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
           });
           const stats = sRes.ok ? await sRes.json() : { count: 0 };
           return { ...a, readCount: stats.count };
        }));
        setAnnonces(annoncesWithStats);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSupportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [uRes, dRes, sRes] = await Promise.all([
        fetch("http://localhost:8080/api/utilisateurs/all", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/departements", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/config/sites", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (dRes.ok) setDepts(await dRes.json());
      if (sRes.ok) setSites(await sRes.json());
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/uploads/communication/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      
      if (res.ok) {
        const url = await res.text();
        setNewPost({ ...newPost, attachmentUrl: url });
      }
    } catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const handleCreate = async () => {
    if (!newPost.titre || !newPost.contenu) return;
    try {
      const payload = { ...newPost };
      if (newPost.targetType === "SELECTIVE") {
        payload.targetValue = selectedUsers.map(u => u.idUser).join(",");
      }

      const res = await fetch("http://localhost:8080/api/annonces", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchAnnonces();
      }
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setNewPost({
      titre: "",
      contenu: "",
      typeAnnonce: "NEWS",
      isPinned: false,
      targetType: "GENERAL",
      targetValue: "",
      priority: "NORMAL",
      status: "PUBLISHED",
      attachmentUrl: ""
    });
    setUploadedFile(null);
    setSelectedUsers([]);
    setSearchUser("");
  };

  const deleteAnnonce = async (id: number) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await fetch(`http://localhost:8080/api/annonces/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    fetchAnnonces();
  };

  const togglePin = async (id: number) => {
    await fetch(`http://localhost:8080/api/annonces/${id}/pin`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    fetchAnnonces();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-8 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200">
              <Megaphone size={40} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                Communication <span className="text-blue-600">Hub</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                <ShieldAlert size={14} className="text-blue-500" />
                Gestion & Pilotage des annonces officielles
              </p>
           </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] shadow-2xl shadow-blue-100 flex items-center gap-4 hover:scale-105 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
        >
           <Plus size={24} strokeWidth={3} /> Créer une annonce
        </button>
      </div>

      {/* FEED */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {annonces.map((annonce: any) => (
           <div 
             key={annonce.idAnnonce} 
             className={`bg-white rounded-[4rem] border-2 shadow-sm p-12 transition-all hover:shadow-2xl relative group flex flex-col
               ${annonce.pinned ? "border-blue-100 bg-blue-50/10" : "border-gray-50"}
               ${annonce.priority === "URGENT" ? "border-red-100 ring-8 ring-red-50/30" : ""}`}
           >
              {/* TOP ACTIONS */}
              <div className="absolute top-8 right-10 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                 <button onClick={() => togglePin(annonce.idAnnonce)} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 shadow-sm transition-all hover:scale-110">
                    <Pin size={20} fill={annonce.pinned ? "currentColor" : "none"} />
                 </button>
                 <button onClick={() => deleteAnnonce(annonce.idAnnonce)} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-600 shadow-sm transition-all hover:scale-110">
                    <Trash2 size={20} />
                 </button>
              </div>

              {/* TAGS & PRIORITY */}
              <div className="flex items-center gap-4 mb-8">
                 <TypeBadge type={annonce.typeAnnonce} />
                 <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border
                    ${annonce.priority === "URGENT" ? "bg-red-600 text-white border-red-600" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {annonce.priority === "URGENT" ? <ShieldAlert size={12} /> : <Clock size={12} />} {annonce.priority}
                 </div>
                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-auto">
                    {new Date(annonce.datePublication).toLocaleDateString()}
                 </span>
              </div>

              {/* CONTENT */}
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-6 uppercase italic">
                {annonce.titre}
              </h2>
              
              <div 
                className="text-gray-500 font-medium leading-relaxed mb-10 prose prose-sm max-w-none ql-editor ql-viewer"
                dangerouslySetInnerHTML={{ __html: annonce.contenu }}
              />

              {/* INTERNAL STATS & INFO WIDGET */}
              <div className="bg-gray-50/50 rounded-[3rem] border border-gray-100 p-8 mb-8 space-y-6">
                  <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} className="text-blue-500" /> Métriques & Audience
                      </h4>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                          <Eye size={14} className="text-emerald-500" />
                          <span className="text-xs font-black text-emerald-600">{annonce.readCount || 0} Lectures</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {/* Targeting Info */}
                      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                              <TargetSizeIcon type={annonce.targetType} />
                          </div>
                          <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase">Ciblage</p>
                              <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                                {annonce.targetType === "GENERAL" ? "Tous les employés" : annonce.targetValue || "Non spécifié"}
                              </p>
                          </div>
                      </div>

                      {/* File Info */}
                      <div className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all
                         ${annonce.attachmentUrl ? "bg-white border-blue-100" : "bg-gray-50 border-transparent opacity-50"}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                             ${annonce.attachmentUrl ? "bg-emerald-50 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>
                              <Paperclip size={18} />
                          </div>
                          <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase">Fichier</p>
                              <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                                {annonce.attachmentUrl ? "Document joint" : "Aucun fichier"}
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Progress Bar (Simulated reach) */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black text-gray-400 uppercase">Taux d'engagement</span>
                         <span className="text-[10px] font-black text-blue-600 uppercase">Est. 65%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-600 w-[65%] rounded-full shadow-lg shadow-blue-100" />
                      </div>
                  </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-xl shadow-blue-100 italic">
                       {annonce.auteur?.matricule?.substring(0, 2)}
                    </div>
                    <div>
                       <p className="text-xs font-black text-gray-900 uppercase italic leading-none">{annonce.auteur?.prenom} {annonce.auteur?.nom}</p>
                       <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Administrateur RH</p>
                    </div>
                 </div>

                 {annonce.attachmentUrl && (
                    <a 
                      href={`http://localhost:8080${annonce.attachmentUrl}`} 
                      target="_blank"
                      className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-100 flex items-center gap-2 hover:scale-110 transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                       <Download size={14} /> Aperçu
                    </a>
                 )}
              </div>
           </div>
         ))}
      </div>

      {/* MODAL CREATION (UNCHANGED LOGIC, JUST RE-STYLED FOR CONSISTENCY) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
              <div className="p-10 border-b flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-100">
                        <Plus size={32} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Nouvelle Publication</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Diffusez votre message à l'entreprise</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowModal(false); resetForm(); }} className="p-5 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-3xl transition-all hover:rotate-90">
                    <X size={28} />
                 </button>
              </div>

              <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                             <FileText size={14} /> Titre de l'annonce
                           </label>
                           <input 
                             type="text" 
                             value={newPost.titre}
                             onChange={(e) => setNewPost({...newPost, titre: e.target.value})}
                             placeholder="Ex: Mise à jour des procédures de sécurité 2026"
                             className="w-full bg-gray-50 border-2 border-gray-100 p-8 rounded-[2.5rem] text-lg font-black focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 tracking-tight"
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                             <Megaphone size={14} /> Contenu du message
                           </label>
                           <div className="border-2 border-gray-100 rounded-[3rem] overflow-hidden bg-gray-50 min-h-[350px]">
                               <ReactQuill 
                                 theme="snow"
                                 value={newPost.contenu}
                                 onChange={(content) => setNewPost({...newPost, contenu: content})}
                                 placeholder="Rédigez votre annonce ici..."
                                 className="h-[280px] mb-12"
                               />
                           </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* TYPE & PRIO */}
                        <div className="bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100 space-y-8">
                           <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                             <Info size={16} /> Configuration
                           </h4>
                           
                           <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Type d'annonce</label>
                              <select 
                                value={newPost.typeAnnonce}
                                onChange={(e) => setNewPost({...newPost, typeAnnonce: e.target.value})}
                                className="w-full bg-white border-2 border-gray-100 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                              >
                                 <option value="NEWS">📢 Actualité</option>
                                 <option value="EVENT">🎉 Événement</option>
                                 <option value="NOTE_SERVICE">📋 Note de Service</option>
                              </select>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Niveau d'Urgence</label>
                              <select 
                                value={newPost.priority}
                                onChange={(e) => setNewPost({...newPost, priority: e.target.value})}
                                className={`w-full border-2 p-5 rounded-2xl text-xs font-black uppercase outline-none transition-all cursor-pointer
                                  ${newPost.priority === "URGENT" ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 text-gray-600"}`}
                              >
                                 <option value="NORMAL">🟢 Normal</option>
                                 <option value="URGENT">🔴 Urgent (Popup)</option>
                              </select>
                           </div>
                        </div>

                        {/* TARGETING */}
                        <div className="bg-blue-50/30 p-8 rounded-[3rem] border border-blue-100/50 space-y-6">
                           <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                             <Target size={16} /> Audience
                           </h4>
                           <div className="flex flex-wrap gap-2">
                              {["GENERAL", "DEPARTMENT", "ROLE", "SITE", "SELECTIVE"].map(type => (
                                <button
                                  key={type}
                                  onClick={() => setNewPost({...newPost, targetType: type, targetValue: ""})}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all
                                    ${newPost.targetType === type ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-100"}`}
                                >
                                  {type}
                                </button>
                              ))}
                           </div>

                           {newPost.targetType === "DEPARTMENT" && (
                              <select 
                                value={newPost.targetValue}
                                onChange={(e) => setNewPost({...newPost, targetValue: e.target.value})}
                                className="w-full bg-white border-2 border-gray-100 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500 transition-all"
                              >
                                 <option value="">Sélectionner Département</option>
                                 {depts.map((d:any) => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                              </select>
                           )}

                           {newPost.targetType === "SELECTIVE" && (
                              <div className="space-y-4">
                                 <input 
                                   type="text"
                                   placeholder="Rechercher utilisateur..."
                                   value={searchUser}
                                   onChange={(e) => setSearchUser(e.target.value)}
                                   className="w-full bg-white border-2 border-gray-100 p-5 rounded-2xl text-[10px] font-bold outline-none focus:border-blue-500"
                                 />
                                 <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(u => (
                                      <div key={u.idUser} className="bg-white text-blue-600 px-3 py-2 rounded-lg text-[8px] font-black flex items-center gap-2 border border-blue-100">
                                         {u.nom} <X size={10} className="cursor-pointer" onClick={() => setSelectedUsers(selectedUsers.filter(su => su.idUser !== u.idUser))} />
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* ATTACHMENT */}
                        <div className="space-y-4">
                           <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                           <div 
                             onClick={() => !uploading && fileInputRef.current?.click()}
                             className={`border-4 border-dashed p-8 rounded-[3rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group relative
                               ${newPost.attachmentUrl ? "border-emerald-200 bg-emerald-50" : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/20"}`}
                           >
                               {uploading ? (
                                  <Loader2 className="animate-spin text-blue-600" size={32} />
                               ) : newPost.attachmentUrl ? (
                                  <div className="text-center">
                                     <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                                     <p className="text-[10px] font-black text-emerald-900 uppercase truncate max-w-[150px]">{uploadedFile?.name}</p>
                                  </div>
                               ) : (
                                  <>
                                     <Paperclip className="text-gray-300 group-hover:text-blue-500" size={32} />
                                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ajouter un document</span>
                                  </>
                               )}
                           </div>
                        </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-8 pt-8 border-t border-gray-100">
                    <button 
                       onClick={() => { setShowModal(false); resetForm(); }}
                       className="flex-1 bg-gray-100 text-gray-500 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Annuler
                    </button>
                    <button 
                      onClick={handleCreate}
                      disabled={uploading}
                      className="flex-[2] bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                    >
                       <Send size={24} /> Diffuser la publication
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex items-center gap-8 hover:shadow-lg transition-shadow">
      <div className={`w-20 h-20 rounded-[2rem] bg-${color}-50 flex items-center justify-center text-${color}-600`}>
        {React.cloneElement(icon as React.ReactElement, { size: 32 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{title}</p>
        <p className="text-4xl font-black text-gray-900 tracking-tighter mt-1">{value}</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const configs: any = {
    NEWS: { label: "Actualité", icon: <Globe size={14}/>, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    EVENT: { label: "Événement", icon: <PartyPopper size={14}/>, color: "bg-blue-50 text-blue-600 border-blue-100" },
    NOTE_SERVICE: { label: "Note de Service", icon: <Briefcase size={14}/>, color: "bg-amber-50 text-amber-600 border-amber-100" },
  };
  const config = configs[type] || configs.NEWS;
  return (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest shadow-sm ${config.color}`}>
       {config.icon} {config.label}
    </div>
  );
}

function TargetSizeIcon({ type }: { type: string }) {
  if (type === "GENERAL") return <Globe size={18} />;
  if (type === "DEPARTMENT") return <MapPin size={18} />;
  if (type === "ROLE") return <Users size={18} />;
  if (type === "SITE") return <MapPin size={18} />;
  return <Target size={18} />;
}
