"use client";
import React, { useState, useEffect } from "react";
import { Activity, Server, Database, Mail, FileText, Cpu, HardDrive, Wifi, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function HealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [restarting, setRestarting] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchHealth = () => {
            fetch("http://localhost:8080/api/admin/health", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            .then(res => res.json())
            .then(data => {
                setHealth(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const handleRestart = async (service: string) => {
        if (!confirm(`Redémarrer le service ${service} ?`)) return;
        setRestarting(service);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/health/restart/${service}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setStatusMsg(`Le service ${service} a été réinitialisé.`);
            }
        } catch (err) { console.error(err); }
        finally { setRestarting(null); }
    };

    const services = [
        { id: "api", name: "Serveur API Spring Boot", type: "Backend", icon: Server, status: "UP", load: health?.cpu_load + "%", latency: "12ms" },
        { id: "db", name: "PostgreSQL Database", type: "Persistence", icon: Database, status: health?.db_status || "UP", load: "4%", latency: health?.db_latency || "2ms" },
        { id: "smtp", name: "Service SMTP Gmail", type: "Communication", icon: Mail, status: "UP", load: "0%", latency: "145ms" },
        { id: "pdf", name: "Moteur IText PDF", type: "Génération", icon: FileText, status: "UP", load: "0%", latency: "5ms" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic mb-2">État des Services</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Surveillance infrastructurelle temps réel</p>
                </div>
                <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uptime 30J</span>
                        <span className="text-xl font-black text-green-600 italic">99.98%</span>
                    </div>
                    <div className="w-px h-10 bg-gray-100" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incidents</span>
                        <span className="text-xl font-black text-gray-950 italic">0</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* --- SERVICES LIST --- */}
                <div className="lg:col-span-2 space-y-6">
                    {services.map((service, i) => (
                        <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all duration-500">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors shadow-sm">
                                <service.icon size={28} />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-1">
                                    <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">{service.name}</h4>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{service.type}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${service.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${service.status === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                                            {service.status === 'UP' ? 'Opérationnel' : 'Erreur'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Wifi size={12} />
                                        {service.latency}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Cpu size={12} />
                                        {service.load}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleRestart(service.id)}
                                disabled={restarting === service.id}
                                className="px-6 py-3 bg-gray-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {restarting === service.id ? <RefreshCw size={12} className="animate-spin" /> : null}
                                Restart
                            </button>
                        </div>
                    ))}
                </div>

                {/* --- RESOURCES MONITOR --- */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                        <h3 className="text-xl font-black text-gray-900 uppercase italic mb-10 flex items-center gap-3">
                            <Cpu className="text-blue-600" />
                            Resources Serveur
                        </h3>
                        
                        <div className="space-y-10">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-400 italic">Charge CPU</span>
                                    <span className="text-gray-900">{health?.cpu_load || 0}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${health?.cpu_load || 0}%` }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-400 italic">Mémoire RAM</span>
                                    <span className="text-gray-900">{health?.ram_used_gb || 0} GB / {health?.ram_total_gb || 0} GB</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${health?.ram_percentage || 0}%` }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-400 italic">Stockage Disque</span>
                                    <span className="text-gray-900">{health?.disk_percentage || 0}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${health?.disk_percentage || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-3xl -mr-32 -mt-32 opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                        <h3 className="text-xl font-black uppercase italic mb-6">Logs de Santé</h3>
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-500 italic uppercase">Aujourd'hui, 14:22</p>
                            <p className="text-sm font-bold leading-relaxed italic">
                                <span className="text-green-500 mr-2">●</span>
                                Vérification hebdomadaire terminée : 0 anomalie détectée.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- SUCCESS TOAST --- */}
            {statusMsg && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-10 py-5 bg-gray-950 text-white rounded-[2.5rem] shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 duration-500">
                    <CheckCircle2 size={24} className="text-green-500" />
                    <span className="font-black uppercase tracking-widest text-[11px] italic">{statusMsg}</span>
                </div>
            )}
        </div>
    );
}
