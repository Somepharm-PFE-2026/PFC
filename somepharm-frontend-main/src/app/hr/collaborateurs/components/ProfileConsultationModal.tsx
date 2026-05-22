"use client";
import { 
  User, Mail, Building, Shield, Phone, Briefcase, 
  Calendar, Clock, Heart, UserCheck, Activity, X
} from "lucide-react";

interface ProfileConsultationModalProps {
  user: any;
  onClose: () => void;
}

export default function ProfileConsultationModal({ user, onClose }: ProfileConsultationModalProps) {
  if (!user) return null;

  const seniority = user.dateEmbauche 
    ? (() => {
        const hire = new Date(user.dateEmbauche);
        const now = new Date();
        const years = now.getFullYear() - hire.getFullYear();
        const months = now.getMonth() - hire.getMonth();
        if (years > 0) return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
        return `${months > 0 ? months : 1} mois`;
      })()
    : "Non renseignée";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-slate-900/95 border border-slate-800 rounded-[3rem] w-full max-w-5xl relative shadow-[0_0_50px_rgba(99,102,241,0.15)] backdrop-blur-xl animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-slate-950/85 border border-slate-800/80 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-slate-900/80 hover:border-red-500/20 hover:shadow-lg transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-10 max-h-[90vh] overflow-y-auto no-scrollbar">
          
          {/* Header */}
          <div className="mb-12">
            <div className="bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-3 border border-slate-800">
               Digital Employee Record
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase leading-none">Profil Collaborateur</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 px-1">Consultation détaillée de la fiche employé</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Identity Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-slate-950/85 rounded-[3rem] p-10 border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
                  
                  <div className="relative mb-6">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.nom} className="w-32 h-32 rounded-[2.5rem] mx-auto object-cover border-4 border-slate-900 shadow-xl" />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-sky-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl font-black text-slate-950 shadow-xl border-4 border-slate-900 uppercase">
                        {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{user.prenom} {user.nom}</h2>
                  <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-6">{user.poste || "Poste non défini"}</p>
                  
                  <div className="space-y-3 pt-6 border-t border-slate-800/80">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                       <span className="text-slate-400">Matricule</span>
                       <span className="text-slate-100">#{user.matricule || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                       <span className="text-slate-400">Département</span>
                       <span className="text-slate-100">{user.departement || "Sompharm"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                       <span className="text-slate-400">Statut Compte</span>
                       <span className={`${user.statutCompte === 'ACTIF' ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-indigo-300 bg-indigo-500/10 border border-slate-800'} px-3 py-1 rounded-lg`}>
                         {user.statutCompte}
                       </span>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-950/85 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800/80">
                  <UserCheck size={120} className="absolute -right-8 -bottom-8 opacity-[0.03] text-indigo-400" />
                  <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em] mb-6">Management Direct</p>
                  {user.managerDirect ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-500/10 border border-slate-800 text-indigo-300 rounded-2xl flex items-center justify-center text-xl font-black">
                         {user.managerDirect.prenom?.charAt(0)}{user.managerDirect.nom?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white text-lg leading-tight">{user.managerDirect.prenom} {user.managerDirect.nom}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Directeur de Département</p>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-slate-400 text-sm">Hiérarchie non assignée</p>
                  )}
               </div>
            </div>

            {/* Right Column: Detailed Sections */}
            <div className="lg:col-span-8 space-y-8">
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-950/85 p-8 rounded-[2.5rem] border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)] flex items-center gap-6">
                     <div className="w-16 h-16 bg-indigo-500/10 border border-slate-800 text-indigo-300 rounded-3xl flex items-center justify-center">
                        <Calendar size={28} />
                     </div>
                     <div>
                        <p className="text-2xl font-black text-white">{seniority}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ancienneté Somepharm</p>
                     </div>
                  </div>
                  <div className="bg-slate-950/85 p-8 rounded-[2.5rem] border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)] flex items-center gap-6">
                     <div className="w-16 h-16 bg-indigo-500/10 border border-slate-800 text-indigo-300 rounded-3xl flex items-center justify-center">
                        <Heart size={28} />
                     </div>
                     <div>
                        <p className="text-2xl font-black text-white uppercase tracking-tighter">{user.situationFamiliale || "NON RENSEIGNÉE"}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situation Familiale</p>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-950/85 rounded-[3rem] border border-slate-800/80 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-slate-800/80 flex items-center gap-4">
                     <div className="w-2 h-8 bg-gradient-to-b from-indigo-600 to-sky-600 rounded-full"></div>
                     <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Détails Administratifs</h3>
                  </div>
                  
                  <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
                     <InfoItem icon={<Mail size={20}/>} label="Email Professionnel" value={user.email} />
                     <InfoItem icon={<Phone size={20}/>} label="Téléphone" value={user.telephone || "Non renseigné"} />
                     <InfoItem icon={<Activity size={20}/>} label="Date de Naissance" value={user.dateNaissance ? new Date(user.dateNaissance).toLocaleDateString() : "—"} />
                     <InfoItem icon={<Calendar size={20}/>} label="Date d'Embauche" value={user.dateEmbauche ? new Date(user.dateEmbauche).toLocaleDateString() : "—"} />
                     <InfoItem icon={<Briefcase size={20}/>} label="Département" value={user.departement || "Administration"} />
                     <InfoItem icon={<Shield size={20}/>} label="Rôle Système" value={user.role?.nomRole || "Employé"} />
                  </div>

                  <div className="mx-10 mb-10 p-8 bg-red-500/5 rounded-[2rem] border border-red-500/10 flex items-center justify-between group">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center shadow-lg">
                           <Heart size={24} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Contact d'Urgence</p>
                           <p className="text-xl font-black text-red-300 uppercase tracking-tighter">{user.contactUrgence || "À renseigner"}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 group">
       <div className="p-3 bg-slate-900/80 border border-slate-800/80 text-indigo-400/80 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-sky-600 group-hover:text-white rounded-xl transition-all duration-300">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-bold text-slate-200 tracking-tight">{value}</p>
       </div>
    </div>
  );
}

