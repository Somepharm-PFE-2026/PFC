"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface LiveChronometerProps {
    startTime: string | null;
    isStopped?: boolean;
}

export default function LiveChronometer({ startTime, isStopped }: LiveChronometerProps) {
    const [elapsed, setElapsed] = useState<string>("00:00:00");

    useEffect(() => {
        if (!startTime) {
            setElapsed("Non commencé");
            return;
        }

        if (isStopped) {
            setElapsed("Clôturé");
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = now.getTime() - start.getTime();

            if (diff < 0) {
                setElapsed("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
                setElapsed("--:--:--");
                return;
            }

            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center gap-3 bg-red-50 px-6 py-4 rounded-2xl border border-red-100 group hover:bg-red-600 transition-all duration-300">
            <Clock className="text-red-600 group-hover:text-white animate-pulse" size={18} />
            <div>
                <p className="text-[10px] text-red-500 group-hover:text-white/80 font-black uppercase tracking-widest">Temps de traitement (Live)</p>
                <p className="text-xl font-black text-red-600 group-hover:text-white font-mono">{elapsed}</p>
            </div>
        </div>
    );
}
