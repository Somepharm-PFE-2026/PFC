"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Building, Shield, Phone, Briefcase, 
  Calendar, Clock, Heart, UserCheck, Activity, Edit3
} from "lucide-react";
import ModificationRequestModal from "./components/ModificationRequestModal";

export default function ProfilPage() {
  const router = useRouter();
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    fetchProfil(token);
  }, []);

  const fetchProfil = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/utilisateurs/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfil(await res.json());
    } catch (err) {
      console.error("Erreur chargement profil:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 font-black animate-pulse text-indigo-400">Initialisation du profil...</div>;
  if (!profil) return <div className="p-10 text-rose-500 font-bold uppercase tracking-widest">Erreur de chargement.</div>;

  const seniority = profil.dateEmbauche 
    ? (() => {
        const hire = new Date(profil.dateEmbauche);
        const now = new Date();
        const years = now.getFullYear() - hire.getFullYear();
        const months = now.getMonth() - hire.getMonth();
        if (years > 0) return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
        return `${months > 0 ? months : 1} mois`;
      })()
    : "Non renseignée";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-100">
      
      {/* ═══ Header with Integrated Action ═══ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-10 rounded-[3.5rem] mb-12">
        <div>
          <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-3 border border-slate-800">
             Digital HR Identity
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase leading-none">Mon <span className="text-indigo-400">Profil</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 px-1">Consultation et gestion de vos informations personnelles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-95 rounded-2xl transition-all shadow-lg font-black text-xs uppercase tracking-widest active:scale-95 animate-in fade-in duration-300"
        >
          <Edit3 size={16} strokeWidth={3} />
          <span>Mettre à jour</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ═══ Left Column: Identity Sidebar ═══ */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[3rem] p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
              
              <div className="relative mb-6">
                {profil.photoUrl ? (
                  <img src={profil.photoUrl} className="w-32 h-32 rounded-[2.5rem] mx-auto object-cover border-4 border-slate-800/80 shadow-xl" />
                ) : (
                  <div className="w-32 h-32 bg-indigo-500/10 border-4 border-slate-800 text-indigo-400 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl font-black shadow-xl uppercase">
                    {profil.prenom?.charAt(0)}{profil.nom?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-slate-900 shadow-lg flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{profil.prenom} {profil.nom}</h2>
              <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-6">{profil.poste || "Poste non défini"}</p>
              
              <div className="space-y-3 pt-6 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-slate-400">Matricule</span>
                   <span className="text-slate-200">#{profil.matricule}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-slate-400">Département</span>
                   <span className="text-slate-200">{profil.departement || "Sompharm"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-slate-400">Statut</span>
                   <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">Actif</span>
                </div>
              </div>
           </div>

           <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[3rem] p-8 text-white relative overflow-hidden">
              <UserCheck size={120} className="absolute -right-8 -bottom-8 opacity-5 text-indigo-400" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Management Direct</p>
              {profil.managerDirect ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-2xl flex items-center justify-center text-xl font-black">
                     {profil.managerDirect.prenom?.charAt(0)}{profil.managerDirect.nom?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg leading-tight">{profil.managerDirect.prenom} {profil.managerDirect.nom}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Directeur de Département</p>
                  </div>
                </div>
              ) : (
                <p className="italic text-slate-400 text-sm">Hiérarchie non assignée</p>
              )}
           </div>
        </div>

        {/* ═══ Right Column: Detailed Sections ═══ */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Summary Cards Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-8 rounded-[2.5rem] flex items-center gap-6">
                 <div className="w-16 h-16 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-3xl flex items-center justify-center">
                    <Calendar size={28} />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-white">{seniority}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancienneté Somepharm</p>
                 </div>
              </div>
              <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-8 rounded-[2.5rem] flex items-center gap-6">
                 <div className="w-16 h-16 bg-indigo-500/10 border border-slate-800 text-indigo-400 rounded-3xl flex items-center justify-center">
                    <Heart size={28} />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-white uppercase tracking-tighter">{profil.situationFamiliale || "NON RENSEIGNÉE"}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situation Familiale</p>
                 </div>
              </div>
           </div>

           {/* Professional & Personal Data Blocks */}
           <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[3rem] overflow-hidden">
              <div className="p-10 border-b border-slate-800/80 flex items-center gap-4">
                 <div className="w-2.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"></div>
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Informations Détaillées</h3>
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
                 <InfoItem icon={<Mail size={20}/>} label="Email Professionnel" value={profil.email} />
                 <InfoItem icon={<Phone size={20}/>} label="Téléphone" value={profil.telephone || "Non renseigné"} />
                 <InfoItem icon={<Activity size={20}/>} label="Date de Naissance" value={profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Calendar size={20}/>} label="Date d'Embauche" value={profil.dateEmbauche ? new Date(profil.dateEmbauche).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Briefcase size={20}/>} label="Département" value={profil.departement || "Administration"} />
                 <InfoItem icon={<User size={20}/>} label="Rôle Système" value={typeof profil.role === 'string' ? profil.role : profil.role?.nomRole || "HR"} />
              </div>

              {/* Emergency Region */}
              <div className="mx-10 mb-10 p-8 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 flex items-center justify-between group">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                       <Heart size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Contact d'Urgence</p>
                       <p className="text-xl font-black text-rose-200 uppercase tracking-tighter">{profil.contactUrgence || "À renseigner"}</p>
                    </div>
                 </div>
                 <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-rose-400/80 italic">Informations de secours sécurisées</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {isModalOpen && (
        <ModificationRequestModal 
          profil={profil} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 group">
       <div className="p-3 bg-slate-900 border border-slate-800/80 text-slate-400 group-hover:border-indigo-500/30 group-hover:text-indigo-400 rounded-xl transition-all duration-300">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400/80 uppercase tracking-widest mb-1 transition-colors">{label}</p>
          <p className="text-sm font-bold text-slate-200 group-hover:text-white tracking-tight transition-colors">{value}</p>
       </div>
    </div>
  );
}
