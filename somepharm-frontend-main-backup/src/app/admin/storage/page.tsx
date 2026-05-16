"use client";
import React, { useState, useEffect } from "react";
import { 
    Database, HardDrive, RefreshCw, Download, 
    Trash2, ShieldAlert, CheckCircle2, AlertTriangle, 
    Cloud, Server, Clock, Save, FileArchive, 
    ChevronRight, Lock, Key, Mail, History
} from "lucide-react";

export default function BackupStoragePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<any>(null);

    // Config Modal States
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configForm, setConfigForm] = useState<any>({
        syncDestination: "NONE",
        s3Bucket: "",
        s3Region: "",
        s3AccessKey: "",
        s3SecretKey: ""
    });

    // Restore Flow States
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<any>(null);
    const [restoreStep, setRestoreStep] = useState(1); // 1: Password, 2: OTP, 3: Confirm Text
    const [otp, setOtp] = useState("");
    const [confirmText, setConfirmText] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/admin/storage", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const json = await res.json();
            setData(json);
            if (json.config) setConfigForm(json.config);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleManualBackup = async () => {
        if (!confirm("Déclencher une sauvegarde immédiate ?")) return;
        setActionLoading("backup");
        try {
            const res = await fetch("http://localhost:8080/api/admin/storage/backup", {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                setStatusMsg({ type: "success", text: "Sauvegarde SQL réussie !" });
                fetchData();
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handlePurgeTemp = async () => {
        if (!confirm(`Purger ${data?.temp_count} fichiers temporaires (${data?.temp_size_mb} MB) ?`)) return;
        setActionLoading("purge");
        try {
            const res = await fetch("http://localhost:8080/api/admin/storage/purge-temp", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                setStatusMsg({ type: "success", text: "Nettoyage terminé !" });
                fetchData();
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const initiateRestore = async (backup: any) => {
        setSelectedBackup(backup);
        setRestoreStep(1);
        setShowRestoreModal(true);
    };

    const handleSendOtp = async () => {
        setActionLoading("otp");
        try {
            // In real app, get admin email from profile. Here we mock admin email.
            const res = await fetch(`http://localhost:8080/api/admin/storage/restore/initiate/${selectedBackup.id}?email=admin@somepharm.com`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) setRestoreStep(2);
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleConfirmRestore = async () => {
        setActionLoading("restore");
        try {
            const res = await fetch(`http://localhost:8080/api/admin/storage/restore/confirm?code=${otp}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                setStatusMsg({ type: "success", text: "Restauration terminée. Le système redémarre." });
                setShowRestoreModal(false);
                fetchData();
            } else {
                alert("Code OTP invalide.");
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleSaveConfig = async () => {
        setActionLoading("config");
        try {
            const res = await fetch("http://localhost:8080/api/admin/storage/config", {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(configForm)
            });
            if (res.ok) {
                setStatusMsg({ type: "success", text: "Configuration Cloud enregistrée !" });
                setShowConfigModal(false);
                fetchData();
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleRestoreTest = async () => {
        setActionLoading("restore-test");
        try {
            const res = await fetch("http://localhost:8080/api/admin/storage/restore/test", {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                setStatusMsg({ type: "success", text: "Test de restauration réussi ! Fichiers valides." });
                fetchData();
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleDownload = async (backup: any) => {
        try {
            const response = await fetch(`http://localhost:8080/api/admin/storage/download/${backup.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error("Download failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = backup.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Error downloading backup:", error);
            alert("Erreur lors du téléchargement du fichier.");
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <RefreshCw className="animate-spin text-violet-600" size={40} />
        </div>
    );

    const breakdown = data?.breakdown || {};
    const categories = [
        { label: "Bulletins Paie", val: breakdown.bulletins_paie_gb, color: "#8B5CF6" },
        { label: "Justificatifs", val: breakdown.justificatifs_conges_gb, color: "#10B981" },
        { label: "Photos", val: breakdown.photos_profil_gb / 1024, color: "#F59E0B" },
        { label: "Logs", val: breakdown.logs_systeme_gb, color: "#6B7280" },
        { label: "Backups", val: breakdown.backups_sql_gb / 1024, color: "#A855F7" },
        { label: "Autres", val: breakdown.autres_gb, color: "#EAB308" }
    ];

    return (
        <div className="p-12 space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <Database size={20} />
                        </div>
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest italic">Node 5.2 • Infrastructure Persistence</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-950 tracking-tighter uppercase italic leading-none">
                        Backup & <span className="text-violet-600">Storage</span>
                    </h1>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-8 py-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Santé Synchro</p>
                            <p className={`text-xs font-black italic ${data?.config.syncStatus === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {data?.config.syncStatus === 'ACTIVE' ? 'SYNCHRONISÉ 🟢' : 'EN RETARD 🟡'}
                            </p>
                        </div>
                        <div className="w-px h-10 bg-gray-100" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernier Backup</p>
                            <p className="text-xs font-black text-gray-950 italic">Aujourd'hui, 02:00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TOP GRID: MONITORING --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. DISK JAUGE */}
                <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                    
                    <div className="flex justify-between items-start mb-12">
                        <h3 className="text-xl font-black text-gray-950 uppercase italic flex items-center gap-3">
                            <HardDrive className="text-violet-600" /> 2.1 Capacité Disque Globale
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">
                            Volume: /dev/sda1
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-4xl font-black italic text-gray-950 tracking-tighter">{data?.used_gb} GB <span className="text-gray-300 text-2xl">/ {data?.total_gb} GB</span></p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Espace utilisé ({data?.percentage_used}%)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black italic text-emerald-500 tracking-tighter">{data?.free_gb} GB</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Disponibles</p>
                            </div>
                        </div>

                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-1 border border-gray-200/50">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                                    data?.percentage_used > 80 ? 'bg-red-500' : data?.percentage_used > 60 ? 'bg-amber-500' : 'bg-violet-600'
                                }`}
                                style={{ width: `${data?.percentage_used}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {[0, 25, 50, 75, 100].map(v => (
                                <div key={v} className="text-[9px] font-black text-gray-300 uppercase tracking-widest border-l border-gray-100 pl-2">
                                    {v}%
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. DONUT BREAKDOWN */}
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col items-center">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] italic mb-10">Répartition Storage</h3>
                    
                    <div className="relative w-48 h-48 mb-10">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            {categories.reduce((acc: any, cat, i) => {
                                const total = categories.reduce((sum, c) => sum + (c.val || 0), 0);
                                const percentage = ((cat.val || 0) / (total || 1)) * 100;
                                const offset = acc.totalPerc;
                                acc.totalPerc += percentage;
                                acc.elements.push(
                                    <circle
                                        key={i}
                                        cx="18" cy="18" r="16"
                                        fill="transparent"
                                        stroke={cat.color}
                                        strokeWidth="4"
                                        strokeDasharray={`${percentage} ${100 - percentage}`}
                                        strokeDashoffset={-offset}
                                        className="transition-all duration-1000"
                                    />
                                );
                                return acc;
                            }, { totalPerc: 0, elements: [] }).elements}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black italic text-gray-950">{data?.percentage_used}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
                        {categories.map((cat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none">{cat.label}</p>
                                    <p className="text-[10px] font-bold text-gray-900 italic leading-none">{cat.val?.toFixed(1)} GB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MIDDLE GRID: BACKUPS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SNAPSHOTS HISTORY */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-black text-gray-950 uppercase italic flex items-center gap-3">
                            <History className="text-violet-600" /> Snapshots Récents
                        </h3>
                        <button 
                            onClick={handleManualBackup}
                            disabled={actionLoading === "backup"}
                            className="px-6 py-3 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-100 hover:bg-violet-700 transition active:scale-95 flex items-center gap-2"
                        >
                            {actionLoading === "backup" ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Backup Maintenant
                        </button>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                                    <th className="pb-4 px-2">Fichier SQL</th>
                                    <th className="pb-4 px-2">Date / Heure</th>
                                    <th className="pb-4 px-2 text-center">Intégrité</th>
                                    <th className="pb-4 px-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.snapshots?.map((s: any, i: number) => (
                                    <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                                                    <FileArchive size={16} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-gray-900">{s.filename}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.sizeMb} MB • {s.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-[10px] font-bold text-gray-500">
                                            {new Date(s.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-2 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                s.integrity === 'VALID' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {s.integrity === 'VALID' ? '✅ VALIDE' : '❌ CORROMPU'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleDownload(s)}
                                                    className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg transition"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => initiateRestore(s)}
                                                    className="px-3 py-1.5 bg-gray-950 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MAINTENANCE & PURGE */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform">
                            <Trash2 size={160} />
                        </div>
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-lg font-black text-gray-950 uppercase italic">3.1 Nettoyage Temporaire</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Caches PDF, Previews, Uploads échoués</p>
                            </div>
                            <div className="px-4 py-2 bg-amber-50 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-100">
                                {data?.temp_size_mb} MB à Libérer
                            </div>
                        </div>

                        <div className="space-y-6 relative">
                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <RefreshCw className="text-gray-400" size={24} />
                                    <div className="space-y-0.5">
                                        <p className="text-2xl font-black italic text-gray-950 tracking-tighter">{data?.temp_count}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fichiers Orphelins</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handlePurgeTemp}
                                    disabled={actionLoading === "purge"}
                                    className="px-8 py-4 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition active:scale-95 flex items-center gap-3"
                                >
                                    {actionLoading === "purge" ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Purger les Fichiers
                                </button>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic px-4">
                                ⚠️ Cette action supprime définitivement les fichiers temporaires de prévisualisation. Elle n'affecte jamais les données légales ou les bulletins de paie validés.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                        <div className="flex justify-between items-start mb-10">
                            <h3 className="text-lg font-black uppercase italic flex items-center gap-3">
                                <Cloud className="text-violet-500" /> 1B Synchronisation Cloud
                            </h3>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setShowConfigModal(true)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                                >
                                    <Lock size={14} />
                                </button>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                                    data?.config.syncStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {data?.config.syncDestination === 'NONE' ? 'DISCONNECTED' : `${data?.config.syncDestination} ${data?.config.syncStatus}`}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Destination</p>
                                    <div className="flex items-center gap-3">
                                        <Server size={20} className="text-violet-400" />
                                        <p className="text-xs font-black italic">
                                            {data?.config.syncDestination === 'AWS_S3' ? `Bucket: ${data?.config.s3Bucket || 'Non configuré'}` : 
                                             data?.config.syncDestination === 'NONE' ? 'Aucune destination' : `Target: ${data?.config.remoteAddress || 'IP Distante'}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Dernière Sync</p>
                                    <div className="flex items-center gap-3">
                                        <Clock size={20} className="text-violet-400" />
                                        <p className="text-xs font-black italic">
                                            {data?.config.lastSync ? new Date(data?.config.lastSync).toLocaleString() : 'Jamais synchronisé'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full h-16 bg-white text-black rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition shadow-2xl active:scale-95 italic">
                                Tester & Synchroniser Maintenant
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- INTEGRITY LAB SECTION (Maintenance instead of Danger) --- */}
            <div className="pt-12">
                <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-[4rem] p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <ShieldAlert className="text-indigo-600" size={140} />
                    </div>
                    
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-2xl font-black text-indigo-950 uppercase italic tracking-tighter">Infrastructure Integrity Lab</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-gray-900 uppercase italic">Protocole de Validation des Snapshots</h3>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed italic uppercase">
                                    Le lab de validation assure que vos fichiers SQL sont sains, complets et prêts à être déployés. 
                                    Ce test est non-destructif : il simule une reconstruction en environnement isolé pour certifier 
                                    votre plan de reprise d'activité (PRA).
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-end">
                                <div className="bg-white p-8 rounded-[3rem] border border-indigo-100 shadow-xl shadow-indigo-100/50 space-y-4 max-w-sm w-full">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest gap-8">
                                        <span className="text-gray-400 italic">Dernière Certification</span>
                                        <span className="text-indigo-600 whitespace-nowrap">
                                            {data?.config.lastSync ? new Date(data?.config.lastSync).toLocaleDateString() : 'JAMAIS CERTIFIÉ ⚠️'} ✅
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleRestoreTest}
                                        disabled={actionLoading === "restore-test"}
                                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition active:scale-95 italic flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                                    >
                                        {actionLoading === "restore-test" ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                                        Lancer le Protocole de Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RESTORE 2FA MODAL --- */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
                    <div className="bg-white rounded-[4rem] p-16 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-red-600" />
                        
                        <div className="space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-pulse">
                                    <ShieldAlert size={40} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-gray-950">Restauration Système</h2>
                                    <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.5em] mt-2">Niveau de Sécurité 01 : Alerte Critique</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Fichier Source :</p>
                                    <p className="text-2xl font-black italic text-gray-950 tracking-tighter">{selectedBackup.filename}</p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-2 italic">Sauvegarde du {new Date(selectedBackup.timestamp).toLocaleString()}</p>
                                </div>

                                {restoreStep === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                        <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Autorisation SUPER_ADMIN</label>
                                            <div className="flex items-center gap-4 bg-white border-2 border-gray-100 focus-within:border-red-500 rounded-2xl p-4 transition-all">
                                                <Lock className="text-gray-400" size={20} />
                                                <input 
                                                    type="password" placeholder="Mot de passe Admin" 
                                                    className="flex-1 bg-transparent font-black text-xs outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleSendOtp}
                                            disabled={actionLoading === "otp"}
                                            className="w-full h-24 bg-gray-950 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-4"
                                        >
                                            {actionLoading === "otp" ? <RefreshCw size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                                            Vérifier & Envoyer Code OTP
                                        </button>
                                    </div>
                                )}

                                {restoreStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-10">
                                        <div className="p-10 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 space-y-4">
                                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2 flex items-center gap-2">
                                                <Mail size={12} /> Code de confirmation envoyé
                                            </label>
                                            <div className="flex items-center gap-4 bg-white border-2 border-emerald-100 focus-within:border-emerald-500 rounded-2xl p-4 transition-all">
                                                <Key className="text-emerald-400" size={20} />
                                                <input 
                                                    type="text" maxLength={6} placeholder="Saisir le code à 6 chiffres" 
                                                    value={otp} onChange={e => setOtp(e.target.value)}
                                                    className="flex-1 bg-transparent font-black text-xl tracking-[1em] outline-none text-center"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setRestoreStep(3)}
                                            className="w-full h-24 bg-emerald-500 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-4"
                                        >
                                            Valider Authentification 2FA
                                        </button>
                                    </div>
                                )}

                                {restoreStep === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-10">
                                        <div className="p-10 bg-red-600 rounded-[2.5rem] text-white space-y-6">
                                            <p className="text-xs font-black uppercase tracking-widest text-center">Action Irréversible</p>
                                            <p className="text-[11px] font-bold text-red-100 leading-relaxed text-center italic">
                                                Pour confirmer le remplacement intégral de la base de données par ce snapshot, 
                                                veuillez saisir la phrase de sécurité ci-dessous :
                                            </p>
                                            <p className="text-xl font-black italic text-center tracking-widest uppercase">CONFIRMER RESTORE</p>
                                            <input 
                                                type="text" placeholder="Saisir ici..." 
                                                value={confirmText} onChange={e => setConfirmText(e.target.value)}
                                                className="w-full bg-black/20 border-2 border-white/20 focus:border-white rounded-2xl p-4 font-black text-xs outline-none text-center uppercase"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleConfirmRestore}
                                            disabled={confirmText !== "CONFIRMER RESTORE" || actionLoading === "restore"}
                                            className="w-full h-24 bg-gray-950 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4"
                                        >
                                            {actionLoading === "restore" ? <RefreshCw size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
                                            Démarrer Restauration Maintenant
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowRestoreModal(false)}
                                className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900 transition-all italic"
                            >
                                Annuler et Retourner au Monitoring
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CLOUD CONFIG MODAL --- */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                    <div className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white">
                                <Cloud size={24} />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase text-gray-950 tracking-tighter">Paramètres de Synchronisation</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Destination</label>
                                <select 
                                    value={configForm.syncDestination}
                                    onChange={e => setConfigForm({...configForm, syncDestination: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-xs outline-none focus:border-violet-600 transition-all appearance-none"
                                >
                                    <option value="NONE">AUCUNE (Désactivé)</option>
                                    <option value="AWS_S3">AWS S3 (Amazon Web Services)</option>
                                    <option value="NAS">NAS LOCAL (Network Storage)</option>
                                    <option value="FTP">FTP / SFTP DISTANT</option>
                                </select>
                            </div>

                            {configForm.syncDestination === 'AWS_S3' && (
                                <div className="space-y-4 animate-in slide-in-from-top-4">
                                    <input 
                                        type="text" placeholder="Bucket Name (ex: somepharm-backup)" 
                                        value={configForm.s3Bucket} onChange={e => setConfigForm({...configForm, s3Bucket: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-xs outline-none focus:border-violet-600 transition-all"
                                    />
                                    <input 
                                        type="text" placeholder="Region (ex: eu-west-3)" 
                                        value={configForm.s3Region} onChange={e => setConfigForm({...configForm, s3Region: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-xs outline-none focus:border-violet-600 transition-all"
                                    />
                                    <input 
                                        type="text" placeholder="Access Key ID" 
                                        value={configForm.s3AccessKey} onChange={e => setConfigForm({...configForm, s3AccessKey: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-xs outline-none focus:border-violet-600 transition-all"
                                    />
                                    <input 
                                        type="password" placeholder="Secret Access Key" 
                                        value={configForm.s3SecretKey} onChange={e => setConfigForm({...configForm, s3SecretKey: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-black text-xs outline-none focus:border-violet-600 transition-all"
                                    />
                                </div>
                            )}

                            <div className="pt-6 flex gap-4">
                                <button 
                                    onClick={() => setShowConfigModal(false)}
                                    className="flex-1 h-14 bg-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleSaveConfig}
                                    disabled={actionLoading === "config"}
                                    className="flex-1 h-14 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 transition flex items-center justify-center gap-2"
                                >
                                    {actionLoading === "config" ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STATUS TOAST --- */}
            {statusMsg && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-10 py-5 bg-gray-950 text-white rounded-[2.5rem] shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <span className="font-black uppercase tracking-widest text-[11px] italic">{statusMsg.text}</span>
                </div>
            )}
        </div>
    );
}
