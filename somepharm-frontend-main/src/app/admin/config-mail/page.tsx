"use client";
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { 
    Mail, Server, ShieldCheck, Save, Send, 
    Variable, RefreshCw, AlertCircle, CheckCircle2,
    Info, Layout, Globe, Key, Trash2
} from "lucide-react";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const VARIABLES = [
    { label: "Prénom", key: "PRENOM" },
    { label: "Nom", key: "NOM" },
    { label: "Matricule", key: "MATRICULE" },
    { label: "MDP Temporaire", key: "MOT_DE_PASSE_TEMPORAIRE" },
    { label: "Lien Connexion", key: "URL_CONNEXION" },
    { label: "Entreprise", key: "NOM_ENTREPRISE" }
];

export default function ConfigMailPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testLoading, setTestLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("template"); // 'template' or 'smtp'

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/dashboard/email-config", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            setConfig(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("http://localhost:8080/api/dashboard/email-config", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert("Configuration sauvegardée !");
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleTestSend = async () => {
        if (!testEmail) return;
        setTestLoading(true);
        try {
            const res = await fetch("/api/email/send", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: testEmail,
                    variables: {
                        PRENOM: "Test",
                        NOM: "Utilisateur",
                        MATRICULE: "EMP-TEST",
                        MOT_DE_PASSE_TEMPORAIRE: "Pass123!"
                    },
                    config: config
                })
            });
            if (res.ok) alert("Email de test envoyé !");
            else alert("Erreur lors de l'envoi du test.");
        } catch (e) { console.error(e); }
        finally { setTestLoading(false); }
    };

    const insertVariable = (variable: string) => {
        // Simple append for now, in real scenario we'd insert at cursor
        setConfig({ ...config, welcomeEmailBody: config.welcomeEmailBody + ` {{${variable}}}` });
    };

    if (loading && !config) {
        return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-red-600" /></div>;
    }

    return (
        <div className="min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* HEADER */}
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] italic">Service Mail • Configuration Système</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-950 tracking-tighter uppercase italic leading-[0.8] mb-4">
                        Service <span className="text-blue-600">Mail</span>
                    </h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] ml-1">Personnalisation des emails automatiques et configuration SMTP</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="h-20 px-12 bg-gray-950 text-white rounded-[2rem] flex items-center gap-4 hover:bg-blue-600 hover:shadow-2xl transition-all active:scale-95 group"
                >
                    {saving ? <RefreshCw className="animate-spin" /> : <Save size={24} />}
                    <span className="text-xs font-black uppercase tracking-widest">Enregistrer les modifications</span>
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-4 bg-white p-3 rounded-[2.5rem] border border-gray-100 w-fit">
                <button 
                    onClick={() => setActiveTab("template")}
                    className={`px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'template' ? 'bg-gray-950 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Layout size={18} /> Template d'Email
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab("smtp")}
                    className={`px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'smtp' ? 'bg-gray-950 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Server size={18} /> Configuration SMTP
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {activeTab === 'template' ? (
                    <>
                        {/* EDITOR */}
                        <div className="xl:col-span-8 space-y-8">
                            <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 italic">Objet de l'Email</label>
                                    <input 
                                        type="text" 
                                        value={config?.welcomeEmailSubject}
                                        onChange={(e) => setConfig({ ...config, welcomeEmailSubject: e.target.value })}
                                        className="w-full h-20 px-10 bg-gray-50 border border-gray-100 rounded-[2rem] text-xl font-black italic focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Corps du Message</label>
                                        <div className="flex gap-2">
                                            {VARIABLES.map((v) => (
                                                <button 
                                                    key={v.key}
                                                    onClick={() => insertVariable(v.key)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                                >
                                                    +{v.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border border-gray-100 rounded-[3rem] overflow-hidden bg-gray-50">
                                        <ReactQuill 
                                            theme="snow"
                                            value={config?.welcomeEmailBody}
                                            onChange={(val) => setConfig({ ...config, welcomeEmailBody: val })}
                                            className="h-[400px] mb-12"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PREVIEW & TEST */}
                        <div className="xl:col-span-4 space-y-8">
                            <div className="bg-gray-950 rounded-[4rem] p-12 text-white shadow-2xl space-y-10">
                                <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-4">
                                    <Send className="text-blue-500" size={32} />
                                    Test d'Envoi
                                </h3>
                                <p className="text-gray-500 font-bold text-[9px] uppercase tracking-[0.3em] italic">Envoyez une simulation de l'email automatique à votre adresse pour validation visuelle.</p>
                                
                                <div className="space-y-4">
                                    <input 
                                        type="email" 
                                        placeholder="votre@email.com"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        className="w-full h-16 px-8 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                    />
                                    <button 
                                        onClick={handleTestSend}
                                        disabled={testLoading || !testEmail}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50"
                                    >
                                        {testLoading ? <RefreshCw className="animate-spin mx-auto" /> : "Envoyer l'Email de Test"}
                                    </button>
                                </div>

                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <Info size={14} /> Variables Disponibles
                                    </h4>
                                    <div className="space-y-3">
                                        {VARIABLES.map((v) => (
                                            <div key={v.key} className="flex justify-between text-[10px] font-bold italic">
                                                <span className="text-gray-500">{v.label}</span>
                                                <span className="text-blue-400">{"{{" + v.key + "}}"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="xl:col-span-12">
                        <div className="bg-white rounded-[4rem] p-16 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-4 text-gray-900">
                                        <Globe className="text-blue-600" size={32} />
                                        Paramètres Serveur
                                    </h3>
                                    <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.3em] italic">Configuration du relai SMTP pour l'expédition des courriels.</p>
                                </div>

                                <div className="grid grid-cols-4 gap-6">
                                    <div className="col-span-3 space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Host SMTP</label>
                                        <input 
                                            type="text" 
                                            placeholder="smtp.example.com"
                                            value={config?.smtpHost}
                                            onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                                            className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Port</label>
                                        <input 
                                            type="number" 
                                            placeholder="587"
                                            value={config?.smtpPort}
                                            onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                                            className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black uppercase text-gray-900 italic tracking-tight">Utiliser SSL / TLS</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Recommandé pour la sécurité (Port 465/587).</p>
                                    </div>
                                    <button 
                                        onClick={() => setConfig({ ...config, smtpSecure: !config.smtpSecure })}
                                        className={`w-16 h-8 rounded-full transition-all relative ${config?.smtpSecure ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config?.smtpSecure ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-4 text-gray-900">
                                        <Key className="text-blue-600" size={32} />
                                        Authentification
                                    </h3>
                                    <p className="text-gray-400 font-bold text-[9px] uppercase tracking-[0.3em] italic">Identifiants du compte d'expédition.</p>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Nom d'utilisateur (Email)</label>
                                        <input 
                                            type="text" 
                                            placeholder="no-reply@entreprise.com"
                                            value={config?.smtpUser}
                                            onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                                            className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Mot de Passe</label>
                                        <input 
                                            type="password" 
                                            placeholder="••••••••••••"
                                            value={config?.smtpPass}
                                            onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                                            className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex gap-6 items-start">
                                    <ShieldCheck size={24} className="text-blue-600 mt-1" />
                                    <div>
                                        <p className="text-[11px] font-black text-blue-900 uppercase italic">Sécurité des Identifiants</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase mt-1 leading-relaxed">Les mots de passe SMTP sont chiffrés en base de données. Ne partagez jamais ces accès.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
