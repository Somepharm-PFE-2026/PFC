"use client";
import React, { useEffect, useState } from "react";
import SidebarSuperAdmin from "../components/SidebarSuperAdmin";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    const [isGhost, setIsGhost] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const decoded: any = jwtDecode(token);
            const role = decoded.role?.replace("ROLE_", "");
            setIsGhost(!!decoded.isGhost);
            if (role !== "SUPER_ADMIN") {
                router.push("/login");
            } else {
                setAuthorized(true);
            }
        } catch (e) {
            router.push("/login");
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="flex bg-gray-50 min-h-screen relative">
            {isGhost && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-4 shadow-xl animate-in slide-in-from-top duration-500 font-black uppercase italic tracking-[0.2em] text-[10px]">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    ⚠️ MODE GHOST — Vous naviguez en mode lecture seule pour ce profil
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
            )}
            <SidebarSuperAdmin />
            <main className={`flex-1 p-12 overflow-y-auto no-scrollbar ${isGhost ? "mt-10" : ""}`}>
                {children}
            </main>
        </div>
    );
}
