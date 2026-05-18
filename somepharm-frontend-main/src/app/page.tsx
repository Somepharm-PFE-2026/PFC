"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        let role = decoded.role;
        // 🛠️ Normalize role (strip ROLE_ prefix if present)
        if (role && role.startsWith("ROLE_")) {
          role = role.replace("ROLE_", "");
        }

        if (role === "EMPLOYE") router.push("/employee/dashboard");
        else if (role === "MANAGER") router.push("/manager/dashboard");
        else if (role === "RH_ADMIN" || role === "SUPER_ADMIN" || role === "HR_MANAGER") router.push("/hr/dashboard");
      } catch (e) {
        console.error("Redirect error", e);
      }
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] text-center p-8 font-sans animate-in fade-in duration-1000">
      <div className="bg-blue-100 text-blue-700 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-8 shadow-sm border border-blue-200">
        Portail RH Officiel Somepharm v2.0
      </div>
      
      <h1 className="text-7xl md:text-8xl font-black text-gray-900 italic uppercase tracking-tighter mb-6 leading-none">
        Gérez vos équipes <br /> 
        <span className="text-blue-600">en temps réel.</span>
      </h1>
      
      <p className="text-gray-400 font-bold max-w-2xl mb-12 text-lg">
        Accédez à votre solde, soumettez vos demandes de congé, et suivez 
        la validation de votre hiérarchie en toute transparence depuis une plateforme centralisée.
      </p>

      <div className="flex flex-wrap justify-center gap-6">
        <Link href="/login" className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3">
          Se Connecter <ArrowRight size={20} />
        </Link>
        <button 
          onClick={() => {
            const token = localStorage.getItem("token");
            if (token) {
              const decoded: any = jwtDecode(token);
              let role = decoded.role;
              // 🛠️ Normalize role (strip ROLE_ prefix if present)
              if (role && role.startsWith("ROLE_")) {
                role = role.replace("ROLE_", "");
              }

              if (role === "EMPLOYE") router.push("/employee/dashboard");
              else if (role === "MANAGER") router.push("/manager/dashboard");
              else if (role === "RH_ADMIN" || role === "SUPER_ADMIN" || role === "HR_MANAGER") router.push("/hr/dashboard");
            } else {
              router.push("/login");
            }
          }}
          className="bg-white border-2 border-gray-100 text-gray-600 px-10 py-5 rounded-[2rem] font-black uppercase text-sm hover:bg-gray-50 hover:border-gray-200 hover:scale-105 transition-all"
        >
          Accéder au Portail
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-blue-600 hover:-translate-y-2 transition-transform">
          <ShieldCheck className="text-blue-600 mb-6" size={40} />
          <h4 className="font-black uppercase text-sm mb-3 text-gray-800">100% Sécurisé</h4>
          <p className="text-xs text-gray-400 font-bold leading-relaxed">Validation multi-niveaux conforme au règlement intérieur de Somepharm.</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-amber-400 hover:-translate-y-2 transition-transform">
          <Zap className="text-amber-500 mb-6" size={40} />
          <h4 className="font-black uppercase text-sm mb-3 text-gray-800">Instantané</h4>
          <p className="text-xs text-gray-400 font-bold leading-relaxed">Mise à jour immédiate du solde de jours dès l'approbation finale des RH.</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-b-8 border-purple-500 hover:-translate-y-2 transition-transform">
          <BarChart3 className="text-purple-500 mb-6" size={40} />
          <h4 className="font-black uppercase text-sm mb-3 text-gray-800">Analytique</h4>
          <p className="text-xs text-gray-400 font-bold leading-relaxed">Tableau de bord intelligent pour les managers pour surveiller les absences.</p>
        </div>
      </div>
    </div>
  );
}