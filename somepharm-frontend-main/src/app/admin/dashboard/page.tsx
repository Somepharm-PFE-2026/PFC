"use client";
import React, { useState, useEffect } from "react";
import { 
    Activity, ShieldCheck, Database, Server, 
    Users, Clock, AlertCircle, Terminal, 
    ArrowUpRight, Wifi, Cpu, HardDrive, RefreshCw,
    ShieldAlert, Globe, Radio, Power, Mail, 
    Key, Trash2, Save, Send, CheckCircle2, XCircle,
    Check, Copy
} from "lucide-react";

export default function AdminCockpit() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<string | null>(null);
    const [matriculeSearch, setMatriculeSearch] = useState("");
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [backupResult, setBackupResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchCockpitData();
    }, []);

    const fetchCockpitData = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/dashboard/cockpit", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const result = await res.json();
            setData(result.cockpit);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (action: string) => {
        setActionLoading(action);
        try {
            let endpoint = "";
            let method = "POST";
            let body = null;

            if (action === "backup") endpoint = "http://localhost:8080/api/dashboard/actions/backup";
            if (action === "purge") endpoint = "http://localhost:8080/api/dashboard/actions/purge-logs";
            if (action === "regenerate") {
                endpoint = `http://localhost:8080/api/utilisateurs/${matriculeSearch}/reset-password-super`;
                method = "PUT";
            }
            if (action === "resend") {
                endpoint = `http://localhost:8080/api/utilisateurs/${matriculeSearch}/resend-activation`;
                method = "POST";
            }

            const res = await fetch(endpoint, {
                method: method,
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const err = await res.json();
                setErrorMsg(err.message || "Une erreur est survenue lors de l'opération.");
                return;
            }

            const result = await res.json();
            setErrorMsg(null);
            
            if (action === "backup") {
                setBackupResult(result);
            }
            if (action === "regenerate" || action === "resend") {
                setTempPassword(result.temporary_password);
                // Trigger the email API for both cases
                await triggerEmailSend(result);
            }
            fetchCockpitData();
            if (action === "purge") setShowModal(null);
        } catch (e) {
            console.error(e);
            setErrorMsg("Une erreur critique est survenue.");
        } finally {
            setActionLoading(null);
        }
    };

    const triggerEmailSend = async (activationData: any) => {
        try {
            // 1. Fetch Email Config
            const configRes = await fetch("http://localhost:8080/api/dashboard/email-config", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const config = await configRes.json();

            // 2. Fetch User for Email address
            const userRes = await fetch(`http://localhost:8080/api/utilisateurs/me`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            // 2. Fetch User for Email address
            const targetUserRes = await fetch(`http://localhost:8080/api/utilisateurs/by-matricule/${activationData.matricule}`, {
                 headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const targetUser = await targetUserRes.json();

            // 3. Call Next.js Email API
            await fetch("/api/email/send", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: targetUser.email,
                    variables: {
                        PRENOM: targetUser.prenom,
                        NOM: targetUser.nom,
                        MATRICULE: activationData.matricule,
                        MOT_DE_PASSE_TEMPORAIRE: activationData.temporary_password
                    },
                    config: config
                })
            });
        } catch (e) { console.error("Email send trigger failed", e); }
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw size={48} className="animate-spin text-red-600" />
            </div>
        );
    }

    const passwordStats = data?.password_stats || { secured: 0, temporary: 0 };
    const totalActive = passwordStats.secured + passwordStats.temporary;
    const securedPct = totalActive > 0 ? (passwordStats.secured / totalActive) * 100 : 0;

    return (
        <div className="min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">System Overlord • Cockpit Active</span>
                    </div>
                    <h1 className="text-7xl font-black text-gray-950 tracking-tighter uppercase italic leading-[0.8] mb-4">
                        Le <span className="text-red-600">Cockpit</span>
                    </h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] ml-1">Tableau de bord de lecture instantanée et actions critiques</p>
                </div>
                <button onClick={fetchCockpitData} className="w-20 h-20 bg-gray-950 text-white rounded-[2rem] flex items-center justify-center hover:bg-red-600 hover:shadow-2xl transition-all active:scale-90 group">
                    <RefreshCw size={32} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"} />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* --- BLOC 1: SÉCURITÉ & ACCÈS --- */}
                <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Widget 1.1: Activations en Attente */}
                    <div 
                        onClick={() => window.location.href = "/admin/activation"}
                        className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden relative"
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <Users size={160} />
                        </div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Activations en Attente</h3>
                        <div className="flex items-baseline gap-4">
                            <span className={`text-8xl font-black italic tracking-tighter ${
                                data?.pending_activations > 5 ? "text-red-600" : 
                                data?.pending_activations > 0 ? "text-orange-500" : "text-gray-900"
                            }`}>
                                {data?.pending_activations}
                            </span>
                            <ArrowUpRight className="text-gray-200 group-hover:text-red-600 transition-colors" size={32} />
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Profils créés non activés</p>
                    </div>

                    {/* Widget 1.2: Statut des Mots de Passe */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm flex flex-col items-center justify-between">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-full text-left mb-6">Mots de Passe</h3>
                        
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f3f4f6" strokeWidth="4" />
                                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="4" 
                                    strokeDasharray={`${securedPct} ${100 - securedPct}`} strokeDashoffset="25" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-black italic">{Math.round(securedPct)}%</span>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 w-full text-[10px] font-black uppercase tracking-widest">
                            <div className="flex flex-col items-center">
                                <span className="text-green-500">{passwordStats.secured}</span>
                                <span className="text-gray-400">Sécurisés</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-orange-500">{passwordStats.temporary}</span>
                                <span className="text-gray-400">Temporaires</span>
                            </div>
                        </div>
                    </div>

                    {/* Widget 1.3: Alerte Sécurité */}
                    <div 
                        onClick={() => window.location.href = "/admin/audit"}
                        className={`rounded-[3rem] p-10 border shadow-sm transition-all cursor-pointer relative overflow-hidden group ${
                            data?.failed_logins_24h >= 10 ? "bg-red-600 border-red-700 animate-pulse" : "bg-white border-gray-100"
                        }`}
                    >
                        {data?.failed_logins_24h >= 10 && (
                            <div className="absolute inset-0 bg-red-600 flex items-center justify-center z-10">
                                <div className="text-center">
                                    <ShieldAlert size={48} className="text-white mx-auto mb-4 animate-bounce" />
                                    <p className="text-white font-black uppercase tracking-[0.2em]">Activité Suspecte Détectée</p>
                                    <p className="text-white/80 text-[10px] mt-2 font-bold uppercase">{data?.failed_logins_24h} TENTATIVES ÉCHOUÉES</p>
                                </div>
                            </div>
                        )}
                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-8 ${data?.failed_logins_24h >= 10 ? "text-white" : "text-gray-400"}`}>Tentatives Échouées (24h)</h3>
                        <div className="flex items-baseline gap-4">
                            <span className={`text-8xl font-black italic tracking-tighter ${
                                data?.failed_logins_24h >= 10 ? "text-white" : 
                                data?.failed_logins_24h >= 5 ? "text-orange-500" : "text-green-500"
                            }`}>
                                {data?.failed_logins_24h}
                            </span>
                            <ShieldAlert className={data?.failed_logins_24h >= 10 ? "text-white" : "text-gray-200"} size={32} />
                        </div>
                        <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest italic ${data?.failed_logins_24h >= 10 ? "text-white/80" : "text-gray-400"}`}>
                            {data?.failed_logins_24h >= 10 ? "Alerte de Sécurité Majeure" : "Activité de connexion normale"}
                        </p>
                    </div>

                    {/* --- BLOC 3: FLUX D'ACTIVITÉ --- */}
                    <div className="md:col-span-3 bg-gray-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Terminal size={300} />
                        </div>
                        
                        <div className="flex justify-between items-center mb-12 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-4">
                                    <Terminal className="text-red-600" size={32} />
                                    Boîte Noire Live
                                </h3>
                                <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">5 Dernières Actions Sensibles</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">QR Scans (Day)</p>
                                    <p className="text-xl font-black italic text-green-500">{data?.qr_scans_today?.valid} <span className="text-xs text-gray-600">/ {data?.qr_scans_today?.failed}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {data?.recent_audit?.map((log: any, i: number) => (
                                <div key={i} className="flex items-center gap-6 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
                                    onClick={() => window.location.href = "/admin/audit"}>
                                    <span className="text-[10px] font-black text-red-600/80 italic">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="w-px h-4 bg-white/10" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{log.role}</span>
                                    <span className="flex-1 text-[11px] font-bold text-gray-300 italic">
                                        {log.action} → <span className="text-white">{log.target}</span>
                                    </span>
                                    <ArrowUpRight size={14} className="text-white/20 group-hover:text-red-600 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- BLOC 2: SANTÉ DE L'INFRASTRUCTURE --- */}
                <div className="xl:col-span-4 space-y-8">
                    
                    {/* Status Services */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Statut des Services</h3>
                        <div className="space-y-6">
                            {[
                                { id: 'smtp', name: "Serveur Email (SMTP)", status: data?.services?.smtp, icon: Mail },
                                { id: 'pdf', name: "Générateur PDF", status: data?.services?.pdf_generator, icon: Globe },
                                { id: 'db', name: "Base de Données", status: data?.services?.database, icon: Database },
                                { id: 'api', name: "API Principale", status: data?.services?.api, icon: Cpu }
                            ].map((srv) => (
                                <div key={srv.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            srv.status === 'OPERATIONAL' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                            <srv.icon size={20} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase text-gray-900 italic tracking-tight">{srv.name}</span>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                        srv.status === 'OPERATIONAL' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                                    }`}>
                                        {srv.status === 'OPERATIONAL' ? 'Opérationnel' : 'Erreur'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {data?.services?.smtp !== 'OPERATIONAL' && (
                            <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex gap-4 items-start animate-bounce">
                                <AlertCircle size={20} className="text-red-600 mt-1" />
                                <div>
                                    <p className="text-[10px] font-black text-red-600 uppercase italic leading-tight">SMTP en Erreur</p>
                                    <p className="text-[10px] font-bold text-red-400 uppercase mt-1">Les emails automatiques d'activation ne sont plus envoyés.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uptime & Storage */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uptime du Mois</h3>
                                <span className="text-xl font-black italic text-green-600">{data?.uptime_percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data?.uptime_percentage}%` }} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stockage Documents</h3>
                                <span className={`text-xl font-black italic ${
                                    data?.storage?.percentage > 80 ? 'text-red-600' : 
                                    data?.storage?.percentage > 60 ? 'text-orange-500' : 'text-gray-900'
                                }`}>
                                    {data?.storage?.used_gb} / {data?.storage?.total_gb} GB
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div className={`h-full rounded-full transition-all duration-1000 ${
                                    data?.storage?.percentage > 80 ? 'bg-red-600' : 
                                    data?.storage?.percentage > 60 ? 'bg-orange-500' : 'bg-blue-500'
                                }`} style={{ width: `${data?.storage?.percentage}%` }} />
                            </div>
                            {data?.storage?.percentage > 80 && (
                                <p className="text-[9px] font-black text-red-600 uppercase italic animate-pulse">⚠️ Espace disque critique</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- BLOC 4: ACTIONS RAPIDES --- */}
                <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    <button 
                        onClick={() => setShowModal("backup")}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-48"
                    >
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Database size={24} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Backup Système</h4>
                            <p className="text-xl font-black text-gray-900 italic tracking-tight">Forcer un Backup</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowModal("purge")}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-red-200 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-48"
                    >
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Maintenance Logs</h4>
                            <p className="text-xl font-black text-gray-900 italic tracking-tight">Purger les Logs Anciens</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowModal("regenerate")}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-48"
                    >
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                            <Key size={24} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Accès Utilisateur</h4>
                            <p className="text-xl font-black text-gray-900 italic tracking-tight">Régénérer un MDP</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowModal("resend")}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-xl transition-all group text-left flex flex-col justify-between h-48"
                    >
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <Send size={24} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Support Activation</h4>
                            <p className="text-xl font-black text-gray-900 italic tracking-tight">Renvoyer l'Email</p>
                        </div>
                    </button>

                </div>

            </div>

            {/* --- MODALS --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
                    <div className="bg-white rounded-[4rem] p-16 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <AlertCircle size={200} />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4">
                                {showModal === "backup" ? "Forcer un Backup ?" : 
                                 showModal === "purge" ? "Purger les Archives ?" :
                                 showModal === "regenerate" ? "Régénérer Accès" : "Support Email"}
                            </h2>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-12 italic">
                                {showModal === "backup" ? "Une copie complète de la base de données sera créée." : 
                                 showModal === "purge" ? "Toutes les entrées de plus de 90 jours seront supprimées." :
                                 "Veuillez entrer le matricule du collaborateur concerné."}
                            </p>

                            {showModal === "backup" && backupResult && (
                                <div className="mb-12 p-10 bg-green-50 border border-green-100 rounded-[3rem] animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <p className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Sauvegarde Réussie</p>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic">Emplacement du fichier :</p>
                                        <div className="bg-white p-6 rounded-2xl border border-green-100 font-mono text-[11px] text-gray-600 break-all leading-relaxed shadow-sm">
                                            {backupResult.path}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(showModal === "regenerate" || showModal === "resend") && (
                                <div className="space-y-8 mb-12">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic">Matricule Employé</label>
                                        <input 
                                            type="text" 
                                            value={matriculeSearch}
                                            onChange={(e) => { 
                                                setMatriculeSearch(e.target.value); 
                                                setTempPassword(null); 
                                                setErrorMsg(null);
                                            }}
                                            placeholder="Ex: EMP-4505"
                                            className="w-full h-20 px-10 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-black italic focus:ring-4 focus:ring-red-500/10 focus:border-red-600 outline-none transition-all placeholder:text-gray-200"
                                        />
                                    </div>
                                    
                                    {errorMsg && (
                                        <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] flex items-center gap-6 animate-in shake-in-1 duration-500">
                                            <ShieldAlert size={32} className="text-amber-500" />
                                            <p className="text-[11px] font-black text-amber-700 uppercase tracking-tight italic">{errorMsg}</p>
                                        </div>
                                    )}

                                    {tempPassword && (
                                        <div className="p-10 bg-red-50 border border-red-100 rounded-[3rem] animate-in slide-in-from-top-4 relative group">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Nouveau Mot de Passe Temporaire :</p>
                                                    <p className="text-5xl font-black text-gray-900 tracking-tighter italic">{tempPassword}</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(tempPassword);
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="w-12 h-12 bg-white border border-red-100 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                >
                                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                            <div className="mt-8 pt-8 border-t border-red-100/50 flex items-center gap-4">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] italic">Email de notification envoyé avec succès 📧</p>
                                            </div>
                                            <p className="mt-6 text-[10px] font-bold text-red-400 uppercase leading-relaxed italic">
                                                Ce mot de passe est affiché en clair uniquement pour vous. <br />
                                                Le cycle "Force Change Password" a été réinitialisé.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-6">
                                <button 
                                    onClick={() => { 
                                        setShowModal(null); 
                                        setTempPassword(null); 
                                        setMatriculeSearch(""); 
                                        setBackupResult(null); 
                                        setErrorMsg(null);
                                    }}
                                    className="flex-1 h-20 bg-gray-50 text-gray-400 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    {backupResult ? "Fermer" : "Annuler"}
                                </button>
                                {!backupResult && (
                                    <button 
                                        onClick={() => handleAction(showModal)}
                                        disabled={actionLoading !== null || ((showModal === "regenerate" || showModal === "resend") && !matriculeSearch)}
                                        className={`flex-1 h-20 ${showModal === 'purge' ? 'bg-red-600' : 'bg-gray-950'} text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3`}
                                    >
                                        {actionLoading ? <RefreshCw className="animate-spin" size={20} /> : (
                                            showModal === "backup" ? "Confirmer le backup" : 
                                            showModal === "purge" ? "Confirmer la purge" : 
                                            showModal === "regenerate" ? "Générer Nouveau MDP" : "Renvoyer Activation"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
