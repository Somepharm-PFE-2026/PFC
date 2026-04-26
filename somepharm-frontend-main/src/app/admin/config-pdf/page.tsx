"use client";
import React, { useState, useEffect } from "react";
import { 
    FileText, Cpu, Type, HardDrive, AlertTriangle, 
    RefreshCw, Settings, Activity, Clock, 
    CheckCircle2, AlertCircle, Play, Info,
    FolderOpen, ShieldAlert, Terminal, Download,
    Search, Plus, Trash2, Check, ExternalLink
} from "lucide-react";

export default function PdfConfigPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Test QR state
    const [testQrData, setTestQrData] = useState<string | null>(null);
    const [testInfo, setTestInfo] = useState<any>(null);
    const [pathStatus, setPathStatus] = useState<any>(null);
    const [verifyingPaths, setVerifyingPaths] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showFontModal, setShowFontModal] = useState(false);
    const [purging, setPurging] = useState(false);
    
    // New Font form
    const [newFont, setNewFont] = useState({ name: "", style: "Regular" });
    const [fontFile, setFontFile] = useState<File | null>(null);
    
    // Form states
    const [engine, setEngine] = useState("PUPPETEER");
    const [timeout, setTimeoutSec] = useState(30);
    const [ram, setRam] = useState(512);
    const [concurrent, setConcurrent] = useState(3);
    const [defaultFont, setDefaultFont] = useState("Arial");
    const [retention, setRetention] = useState(12);

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
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-pdf", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setEngine(json.config.engine);
                setTimeoutSec(json.config.timeoutSeconds);
                setRam(json.config.ramAllocatedMb);
                setConcurrent(json.config.maxConcurrentJobs);
                setDefaultFont(json.config.defaultFont);
                setRetention(json.config.retentionPolicyMonths);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-pdf", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...data.config,
                    engine,
                    timeoutSeconds: timeout,
                    ramAllocatedMb: ram,
                    maxConcurrentJobs: concurrent,
                    defaultFont,
                    retentionPolicyMonths: retention
                })
            });
            if (res.ok) {
                await fetchData();
                setStatusMsg({ type: "success", text: "Paramètres du moteur PDF enregistrés !" });
            } else {
                setStatusMsg({ type: "error", text: "Erreur lors de l'enregistrement." });
            }
        } catch (err) { 
            console.error(err);
            setStatusMsg({ type: "error", text: "Serveur inaccessible." });
        }
        finally { setSaving(false); }
    };

    const handleVerifyPaths = async () => {
        setVerifyingPaths(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-pdf/verify-paths", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setPathStatus(await res.json());
                setStatusMsg({ type: "success", text: "Vérification des dossiers terminée !" });
            }
        } catch (err) { 
            console.error(err); 
            setStatusMsg({ type: "error", text: "Impossible de vérifier les dossiers." });
        }
        finally { setVerifyingPaths(false); }
    };

    const handleAddFont = async () => {
        if (!fontFile) return;
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("file", fontFile);
            formData.append("name", newFont.name);
            formData.append("style", newFont.style);

            const res = await fetch("http://localhost:8080/api/admin/config-pdf/fonts", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}` 
                },
                body: formData
            });
            if (res.ok) {
                setShowFontModal(false);
                setNewFont({ name: "", style: "Regular" });
                setFontFile(null);
                fetchData();
                setStatusMsg({ type: "success", text: "Nouvelle police ajoutée !" });
            }
        } catch (err) { console.error(err); }
    };

    const handlePurge = async () => {
        if (!confirm("Cette action est irréversible. Purger les fichiers anciens ?")) return;
        setPurging(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-pdf/purge", {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                fetchData();
                setStatusMsg({ type: "success", text: `${result.count} fichiers purgés avec succès !` });
            }
        } catch (err) { console.error(err); }
        finally { setPurging(false); }
    };

    const handleDeleteFont = async (id: number) => {
        if (!confirm("Supprimer cette police ?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/config-pdf/fonts/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                setStatusMsg({ type: "success", text: "Police supprimée." });
            }
        } catch (err) { console.error(err); }
    };

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-blue-400 font-black uppercase tracking-widest">Chargement du moteur PDF...</div>;

    return (
        <div className="max-w-[1400px] mx-auto p-10 space-y-12 animate-in fade-in duration-700">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 rotate-3">
                            <FileText size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Moteur PDF</h1>
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-16">Infrastructure technique & Rendu des documents</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-xl flex items-center gap-3 active:scale-95"
                >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Settings size={16} />}
                    Enregistrer les modifications
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* SECTION 1: MOTEUR DE RENDU */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                            <Cpu className="text-blue-600" /> 1. Moteur de Rendu
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {[
                                { id: "PUPPETEER", name: "Puppeteer", tech: "HTML → PDF", desc: "Templates riches & CSS complexe." },
                                { id: "PDFKIT", name: "PDFKit", tech: "Code → PDF", desc: "Documents simples & rapides." },
                                { id: "DOCX", name: "Docxtemplater", tech: "DOCX → PDF", desc: "Templates Word convertis." }
                            ].map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => setEngine(m.id)}
                                    className={`p-6 rounded-[2rem] border-2 text-left transition-all relative ${
                                        engine === m.id ? "border-blue-600 bg-blue-50/50" : "border-gray-50 hover:border-gray-200 bg-gray-50/30"
                                    }`}
                                >
                                    {engine === m.id && (
                                        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                            <Check size={14} />
                                        </div>
                                    )}
                                    <p className={`font-black uppercase tracking-widest text-[10px] mb-2 ${engine === m.id ? "text-blue-600" : "text-gray-400"}`}>{m.tech}</p>
                                    <h4 className="text-lg font-black text-gray-900 mb-1">{m.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{m.desc}</p>
                                </button>
                            ))}
                        </div>

                        {engine !== data?.config.engine && (
                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 mb-10 animate-in slide-in-from-left-4 duration-500">
                                <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                                    ⚠️ Changer de moteur peut affecter le rendu visuel de tous les templates existants. 
                                    Effectuez un test de rendu avant de valider en production.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">Timeout (secondes)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" min="10" max="120" step="10"
                                        value={timeout}
                                        onChange={(e) => setTimeoutSec(parseInt(e.target.value))}
                                        className="flex-1 accent-blue-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="w-12 text-center font-black text-blue-600 bg-blue-50 py-2 rounded-xl text-xs">{timeout}s</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">RAM Allouée (MB)</label>
                                <select 
                                    value={ram}
                                    onChange={(e) => setRam(parseInt(e.target.value))}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl p-4 font-black text-xs outline-none"
                                >
                                    <option value={256}>256 MB (Minimum)</option>
                                    <option value={512}>512 MB (Recommandé)</option>
                                    <option value={1024}>1024 MB (Performance)</option>
                                    <option value={2048}>2048 MB (Haute-Charge)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: GESTION DES POLICES */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                                <Type className="text-emerald-500" /> 2. Gestion des Polices
                            </h3>
                            <button 
                                onClick={() => setShowFontModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition active:scale-95"
                            >
                                <Plus size={16} /> Ajouter une police
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4 px-4 italic">Nom</th>
                                        <th className="pb-4 px-4 italic">Style</th>
                                        <th className="pb-4 px-4 italic">Fichier</th>
                                        <th className="pb-4 px-4 italic">Poids</th>
                                        <th className="pb-4 px-4 italic text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(data?.fonts?.length > 0 ? data.fonts : [
                                        { id: -1, name: "Amiri Regular", style: "Regular", fileName: "amiri-reg.ttf", sizeKb: 248, status: "LOADED" },
                                        { id: -2, name: "Tajawal Bold", style: "Bold", fileName: "tajawal-b.woff2", sizeKb: 180, status: "LOADED" },
                                        { id: -3, name: "Arial", style: "Regular", fileName: "arial.ttf", sizeKb: 120, status: "LOADED" }
                                    ]).map((f: any, i: number) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="py-5 px-4">
                                                <span className="text-xs font-black text-gray-900">{f.name}</span>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{f.style}</span>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="text-[10px] font-mono text-gray-400">{f.fileName}</span>
                                            </td>
                                            <td className="py-5 px-4 text-xs font-bold text-gray-500">
                                                {f.sizeKb} KB
                                            </td>
                                            <td className="py-5 px-4 text-right flex justify-end gap-3">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    {f.status}
                                                </span>
                                                <button 
                                                    onClick={() => handleDeleteFont(f.id)}
                                                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 4: MODE DEBUG */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                        <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-3">
                            <Terminal className="text-red-500" /> 4. Mode Debug (Logs Erreurs)
                        </h3>

                        <div className="space-y-4">
                            {data?.errors?.map((err: any, i: number) => (
                                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/[0.08] transition group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-xs uppercase tracking-wider">{err.errorCode}</h4>
                                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{formatTime(err.timestamp)} • {err.documentType} • {err.matricule}</p>
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition">Voir stack trace</button>
                                    </div>
                                    <p className="text-gray-400 text-[11px] leading-relaxed font-medium">
                                        {err.probableCause}
                                    </p>
                                </div>
                            ))}
                            {data?.errors?.length === 0 && (
                                <div className="text-center py-10">
                                    <CheckCircle2 className="mx-auto text-emerald-500 mb-4 opacity-20" size={48} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Aucune erreur détectée</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="lg:col-span-4 space-y-10">
                    
                    {/* TEST PANEL */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 text-center space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
                        <div className="text-left">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                                <Play className="text-blue-600" /> Test Moteur
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Valider le rendu technique</p>
                        </div>

                        <div className="aspect-square bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex items-center justify-center relative group">
                            <div className="flex flex-col items-center gap-4 text-gray-300">
                                <RefreshCw size={64} className={testing ? "animate-spin text-blue-500" : ""} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{testing ? "Génération..." : "Moteur Prêt"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={async () => {
                                setTesting(true);
                                try {
                                    const token = localStorage.getItem("token");
                                    // 1. Trigger generation metadata
                                    const res = await fetch("http://localhost:8080/api/admin/config-pdf/test-engine", {
                                        method: "POST",
                                        headers: { "Authorization": `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                        const result = await res.json();
                                        setStatusMsg({ type: "success", text: `PDF de test généré en ${result.generation_time_ms}ms !` });
                                        
                                        // 2. Actually download the file using fetch to pass headers
                                        const downloadRes = await fetch("http://localhost:8080/api/admin/config-pdf/download-test", {
                                            headers: { "Authorization": `Bearer ${token}` }
                                        });
                                        if (downloadRes.ok) {
                                            const blob = await downloadRes.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = "test-diagnostic.pdf";
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                        }
                                    }
                                } catch (err) { 
                                    console.error(err); 
                                    setStatusMsg({ type: "error", text: "Échec de la génération du test." });
                                }
                                finally { setTesting(false); }
                            }}
                            disabled={testing}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Download size={16} /> Générer un PDF de Test
                        </button>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                                Teste le moteur {engine} avec des données fictives.
                            </p>
                        </div>
                    </div>

                    {/* STORAGE STATUS */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] -mr-32 -mb-32" />
                        <h3 className="text-lg font-black uppercase italic mb-8 tracking-tighter">Stockage PDF</h3>
                        
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Espace utilisé</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black tracking-tighter text-emerald-500">{data?.storage?.used_gb || 0}</span>
                                        <span className="text-lg font-black text-gray-600 italic">GB</span>
                                    </div>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                        style={{ width: `${data?.storage?.percentage || 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    <span>{data?.storage?.percentage || 0}% de 20GB</span>
                                    <span className="text-emerald-500">Statut Optimal</span>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-white/5 pt-8">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block ml-2">Politique de Rétention</label>
                                <select 
                                    value={retention}
                                    onChange={(e) => setRetention(parseInt(e.target.value))}
                                    className="w-full bg-white/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-black text-xs outline-none text-white appearance-none"
                                >
                                    <option value={6} className="bg-gray-900">6 Mois</option>
                                    <option value={12} className="bg-gray-900">1 An</option>
                                    <option value={24} className="bg-gray-900">2 Ans</option>
                                    <option value={0} className="bg-gray-900">Illimité</option>
                                </select>
                                <button 
                                    onClick={handlePurge}
                                    disabled={purging}
                                    className="w-full py-4 text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-300 transition flex items-center justify-center gap-2"
                                >
                                    {purging && <RefreshCw size={12} className="animate-spin" />}
                                    Purger les fichiers anciens
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FOLDERS CONFIG */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                            <FolderOpen className="text-amber-500" /> Dossiers Serveur
                        </h3>
                        <div className="space-y-6">
                            {[
                                { key: "paie", label: "Bulletins de Paie", path: data?.config?.pathPaie },
                                { key: "attestations", label: "Attestations", path: data?.config?.pathAttestations },
                                { key: "fonts", label: "Polices (Fonts)", path: data?.config?.pathFonts }
                            ].map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{p.label}</span>
                                        {pathStatus && (
                                            pathStatus[p.key] ? <CheckCircle2 size={12} className="text-emerald-500" /> : <AlertCircle size={12} className="text-red-500" />
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[10px] font-mono text-gray-500 truncate">
                                        {p.path}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={handleVerifyPaths}
                                disabled={verifyingPaths}
                                className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-blue-200 hover:text-blue-500 transition flex items-center justify-center gap-2"
                            >
                                {verifyingPaths ? <RefreshCw size={14} className="animate-spin" /> : <FolderOpen size={14} />}
                                {verifyingPaths ? "Vérification..." : "Vérifier tous les accès"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SUCCESS TOAST --- */}
            {statusMsg && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-8 py-4 rounded-[2rem] shadow-2xl border animate-in slide-in-from-bottom-10 duration-500 ${
                    statusMsg.type === "success" 
                        ? "bg-emerald-500 border-emerald-400 text-white" 
                        : "bg-red-600 border-red-500 text-white"
                }`}>
                    {statusMsg.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-black uppercase tracking-widest text-xs italic">{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} className="ml-4 opacity-50 hover:opacity-100"><RefreshCw size={14} /></button>
                </div>
            )}

            {/* --- ADD FONT MODAL --- */}
            {showFontModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowFontModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                            <Plus className="text-emerald-500" /> Ajouter une Police
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2 mb-2">Nom de la police</label>
                                <input 
                                    type="text" value={newFont.name} onChange={e => setNewFont({...newFont, name: e.target.value})}
                                    placeholder="Ex: Tajawal Bold"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-black text-xs outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2 mb-2">Fichier de police (.ttf / .woff2)</label>
                                <div className="relative group/upload">
                                    <input 
                                        type="file" 
                                        accept=".ttf,.woff2"
                                        onChange={e => setFontFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center gap-2 ${
                                        fontFile ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 group-hover/upload:border-emerald-300 group-hover/upload:bg-gray-50"
                                    }`}>
                                        <Plus className={fontFile ? "text-emerald-500" : "text-gray-300"} size={24} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${fontFile ? "text-emerald-600" : "text-gray-400"}`}>
                                            {fontFile ? fontFile.name : "Cliquez ou glissez le fichier"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2 mb-2">Style</label>
                                <select 
                                    value={newFont.style} onChange={e => setNewFont({...newFont, style: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-black text-xs outline-none"
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Bold">Bold</option>
                                    <option value="Italic">Italic</option>
                                    <option value="Bold Italic">Bold Italic</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleAddFont}
                                disabled={!fontFile || !newFont.name}
                                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                Enregistrer et Uploader
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
