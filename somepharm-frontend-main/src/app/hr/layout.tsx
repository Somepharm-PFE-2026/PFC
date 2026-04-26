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
  const handleGlobalAction = (id: number, action: string, comment: string) => {
    // Page will handle the actual fetch through its shared state or we move it all to Context
    console.log("Global Action triggered:", action);
  };

  return (
    <div className="bg-gray-50 flex min-h-screen overflow-x-hidden relative">
      <SidebarAdmin />

      <main className={`flex-1 min-h-screen p-8 animate-in fade-in duration-700 transition-all duration-700 
        ${isSidebarRetracted ? 'ml-32' : 'ml-96'}
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
