"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Table as TableIcon, 
  FileDown, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  History,
  FileText,
  ChevronRight,
  Info,
  Edit2,
  CheckCircle2,
  LayoutList,
  ChevronLeft
} from "lucide-react";

export default function GestionCongesPage() {
  const [activeTab, setActiveTab] = useState("planning");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [planningData, setPlanningData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdjusting, setIsAdjusting] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ amount: 0, reason: "" });
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);

  const tabs = [
    { id: "planning", name: "Vision Globale", icon: Calendar },
    { id: "balances", name: "Suivi des Soldes", icon: TableIcon },
    { id: "reporting", name: "Indicateurs & Reporting", icon: TrendingUp },
    { id: "rules", name: "Guide des Règles", icon: Info },
    { id: "exports", name: "Exports Paie", icon: FileDown },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // Parallel fetch for speed
      const [resStats, resBalances, resPlanning, resTypes] = await Promise.all([
        fetch("http://localhost:8080/api/hr/conges/stats", { headers }),
        fetch("http://localhost:8080/api/hr/conges/balances", { headers }),
        fetch("http://localhost:8080/api/hr/conges/planning", { headers }),
        fetch("http://localhost:8080/api/demandes/types", { headers })
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resBalances.ok) setBalances(await resBalances.json());
      if (resPlanning.ok) setPlanningData(await resPlanning.json());
      if (resTypes.ok) setLeaveTypes(await resTypes.json());

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!adjustForm.reason) return alert("Justification obligatoire !");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/hr/conges/adjust", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: isAdjusting.id,
          amount: adjustForm.amount,
          reason: adjustForm.reason
        })
      });

      if (res.ok) {
        setIsAdjusting(null);
        setAdjustForm({ amount: 0, reason: "" });
        fetchData();
      }
    } catch (err) {
      alert("Erreur lors de l'ajustement.");
    }
  };

  const exportCSV = () => {
    // Generate simple CSV for demo
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Matricule,Employe,Departement,Date Debut,Date Fin,Type,Statut\n";
    
    planningData.forEach(row => {
      csvContent += `${row.matricule},${row.employee},${row.departement},${row.start},${row.end},${row.type},${row.status}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_conges_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Synchronisation du moteur de paie...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <ShieldAlert size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Module RH Avancé</span>
          </div>
          <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter leading-none">
            Gestion des <span className="text-blue-600">Congés</span>
          </h1>
          <p className="text-gray-400 font-bold mt-2 text-sm italic">Pilotage de la dette sociale et conformité paie.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Taux d'Absentéisme</p>
              <p className="text-xl font-black text-gray-800">{stats?.absenteeismRate || 0}%</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Effectif Absent</p>
              <p className="text-xl font-black text-gray-800">{stats?.activeAbsencesCount || 0} <span className="text-[10px] text-gray-400">Collaborateurs</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white/50 p-1 rounded-3xl border w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:bg-white hover:text-blue-600"}`}
          >
            <tab.icon size={14} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border overflow-hidden">
        
        {/* TAB CONTENT: PLANNING */}
        {activeTab === "planning" && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic">Planning d'Entreprise</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                  {viewMode === 'calendar' 
                    ? currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
                    : "Vue Liste détaillée"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl border">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    <LayoutList size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode("calendar")}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                  >
                    <Calendar size={18} />
                  </button>
                </div>

                {viewMode === 'calendar' && (
                  <div className="flex items-center gap-2 bg-white border rounded-xl p-1 shadow-sm">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-3 py-1.5 hover:bg-gray-50 rounded-lg text-[9px] font-black text-gray-600 uppercase"
                    >
                      Aujourd'hui
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div className="hidden lg:flex gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div> Validé</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-200 rounded-full border border-dashed border-blue-400"></div> En Attente</div>
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-gray-50 border-b">
                      <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Employé</th>
                      <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Période</th>
                      <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Type</th>
                      <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Aperçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {planningData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                              {row.employee.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-sm">{row.employee}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{row.departement}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                            {new Date(row.start).toLocaleDateString()} → {new Date(row.end).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 shadow-sm" style={{ backgroundColor: `${row.color}15`, color: row.color, border: `1px solid ${row.color}30` }}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-4 w-64">
                           <div className="flex items-center gap-3">
                              <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                   className={`absolute h-full rounded-full transition-all duration-1000 ${!row.isApproved ? "opacity-30 border-2 border-dashed border-white/50" : ""}`}
                                   style={{ 
                                      width: `${Math.min(100, (new Date(row.end).getTime() - new Date(row.start).getTime()) / (1000 * 60 * 60 * 24 * 30) * 100)}%`, 
                                      backgroundColor: row.color 
                                   }}
                                 ></div>
                              </div>
                              {!row.isApproved && (
                                <a 
                                  href="/hr/validation-rh"
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                                  title="Traiter cette demande"
                                >
                                  <ChevronRight size={14} />
                                </a>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                    {planningData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center">
                          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 opacity-50">
                            <AlertTriangle size={32} />
                          </div>
                          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Aucune absence enregistrée pour cette période</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                {/* CALENDAR VIEW GRID */}
                <div className="grid grid-cols-7 gap-px bg-gray-100 border rounded-2xl overflow-hidden shadow-inner">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="bg-gray-50 p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() === 0 ? 6 : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() - 1 }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white/50 min-h-[120px]"></div>
                  ))}

                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
                    const dayAbsences = planningData.filter(abs => {
                      const start = new Date(abs.start).toISOString().split('T')[0];
                      const end = new Date(abs.end).toISOString().split('T')[0];
                      return dateStr >= start && dateStr <= end;
                    });

                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                      <div key={day} className={`bg-white min-h-[120px] p-2 border-t border-l flex flex-col gap-1 hover:bg-blue-50/30 transition-colors ${isToday ? 'bg-blue-50/50' : ''}`}>
                        <span className={`text-[10px] font-black mb-1 w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>
                          {day}
                        </span>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                          {dayAbsences.map((abs, idx) => (
                            <div 
                              key={idx}
                              title={`${abs.employee} - ${abs.type}`}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black truncate border-l-2 transition-all hover:scale-105 cursor-help
                                ${abs.isApproved ? 'shadow-sm' : 'opacity-50 border-dashed'}`}
                              style={{ 
                                backgroundColor: `${abs.color}15`, 
                                color: abs.color, 
                                borderLeftColor: abs.color 
                              }}
                            >
                              {abs.employee.split(' ')[0]}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: BALANCES */}
        {activeTab === "balances" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic text-amber-600">Suivi des Compteurs</h3>
              <div className="p-3 bg-amber-50 rounded-2xl flex items-center gap-3 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                <History size={16} /> Historique des corrections activé
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Matricule</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Collaborateur</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Département</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Solde Restant</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {balances.map(u => (
                    <tr key={u.id} className="hover:bg-amber-50/20 transition group">
                      <td className="p-4 font-black text-gray-400 text-xs">{u.matricule}</td>
                      <td className="p-4 font-black text-gray-800 text-sm">{u.nomComplet}</td>
                      <td className="p-4">
                        <span className="p-1 px-3 bg-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-500 tracking-wider font-mono">
                          {u.departement}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`text-lg font-black ${u.soldeRestant > 10 ? 'text-green-600' : 'text-red-600'}`}>
                          {u.soldeRestant} <span className="text-[8px] uppercase tracking-widest ml-1 opacity-50">Jours</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setIsAdjusting(u)}
                          className="p-2 bg-white border shadow-sm rounded-xl text-gray-400 hover:text-amber-600 hover:border-amber-200 transition group-hover:scale-110"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: REPORTING */}
        {activeTab === "reporting" && (
          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-purple-100 p-3 rounded-2xl text-purple-600"><AlertTriangle size={20} /></div>
                    <h4 className="font-black text-gray-800 uppercase italic tracking-tighter">Gestion du Risque (Dette Sociale)</h4>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                    Collaborateurs ayant les plus gros soldes restants. Un solde élevé représente une provision financière non déduite.
                </p>
                <div className="space-y-4">
                    {stats?.topSocialDebt.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-l-4 border-purple-500">
                             <div>
                                <p className="font-black text-gray-800 text-sm">{item.matricule}</p>
                                <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Alerte Accumulation</p>
                             </div>
                             <div className="text-right">
                                <p className="text-2xl font-black text-gray-800">{item.solde}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jours dus</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between">
                <div>
                    <h4 className="font-black text-white uppercase italic tracking-tighter text-xl mb-4">Indicateurs de Performance</h4>
                    <p className="text-blue-200 font-bold text-xs leading-relaxed max-w-xs uppercase tracking-widest mb-10">
                        Surveillance en temps réel du taux d'engagement et des absences validées ce mois-ci.
                    </p>
                    
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-6xl font-black italic">{100 - (stats?.absenteeismRate || 0)}%</span>
                        <span className="text-xs font-black text-blue-200 uppercase tracking-[0.2em] mb-3">Taux de Présence</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-wider mb-2">Export Paie Prêt</p>
                        <p className="font-black text-xl italic">{planningData.filter(d => d.isApproved).length} <span className="text-[8px] font-bold opacity-40">Dossiers</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-wider mb-2">Risque Absence</p>
                        <p className="font-black text-xl italic">{planningData.filter(d => !d.isApproved).length} <span className="text-[8px] font-bold opacity-40">En attente</span></p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: RULES */}
        {activeTab === "rules" && (
           <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                  <div className="bg-green-100 p-3 rounded-2xl text-green-600"><CheckCircle2 size={24} /></div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic">Guide des Quotas Somepharm</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaveTypes.map((rule, idx) => (
                  <div key={idx} className="bg-white border rounded-[2rem] p-6 hover:shadow-xl transition-all border-l-8" style={{ borderLeftColor: rule.couleurHex }}>
                     <div className="flex justify-between items-start mb-4">
                        <span className="font-black text-gray-800 uppercase text-xs">{rule.nom}</span>
                        <div className="px-3 py-1 bg-gray-50 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest border">
                            {rule.justificatifObligatoire ? "Justificatif Requis" : "Sans Justificatif"}
                        </div>
                     </div>
                     <p className="text-sm font-black text-gray-900 mb-2">
                        {rule.quotaInitial > 0 ? `${rule.quotaInitial} jours/an` : (rule.nom === 'Maladie' ? 'Illimité' : 'Selon solde')}
                     </p>
                     <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic">{rule.description}</p>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* TAB CONTENT: EXPORTS */}
        {activeTab === "exports" && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 mb-10 group">
                <FileDown size={40} className="group-hover:translate-y-1 transition-transform" />
            </div>
            <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">Prêt pour l'Extraction</h3>
            <p className="text-gray-400 font-bold max-w-md mb-10 text-sm">
                Générez un fichier CSV universel contenant toutes les absences validées. Ce fichier peut être importé directement dans votre logiciel de paie SAGE ou Excel.
            </p>
            <div className="flex gap-4">
                <div className="relative group">
                  <button 
                    onClick={exportCSV}
                    className="bg-gray-800 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-gray-900 transition-all flex items-center gap-3"
                  >
                    Générer Export Global (CSV) <ChevronRight size={16} />
                  </button>
                  <p className="absolute -bottom-8 left-0 right-0 text-[8px] font-black text-gray-300 uppercase tracking-widest">Période : {new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</p>
                </div>
            </div>
          </div>
        )}

      </div>

      {/* BALANCE ADJUSTMENT MODAL */}
      {isAdjusting && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-1 block">Régularisation Manuelle</span>
                <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Ajuster le solde</h3>
                <p className="text-gray-400 font-bold mt-2 text-xs uppercase">{isAdjusting.nomComplet} ({isAdjusting.matricule})</p>
              </div>
              <button onClick={() => setIsAdjusting(null)} className="p-2 border rounded-xl hover:bg-gray-50 transition">
                <History size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Valeur de l'ajustement (jours)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({...adjustForm, amount: Number(e.target.value)})}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-2xl text-gray-800 outline-none focus:border-amber-400 transition"
                    placeholder="Ex: 1, -2..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">Jours</div>
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-2 italic">Solde actuel : <span className="text-amber-600">{isAdjusting.soldeRestant}</span> → Nouveau solde : <span className="text-green-600">{isAdjusting.soldeRestant + (adjustForm.amount || 0)}</span></p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Justification RH (Obligatoire)</label>
                <textarea 
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm text-gray-800 outline-none focus:border-amber-400 transition min-h-[100px]"
                  placeholder="Ex: Prime d'ancienneté, Correction d'erreur d'import..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsAdjusting(null)}
                  className="flex-1 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleAdjustBalance}
                  className="flex-2 px-10 py-4 bg-gray-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-900 transition flex items-center justify-center gap-3"
                >
                  Confirmer l'Ajustement <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border flex gap-3 text-gray-400">
               <ShieldAlert size={20} className="shrink-0" />
               <p className="text-[10px] font-bold leading-relaxed italic uppercase">
                  Attention : Chaque ajustement est tracé dans les logs système avec votre signature. Cette action est irréversible dans l'audit.
               </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
