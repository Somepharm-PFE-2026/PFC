"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ScrollText, 
  Scale, 
  BookOpen, 
  Megaphone, 
  ArrowRight,
  Download,
  X,
  Calendar,
  Network
} from "lucide-react";

export default function DocumentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const [publicDocs, setPublicDocs] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchPublicDocs(savedToken);
    }
  }, []);

  const fetchPublicDocs = async (t: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/documents-officiels/public", {
        headers: { "Authorization": `Bearer ${t}` }
      });
      if (res.ok) setPublicDocs(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleDownloadFichePaie = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/documents/fiche-paie?mois=${selectedMonth}&annee=${selectedYear}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fiche_Paie_${selectedMonth}_${selectedYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setIsModalOpen(false);
      } else {
        alert("Erreur lors de la génération du document.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = async (id: number, filename: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/documents-officiels/download/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) { console.error(err); }
  };

  const getDocByCategory = (cat: string) => publicDocs.find(d => d.categorie === cat);

  const documents = [
    {
      id: "payslip",
      title: "Fiches de Paie",
      description: "Générez instantanément votre bulletin de salaire pour le mois de votre choix en un clic.",
      icon: ScrollText,
      color: "bg-amber-500", lightColor: "bg-amber-50", textColor: "text-amber-600",
      link: "#", disableDownload: false, isRoute: false, action: () => setIsModalOpen(true)
    },
    {
      id: "reglement",
      title: "Règlement Intérieur",
      description: getDocByCategory("REGLEMENT")?.description || "Charte de l'entreprise, règles de sécurité, et politique interne globale de Somepharm.",
      icon: Scale,
      color: "bg-gray-400", lightColor: "bg-gray-50", textColor: "text-gray-500",
      link: getDocByCategory("REGLEMENT")?.fileUrl || "#", 
      disableDownload: !getDocByCategory("REGLEMENT"), 
      isRoute: false,
      action: () => handleDownloadDoc(getDocByCategory("REGLEMENT")?.id, "Reglement_Interieur.pdf")
    },
    {
      id: "conventions",
      title: "Conventions Collectives",
      description: getDocByCategory("CONVENTION")?.description || "Accords d'entreprise encadrant les conditions de travail, salaires minimums, et garanties sociales.",
      icon: BookOpen,
      color: "bg-emerald-600", lightColor: "bg-emerald-50", textColor: "text-emerald-600",
      link: getDocByCategory("CONVENTION")?.fileUrl || "#", 
      disableDownload: !getDocByCategory("CONVENTION"), 
      isRoute: false,
      action: () => handleDownloadDoc(getDocByCategory("CONVENTION")?.id, "Conventions_Collectives.pdf")
    },
    {
       id: "notes",
       title: "Notes de Service",
       description: getDocByCategory("NOTE")?.description || "Avis, annonces et directives officielles émanant de la Direction Générale et des Ressources Humaines.",
       icon: Megaphone,
       color: "bg-blue-600", lightColor: "bg-blue-50", textColor: "text-blue-600",
       link: getDocByCategory("NOTE")?.fileUrl || "#", 
       disableDownload: !getDocByCategory("NOTE"), 
       isRoute: false,
       action: () => handleDownloadDoc(getDocByCategory("NOTE")?.id, "Note_de_Service.pdf")
    },
    {
       id: "organigramme",
       title: "Organigramme",
       description: getDocByCategory("ORGANIGRAMME")?.description || "Structure hiérarchique et organisation des départements au sein de Somepharm.",
       icon: Network,
       color: "bg-purple-600", lightColor: "bg-purple-50", textColor: "text-purple-600",
       link: "#", 
       disableDownload: !getDocByCategory("ORGANIGRAMME"), 
       isRoute: false,
       action: () => handleDownloadDoc(getDocByCategory("ORGANIGRAMME")?.id, "Organigramme_Somepharm.pdf")
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter">Centre Documentaire</h1>
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">Bibliothèque des ressources et politiques de l'entreprise</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
        {documents.map((doc) => (
          <div key={doc.id} className={`bg-white rounded-[2rem] border p-8 flex flex-col h-full transition-all duration-300 ${doc.disableDownload ? 'opacity-50 grayscale border-dashed' : 'hover:shadow-2xl hover:-translate-y-2 hover:border-gray-300'}`}>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`${doc.color} p-4 rounded-2xl text-white shadow-md`}>
                <doc.icon size={28} />
              </div>
              <h2 className="text-xl font-black text-gray-800 uppercase leading-tight">{doc.title}</h2>
            </div>

            <p className="text-sm text-gray-500 font-medium mb-8 flex-1">
              {doc.description}
            </p>

            {doc.isRoute ? (
                <Link href={doc.link}
                  className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${doc.lightColor} ${doc.textColor} hover:${doc.color} hover:text-white`}
                >
                  Ouvrir <ArrowRight size={16} />
                </Link>
            ) : (
                <button
                  onClick={doc.action}
                  disabled={doc.disableDownload}
                  className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all ${doc.disableDownload ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `${doc.lightColor} ${doc.textColor} hover:${doc.color} hover:text-white`}`}
                >
                  {doc.disableDownload ? "Bientôt Disponible" : doc.id === 'payslip' ? 'Générer' : 'Télécharger'}
                </button>
            )}
          </div>
        ))}
      </div>
      
      {/* 🗓️ Payslip Period Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-amber-500 p-8 text-white relative">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 hover:rotate-90 transition-transform">
                      <X size={24} />
                  </button>
                  <Calendar size={48} className="mb-4 opacity-40" />
                  <h3 className="text-2xl font-black italic uppercase tracking-widest">Période du Bulletin</h3>
                  <p className="text-amber-100 text-xs font-bold mt-1">Sélectionnez le mois et l'année souhaités</p>
              </div>

              <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mois</label>
                          <select 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-amber-500 transition-all"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          >
                             {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                               <option key={i} value={i + 1}>{m}</option>
                             ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Année</label>
                          <select 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-amber-500 transition-all"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                          >
                             <option value="2024">2024</option>
                             <option value="2025">2025</option>
                             <option value="2026">2026</option>
                          </select>
                      </div>
                  </div>

                  <button 
                    onClick={handleDownloadFichePaie}
                    disabled={loading}
                    className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? "Génération..." : <><Download size={18} /> Télécharger PDF</>}
                  </button>
              </div>
           </div>
        </div>
      )}

      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-[2rem] p-8 text-center">
         <h3 className="text-blue-900 font-black uppercase tracking-widest text-sm mb-2">Besoin d'une attestation personnelle ?</h3>
         <p className="text-blue-700 text-xs font-bold mb-6">Toutes les attestations de travail, relevés d'émoluments et titres de congé se font désormais sur requête.</p>
         <Link href="/demandes?new=true" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
            Accéder à Mes Demandes
         </Link>
      </div>
    </div>
  );
}