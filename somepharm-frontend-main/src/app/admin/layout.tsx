"use client";
import React, { useEffect, useState } from "react";
import SidebarSuperAdmin from "../components/SidebarSuperAdmin";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const decoded: any = jwtDecode(token);
            const role = decoded.role?.replace("ROLE_", "");
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
            <SidebarSuperAdmin />
            <main className="flex-1 p-12 overflow-y-auto no-scrollbar">
                {children}
            </main>
        </div>
    );
}
