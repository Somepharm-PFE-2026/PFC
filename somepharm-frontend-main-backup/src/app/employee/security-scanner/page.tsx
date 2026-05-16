"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, ShieldCheck, XCircle, CheckCircle2, AlertTriangle, ScanLine, Camera, CameraOff, Keyboard } from "lucide-react";

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
    setScanHistory(prev => [resultObj, ...prev].slice(0, 10));
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
          // Pause briefly after scan so it doesn't fire multiple times
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
    <div className="min-h-[85vh] bg-gray-950 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden flex flex-col items-center font-sans shadow-2xl">
      
      {/* Animated background glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-colors duration-1000
          ${scanResult?.isValid === true ? 'bg-green-500/25' : scanResult?.isValid === false ? 'bg-red-500/25' : 'bg-indigo-600/10'}`}></div>
      </div>

      <div className="w-full max-w-2xl z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center p-4 bg-gray-800/80 rounded-3xl border border-gray-700 shadow-xl">
            <ShieldCheck size={40} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Portail <span className="text-blue-500">Sécurité</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">
            Validation des accès & bons de sortie · SomePharm
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 w-fit mx-auto">
          <button
            onClick={() => handleModeSwitch("camera")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
              ${inputMode === "camera" ? "bg-blue-600 text-white shadow-lg shadow-blue-900" : "text-gray-400 hover:text-white"}`}
          >
            <Camera size={16} /> Caméra Live
          </button>
          <button
            onClick={() => handleModeSwitch("text")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
              ${inputMode === "text" ? "bg-gray-700 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            <Keyboard size={16} /> Scanner USB
          </button>
        </div>

        {/* Camera Mode */}
        {inputMode === "camera" && (
          <div className="space-y-4">
            {/* Viewfinder */}
            <div className="relative bg-black rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl" style={{ minHeight: 320 }}>
              {/* html5-qrcode attaches its video feed here */}
              <div id={scannerDivId} className="w-full" />

              {/* Overlay when camera is OFF */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-950/90">
                  <div className="p-6 bg-gray-800/60 rounded-full border border-gray-700">
                    <CameraOff size={48} className="text-gray-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-gray-300 font-black uppercase text-sm tracking-widest">Caméra non activée</p>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Cliquez pour démarrer la caméra</p>
                  </div>
                  {cameraError && (
                    <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-xs font-bold">
                      <AlertTriangle size={14} /> {cameraError}
                    </div>
                  )}
                </div>
              )}

              {/* Animated scanning frame overlay when active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                    {/* Scanning line */}
                    <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-blue-400/70 shadow-[0_0_8px_2px_rgba(96,165,250,0.5)] animate-bounce"></div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                    <ScanLine size={12} className="text-blue-400 animate-pulse" />
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Scan en cours...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera toggle button */}
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl
                ${cameraActive
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/40"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/40"}`}
            >
              {cameraActive ? <><CameraOff size={18} /> Désactiver la Caméra</> : <><Camera size={18} /> Activer la Caméra</>}
            </button>
          </div>
        )}

        {/* Text / USB Scanner Mode */}
        {inputMode === "text" && (
          <div className="bg-gray-900/60 backdrop-blur-md p-1 border border-gray-800 rounded-[2.5rem] shadow-2xl relative">
            <div className="absolute -top-3 -right-3">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 items-center justify-center">
                  <ScanLine size={12} className="text-white animate-pulse" />
                </span>
              </span>
            </div>
            <form onSubmit={handleScanSubmit} className="bg-gray-950 rounded-[2rem] p-8 flex flex-col items-center space-y-6">
              <QrCode size={56} className="text-gray-700" strokeWidth={1} />
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scanner ou saisir le QR Code..."
                className="w-full bg-black border-2 border-gray-800 rounded-2xl p-5 text-center text-lg font-mono text-blue-400 focus:outline-none focus:border-blue-500 transition-all"
                autoFocus
              />
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest text-center">
                Champ auto-focus · Compatible scanner USB
              </p>
            </form>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className={`p-7 rounded-[2rem] flex items-center gap-5 border backdrop-blur-md animate-in slide-in-from-bottom-6 duration-400 shadow-2xl
            ${scanResult.isValid
              ? "bg-green-950/50 border-green-500/40 text-green-100"
              : "bg-red-950/50 border-red-500/40 text-red-100"}`}
          >
            <div className={`p-4 rounded-2xl shrink-0 ${scanResult.isValid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {scanResult.isValid ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className={`text-2xl font-black uppercase tracking-tighter ${scanResult.isValid ? "text-green-400" : "text-red-400"}`}>
                {scanResult.isValid ? "✓ Accès Autorisé" : "✗ Accès Refusé"}
              </h3>
              {scanResult.isValid ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">{scanResult.type} — {scanResult.employee}</p>
                  <div className="flex gap-4 text-xs font-mono opacity-60">
                    <span>{scanResult.date}</span>
                    <span>{scanResult.timeWindow}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 opacity-80">
                  <AlertTriangle size={14} /> {scanResult.error}
                </p>
              )}
            </div>
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest shrink-0">{scanResult.timestamp}</p>
          </div>
        )}

        {/* History */}
        {scanHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Historique récent</p>
            {scanHistory.map((h, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest
                ${h.isValid ? "bg-green-950/20 border-green-900 text-green-500" : "bg-red-950/20 border-red-900 text-red-500"}`}>
                {h.isValid ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                <span className="flex-1 truncate font-mono">{h.raw}</span>
                <span className="text-gray-600 shrink-0">{h.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
