"use client";
import React, { useState, useEffect } from "react";
import { Settings, ShieldAlert, Key, CheckCircle2, UserCircle, AlertCircle, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

export default function SettingsView() {
    const [user, setUser] = useState<any>(null);
    const [requesting, setRequesting] = useState(false);
    const [requested, setRequested] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                setUser(jwtDecode(token));
            } catch (e) {
                console.error("Token decode failed", e);
            }
        }

        const checkStatus = async () => {
            if (!token) return;
            try {
                const res = await fetch("http://localhost:8080/api/admin/tickets/my-status", {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store"
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequested(data.status !== "NONE");
                    
                    // FORCE LOGOUT if ticket is approved/sent
                    if (data.status === "ENVOYÉ" || data.status === "EN_ATTENTE_EMPLOYÉ") {
                        const isOnPasswordPage = window.location.pathname.includes("change-password") || 
                                               window.location.href.includes("change-password");
                        if (!isOnPasswordPage) {
                            handleLogout();
                        }
                    }
                }
            } catch (err) { console.error(err); }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000); 
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const handleRequestReset = async () => {
        setError("");
        setRequesting(true);
        try {
            const res = await fetch("http://localhost:8080/api/admin/tickets/request-reset", {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                setRequested(true);
            } else {
                setError("Une erreur est survenue lors de la demande.");
            }
        } catch (err) { 
            console.error(err);
            setError("Impossible de contacter le serveur.");
        }
        finally { setRequesting(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HEADER --- */}
            <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Paramètres Compte</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Gérez votre sécurité et vos préférences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- PROFILE SUMMARY --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-300 mb-4 border-2 border-dashed border-gray-200">
                                <UserCircle size={64} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic leading-tight">
                                {user?.sub || "Utilisateur"}
                            </h3>
                            <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mt-1">
                                {user?.role?.replace("ROLE_", "") || "Collaborateur"}
                            </p>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Département</span>
                                <span className="text-gray-900">{user?.departement || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Poste</span>
                                <span className="text-gray-900">{user?.poste || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECURITY SECTION --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase italic">Sécurité du Compte</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Réinitialisation de mot de passe</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Si vous souhaitez modifier votre mot de passe pour des raisons de sécurité, vous devez en faire la demande au Super Administrateur. 
                                Une fois la demande validée, un nouveau mot de passe temporaire vous sera communiqué.
                            </p>

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 animate-in shake-in duration-300">
                                    <AlertCircle size={20} />
                                    <span className="text-xs font-bold">{error}</span>
                                </div>
                            )}

                            {requested ? (
                                <div className="p-8 bg-green-50 border border-green-100 rounded-[2rem] text-center space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-green-500 shadow-sm shadow-green-100">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-green-700 uppercase italic">Demande Envoyée !</h4>
                                        <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest">Veuillez contacter votre administrateur pour récupérer vos nouveaux accès.</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestReset}
                                    disabled={requesting}
                                    className="group relative w-full bg-gray-900 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-red-600 hover:shadow-red-100 transition-all active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-4">
                                        {requesting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Key size={20} className="group-hover:rotate-12 transition-transform" />
                                        )}
                                        {requesting ? "Demande en cours..." : "Demander une réinitialisation"}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                        <h3 className="text-lg font-black uppercase italic mb-2">Besoin d&apos;aide ?</h3>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">
                            Si vous avez des difficultés à accéder à votre compte ou si vous avez perdu vos identifiants, veuillez contacter directement le support RH.
                        </p>
                        <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:shadow-white/20 transition-all active:scale-95">
                            Contacter le Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
