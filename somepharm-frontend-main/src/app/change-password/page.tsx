"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Sécurité Requise</h1>
          <p className="text-gray-500 font-medium">Pour votre première connexion, vous devez définir un nouveau mot de passe personnel.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-in shake-in duration-300">
            <ShieldAlert size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe mis à jour !</h2>
            <p className="text-gray-500">Redirection vers votre espace de travail...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-4">Nouveau mot de passe</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl py-4 pl-14 pr-14 font-bold text-gray-900 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-4">Confirmer le mot de passe</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl py-4 pl-14 pr-14 font-bold text-gray-900 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Password Requirements Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <Requirement met={requirements.length} label="8+ caractères" />
              <Requirement met={requirements.upper} label="Majuscule" />
              <Requirement met={requirements.digit} label="Chiffre" />
              <Requirement met={requirements.special} label="Caractère spécial" />
            </div>

            <button
              type="submit"
              disabled={loading || !allMet}
              className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center justify-center gap-3
                ${allMet 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sécuriser mon compte <ArrowRight size={18} />
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
    <div className={`flex items-center gap-2 transition-all ${met ? "text-green-600" : "text-gray-400"}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${met ? "bg-green-100 border-green-200" : "bg-white border-gray-200"}`}>
        {met && <CheckCircle2 size={12} strokeWidth={3} />}
      </div>
      <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
    </div>
  );
}
