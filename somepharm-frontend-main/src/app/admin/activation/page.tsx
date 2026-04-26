"use client";
import React, { useState, useEffect } from "react";
import { UserCheck, ShieldPlus, Key, Copy, CheckCircle2, Loader2, Search, AlertCircle, Fingerprint, ShieldAlert, FileDigit, ShieldCheck } from "lucide-react";


export default function ActivationPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activatingId, setActivatingId] = useState<number | null>(null);
    const [successData, setSuccessData] = useState<any>(null);
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
            setUsers(data.filter((u: any) => u.statutCompte === "INACTIF"));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleActivate = async (id: number) => {
        setActivatingId(id);
        try {
            const res = await fetch(`http://localhost:8080/api/utilisateurs/${id}/activate`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSuccessData(data);
                fetchUsers();
            }
        } catch (e) { console.error(e); }
        finally { setActivatingId(null); }
    };

    const filteredUsers = users.filter(u => 
        u.nom?.toLowerCase().includes(search.toLowerCase()) || 
        u.prenom?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* --- HERO HEADER --- */}
            <div className="flex justify-between items-center">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[2px] bg-red-600" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">Identity Provisioning Engine</span>
                    </div>
                    <h1 className="text-6xl font-black text-gray-950 tracking-tighter uppercase italic leading-none">
                        Activation <span className="text-red-600">Dossiers</span>
                    </h1>
                </div>
                
                <div className="relative group">
                    <div className="absolute inset-0 bg-red-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity" />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={24} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom ou département..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-[400px] pl-20 pr-8 py-8 bg-white border border-gray-100 rounded-[2.5rem] text-lg font-bold italic shadow-sm focus:ring-4 focus:ring-red-500/5 outline-none transition-all placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* --- MAIN LIST --- */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-6">
                    <Loader2 size={64} className="text-red-600 animate-spin" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse">Scanning Secure Repository...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-dashed border-gray-100 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative z-10">
                        <div className="w-32 h-32 bg-gray-950 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
                            <Fingerprint size={56} />
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 uppercase italic tracking-tight mb-4">File Clear 🟢</h3>
                        <p className="text-gray-400 text-lg font-bold italic">Aucun nouveau profil en attente d'activation système.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {filteredUsers.map((user) => (
                        <div key={user.idUser} className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm hover:shadow-2xl hover:border-red-600/20 transition-all duration-700 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 text-gray-50 -mr-8 -mt-8 group-hover:text-red-50 transition-colors duration-700">
                                <ShieldPlus size={200} />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-12">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-gray-950 text-white rounded-[2.5rem] flex items-center justify-center font-black text-3xl italic shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-500">
                                            {user.nom?.[0]}{user.prenom?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 uppercase italic leading-none mb-3">
                                                {user.nom} {user.prenom}
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <span className="px-4 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{user.poste}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{user.departement}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Dossier ID</p>
                                        <p className="text-lg font-black text-gray-950 italic">#{user.idUser.toString().padStart(4, '0')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10 mb-12 border-y border-gray-50 py-10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Site Affectation</p>
                                        <p className="text-lg font-black text-gray-900 italic">{user.site?.nomSite || "NON SPÉCIFIÉ"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Type Profil</p>
                                        <p className="text-lg font-black text-gray-900 italic">EMPLOYÉ STANDARD</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleActivate(user.idUser)}
                                    disabled={activatingId === user.idUser}
                                    className="w-full group/btn relative py-8 bg-gray-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-red-600 hover:shadow-red-900/40 transition-all active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-4">
                                        {activatingId === user.idUser ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <ShieldPlus size={24} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                                        )}
                                        {activatingId === user.idUser ? "Traitement Nucleus..." : "Activer & Générer Identifiants"}
                                    </div>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- SECURE CREDENTIALS MODAL --- */}
            {successData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-gray-950/90 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="w-full max-w-2xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-700">
                        <div className="absolute top-0 right-0 p-12 text-green-500/5 -mr-16 -mt-16">
                            <ShieldCheck size={400} />
                        </div>
                        
                        <div className="text-center mb-16 relative z-10">
                            <div className="w-28 h-28 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 uppercase italic mb-4 tracking-tighter">Accès <span className="text-green-600">Générés</span></h2>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] italic">Transmettez ces informations à l'employé immédiatement</p>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 group hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <FileDigit size={16} className="text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Matricule Unique</span>
                                        </div>
                                        <button onClick={() => navigator.clipboard.writeText(successData.matricule)} className="p-3 text-gray-300 hover:text-blue-600 hover:bg-white rounded-xl transition-all"><Copy size={20} /></button>
                                    </div>
                                    <p className="text-4xl font-black text-gray-950 tracking-[0.2em] font-mono italic">{successData.matricule}</p>
                                </div>

                                <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 group hover:border-orange-500/30 transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <Key size={16} className="text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mot de Passe Temporaire</span>
                                        </div>
                                        <button onClick={() => navigator.clipboard.writeText(successData.temporary_password || successData.temporaryPassword)} className="p-3 text-gray-300 hover:text-orange-600 hover:bg-white rounded-xl transition-all"><Copy size={20} /></button>
                                    </div>
                                    <p className="text-4xl font-black text-gray-950 tracking-[0.1em] font-mono italic">{successData.temporary_password || successData.temporaryPassword}</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex gap-6 text-red-700">
                                <ShieldAlert className="shrink-0 mt-1" size={28} />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase italic tracking-widest">Alerte Sécurité</h4>
                                    <p className="text-xs font-bold leading-relaxed italic opacity-80">
                                        Ces informations sont éphémères. En cas de perte, une réinitialisation manuelle par le Super Admin sera nécessaire.
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSuccessData(null)}
                                className="w-full py-8 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-all active:scale-95"
                            >
                                J'ai sécurisé les identifiants
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
