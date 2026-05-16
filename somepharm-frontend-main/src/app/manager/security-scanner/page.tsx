"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  QrCode, 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ScanLine, 
  Camera, 
  CameraOff, 
  Keyboard,
  History,
  Info
} from "lucide-react";

export default function SecurityScannerPage() {
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [inputMode, setInputMode] = useState<"camera" | "text">("text");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const scannerDivId = "qr-reader";

  // Auto-focus text input
  useEffect(() => {
    if (inputMode === "text" && inputRef.current) inputRef.current.focus();
  }, [inputMode]);

  const processQRCode = useCallback((decodedText: string) => {
    const parts = decodedText.split("|");
    let resultObj: any;

    if (parts.length === 5 && parts[0] === "BON_SORTIE" && parts[4] === "VALIDATED_SOMEPHARM") {
      resultObj = {
        isValid: true,
        type: "BON DE SORTIE",
        employee: parts[1],
        date: parts[2],
        timeWindow: parts[3],
        timestamp: new Date().toLocaleTimeString(),
        raw: decodedText
      };
    } else {
      resultObj = {
        isValid: false,
        error: "QR Code invalide ou falsifié",
        timestamp: new Date().toLocaleTimeString(),
        raw: decodedText
      };
    }

    setScanResult(resultObj);
    setScanHistory(prev => [resultObj, ...prev].slice(0, 5));
    setScanInput("");
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode(scannerDivId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          processQRCode(decodedText);
          html5QrCode.pause();
          setTimeout(() => {
            try { html5QrCode.resume(); } catch (_) {}
          }, 2500);
        },
        undefined
      );
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setCameraActive(false);
    }
  }, [processQRCode]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    processQRCode(scanInput.trim());
  };

  const handleModeSwitch = (mode: "camera" | "text") => {
    if (mode === "text" && cameraActive) stopCamera();
    setInputMode(mode);
    setScanResult(null);
  };

  return (
    <div className="w-full bg-slate-900 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-10 text-white relative overflow-hidden flex flex-col items-center min-h-[70vh] lg:min-h-[80vh]">
      
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#0d9488_0%,_transparent_50%)]"></div>
        <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full transition-all duration-1000
          ${scanResult?.isValid === true ? 'bg-emerald-500/40' : scanResult?.isValid === false ? 'bg-rose-500/40' : 'bg-teal-500/10'}`}></div>
      </div>

      <div className="w-full max-w-xl lg:max-w-2xl z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
            <ShieldCheck size={32} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold uppercase tracking-tight">
              Portail <span className="text-teal-500">Sécurité</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              Contrôle d'Accès & Bons de Sortie
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center p-1 bg-slate-800/50 rounded-xl border border-slate-700 w-full max-w-sm mx-auto">
          <button
            onClick={() => handleModeSwitch("camera")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all
              ${inputMode === "camera" ? "bg-teal-600 text-white shadow-md shadow-teal-900/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Camera size={14} /> Caméra
          </button>
          <button
            onClick={() => handleModeSwitch("text")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all
              ${inputMode === "text" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Keyboard size={14} /> Scanner USB
          </button>
        </div>

        {/* Scanner Body */}
        <div className="space-y-6">
          {inputMode === "camera" ? (
            <div className="space-y-4">
              <div className="relative aspect-square sm:aspect-video lg:aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <div id={scannerDivId} className="w-full h-full object-cover" />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90 p-6 text-center">
                    <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 text-slate-500">
                      <CameraOff size={32} />
                    </div>
                    <div>
                      <p className="text-slate-200 font-bold text-sm uppercase tracking-wider">Caméra désactivée</p>
                      <p className="text-slate-500 text-[10px] font-medium uppercase mt-1">Démarrer le flux pour scanner</p>
                    </div>
                    {cameraError && (
                      <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-2 rounded-lg text-[10px] font-bold">
                        <AlertTriangle size={12} /> {cameraError}
                      </div>
                    )}
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-xl"></div>
                      <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-teal-400/50 shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-bounce"></div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]
                  ${cameraActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-teal-600 hover:bg-teal-700 text-white"}`}
              >
                {cameraActive ? <><CameraOff size={18} /> Arrêter</> : <><Camera size={18} /> Activer Caméra</>}
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl text-center space-y-6">
              <QrCode size={48} className="text-slate-600 mx-auto" strokeWidth={1} />
              <div className="space-y-4">
                <form onSubmit={handleScanSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="En attente du scan..."
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-4 text-center text-lg font-mono text-teal-400 focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-700"
                    autoFocus
                  />
                </form>
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Info size={12} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Champ prêt pour lecteur code-barres</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {scanResult && (
          <div className={`p-6 rounded-2xl flex items-center gap-4 border backdrop-blur-md animate-in slide-in-from-top-4 duration-500 shadow-2xl
            ${scanResult.isValid
              ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-100"
              : "bg-rose-900/20 border-rose-500/30 text-rose-100"}`}
          >
            <div className={`p-3 rounded-xl shrink-0 ${scanResult.isValid ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
              {scanResult.isValid ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-xl font-bold uppercase tracking-tight truncate ${scanResult.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                {scanResult.isValid ? "Accès Autorisé" : "Accès Refusé"}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-0.5 truncate">
                {scanResult.isValid ? `${scanResult.type} · ${scanResult.employee}` : scanResult.error}
              </p>
            </div>
            <div className="text-[9px] font-mono opacity-40 text-right hidden sm:block">
              {scanResult.timestamp}
            </div>
          </div>
        )}

        {/* History */}
        {scanHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-500 pl-1">
              <History size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Derniers scans</p>
            </div>
            <div className="space-y-2">
              {scanHistory.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider
                  ${h.isValid ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-500"}`}>
                  {h.isValid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span className="flex-1 truncate font-mono opacity-80">{h.raw}</span>
                  <span className="text-slate-600 shrink-0 tabular-nums">{h.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
