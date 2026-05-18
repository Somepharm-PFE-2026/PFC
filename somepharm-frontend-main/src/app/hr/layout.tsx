"use client";
import React, { useEffect } from "react";
import { useUI } from "../../context/UIContext";
import SidebarAdmin from "../components/SidebarAdmin";
import SidebarSuperAdmin from "../components/SidebarSuperAdmin";
import ValidationDetailWorkspace from "./validation-rh/components/ValidationDetailWorkspace";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarRetracted, activeHRRequest, setActiveHRRequest } = useUI();
  const router = useRouter();
  const [role, setRole] = React.useState<string | null>(null);
  const [matricule, setMatricule] = React.useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setRole(decoded.role?.replace("ROLE_", ""));
        setMatricule(decoded.sub);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const role = decoded.role?.replace("ROLE_", "");
        if (role === "SUPER_ADMIN") {
           router.push("/admin/dashboard");
        }
      } catch (e) {}
    }
  }, [router]);

  // Bridge for handleAction - this will be provided by the page soon
  // For now we keep it extensible
  const handleGlobalAction = (id: string, action: string, comment: string) => {
    // Page will handle the actual fetch through its shared state or we move it all to Context
    console.log("Global Action triggered:", action);
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden relative font-sans text-slate-100">
      {/* LUXURY HR OFFICE BACKGROUND */}
      <div 
        className="fixed inset-0 z-[-2]"
        style={{
          backgroundImage: 'url("/bg-hrmgr.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-[1.5px] z-[-1] pointer-events-none" />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none opacity-40">
        {/* Glowing gold ambient lights */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        
        {/* Soft abstract luxury pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <SidebarAdmin />

      <main className={`flex-1 min-h-screen p-4 pt-20 lg:p-8 animate-in fade-in duration-700 transition-all duration-500 ml-0
        ${isSidebarRetracted ? 'lg:ml-32' : 'lg:ml-96'}
        ${activeHRRequest ? 'blur-[100px] grayscale-[0.2] opacity-50 pointer-events-none' : ''}
      `}>
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {activeHRRequest && (
        <ValidationDetailWorkspace 
          request={activeHRRequest}
          isOwnRequest={activeHRRequest.demandeur?.matricule === matricule}
          onClose={() => setActiveHRRequest(null)}
          onAction={(id, action, comment) => {
             // In the global layout, we'll use a custom event or shared state to trigger the page's handleAction
             window.dispatchEvent(new CustomEvent("hr-action-triggered", { detail: { id, action, comment } }));
          }}
        />
      )}
    </div>
  );
}
