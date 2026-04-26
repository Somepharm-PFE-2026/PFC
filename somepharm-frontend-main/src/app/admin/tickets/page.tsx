"use client";

import React, { useState, useEffect } from "react";
import { 
  Ticket, Search, Filter, Clock, CheckCircle2, 
  AlertTriangle, ShieldAlert, Key, Mail, 
  Copy, Check, X, ArrowRight, UserCircle, 
  Building2, MapPin, History, ShieldCheck,
  Hash, Calendar, Send, ExternalLink, Activity
} from "lucide-react";

export default function TicketsResetPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>({ pending: 0, waiting_employee: 0, resolved_today: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Treatment Modal State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // History Modal State
  const [historyUser, setHistoryUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8080/api/admin/tickets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        setCounters(data.counters);
      }
    } catch (err) { console.error("Fetch failed", err); }
    finally { setLoading(false); }
  };

  const handleProcessTicket = async (id: number) => {
    setIsProcessing(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/admin/tickets/${id}/process`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ channel: "COPIER_COLLER" })
      });
      if (response.ok) {
        const data = await response.json();
        // Support both snake_case and camelCase from backend
        const pass = data.temporary_password || data.temporaryPassword;
        setTempPassword(pass);
        fetchData(); // Refresh list to update the 'selectedTicket' object in the background
      } else {
        const errData = await response.json().catch(() => ({ message: "Erreur serveur" }));
        alert("Erreur: " + (errData.message || response.statusText));
      }
    } catch (err: any) { 
      console.error(err); 
      alert("Erreur de connexion au serveur");
    }
    finally { setIsProcessing(false); }
  };

  const handleFinalizeTicket = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/admin/tickets/${id}/finalize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setSelectedTicket(null);
        setTempPassword(null);
        setEmailSent(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async (matricule: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/admin/tickets/history/${matricule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setHistoryUser(await response.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleSendEmail = async (id: number, password: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/admin/tickets/${id}/send-email`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        const errData = await response.json().catch(() => ({ message: "Erreur SMTP" }));
        alert("Échec de l'envoi : " + (errData.message || "Vérifiez votre configuration SMTP dans l'onglet 4.1"));
      }
    } catch (err: any) { 
        console.error(err); 
        alert("Erreur de connexion au service d'email");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriority = (submittedAt: string) => {
    const diff = (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
    return diff > 2 ? "URGENT" : "NORMAL";
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.utilisateur.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.utilisateur.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.utilisateur.matricule.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || getPriority(t.submittedAt) === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="min-h-screen space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* --- HEADER & COUNTERS --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[3px] bg-purple-500 rounded-full" />
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.5em] italic">Identity Support Center</span>
          </div>
          <h1 className="text-7xl font-black text-gray-950 tracking-tighter uppercase italic leading-[0.8] mb-2">
            Reset <span className="text-purple-600">Tickets</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Flux exclusif SUPER_ADMIN • Helpdesk Sécurisé</p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
          {[
            { label: "Tickets Ouverts", value: counters.pending, icon: Ticket, color: "text-red-500", bg: "bg-red-50" },
            { label: "En attente Employé", value: counters.waiting_employee, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Traités Aujourd'hui", value: counters.resolved_today, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
          ].map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col items-center gap-2 min-w-[160px]">
              <div className={`${c.bg} ${c.color} p-3 rounded-2xl`}>
                <c.icon size={20} />
              </div>
              <span className="text-3xl font-black text-gray-950 italic">{c.value}</span>
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest text-center">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- FILTERS TOOLBAR --- */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors z-10" size={24} />
          <input 
            type="text" 
            placeholder="Filtrer par matricule ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full h-20 bg-white border border-gray-100 rounded-[2rem] pl-20 pr-10 text-lg font-bold italic text-gray-950 focus:ring-8 focus:ring-purple-600/5 focus:border-purple-600 transition-all outline-none z-10"
          />
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="h-20 px-8 bg-white border border-gray-100 rounded-[2rem] font-black uppercase text-[10px] tracking-widest outline-none focus:border-purple-600 transition-all"
           >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En Attente</option>
              <option value="ENVOYÉ">Envoyé</option>
              <option value="EN_ATTENTE_EMPLOYÉ">En attente employé</option>
              <option value="SÉCURISÉ">Sécurisé</option>
           </select>

           <select 
             value={priorityFilter}
             onChange={(e) => setPriorityFilter(e.target.value)}
             className="h-20 px-8 bg-white border border-gray-100 rounded-[2rem] font-black uppercase text-[10px] tracking-widest outline-none focus:border-purple-600 transition-all"
           >
              <option value="ALL">Priorité: Toutes</option>
              <option value="URGENT">Urgents (🔴)</option>
              <option value="NORMAL">Normaux (🟢)</option>
           </select>
        </div>
      </div>

      {/* --- MAIN TABLE --- */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Priorité</th>
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Collaborateur</th>
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Structure</th>
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Soumission</th>
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Statut</th>
              <th className="px-10 py-8 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] italic text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTickets.map((t) => {
              const priority = getPriority(t.submittedAt);
              return (
                <tr key={t.idTicket} className="hover:bg-gray-50/80 transition-all group">
                  <td className="px-10 py-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl w-fit ${priority === 'URGENT' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      <div className={`w-2 h-2 rounded-full ${priority === 'URGENT' ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} />
                      <span className="text-[10px] font-black tracking-widest">{priority}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900 uppercase italic tracking-tight">{t.utilisateur.nom} {t.utilisateur.prenom}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.utilisateur.matricule}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Building2 size={12} className="text-purple-600" />
                        <span className="text-[11px] font-bold uppercase">{t.utilisateur.departement || "Dép. Inconnu"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={12} />
                        <span className="text-[10px] font-medium uppercase tracking-widest">{t.utilisateur.site?.nomSite || "Site Central"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-[11px] font-black text-gray-950 uppercase tracking-widest">
                      {new Date(t.submittedAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase">
                      à {new Date(t.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-10 py-8">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => fetchHistory(t.utilisateur.matricule)}
                        className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-950 hover:text-white transition-all shadow-inner"
                      >
                        <History size={18} />
                      </button>
                      {t.status === "EN_ATTENTE" ? (
                        <button 
                          onClick={() => { setSelectedTicket(t); setTempPassword(null); }}
                          className="h-12 px-6 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-950 hover:shadow-2xl transition-all flex items-center gap-3"
                        >
                          <Activity size={16} /> Gérer
                        </button>
                      ) : (t.status === "ENVOYÉ" || t.status === "EN_ATTENTE_EMPLOYÉ") && (
                        <button 
                          onClick={() => { setSelectedTicket(t); setTempPassword(t.temporaryPassword); }}
                          className="h-12 px-6 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:shadow-2xl transition-all flex items-center gap-3"
                        >
                          <Key size={16} /> Voir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredTickets.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center p-32 space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
              <Ticket size={48} />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-950 uppercase italic tracking-tighter">Aucun ticket détecté</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Votre file d&apos;attente est actuellement vide</p>
            </div>
          </div>
        )}
      </div>

      {/* --- TREATMENT MODAL --- */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] p-16 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="flex justify-between items-start mb-12 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-purple-600" size={24} />
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em] italic">Security Guard-Rail</span>
                </div>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gray-950 leading-none">
                  {selectedTicket.status === 'EN_ATTENTE' ? 'Traitement' : 'Détails'} <span className="text-purple-600">Ticket</span>
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase">TKT-{selectedTicket.idTicket}</span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initié le {new Date(selectedTicket.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!tempPassword || confirm("Un mot de passe a été généré. Voulez-vous vraiment annuler ?")) {
                    setSelectedTicket(null);
                    setTempPassword(null);
                  }
                }} 
                className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <X size={32} />
              </button>
            </div>

            <div className="space-y-10 relative z-10">
              {/* Profile Card */}
              <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 flex items-center gap-6">
                 <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-purple-600 border border-gray-100">
                    <UserCircle size={40} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-gray-950 uppercase italic tracking-tighter leading-none">{selectedTicket.utilisateur.nom} {selectedTicket.utilisateur.prenom}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest">{selectedTicket.utilisateur.matricule}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{selectedTicket.utilisateur.email}</span>
                    </div>
                 </div>
              </div>

              {((selectedTicket.status === 'EN_ATTENTE' || !selectedTicket.temporaryPassword) && !tempPassword) ? (
                <button 
                  onClick={() => handleProcessTicket(selectedTicket.idTicket)}
                  disabled={isProcessing}
                  className="w-full h-24 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-purple-600 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Key size={24} className="group-hover:rotate-45 transition-transform" />
                      {selectedTicket.status === 'EN_ATTENTE' ? 'Générer Mot de Passe' : 'Régénérer (Token Manquant)'}
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-6 italic">Token de Connexion Temporaire</label>
                    <div className="bg-gray-950 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative group overflow-hidden border border-white/10">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-6xl font-black text-white tracking-[0.2em] italic relative z-10 selection:bg-purple-600/40">
                        {tempPassword || selectedTicket.temporaryPassword || selectedTicket.temporary_password || "TOKEN_EXPIRED"}
                      </span>
                      <div className="flex items-center gap-2 mt-6 relative z-10">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          {(!tempPassword && !selectedTicket.temporaryPassword) ? "Archive Indisponible (Ancien Ticket)" : (selectedTicket.status === 'EN_ATTENTE' ? 'Généré avec succès • Chiffrement Nucleus-X' : 'Token Actif • En attente Employee')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => copyToClipboard(tempPassword || selectedTicket.temporaryPassword || selectedTicket.temporary_password || "")}
                      className="h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] flex items-center justify-center gap-4 hover:border-purple-600 group transition-all"
                    >
                      {copied ? <Check className="text-emerald-500" /> : <Copy className="text-gray-400 group-hover:text-purple-600" />}
                      <span className={`text-[11px] font-black uppercase tracking-widest ${copied ? 'text-emerald-500' : 'text-gray-500 group-hover:text-purple-600'}`}>
                        {copied ? 'Copié !' : 'Copier Token'}
                      </span>
                    </button>
                    <button 
                      onClick={() => handleSendEmail(selectedTicket.idTicket, tempPassword || selectedTicket.temporaryPassword || selectedTicket.temporary_password || "")}
                      className="h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] flex items-center justify-center gap-4 hover:border-purple-600 group transition-all"
                    >
                      <Mail className={`text-gray-400 group-hover:text-purple-600 ${emailSent ? 'text-emerald-500' : ''}`} />
                      <span className={`text-[11px] font-black uppercase tracking-widest ${emailSent ? 'text-emerald-500' : 'text-gray-500 group-hover:text-purple-600'}`}>
                        {emailSent ? 'Email Transmis !' : 'Envoyer par Email'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col gap-4">
                     <div className="flex gap-4">
                       <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                       <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-tight italic">
                         ⚠️ Ce mot de passe est temporaire et à usage unique. Dès sa première saisie, l&apos;employé sera automatiquement redirigé vers l&apos;écran de modification obligatoire.
                       </p>
                     </div>
                     <button 
                       onClick={() => handleProcessTicket(selectedTicket.idTicket)}
                       className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-all flex items-center gap-2 self-end"
                     >
                       <Activity size={14} /> Régénérer un nouveau token
                     </button>
                  </div>

                  {selectedTicket.status === 'EN_ATTENTE' && (
                    <button 
                      onClick={() => handleFinalizeTicket(selectedTicket.idTicket)}
                      className="w-full h-24 bg-purple-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-gray-950 transition-all shadow-[0_20px_50px_rgba(147,51,234,0.3)] flex items-center justify-center gap-4"
                    >
                      Marquer comme Traité & Fermer
                      <ArrowRight size={24} />
                    </button>
                  )}
                  {selectedTicket.status !== 'EN_ATTENTE' && (
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="w-full h-20 bg-gray-950 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 transition-all flex items-center justify-center"
                    >
                      Fermer la vue
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY / LOG MODAL --- */}
      {historyUser && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-8">
           <div className="bg-white rounded-[4rem] p-16 max-w-3xl w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[85vh] overflow-y-auto no-scrollbar relative">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="text-gray-400" size={20} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">Identity Log Viewer</span>
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase text-gray-950 leading-none">Historique <span className="text-purple-600">Résilience</span></h2>
                  <p className="text-[11px] font-bold text-gray-400 uppercase mt-2">{historyUser.full_name} ({historyUser.matricule})</p>
                </div>
                <button onClick={() => setHistoryUser(null)} className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              {historyUser.alert && (
                <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-8 mb-10 flex items-center gap-6 animate-pulse">
                   <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                      <ShieldAlert size={32} />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-red-600 uppercase italic tracking-tighter">Comportement Suspect Détecté</h4>
                      <p className="text-xs font-bold text-red-900 uppercase tracking-widest mt-1">{historyUser.alert_message}</p>
                   </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic">Chronologie des Incidents ({historyUser.total_resets})</span>
                  <div className="h-[1px] flex-1 bg-gray-100 mx-8" />
                </div>

                <div className="space-y-4">
                  {historyUser.history.map((h: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldCheck size={100} />
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ticket ID</span>
                            <p className="text-lg font-black text-gray-950 italic">TKT-{h.idTicket}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Canal Transmission</span>
                             <div className="flex items-center justify-end gap-2 text-purple-600">
                                {h.channel === 'EMAIL' ? <Mail size={14} /> : <Copy size={14} />}
                                <span className="text-[10px] font-black uppercase">{h.channel || 'COPIER_COLLER'}</span>
                             </div>
                          </div>
                          
                          <div className="col-span-2 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/50">
                             <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Demande</span>
                                <p className="text-[11px] font-bold text-gray-700">{new Date(h.submittedAt).toLocaleString()}</p>
                             </div>
                             <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Traitement</span>
                                <p className="text-[11px] font-bold text-gray-700">{h.processedAt ? new Date(h.processedAt).toLocaleString() : '---'}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">Sécurisé</span>
                                <p className="text-[11px] font-bold text-emerald-600">{h.securedAt ? new Date(h.securedAt).toLocaleString() : 'En attente...'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}

                  {historyUser.history.length === 0 && (
                    <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucun historique archivé</p>
                  )}
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                 <button onClick={() => setHistoryUser(null)} className="h-16 px-12 bg-gray-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-purple-600 transition-all">
                    Fermer les archives
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    EN_ATTENTE: { label: "En Attente", color: "bg-orange-50 text-orange-600 border-orange-100", icon: Clock },
    ENVOYÉ: { label: "Envoyé", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Send },
    EN_ATTENTE_EMPLOYÉ: { label: "⏳ En attente employé", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Clock },
    SÉCURISÉ: { label: "✅ Sécurisé", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: ShieldCheck }
  };

  const config = configs[status] || configs.EN_ATTENTE;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border w-fit ${config.color}`}>
      <Icon size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  );
}
