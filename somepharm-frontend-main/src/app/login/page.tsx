"use client"; // This tells Next.js we need interactivity (state & fetching)

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Call your Spring Boot API
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });

      if (!res.ok) {
        if (res.status === 423) {
          throw new Error("Compte verrouillé suite à trop d'échecs. Veuillez patienter 15 minutes.");
        }
        throw new Error("Identifiants incorrects. Veuillez réessayer.");
      }

      // 2. Extract the JWT Token from the JSON response
      const data = await res.json();
      
      // 3. Save the token to the browser's Local Storage
      localStorage.setItem("token", data.token);
      if (data.mustChangePassword) {
        localStorage.setItem("mustChangePassword", "true");
      } else {
        localStorage.removeItem("mustChangePassword");
      }

      // 4. Extract role and redirect directly to the specific portal
      try {
        const decoded: any = jwtDecode(data.token);
        let role = decoded.role;
        // 🛠️ Normalize role (strip ROLE_ prefix if present)
        if (role && role.startsWith("ROLE_")) {
          role = role.replace("ROLE_", "");
        }

        if (role === "EMPLOYE" || role === "SECURITY_AGENTS") router.push("/employee/dashboard");
        else if (role === "MANAGER" || role === "CHEF_DEPARTEMENT") router.push("/manager/dashboard");
        else if (role === "SUPER_ADMIN") router.push("/admin/dashboard");
        else if (role === "RH_ADMIN" || role === "HR_MANAGER") router.push("/hr/dashboard");
        else router.push("/"); // Fallback
      } catch (e) {
        router.push("/");
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/50 to-slate-100 p-4">
      <div className="w-full max-w-[450px] rounded-2xl bg-white p-6 sm:p-10 shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100 shadow-sm">
            {/* If you have a logo.png, use it here, otherwise use text */}
            <span className="text-3xl font-heading font-bold text-teal-600">SP</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">SomePharm</h1>
          <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium tracking-wide border border-teal-100">
            Portail Ressources Humaines
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-600 border border-rose-200 flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Matricule
            </label>
            <input
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex: EMP-999"
              className={`w-full rounded-lg border p-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                error ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50/50 focus:bg-white"
              }`}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              {/* Optional: Add forgot password link here if needed in the future */}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-lg border p-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                error ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50/50 focus:bg-white"
              }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 p-3 font-semibold text-white hover:bg-teal-700 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <span>Se connecter</span>
            )}
          </button>
        </form>
        
      </div>
    </main>
  );
}