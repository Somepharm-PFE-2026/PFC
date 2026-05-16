"use client";
import React, { useState, useEffect } from "react";
import { Settings, ShieldAlert, Key, CheckCircle2, UserCircle, AlertCircle, Loader2, HelpCircle } from "lucide-react";
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
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-teal-600 rounded-2xl lg:rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 uppercase">Paramètres Compte</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gérez votre sécurité et vos préférences d'accès</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Profile Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4 border-2 border-dashed border-slate-200">
                            <UserCircle size={48} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-slate-900 leading-tight">
                            {user?.sub || "Utilisateur"}
                        </h3>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
                            {user?.role?.replace("ROLE_", "") || "Collaborateur"}
                        </p>
                        
                        <div className="w-full mt-6 pt-6 border-t border-slate-50 space-y-3">
                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                <span className="text-slate-400">Département</span>
                                <span className="text-slate-700">{user?.departement || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                <span className="text-slate-400">Poste</span>
                                <span className="text-slate-700 truncate ml-4" title={user?.poste}>{user?.poste || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-heading font-bold text-slate-900 uppercase">Sécurité & Accès</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Réinitialisation de mot de passe</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                Si vous souhaitez modifier votre mot de passe pour des raisons de sécurité, vous devez en faire la demande au Super Administrateur. 
                                Une fois la demande validée, un nouveau mot de passe temporaire vous sera communiqué.
                            </p>

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
                                </div>
                            )}

                            {requested ? (
                                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-heading font-bold text-emerald-700 uppercase">Demande Envoyée</h4>
                                        <p className="text-xs font-semibold text-emerald-600 mt-1">Veuillez contacter votre administrateur pour récupérer vos nouveaux accès.</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestReset}
                                    disabled={requesting}
                                    className="group relative w-full bg-slate-900 text-white p-5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {requesting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Key size={18} className="group-hover:rotate-12 transition-transform" />
                                        )}
                                        <span>{requesting ? "Traitement..." : "Demander une réinitialisation"}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-teal-600 rounded-2xl p-6 lg:p-10 text-white shadow-lg shadow-teal-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                        <div className="flex items-start gap-4 mb-4">
                            <HelpCircle size={28} className="opacity-80" />
                            <h3 className="text-lg font-heading font-bold uppercase">Besoin d&apos;assistance ?</h3>
                        </div>
                        <p className="text-teal-50 text-sm font-medium leading-relaxed mb-6 opacity-90 max-w-lg">
                            Si vous avez des difficultés à accéder à votre compte ou si vous avez perdu vos identifiants, veuillez contacter directement le support RH ou votre manager.
                        </p>
                        <button className="bg-white text-teal-600 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg hover:bg-teal-50 transition-all active:scale-95">
                            Contacter le Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
