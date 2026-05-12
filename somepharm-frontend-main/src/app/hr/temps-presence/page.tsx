"use client";
import React, { useState, useEffect } from "react";
import {
   Clock,
   Users,
   UserMinus,
   AlertTriangle,
   Calendar,
   Filter,
   Download,
   ChevronRight,
   ChevronLeft,
   ChevronDown,
   Activity,
   ShieldCheck,
   Search,
   MapPin,
   TrendingUp,
   BarChart3,
   Calculator,
   RefreshCw
} from "lucide-react";

export default function TempsPresencePage() {
   const [activeTab, setActiveTab] = useState("monitoring");
   const [stats, setStats] = useState({
      totalEmployees: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      todayLogs: []
   });
   const [loading, setLoading] = useState(true);
   const [anomalies, setAnomalies] = useState<any[]>([]);
   const [loadingAnomalies, setLoadingAnomalies] = useState(false);
   const [showRegulModal, setShowRegulModal] = useState(false);
   const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
   const [manualTime, setManualTime] = useState("");
   const [reason, setReason] = useState("");
   const [searchTerm, setSearchTerm] = useState("");

   const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
   const [serverTime, setServerTime] = useState<string>("");

   // Custom Calendar State
   const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
   const [anomalyCalendar, setAnomalyCalendar] = useState<Record<string, string>>({});
   const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
   const [viewYear, setViewYear] = useState(new Date().getFullYear());

   useEffect(() => {
      setServerTime(new Date().toLocaleTimeString("fr-FR"));
      const timer = setInterval(() => {
         setServerTime(new Date().toLocaleTimeString("fr-FR"));
      }, 1000);
      fetchStats();
      return () => clearInterval(timer);
   }, []);

   const fetchAnomalyCalendar = async (m: number, y: number) => {
      try {
         const token = localStorage.getItem("token");
         const res = await fetch(`http://localhost:8080/api/presence/anomalies-calendar?year=${y}&month=${m}`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) setAnomalyCalendar(await res.json());
      } catch (err) { console.error(err); }
   };

   useEffect(() => {
      fetchAnomalyCalendar(viewMonth, viewYear);
   }, [viewMonth, viewYear]);

   // History State
   const [historyLogs, setHistoryLogs] = useState<any[]>([]);
   const [historyMatricule, setHistoryMatricule] = useState("");
   const [historyStartDate, setHistoryStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
   const [historyEndDate, setHistoryEndDate] = useState(new Date().toISOString().split('T')[0]);

   // Calcul State
   const [calculReport, setCalculReport] = useState<any>(null);
   const [calculMatricule, setCalculMatricule] = useState("SP-EMP");
   const [calculMonth, setCalculMonth] = useState(new Date().getMonth() + 1);
   const [calculYear, setCalculYear] = useState(new Date().getFullYear());

   // Analytics State
   const [analyticsData, setAnalyticsData] = useState<any>(null);
   const [allDepartments, setAllDepartments] = useState<any[]>([]);
   const [showExportMenu, setShowExportMenu] = useState(false);

   useEffect(() => {
      fetchStats();
   }, []);

   useEffect(() => {
      if (activeTab === "anomalies") {
         fetchAnomalies();
      }
      if (activeTab === "historique") {
         fetchHistory();
      }
      if (activeTab === "calcul") {
         fetchCalculReport();
      }
      if (activeTab === "stats") {
         fetchAnalytics();
      }
   }, [activeTab, selectedDate]);

   const fetchStats = async () => {
      try {
         const token = localStorage.getItem("token");
         const res = await fetch("http://localhost:8080/api/presence/live-stats", {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) {
            const data = await res.json();
            setStats(data);
         }
      } catch (err) {
         console.error("Failed to fetch presence stats", err);
      } finally {
         setLoading(false);
      }
   };

   const fetchAnalytics = async () => {
      try {
         const token = localStorage.getItem("token");
         // Fetch analytics
         const res = await fetch(`http://localhost:8080/api/presence/analytics`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) setAnalyticsData(await res.json());

         // Fetch all departments for the export menu
         const resDepts = await fetch(`http://localhost:8080/api/departements`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (resDepts.ok) setAllDepartments(await resDepts.json());
      } catch (err) { console.error(err); }
   };

   const handleGlobalExport = () => {
      if (!stats.todayLogs || stats.todayLogs.length === 0) return;

      let csvContent = "\ufeff";
      csvContent += "Matricule,Nom,Prenom,Departement,Type,Heure,Methode,Statut\n";

      stats.todayLogs.forEach((log: any) => {
         csvContent += `${log.employe.matricule},${log.employe.nom},${log.employe.prenom},${log.employe.departement?.nomDept || log.employe.departement},${log.typePointage},${new Date(log.horodatage).toLocaleTimeString()},${log.methode},${log.statut}\n`;
      });

      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `presence_globale_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleExportPlanning = (dept?: string) => {
      if (!analyticsData?.topLeaveBalances) return;

      let dataToExport = analyticsData.topLeaveBalances;
      if (dept && dept !== "ALL") {
         dataToExport = dataToExport.filter((u: any) => u.departement === dept);
      }

      // Add UTF-8 BOM for Excel
      let csvContent = "\ufeff";
      csvContent += "Matricule,Collaborateur,Departement,Solde Conges (Jours)\n";

      dataToExport.forEach((u: any) => {
         // Ensure values are strings and handle potential commas in names
         const name = (u.nomComplet || "").replace(/,/g, " ");
         const deptName = (u.departement || "").replace(/,/g, " ");
         csvContent += `${u.matricule || ""},${name},${deptName},${u.soldeConges || 0}\n`;
      });

      const filename = dept && dept !== "ALL"
         ? `planification_${dept.replace(/[^a-z0-9]/gi, '_')}.csv`
         : "planification_conges_globale.csv";

      const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
         document.body.removeChild(link);
      }, 100);

      setShowExportMenu(false);
   };

   const fetchCalculReport = async () => {
      try {
         const token = localStorage.getItem("token");
         const res = await fetch(`http://localhost:8080/api/presence/report?matricule=${calculMatricule}&year=${calculYear}&month=${calculMonth}`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) setCalculReport(await res.json());
      } catch (err) { console.error(err); }
   };

   const fetchHistory = async () => {
      try {
         const token = localStorage.getItem("token");
         const start = `${historyStartDate}T00:00:00`;
         const end = `${historyEndDate}T23:59:59`;
         let url = `http://localhost:8080/api/pointage/search?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
         if (historyMatricule) url += `&matricule=${historyMatricule}`;

         const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) setHistoryLogs(await res.json());
      } catch (err) { console.error(err); }
   };

   const fetchAnomalies = async () => {
      setLoadingAnomalies(true);
      try {
         const token = localStorage.getItem("token");
         const res = await fetch(`http://localhost:8080/api/presence/anomalies?date=${selectedDate}`, {
            headers: { "Authorization": `Bearer ${token}` }
         });
         if (res.ok) setAnomalies(await res.json());
      } catch (err) { console.error(err); } finally { setLoadingAnomalies(false); }
   };

   const handleRegularizeSubmit = async () => {
      if (!selectedAnomaly || !manualTime) return;
      try {
         const token = localStorage.getItem("token");
         const fullDateTime = `${selectedDate}T${manualTime}:00`;

         const res = await fetch(`http://localhost:8080/api/presence/add-manual?idUser=${selectedAnomaly.employe.idUser}&time=${encodeURIComponent(fullDateTime)}&type=SORTIE&reason=${encodeURIComponent(reason || "Régularisation Manuelle")}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
         });

         if (res.ok) {
            setShowRegulModal(false);
            setManualTime("");
            setReason("");
            fetchAnomalies();
            fetchStats();
         }
      } catch (err) { console.error(err); }
   };

   const tabs = [
      { id: "monitoring", label: "Monitoring Live", icon: <Activity size={18} /> },
      { id: "anomalies", label: "Gestion Anomalies", icon: <AlertTriangle size={18} /> },
      { id: "historique", label: "Registre Historique", icon: <Calendar size={18} /> },
      { id: "calcul", label: "Calcul des Heures", icon: <Clock size={18} /> },
      { id: "stats", label: "Reporting & Stats", icon: <BarChart3 size={18} /> },
   ];

   return (
      <div className="space-y-8 animate-in fade-in duration-700">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                  Temps & <span className="text-blue-600">Présence</span>
               </h1>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Contrôle, Régularisation & Audit de l'activité
               </p>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={handleGlobalExport}
                  title="Exporter le registre du jour"
                  className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-blue-600 active:scale-95"
               >
                  <Download size={20} />
               </button>
               <div className="bg-blue-600 text-white px-6 py-4 rounded-[2rem] shadow-xl shadow-blue-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                     <Clock size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase opacity-60">Heure Serveur</p>
                     <p className="font-mono font-black text-lg">{serverTime || "--:--:--"}</p>
                  </div>
               </div>
            </div>
         </div>

         {/* TABS NAVIGATION */}
         <div className="flex items-center gap-2 bg-gray-100/50 p-2 rounded-[2.5rem] border border-gray-200/50 backdrop-blur-sm w-fit">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-3xl flex items-center gap-3 transition-all duration-300 font-black text-[10px] uppercase tracking-widest
              ${activeTab === tab.id
                        ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                        : "text-gray-400 hover:text-gray-600"}`}
               >
                  {tab.icon} {tab.label}
               </button>
            ))}
         </div>

         {/* CONTENT AREA */}
         <div className="grid grid-cols-1 gap-8">

            {activeTab === "monitoring" && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {/* ... Monitoring content stays same ... */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <PresenceCard
                        label="Présents Actuels"
                        value={stats.presentCount}
                        total={stats.totalEmployees}
                        color="emerald"
                        icon={<Users size={24} />}
                     />
                     <PresenceCard
                        label="Absences du Jour"
                        value={stats.absentCount}
                        total={stats.totalEmployees}
                        color="red"
                        icon={<UserMinus size={24} />}
                     />
                     <PresenceCard
                        label="Retards Détectés"
                        value={stats.lateCount}
                        total={stats.presentCount}
                        color="amber"
                        icon={<Clock size={24} />}
                     />
                     <div className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                           <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                              <TrendingUp size={24} />
                           </div>
                           <span className="text-[10px] font-black text-emerald-500">+12% vs hier</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taux de Présence</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">
                           {stats.totalEmployees > 0 ? Math.round((stats.presentCount / stats.totalEmployees) * 100) : 0}%
                        </p>
                     </div>
                  </div>

                  {/* LIVE FEED TABLE */}
                  <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
                     <div className="px-10 py-8 border-b flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-4">
                           <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                           <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">Flux de Pointage en Direct</h3>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                              <input
                                 type="text"
                                 placeholder="Chercher un collaborateur..."
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all w-64"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                              <tr>
                                 <th className="px-10 py-6">Collaborateur</th>
                                 <th className="px-10 py-6">Événement</th>
                                 <th className="px-10 py-6">Heure</th>
                                 <th className="px-10 py-6">Méthode</th>
                                 <th className="px-10 py-6 text-right">Statut</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {(stats.todayLogs || [])
                                 .filter((log: any) => {
                                    if (!searchTerm) return true;
                                    const searchLower = searchTerm.toLowerCase();
                                    return (log.employe.matricule?.toLowerCase() || '').includes(searchLower) ||
                                           (log.employe.nom?.toLowerCase() || '').includes(searchLower) ||
                                           (log.employe.prenom?.toLowerCase() || '').includes(searchLower);
                                 })
                                 .map((log: any) => (
                                 <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-blue-600 text-xs">
                                             {log.employe.matricule?.substring(0, 2)}
                                          </div>
                                          <div>
                                             <p className="font-black text-gray-800 text-sm uppercase">{log.employe.prenom} {log.employe.nom}</p>
                                             <p className="text-[10px] text-gray-400 font-bold uppercase">{log.employe.departement?.nomDept || log.employe.departement}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-6">
                                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.typePointage === 'ENTREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                          }`}>
                                          {log.typePointage}
                                       </span>
                                    </td>
                                    <td className="px-10 py-6 font-mono font-black">{new Date(log.horodatage).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">{log.methode}</td>
                                    <td className="px-10 py-6 text-right font-black text-[9px] uppercase text-emerald-500">{log.statut}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "anomalies" && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="bg-amber-50 border border-amber-200 p-8 rounded-[3rem] flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 bg-amber-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl">
                           <AlertTriangle size={32} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight italic">Nettoyage des Données</h3>
                           <p className="text-amber-700 text-sm font-medium mt-1">Le système a détecté {anomalies.length} incohérences pour le {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                        </div>
                     </div>

                     <div className="relative">
                        <button
                           onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                           className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all group min-w-[280px]"
                        >
                           <Calendar size={20} className="text-blue-600 ml-2" />
                           <div className="text-left flex-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date Sélectionnée</p>
                              <p className="font-black text-xs uppercase tracking-widest text-gray-800">
                                 {new Date(selectedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                           </div>
                           <ChevronDown size={16} className={`text-gray-300 transition-transform ${showCalendarDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showCalendarDropdown && (
                           <div className="absolute top-full mt-4 right-0 z-[110] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 w-[350px] animate-in zoom-in-95 fade-in duration-200">
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-8">
                                 <button
                                    type="button"
                                    onClick={() => {
                                       if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
                                       else setViewMonth(viewMonth - 1);
                                    }}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all"
                                 >
                                    <ChevronLeft size={16} />
                                 </button>
                                 <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">
                                    {new Date(viewYear, viewMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                 </h4>
                                 <button
                                    type="button"
                                    onClick={() => {
                                       if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
                                       else setViewMonth(viewMonth + 1);
                                    }}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all"
                                 >
                                    <ChevronRight size={16} />
                                 </button>
                              </div>

                              {/* Calendar Grid */}
                              <div className="grid grid-cols-7 gap-3">
                                 {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={i} className="text-[9px] font-black text-gray-300 text-center mb-2">{d}</div>
                                 ))}
                                 {(() => {
                                    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
                                    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
                                    const offset = firstDay === 0 ? 6 : firstDay - 1;
                                    const days = [];
                                    for (let i = 0; i < offset; i++) days.push(<div key={`empty-${i}`} />);
                                    for (let d = 1; d <= daysInMonth; d++) {
                                       const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                       const status = anomalyCalendar[dateStr];
                                       const isSelected = selectedDate === dateStr;

                                       days.push(
                                          <button
                                             key={d}
                                             type="button"
                                             onClick={() => { setSelectedDate(dateStr); setShowCalendarDropdown(false); }}
                                             className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all border-2
                                         ${isSelected ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-transparent hover:border-gray-200'}
                                         ${status === 'OK' ? 'bg-emerald-500 text-white' :
                                                   status === 'ANOMALY' ? 'bg-red-500 text-white' :
                                                      'bg-gray-50 text-gray-400'}
                                       `}
                                          >
                                             {d}
                                          </button>
                                       );
                                    }
                                    return days;
                                 })()}
                              </div>

                              {/* Legend */}
                              <div className="mt-8 pt-6 border-t flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[8px] font-black uppercase text-gray-400">Aucune Anomalie</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-[8px] font-black uppercase text-gray-400">Anomalie(s)</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {anomalies.length === 0 && !loadingAnomalies && (
                     <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-[3rem] flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                           <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-emerald-900 italic uppercase">Tout est en ordre</h3>
                        <p className="text-emerald-700 text-sm font-medium max-w-md">Aucune anomalie de pointage détectée pour cette date. Vos données sont prêtes pour le reporting.</p>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {anomalies.map((ano, i) => {
                        const lastLog = ano.logs[ano.logs.length - 1];
                        return (
                           <div key={i} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-8 space-y-6 hover:shadow-xl transition-all border-l-8 border-l-amber-500">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-blue-600 uppercase">
                                       {ano.employe.matricule?.substring(0, 2)}
                                    </div>
                                    <div>
                                       <p className="font-black text-gray-800 uppercase leading-tight">{ano.employe.prenom} {ano.employe.nom}</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ano.employe.departement?.nomDept || ano.employe.departement}</p>
                                    </div>
                                 </div>
                                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{selectedDate}</span>
                              </div>
                              <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                                 <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-bold">Type d'erreur</span>
                                    <span className="text-amber-600 font-black">{ano.type.replace(/_/g, ' ')}</span>
                                 </div>
                                 <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-bold">Dernier pointage</span>
                                    <span className="text-gray-800 font-black">
                                       {lastLog.typePointage} - {new Date(lastLog.horodatage).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                 </div>
                              </div>
                              <button
                                 onClick={() => { setSelectedAnomaly(ano); setShowRegulModal(true); }}
                                 className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group"
                              >
                                 <Activity size={16} className="group-hover:rotate-12 transition-transform" /> Régulariser maintenant
                              </button>
                           </div>
                        )
                     })}
                  </div>

                  {/* REGULARIZATION MODAL */}
                  {showRegulModal && (
                     <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                           <div>
                              <div className="flex items-center justify-between">
                                 <h3 className="text-2xl font-black text-gray-900 italic uppercase">Régularisation</h3>
                                 <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {selectedDate}
                                 </div>
                              </div>
                              <p className="text-gray-400 text-xs font-bold uppercase mt-2 tracking-widest">Collaborateur: {selectedAnomaly?.employe.matricule}</p>
                           </div>

                           <div className="space-y-6">
                              <div>
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Heure de Sortie</label>
                                 <input
                                    type="time"
                                    value={manualTime}
                                    onChange={(e) => setManualTime(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-lg focus:border-blue-500 outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Motif du changement</label>
                                 <textarea
                                    placeholder="Ex: Oubli de pointage, vérifié avec le manager..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:border-blue-500 outline-none min-h-[100px]"
                                 />
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <button
                                 onClick={() => setShowRegulModal(false)}
                                 className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                              >
                                 Annuler
                              </button>
                              <button
                                 onClick={handleRegularizeSubmit}
                                 disabled={!manualTime}
                                 className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                              >
                                 Confirmer
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {activeTab === "historique" && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                           <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">Registre Historique</h3>
                           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Audit complet des pointages et présences</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex items-center gap-2">
                              <Search className="ml-3 text-gray-300" size={16} />
                              <input
                                 type="text"
                                 placeholder="Matricule..."
                                 value={historyMatricule}
                                 onChange={(e) => setHistoryMatricule(e.target.value)}
                                 className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2 w-32"
                              />
                           </div>
                           <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex items-center gap-2">
                              <Calendar className="ml-3 text-gray-300" size={16} />
                              <input
                                 type="date"
                                 value={historyStartDate}
                                 onChange={(e) => setHistoryStartDate(e.target.value)}
                                 className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2"
                              />
                              <span className="text-gray-300 font-black">→</span>
                              <input
                                 type="date"
                                 value={historyEndDate}
                                 onChange={(e) => setHistoryEndDate(e.target.value)}
                                 className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2"
                              />
                           </div>
                           <button
                              onClick={fetchHistory}
                              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                           >
                              Filtrer
                           </button>
                        </div>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                              <tr>
                                 <th className="px-10 py-6">Date</th>
                                 <th className="px-10 py-6">Collaborateur</th>
                                 <th className="px-10 py-6">Événement</th>
                                 <th className="px-10 py-6">Heure</th>
                                 <th className="px-10 py-6">Méthode</th>
                                 <th className="px-10 py-6 text-right">Statut</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {historyLogs.length === 0 && (
                                 <tr>
                                    <td colSpan={6} className="px-10 py-20 text-center text-gray-400 italic font-medium">
                                       Aucun enregistrement trouvé pour cette période.
                                    </td>
                                 </tr>
                              )}
                              {historyLogs.map((log: any) => (
                                 <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-10 py-6 font-mono font-black text-xs text-gray-400">
                                       {new Date(log.horodatage).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-10 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-gray-400 text-[10px]">
                                             {log.employe.matricule?.substring(0, 2)}
                                          </div>
                                          <div>
                                             <p className="font-black text-gray-800 text-[11px] uppercase">{log.employe.prenom} {log.employe.nom}</p>
                                             <p className="text-[9px] text-gray-400 font-bold uppercase">{log.employe.matricule}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-10 py-6">
                                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.typePointage === 'ENTREE' ? 'bg-emerald-50 text-emerald-600' :
                                          log.typePointage === 'SORTIE' ? 'bg-rose-50 text-rose-600' :
                                             log.typePointage.includes('AUTORISEE') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                'bg-blue-50 text-blue-600'
                                          }`}>
                                          {log.typePointage.replace(/_/g, ' ')}
                                       </span>
                                    </td>
                                    <td className="px-10 py-6 font-mono font-black text-sm text-gray-900">
                                       {new Date(log.horodatage).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-10 py-6 text-[9px] font-black uppercase text-gray-400 italic">
                                       {log.methode}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                       <span className={`font-black text-[9px] uppercase ${log.statut === 'OK' ? 'text-emerald-500' : log.statut === 'REGULARISE' ? 'text-blue-500' : 'text-amber-500'
                                          }`}>
                                          {log.statut}
                                       </span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "calcul" && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {/* FILTERS */}
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                           <Calculator size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">Calcul des Heures</h3>
                           <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Génération du rapport mensuel</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex items-center gap-2">
                           <Search className="ml-3 text-gray-300" size={16} />
                           <input
                              type="text"
                              placeholder="Matricule..."
                              value={calculMatricule}
                              onChange={(e) => setCalculMatricule(e.target.value)}
                              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2 w-32"
                           />
                        </div>
                        <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100 flex items-center gap-2">
                           <Calendar className="ml-3 text-gray-300" size={16} />
                           <select
                              value={calculMonth}
                              onChange={(e) => setCalculMonth(parseInt(e.target.value))}
                              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2"
                           >
                              {Array.from({ length: 12 }, (_, i) => (
                                 <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('fr-FR', { month: 'long' })}</option>
                              ))}
                           </select>
                           <select
                              value={calculYear}
                              onChange={(e) => setCalculYear(parseInt(e.target.value))}
                              className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-gray-800 p-2"
                           >
                              <option value={2026}>2026</option>
                              <option value={2025}>2025</option>
                           </select>
                        </div>
                        <button
                           onClick={fetchCalculReport}
                           className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                           Calculer
                        </button>
                     </div>
                  </div>

                  {calculReport && (
                     <div className="space-y-8">
                        {/* SUMMARY CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps de Travail Net</p>
                              <div className="flex items-baseline gap-2">
                                 <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{calculReport.totalHours}</h4>
                                 <span className="text-xs font-black text-gray-400 uppercase">Heures</span>
                              </div>
                           </div>
                           <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 space-y-4">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Heures Supplémentaires</p>
                              <div className="flex items-baseline gap-2 text-emerald-700">
                                 <h4 className="text-4xl font-black tracking-tighter">+{calculReport.totalOvertime}</h4>
                                 <span className="text-xs font-black uppercase">Hrs</span>
                              </div>
                           </div>
                           <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100 space-y-4">
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Retards Détectés</p>
                              <div className="flex items-baseline gap-2 text-amber-700">
                                 <h4 className="text-4xl font-black tracking-tighter">{calculReport.totalLateMinutes}</h4>
                                 <span className="text-xs font-black uppercase">Min</span>
                              </div>
                           </div>
                           <div className="bg-gray-900 p-8 rounded-[3rem] space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assiduité</p>
                              <div className="flex items-baseline gap-2 text-white">
                                 <h4 className="text-4xl font-black tracking-tighter">{calculReport.daysPresent}</h4>
                                 <span className="text-xs font-black text-gray-400 uppercase">Jours / {calculReport.dailyDetails.length}</span>
                              </div>
                           </div>
                        </div>

                        {/* DAILY DETAILS TABLE */}
                        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
                           <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                              <h4 className="text-sm font-black text-gray-800 uppercase italic tracking-tight">Détails Journaliers : {calculReport.nomComplet}</h4>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[9px] font-black uppercase text-gray-400">Présent</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-[9px] font-black uppercase text-gray-400">Congé</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                    <span className="text-[9px] font-black uppercase text-gray-400">Retard</span>
                                 </div>
                              </div>
                           </div>
                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                    <tr>
                                       <th className="px-10 py-6">Date</th>
                                       <th className="px-10 py-6">Entrée</th>
                                       <th className="px-10 py-6">Sortie</th>
                                       <th className="px-10 py-6 text-center">Net Travail</th>
                                       <th className="px-10 py-6 text-center">Heures Sup</th>
                                       <th className="px-10 py-6 text-right">Statut</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y">
                                    {calculReport.dailyDetails.map((day: any, i: number) => (
                                       <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                          <td className="px-10 py-6 font-mono font-black text-xs text-gray-400 uppercase">
                                             {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                          </td>
                                          <td className="px-10 py-6 font-black text-xs text-gray-800">
                                             {day.entry}
                                          </td>
                                          <td className="px-10 py-6 font-black text-xs text-gray-800">
                                             {day.exit}
                                          </td>
                                          <td className="px-10 py-6 text-center">
                                             <span className="font-mono font-black text-sm text-blue-600">
                                                {day.hours > 0 ? `${day.hours}h` : '-'}
                                             </span>
                                          </td>
                                          <td className="px-10 py-6 text-center">
                                             <span className="font-mono font-black text-sm text-emerald-600">
                                                {day.overtime > 0 ? `+${day.overtime}h` : '-'}
                                             </span>
                                          </td>
                                          <td className="px-10 py-6 text-right">
                                             <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${day.status === 'OK' ? 'bg-emerald-50 text-emerald-600' :
                                                day.status === 'RETARD' ? 'bg-amber-50 text-amber-600' :
                                                   day.status === 'CONGE' ? 'bg-blue-50 text-blue-600' :
                                                      day.status === 'WEEKEND' ? 'bg-gray-50 text-gray-400' :
                                                         'bg-red-50 text-red-600'
                                                }`}>
                                                {day.status}
                                             </span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {activeTab === "stats" && (
               <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                  {/* HEADER */}
                  <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Reporting & Analytics</h3>
                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">Vision stratégique et pilotage de la dette sociale</p>
                     </div>
                     <button
                        onClick={fetchAnalytics}
                        title="Rafraîchir les données"
                        className="bg-white border-2 border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:rotate-180 duration-500"
                     >
                        <TrendingUp size={20} className="text-blue-600" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     {/* ABSENTEEISM TREND ENHANCED */}
                     <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl"></div>

                        <div className="flex items-center justify-between relative">
                           <div>
                              <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Taux d'Absentéisme Mensuel</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Analyse des tendances sur les 6 derniers mois</p>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
                                 <Activity size={12} />
                                 Sain & Stable
                              </span>
                              <span className="text-[8px] text-gray-300 font-bold uppercase mt-1">Objectif: &lt; 5%</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 relative">
                           <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Moyenne</p>
                              <p className="text-2xl font-black text-blue-600 italic">4.2%</p>
                           </div>
                           <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                              <p className="text-2xl font-black text-gray-800 italic">-{stats.absentCount} <span className="text-[10px]">pax</span></p>
                           </div>
                           <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Risque</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight mt-2">Faible</p>
                           </div>
                        </div>

                        <div className="h-48 flex items-end justify-between gap-4 px-4 relative pt-10">
                           {analyticsData && Object.entries(analyticsData.absenteeismTrend).map(([month, val]: any, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                 <div
                                    className={`w-full rounded-2xl transition-all duration-700 relative ${val > 5 ? 'bg-red-100 group-hover/bar:bg-red-500' : 'bg-blue-100 group-hover/bar:bg-blue-600'}`}
                                    style={{ height: `${val * 20}px` }}
                                 >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap shadow-xl">
                                       {val}% en {month}
                                    </div>
                                 </div>
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{month.substring(0, 3)}</span>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* LATENESS BY DEPT ENHANCED */}
                     <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden group">
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-3xl"></div>

                        <div className="flex items-center justify-between relative">
                           <div>
                              <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Volume de Retards</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Répartition par département (30 derniers jours)</p>
                           </div>
                           <div className="bg-amber-500/10 px-5 py-3 rounded-2xl flex items-center gap-3">
                              <span className="text-xl font-black text-amber-600 italic">
                                 {analyticsData?.latenessByDept ? Object.entries(analyticsData.latenessByDept).reduce((acc: number, entry: any) => acc + (Number(entry[1]) || 0), 0) : 0}
                              </span>
                              <span className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest leading-tight">Total<br />Volume</span>
                           </div>
                        </div>

                        <div className="space-y-8 relative">
                           {analyticsData?.latenessByDept && Object.entries(analyticsData.latenessByDept).map(([dept, count]: any, i) => {
                              const max = Math.max(...Object.values(analyticsData.latenessByDept || {}).map(v => Number(v) || 0), 1);
                              const pct = (count / max) * 100;
                              return (
                                 <div key={i} className="space-y-3 group/row">
                                    <div className="flex justify-between items-end">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-blue-500'}`}></div>
                                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight group-hover/row:text-gray-900 transition-colors">{dept}</span>
                                       </div>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-black text-gray-900">{count}</span>
                                          <span className="text-[8px] font-bold text-gray-400 uppercase">cas</span>
                                       </div>
                                    </div>
                                    <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden p-[2px] border border-gray-100/50">
                                       <div
                                          className={`h-full rounded-full transition-all duration-1000 relative ${i === 0
                                             ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                             : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                                          style={{ width: `${pct}%` }}
                                       >
                                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                       </div>
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     </div>
                  </div>

                  {/* TOP LEAVE BALANCES */}
                  <div className="bg-gray-900 rounded-[4rem] p-12 shadow-2xl space-y-10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>

                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md">
                              <TrendingUp size={32} />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Focus Dette Sociale : Top Soldes</h3>
                              <p className="text-gray-400 text-xs font-medium mt-1">Collaborateurs avec plus de 30 jours restants (Priorité de départ)</p>
                           </div>
                        </div>
                        <div className="relative">
                           <button
                              onClick={() => setShowExportMenu(!showExportMenu)}
                              className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg flex items-center gap-3 group"
                           >
                              Exporter pour Planification
                              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                           </button>

                           {showExportMenu && (
                              <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-[120] animate-in zoom-in-95 fade-in duration-200">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 border-b mb-2">Options d'exportation</p>

                                 <button
                                    onClick={() => handleExportPlanning()}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-xl flex items-center justify-between group transition-all"
                                 >
                                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-blue-600">Tous les collaborateurs</span>
                                    <Download size={12} className="text-gray-300 group-hover:text-blue-500" />
                                 </button>

                                 <div className="mt-2 pt-2 border-t max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest px-4 mb-2">Par Département</p>
                                    {allDepartments.map((dept: any) => (
                                       <button
                                          key={dept.idDept}
                                          onClick={() => handleExportPlanning(dept.nomDept)}
                                          className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all"
                                       >
                                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight group-hover:text-gray-800">{dept.nomDept}</span>
                                          <ChevronRight size={10} className="text-gray-200 group-hover:translate-x-1 transition-transform" />
                                       </button>
                                    ))}
                                 </div>

                                 <style jsx>{`
                                     .custom-scrollbar::-webkit-scrollbar {
                                        width: 4px;
                                     }
                                     .custom-scrollbar::-webkit-scrollbar-track {
                                        background: transparent;
                                     }
                                     .custom-scrollbar::-webkit-scrollbar-thumb {
                                        background: #e5e7eb;
                                        border-radius: 10px;
                                     }
                                     .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background: #d1d5db;
                                     }
                                  `}</style>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
                        {analyticsData?.topLeaveBalances.map((u: any, i: number) => (
                           <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-sm space-y-4 hover:bg-white/10 transition-all group">
                              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm">
                                 {u.soldeConges}
                              </div>
                              <div>
                                 <p className="text-white font-black uppercase text-xs leading-tight group-hover:text-blue-400 transition-colors">{u.nomComplet}</p>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{u.departement}</p>
                              </div>
                              <div className="pt-2">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Matricule: {u.matricule}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* Sync placeholder */}
            {activeTab === "sync" && (
               <div className="bg-white p-24 rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center gap-6 animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200">
                     <RefreshCw size={48} className="animate-spin-slow" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-300 italic uppercase">Module en cours de synchronisation</h3>
                  <p className="text-gray-400 text-sm font-medium max-w-sm">Nos équipes techniques finalisent l'intégration des flux de données pour ce module.</p>
               </div>
            )}

         </div>
      </div>
   );
}

function PresenceCard({ label, value, total, color, icon }: any) {
   const colorMap: any = {
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
      red: "bg-red-50 text-red-600 border-red-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
   };

   const progressColor: any = {
      emerald: "bg-emerald-500",
      red: "bg-red-500",
      amber: "bg-amber-500",
   };

   return (
      <div className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all">
         <div className="flex items-center justify-between">
            <div className={`p-4 rounded-2xl ${colorMap[color]}`}>
               {icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
         </div>
         <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <div className="mt-3 w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
               <div
                  className={`h-full ${progressColor[color]} transition-all duration-1000`}
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
               />
            </div>
         </div>
      </div>
   );
}
