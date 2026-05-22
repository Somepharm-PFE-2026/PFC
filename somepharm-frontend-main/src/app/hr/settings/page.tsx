"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  FileCode, 
  GitMerge, 
  Users, 
  ShieldCheck, 
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Clock3,
  Globe,
  Settings2,
  Fingerprint,
  Upload,
  UserCheck,
  MapPin,
  FileText,
  Type,
  Shield,
  Image as ImageIcon,
  CheckCircle2,
  Download,
  Eye,
  ArrowRight,
  Zap,
  UserMinus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

export default function HRSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("conges");
  const [config, setConfig] = useState<any>({
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    toleranceMinutes: 15,
    urgencyDelayHours: 48
  });
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    nom: "",
    quotaInitial: 30,
    justificatifObligatoire: false,
    couleurHex: "#3B82F6",
    description: ""
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [selectedMgrId, setSelectedMgrId] = useState<number | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [postes, setPostes] = useState<any[]>([]);
  const [newPosteTitre, setNewPosteTitre] = useState("");
  const [sites, setSites] = useState<any[]>([]);
  const [newSite, setNewSite] = useState({ nomSite: "", ville: "", adresse: "" });
  const [posteMapping, setPosteMapping] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedDeptMgrId, setSelectedDeptMgrId] = useState<number | null>(null);
  const [forceOverwriteAll, setForceOverwriteAll] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ nom: "", date: "", recurrenceType: "ANNUEL", recurrenceInterval: 1 });

  // --- TEMPLATES & SIGNATURES STATE ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ nom: "", description: "", categorie: "ADMINISTRATIF" });
  const [uploadingTemplateId, setUploadingTemplateId] = useState<number | null>(null);
  const [signaturePlacement, setSignaturePlacement] = useState("BOTTOM_RIGHT");
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [selectedTestEmployee, setSelectedTestEmployee] = useState<string>("");

  // --- WORKFLOW STATE ---
  const [circuits, setCircuits] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [bypassRules, setBypassRules] = useState<any[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [newCircuit, setNewCircuit] = useState({ nom: "", description: "" });
  const [newMapping, setNewMapping] = useState({ typeRequete: "", circuitId: "" });
  const [newBypass, setNewBypass] = useState({ nom: "", conditionType: "DEMANDEUR_EST_CHEF", etapeIgnoree: "MANAGER", seuilHeures: 48 });
  const [newDelegation, setNewDelegation] = useState({ titulaireId: "", delegueId: "", dateDebut: "", dateFin: "" });
  const [expandedCircuit, setExpandedCircuit] = useState<number | null>(null);
  const [newEtape, setNewEtape] = useState({ roleValidateur: "", label: "", delaiHeures: 72, actionExpiration: "RELANCE", optionnel: false });

  let roleName = typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.nomRole;
  if (roleName && roleName.startsWith("ROLE_")) {
    roleName = roleName.replace("ROLE_", "");
  }
  const isHRManager = roleName === "HR_MANAGER";
  const canManage = isHRManager;
  const canView = isHRManager || roleName === "RH_ADMIN";
  const isReadOnly = !canManage;

  useEffect(() => {
    fetchUserData();
    fetchConfig();
    fetchOrgData();
    fetchTemplates();
    fetchWorkflowData();
  }, []);

  useEffect(() => {
    setNewEtape({ roleValidateur: "", label: "", delaiHeures: 72, actionExpiration: "RELANCE", optionnel: false });
  }, [expandedCircuit]);


  const fetchOrgData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [deptRes, userRes] = await Promise.all([
        fetch("http://localhost:8080/api/departements", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/utilisateurs/directory", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (userRes.ok) setAllUsers(await userRes.json());
    } catch (err) { console.error(err); }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/utilisateurs/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setCurrentUser(await res.json());
    } catch (err) { console.error("Error fetching user data:", err); }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const [sysRes, leaveRes, holidayRes, postesRes, sitesRes, deptRes] = await Promise.all([
        fetch("http://localhost:8080/api/config/system", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/config/leave-types", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/config/holidays", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/config/postes", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/config/sites", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8080/api/departements", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      
      if (sysRes.ok) setConfig(await sysRes.json());
      if (leaveRes.ok) setLeaveTypes(await leaveRes.json());
      if (holidayRes.ok) setHolidays(await holidayRes.json());
      if (postesRes.ok) setPostes(await postesRes.json());
      if (sitesRes.ok) setSites(await sitesRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (err) { console.error("Error in fetchConfig:", err); }
  };

  const handleSaveConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Clean config to avoid NaN or null in numeric fields
      const cleanedConfig = { ...config };
      
      // Convert numeric fields and handle NaN
      const numFields = ['toleranceMinutes', 'urgencyDelayHours', 'signatureX', 'signatureY', 'stampX', 'stampY'];
      numFields.forEach(field => {
        const val = parseInt(cleanedConfig[field]);
        cleanedConfig[field] = isNaN(val) ? 0 : val;
      });

      // Ensure idConfig is a number if it exists
      if (cleanedConfig.idConfig) {
        cleanedConfig.idConfig = parseInt(cleanedConfig.idConfig.toString());
      }

      const res = await fetch("http://localhost:8080/api/config/system", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cleanedConfig)
      });

      if (res.ok) {
        alert("✅ Configuration enregistrée avec succès !");
        fetchConfig();
      } else {
        const errorText = await res.text();
        alert("❌ Erreur (" + res.status + ") : " + (errorText || "Action impossible."));
      }
    } catch (err: any) {
      console.error("Error saving config:", err);
      alert("❌ Erreur : " + err.message);
    }
  };
  
  const handleCreateLeaveType = async () => {
    if (!newLeaveType.nom.trim()) {
      alert("⚠️ Le nom du type de congé est requis.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/config/leave-types", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newLeaveType)
      });
      if (res.ok) {
        alert("✅ Type de congé créé avec succès !");
        setShowCreateLeaveModal(false);
        setNewLeaveType({
          nom: "",
          quotaInitial: 30,
          justificatifObligatoire: false,
          couleurHex: "#3B82F6",
          description: ""
        });
        fetchConfig();
      } else {
        const errorText = await res.text();
        alert("❌ Erreur : " + (errorText || res.statusText));
      }
    } catch (err: any) {
      console.error("Error creating leave type:", err);
      alert("❌ Erreur : " + err.message);
    }
  };

  const handleUpdateLeaveType = async (type: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/config/leave-types", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(type)
      });
      if (res.ok) {
        alert("✅ Type de congé mis à jour !");
        setEditingLeaveId(null);
        fetchConfig();
      } else {
        const errorText = await res.text();
        alert("❌ Erreur : " + (errorText || res.statusText));
      }
    } catch (err) { 
      console.error(err);
      alert("❌ Erreur réseau ou serveur.");
    }
  };

  const handleCreatePoste = async () => {
    if (!newPosteTitre) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/config/postes", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          titre: newPosteTitre,
          departement: posteMapping ? { idDept: posteMapping } : null
        })
      });
      if (res.ok) {
        setNewPosteTitre("");
        setPosteMapping(null);
        fetchConfig();
        alert("Poste créé avec succès !");
      } else {
        const errorData = await res.text();
        alert("Erreur lors de la création du poste : " + errorData);
      }
    } catch (err) { 
      console.error(err); 
      alert("Erreur de connexion au serveur.");
    }
  };

  const handleDeletePoste = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/config/postes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchConfig();
        alert("Poste supprimé.");
      } else {
        const errorMsg = await res.text();
        alert(errorMsg || "Erreur lors de la suppression.");
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateSite = async () => {
    if (!newSite.nomSite) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/config/sites", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newSite)
      });
      if (res.ok) {
        setNewSite({ nomSite: "", ville: "", adresse: "" });
        fetchConfig();
        fetchWorkflowData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteSite = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/config/sites/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchConfig();
        fetchWorkflowData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteMapping = async (id: number) => {
    const ok = await wfDel(`/mappings/${id}`);
    if (ok) fetchWorkflowData();
  };

  const handleCreateHoliday = async () => {
    if (!newHoliday.nom || !newHoliday.date) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/config/holidays", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newHoliday)
      });
      if (res.ok) {
        setNewHoliday({ nom: "", date: "", recurrenceType: "ANNUEL", recurrenceInterval: 1 });
        fetchConfig();
        alert("✅ Jour férié ajouté !");
      } else {
        const errorText = await res.text();
        alert("❌ Erreur : " + (errorText || "Impossible d'ajouter le jour férié."));
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateDept = async () => {
    if (!newDeptName) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/departements", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nomDept: newDeptName })
      });
      if (res.ok) {
        setNewDeptName("");
        fetchOrgData();
      }
    } catch (err) { console.error(err); }
  };

  const handleAssignDeptHead = async () => {
    if (!selectedDeptId || !selectedDeptMgrId) {
        alert("⚠️ Veuillez sélectionner un département et un manager.");
        return;
    }
    try {
      const token = localStorage.getItem("token");
      const dept: any = departments.find((d: any) => d.idDept === selectedDeptId);
      
      if (!dept) {
        alert("❌ Département introuvable dans la liste locale.");
        return;
      }

      const res = await fetch(`http://localhost:8080/api/departements/${selectedDeptId}?forceOverwriteAll=${forceOverwriteAll}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          idDept: dept.idDept,
          nomDept: dept.nomDept,
          manager: { idUser: selectedDeptMgrId } 
        })
      });

      if (res.ok) {
        alert("✅ Responsable de département assigné avec succès !");
        fetchOrgData();
        setForceOverwriteAll(false);
        setSelectedDeptId(null);
        setSelectedDeptMgrId(null);
      } else {
        const errorText = await res.text();
        alert("❌ Erreur lors de l'assignation : " + (errorText || res.statusText));
      }
    } catch (err: any) {
      console.error(err);
      alert("❌ Erreur : " + err.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/document-templates", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setTemplates(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreateTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/document-templates", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTemplate)
      });
      if (res.ok) {
        setNewTemplate({ nom: "", description: "", categorie: "ADMINISTRATIF" });
        fetchTemplates();
      }
    } catch (err) { console.error(err); }
  };

  const handleUploadTemplate = async (id: number, file: File) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`http://localhost:8080/api/document-templates/${id}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) fetchTemplates();
    } catch (err) { console.error(err); }
  };

  const handleUploadSignature = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`http://localhost:8080/api/config/system/signature`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setConfig(updatedConfig);
        alert("Signature mise à jour !");
      }
    } catch (err) { console.error(err); }
  };

  const handleUploadStamp = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`http://localhost:8080/api/config/system/stamp`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setConfig(updatedConfig);
        alert("Cachet mis à jour !");
      }
    } catch (err) { console.error(err); }
  };

  // --- WORKFLOW CRUD ---
  const API = "http://localhost:8080/api/workflow";
  const authH = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

  const fetchWorkflowData = async () => {
    const h = authH();
    const safeJson = (r: Response) => r.ok ? r.json().catch(() => []) : [];
    const [c, m, b, d] = await Promise.all([
      fetch(`${API}/circuits`, { headers: h }).then(safeJson).catch(() => []),
      fetch(`${API}/mappings`, { headers: h }).then(safeJson).catch(() => []),
      fetch(`${API}/bypass-rules`, { headers: h }).then(safeJson).catch(() => []),
      fetch(`${API}/delegations`, { headers: h }).then(safeJson).catch(() => []),
    ]);
    setCircuits(Array.isArray(c) ? c : []);
    setMappings(Array.isArray(m) ? m : []);
    setBypassRules(Array.isArray(b) ? b : []);
    setDelegations(Array.isArray(d) ? d : []);
  };

  const wfPost = async (path: string, body: any): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Session expirée. Veuillez vous reconnecter.");
      router.push("/login");
      return false;
    }
    try {
      const res = await fetch(`${API}${path}`, { method: "POST", headers: { ...authH(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) {
        alert("⚠️ Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        router.push("/login");
        return false;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        alert(`❌ Erreur ${res.status} : ${msg || "Action impossible."}`);
        return false;
      }
      await fetchWorkflowData();
      return true;
    } catch (err: any) {
      alert(`❌ Erreur réseau : ${err?.message || "Connexion impossible. Vérifiez que le serveur est démarré."}`);
      return false;
    }
  };
  const wfPut = async (path: string, body: any): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return false; }
    try {
      const res = await fetch(`${API}${path}`, { method: "PUT", headers: { ...authH(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) { localStorage.removeItem("token"); router.push("/login"); return false; }
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        alert(`❌ Erreur ${res.status} : ${msg || "Action impossible."}`);
        return false;
      }
      await fetchWorkflowData();
      return true;
    } catch (err: any) {
      alert(`❌ Erreur réseau : ${err?.message || "Connexion impossible."}`);
      return false;
    }
  };
  const wfDel = async (path: string): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return false; }
    try {
      const res = await fetch(`${API}${path}`, { method: "DELETE", headers: authH() });
      if (res.status === 401) { localStorage.removeItem("token"); router.push("/login"); return false; }
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        alert(`❌ Erreur ${res.status} : ${msg || "Suppression impossible."}`);
        return false;
      }
      await fetchWorkflowData();
      return true;
    } catch (err: any) {
      alert(`❌ Erreur réseau : ${err?.message || "Connexion impossible."}`);
      return false;
    }
  };

  const handleCreateCircuit = async () => {
    if (!newCircuit.nom) {
      alert("⚠️ Le nom du circuit est requis.");
      return;
    }
    const ok = await wfPost("/circuits", newCircuit);
    if (ok) {
      setNewCircuit({ nom: "", description: "" });
      fetchWorkflowData();
    }
  };

  const handleDeleteCircuit = async (id: number) => {
    if (confirm("Supprimer ce circuit ?")) {
      const ok = await wfDel(`/circuits/${id}`);
      if (ok) fetchWorkflowData();
    }
  };

  const handleAddEtape = async (circuitId: number) => {
    if (!newEtape.roleValidateur) {
      alert("⚠️ Veuillez sélectionner un rôle validateur.");
      return;
    }
    const circuit = circuits.find((c: any) => c.idCircuit === circuitId);
    const nextOrdre = (circuit?.etapes?.length || 0) + 1;
    const ok = await wfPost(`/circuits/${circuitId}/etapes`, { ...newEtape, ordre: nextOrdre });
    if (ok) setNewEtape({ roleValidateur: "", label: "", delaiHeures: 72, actionExpiration: "RELANCE", optionnel: false });
  };
  const handleCreateMapping = async () => {
    if (!newMapping.typeRequete || !newMapping.circuitId) return;
    const ok = await wfPost("/mappings", newMapping);
    if (ok) {
      setNewMapping({ typeRequete: "", circuitId: "" });
      fetchWorkflowData();
    }
  };
  const handleCreateBypass = async () => {
    if (!newBypass.nom) return;
    const ok = await wfPost("/bypass-rules", newBypass);
    if (ok) setNewBypass({ nom: "", conditionType: "DEMANDEUR_EST_CHEF", etapeIgnoree: "MANAGER", seuilHeures: 48 });
  };
  const handleCreateDelegation = async () => {
    if (!newDelegation.titulaireId || !newDelegation.delegueId) return;
    const ok = await wfPost("/delegations", newDelegation);
    if (ok) setNewDelegation({ titulaireId: "", delegueId: "", dateDebut: "", dateFin: "" });
  };
  const toggleBypass = (rule: any) => { wfPut(`/bypass-rules/${rule.idRule}`, { ...rule, actif: !rule.actif }); };

  const REQUEST_TYPES = [
    { value: "DEMANDE_CONGE", label: "Demande de Congé (Général)" },
    ...leaveTypes.map((type: any) => ({
      value: "CONGE_" + type.nom.toUpperCase().replaceAll(/[^A-Z0-9_]/g, "_"),
      label: `Congé : ${type.nom}`
    })),
    { value: "ATTESTATION_TRAVAIL", label: "Attestation de Travail" },
    { value: "ATTESTATION_SALAIRE", label: "Attestation de Salaire" },
    { value: "RELEVE_EMOLUMENTS", label: "Relève d'Émoluments" },
    { value: "TITRE_CONGE", label: "Titre de Congé" },
    { value: "BON_SORTIE", label: "Bon de Sortie" },
    { value: "REGULARISATION", label: "Régularisation Pointage" },
    { value: "SITUATION_FAMILIALE", label: "Changement Situation Familiale" },
    { value: "ADRESSE", label: "Changement d'Adresse" },
    { value: "TELEPHONE", label: "Changement de Téléphone" },
  ];

  const tabs = [
    { id: "conges", label: "Politique Congés", icon: <Calendar size={18}/> },
    { id: "temps", label: "Temps & Présences", icon: <Clock size={18}/> },
    { id: "org", label: "Structure & Org", icon: <Users size={18}/> },
    { id: "docs", label: "Templates & Signature", icon: <FileCode size={18}/> },
    { id: "workflow", label: "Circuits de Validation", icon: <GitMerge size={18}/> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tighter uppercase italic">
            Paramétrage <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">RH</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
            <Settings2 size={14} className="text-indigo-400" />
            Configuration du Moteur de Gestion & Politiques Internes
          </p>
        </div>

        {!isReadOnly && (
          <button 
            onClick={handleSaveConfig}
            className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-8 py-5 rounded-[2.5rem] shadow-[0_0_20px_rgba(99,102,241,0.15)] flex items-center gap-4 hover:opacity-90 transition-all font-black text-xs uppercase tracking-widest"
          >
             <Save size={20} /> Enregistrer les changements
          </button>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/85 p-2 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-md w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 rounded-3xl flex items-center gap-3 transition-all duration-300 font-black text-[10px] uppercase tracking-widest
              ${activeTab === tab.id 
                ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-slate-800" 
                : "text-slate-400 hover:text-indigo-400/80"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[4rem] p-12">
        
        {activeTab === "conges" && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                      <Calendar className="text-blue-600" size={24} /> Types de Congés & Quotas
                   </h3>
                   <div className="space-y-4">
                      {leaveTypes.map((type: any) => (
                        <div key={type.idTypeConge} className="bg-slate-950/50 backdrop-blur-md p-6 rounded-3xl flex items-center justify-between border border-slate-800/80 hover:border-indigo-500/30 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-4 h-4 rounded-full shadow-sm shadow-indigo-500/5" style={{ backgroundColor: type.couleurHex }}></div>
                              <div>
                                 <p className="font-black text-slate-200 text-sm uppercase">{type.nom}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{type.quotaInitial} jours / an</p>
                              </div>
                           </div>
                           {!isReadOnly && (
                             <button 
                               onClick={() => setEditingLeaveId(type.idTypeConge)}
                               className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-sm"
                             >
                                <Settings2 size={18} />
                             </button>
                           )}
                        </div>
                      ))}

                      {/* --- LEAVE MODIFICATION MODAL --- */}
                      {editingLeaveId && (
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                          <div className="bg-slate-900 w-full max-w-md rounded-[3rem] border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-950/50 p-8 border-b border-slate-800/80 text-white flex justify-between items-center">
                              <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">Modifier Type Congé</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                  {leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.nom}
                                </p>
                              </div>
                              <button onClick={() => setEditingLeaveId(null)} className="text-slate-400 hover:text-indigo-400 transition-colors">
                                <X size={24} />
                              </button>
                            </div>

                            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Nom du Type de Congé</label>
                                <input 
                                  type="text" 
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-4 px-5 font-bold outline-none transition-all text-sm"
                                  value={leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.nom || ""}
                                  onChange={(e) => {
                                    setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, nom: e.target.value} : t) as any);
                                  }}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Quota Annuel (Jours)</label>
                                <input 
                                  type="number" 
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-4 px-5 font-bold outline-none transition-all text-sm"
                                  value={leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.quotaInitial || 0}
                                  onChange={(e) => {
                                    const newVal = parseInt(e.target.value);
                                    setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, quotaInitial: isNaN(newVal) ? 0 : newVal} : t) as any);
                                  }}
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Couleur Distinctive</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {["#6366F1", "#0EA5E9", "#10B981", "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, couleurHex: color} : t) as any);
                                      }}
                                      className={`w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 border-2 ${
                                        leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.couleurHex === color
                                          ? "border-white scale-105 shadow-md shadow-white/20"
                                          : "border-transparent"
                                      }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                  <input 
                                    type="color" 
                                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                                    value={leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.couleurHex || "#3B82F6"}
                                    onChange={(e) => {
                                      setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, couleurHex: e.target.value} : t) as any);
                                    }}
                                  />
                                </div>
                              </div>

                              <label className="flex items-center justify-between p-2 cursor-pointer bg-slate-950/85 rounded-2xl border border-slate-800/80 group">
                                 <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">Justificatif Obligatoire</span>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="sr-only peer" 
                                      checked={leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.justificatifObligatoire || false} 
                                      onChange={(e) => {
                                        setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, justificatifObligatoire: e.target.checked} : t) as any);
                                      }}
                                    />
                                    <div className="w-11 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-sky-600"></div>
                                 </div>
                              </label>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Description / Remarques</label>
                                <textarea 
                                  rows={2}
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-3 px-4 font-medium outline-none transition-all text-xs resize-none"
                                  value={leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId)?.description || ""}
                                  onChange={(e) => {
                                    setLeaveTypes(leaveTypes.map((t: any) => t.idTypeConge === editingLeaveId ? {...t, description: e.target.value} : t) as any);
                                  }}
                                  placeholder="Ex: Justification médicale requise sous 48h..."
                                />
                              </div>

                              <div className="flex gap-4 pt-4">
                                <button 
                                  onClick={() => setEditingLeaveId(null)}
                                  className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-800 rounded-2xl transition-all"
                                >
                                  Annuler
                                </button>
                                <button 
                                  onClick={() => {
                                    const type = leaveTypes.find((t: any) => t.idTypeConge === editingLeaveId);
                                    handleUpdateLeaveType(type);
                                  }}
                                  className="flex-1 bg-gradient-to-r from-indigo-600 to-sky-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- LEAVE CREATION MODAL --- */}
                      {showCreateLeaveModal && (
                        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                          <div className="bg-slate-900 w-full max-w-md rounded-[3rem] border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-950/50 p-8 border-b border-slate-800/80 text-white flex justify-between items-center">
                              <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">Ajouter Type Congé</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Créer une nouvelle catégorie d'absence</p>
                              </div>
                              <button onClick={() => setShowCreateLeaveModal(false)} className="text-slate-400 hover:text-indigo-400 transition-colors">
                                <X size={24} />
                              </button>
                            </div>

                            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Nom du Type de Congé</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Congé Paternité, Sans Solde..."
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-4 px-5 font-bold outline-none transition-all text-sm"
                                  value={newLeaveType.nom}
                                  onChange={(e) => setNewLeaveType({...newLeaveType, nom: e.target.value})}
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Quota Annuel Initial (Jours)</label>
                                <input 
                                  type="number" 
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-4 px-5 font-bold outline-none transition-all text-sm"
                                  value={newLeaveType.quotaInitial}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setNewLeaveType({...newLeaveType, quotaInitial: isNaN(val) ? 0 : val});
                                  }}
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Couleur Distinctive</label>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {["#6366F1", "#0EA5E9", "#10B981", "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setNewLeaveType({...newLeaveType, couleurHex: color})}
                                      className={`w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95 border-2 ${
                                        newLeaveType.couleurHex === color
                                          ? "border-white scale-105 shadow-md shadow-white/20"
                                          : "border-transparent"
                                      }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                  <input 
                                    type="color" 
                                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                                    value={newLeaveType.couleurHex}
                                    onChange={(e) => setNewLeaveType({...newLeaveType, couleurHex: e.target.value})}
                                  />
                                </div>
                              </div>

                              <label className="flex items-center justify-between p-2 cursor-pointer bg-slate-950/85 rounded-2xl border border-slate-800/80 group">
                                 <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">Justificatif Obligatoire</span>
                                 <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="sr-only peer" 
                                      checked={newLeaveType.justificatifObligatoire} 
                                      onChange={(e) => setNewLeaveType({...newLeaveType, justificatifObligatoire: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-sky-600"></div>
                                 </div>
                              </label>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-indigo-400/60 pl-2 tracking-[0.2em]">Description / Remarques</label>
                                <textarea 
                                  rows={2}
                                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 text-white rounded-2xl py-3 px-4 font-medium outline-none transition-all text-xs resize-none"
                                  value={newLeaveType.description}
                                  onChange={(e) => setNewLeaveType({...newLeaveType, description: e.target.value})}
                                  placeholder="Ex: Justification médicale requise sous 48h..."
                                />
                              </div>

                              <div className="flex gap-4 pt-4">
                                <button 
                                  type="button"
                                  onClick={() => setShowCreateLeaveModal(false)}
                                  className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-800 rounded-2xl transition-all"
                                >
                                  Annuler
                                </button>
                                <button 
                                  type="button"
                                  onClick={handleCreateLeaveType}
                                  className="flex-1 bg-gradient-to-r from-indigo-600 to-sky-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                                >
                                  Créer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isReadOnly && (
                        <button 
                          onClick={() => setShowCreateLeaveModal(true)}
                          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                           <Plus size={16} /> Ajouter un type de congé
                        </button>
                      )}
                   </div>
                </div>

                <div className="space-y-8 bg-slate-950/85 p-10 rounded-[3rem] border border-slate-800/80">
                   <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                      <ShieldCheck className="text-indigo-400" size={24} /> Règles de Validation
                   </h3>
                   <div className="space-y-6">
                      <RuleToggle label="Justificatif obligatoire pour Maladie" defaultChecked={true} readOnly={isReadOnly} />
                      <RuleToggle label="Ancienneté bonus (1j après 5 ans)" defaultChecked={true} readOnly={isReadOnly} />
                      <RuleToggle label="Report des jours inutilisés" defaultChecked={false} readOnly={isReadOnly} />
                      <div className="pt-6 border-t border-slate-800/80">
                         <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mb-4">Seuil d&apos;urgence (Relance Auto)</p>
                         <div className="flex items-center gap-4">
                            <input type="range" className="flex-1 accent-indigo-600" min="24" max="168" step="24" value={config.urgencyDelayHours || 48} onChange={(e) => setConfig({...config, urgencyDelayHours: parseInt(e.target.value)})} disabled={isReadOnly} />
                            <span className="font-black text-slate-100 text-lg">{config.urgencyDelayHours || 48}h</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === "temps" && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
             {/* EXPLANATION BOX */}
             <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                 <div className="bg-gradient-to-r from-indigo-600 to-sky-600 p-4 rounded-2xl text-slate-950 shadow-lg">
                    <Clock3 size={24} />
                 </div>
                  <div className="space-y-2">
                     <h4 className="text-lg font-black text-indigo-400 uppercase italic">Sensibilité du Pointage</h4>
                     <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-4xl">
                       C&apos;est ici que tu règles la &quot;sensibilité&quot; du pointage. Ces paramètres influencent directement le calcul automatique des anomalies et des retards sur le tableau de bord.
                     </p>
                  </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-2">
                         <Fingerprint className="text-indigo-400" size={24} /> Horaires & Tolérance
                      </h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-8">Normes SomePharm Distribution</p>
                   </div>
                   
                   <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] shadow-sm space-y-8">
                      <div className="space-y-4">
                         <TimeInput 
                           label="Heure d&apos;entrée (Début retard)" 
                           value={config.workingHoursStart || "08:00"} 
                           onChange={(val: string) => setConfig({...config, workingHoursStart: val})}
                           readOnly={isReadOnly} 
                         />
                         <p className="text-[10px] text-slate-400 italic px-4 font-medium">Le système utilise cette heure pour calculer les retards. Si quelqu&apos;un pointe après, il est en retard par rapport à cette norme.</p>
                      </div>

                      <div className="space-y-4">
                         <TimeInput 
                           label="Heure de sortie standard" 
                           value={config.workingHoursEnd || "17:00"} 
                           onChange={(val: string) => setConfig({...config, workingHoursEnd: val})}
                           readOnly={isReadOnly} 
                         />
                      </div>
                      
                      <div className="bg-sky-500/10 border border-sky-500/20 p-8 rounded-3xl space-y-4 relative overflow-hidden">
                         <div className="absolute right-0 top-0 p-4 opacity-10 text-sky-400">
                            <AlertCircle size={80} />
                         </div>
                         <div className="flex items-center gap-3 text-sky-300 relative z-10">
                            <Clock3 size={20} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Tolérance de Retard</p>
                         </div>
                         <div className="flex items-baseline gap-2 relative z-10">
                            <input 
                              type="number" 
                              value={config.toleranceMinutes || 0} 
                              onChange={(e) => setConfig({...config, toleranceMinutes: parseInt(e.target.value)})}
                              className="bg-slate-950 border border-indigo-500/30 w-20 p-3 rounded-xl text-center font-black text-lg text-sky-300 outline-none focus:border-indigo-400" 
                              disabled={isReadOnly} 
                            />
                            <span className="text-xs font-black text-sky-300 uppercase">minutes</span>
                         </div>
                          <p className="text-[10px] text-sky-300/80 font-bold leading-tight relative z-10">
                             <span className="text-sky-300">IMPORTANT :</span> Très important pour l&apos;ambiance sociale. Le système ne déclenchera pas d&apos;anomalie si l&apos;employé arrive dans cet intervalle. L&apos;anomalie ne commence qu&apos;à {(config.workingHoursStart || "08:00").substring(0,2)}:{String(parseInt((config.workingHoursStart || "08:00").substring(3,5)) + (config.toleranceMinutes || 0) + 1).padStart(2, '0')}.
                          </p>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-2">
                             <Globe className="text-indigo-400" size={24} /> Calendrier des Jours Fériés
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-8">Exemptions Automatiques de Présence</p>
                       </div>
                       {!isReadOnly && (
                         <button 
                           onClick={async () => {
                             const token = localStorage.getItem("token");
                             const res = await fetch("http://localhost:8080/api/config/holidays/import", {
                               method: "POST",
                               headers: { "Authorization": `Bearer ${token}` }
                             });
                             if (res.ok) fetchConfig();
                           }}
                           className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3 shadow-lg"
                         >
                           <Upload size={16} /> Importer Calendrier National
                         </button>
                       )}
                    </div>
                    
                    <div className="bg-slate-950/85 border border-slate-800/80 rounded-[3rem] p-8 space-y-8">
                       <p className="text-xs text-slate-400 font-medium mb-4 bg-slate-950/85 p-4 rounded-2xl border border-slate-800/80">
                         Le bouton &quot;Importer&quot; permet de charger les fêtes nationales. Vous pouvez également ajouter des dates spécifiques manuellement.
                       </p>

                       {!isReadOnly && (
                         <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/80 space-y-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                               <Plus size={14} /> Ajout Manuel d&apos;Exemption
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                               <input 
                                 type="text" 
                                 placeholder="Libellé (ex: Jour de l'An)" 
                                 className="bg-slate-900 border border-slate-800/80 focus:border-indigo-500/30 p-4 rounded-2xl text-[10px] font-bold outline-none text-white transition-all"
                                 value={newHoliday.nom}
                                 onChange={(e) => setNewHoliday({...newHoliday, nom: e.target.value})}
                               />
                               <input 
                                 type="date" 
                                 className="bg-slate-900 border border-slate-800/80 focus:border-indigo-500/30 p-4 rounded-2xl text-[10px] font-bold outline-none text-white transition-all"
                                 value={newHoliday.date}
                                 onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                               />
                               <select 
                                 className="bg-slate-900 border border-slate-800/80 focus:border-indigo-500/30 p-4 rounded-2xl text-[10px] font-bold outline-none text-white transition-all"
                                 value={newHoliday.recurrenceType}
                                 onChange={(e) => setNewHoliday({...newHoliday, recurrenceType: e.target.value})}
                               >
                                 <option value="ANNUEL" className="bg-slate-900 text-white">CHAQUE ANNÉE (FIXE)</option>
                                 <option value="UNIQUE" className="bg-slate-900 text-white">DATE PRÉCISE (UNE FOIS)</option>
                                 <option value="PERIODIQUE" className="bg-slate-900 text-white">TOUS LES X ANS</option>
                               </select>
                               <div className="flex gap-2">
                                 {newHoliday.recurrenceType === "PERIODIQUE" && (
                                   <input 
                                     type="number" 
                                     placeholder="Ans"
                                     className="w-20 bg-slate-900 border border-slate-800/80 focus:border-indigo-500/30 p-4 rounded-2xl text-[10px] font-bold outline-none text-white transition-all"
                                     value={newHoliday.recurrenceInterval}
                                     onChange={(e) => setNewHoliday({...newHoliday, recurrenceInterval: parseInt(e.target.value)})}
                                   />
                                 )}
                                 <button 
                                   onClick={handleCreateHoliday}
                                   className="flex-1 bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-6 rounded-2xl hover:opacity-90 transition-all shadow-lg"
                                 >
                                    <Plus size={20} className="mx-auto" />
                                 </button>
                               </div>
                            </div>
                         </div>
                       )}
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {holidays.map((h: any) => (
                            <div key={h.id} className="flex items-center justify-between bg-slate-950/85 p-5 rounded-2xl border border-slate-800/60 hover:border-slate-800 transition-all group">
                               <div className="flex items-center gap-4">
                                  <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 shadow-sm"><Calendar size={18} /></div>
                                  <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-200 text-xs uppercase">{h.nom}</p>
                                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${
                                          h.recurrenceType === 'ANNUEL' ? 'bg-green-500/10 text-green-400 border border-green-500/10' :
                                          h.recurrenceType === 'PERIODIQUE' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/10' :
                                          'bg-indigo-500/10 text-indigo-300 border border-slate-800/80'
                                        }`}>
                                          {h.recurrenceType === 'ANNUEL' ? 'Annuel' : 
                                           h.recurrenceType === 'PERIODIQUE' ? `Tous les ${h.recurrenceInterval} ans` : 
                                           'Unique'}
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-bold">{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                   </div>
                               </div>
                               {!isReadOnly && (
                                 <button 
                                   onClick={async () => {
                                     const token = localStorage.getItem("token");
                                     await fetch(`http://localhost:8080/api/config/holidays/${h.id}`, {
                                       method: "DELETE",
                                       headers: { "Authorization": `Bearer ${token}` }
                                     });
                                     fetchConfig();
                                   }}
                                   className="text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               )}
                            </div>
                          ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === "org" && (
           <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 {/* DEPARTMENTS */}
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                          <GitMerge className="text-indigo-400" size={24} /> Arborescence des Départements
                       </h3>
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-8">Structure Organisationnelle SomePharm</p>
                    </div>

                    <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] space-y-4">
                       <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {departments.length > 0 ? departments.filter((d: any) => d && d.nomDept).map((dept: any) => (
                             <div key={dept.idDept} className="bg-slate-950/85 p-5 rounded-2xl border border-slate-800/60 flex items-center justify-between group hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                                      <Users size={18} />
                                   </div>
                                   <div>
                                      <span className="font-black text-slate-200 text-xs uppercase tracking-tight">{dept.nomDept}</span>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase">
                                        Resp. : {dept.managerId ? `${dept.managerPrenom} ${dept.managerNom}` : "Non assigné"}
                                      </p>
                                   </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${dept.manager ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-amber-400"}`}></div>
                             </div>
                          )) : (
                             <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun service</p>
                          )}
                       </div>
                       
                       {!isReadOnly && (
                         <div className="flex gap-2 pt-4">
                            <input 
                              type="text" 
                              placeholder="Nouveau service..." 
                              className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-indigo-500/30 text-white shadow-sm"
                              value={newDeptName}
                              onChange={(e) => setNewDeptName(e.target.value)}
                            />
                            <button 
                              onClick={handleCreateDept}
                              className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl hover:opacity-90 shadow-lg"
                            >
                               <Plus size={20} />
                            </button>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* SITES */}
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                          <Globe className="text-indigo-400" size={24} /> Sites & Agences
                       </h3>
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-8">Implantations Géographiques</p>
                    </div>

                    <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] space-y-4">
                       <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {sites.length > 0 ? sites.map((s: any) => (
                             <div key={s.idSite} className="bg-slate-950/85 p-5 rounded-2xl border border-slate-800/60 flex items-center justify-between group hover:border-slate-800 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                      <MapPin size={18} />
                                   </div>
                                   <div>
                                      <span className="font-black text-slate-200 text-xs uppercase">{s.nomSite}</span>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase">{s.ville}</p>
                                   </div>
                                </div>
                                {!isReadOnly && (
                                  <button onClick={() => handleDeleteSite(s.idSite)} className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                     <Trash2 size={16} />
                                  </button>
                                )}
                             </div>
                          )) : (
                             <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase">Aucun site</p>
                          )}
                       </div>

                       {!isReadOnly && (
                          <div className="space-y-3 pt-4 border-t border-slate-800/80">
                             <div className="grid grid-cols-2 gap-3">
                                <input 
                                  type="text" 
                                  placeholder="Nom du site" 
                                  className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-indigo-500/30 text-white shadow-sm"
                                  value={newSite.nomSite}
                                  onChange={(e) => setNewSite({...newSite, nomSite: e.target.value})}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Ville" 
                                  className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-indigo-500/30 text-white shadow-sm"
                                  value={newSite.ville}
                                  onChange={(e) => setNewSite({...newSite, ville: e.target.value})}
                                />
                             </div>
                             <div className="flex gap-2">
                                <input 
                                   type="text" 
                                   placeholder="Adresse" 
                                   className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-indigo-500/30 text-white shadow-sm"
                                   value={newSite.adresse}
                                   onChange={(e) => setNewSite({...newSite, adresse: e.target.value})}
                                />
                                <button 
                                  onClick={handleCreateSite}
                                  className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl hover:opacity-90 transition-all shadow-lg"
                                >
                                   <Plus size={20} />
                                </button>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* POSTES */}
                 <div className="space-y-8 pt-8 border-t border-slate-800/80">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                          <FileCode className="text-indigo-400" size={24} /> Référentiel des Postes
                       </h3>
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-8">Catalogue (Mapping Dept)</p>
                    </div>

                    <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] space-y-4">
                       <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {postes.length > 0 ? 
                            postes.map((poste: any) => (
                             <div key={poste.idPoste} className="bg-slate-950/85 p-5 rounded-2xl border border-slate-800/60 flex items-center justify-between group hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                      <FileCode size={18} />
                                   </div>
                                   <div>
                                      <span className="font-black text-slate-200 text-xs uppercase tracking-tight">{poste.titre}</span>
                                      <p className="text-[9px] text-indigo-400 font-bold uppercase">
                                        {poste.departement ? poste.departement.nomDept : "Global"}
                                      </p>
                                   </div>
                                </div>
                                {!isReadOnly && (
                                  <button 
                                    onClick={() => handleDeletePoste(poste.idPoste)}
                                    className="text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                             </div>
                          )) : (
                             <div className="py-10 text-center space-y-3">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto">
                                   <FileCode size={20} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun poste défini</p>
                                <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto leading-relaxed italic">
                                   Commencez par créer un poste pour le lier à un département et structurer vos services.
                                </p>
                             </div>
                          )}
                       </div>

                       {isHRManager && !isReadOnly && (
                          <div className="pt-4 border-t border-slate-800/80 space-y-3">
                             <input 
                               type="text" 
                               placeholder="Titre du poste" 
                               className="w-full bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold outline-none focus:border-indigo-500/30 text-white shadow-sm"
                               value={newPosteTitre}
                               onChange={(e) => setNewPosteTitre(e.target.value)}
                             />
                             <div className="flex gap-2">
                                <select 
                                  className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500/30 text-white shadow-sm"
                                  value={posteMapping || ""}
                                  onChange={(e) => setPosteMapping(e.target.value ? parseInt(e.target.value) : null)}
                                >
                                   <option value="" className="bg-slate-900 text-white">Lier au Département...</option>
                                   {departments.map((d: any) => (
                                      <option key={d.idDept} value={d.idDept} className="bg-slate-900 text-white">{d.nomDept}</option>
                                   ))}
                                </select>
                                <button 
                                  onClick={handleCreatePoste}
                                  className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl hover:opacity-90 shadow-lg"
                                >
                                   <Plus size={20} />
                                </button>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* HIERARCHY & ROLES */}
                 <div className="lg:col-span-2 space-y-12 bg-slate-950/70 p-10 rounded-[4rem] border border-slate-800/80">
                    <div className="flex items-center justify-between">
                       <div className="space-y-2">
                          <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                             <ShieldCheck className="text-indigo-400" size={24} /> Leadership & Gouvernance
                          </h3>
                          <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest pl-8">Désignation des Chefs de Départements</p>
                       </div>
                    </div>

                    <div className="max-w-2xl">
                       {/* CARD: DEPT MANAGER */}
                       <div className="bg-slate-950/50 p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-sm">
                          <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] flex items-center gap-2">
                             <GitMerge size={14} /> Responsable de Département
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-2">Département cible</label>
                                <select 
                                  className="w-full bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500/30 text-white transition-all"
                                  value={selectedDeptId || ""}
                                  onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
                                >
                                   <option value="" className="bg-slate-900 text-white">Sélectionner...</option>
                                   {departments.map((d: any) => (
                                      <option key={d.idDept} value={d.idDept} className="bg-slate-900 text-white">{d.nomDept}</option>
                                   ))}
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-2">Chef désigné</label>
                                <select 
                                  className="w-full bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500/30 text-white transition-all"
                                  value={selectedDeptMgrId || ""}
                                  onChange={(e) => setSelectedDeptMgrId(parseInt(e.target.value))}
                                >
                                   <option value="" className="bg-slate-900 text-white">Sélectionner...</option>
                                   {allUsers.filter((u: any) => {
                                      const targetDept = departments.find((d: any) => d.idDept === selectedDeptId);
                                      return u.departement === targetDept?.nomDept;
                                   }).map((u: any) => (
                                      <option key={u.idUser} value={u.idUser} className="bg-slate-900 text-white">{u.prenom} {u.nom} ({u.poste})</option>
                                   ))}
                                </select>
                             </div>
                          </div>
                          <div className="pt-2">
                             <label className="flex items-center gap-3 cursor-pointer group bg-slate-900/30 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition-all">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-indigo-400 rounded border-slate-800 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                  checked={forceOverwriteAll}
                                  onChange={(e) => setForceOverwriteAll(e.target.checked)}
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-indigo-400 transition-colors">
                                   Définir comme manager direct pour tous les membres du département
                                </span>
                             </label>
                          </div>
                          <button 
                            onClick={handleAssignDeptHead}
                            disabled={!selectedDeptId || !selectedDeptMgrId || !isHRManager}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all 
                               ${!isHRManager 
                                 ? 'bg-slate-900 text-slate-500 cursor-not-allowed shadow-none border border-slate-800/60' 
                                 : 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-95 shadow-md'}`}
                          >
                             {!isHRManager 
                                ? "Action réservée au HR_MANAGER" 
                                : "Assigner comme Responsable"}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "docs" && (
           <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-12 gap-8">
                 
                 {/* 🔗 COLUMN 1: VARIABLES DICTIONARY */}
                 <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="bg-slate-950/85 p-8 rounded-[3rem] text-slate-100 border border-slate-800/80 shadow-xl relative overflow-hidden">
                       <div className="absolute -right-4 -top-4 opacity-10">
                          <GitMerge size={120} />
                       </div>
                       <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-indigo-400">
                          <Type size={20} /> Dictionnaire
                       </h3>
                       <p className="text-indigo-400/60 text-[10px] font-bold uppercase mt-2 tracking-widest">Mapping Automatique</p>
                       
                       <div className="mt-8 space-y-3">
                          {[
                             { tag: "{{nom_employe}}", label: "Nom de famille" },
                             { tag: "{{prenom_employe}}", label: "Prénom" },
                             { tag: "{{matricule}}", label: "ID Interne" },
                             { tag: "{{poste}}", label: "Intitulé du poste" },
                             { tag: "{{role_employe}}", label: "Rôle de l'employé" },
                             { tag: "{{departement}}", label: "Service" },
                             { tag: "{{date_entree}}", label: "Date d'embauche" },
                             { tag: "{{date_jour}}", label: "Aujourd'hui" },
                             { tag: "{{nom_societe}}", label: "SomePharm" }
                          ].map(v => (
                             <div key={v.tag} className="bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 group hover:bg-slate-900/80 transition-all cursor-copy" onClick={() => navigator.clipboard.writeText(v.tag)}>
                                <p className="font-mono text-[10px] font-bold text-indigo-400">{v.tag}</p>
                                <p className="text-[8px] text-indigo-400/60 font-bold uppercase tracking-tighter">{v.label}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* 📄 COLUMN 2: TEMPLATE MANAGEMENT */}
                 <div className="col-span-12 lg:col-span-6 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                          <FileText className="text-indigo-400" size={24} /> Bibliothèque de Modèles
                       </h3>
                    </div>

                    {/* 👥 Dynamic Test Collaborator Selector */}
                    <div className="bg-slate-950/85 border border-slate-800/80 p-6 rounded-[2rem] space-y-4 shadow-sm">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                             <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                <Users className="text-indigo-400" size={16} /> Collaborateur de test
                             </h4>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Sélectionnez un employé pour prévisualiser les documents avec ses données réelles</p>
                          </div>
                          <div className="w-full md:w-64">
                             <select 
                               className="w-full bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all text-slate-200 cursor-pointer hover:border-indigo-500/40"
                               value={selectedTestEmployee}
                               onChange={(e) => setSelectedTestEmployee(e.target.value)}
                             >
                                <option value="" className="bg-slate-900 text-white">-- Aucun (Données de test par défaut) --</option>
                                {allUsers.map((u: any) => (
                                   <option key={u.idUser} value={u.matricule} className="bg-slate-900 text-white">
                                      {u.prenom} {u.nom} ({u.matricule}) - {u.role || u.role?.nomRole || "Employé"}
                                   </option>
                                ))}
                             </select>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {templates.map((tmpl: any) => (
                          <div key={tmpl.id} className="bg-slate-950/85 border border-slate-800/80 p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-lg hover:border-slate-800 transition-all group">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                                   <FileText size={24} />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <h4 className="font-black text-slate-200 text-sm uppercase">{tmpl.nom}</h4>
                                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">{tmpl.categorie}</span>
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{tmpl.description || "Aucune description"}</p>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                {tmpl.fileUrl ? (
                                  <div className="flex items-center gap-2">
                                     <button 
                                        onClick={async () => {
                                           try {
                                              const token = localStorage.getItem("token");
                                              const queryParam = selectedTestEmployee ? `?matricule=${selectedTestEmployee}` : "";
                                              const res = await fetch(`http://localhost:8080/api/document-templates/${tmpl.id}/generate${queryParam}`, {
                                                 headers: { "Authorization": `Bearer ${token}` }
                                              });
                                              if (res.ok) {
                                                 const blob = await res.blob();
                                                 const pdfBlob = new Blob([blob], { type: "application/pdf" });
                                                 const url = window.URL.createObjectURL(pdfBlob);
                                                 window.open(url, "_blank");
                                              } else {
                                                 alert("Erreur lors de la génération du document de test.");
                                              }
                                           } catch (err) {
                                              console.error(err);
                                           }
                                        }}
                                        className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                        title="Tester la génération de PDF"
                                     >
                                        <Eye size={18} />
                                     </button>
                                     <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-2 rounded-xl text-[8px] font-black uppercase">
                                        <CheckCircle2 size={12} /> Prêt
                                     </div>
                                  </div>
                                ) : !isReadOnly ? (
                                   <label className="cursor-pointer bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                                      <Upload size={12} /> Upload .docx
                                      <input type="file" className="hidden" accept=".docx" onChange={(e) => {
                                         if (e.target.files?.[0]) handleUploadTemplate(tmpl.id, e.target.files[0]);
                                      }} />
                                   </label>
                                 ) : (
                                   <span className="text-[8px] font-black uppercase text-slate-400">Fichier manquant</span>
                                 )}
                                {!isReadOnly && (
                                   <button onClick={() => {
                                      const token = localStorage.getItem("token");
                                      fetch(`http://localhost:8080/api/document-templates/${tmpl.id}`, {
                                         method: "DELETE",
                                         headers: { "Authorization": `Bearer ${token}` }
                                      }).then(() => fetchTemplates());
                                   }} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
                                      <Trash2 size={18} />
                                   </button>
                                )}
                             </div>
                          </div>
                       ))}

                       {/* ADD NEW TEMPLATE CARD */}
                       {!isReadOnly && (
                           <div className="bg-slate-950/20 border-2 border-dashed border-slate-800 p-8 rounded-[2.5rem] space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Plus size={14} /> Nouveau Modèle
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <input 
                                   type="text" 
                                   placeholder="Nom du document (ex: Contrat CDI)" 
                                   className="col-span-2 bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-200"
                                   value={newTemplate.nom}
                                   onChange={(e) => setNewTemplate({...newTemplate, nom: e.target.value})}
                                 />
                                 <select 
                                   className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 text-slate-200"
                                   value={newTemplate.categorie}
                                   onChange={(e) => setNewTemplate({...newTemplate, categorie: e.target.value})}
                                 >
                                    <option value="ADMINISTRATIF" className="bg-slate-900 text-white">Administratif</option>
                                    <option value="LEGAL" className="bg-slate-900 text-white">Légal</option>
                                    <option value="INTERNE" className="bg-slate-900 text-white">Interne</option>
                                 </select>
                                 <button 
                                   onClick={handleCreateTemplate}
                                   className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-indigo-500/5"
                                 >
                                    Enregistrer
                                 </button>
                              </div>
                           </div>
                       )}
                    </div>
                 </div>

                 {/* ✍️ COLUMN 3: SIGNATURES & STAMPS */}
                 <div className="col-span-12 lg:col-span-3 space-y-8">
                    <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                       <Shield className="text-indigo-400" size={24} /> Officiel
                    </h3>

                    <div className="space-y-6">
                       {/* SIGNATURE CARD */}
                       <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] shadow-sm space-y-6">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                             <ImageIcon size={14} /> Signature DRH
                          </p>
                          <div className="aspect-video bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800/80 flex items-center justify-center overflow-hidden group relative">
                             {config.drhSignatureUrl ? (
                                <img src={`http://localhost:8080/uploads/config/${config.drhSignatureUrl}`} alt="Signature" className="max-h-full object-contain" />
                             ) : (
                                <ImageIcon size={32} className="text-slate-700" />
                             )}
                             {!isReadOnly && (
                                 <label className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-slate-200 font-black text-[8px] uppercase tracking-widest">
                                    <Upload size={16} className="mr-2" /> Changer
                                    <input type="file" className="hidden" accept="image/png" onChange={(e) => {
                                       if (e.target.files?.[0]) handleUploadSignature(e.target.files[0]);
                                    }} />
                                 </label>
                             )}
                          </div>
                          <p className="text-[8px] text-slate-400 italic text-center">Format PNG transparent recommandé</p>
                       </div>

                       {/* STAMP CARD */}
                       <div className="bg-slate-950/85 border border-slate-800/80 p-8 rounded-[3rem] shadow-sm space-y-6">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                             <Shield size={14} /> Cachet Entreprise
                          </p>
                          <div className="aspect-square w-32 mx-auto bg-slate-950 rounded-full border-2 border-dashed border-slate-800/80 flex items-center justify-center overflow-hidden group relative">
                             {config.cachetEntrepriseUrl ? (
                                <img src={`http://localhost:8080/uploads/config/${config.cachetEntrepriseUrl}`} alt="Stamp" className="max-h-full object-contain p-4" />
                             ) : (
                                <Shield size={32} className="text-slate-700" />
                             )}
                             {!isReadOnly && (
                                 <label className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer text-slate-200 font-black text-[8px] uppercase tracking-widest">
                                    <Upload size={16} />
                                    <input type="file" className="hidden" accept="image/png" onChange={(e) => {
                                       if (e.target.files?.[0]) handleUploadStamp(e.target.files[0]);
                                    }} />
                                 </label>
                             )}
                          </div>
                       </div>

                       {/* PLACEMENT SETTINGS */}
                       <div className="bg-slate-950/85 border border-slate-800/80 border p-8 rounded-[3rem] text-slate-100 space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <Settings2 size={14} className="text-indigo-400" /> Placement Signature
                          </h4>
                          <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => !isReadOnly && setConfig({...config, signaturePlacement: "BOTTOM_LEFT"})}
                                  className={`p-3 rounded-xl border border-slate-800/80 text-[8px] font-black uppercase transition-all ${config.signaturePlacement === "BOTTOM_LEFT" ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-500/10" : "bg-slate-950 text-slate-300"} ${isReadOnly ? "cursor-default" : ""}`}>En bas à gauche</button>
                                <button 
                                  onClick={() => !isReadOnly && setConfig({...config, signaturePlacement: "BOTTOM_RIGHT"})}
                                  className={`p-3 rounded-xl border border-slate-800/80 text-[8px] font-black uppercase transition-all ${config.signaturePlacement === "BOTTOM_RIGHT" ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-500/10" : "bg-slate-950 text-slate-300"} ${isReadOnly ? "cursor-default" : ""}`}>En bas à droite</button>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Coordonnée X ({config.signatureX}px)</label>
                                <input type="range" className="w-full accent-indigo-600" min="0" max="600" value={config.signatureX} onChange={(e) => setConfig({...config, signatureX: parseInt(e.target.value)})} disabled={isReadOnly} />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Coordonnée Y ({config.signatureY}px)</label>
                                <input type="range" className="w-full accent-indigo-600" min="0" max="800" value={config.signatureY} onChange={(e) => setConfig({...config, signatureY: parseInt(e.target.value)})} disabled={isReadOnly} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* ⚙️ FINAL SECTION: GENERATION PARAMS */}
              <div className="bg-slate-950/85 border border-slate-800/80 p-10 rounded-[4rem] grid grid-cols-1 md:grid-cols-3 gap-12">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400">
                       <ShieldCheck size={24} />
                       <h4 className="text-lg font-black uppercase italic">Sécurité PDF</h4>
                    </div>
                    <p className="text-slate-300 text-xs font-medium leading-relaxed">
                       Tous les documents sont générés au format PDF/A non modifiable pour garantir l&apos;intégrité des données juridiques.
                    </p>
                 </div>
                 
                 <div className="space-y-4 border-x border-slate-800/80 px-12">
                    <div className="flex items-center gap-3 text-indigo-400">
                       <Type size={24} />
                       <h4 className="text-lg font-black uppercase italic">Filigrane</h4>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                       <span className="text-[10px] font-black uppercase text-slate-400">Ajouter &quot;COPIE&quot;</span>
                       <RuleToggle defaultChecked={false} readOnly={isReadOnly} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400">
                       <Clock3 size={24} />
                       <h4 className="text-lg font-black uppercase italic">Traçabilité</h4>
                    </div>
                    <div className="flex items-center gap-2">
                       <input type="text" defaultValue="REF-" className="bg-slate-950 border border-slate-800/80 w-16 p-3 rounded-xl text-center font-black text-xs text-slate-100 focus:border-indigo-500" disabled={isReadOnly} />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">+ Numérotation incrémentale</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "workflow" && (
           <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">

              {/* ═══════ SECTION 1: WORKFLOW BUILDER ═══════ */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3">
                       <GitMerge className="text-indigo-400" size={24} /> Créateur de Séquences
                    </h3>
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    {circuits.map((circuit: any) => (
                       <div key={circuit.idCircuit} className="bg-slate-950/85 border border-slate-800/80 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/30 transition-all">
                          <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedCircuit(expandedCircuit === circuit.idCircuit ? null : circuit.idCircuit)}>
                             <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${circuit.actif ? "bg-indigo-500/10 text-indigo-400 border border-slate-800" : "bg-slate-900/85 text-slate-500 border border-slate-800/60"}`}>
                                   <GitMerge size={24} />
                                </div>
                                <div>
                                   <div className="flex items-center gap-3">
                                      <h4 className="font-black text-slate-100 text-sm uppercase">{circuit.nom}</h4>
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${circuit.actif ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-900 text-slate-500 border border-slate-800/60"}`}>
                                         {circuit.actif ? "Actif" : "Inactif"}
                                      </span>
                                      <span className="bg-indigo-500/10 text-indigo-400 border border-slate-800 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                                         {circuit.etapes?.length || 0} étapes
                                      </span>
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{circuit.description || "Aucune description"}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                {!isReadOnly && <button onClick={(e) => { e.stopPropagation(); wfDel(`/circuits/${circuit.idCircuit}`); }} className="p-3 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>}
                                {expandedCircuit === circuit.idCircuit ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                             </div>
                          </div>

                          {expandedCircuit === circuit.idCircuit && (
                             <div className="border-t border-slate-800/80 p-8 bg-slate-950/20 space-y-6">
                                {/* Steps Timeline */}
                                <div className="flex items-center gap-2 flex-wrap">
                                   {(circuit.etapes || []).map((etape: any, i: number) => (
                                      <div key={etape.idEtape} className="flex items-center gap-2">
                                         <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-2 min-w-[200px] group relative">
                                            <div className="flex items-center justify-between">
                                               <span className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">{etape.ordre}</span>
                                               {!isReadOnly && <button onClick={() => wfDel(`/etapes/${etape.idEtape}`)} className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>}
                                            </div>
                                            <p className="font-black text-[10px] text-slate-100 uppercase">{etape.label || etape.roleValidateur}</p>
                                            <div className="flex flex-wrap gap-1">
                                               <span className="bg-indigo-500/10 text-indigo-400 border border-slate-800 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">{etape.roleValidateur}</span>
                                               {etape.optionnel && <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">Optionnel</span>}
                                               <span className="bg-slate-900 text-slate-400 border border-slate-800/60 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">{etape.delaiHeures}h SLA</span>
                                               <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">{etape.actionExpiration}</span>
                                            </div>
                                         </div>
                                         {i < (circuit.etapes?.length || 0) - 1 && <ArrowRight size={16} className="text-indigo-500/30" />}
                                      </div>
                                   ))}
                                </div>

                                {/* Add Step Form */}
                                {!isReadOnly && (
                                   <div className="bg-slate-950/85 border-2 border-dashed border-slate-800 p-6 rounded-2xl space-y-4">
                                      <h5 className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest mb-4 flex items-center gap-2"><Plus size={12} /> Ajouter une étape</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Rôle</label>
                                            <select className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-black uppercase text-slate-100 outline-none focus:border-indigo-500/40" value={newEtape.roleValidateur} onChange={(e) => setNewEtape({...newEtape, roleValidateur: e.target.value})}>
                                                <option value="" className="bg-slate-900 text-white">Sélectionner...</option>
                                                {(() => {
                                                    const ROLE_WEIGHTS: Record<string, number> = { "MANAGER": 1, "CHEF_DEPARTEMENT": 2, "RH_ADMIN": 3, "HR_MANAGER": 4 };
                                                    const lastStep = circuit.etapes?.[circuit.etapes.length - 1];
                                                    const minWeight = lastStep ? (ROLE_WEIGHTS[lastStep.roleValidateur] || 0) : 0;
                                                    return [
                                                        { val: "MANAGER", label: "Manager (N+1)" },
                                                        { val: "CHEF_DEPARTEMENT", label: "Chef Département" },
                                                        { val: "RH_ADMIN", label: "Ressources Humaines" },
                                                        { val: "HR_MANAGER", label: "Directeur RH" }
                                                    ].filter(opt => (ROLE_WEIGHTS[opt.val] || 0) > minWeight).map(opt => (
                                                        <option key={opt.val} value={opt.val} className="bg-slate-900 text-white">{opt.label}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Label affiché</label>
                                            <input type="text" placeholder="Ex: Validation Manager" className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newEtape.label} onChange={(e) => setNewEtape({...newEtape, label: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase pl-1">SLA (heures)</label>
                                            <input type="number" placeholder="72" className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newEtape.delaiHeures} onChange={(e) => setNewEtape({...newEtape, delaiHeures: parseInt(e.target.value) || 72})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Si délai dépassé</label>
                                            <select className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-black uppercase text-slate-100 outline-none focus:border-indigo-500/40" value={newEtape.actionExpiration} onChange={(e) => setNewEtape({...newEtape, actionExpiration: e.target.value})}>
                                                <option value="RELANCE" className="bg-slate-900 text-white">Relance auto</option>
                                                <option value="ESCALADE" className="bg-slate-900 text-white">Escalade N+2</option>
                                                <option value="AUTO_VALIDATION" className="bg-slate-900 text-white">Auto-Validation</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 bg-sky-500/5 p-3 rounded-xl border border-sky-500/10">
                                            <input
                                                type="checkbox"
                                                id={`optionnel-${circuit.idCircuit}`}
                                                checked={newEtape.optionnel}
                                                onChange={(e) => setNewEtape({...newEtape, optionnel: e.target.checked})}
                                                className="w-4 h-4 text-sky-400 rounded border-slate-800 bg-slate-900 focus:ring-0 focus:ring-offset-0"
                                            />
                                            <label htmlFor={`optionnel-${circuit.idCircuit}`} className="text-[9px] font-black text-sky-400 uppercase cursor-pointer">Optionnel</label>
                                        </div>
                                        <button
                                            onClick={() => handleAddEtape(circuit.idCircuit)}
                                            disabled={!newEtape.roleValidateur}
                                            className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                newEtape.roleValidateur
                                                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/5'
                                                    : 'bg-slate-900 text-slate-500 border border-slate-800/60 cursor-not-allowed'
                                            }`}
                                        >
                                            + Ajouter
                                        </button>
                                      </div>
                                   </div>
                                )}
                             </div>
                          )}
                       </div>
                    ))}

                    {/* New Circuit Form */}
                    {!isReadOnly && (
                      <div className="bg-slate-950/85 border-2 border-dashed border-slate-800/80 p-8 rounded-[2.5rem] space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Plus size={14} /> Nouveau Circuit</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" placeholder="Nom (ex: Circuit Complet)" className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-xs font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newCircuit.nom} onChange={(e) => setNewCircuit({...newCircuit, nom: e.target.value})} />
                            <input type="text" placeholder="Description" className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-xs font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newCircuit.description} onChange={(e) => setNewCircuit({...newCircuit, description: e.target.value})} />
                            <button onClick={handleCreateCircuit} className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-indigo-500/5">Créer</button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* ═══════ SECTION 2: MAPPING ═══════ */}
              <div className="bg-gradient-to-br from-slate-950 to-indigo-950/30 border border-slate-800/80 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden space-y-8">
                 <div className="absolute -right-8 -top-8 opacity-5"><Globe size={200} className="text-indigo-400" /></div>
                 <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-indigo-400"><Globe size={20} /> Mapping par Type de Demande</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Association Type → Circuit</p>

                 <div className="space-y-3">
                    {mappings.map((m: any) => (
                       <div key={m.idMapping} className="bg-slate-900/85 backdrop-blur-md p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <span className="font-black text-sm text-slate-100">{REQUEST_TYPES.find(t => t.value === m.typeRequete)?.label || m.typeRequete}</span>
                             <ArrowRight size={16} className="text-indigo-400/40" />
                             {!isReadOnly ? (
                               <select
                                 className="bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-200 outline-none cursor-pointer hover:border-indigo-500/30 transition-colors"
                                 value={m.circuit?.idCircuit ?? ""}
                                 onChange={(e) => { if (e.target.value) wfPost("/mappings", { typeRequete: m.typeRequete, circuitId: e.target.value }); }}
                               >
                                 {circuits.map((c: any) => (
                                   <option key={c.idCircuit} value={c.idCircuit} className="bg-slate-900 text-white">{c.nom}</option>
                                 ))}
                               </select>
                             ) : (
                               <span className="bg-slate-950 border border-slate-800/80 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-300">{m.circuit?.nom}</span>
                             )}
                          </div>
                          {!isReadOnly && <button onClick={() => wfDel(`/mappings/${m.idMapping}`)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>}
                       </div>
                    ))}
                 </div>

                 {!isReadOnly && REQUEST_TYPES.filter(t => !mappings.some((m: any) => m.typeRequete === t.value)).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
                       <select className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none text-slate-100" value={newMapping.typeRequete} onChange={(e) => setNewMapping({...newMapping, typeRequete: e.target.value})}>
                          <option value="" className="bg-slate-900 text-white">Type de demande...</option>
                          {REQUEST_TYPES.filter(t => !mappings.some((m: any) => m.typeRequete === t.value)).map(t => <option key={t.value} value={t.value} className="bg-slate-900 text-white">{t.label}</option>)}
                       </select>
                       <select className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase outline-none text-slate-100" value={newMapping.circuitId} onChange={(e) => setNewMapping({...newMapping, circuitId: e.target.value})}>
                          <option value="" className="bg-slate-900 text-white">Circuit...</option>
                          {circuits.map((c: any) => <option key={c.idCircuit} value={c.idCircuit} className="bg-slate-900 text-white">{c.nom}</option>)}
                       </select>
                       <button onClick={handleCreateMapping} className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-indigo-500/5">Associer</button>
                    </div>
                  )}
              </div>

              {/* ═══════ SECTION 3: BYPASS RULES ═══════ */}
              <div className="space-y-8">
                 <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3"><Zap className="text-sky-400" size={24} /> Règles de Bypass</h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bypassRules.map((rule: any) => (
                       <div key={rule.idRule} className={`p-6 rounded-[2rem] border transition-all ${rule.actif ? "bg-slate-950/85 border-sky-500/20 shadow-lg shadow-indigo-500/5" : "bg-slate-900/85 border-slate-800/60 opacity-60"}`}>
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="font-black text-sm text-slate-100 uppercase">{rule.nom}</h4>
                             <div className="flex items-center gap-2">
                                <button onClick={() => toggleBypass(rule)} className={`w-10 h-6 rounded-full transition-all relative ${rule.actif ? "bg-indigo-600" : "bg-slate-800 border border-slate-800/80"}`}>
                                   <div className={`w-4 h-4 bg-slate-950 border border-slate-800 rounded-full absolute top-[3px] transition-all ${rule.actif ? "right-[3px]" : "left-[3px]"}`} />
                                </button>
                                <button onClick={() => wfDel(`/bypass-rules/${rule.idRule}`)} className="text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                             </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                             <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{rule.conditionType.replace(/_/g, " ")}</span>
                             <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase">Skip: {rule.etapeIgnoree}</span>
                             {rule.seuilHeures && <span className="bg-indigo-500/10 text-indigo-400 border border-slate-800 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{rule.seuilHeures}h</span>}
                          </div>
                       </div>
                    ))}

                    {/* New Bypass Rule */}
                    {!isReadOnly && (
                      <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-800/80 space-y-4 bg-slate-950/20">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Plus size={12} /> Nouvelle Règle</h4>
                         <input type="text" placeholder="Nom de la règle" className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newBypass.nom} onChange={(e) => setNewBypass({...newBypass, nom: e.target.value})} />
                         <select className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-black uppercase text-slate-100 outline-none focus:border-indigo-500/40" value={newBypass.conditionType} onChange={(e) => setNewBypass({...newBypass, conditionType: e.target.value})}>
                            <option value="DEMANDEUR_EST_CHEF" className="bg-slate-900 text-white">Demandeur est Chef Dept.</option>
                            <option value="MANAGER_INACTIF" className="bg-slate-900 text-white">Manager Inactif</option>
                            <option value="SEUIL_URGENCE" className="bg-slate-900 text-white">Seuil d&apos;Urgence</option>
                         </select>
                         <select className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-black uppercase text-slate-100 outline-none focus:border-indigo-500/40" value={newBypass.etapeIgnoree} onChange={(e) => setNewBypass({...newBypass, etapeIgnoree: e.target.value})}>
                            <option value="MANAGER" className="bg-slate-900 text-white">Étape Manager</option>
                            <option value="CHEF_DEPARTEMENT" className="bg-slate-900 text-white">Étape Chef Dept.</option>
                         </select>
                         <input type="number" placeholder="Seuil (heures)" className="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] font-bold text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/40" value={newBypass.seuilHeures} onChange={(e) => setNewBypass({...newBypass, seuilHeures: parseInt(e.target.value) || 48})} />
                         <button onClick={handleCreateBypass} className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-indigo-500/5">Créer la Règle</button>
                      </div>
                    )}
                 </div>
              </div>

              {/* ═══════ SECTION 4: SLA OVERVIEW ═══════ */}
              <div className="bg-slate-950/85 border border-slate-800/80 p-10 rounded-[3rem] text-white space-y-8">
                 <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2"><Clock3 size={20} className="text-indigo-400" /> Délais &amp; Escalades (SLA)</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Vue consolidée des délais par circuit</p>

                 <div className="space-y-6">
                    {circuits.map((circuit: any) => (
                       <div key={circuit.idCircuit} className="bg-slate-900/85 border border-slate-800/80 p-6 rounded-2xl space-y-4">
                          <h4 className="font-black text-sm text-slate-200 uppercase">{circuit.nom}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                             {(circuit.etapes || []).map((etape: any, i: number) => (
                                <div key={etape.idEtape} className="flex items-center gap-2">
                                   <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1 min-w-[140px]">
                                      <p className="text-[9px] font-black text-indigo-400 uppercase">{etape.roleValidateur}</p>
                                      <p className="text-white font-black text-lg">{etape.delaiHeures}h</p>
                                      <p className={`text-[8px] font-bold uppercase ${etape.actionExpiration === "RELANCE" ? "text-indigo-300" : etape.actionExpiration === "ESCALADE" ? "text-red-400" : "text-green-400"}`}>
                                         {etape.actionExpiration === "RELANCE" ? "↻ Relance auto" : etape.actionExpiration === "ESCALADE" ? "⬆ Escalade N+2" : "✓ Auto-validation"}
                                      </p>
                                   </div>
                                   {i < (circuit.etapes?.length || 0) - 1 && <ArrowRight size={14} className="text-indigo-400/20" />}
                                </div>
                             ))}
                             {(!circuit.etapes || circuit.etapes.length === 0) && <p className="text-slate-500 text-[10px] italic">Aucune étape configurée</p>}
                          </div>
                       </div>
                    ))}
                    {circuits.length === 0 && <p className="text-slate-500 text-sm italic text-center py-8">Créez un circuit ci-dessus pour configurer les SLA</p>}
                 </div>
              </div>

              {/* ═══════ SECTION 5: DELEGATION ═══════ */}
              <div className="space-y-8">
                 <h3 className="text-xl font-black text-slate-100 uppercase italic flex items-center gap-3"><UserMinus className="text-indigo-400" size={24} /> Délégation &amp; Remplacement</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-8">Gestion des absences validateurs — HR uniquement</p>

                 <div className="grid grid-cols-1 gap-4">
                    {delegations.map((d: any) => (
                       <div key={d.idDelegation} className="bg-slate-950/85 border border-slate-800/80 p-6 rounded-[2rem] flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-indigo-500/10 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400"><RefreshCw size={20} /></div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <span className="font-black text-sm text-slate-100">{d.titulaire?.prenom} {d.titulaire?.nom}</span>
                                   <ArrowRight size={14} className="text-indigo-400/40" />
                                   <span className="font-black text-sm text-indigo-400">{d.delegue?.prenom} {d.delegue?.nom}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{d.dateDebut} → {d.dateFin} {d.actif ? "• Actif" : "• Expiré"}</p>
                             </div>
                          </div>
                          <button onClick={() => wfDel(`/delegations/${d.idDelegation}`)} className="text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                       </div>
                    ))}

                    {/* New Delegation Form */}
                    {!isReadOnly && (
                      <div className="bg-slate-950/85 border-2 border-dashed border-slate-800/80 p-8 rounded-[2rem] space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Plus size={14} /> Nouvelle Délégation</h4>
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <select className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-100 outline-none" value={newDelegation.titulaireId} onChange={(e) => setNewDelegation({...newDelegation, titulaireId: e.target.value})}>
                               <option value="" className="bg-slate-900 text-white">Titulaire absent...</option>
                               {allUsers.filter((u: any) => u.role?.nomRole === "MANAGER" || u.role?.nomRole === "HR_MANAGER").map((u: any) => (
                                  <option key={u.idUser} value={u.idUser} className="bg-slate-900 text-white">{u.prenom} {u.nom}</option>
                               ))}
                            </select>
                            <select className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-100 outline-none" value={newDelegation.delegueId} onChange={(e) => setNewDelegation({...newDelegation, delegueId: e.target.value})}>
                               <option value="" className="bg-slate-900 text-white">Remplaçant...</option>
                               {allUsers.filter((u: any) => u.role?.nomRole === "MANAGER" || u.role?.nomRole === "HR_MANAGER").map((u: any) => (
                                  <option key={u.idUser} value={u.idUser} className="bg-slate-900 text-white">{u.prenom} {u.nom}</option>
                               ))}
                            </select>
                            <input type="date" className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold text-slate-100 outline-none focus:border-indigo-500/40" value={newDelegation.dateDebut} onChange={(e) => setNewDelegation({...newDelegation, dateDebut: e.target.value})} />
                            <input type="date" className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl text-[10px] font-bold text-slate-100 outline-none focus:border-indigo-500/40" value={newDelegation.dateFin} onChange={(e) => setNewDelegation({...newDelegation, dateFin: e.target.value})} />
                            <button onClick={handleCreateDelegation} className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-indigo-500/5">Déléguer</button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

           </div>
        )}

      </div>
    </div>
  );
}

function RuleToggle({ label, defaultChecked, readOnly }: any) {
  return (
    <label className={`flex items-center justify-between p-2 group ${readOnly ? "cursor-default" : "cursor-pointer"}`}>
       <span className={`text-xs font-bold transition-colors ${readOnly ? "text-slate-500" : "text-slate-300 group-hover:text-indigo-400"}`}>{label}</span>
       <div className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} disabled={readOnly} />
          <div className="w-11 h-6 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-sky-600"></div>
       </div>
    </label>
  );
}

function TimeInput({ label, value, readOnly, onChange }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60">{label}</label>
       <div className={`flex items-center gap-3 border p-4 rounded-2xl ${readOnly ? "bg-slate-950/20 border-slate-800/60 text-slate-500" : "bg-slate-950 border border-slate-800/80 text-slate-100"} transition-all focus-within:border-indigo-500/40`}>
          <Clock3 className="text-slate-400" size={20} />
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent font-mono font-black outline-none w-full" 
            disabled={readOnly} 
          />
       </div>
    </div>
  );
}

