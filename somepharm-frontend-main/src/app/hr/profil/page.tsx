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

  if (loading) return <div className="p-10 font-black animate-pulse text-blue-600">Initialisation du profil...</div>;
  if (!profil) return <div className="p-10 text-red-500 font-bold uppercase tracking-widest">Erreur de chargement.</div>;

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
    <div className="p-10 bg-gray-50/50 min-h-screen">
      
      {/* ═══ Header with Integrated Action ═══ */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <div className="bg-blue-600/10 text-blue-600 px-4 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-200">
             Digital HR Identity
          </div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase leading-none">Mon Profil</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2 px-1">Consultation et gestion de vos informations personnelles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-white border shadow-sm hover:shadow-lg hover:border-blue-300 rounded-2xl transition-all group"
        >
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Edit3 size={16} />
          </div>
          <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Mettre à jour</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ═══ Left Column: Identity Sidebar ═══ */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50/50 to-transparent"></div>
              
              <div className="relative mb-6">
                {profil.photoUrl ? (
                  <img src={profil.photoUrl} className="w-32 h-32 rounded-[2.5rem] mx-auto object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl font-black text-white shadow-xl border-4 border-white uppercase">
                    {profil.prenom?.charAt(0)}{profil.nom?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-1">{profil.prenom} {profil.nom}</h2>
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-6">{profil.poste || "Poste non défini"}</p>
              
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-gray-400">Matricule</span>
                   <span className="text-gray-800">#{profil.matricule}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-gray-400">Département</span>
                   <span className="text-gray-800">{profil.departement || "Sompharm"}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                   <span className="text-gray-400">Statut</span>
                   <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Actif</span>
                </div>
              </div>
           </div>

           <div className="bg-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <UserCheck size={120} className="absolute -right-8 -bottom-8 opacity-10" />
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-6">Management Direct</p>
              {profil.managerDirect ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black">
                     {profil.managerDirect.prenom?.charAt(0)}{profil.managerDirect.nom?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg leading-tight">{profil.managerDirect.prenom} {profil.managerDirect.nom}</p>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Directeur de Département</p>
                  </div>
                </div>
              ) : (
                <p className="italic text-indigo-200 text-sm">Hiérarchie non assignée</p>
              )}
           </div>
        </div>

        {/* ═══ Right Column: Detailed Sections ═══ */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Summary Cards Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                    <Calendar size={28} />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-gray-800">{seniority}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ancienneté Somepharm</p>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                    <Clock size={28} />
                 </div>
                 <div>
                    <p className="text-2xl font-black text-gray-800">{profil.soldeConges?.toFixed(1) || "0.0"}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solde de Congés</p>
                 </div>
              </div>
           </div>

           {/* Professional & Personal Data Blocks */}
           <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex items-center gap-4">
                 <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                 <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Informations Détaillées</h3>
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
                 <InfoItem icon={<Mail size={20}/>} label="Email Professionnel" value={profil.email} />
                 <InfoItem icon={<Phone size={20}/>} label="Téléphone" value={profil.telephone || "Non renseigné"} />
                 <InfoItem icon={<Activity size={20}/>} label="Date de Naissance" value={profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Calendar size={20}/>} label="Date d'Embauche" value={profil.dateEmbauche ? new Date(profil.dateEmbauche).toLocaleDateString() : "—"} />
                 <InfoItem icon={<Briefcase size={20}/>} label="Département" value={profil.departement || "Administration"} />
                 <InfoItem icon={<User size={20}/>} label="Rôle Système" value={profil.role?.nomRole || "HR"} />
              </div>

              {/* Emergency Region */}
              <div className="mx-10 mb-10 p-8 bg-rose-50/50 rounded-[2rem] border border-rose-100 flex items-center justify-between group">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                       <Heart size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Contact d'Urgence</p>
                       <p className="text-xl font-black text-rose-900 uppercase tracking-tighter">{profil.contactUrgence || "À renseigner"}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-rose-300 italic">Informations de secours sécurisées</p>
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
       <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all duration-300">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-bold text-gray-700 tracking-tight">{value}</p>
       </div>
    </div>
  );
}