"use client";
import React, { useState, useEffect } from "react";
import { 
  Lock, 
  FileText, 
  BookOpen, 
  Download, 
  Upload, 
  ShieldCheck, 
  Filter,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  ChevronRight,
  Database
} from "lucide-react";

export default function PaieDocumentsPage() {
  const [activeTab, setActiveTab] = useState("paie");
  const [bulletins, setBulletins] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [importing, setImporting] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [newDoc, setNewDoc] = useState({
    titre: "",
    description: "",
    categorie: "REGLEMENT",
    version: "1.0",
    fileUrl: "https://somepharm.com/storage/official_doc.pdf"
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (activeTab === "paie") {
        const res = await fetch("http://localhost:8080/api/payroll/all", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setBulletins(await res.json());
      } else {
        const res = await fetch("http://localhost:8080/api/documents-officiels", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setDocs(await res.json());
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mois", "4"); // Hardcoded for Demo April
    formData.append("annee", "2026");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/payroll/import", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert(await res.text());
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    if (!confirm("Voulez-vous publier les bulletins d'Avril 2026 ? Cette action rendra les documents visibles aux employés.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/payroll/publish?mois=4&annee=2026", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Publication terminée !");
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAddDoc = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      if (selectedDocFile) formData.append("file", selectedDocFile);
      formData.append("titre", newDoc.titre);
      formData.append("description", newDoc.description);
      formData.append("categorie", newDoc.categorie);
      formData.append("version", newDoc.version);

      const res = await fetch("http://localhost:8080/api/documents-officiels/upload", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setShowAddDocModal(false);
        setSelectedDocFile(null);
        setNewDoc({ titre: "", description: "", categorie: "REGLEMENT", version: "1.0", fileUrl: "https://somepharm.com/storage/official_doc.pdf" });
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDownloadDoc = async (id: number, filename: string) => {
    try {
      const token = localStorage.getItem("token");
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

  const handleDeleteDoc = async (id: number) => {
    if (!confirm("Voulez-vous supprimer ce document ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/documents-officiels/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredDocs = docs.filter((doc: any) => {
    const matchesSearch = doc.titre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "ALL" || doc.categorie === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredBulletins = bulletins.filter((b: any) => 
    b.employe.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.employe.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.employe.matricule?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
            Paie & <span className="text-blue-600">Documents</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
            <Lock size={14} className="text-blue-500" />
            Espace sécurisé - Publication & Archivage Officiel
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-amber-50 text-amber-600 px-6 py-4 rounded-[2rem] border border-amber-100 flex items-center gap-3">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                Accès Restreint<br/>ADMIN RH / HR MGR
              </span>
           </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 bg-gray-100/50 p-2 rounded-[2.5rem] border border-gray-200/50 backdrop-blur-sm w-fit">
        <button
          onClick={() => setActiveTab("paie")}
          className={`px-8 py-4 rounded-3xl flex items-center gap-3 transition-all duration-300 font-black text-[10px] uppercase tracking-widest
            ${activeTab === "paie" 
              ? "bg-white text-blue-600 shadow-sm border border-gray-100" 
              : "text-gray-400 hover:text-gray-600"}`}
        >
          <Database size={18}/> Gestion de la Paie
        </button>
        <button
          onClick={() => setActiveTab("biblio")}
          className={`px-8 py-4 rounded-3xl flex items-center gap-3 transition-all duration-300 font-black text-[10px] uppercase tracking-widest
            ${activeTab === "biblio" 
              ? "bg-white text-blue-600 shadow-sm border border-gray-100" 
              : "text-gray-400 hover:text-gray-600"}`}
        >
          <BookOpen size={18}/> Bibliothèque RH
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="grid grid-cols-1 gap-8">
        
        {activeTab === "paie" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-blue-600 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 text-white/10 group-hover:scale-110 transition-transform duration-700">
                   <Lock size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                   <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Campagne de Paie</h2>
                      <p className="text-blue-100 font-medium max-w-md">Importez les données de paie pour l'ensemble des collaborateurs ou générez les bulletins du mois en un clic.</p>
                      <div className="flex gap-4 mt-6">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".csv"
                          onChange={handleCSVImport}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importing}
                          className="bg-white/20 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/20 font-black text-[10px] uppercase tracking-widest hover:bg-white/30 transition-all disabled:opacity-50"
                        >
                          {importing ? "Import en cours..." : "Importer CSV"}
                        </button>
                        <button 
                          onClick={handlePublish}
                          className="bg-white text-blue-600 px-8 py-5 rounded-[2rem] shadow-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Générer Avril 2026
                        </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b flex items-center justify-between">
                   <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Registre des Bulletins</h3>
                   <div className="flex gap-4">
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                         <input 
                            type="text" 
                            placeholder="Filtrer par employé..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none w-64" 
                         />
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                         <tr>
                            <th className="px-10 py-6">Employé</th>
                            <th className="px-10 py-6">Période</th>
                            <th className="px-10 py-6">Net à Payer</th>
                            <th className="px-10 py-6">Statut</th>
                            <th className="px-10 py-6 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {filteredBulletins.map((bp: any) => (
                           <tr key={bp.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-blue-600 text-xs">
                                       {bp.employe.matricule?.substring(0, 2)}
                                    </div>
                                    <div>
                                       <p className="font-black text-gray-800 text-sm uppercase">{bp.employe.prenom} {bp.employe.nom}</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase">{bp.employe.matricule}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-6 font-mono font-black text-gray-800 uppercase text-xs">
                                 {bp.mois}/{bp.annee}
                              </td>
                              <td className="px-10 py-6 font-black text-emerald-600">
                                 {bp.netAPayer.toLocaleString()} DZD
                              </td>
                              <td className="px-10 py-6">
                                 {bp.datePublication ? (
                                    <span className={`px-3 py-1 ${bp.isDownloaded ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit`}>
                                       {bp.isDownloaded ? <CheckCircle2 size={10} /> : <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                       {bp.isDownloaded ? "Reçu" : "Publié"}
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                                       Brouillon
                                    </span>
                                  )}
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <button className="p-3 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Download size={18} />
                                 </button>
                              </td>
                           </tr>
                         ))}
                         {filteredBulletins.length === 0 && !loading && (
                            <tr>
                              <td colSpan={5} className="py-20 text-center text-gray-400 font-black uppercase text-xs">
                                Aucun bulletin trouvé
                              </td>
                            </tr>
                          )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === "biblio" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Documents de Référence</h3>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="text" 
                      placeholder="Rechercher un document..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none w-64 shadow-sm" 
                    />
                  </div>

                  <select 
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none shadow-sm cursor-pointer"
                  >
                    <option value="ALL">Toutes les catégories</option>
                    <option value="REGLEMENT">Règlement Intérieur</option>
                    <option value="ORGANIGRAMME">Organigramme</option>
                    <option value="CONVENTION">Convention Collective</option>
                    <option value="NOTE">Note de Service</option>
                  </select>

                  <button 
                    onClick={() => setShowAddDocModal(true)}
                    className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-lg"
                  >
                     <Plus size={16} /> Ajouter
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDocs.map((doc: any) => (
                  <div key={doc.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                     <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center text-gray-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <FileText size={28} />
                     </div>
                     <div className="mb-8">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                           {doc.categorie}
                        </span>
                        <h4 className="text-xl font-black text-gray-900 uppercase italic leading-tight">{doc.titre}</h4>
                        <p className="text-gray-400 text-xs font-medium mt-2">{doc.description}</p>
                     </div>
                     <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <Clock size={12} /> v{doc.version || "1.0"}
                        </span>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleDownloadDoc(doc.id, doc.titre + ".pdf")}
                            className="p-3 text-gray-300 hover:text-blue-600 transition-colors"
                           >
                            <Download size={16} />
                           </button>
                           <button 
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                           >
                            <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
                
                {docs.length === 0 && !loading && (
                   <div className="lg:col-span-3 py-32 text-center bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-200">
                      <BookOpen size={48} className="mx-auto text-gray-300 mb-6" />
                      <p className="text-gray-400 font-black uppercase text-xs tracking-widest">La bibliothèque est vide.</p>
                      <p className="text-gray-300 text-[10px] font-bold uppercase mt-2">Cliquez sur "Ajouter" pour numériser vos documents</p>
                   </div>
                )}
             </div>
          </div>
        )}

      </div>

      {/* ADD DOCUMENT MODAL */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
              <div className="bg-gray-900 p-10 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nouveau Document</h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Numérisation de la bibliothèque RH</p>
                 </div>
                 <button onClick={() => setShowAddDocModal(false)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titre du document</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Règlement Intérieur 2026"
                      value={newDoc.titre}
                      onChange={(e) => setNewDoc({...newDoc, titre: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catégorie</label>
                        <select 
                          value={newDoc.categorie}
                          onChange={(e) => setNewDoc({...newDoc, categorie: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                        >
                            <option value="REGLEMENT">Règlement Intérieur</option>
                            <option value="ORGANIGRAMME">Organigramme</option>
                            <option value="CONVENTION">Convention Collective</option>
                            <option value="NOTE">Note de Service</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Version</label>
                        <input 
                          type="text" 
                          placeholder="v1.0"
                          value={newDoc.version}
                          onChange={(e) => setNewDoc({...newDoc, version: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm"
                        />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fichier (PDF)</label>
                    <div className="relative group">
                       <input 
                         type="file" 
                         className="hidden" 
                         id="doc-upload" 
                         accept=".pdf"
                         onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
                       />
                       <label 
                         htmlFor="doc-upload"
                         className="flex items-center justify-between w-full px-6 py-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer group-hover:border-blue-400 transition-all"
                       >
                          <span className="text-xs font-bold text-blue-600">
                             {selectedDocFile ? selectedDocFile.name : "Sélectionner le document..."}
                          </span>
                          <Upload size={18} className="text-blue-500" />
                       </label>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (Optionnel)</label>
                    <textarea 
                      placeholder="Brève description du contenu..."
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold text-sm h-24 resize-none"
                    />
                 </div>
                 <button 
                  onClick={handleAddDoc}
                  disabled={!newDoc.titre || !selectedDocFile}
                  className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale"
                 >
                    {selectedDocFile ? "Publier dans la bibliothèque" : "Sélectionner un fichier PDF"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const Clock = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const CheckCircle2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
