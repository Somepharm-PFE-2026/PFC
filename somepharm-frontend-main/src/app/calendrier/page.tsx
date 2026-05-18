"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Shield, RefreshCw, AlertCircle } from "lucide-react";

export default function CalendrierPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [demandes, setDemandes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return router.push("/login");

    try {
      const decoded: any = jwtDecode(savedToken);
      let role = decoded.role;
      // 🛠️ Normalize role (strip ROLE_ prefix if present)
      if (role && role.startsWith("ROLE_")) {
        role = role.replace("ROLE_", "");
      }

      if (role === "EMPLOYE") return router.push("/demandes");
      setUser({ ...decoded, role }); // Update user with normalized role
      fetchDemandes(savedToken);
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  const fetchDemandes = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/demandes/all", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        
        // --- DATA MAPPING FIX ---
        // We filter using the exact field 'statut' and the value 'APPROUVE' found in your console log
        const approved = data.filter((d: any) => {
            const s = d.statut ? d.statut.toUpperCase() : "";
            return s === "APPROUVE" || s === "APPROUVÉ";
        });
        
        setDemandes(approved);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-gray-800 italic uppercase tracking-tighter">Planning de l'Équipe</h1>
        <div className="flex gap-3">
            <button onClick={() => fetchDemandes(localStorage.getItem("token") || "")} className="bg-white border p-2 rounded-xl hover:bg-gray-100 transition shadow-sm">
                <RefreshCw size={20} className={loading ? "animate-spin text-blue-600" : "text-gray-400"} />
            </button>
            <div className="bg-white shadow-sm border px-6 py-2 rounded-2xl font-bold text-blue-600 flex items-center gap-2">
                <Shield size={18} /> {user?.sub}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border overflow-hidden p-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-md"><CalendarIcon size={24} /></div>
            <h2 className="text-2xl font-black text-gray-700 uppercase">{monthNames[month]} {year}</h2>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="bg-gray-800 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200">Aujourd'hui</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Legend / Info */}
        {demandes.length === 0 && !loading && (
            <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-100 rounded-[2rem] flex items-center gap-3 text-amber-700 font-bold text-sm">
                <AlertCircle size={20} />
                Aucune absence approuvée n'est enregistrée pour cette période.
            </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: emptyDays }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[140px] bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-100"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const cellDate = new Date(year, month, dayNumber);
            const cellTime = cellDate.setHours(0, 0, 0, 0);
            
            const isToday = cellTime === new Date().setHours(0,0,0,0);

            // Filter requests that happen on THIS specific day
            const dayRequests = demandes.filter((d: any) => {
              if (!d.dateDebut || !d.dateFin) return false;
              
              // Helper to parse "YYYY-MM-DD" without timezone shifts
              const parse = (s: string) => {
                const parts = s.split('T')[0].split('-');
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
              };
              
              const startTime = parse(d.dateDebut);
              const endTime = parse(d.dateFin);
              
              return cellTime >= startTime && cellTime <= endTime;
            });

            return (
              <div key={dayNumber} className={`min-h-[140px] p-4 rounded-[2rem] border transition-all duration-300 ${
                isToday ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50/50' : 'bg-white border-gray-100 hover:border-blue-100'
              }`}>
                <span className={`text-xs font-black mb-4 block ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{dayNumber}</span>
                <div className="space-y-2 overflow-y-auto max-h-[80px]">
                  {dayRequests.map((req: any, idx) => (
                    <div key={idx} className="bg-green-100 text-green-700 text-[9px] font-black px-3 py-2 rounded-xl border border-green-200 truncate flex flex-col shadow-sm">
                      <span className="opacity-40 text-[7px] mb-0.5 font-bold uppercase">{req.matriculeDemandeur || "EMP"}</span>
                      {req.typeConge}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}