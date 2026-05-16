"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building, Mail, Fingerprint, ShieldAlert, Phone } from "lucide-react";

export default function EmployesPage() {
  const router = useRouter();
  const [employes, setEmployes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetchDirectory(token);
  }, [router]);

  const fetchDirectory = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/utilisateurs/directory", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setError("Accès Refusé : Vous n'avez pas les droits d'administration pour voir cette page.");
        setLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setEmployes(data);
      }
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 The Magic Search Function
  const filteredEmployes = employes.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    const matriculeMatch = emp.matricule?.toLowerCase().includes(searchLower);
    const emailMatch = emp.email?.toLowerCase().includes(searchLower);
    const depMatch = emp.departement?.toLowerCase().includes(searchLower);
    return matriculeMatch || emailMatch || depMatch;
  });

  if (loading) return <div className="p-10 font-black animate-pulse text-blue-600">CHARGEMENT DE L'ANNUAIRE...</div>;

  // Render Access Denied for standard employees
  if (error) return (
    <div className="p-10 h-screen flex flex-col items-center justify-center bg-gray-50">
      <ShieldAlert size={64} className="text-red-500 mb-6" />
      <h1 className="text-3xl font-black text-gray-800 uppercase tracking-widest text-center">{error}</h1>
      <button onClick={() => router.push("/dashboard")} className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Retour au Dashboard</button>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Annuaire du Personnel</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestion des effectifs Somepharm</p>
        </div>

        {/* 🔍 Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher (Matricule, Email, Dépt)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 pl-12 pr-4 py-4 rounded-2xl font-bold text-gray-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployes.map((emp) => (
          // 👇 Added 'cursor-pointer' and 'onClick' to navigate to the profile!
          <div 
            key={emp.idUser} 
            onClick={() => router.push(`/employes/${emp.idUser}`)}
            className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-4 cursor-pointer"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-100 shrink-0">
              <span className="text-xl font-black text-blue-600">
                {emp.prenom && emp.nom ? `${emp.prenom.charAt(0)}${emp.nom.charAt(0)}`.toUpperCase() : emp.matricule?.substring(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-black text-gray-900 truncate uppercase">
                  {emp.prenom && emp.nom ? `${emp.nom} ${emp.prenom}` : emp.matricule}
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                  emp.role?.nomRole === 'RH_ADMIN' ? 'bg-purple-100 text-purple-600' :
                  emp.role?.nomRole === 'MANAGER' ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {emp.role?.nomRole || 'EMPLOYE'}
                </span>
              </div>
              
              <div className="mt-3 space-y-2">
                <p className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Mail size={14} className="text-gray-400" /> <span className="truncate">{emp.email}</span>
                </p>
                <p className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Building size={14} className="text-blue-400" /> {emp.departement}
                </p>
                {/* 👇 Added Telephone Display */}
                {emp.telephone && (
                  <p className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Phone size={14} className="text-emerald-400" /> {emp.telephone}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredEmployes.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest">Aucun employé trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}