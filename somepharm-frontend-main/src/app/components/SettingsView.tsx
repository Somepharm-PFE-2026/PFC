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

    const isEmployee = typeof window !== "undefined" && window.location.pathname.includes("/employee");
    const isHR = typeof window !== "undefined" && window.location.pathname.includes("/hr");

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                <div className={`w-12 h-12 lg:w-16 lg:h-16 ${
                    isHR 
                        ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-indigo-500/5 border border-slate-800" 
                        : isEmployee 
                            ? "bg-sky-600 shadow-sky-600/20 text-white" 
                            : "bg-teal-600 shadow-teal-600/20 text-white"
                } rounded-2xl lg:rounded-[2rem] flex items-center justify-center shadow-lg shrink-0`}>
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className={`text-2xl lg:text-3xl font-heading font-bold ${
                        isHR 
                            ? "text-slate-100 bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent" 
                            : "text-slate-900"
                    } uppercase`}>
                        Paramètres Compte
                    </h1>
                    <p className={`text-sm font-medium mt-1 ${isHR ? "text-slate-400" : "text-slate-500"}`}>
                        Gérez votre sécurité et vos préférences d'accès
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Profile Summary */}
                <div className="lg:col-span-4">
                    <div className={`rounded-[3rem] p-6 lg:p-8 flex flex-col items-center text-center ${
                        isHR 
                            ? "bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
                            : "bg-white border border-slate-100 shadow-sm text-slate-900"
                    }`}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed ${
                            isHR 
                                ? "bg-slate-950 text-indigo-400/40 border-slate-800" 
                                : "bg-slate-50 text-slate-300 border-slate-200"
                        }`}>
                            <UserCircle size={48} />
                        </div>
                        <h3 className="text-lg font-heading font-bold leading-tight">
                            {user?.sub || "Utilisateur"}
                        </h3>
                        <p className={`text-[10px] font-bold ${
                            isHR 
                                ? "text-indigo-400" 
                                : isEmployee 
                                    ? "text-sky-600" 
                                    : "text-teal-600"
                        } uppercase tracking-widest mt-1`}>
                            {user?.role?.replace("ROLE_", "") || "Collaborateur"}
                        </p>
                        
                        <div className={`w-full mt-6 pt-6 border-t ${isHR ? "border-slate-800/80" : "border-slate-50"} space-y-3`}>
                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                <span className="text-slate-400">Département</span>
                                <span className={isHR ? "text-slate-200" : "text-slate-700"}>{user?.departement || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                <span className="text-slate-400">Poste</span>
                                <span className={`truncate ml-4 ${isHR ? "text-slate-200" : "text-slate-700"}`} title={user?.poste}>{user?.poste || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                    <div className={`rounded-[3rem] p-6 lg:p-10 shadow-sm relative overflow-hidden ${
                        isHR 
                            ? "bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
                            : "bg-white border border-slate-100"
                    }`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 ${
                            isHR 
                                ? "bg-indigo-500/5" 
                                : isEmployee 
                                    ? "bg-sky-50" 
                                    : "bg-teal-50"
                        } rounded-full blur-3xl -mr-16 -mt-16 opacity-50`} />
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                                isHR 
                                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                                    : "bg-rose-50 text-rose-600"
                            }`}>
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-heading font-bold uppercase">Sécurité & Accès</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isHR ? "text-indigo-400/60" : "text-slate-400"}`}>
                                    Réinitialisation de mot de passe
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <p className={`text-sm font-medium leading-relaxed ${isHR ? "text-slate-400" : "text-slate-600"}`}>
                                Si vous souhaitez modifier votre mot de passe pour des raisons de sécurité, vous devez en faire la demande au Super Administrateur. 
                                Une fois la demande validée, un nouveau mot de passe temporaire vous sera communiqué.
                            </p>

                            {error && (
                                <div className={`flex items-center gap-3 p-4 rounded-xl animate-in slide-in-from-top-2 ${
                                    isHR 
                                        ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                                        : "bg-rose-50 border border-rose-100 text-rose-600"
                                }`}>
                                    <AlertCircle size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
                                </div>
                            )}

                            {requested ? (
                                <div className={`p-8 rounded-2xl text-center space-y-4 animate-in zoom-in duration-500 ${
                                    isHR 
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                        : "bg-emerald-50 border border-emerald-100"
                                }`}>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                                        isHR 
                                            ? "bg-slate-950 text-emerald-400 border border-emerald-500/20" 
                                            : "bg-white text-emerald-500"
                                    }`}>
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-heading font-bold uppercase ${isHR ? "text-emerald-400" : "text-emerald-700"}`}>
                                            Demande Envoyée
                                        </h4>
                                        <p className={`text-xs font-semibold mt-1 ${isHR ? "text-slate-300" : "text-emerald-600"}`}>
                                            Veuillez contacter votre administrateur pour récupérer vos nouveaux accès.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestReset}
                                    disabled={requesting}
                                    className={`group relative w-full p-5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl transition-all active:scale-[0.98] overflow-hidden ${
                                        isHR 
                                        ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-95 font-bold shadow-md" 
                                        : "bg-slate-900 text-white hover:bg-rose-600"
                                    }`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {requesting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Key size={18} className="group-hover:rotate-12 transition-transform" />
                                        )}
                                        <span>{requesting ? "Traitement..." : "Demander une réinitialisation"}</span>
                                    </div>
                                    {!isHR && <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`rounded-[3rem] p-6 lg:p-10 shadow-lg relative overflow-hidden group ${
                        isHR 
                            ? "bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
                            : isEmployee 
                                ? "bg-sky-600 shadow-sky-600/20 text-white" 
                                : "bg-teal-600 shadow-teal-600/20 text-white"
                    }`}>
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700 ${
                            isHR ? "bg-indigo-500/5" : "bg-white/10"
                        }`} />
                        <div className="flex items-start gap-4 mb-4">
                            <HelpCircle size={28} className={`opacity-80 ${isHR ? "text-indigo-400" : ""}`} />
                            <h3 className="text-lg font-heading font-bold uppercase">Besoin d&apos;assistance ?</h3>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed mb-6 opacity-90 max-w-lg ${
                            isHR ? "text-slate-400" : isEmployee ? "text-sky-50" : "text-teal-50"
                        }`}>
                            Si vous avez des difficultés à accéder à votre compte ou si vous avez perdu vos identifiants, veuillez contacter directement le support RH ou votre manager.
                        </p>
                        <button className={`px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${
                            isHR 
                                ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-95" 
                                : `bg-white ${isEmployee ? "text-sky-600 hover:bg-sky-50" : "text-teal-600 hover:bg-teal-50"}`
                        }`}>
                            Contacter le Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
