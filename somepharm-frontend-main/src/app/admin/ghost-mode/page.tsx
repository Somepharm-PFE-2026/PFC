"use client";
import React, { useState, useEffect } from "react";
import { UserSecret, Search, Eye, AlertCircle, ShieldAlert, Loader2, Fingerprint, Crosshair, Radar } from "lucide-react";

export default function GhostModePage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/admin/monitoring/profiles", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleGhostStart = async (matricule: string) => {
        alert(`SESSION GHOST : Initialisation pour ${matricule}...\nRestrictions : Lecture seule [ACTIF], Audit nucleus [ACTIF].`);
    };

    const filteredUsers = users.filter(u => 
        u.matricule?.toLowerCase().includes(search.toLowerCase()) ||
        u.nom?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            {/* --- TOP HUD --- */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">Stealth Module • Mode Fantôme</span>
                    </div>
                    <h1 className="text-7xl font-black text-gray-950 tracking-tighter uppercase italic leading-[0.8] mb-4">
                        Ghost <span className="text-red-600">Mode</span>
                    </h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] ml-1 italic">Impersonnification Sécurisée & Debug Interface</p>
                </div>
                <div className="hidden lg:flex flex-col items-end gap-3 p-8 bg-red-50 border border-red-100 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center gap-3 text-red-600">
                        <ShieldAlert size={20} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Zéro-Trace Mutation</span>
                    </div>
                    <p className="text-[9px] font-bold text-red-900/60 uppercase text-right max-w-[200px] leading-relaxed">
                        Toutes les actions effectuées en mode Ghost sont enregistrées par le noyau de sécurité.
                    </p>
                </div>
            </div>

            {/* --- TACTICAL SEARCH --- */}
            <div className="relative group">
                <div className="absolute inset-0 bg-red-600 blur-3xl opacity-0 group-focus-within:opacity-10 transition-opacity duration-1000" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-4 text-gray-400 group-focus-within:text-red-600 transition-colors">
                    <Radar size={32} className="animate-spin-slow" />
                    <div className="w-px h-8 bg-gray-200 group-focus-within:bg-red-200" />
                </div>
                <input 
                    type="text" 
                    placeholder="Scanner matricule ou identité cible..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-28 pr-12 py-12 bg-white border border-gray-100 rounded-[3.5rem] text-2xl font-black italic shadow-sm focus:ring-8 focus:ring-red-500/5 outline-none transition-all placeholder:text-gray-200"
                />
            </div>

            {/* --- TARGET CLUSTER --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {loading ? (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center gap-6">
                        <Loader2 size={64} className="text-red-600 animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">Mapping Identity Lattice...</p>
                    </div>
                ) : filteredUsers.slice(0, 12).map((user) => (
                    <div key={user.idUser} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-red-600/20 transition-all duration-700 group relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 p-8 text-gray-50 -mr-4 -mt-4 group-hover:text-red-50/50 transition-colors">
                            <Fingerprint size={120} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:bg-gray-950 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-inner">
                                <UserSecret size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic leading-tight mb-2">{user.nom} {user.prenom}</h3>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-10">{user.matricule}</p>
                            
                            <button 
                                onClick={() => handleGhostStart(user.matricule)}
                                className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white hover:shadow-xl hover:shadow-red-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
                            >
                                <Crosshair size={18} className="group-hover/btn:scale-125 transition-transform" />
                                Infiltrer Session
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- SECURITY DIRECTIVES --- */}
            <div className="bg-gray-950 p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-red-600 rounded-full blur-[120px] -mr-[20rem] -mt-[20rem] opacity-20" />
                
                <div className="flex items-center gap-6 mb-16 relative">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Directives de Sécurité</h2>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mt-1">Protocole d'Usage Interne Uniquement</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                    {[
                        { id: "01", title: "Non-Mutation Nucleus", text: "Le système désactive les méthodes HTTP mutables (POST, PUT, DELETE) durant toute la session fantôme." },
                        { id: "02", title: "Journalisation Audit Trail", text: "Chaque seconde de la session est auditée. L'identité réelle du Super Admin est liée à l'impersonnification." },
                        { id: "03", title: "Confidentialité Absolue", text: "Ce mode est réservé au support technique. L'accès aux données personnelles reste régi par le RGPD." }
                    ].map((rule) => (
                        <div key={rule.id} className="space-y-6 group/item">
                            <div className="text-5xl font-black text-white/10 group-hover/item:text-red-500/20 transition-colors font-mono italic leading-none">{rule.id}</div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight text-white">{rule.title}</h4>
                            <p className="text-sm text-gray-400 font-bold leading-relaxed italic opacity-80 group-hover/item:opacity-100 transition-opacity">
                                {rule.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
