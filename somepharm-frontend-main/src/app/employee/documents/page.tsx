"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../../components/ui/Modal";
import { useUI } from "../../../context/UIContext";
import { 
  ScrollText, 
  Scale, 
  BookOpen, 
  Megaphone, 
  ArrowRight,
  Download,
  Calendar,
  Network,
  Loader2,
  FileText
} from "lucide-react";

export default function DocumentsPage() {
  const { addToast } = useUI();
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
        addToast("success", "Fiche de paie générée");
      } else {
        addToast("error", "Document non disponible pour cette période");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erreur serveur");
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
        addToast("success", "Téléchargement lancé");
      }
    } catch (err) { console.error(err); }
  };

  const getDocByCategory = (cat: string) => publicDocs.find(d => d.categorie === cat);

  const documents = [
    {
      id: "payslip",
      title: "Bulletins de Salaire",
      description: "Générez instantanément votre fiche de paie pour le mois de votre choix.",
      icon: ScrollText,
      color: "bg-amber-500", lightColor: "bg-amber-50", textColor: "text-amber-700",
      link: "#", disableDownload: false, isRoute: false, action: () => setIsModalOpen(true)
    },
    {
      id: "reglement",
      title: "Règlement Intérieur",
      description: getDocByCategory("REGLEMENT")?.description || "Charte de l'entreprise et politique interne globale de Somepharm.",
      icon: Scale,
      color: "bg-slate-500", lightColor: "bg-slate-100", textColor: "text-slate-700",
      link: getDocByCategory("REGLEMENT")?.fileUrl || "#", 
      disableDownload: !getDocByCategory("REGLEMENT"), 
      isRoute: false,
      action: () => handleDownloadDoc(getDocByCategory("REGLEMENT")?.id, "Reglement_Interieur.pdf")
    },
    {
      id: "conventions",
      title: "Conventions Collectives",
      description: getDocByCategory("CONVENTION")?.description || "Accords d'entreprise encadrant les conditions de travail et garanties sociales.",
      icon: BookOpen,
      color: "bg-emerald-600", lightColor: "bg-emerald-50", textColor: "text-emerald-700",
      link: getDocByCategory("CONVENTION")?.fileUrl || "#", 
      disableDownload: !getDocByCategory("CONVENTION"), 
      isRoute: false,
      action: () => handleDownloadDoc(getDocByCategory("CONVENTION")?.id, "Conventions_Collectives.pdf")
    },
    {
       id: "notes",
       title: "Notes de Service",
       description: getDocByCategory("NOTE")?.description || "Avis et directives officielles émanant de la Direction Générale.",
       icon: Megaphone,
       color: "bg-blue-600", lightColor: "bg-blue-50", textColor: "text-blue-700",
       link: getDocByCategory("NOTE")?.fileUrl || "#", 
       disableDownload: !getDocByCategory("NOTE"), 
       isRoute: false,
       action: () => handleDownloadDoc(getDocByCategory("NOTE")?.id, "Note_de_Service.pdf")
    },
    {
       id: "organigramme",
       title: "Organigramme",
       description: getDocByCategory("ORGANIGRAMME")?.description || "Structure hiérarchique et organisation des départements de Somepharm.",
       icon: Network,
       color: "bg-purple-600", lightColor: "bg-purple-50", textColor: "text-purple-700",
       link: "#", 
       disableDownload: !getDocByCategory("ORGANIGRAMME"), 
       isRoute: false,
       action: () => handleDownloadDoc(getDocByCategory("ORGANIGRAMME")?.id, "Organigramme_Somepharm.pdf")
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="relative flex flex-col gap-1 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/30 border border-teal-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 lg:p-8 overflow-hidden mb-2">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 border-l-4 border-teal-500 pl-5">
          <h1 className="text-3xl lg:text-4xl font-heading font-black italic text-slate-800 tracking-tight drop-shadow-sm">Centre Documentaire</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">Ressources et documents officiels de l'entreprise</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className={`bg-white rounded-2xl border p-6 flex flex-col transition-all duration-300 ${doc.disableDownload ? 'opacity-60 border-dashed bg-slate-50/50' : 'shadow-sm border-slate-100 hover:shadow-md hover:-translate-y-1 hover:border-slate-200'}`}>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`${doc.color} p-3 rounded-xl text-white shadow-sm`}>
                <doc.icon size={22} />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-900 leading-tight">{doc.title}</h2>
            </div>

            <p className="text-sm text-slate-500 font-medium mb-6 flex-1">
              {doc.description}
            </p>

            <button
              onClick={doc.action}
              disabled={doc.disableDownload}
              className={`w-full py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${doc.disableDownload ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : `${doc.lightColor} ${doc.textColor} hover:${doc.color} hover:text-white shadow-sm active:scale-95`}`}
            >
              {doc.disableDownload ? "Indisponible" : (
                <>
                  {doc.id === 'payslip' ? <FileText size={14} /> : <Download size={14} />}
                  {doc.id === 'payslip' ? 'Générer' : 'Télécharger'}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      {/* Payslip Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Période du Bulletin">
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
            <div className="p-2 bg-amber-500 rounded-lg text-white">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-amber-900 font-bold text-sm">Sélection de la période</p>
              <p className="text-amber-700 text-xs font-medium">Choisissez le mois et l'année du bulletin</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mois</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-semibold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                 {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                   <option key={i} value={i + 1}>{m}</option>
                 ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Année</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-xl p-3 font-semibold text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                 {[2024, 2025, 2026].map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleDownloadFichePaie}
            disabled={loading}
            className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{loading ? "Génération..." : "Télécharger PDF"}</span>
          </button>
        </div>
      </Modal>

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
            <h3 className="text-teal-900 font-bold text-lg mb-1">Besoin d'un autre document ?</h3>
            <p className="text-teal-700 text-sm font-medium">Attestations de travail, relevés d'émoluments et titres de congé se font via le module de requêtes.</p>
         </div>
         <Link href="/employee/demandes?new=true" className="whitespace-nowrap bg-teal-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition active:scale-95">
            Nouvelle Demande
         </Link>
      </div>
    </div>
  );
}