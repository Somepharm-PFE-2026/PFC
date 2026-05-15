"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";


export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password requirements state
  const requirements = {
    length: newPassword.length >= 8,
    digit: /[0-9]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    special: /[!@#$%^&*]/.test(newPassword),
  };

  const allMet = Object.values(requirements).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!allMet) {
      setError("Veuillez respecter toutes les exigences de sécurité.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/utilisateurs/me/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        setSuccess(true);
        localStorage.removeItem("mustChangePassword");
        
        // Decode token to find correct dashboard path
        const token = localStorage.getItem("token");
        let targetPath = "/login";
        if (token) {
          const decoded: any = jwtDecode(token);
          let role = decoded.role || "ROLE_EMPLOYE";
          if (role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
          
          if (role === "SUPER_ADMIN") targetPath = "/admin/dashboard";
          else if (role === "RH_ADMIN" || role === "HR_MANAGER") targetPath = "/hr/dashboard";
          else if (role === "MANAGER") targetPath = "/manager/dashboard";
          else targetPath = "/employee/dashboard";
        }
        
        setTimeout(() => router.push(targetPath), 2000);
      } else {
        const msg = await response.text();
        setError(msg || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/50 to-slate-100 p-4">

      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">Sécurité Requise</h1>
          <p className="text-slate-500 text-sm">Veuillez définir un nouveau mot de passe personnel pour votre première connexion.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-in fade-in">
            <ShieldAlert size={18} className="shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">Mot de passe mis à jour !</h2>
            <p className="text-slate-500 text-sm">Redirection vers votre espace de travail...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white rounded-lg py-3 pl-10 pr-10 text-slate-900 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white rounded-lg py-3 pl-10 pr-10 text-slate-900 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Password Requirements Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
              <Requirement met={requirements.length} label="8+ caractères" />
              <Requirement met={requirements.upper} label="Majuscule" />
              <Requirement met={requirements.digit} label="Chiffre" />
              <Requirement met={requirements.special} label="Caractère spécial" />
            </div>

            <button
              type="submit"
              disabled={loading || !allMet}
              className={`w-full flex items-center justify-center gap-2 rounded-lg p-3 font-semibold transition-all duration-200 shadow-sm mt-2
                ${allMet 
                  ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sécurisation...</span>
                </>
              ) : (
                <>
                  <span>Sécuriser mon compte</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 transition-all ${met ? "text-emerald-600" : "text-slate-500"}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${met ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-transparent"}`}>
        <CheckCircle2 size={12} strokeWidth={3} className={met ? "block" : "hidden"} />
      </div>
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </div>
  );
}
