"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Building, Shield, Phone, Briefcase, 
  Calendar, Clock, Heart, UserCheck, Activity, Edit3,
  Loader2, MapPin, CheckCircle2, ChevronRight
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

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-sky-500" />
    </div>
  );
  
  if (!profil) return (
    <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-700 font-bold uppercase text-xs">
      Erreur de chargement du profil.
    </div>
  );

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
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Header Section */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-sky-50/80 via-white to-blue-50/30 border border-sky-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden mb-2">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 border-l-4 border-sky-500 pl-5">
          <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-sky-100 shadow-sm">
             Identité Digitale
          </div>
          <h1 className="text-3xl lg:text-4xl font-heading font-black italic text-slate-800 tracking-tight drop-shadow-sm">Mon Profil</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">Gérez vos informations personnelles et professionnelles</p>
        </div>
        <div className="relative z-10">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 shadow-sm hover:border-sky-500 hover:text-sky-600 px-6 py-3 rounded-2xl font-bold text-sm transition-all group active:scale-95"
          >
            <Edit3 size={18} className="text-slate-400 group-hover:text-sky-600" />
            <span>Mettre à jour</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-slate-50 to-transparent"></div>
              
              <div className="relative mb-6">
                {profil.photoUrl ? (
                  <img src={profil.photoUrl} className="w-28 h-28 rounded-3xl mx-auto object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-28 h-28 bg-sky-600 rounded-3xl mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-md border-4 border-white uppercase">
                    {profil.prenom?.charAt(0)}{profil.nom?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 right-[30%] lg:right-[25%] bg-sky-500 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </div>

              <h2 className="text-xl font-heading font-bold text-slate-900 mb-1">{profil.prenom} {profil.nom}</h2>
              <p className="text-sky-600 font-bold text-xs uppercase tracking-wider mb-6">{profil.poste || "Poste non défini"}</p>
              
              <div className="space-y-3 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                   <span className="text-slate-400">Matricule</span>
                   <span className="text-slate-700">#{profil.matricule}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                   <span className="text-slate-400">Département</span>
                   <span className="text-slate-700">{profil.departement || "Non assigné"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                   <span className="text-slate-400">Statut</span>
                   <span className="text-emerald-600 font-bold">Actif</span>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
              <UserCheck size={80} className="absolute -right-4 -bottom-4 opacity-10" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Manager Direct</p>
              {profil.managerDirect ? (
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-lg font-bold">
                     {profil.managerDirect.prenom?.charAt(0)}{profil.managerDirect.nom?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base leading-tight">{profil.managerDirect.prenom} {profil.managerDirect.nom}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Responsable Hiérarchique</p>
                  </div>
                </div>
              ) : (
                <p className="italic text-slate-400 text-xs">Aucun manager assigné</p>
              )}
           </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
           
           {/* Summary Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                 <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                    <Calendar size={24} />
                 </div>
                 <div>
                    <p className="text-xl font-heading font-bold text-slate-900">{seniority}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ancienneté</p>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
                 <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                    <Heart size={24} />
                 </div>
                 <div>
                    <p className="text-xl font-heading font-bold text-slate-900 uppercase">{profil.situationFamiliale || "—"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Situation Familiale</p>
                 </div>
              </div>
           </div>

           {/* Detailed Info Section */}
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-sky-600 rounded-full"></div>
                 <h3 className="font-heading font-bold text-slate-800">Informations Complémentaires</h3>
              </div>
              
              <div className="p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                 <InfoItem icon={<Mail size={18}/>} label="Email Professionnel" value={profil.email} />
                 <InfoItem icon={<Phone size={18}/>} label="Téléphone" value={profil.telephone || "Non renseigné"} />
                 <InfoItem icon={<Activity size={18}/>} label="Date de Naissance" value={profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Calendar size={18}/>} label="Date d'Embauche" value={profil.dateEmbauche ? new Date(profil.dateEmbauche).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Briefcase size={18}/>} label="Poste Actuel" value={profil.poste || "Non défini"} />
                 <InfoItem icon={<Shield size={18}/>} label="Rôle Système" value={profil.role?.nomRole?.replace('ROLE_', '') || "Employé"} />
              </div>

              {/* Emergency Region */}
              <div className="m-6 p-6 bg-rose-50/50 rounded-xl border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md">
                       <Heart size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Contact d'Urgence</p>
                       <p className="text-lg font-bold text-rose-900">{profil.contactUrgence || "À renseigner"}</p>
                    </div>
                 </div>
                 <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-semibold text-rose-400 italic">Données sécurisées</p>
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
    <div className="flex items-start gap-4">
       <div className="p-2.5 bg-slate-50 text-slate-400 rounded-lg">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]" title={value}>{value}</p>
       </div>
    </div>
  );
}