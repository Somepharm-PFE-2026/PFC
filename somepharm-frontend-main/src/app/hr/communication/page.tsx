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
   const [success, setSuccess] = useState(false);
   const [depts, setDepts] = useState([]);
   const [sites, setSites] = useState([]);
   const [searchUser, setSearchUser] = useState("");
   const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
   const fileInputRef = useRef<HTMLInputElement>(null);

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

   const [roles, setRoles] = useState([]);

   useEffect(() => {
      fetchAnnonces();
      fetchSupportData();
   }, []);

   const fetchAnnonces = async () => {
      setLoading(true);
      try {
         const res = await fetch("http://localhost:8080/api/annonces", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
         });
         if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
               const annoncesWithStats = await Promise.all(data.map(async (a: any) => {
                  try {
                     const sRes = await fetch(`http://localhost:8080/api/annonces/${a.idAnnonce}/stats`, {
                        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                     });
                     const stats = sRes.ok ? await sRes.json() : { count: 0, totalTarget: 0, engagementRate: 0 };
                     return { ...a, readCount: stats.count, totalTarget: stats.totalTarget, engagementRate: stats.engagementRate };
                  } catch (e) {
                     return { ...a, readCount: 0, totalTarget: 0, engagementRate: 0 };
                  }
               }));
               setAnnonces(annoncesWithStats as any);
            }
         }
      } catch (err) { console.error(err); } finally { setLoading(false); }
   };

   const fetchSupportData = async () => {
      try {
         const token = localStorage.getItem("token");
         const [uRes, dRes, sRes, rRes] = await Promise.all([
            fetch("http://localhost:8080/api/utilisateurs/all", { headers: { "Authorization": `Bearer ${token}` } }),
            fetch("http://localhost:8080/api/departements", { headers: { "Authorization": `Bearer ${token}` } }),
            fetch("http://localhost:8080/api/config/sites", { headers: { "Authorization": `Bearer ${token}` } }),
            fetch("http://localhost:8080/api/config/roles", { headers: { "Authorization": `Bearer ${token}` } }),
         ]);
         if (uRes.ok) setUsers(await uRes.json());
         if (dRes.ok) setDepts(await dRes.json());
         if (sRes.ok) setSites(await sRes.json());
         if (rRes.ok) setRoles(await rRes.json());
      } catch (err) { console.error(err); }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
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
            window.alert("Fichier importé avec succès !");
         } else {
            window.alert("Erreur lors de l'import du fichier.");
         }
      } catch (err) { 
         console.error(err);
         window.alert("Une erreur est survenue lors de l'import.");
      } finally { setUploading(false); }
   };

   const handleCreate = async () => {
      if (!newPost.titre || !newPost.contenu) return;
      try {
         const payload: any = { ...newPost };
         if (newPost.targetType === "SELECTIVE") {
            payload.targetValue = selectedUsers.map((u: any) => u.idUser).join(",");
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
            setSuccess(true);
            window.alert("Annonce publiée avec succès !");
            fetchAnnonces();
            setTimeout(() => {
               setShowModal(false);
               setSuccess(false);
               resetForm();
            }, 3500);
         } else {
            window.alert("Erreur lors de la publication de l'annonce.");
         }
      } catch (err) { 
         console.error(err);
         window.alert("Une erreur est survenue lors de la publication.");
      }
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
      <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-100">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-10 rounded-[3.5rem]">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl">
                  <Megaphone size={40} />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                     Communication <span className="text-indigo-400">Hub</span>
                  </h1>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                     <ShieldAlert size={14} className="text-indigo-400" />
                     Gestion & Pilotage des annonces officielles
                  </p>
               </div>
            </div>

            <button
               onClick={() => setShowModal(true)}
               className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-12 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-4 hover:opacity-90 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
            >
               <Plus size={24} strokeWidth={3} /> Créer une annonce
            </button>
         </div>

         {/* FEED */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {annonces.map((annonce: any) => (
               <div
                  key={annonce.idAnnonce}
                  className={`bg-slate-950/40 backdrop-blur-xl border shadow-[0_0_15px_rgba(99,102,241,0.05)] p-12 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] relative group flex flex-col rounded-[4rem]
               ${annonce.pinned ? "border-indigo-500/30 bg-indigo-600/[0.03]" : "border-slate-800/80"}
               ${annonce.priority === "URGENT" ? "border-rose-500/30 ring-8 ring-rose-500/10 bg-rose-950/5" : ""}`}
               >
                  {/* TOP ACTIONS */}
                  <div className="absolute top-8 right-10 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => togglePin(annonce.idAnnonce)} className="p-4 bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl text-slate-400 hover:text-indigo-400 shadow-sm transition-all hover:scale-110">
                        <Pin size={20} fill={annonce.pinned ? "currentColor" : "none"} className={annonce.pinned ? "text-indigo-400" : ""} />
                     </button>
                     <button onClick={() => deleteAnnonce(annonce.idAnnonce)} className="p-4 bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl text-slate-400 hover:text-rose-500 shadow-sm transition-all hover:scale-110">
                        <Trash2 size={20} />
                     </button>
                  </div>

                  {/* TAGS & PRIORITY */}
                  <div className="flex items-center gap-4 mb-8">
                     <TypeBadge type={annonce.typeAnnonce} />
                     <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border
                    ${annonce.priority === "URGENT" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-950 text-slate-400 border-slate-800/80"}`}>
                        {annonce.priority === "URGENT" ? <ShieldAlert size={12} /> : <Clock size={12} />} {annonce.priority}
                     </div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-auto">
                        {new Date(annonce.datePublication).toLocaleDateString()}
                     </span>
                  </div>

                  {/* CONTENT */}
                  <h2 className="text-3xl font-black text-white tracking-tight leading-tight mb-6 uppercase italic">
                     {annonce.titre}
                  </h2>

                  <div
                     className="text-slate-300 font-medium leading-relaxed mb-10 prose prose-invert prose-sm max-w-none ql-editor ql-viewer"
                     dangerouslySetInnerHTML={{ __html: annonce.contenu }}
                  />

                  {/* INTERNAL STATS & INFO WIDGET */}
                  <div className="bg-slate-950/60 rounded-[3rem] border border-slate-800/60 p-8 mb-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                           <BarChart3 size={14} className="text-indigo-400" /> Métriques & Audience
                        </h4>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-xl">
                           <Eye size={14} className="text-emerald-400" />
                           <span className="text-xs font-black text-emerald-400">{annonce.readCount || 0} Lectures</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        {/* Targeting Info */}
                        <div className="bg-slate-950/40 p-5 rounded-[2rem] border border-slate-800/80 flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-slate-800">
                              <TargetSizeIcon type={annonce.targetType} />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase">Ciblage</p>
                              <p className="text-[11px] font-black text-slate-200 uppercase tracking-tighter">
                                 {annonce.targetType === "GENERAL" ? "Tous les employés" :
                                    annonce.targetType === "SELECTIVE" ? `Spécifique (${annonce.targetValue?.split(',').length || 0})` :
                                       annonce.targetValue || "Non spécifié"}
                              </p>
                           </div>
                        </div>

                        {/* File Info */}
                        <div className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all
                          ${annonce.attachmentUrl ? "bg-slate-950/40 border-indigo-500/15" : "bg-slate-950/20 border-slate-800/60 opacity-40"}`}>
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                             ${annonce.attachmentUrl ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-900 text-slate-600 border-slate-950"}`}>
                              <Paperclip size={18} />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase">Fichier</p>
                              <p className="text-[11px] font-black text-slate-200 uppercase tracking-tighter">
                                 {annonce.attachmentUrl ? "Document joint" : "Aucun fichier"}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Progress Bar (Live Reach) */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Taux d'engagement</span>
                           <span className="text-[10px] font-black text-indigo-400 uppercase italic">
                              {annonce.engagementRate ? annonce.engagementRate.toFixed(1) : 0}% 
                              <span className="text-slate-500 ml-1 font-bold">({annonce.readCount}/{annonce.totalTarget})</span>
                           </span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                           <div 
                              className="h-full bg-gradient-to-r from-indigo-600 to-sky-600 rounded-full shadow-lg transition-all duration-1000 ease-out" 
                              style={{ width: `${annonce.engagementRate || 0}%` }}
                           />
                        </div>
                     </div>
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between mt-auto">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 border border-slate-800 rounded-2xl flex items-center justify-center font-black text-indigo-400 text-sm italic">
                           {annonce.auteur?.matricule?.substring(0, 2)}
                        </div>
                        <div>
                           <p className="text-xs font-black text-white uppercase italic leading-none">{annonce.auteur?.prenom} {annonce.auteur?.nom}</p>
                           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter mt-1">Administrateur RH</p>
                        </div>
                     </div>

                     {annonce.attachmentUrl && (
                        <a
                           href={`http://localhost:8080${annonce.attachmentUrl}`}
                           target="_blank"
                           className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                           <Download size={14} /> Aperçu
                        </a>
                     )}
                  </div>
               </div>
            ))}
         </div>

         {/* MODAL CREATION */}
         {showModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col backdrop-blur-xl">
                  <div className="p-10 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-3xl flex items-center justify-center shadow-2xl">
                           {success ? <CheckCircle2 size={32} /> : <Plus size={32} />}
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                              {success ? "Publication Réussie" : "Nouvelle Publication"}
                           </h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                              {success ? "Votre annonce est maintenant en ligne" : "Diffusez votre message à l'entreprise"}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => { setShowModal(false); resetForm(); setSuccess(false); }} className="p-5 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/30 text-slate-400 hover:text-white rounded-3xl transition-all hover:rotate-90">
                        <X size={28} />
                     </button>
                  </div>

                  {success ? (
                     <div className="p-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="w-32 h-32 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl">
                           <Send size={48} className="translate-x-1" />
                        </div>
                        <div className="space-y-4">
                           <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Félicitations !</h3>
                           <p className="text-slate-400 font-bold text-sm max-w-md mx-auto leading-relaxed">
                              Votre annonce <span className="text-indigo-400 italic">"{newPost.titre}"</span> a été diffusée avec succès. 
                              L'historique se rafraîchit automatiquement...
                           </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em]">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                           Envoi terminé
                        </div>
                     </div>
                  ) : (
                     <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-slate-300">
                        <div className="lg:col-span-2 space-y-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                 <FileText size={14} /> Titre de l'annonce
                              </label>
                              <input
                                 type="text"
                                 value={newPost.titre}
                                 onChange={(e) => setNewPost({ ...newPost, titre: e.target.value })}
                                 placeholder="Ex: Mise à jour des procédures de sécurité 2026"
                                 className="w-full bg-slate-950 border border-slate-800/80 p-8 rounded-[2.5rem] text-lg font-black focus:border-indigo-500/30 outline-none transition-all placeholder:text-slate-700 tracking-tight text-white"
                              />
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                 <Megaphone size={14} /> Contenu du message
                              </label>
                              <div className="border border-slate-800/80 rounded-[3rem] overflow-hidden bg-slate-950 min-h-[350px] text-white">
                                 <ReactQuill
                                    theme="snow"
                                    value={newPost.contenu}
                                    onChange={(content) => setNewPost({ ...newPost, contenu: content })}
                                    placeholder="Rédigez votre annonce ici..."
                                    className="h-[280px] mb-12 text-white"
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-8">
                           {/* TYPE & PRIO */}
                           <div className="bg-slate-950/40 p-8 rounded-[3rem] border border-slate-800/80 space-y-8">
                              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                 <Info size={16} /> Configuration
                              </h4>

                              <div className="space-y-3">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Type d'annonce</label>
                                 <select
                                    value={newPost.typeAnnonce}
                                    onChange={(e) => setNewPost({ ...newPost, typeAnnonce: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500/30 text-white cursor-pointer"
                                 >
                                    <option value="NEWS" className="bg-slate-900">📢 Actualité</option>
                                    <option value="EVENT" className="bg-slate-900">🎉 Événement</option>
                                    <option value="NOTE_SERVICE" className="bg-slate-900">📋 Note de Service</option>
                                 </select>
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Niveau d'Urgence</label>
                                 <select
                                    value={newPost.priority}
                                    onChange={(e) => setNewPost({ ...newPost, priority: e.target.value })}
                                    className={`w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none transition-all cursor-pointer bg-slate-950 border-slate-800/80 text-white
                                   ${newPost.priority === "URGENT" ? "bg-rose-500/10 border-rose-500/20 text-rose-400 focus:border-rose-500" : ""}`}
                                 >
                                    <option value="NORMAL" className="bg-slate-900 text-white">🟢 Normal</option>
                                    <option value="URGENT" className="bg-slate-900 text-white">🔴 Urgent (Popup)</option>
                                 </select>
                              </div>
                           </div>

                           {/* TARGETING */}
                           <div className="bg-indigo-500/5 p-8 rounded-[3rem] border border-slate-800/80 space-y-6">
                              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                 <Target size={16} /> Audience
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                 {["GENERAL", "DEPARTMENT", "ROLE", "SITE", "SELECTIVE"].map(type => (
                                    <button
                                       key={type}
                                       onClick={() => setNewPost({ ...newPost, targetType: type, targetValue: "" })}
                                       className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all
                                    ${newPost.targetType === type ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md" : "bg-slate-950 text-slate-400 border border-slate-800/80 hover:bg-slate-900 hover:text-white"}`}
                                    >
                                       {type}
                                    </button>
                                 ))}
                              </div>

                              {newPost.targetType === "DEPARTMENT" && (
                                 <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase text-slate-500">Choisir les départements</label>
                                    <select
                                       value={newPost.targetValue}
                                       onChange={(e) => setNewPost({ ...newPost, targetValue: e.target.value })}
                                       className="w-full bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500/30 text-white cursor-pointer"
                                    >
                                       <option value="" className="bg-slate-900 text-white">Tous les départements</option>
                                       {depts.map((d: any) => <option key={d.id} value={d.nomDept || d.nom} className="bg-slate-900 text-white">{d.nomDept || d.nom}</option>)}
                                    </select>
                                 </div>
                              )}

                              {newPost.targetType === "ROLE" && (
                                 <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase text-slate-500">Ciblage par Rôle</label>
                                    <select
                                       value={newPost.targetValue}
                                       onChange={(e) => setNewPost({ ...newPost, targetValue: e.target.value })}
                                       className="w-full bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500/30 text-white cursor-pointer"
                                    >
                                       <option value="" className="bg-slate-900 text-white">Tous les rôles</option>
                                       {roles
                                          .filter((r: any) => 
                                             !r.nomRole.includes("HR_MANAGER") && 
                                             !r.nomRole.includes("SUPER_ADMIN") && 
                                             !r.nomRole.includes("RH_ADMIN")
                                          )
                                          .map((r: any) => (
                                          <option key={r.idRole} value={r.nomRole} className="bg-slate-900 text-white">
                                             {formatRoleName(r.nomRole)}
                                          </option>
                                       ))}
                                    </select>
                                 </div>
                              )}

                              {newPost.targetType === "SITE" && (
                                 <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase text-slate-500">Filtrer par Site</label>
                                    <select
                                       value={newPost.targetValue}
                                       onChange={(e) => setNewPost({ ...newPost, targetValue: e.target.value })}
                                       className="w-full bg-slate-950 border border-slate-800/80 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-500/30 text-white cursor-pointer"
                                    >
                                       <option value="" className="bg-slate-900 text-white">Tous les sites</option>
                                       {sites.map((s: any) => <option key={s.idSite} value={s.idSite} className="bg-slate-900 text-white">{s.nomSite || s.nom}</option>)}
                                    </select>
                                 </div>
                              )}

                              {newPost.targetType === "SELECTIVE" && (
                                 <div className="space-y-4">
                                    <div className="relative">
                                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                       <input
                                          type="text"
                                          placeholder="Rechercher par nom ou matricule..."
                                          value={searchUser}
                                          onChange={(e) => setSearchUser(e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-800/80 pl-12 pr-5 py-5 rounded-2xl text-[11px] font-black outline-none focus:border-indigo-500/30 text-white uppercase tracking-tight"
                                       />

                                       {searchUser && (
                                          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[110] max-h-[200px] overflow-y-auto custom-scrollbar text-white backdrop-blur-xl">
                                             {users
                                                .filter((u: any) =>
                                                   (u.nom + " " + u.prenom).toLowerCase().includes(searchUser.toLowerCase()) ||
                                                   (u.matricule || "").toLowerCase().includes(searchUser.toLowerCase())
                                                )
                                                .slice(0, 5)
                                                .map((u: any) => (
                                                   <div
                                                      key={u.idUser}
                                                      onClick={() => {
                                                         if (!selectedUsers.find((su: any) => su.idUser === u.idUser)) {
                                                            setSelectedUsers([...selectedUsers, u] as any);
                                                         }
                                                         setSearchUser("");
                                                       }}
                                                      className="p-4 hover:bg-indigo-500/10 cursor-pointer flex items-center justify-between border-b border-slate-800/60 last:border-0 group"
                                                   >
                                                      <div>
                                                         <p className="text-[10px] font-black text-slate-200 uppercase italic">{u.prenom} {u.nom}</p>
                                                         <p className="text-[8px] font-black text-slate-500 uppercase">#{u.matricule} • {u.departement}</p>
                                                      </div>
                                                      <Plus size={14} className="text-slate-500 group-hover:text-indigo-400" />
                                                   </div>
                                                ))
                                             }
                                          </div>
                                       )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                       {selectedUsers.map((u: any) => (
                                          <div key={u.idUser} className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-3 border border-slate-800 animate-in zoom-in-95">
                                             {u.nom}
                                             <X
                                                size={12}
                                                className="cursor-pointer hover:text-rose-500 transition-colors"
                                                onClick={() => setSelectedUsers(selectedUsers.filter((su: any) => su.idUser !== u.idUser))}
                                             />
                                          </div>
                                       ))}
                                       {selectedUsers.length === 0 && !searchUser && (
                                          <p className="text-[9px] text-slate-500 font-bold uppercase italic">Aucun utilisateur sélectionné</p>
                                       )}
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* ATTACHMENT */}
                           <div className="space-y-4">
                              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                              <div
                                 onClick={() => !uploading && fileInputRef.current?.click()}
                                 className={`border-4 border-dashed p-8 rounded-[3rem] flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group relative bg-slate-950
                                ${newPost.attachmentUrl ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-800/80 hover:border-indigo-500/30 hover:bg-indigo-500/5"}`}
                              >
                                 {uploading ? (
                                    <Loader2 className="animate-spin text-indigo-400" size={32} />
                                 ) : newPost.attachmentUrl ? (
                                    <div className="text-center">
                                       <CheckCircle2 className="text-emerald-400 mx-auto mb-2 animate-bounce" size={32} />
                                       <p className="text-[10px] font-black text-emerald-300 uppercase truncate max-w-[150px]">{uploadedFile?.name}</p>
                                    </div>
                                 ) : (
                                    <>
                                       <Paperclip className="text-slate-600 group-hover:text-indigo-400" size={32} />
                                       <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-400 uppercase tracking-widest text-center">Ajouter un document</span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                     </div>
                  )}

                  <div className="flex items-center gap-8 p-10 bg-slate-950/50 border-t border-slate-800/80">
                     <button
                        onClick={() => { setShowModal(false); resetForm(); }}
                        className="flex-1 bg-slate-800 text-slate-400 hover:text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
                     >
                        Annuler
                     </button>
                     <button
                        onClick={handleCreate}
                        disabled={uploading}
                        className="flex-[2] bg-gradient-to-r from-indigo-600 to-sky-600 text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                     >
                        <Send size={24} /> Diffuser la publication
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function TypeBadge({ type }: { type: any }) {
   const configs: any = {
      NEWS: { label: "Actualité", icon: <Globe size={14} />, color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
      EVENT: { label: "Événement", icon: <PartyPopper size={14} />, color: "bg-indigo-500/10 text-indigo-300 border border-slate-800" },
      NOTE_SERVICE: { label: "Note de Service", icon: <Briefcase size={14} />, color: "bg-sky-500/10 text-sky-300 border border-sky-500/20" },
   };
   const config = configs[type] || configs.NEWS;
   return (
      <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest shadow-sm ${config.color}`}>
         {config.icon} {config.label}
      </div>
   );
}

function TargetSizeIcon({ type }: { type: any }) {
   if (type === "GENERAL") return <Globe size={18} />;
   if (type === "DEPARTMENT") return <MapPin size={18} />;
   if (type === "ROLE") return <Users size={18} />;
   if (type === "SITE") return <MapPin size={18} />;
   return <Target size={18} />;
}

function formatRoleName(role: string) {
   if (!role) return "";
   return role.replace("ROLE_", "")
      .replace("RH_ADMIN", "RESSOURCES HUMAINES")
      .replace("HR_MANAGER", "DIRECTEUR RH")
      .replace("ADMIN", "ADMINISTRATEUR")
      .replace("USER", "COLLABORATEUR")
      .replace("SECURITE", "SÉCURITÉ")
      .replace("_", " ");
}
