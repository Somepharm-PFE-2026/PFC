"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { 
  User, Mail, Building, Shield, Phone, Briefcase, 
  Calendar, Clock, Heart, UserCheck, ArrowLeft, Lock
} from "lucide-react";

export default function EmployeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profil, setProfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("work");
  const [viewerRole, setViewerRole] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    
    try {
      const decoded: any = jwtDecode(token);
      let role = decoded.role;
      if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
      setViewerRole(role || "EMPLOYE");
    } catch { /* ignore */ }
    
    fetchEmployeDetails(token);
  }, [id]);

  const fetchEmployeDetails = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/utilisateurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProfil(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 font-black animate-pulse text-blue-600">CHARGEMENT DU DOSSIER...</div>;
  if (!profil) return <div className="p-10 text-red-500 font-bold">Dossier introuvable.</div>;

  const initials = profil.prenom && profil.nom 
    ? `${profil.prenom.charAt(0)}${profil.nom.charAt(0)}`.toUpperCase()
    : profil.matricule?.substring(0, 2).toUpperCase();

  const statusColor = profil.statutCompte === "ACTIF" ? "bg-emerald-500" : "bg-red-500";

  // Role-based visibility
  const isHR = viewerRole === "RH_ADMIN" || viewerRole === "SUPER_ADMIN" || viewerRole === "HR_MANAGER";
  const isManager = viewerRole === "MANAGER";
  const canSeeSensitive = isHR; // Only HR sees date of birth, emergency contact, etc.

  // Calculate seniority
  const seniority = profil.dateEmbauche 
    ? (() => {
        const hire = new Date(profil.dateEmbauche);
        const now = new Date();
        const years = now.getFullYear() - hire.getFullYear();
        const months = now.getMonth() - hire.getMonth();
        if (years > 0) return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
        return `${months > 0 ? months : 1} mois`;
      })()
    : null;

  const tabs = [
    { id: "work", label: "Travail", icon: Briefcase },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm transition-colors">
        <ArrowLeft size={16} /> Retour à l'annuaire
      </button>

      {/* Page Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Dossier Employé</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Vue {isHR ? "RH Complète" : isManager ? "Manager (Équipe)" : "Limitée"}
          </p>
        </div>
        {/* Viewer role badge */}
        <div className="flex items-center gap-2 bg-white border px-4 py-2 rounded-2xl shadow-sm">
          <Shield size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Votre accès: {viewerRole}</span>
        </div>
      </div>

      <div className="max-w-5xl">
        
        {/* ═══════════ DIGITAL ID CARD HEADER ═══════════ */}
        <div className="bg-gray-900 rounded-t-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 opacity-[0.03] text-white"><User size={350} /></div>

          {/* Avatar */}
          <div className="relative">
            {profil.photoUrl ? (
              <img src={profil.photoUrl} alt="Photo" className="w-32 h-32 rounded-[2rem] object-cover border-4 border-gray-700 shadow-2xl" />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl border-4 border-gray-700">
                {initials}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${statusColor} rounded-full border-4 border-gray-900`}></div>
          </div>

          {/* Identity */}
          <div className="text-center md:text-left z-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-wide">
              {profil.prenom && profil.nom ? `${profil.prenom} ${profil.nom}` : profil.matricule}
            </h2>
            <p className="text-gray-400 font-bold text-sm mt-1">{profil.poste || "Poste non défini"}</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                {profil.role?.nomRole || "EMPLOYE"}
              </span>
              <span className="px-4 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-600">
                {profil.matricule}
              </span>
              <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                profil.statutCompte === "ACTIF" 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}>
                {profil.statutCompte || "ACTIF"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════ QUICK STATS BAR ═══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 bg-white border-x border-gray-100">
          <div className="p-6 border-r border-b border-gray-100 text-center">
            <p className="text-3xl font-black text-gray-900">{profil.soldeConges?.toFixed(1) || "0.0"}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Jours de Congé</p>
          </div>
          <div className="p-6 border-r border-b border-gray-100 text-center">
            <p className="text-3xl font-black text-gray-900">{profil.departement || "—"}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Département</p>
          </div>
          <div className="p-6 border-b border-gray-100 text-center col-span-2 md:col-span-1">
            <p className="text-3xl font-black text-gray-900">{seniority || "—"}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ancienneté</p>
          </div>
        </div>

        {/* ═══════════ TAB NAVIGATION ═══════════ */}
        <div className="bg-white border-x border-gray-100 px-8 pt-2">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-black text-xs uppercase tracking-widest rounded-t-2xl transition-all ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-blue-600 border-t-2 border-x border-blue-600 border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════ TAB CONTENT ═══════════ */}
        <div className="bg-white rounded-b-[2.5rem] border border-gray-100 p-10 shadow-xl">
          
          {/* WORK TAB — Visible to all who can access this page */}
          {activeTab === "work" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoField icon={<Briefcase size={20} />} iconBg="bg-blue-50 text-blue-600" label="Poste / Fonction" value={profil.poste || "Non défini"} />
              <InfoField icon={<Building size={20} />} iconBg="bg-purple-50 text-purple-600" label="Département" value={profil.departement || "Non assigné"} />
              <InfoField icon={<Calendar size={20} />} iconBg="bg-green-50 text-green-600" label="Date d'Embauche" value={profil.dateEmbauche ? new Date(profil.dateEmbauche).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non renseignée"} />
              <InfoField icon={<Clock size={20} />} iconBg="bg-amber-50 text-amber-600" label="Ancienneté" value={seniority || "Non calculable"} />
              
              {/* Direct Manager */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shadow-sm"><UserCheck size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manager Direct</p>
                    {profil.managerDirect ? (
                      <div className="mt-2 flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 cursor-pointer hover:border-blue-200 transition-colors"
                           onClick={() => router.push(`/employes/${profil.managerDirect.idUser}`)}>
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-sm font-black text-indigo-600">
                          {profil.managerDirect.prenom && profil.managerDirect.nom 
                            ? `${profil.managerDirect.prenom.charAt(0)}${profil.managerDirect.nom.charAt(0)}`
                            : "??"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {profil.managerDirect.prenom} {profil.managerDirect.nom}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400">{profil.managerDirect.matricule}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-400 mt-1">Non assigné</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT TAB — Sensitive fields restricted by role */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoField icon={<Mail size={20} />} iconBg="bg-blue-50 text-blue-600" label="Email Professionnel" value={profil.email} />
              <InfoField icon={<Phone size={20} />} iconBg="bg-green-50 text-green-600" label="Téléphone" value={profil.telephone || "Non renseigné"} />

              {/* Sensitive: Date of Birth — HR only */}
              {canSeeSensitive ? (
                <InfoField icon={<Calendar size={20} />} iconBg="bg-amber-50 text-amber-600" label="Date de Naissance" value={profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non renseignée"} />
              ) : (
                <LockedField label="Date de Naissance" />
              )}

              {/* Sensitive: Emergency Contact — HR only */}
              {canSeeSensitive ? (
                <InfoField icon={<Heart size={20} />} iconBg="bg-red-50 text-red-600" label="Contact d'Urgence" value={profil.contactUrgence || "Non renseigné"} />
              ) : (
                <LockedField label="Contact d'Urgence" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════ REUSABLE COMPONENTS ═══════════
function InfoField({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`${iconBg} p-3 rounded-xl shadow-sm`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function LockedField({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-4 opacity-50">
      <div className="bg-gray-100 text-gray-400 p-3 rounded-xl"><Lock size={20} /></div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-400 mt-1 italic">Accès restreint (RH uniquement)</p>
      </div>
    </div>
  );
}