"use client";
import React, { useState, useEffect } from "react";
import { FileSearch, LogIn, Search, Filter, ShieldCheck, AlertCircle, Clock, Terminal } from "lucide-react";

export default function AuditTrailPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"AUDIT" | "CONNECTION">("AUDIT");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchLogs();
    }, [activeTab]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === "AUDIT" ? "audit" : "connections";
            const res = await fetch(`http://localhost:8080/api/admin/logs/${endpoint}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            setLogs(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic mb-2">Audit & Traçabilité</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Journal immuable des actions sensibles</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-[2rem] border border-gray-100 shadow-sm">
                    <button 
                        onClick={() => setActiveTab("AUDIT")}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "AUDIT" ? "bg-gray-950 text-white shadow-lg shadow-gray-900/20" : "text-gray-400 hover:text-gray-950"}`}
                    >
                        Audit Trail
                    </button>
                    <button 
                        onClick={() => setActiveTab("CONNECTION")}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "CONNECTION" ? "bg-gray-950 text-white shadow-lg shadow-gray-900/20" : "text-gray-400 hover:text-gray-950"}`}
                    >
                        Logs Connexion
                    </button>
                </div>
            </div>

            {/* --- SEARCH & FILTERS --- */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par auteur, matricule ou action..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 bg-white border border-gray-100 rounded-[2.5rem] text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-gray-950/5 transition-all"
                    />
                </div>
                <button className="px-8 py-6 bg-white border border-gray-100 rounded-[2.5rem] text-gray-400 flex items-center gap-3 hover:text-gray-950 transition-all shadow-sm group">
                    <Filter size={20} className="group-hover:rotate-180 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
                </button>
            </div>

            {/* --- LOGS LIST --- */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-20 text-center bg-white rounded-[3rem] border border-gray-100 italic font-bold text-gray-400 animate-pulse">
                        Synchronisation de la boîte noire...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[3rem] border border-gray-100 italic font-bold text-gray-400">
                        Aucun log enregistré dans cette catégorie.
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={log.idLog || log.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-8 hover:shadow-xl hover:border-gray-200 transition-all group overflow-hidden relative">
                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center shrink-0">
                                {activeTab === "AUDIT" ? <FileSearch size={20} /> : <LogIn size={20} />}
                            </div>
                            
                            <div className="w-32 shrink-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Clock size={10} />
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs font-black text-gray-950">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${log.result === "SUCCESS" ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                                        {log.result || log.typeAction}
                                    </span>
                                    <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight">
                                        {log.description || (activeTab === "CONNECTION" ? "Tentative de connexion" : log.typeAction)}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[8px] font-black text-gray-400 italic">
                                            {log.auteur?.[0] || log.matricule?.[0]}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                            {log.auteur || log.matricule}
                                        </span>
                                    </div>
                                    {log.role && (
                                        <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest italic">{log.role}</span>
                                    )}
                                    {log.ipAddress && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-tight">
                                            <Terminal size={10} />
                                            {log.ipAddress}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0">
                                <button className="p-4 text-gray-300 hover:text-gray-950 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                    Détails JSON
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
