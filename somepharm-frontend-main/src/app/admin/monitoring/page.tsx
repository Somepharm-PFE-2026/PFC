"use client";
import React, { useState, useEffect } from "react";
import { 
    Activity, Key, ShieldCheck, AlertTriangle, 
    Search, RefreshCw, Lock, Unlock, Mail, 
    ShieldAlert, Terminal, Eye, Copy, CheckCircle2,
    XCircle, Shield, Users
} from "lucide-react";

export default function MonitoringPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/utilisateurs/monitoring/profiles", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (matricule: string, type: 'reset' | 'activate') => {
        setActionLoading(matricule);
        try {
            const endpoint = type === 'reset' 
                ? `http://localhost:8080/api/utilisateurs/${matricule}/reset-password-super`
                : `http://localhost:8080/api/utilisateurs/${matricule}/resend-activation`;
            
            const method = type === 'reset' ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (res.ok) {
                const result = await res.json();
                setSuccessModal({ ...result, type });
                fetchUsers();
            }
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleConsult = (user: any) => {
        setSuccessModal({
            matricule: user.matricule,
            temporary_password: user.temporaryPassword,
            type: 'consult'
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "ACTIF": return { bg: "bg-green-500/10 text-green-400 border-green-500/20", label: "ACTIF", pulse: true };
            case "EN_ATTENTE_PREMIERE_CONNEXION": return { bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "EN ATTENTE", pulse: false };
            case "INACTIF": return { bg: "bg-red-500/10 text-red-400 border-red-500/20", label: "INACTIF", pulse: false };
            default: return { bg: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: status, pulse: false };
        }
    };

    const getPasswordStyle = (status: string) => {
        switch (status) {
            case "MODIFIE": return { bg: "text-blue-400", label: "SÉCURISÉ ✅", icon: ShieldCheck };
            case "TEMPORAIRE": return { bg: "text-orange-400", label: "TEMPORAIRE 🔑", icon: Key };
            default: return { bg: "text-gray-600", label: "N/A", icon: Lock };
        }
    };

    const filteredUsers = users.filter(u => 
        u.matricule?.toLowerCase().includes(search.toLowerCase()) ||
        u.nom?.toLowerCase().includes(search.toLowerCase()) || 
        u.prenom?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white p-12 space-y-12 animate-in fade-in duration-1000">
            {/* --- CYBER HEADER --- */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Terminal className="text-red-600 animate-pulse" size={24} />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">Security Node: 0x8842 • Monitoring Active</span>
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none">
                        Password <span className="text-red-600">Monitoring</span>
                    </h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] ml-1">Surveillance temps-réel de l'intégrité des accès</p>
                </div>
                
                <div className="flex gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/5 blur-xl group-focus-within:bg-red-600/10 transition-all" />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                        <input 
                            type="text" 
                            placeholder="RECHERCHE MATRICULE..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="relative pl-16 pr-8 h-20 bg-white/5 border border-white/10 rounded-[2rem] w-96 text-lg font-black italic focus:ring-4 focus:ring-red-600/10 focus:border-red-600/50 outline-none transition-all placeholder:text-gray-700"
                        />
                    </div>
                    <button onClick={fetchUsers} className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90 group">
                        <RefreshCw size={28} className={loading ? "animate-spin text-red-600" : "group-hover:rotate-180 transition-transform duration-700"} />
                    </button>
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: "Total Profils", val: users.length, icon: Users, color: "text-white" },
                    { label: "Non Sécurisés", val: users.filter(u => u.passwordStatus === "TEMPORAIRE").length, icon: AlertTriangle, color: "text-orange-500" },
                    { label: "Comptes Sécurisés", val: users.filter(u => u.passwordStatus === "MODIFIE").length, icon: ShieldCheck, color: "text-green-500" },
                    { label: "Attente Activation", val: users.filter(u => u.statutCompte === "EN_ATTENTE_PREMIERE_CONNEXION").length, icon: Mail, color: "text-blue-500" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <stat.icon size={120} />
                        </div>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">{stat.label}</h3>
                        <p className={`text-6xl font-black italic tracking-tighter ${stat.color}`}>{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* --- CYBER TABLE --- */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[4rem] overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                            <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">ID Node</th>
                            <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Entity</th>
                            <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Service Status</th>
                            <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Access Layer</th>
                            <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 text-right">Overrides</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {filteredUsers.map((user) => {
                            const status = getStatusStyle(user.statutCompte);
                            const pwd = getPasswordStyle(user.passwordStatus);
                            return (
                                <tr key={user.idUser} className="hover:bg-white/[0.03] transition-all group">
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:animate-ping" />
                                            <span className="font-black text-white tracking-widest font-mono text-sm uppercase italic">
                                                {user.matricule || "SYSTEM"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <div>
                                            <p className="text-lg font-black text-white uppercase italic tracking-tight">{user.nom} {user.prenom}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{user.poste}</p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${status.bg}`}>
                                            {status.pulse && <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
                                            {status.label}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8">
                                        <div className={`flex items-center gap-3 font-black text-[10px] uppercase tracking-widest ${pwd.bg}`}>
                                            <pwd.icon size={16} />
                                            {pwd.label}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-right">
                                        <div className="flex justify-end gap-4">
                                            {user.temporaryPassword && (user.statutCompte === "EN_ATTENTE_PREMIERE_CONNEXION" || user.statutCompte === "INACTIF") && (
                                                <button 
                                                    onClick={() => handleConsult(user)}
                                                    className="w-14 h-14 bg-white/5 text-emerald-400 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-emerald-500/10 hover:scale-110 active:scale-95 transition-all group/btn"
                                                    title="Consulter le mot de passe temporaire"
                                                >
                                                    <Eye size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            )}
                                            {user.statutCompte === "INACTIF" ? (
                                                <button 
                                                    onClick={() => handleAction(user.matricule, 'activate')}
                                                    className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-900/40 group/btn"
                                                >
                                                    <Unlock size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAction(user.matricule, 'reset')}
                                                    className="w-14 h-14 bg-white/5 text-gray-400 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all group/btn"
                                                >
                                                    <RefreshCw size={20} className={actionLoading === user.matricule ? "animate-spin text-red-600" : "group-hover/btn:rotate-180 transition-transform duration-500"} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- SUCCESS MODAL: CYBER STYLE --- */}
            {successModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-16 max-w-2xl w-full shadow-[0_0_100px_rgba(220,38,38,0.2)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />
                        
                        <div className="space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                                    {successModal.type === 'consult' ? <Shield size={40} /> : <CheckCircle2 size={40} />}
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white">
                                        {successModal.type === 'consult' ? 'Consultation' : successModal.type === 'reset' ? 'Access Reset' : 'Node Activated'}
                                    </h2>
                                    <p className="text-red-500 font-black uppercase text-[10px] tracking-[0.5em] mt-2">
                                        {successModal.type === 'consult' ? 'Security Retrieval Successful' : 'Security Override Successful'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-4">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Temporary Access Key:</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-6xl font-black text-white tracking-tighter italic font-mono uppercase">{successModal.temporary_password || 'NONE'}</p>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(successModal.temporary_password || '')}
                                            className="p-4 bg-white/5 text-gray-400 rounded-2xl hover:text-white transition-all active:scale-90"
                                        >
                                            <Copy size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 bg-red-600/10 border border-red-600/20 rounded-[2.5rem]">
                                    <div className="flex items-start gap-4">
                                        <Shield size={20} className="text-red-600 shrink-0 mt-1" />
                                        <p className="text-[11px] font-bold text-red-400 leading-relaxed italic">
                                            {successModal.type === 'consult' 
                                                ? `Cet identifiant est actuellement actif pour le sujet (${successModal.matricule}). Il sera invalidé dès la première modification par l'utilisateur.`
                                                : `Cet identifiant est à usage unique. Le sujet (${successModal.matricule}) sera forcé de modifier cet accès lors de la connexion initiale au système.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSuccessModal(null)}
                                className="w-full h-24 bg-white text-black rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-95"
                            >
                                {successModal.type === 'consult' ? 'Fermer la vue' : 'Terminer Maintenance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
