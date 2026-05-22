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
  ChevronLeft,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'start', direction: 'desc' });

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const departments = Array.from(new Set(balances.map(d => d.departement))).filter(Boolean).sort();
  const leaveTypesList = Array.from(new Set(planningData.map(d => d.type))).filter(Boolean).sort();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = planningData
    .filter(item => {
      const matchesSearch = item.employee.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.matricule && item.matricule.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.departement && item.departement.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = filterDept === "ALL" || item.departement === filterDept;
      const matchesStatus = filterStatus === "ALL" || 
                           (filterStatus === "APPROVED" && item.isApproved) || 
                           (filterStatus === "PENDING" && !item.isApproved);
      const matchesType = filterType === "ALL" || item.type === filterType;
      return matchesSearch && matchesDept && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;
      
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === 'duration') {
        aValue = calculateDuration(a.start, a.end);
        bValue = calculateDuration(b.start, b.end);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // LIVE STATS CALCULATION
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Calculate active absences for current filter
  const liveActiveAbsences = filteredAndSortedData.filter(abs => {
    const start = new Date(abs.start).toISOString().split('T')[0];
    const end = new Date(abs.end).toISOString().split('T')[0];
    return abs.isApproved && todayStr >= start && todayStr <= end;
  }).length;

  // 2. Calculate total employees for current filtered department
  const filteredEmployeesCount = balances.filter(u => 
    filterDept === "ALL" || u.departement === filterDept
  ).length || stats?.totalEmployees || 1;

  const liveAbsenteeismRate = ((liveActiveAbsences / filteredEmployeesCount) * 100).toFixed(1);

  const tabs = [
    { id: "planning", name: "Vision Globale", icon: Calendar },
    { id: "balances", name: "Suivi des Soldes", icon: TableIcon },
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

  const exportCSV = (data = planningData) => {
    // Generate simple CSV for demo
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Matricule,Employe,Departement,Date Debut,Date Fin,Type,Statut,Duree\n";
    
    data.forEach(row => {
      const duration = calculateDuration(row.start, row.end);
      csvContent += `${row.matricule},${row.employee},${row.departement},${row.start},${row.end},${row.type},${row.status},${duration}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_conges_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronisation du moteur de paie...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 min-h-screen font-sans text-slate-100 pb-20">
      
      {/* HEADER SECTION */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <ShieldAlert size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Module RH Avancé</span>
          </div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
            Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Congés</span>
          </h1>
          <p className="text-slate-400 font-bold mt-2 text-sm italic">Pilotage de la dette sociale et conformité paie.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-300">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Taux d'Absentéisme</p>
              <p className="text-xl font-black text-indigo-300">{liveAbsenteeismRate}%</p>
            </div>
          </div>
          <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-300">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Effectif Absent</p>
              <p className="text-xl font-black text-indigo-300">{liveActiveAbsences} <span className="text-[10px] text-slate-400">Collaborateurs</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-950/85 p-2 rounded-3xl border border-slate-800/80 backdrop-blur-sm w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${activeTab === tab.id ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)] font-black" : "text-slate-400 hover:text-slate-200"}`}
          >
            <tab.icon size={14} />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[2.5rem] overflow-hidden">
        
        {/* TAB CONTENT: PLANNING */}
        {activeTab === "planning" && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Planning d'Entreprise</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  {viewMode === 'calendar' 
                    ? currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
                    : "Vue Liste détaillée"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View Switcher */}
                <div className="flex bg-slate-900 p-1.5 rounded-[1rem] border border-slate-800/80 shadow-inner">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <LayoutList size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Liste</span>
                  </button>
                  <button 
                    onClick={() => setViewMode("calendar")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Calendar size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Calendrier</span>
                  </button>
                </div>

                {viewMode === 'calendar' && (
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/80 rounded-[1rem] p-1.5 shadow-sm">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] font-black text-slate-200 uppercase tracking-widest transition-all border border-slate-800/60"
                    >
                      Aujourd'hui
                    </button>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                      className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                <div className="hidden xl:flex gap-6 items-center px-6 py-2 bg-slate-950 border border-slate-800/80 rounded-2xl ml-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/10"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Validé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-indigo-500/40 animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">En Attente</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FILTER BAR */}
            <div className="flex flex-col gap-4 mb-8 bg-slate-900/85 p-6 rounded-3xl border border-slate-800/80 shadow-sm">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un employé, matricule ou département..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800/80 text-white placeholder:text-slate-500 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 outline-none rounded-2xl font-bold text-sm transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select 
                      className="appearance-none bg-slate-950 border border-slate-800/80 rounded-2xl pl-5 pr-12 py-4 font-black text-[11px] uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                    >
                      <option value="ALL">Départements (Tous)</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>

                  <div className="relative">
                    <select 
                      className="appearance-none bg-slate-950 border border-slate-800/80 rounded-2xl pl-5 pr-12 py-4 font-black text-[11px] uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="ALL">Statuts (Tous)</option>
                      <option value="PENDING">En Attente</option>
                      <option value="APPROVED">Validé</option>
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                  </div>

                  <button 
                    onClick={() => exportCSV(filteredAndSortedData)}
                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                  >
                    <FileDown size={16} />
                    Exporter la vue
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    {filteredAndSortedData.length} résultats trouvés
                    {searchTerm && <span className="italic normal-case text-indigo-400 font-bold ml-1">pour "{searchTerm}"</span>}
                  </p>
                  {(searchTerm || filterDept !== "ALL" || filterStatus !== "ALL" || filterType !== "ALL") && (
                    <button 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterDept("ALL");
                        setFilterStatus("ALL");
                        setFilterType("ALL");
                      }}
                      className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
                
                <div className="relative">
                    <select 
                      className="appearance-none bg-transparent pl-2 pr-8 py-1 font-black text-[10px] uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="ALL">Type de congé : Tous</option>
                      {leaveTypesList.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Filter className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-slate-900/85 border-b border-slate-800/80">
                      <th 
                        className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-indigo-300 transition-colors group"
                        onClick={() => handleSort('employee')}
                      >
                        <div className="flex items-center gap-2">
                          Employé
                          {sortConfig.key === 'employee' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100" />}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-indigo-300 transition-colors group"
                        onClick={() => handleSort('start')}
                      >
                        <div className="flex items-center gap-2">
                          Période
                          {sortConfig.key === 'start' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100" />}
                        </div>
                      </th>
                      <th 
                        className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-indigo-300 transition-colors group text-center"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Durée
                          {sortConfig.key === 'duration' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100" />}
                        </div>
                      </th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Statut</th>
                      <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAndSortedData.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-500/5 transition group border-b border-slate-800/60 last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-indigo-300 flex items-center justify-center font-black text-sm shadow-sm border border-slate-800/80">
                              {row.employee.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-white text-sm">{row.employee}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                                <span className="text-indigo-400/50">#{row.matricule}</span>
                                <span>•</span>
                                <span>{row.departement}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-300">
                              {new Date(row.start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {new Date(row.end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-black text-slate-300 bg-slate-950 border border-slate-800/80 px-2 py-1 rounded-lg">
                            {calculateDuration(row.start, row.end)} <span className="text-[8px] uppercase text-slate-500">Jrs</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border" style={{ backgroundColor: `${row.color}15`, color: row.color, borderColor: `${row.color}30` }}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-4">
                          {row.isApproved ? (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Validé</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                              <span className="text-[9px] font-black uppercase tracking-widest">En Attente</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                           {!row.isApproved ? (
                              <a 
                                href="/hr/validation-rh"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-slate-800 text-indigo-300 rounded-xl hover:bg-gradient-to-r hover:from-indigo-600 hover:to-sky-600 hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest group"
                              >
                                Traiter <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </a>
                            ) : (
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic pr-4">Archivé</div>
                            )}
                        </td>
                      </tr>
                    ))}
                    {filteredAndSortedData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <div className="bg-slate-950/85 border border-slate-800/80 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400/20">
                            <Search size={40} />
                          </div>
                          <h4 className="text-white font-black uppercase tracking-tighter italic text-lg">Aucun résultat</h4>
                          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Ajustez vos filtres pour trouver ce que vous cherchez</p>
                          <button 
                            onClick={() => {
                              setSearchTerm("");
                              setFilterDept("ALL");
                              setFilterStatus("ALL");
                              setFilterType("ALL");
                            }}
                            className="mt-6 px-6 py-2 bg-slate-900 border border-slate-800/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:bg-slate-850 transition-all"
                          >
                            Effacer les filtres
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {/* CALENDAR VIEW GRID */}
                <div className="grid grid-cols-7 gap-[1px] bg-indigo-500/10 border-x border-b border-slate-800/80 rounded-b-[2rem] overflow-hidden shadow-2xl">
                  {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
                    <div key={day} className="bg-slate-950 p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-800/80">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-slate-950/20 min-h-[140px] border-t border-l border-slate-800/60"></div>
                  ))}

                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const currentDayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateStr = currentDayDate.toISOString().split('T')[0];
                    const isWeekend = currentDayDate.getDay() === 5 || currentDayDate.getDay() === 6;
                    
                    const dayAbsences = filteredAndSortedData.filter(abs => {
                      const start = new Date(abs.start).toISOString().split('T')[0];
                      const end = new Date(abs.end).toISOString().split('T')[0];
                      return dateStr >= start && dateStr <= end;
                    });

                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                      <div 
                        key={day} 
                        className={`bg-slate-950/85 min-h-[140px] p-3 border-t border-l border-slate-800/80 flex flex-col gap-2 transition-all duration-300 group/day relative
                          ${isWeekend ? 'bg-slate-950/10' : 'bg-slate-950/70'} 
                          ${isToday ? 'ring-2 ring-inset ring-indigo-500/30 z-10' : ''}
                          hover:bg-indigo-500/5`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[12px] font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-500
                            ${isToday ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xl scale-110' : 'text-slate-400 group-hover/day:text-white'}`}>
                            {day}
                          </span>
                          {dayAbsences.length > 0 && (
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter bg-slate-900 px-2 py-1 rounded-lg group-hover/day:bg-indigo-500/10 group-hover/day:text-indigo-300 transition-all border border-slate-800/60">
                              {dayAbsences.length}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
                          {dayAbsences.map((abs, idx) => (
                            <div 
                              key={idx}
                              title={`${abs.employee} - ${abs.type}`}
                              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black truncate border-l-4 shadow-sm transition-all hover:translate-x-1 cursor-pointer
                                ${abs.isApproved ? 'shadow-[0_0_10px_rgba(99,102,241,0.05)]' : 'opacity-60 border-dashed bg-slate-950/85 border shadow-none italic'}`}
                              style={{ 
                                backgroundColor: abs.isApproved ? `${abs.color}15` : 'transparent', 
                                color: abs.color, 
                                borderLeftColor: abs.color,
                                borderColor: !abs.isApproved ? `${abs.color}30` : 'transparent'
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                {!abs.isApproved && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]"></div>}
                                {abs.employee.split(' ')[0]}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Interactive Dot Indicator if many absences */}
                        {dayAbsences.length > 4 && (
                           <div className="absolute bottom-2 right-2 text-[8px] font-black text-slate-500">
                             +{dayAbsences.length - 4} plus
                           </div>
                        )}
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
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Suivi des Compteurs</h3>
              <div className="p-3 bg-indigo-500/10 rounded-2xl flex items-center gap-3 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-slate-800 shadow-sm">
                <History size={16} /> Historique des corrections activé
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/85 border-b border-slate-800/80">
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Matricule</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Collaborateur</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Département</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Solde Restant</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {balances.map(u => (
                    <tr key={u.id} className="hover:bg-indigo-500/5 transition group">
                      <td className="p-4 font-black text-slate-400 text-xs">{u.matricule}</td>
                      <td className="p-4 font-black text-white text-sm">{u.nomComplet}</td>
                      <td className="p-4">
                        <span className="p-1 px-3 bg-slate-900 rounded-lg text-[9px] font-black uppercase text-slate-300 tracking-wider font-mono border border-slate-800/60">
                          {u.departement}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`text-lg font-black ${u.soldeRestant > 10 ? 'text-indigo-300' : 'text-red-400'}`}>
                          {u.soldeRestant} <span className="text-[8px] uppercase tracking-widest ml-1 opacity-50">Jours</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setIsAdjusting(u)}
                          className="p-2 bg-slate-900 border border-slate-800/80 shadow-sm rounded-xl text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition group-hover:scale-110"
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


        {/* TAB CONTENT: RULES */}
        {activeTab === "rules" && (
           <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                  <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-300 border border-slate-800"><CheckCircle2 size={24} /></div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Guide des Quotas Somepharm</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaveTypes.map((rule, idx) => (
                  <div key={idx} className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-6 hover:shadow-xl transition-all border-l-8" style={{ borderLeftColor: rule.couleurHex }}>
                     <div className="flex justify-between items-start mb-4">
                        <span className="font-black text-white uppercase text-xs">{rule.nom}</span>
                        <div className="px-3 py-1 bg-slate-900 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-800/80">
                            {rule.justificatifObligatoire ? "Justificatif Requis" : "Sans Justificatif"}
                        </div>
                     </div>
                     <p className="text-sm font-black text-white mb-2">
                        {rule.quotaInitial > 0 ? `${rule.quotaInitial} jours/an` : (rule.nom === 'Maladie' ? 'Illimité' : 'Selon solde')}
                     </p>
                     <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">{rule.description}</p>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* TAB CONTENT: EXPORTS */}
        {activeTab === "exports" && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-slate-950 shadow-2xl shadow-indigo-500/10 mb-10 group">
                <FileDown size={40} className="group-hover:translate-y-1 transition-transform" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Prêt pour l'Extraction</h3>
            <p className="text-slate-400 font-bold max-w-md mb-10 text-sm leading-relaxed">
                Générez un fichier CSV universel contenant toutes les absences validées. Ce fichier peut être importé directement dans votre logiciel de paie SAGE ou Excel.
            </p>
            <div className="flex gap-4">
                <div className="relative group">
                  <button 
                    onClick={() => exportCSV()}
                    className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-3 hover:scale-105"
                  >
                    Généérer Export Global (CSV) <ChevronRight size={16} />
                  </button>
                  <p className="absolute -bottom-8 left-0 right-0 text-[8px] font-black text-slate-500 uppercase tracking-widest">Période : {new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</p>
                </div>
            </div>
          </div>
        )}

      </div>

      {/* BALANCE ADJUSTMENT MODAL */}
      {isAdjusting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-[3rem] p-10 max-w-lg w-full text-white animate-in slide-in-from-bottom-8 duration-500 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1 block">Régularisation Manuelle</span>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Ajuster le solde</h3>
                <p className="text-slate-400 font-bold mt-2 text-xs uppercase">{isAdjusting.nomComplet} ({isAdjusting.matricule})</p>
              </div>
              <button onClick={() => setIsAdjusting(null)} className="p-2 border border-slate-800/80 rounded-xl hover:bg-slate-800 text-slate-400 transition">
                <History size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Valeur de l'ajustement (jours)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({...adjustForm, amount: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-black text-2xl text-white outline-none focus:border-indigo-500/40 transition"
                    placeholder="Ex: 1, -2..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">Jours</div>
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-2 italic">Solde actuel : <span className="text-indigo-400">{isAdjusting.soldeRestant}</span> → Nouveau solde : <span className="text-green-400">{isAdjusting.soldeRestant + (adjustForm.amount || 0)}</span></p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Justification RH (Obligatoire)</label>
                <textarea 
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-bold text-sm text-white outline-none focus:border-indigo-500/40 transition min-h-[100px] placeholder:text-slate-600"
                  placeholder="Ex: Prime d'ancienneté, Correction d'erreur d'import..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsAdjusting(null)}
                  className="flex-1 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-800 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleAdjustBalance}
                  className="flex-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:opacity-90 transition flex items-center justify-center gap-3"
                >
                  Confirmer l'Ajustement <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-slate-800/80 flex gap-3 text-indigo-400/70">
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

