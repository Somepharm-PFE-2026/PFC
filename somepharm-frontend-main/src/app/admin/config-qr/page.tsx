"use client";
import React, { useState, useEffect } from "react";
import { 
    ShieldCheck, Key, Timer, Zap, AlertTriangle, 
    RefreshCw, Settings, Activity, Clock, 
    CheckCircle2, AlertCircle, Play, Info,
    Eye, EyeOff
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function QrConfigPage() {
    const [config, setConfig] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [testing, setTesting] = useState(false);
    
    // Form states
    const [saltInput, setSaltInput] = useState("");
    const [showSalt, setShowSalt] = useState(false);
    const [ttlInput, setTtlInput] = useState(300);
    const [alertMargin, setAlertMargin] = useState(600);
    const [algorithm, setAlgorithm] = useState("HMAC-SHA256");
    const [expiryBehavior, setExpiryBehavior] = useState("REJETER");
    const [eclLevel, setEclLevel] = useState("Q");
    
    // Test QR state
    const [testQrData, setTestQrData] = useState<string | null>(null);
    const [testInfo, setTestInfo] = useState<any>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [resConfig, resStats] = await Promise.all([
                fetch("http://localhost:8080/api/admin/config-qr", {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch("http://localhost:8080/api/admin/config-qr/stats", {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);

            if (resConfig.ok) {
                const data = await resConfig.json();
                setConfig(data);
                setTtlInput(data.ttlSeconds);
                setAlertMargin(data.maxAlertMarginSeconds || 600);
                setAlgorithm(data.algorithm);
                setExpiryBehavior(data.expiryBehavior);
                setEclLevel(data.eclLevel);
            }
            if (resStats.ok) setStats(await resStats.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSaveGlobal = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-qr", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ttlSeconds: ttlInput,
                    maxAlertMarginSeconds: alertMargin,
                    algorithm,
                    expiryBehavior,
                    eclLevel,
                    saltSecret: "" // Backend doesn't update salt via this endpoint
                })
            });
            if (res.ok) {
                fetchData();
                setStatusMsg({ type: 'success', text: "Paramètres enregistrés avec succès !" });
                setTimeout(() => setStatusMsg(null), 5000);
            } else {
                setStatusMsg({ type: 'error', text: "Erreur lors de la sauvegarde." });
            }
        } catch (err) { 
            console.error(err); 
            setStatusMsg({ type: 'error', text: "Erreur de connexion au serveur." });
        }
        finally { setSaving(false); }
    };

    const handleGenerateSalt = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-qr/generate-key", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSaltInput(data.key);
                setShowSalt(true);
            }
        } catch (err) { console.error(err); }
    };

    const handleRotateKey = async () => {
        if (!confirm("⚠️ ATTENTION : Toute modification de la clé invalide IMMÉDIATEMENT tous les QR Codes actuellement actifs. Confirmer la rotation ?")) return;
        
        setRotating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-qr/rotate-key", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ newKey: saltInput })
            });
            if (res.ok) {
                setSaltInput("");
                fetchData();
            }
        } catch (err) { console.error(err); }
        finally { setRotating(false); }
    };

    const handleTestEngine = async () => {
        setTesting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/admin/config-qr/test-engine", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const info = await res.json();
                setTestInfo(info);
                const testPayload = JSON.stringify({
                    matricule: "TEST-ADMIN",
                    type: "TEST_ENGINE",
                    expires_at: Math.floor(Date.now() / 1000) + 60,
                    note: "SUPER_ADMIN_DIAGNOSTIC"
                });
                setTestQrData(testPayload);
                setStatusMsg({ type: 'success', text: "QR de test généré !" });
                setTimeout(() => setStatusMsg(null), 3000);
            } else {
                setStatusMsg({ type: 'error', text: "Le moteur QR ne répond pas." });
            }
        } catch (err) { 
            console.error(err); 
            setStatusMsg({ type: 'error', text: "Échec de la génération." });
        }
        finally { setTesting(false); }
    };

    const formatSeconds = (s: number) => {
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${m} minute${m > 1 ? 's' : ''} ${rem > 0 ? rem + ' seconde' + (rem > 1 ? 's' : '') : ''}`;
    };

    const getEclLabel = (level: string) => {
        switch(level) {
            case 'L': return { label: "Faible", tolerance: "7%", desc: "Idéal pour écrans nets." };
            case 'M': return { label: "Moyen", tolerance: "15%", desc: "Usage bureautique standard." };
            case 'Q': return { label: "Quartile", tolerance: "25%", desc: "Recommandé pour agents terrain." };
            case 'H': return { label: "Haut", tolerance: "30%", desc: "Conditions extrêmes (soleil, rayures)." };
            default: return { label: "-", tolerance: "-", desc: "-" };
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Initialisation du moteur QR...</div>;

    return (
        <div className="max-w-[1400px] mx-auto p-10 space-y-12 animate-in fade-in duration-700">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100 rotate-3">
                            <RefreshCw size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Moteur QR Code</h1>
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-16">Configuration technique & Sécurité de pointage</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleSaveGlobal}
                        disabled={saving}
                        className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-xl flex items-center gap-3 active:scale-95"
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Settings size={16} />}
                        Enregistrer les modifications
                    </button>
                </div>
            </div>

            {/* --- STATUS TOAST --- */}
            {statusMsg && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500 border ${
                    statusMsg.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'
                }`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-xs font-black uppercase tracking-widest">{statusMsg.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* --- LEFT COLUMN: CONFIG --- */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* SECTION 1: SÉCURITÉ */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-40" />
                        <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                            <ShieldCheck className="text-red-600" /> 1. Sécurité & Cryptage
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">Clé de Sel (Salt Secret)</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1 group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                            <Key size={20} />
                                        </div>
                                        <input 
                                            type={showSalt ? "text" : "password"}
                                            value={saltInput}
                                            onChange={(e) => setSaltInput(e.target.value)}
                                            placeholder={config?.salt_defined ? "••••••••••••••••••••••••••••••••" : "Entrez une clé de 32+ caractères"}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-5 pl-14 pr-14 font-mono font-bold text-gray-900 transition-all outline-none"
                                        />
                                        <button 
                                            onClick={() => setShowSalt(!showSalt)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSalt ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleGenerateSalt}
                                        className="p-5 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl hover:text-red-600 hover:border-red-100 transition shadow-sm active:scale-95"
                                        title="Générer aléatoirement"
                                    >
                                        <RefreshCw size={24} />
                                    </button>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                    <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={18} />
                                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                                        ⚠️ Toute modification de la clé invalide IMMÉDIATEMENT tous les QR Codes actuellement actifs. Les employés en sortie devront rescanner.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleRotateKey}
                                    disabled={rotating || saltInput.length < 32}
                                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-100 hover:bg-red-700 transition active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                                >
                                    {rotating ? "Application de la rotation..." : "Appliquer la rotation de la clé"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">Algorithme de Signature</label>
                                    <select 
                                        value={algorithm}
                                        onChange={(e) => setAlgorithm(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-2xl p-5 font-black text-xs uppercase tracking-widest outline-none appearance-none"
                                    >
                                        <option value="HMAC-SHA256">HMAC-SHA256 (Recommandé)</option>
                                        <option value="HMAC-SHA512">HMAC-SHA512 (Ultra-Sécurisé)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 font-bold ml-2">L'algorithme signe le contenu pour empêcher toute falsification.</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-2">Comportement à l'Expiration</label>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-2xl">
                                        <button 
                                            onClick={() => setExpiryBehavior("REJETER")}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expiryBehavior === "REJETER" ? "bg-white text-red-600 shadow-sm" : "text-gray-400"}`}
                                        >
                                            REJETER
                                        </button>
                                        <button 
                                            onClick={() => setExpiryBehavior("ALERTER")}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expiryBehavior === "ALERTER" ? "bg-white text-amber-600 shadow-sm" : "text-gray-400"}`}
                                        >
                                            ALERTER
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold ml-2">Définit l'action système lors d'un scan tardif.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 & 3: TTL & ECL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                                <Timer className="text-blue-500" /> 2. Durée de Vie (TTL)
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <input 
                                        type="range" min="60" max="1800" step="60"
                                        value={ttlInput}
                                        onChange={(e) => setTtlInput(parseInt(e.target.value))}
                                        className="w-full accent-blue-600 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                        <span>60s</span>
                                        <span>900s</span>
                                        <span>1800s</span>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-6 rounded-[2rem] text-center border border-blue-100">
                                    <span className="text-4xl font-black text-blue-600 tracking-tighter">{ttlInput}s</span>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-2">
                                        = {formatSeconds(ttlInput)}
                                    </p>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                    Détermine combien de temps le QR reste scannable après sa génération.
                                </p>
                            </div>

                            {/* HARD LIMIT FOR ALERT MODE */}
                            {expiryBehavior === "ALERTER" && (
                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                            <AlertCircle size={14} /> Marge d'Alerte Max (Hard Limit)
                                        </h4>
                                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black">{alertMargin}s</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="3600" step="60"
                                        value={alertMargin}
                                        onChange={(e) => setAlertMargin(parseInt(e.target.value))}
                                        className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <p className="text-[9px] text-amber-700/50 font-bold leading-relaxed uppercase tracking-tight">
                                        Même en mode "ALERTER", tout QR dépassant cette marge (+{formatSeconds(alertMargin)}) sera <span className="text-red-600 underline">REJETÉ</span>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                                <Zap className="text-yellow-500" /> 3. Sensibilité Scan
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded-2xl">
                                    {['L', 'M', 'Q', 'H'].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setEclLevel(lvl)}
                                            className={`py-3 rounded-xl text-lg font-black transition-all ${eclLevel === lvl ? "bg-white text-gray-900 shadow-sm" : "text-gray-300"}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Niveau {eclLevel}</span>
                                        <span className="text-[10px] font-black text-green-600">Tolérance : {getEclLabel(eclLevel).tolerance}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                                        {getEclLabel(eclLevel).desc}
                                    </p>
                                </div>
                                {eclLevel === 'H' && (
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <Info size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Génère des codes plus denses</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4.2: TABLEAU LOGS */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 flex items-center gap-3">
                            <Activity className="text-emerald-500" /> Dernières Générations
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4 px-4 italic">Timestamp</th>
                                        <th className="pb-4 px-4 italic">Employé</th>
                                        <th className="pb-4 px-4 italic text-center">ECL</th>
                                        <th className="pb-4 px-4 italic text-right">Latence</th>
                                        <th className="pb-4 px-4 italic text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats?.generation_logs?.map((log: any, i: number) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="py-4 px-4 text-xs font-black text-gray-800">
                                                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600">
                                                        {log.matricule.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900">{log.matricule}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded-lg">{log.ecl_level}</span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono text-xs text-gray-500">
                                                {log.generation_time_ms}ms
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                    log.final_status === 'CLOTURE' ? 'bg-green-50 text-green-600' :
                                                    log.final_status === 'EN_COURS' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {log.final_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: STATS & TEST --- */}
                <div className="lg:col-span-4 space-y-10">
                    
                    {/* INDICATEURS RÉEL */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <h3 className="text-lg font-black uppercase italic mb-8 tracking-tighter">Performance Moteur</h3>
                        
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">Latence Moyenne (24h)</span>
                                    <span className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${
                                        stats?.stats_24h?.average_response_ms < 200 ? 'bg-green-500 shadow-green-500/50' : 
                                        stats?.stats_24h?.average_response_ms < 500 ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-red-500 shadow-red-500/50'
                                    }`} />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black tracking-tighter">{stats?.stats_24h?.average_response_ms || 0}</span>
                                    <span className="text-xl font-black text-gray-600 italic">ms</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Générés</p>
                                    <p className="text-2xl font-black tracking-tight">{stats?.stats_24h?.total_generated || 0}</p>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Pertes</p>
                                    <p className="text-2xl font-black tracking-tight text-red-500">{stats?.stats_24h?.expired_unscanned || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TEST ENGINE */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 text-center space-y-8">
                        <div className="text-left mb-6">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                                <Play className="text-red-600" /> Test Moteur
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Générer un QR de diagnostic</p>
                        </div>

                        <div className="aspect-square bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group">
                            {testQrData ? (
                                <div className="p-8 bg-white rounded-3xl shadow-inner">
                                    <QRCodeCanvas 
                                        value={testQrData} 
                                        size={256}
                                        level={eclLevel as any}
                                        includeMargin={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-gray-300">
                                    <RefreshCw size={64} className={testing ? "animate-spin" : ""} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Moteur Prêt</span>
                                </div>
                            )}
                            {testing && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {testInfo && (
                            <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 text-left animate-in zoom-in duration-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle2 className="text-green-600" size={18} />
                                    <span className="text-xs font-black text-green-700 uppercase italic">Génération Réussie</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-green-600/70">
                                    <div>Latence : {testInfo.generation_time_ms}ms</div>
                                    <div>TTL Test : 60s</div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleTestEngine}
                            disabled={testing}
                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-red-600 hover:shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-4"
                        >
                            {testing ? "Traitement..." : "Générer un Scan de Test"}
                        </button>

                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                            Le QR de test expire après 60s et n'est pas lié à un employé.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
