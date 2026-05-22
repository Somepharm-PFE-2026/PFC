"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, List, Network, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Filter, CheckCircle, XCircle, ShieldCheck, Key, AlertTriangle, Copy, Check, Eye
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import EmployeeTree from "../../components/EmployeeTree";
import ProfileConsultationModal from "./components/ProfileConsultationModal";

export default function CollaborateursPage() {
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [consultingEmployee, setConsultingEmployee] = useState<any>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [originalPoste, setOriginalPoste] = useState<string | null>(null);
  const [originalDept, setOriginalDept] = useState<string | null>(null);
  const [postes, setPostes] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [activationResult, setActivationResult] = useState<any>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.nom || ""} ${emp.prenom || ""}`.toLowerCase();
    const matricule = (emp.matricule || "").toLowerCase();
    const poste = (emp.poste || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || matricule.includes(query) || poste.includes(query);
  });


  let roleName = typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.nomRole;
  if (roleName && roleName.startsWith("ROLE_")) {
    roleName = roleName.replace("ROLE_", "");
  }
  const isHRManager = roleName === "HR_MANAGER" || roleName === "SUPER_ADMIN" || roleName === "RH_ADMIN";
  const canSeeSensitiveInfo = false; 
  const isSuperAdmin = roleName === "SUPER_ADMIN";



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: any = jwtDecode(token);
      let role = decoded.role;
      if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
      setCurrentUser({ ...decoded, role });
      fetchEmployees(token);
      fetchDepartments(token);
      fetchPostes(token);
      fetchSites(token);
    }
  }, []);

  const fetchSites = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/config/sites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setSites(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/departements", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setDepartments(await response.json());
      }
    } catch (err) { console.error(err); }
  };

  const fetchPostes = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/config/postes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setPostes(await response.json());
      }
    } catch (err) { console.error(err); }
  };

  const getPositionLevel = (titre: string | null) => {
    if (!titre) return 3;
    const t = titre.toUpperCase();
    if (t.startsWith("RESPONSABLE DE")) return 1;
    if (t.includes("CHEF") || t.includes("MANAGER") || t.includes("RESPONSABLE")) return 2;
    return 3;
  };

  const fetchEmployees = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/utilisateurs/directory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/utilisateurs/${id}/activate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setActivationResult(result);
        setShowActivationModal(true);
        fetchEmployees(token!);
      }
    } catch (err) {
      console.error("Activation failed", err);
    }
  };

  const handleResetPassword = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/utilisateurs/${id}/reset-password-super`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setActivationResult(result);
        setShowActivationModal(true);
        fetchEmployees(token!);
      }
    } catch (err) {
      console.error("Reset failed", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    nom: "", prenom: "", email: "", roleId: 3, 
    departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
    managerId: "", siteId: "", situationFamiliale: "CELIBATAIRE"
  });

  // Auto-assign Role based on Department
  useEffect(() => {
    let targetRoleId = 3; // Default EMPLOYE (Corrected from 4)
    const dept = (newEmployeeForm.departement || "").toUpperCase();
    
    if (dept.includes("SECURITE") || dept.includes("SÉCURITÉ")) {
      targetRoleId = 6; // SECURITY_AGENTS (Corrected from 7)
    } else if (dept.includes("RESSOURCES HUMAINES") || dept.includes("RH")) {
      targetRoleId = 1; // RH_ADMIN (Confirmed as 1)
    }
    
    if (newEmployeeForm.roleId !== targetRoleId) {
      setNewEmployeeForm({ ...newEmployeeForm, roleId: targetRoleId });
    }
  }, [newEmployeeForm.departement]);

  // Auto-assign Role based on Department for EDIT modal
  useEffect(() => {
    if (!editingEmployee || !showEditModal) return;
    
    const dept = (editingEmployee.departement || "").toUpperCase();
    let targetRoleId = null;

    if (dept.includes("SECURITE") || dept.includes("SÉCURITÉ")) {
      targetRoleId = 6; // Corrected from 7
    } else if (dept.includes("RESSOURCES HUMAINES") || dept.includes("RH")) {
      targetRoleId = 1;
    }

    if (targetRoleId && targetRoleId !== editingEmployee.roleId) {
      setEditingEmployee({ ...editingEmployee, roleId: targetRoleId });
    }
  }, [editingEmployee?.departement, showEditModal]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8080/api/utilisateurs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: newEmployeeForm.nom,
          prenom: newEmployeeForm.prenom,
          email: newEmployeeForm.email,
          role: { idRole: newEmployeeForm.roleId },
          departement: departments.find(d => d.nomDept === newEmployeeForm.departement) ? { idDept: departments.find(d => d.nomDept === newEmployeeForm.departement).idDept } : null,
          poste: postes.find(p => p.titre === newEmployeeForm.poste) ? { idPoste: postes.find(p => p.titre === newEmployeeForm.poste).idPoste } : null,
          dateEmbauche: newEmployeeForm.dateEmbauche,
          situationFamiliale: newEmployeeForm.situationFamiliale,
          managerDirect: newEmployeeForm.managerId === "null" ? null : (newEmployeeForm.managerId ? { idUser: parseInt(newEmployeeForm.managerId) } : null),
          site: newEmployeeForm.siteId ? { idSite: parseInt(newEmployeeForm.siteId) } : null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewEmployeeForm({
          nom: "", prenom: "", email: "", roleId: 4, 
          departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
          managerId: "", siteId: "", situationFamiliale: "CELIBATAIRE"
        });
        fetchEmployees(token!);
      } else {
        const errorText = await response.text();
        alert(errorText || "Erreur lors de la création.");
      }
    } catch (err) {
      console.error("Creation failed", err);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/utilisateurs/${editingEmployee.idUser}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingEmployee,
          departement: departments.find(d => d.nomDept === editingEmployee.departement) ? { idDept: departments.find(d => d.nomDept === editingEmployee.departement).idDept } : null,
          poste: postes.find(p => p.titre === editingEmployee.poste) ? { idPoste: postes.find(p => p.titre === editingEmployee.poste).idPoste } : null,
          role: editingEmployee.roleId ? { idRole: editingEmployee.roleId } : (typeof editingEmployee.role === 'object' ? editingEmployee.role : { idRole: parseInt(editingEmployee.role || 1) }),
          managerDirect: editingEmployee.managerDirectId === "null" ? null : (editingEmployee.managerDirectId ? { idUser: parseInt(editingEmployee.managerDirectId) } : editingEmployee.managerDirect),
          site: editingEmployee.siteId ? { idSite: parseInt(editingEmployee.siteId) } : editingEmployee.site
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchEmployees(token!);
      } else {
        const errorText = await response.text();
        alert("Erreur lors de la modification : " + errorText);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="p-8 text-slate-100">
      {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl shadow-indigo-500/10">
                <Users size={20} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Gestion Collaborateurs</h1>
            </div>
            <p className="text-slate-400 font-medium">Visualisez et gérez l'ensemble des talents de SomePharm.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
            <button 
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${viewMode === "list" 
                ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold shadow-md" 
                : "text-slate-400 hover:text-slate-200"}`}
            >
              <List size={16} /> Liste
            </button>
            <button 
              onClick={() => setViewMode("tree") }
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${viewMode === "tree" 
                ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-bold shadow-md" 
                : "text-slate-400 hover:text-slate-200"}`}
            >
              <Network size={16} /> Hiérarchie
            </button>
          </div>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 w-full group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher par nom, matricule ou poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-3xl py-5 pl-16 pr-6 font-bold text-white shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all outline-none placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto justify-end">
            <button className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800/80 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-sm">
              <Filter size={20} />
            </button>
            {(currentUser?.role === "RH_ADMIN" || isHRManager) && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-8 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 shrink-0"
              >
                <UserPlus size={18} /> Nouvel Employé
              </button>
            )}
          </div>
        </div>

        {/* --- MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-4xl rounded-[3rem] overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-indigo-500/5 to-sky-500/5 border-b border-slate-800/80 px-12 py-8 flex justify-between items-center text-white">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Ajouter un Collaborateur</h2>
                  <p className="text-indigo-400/70 text-sm font-medium mt-1">L'accès sera validé selon votre niveau d'accréditation.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 p-3 rounded-2xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="p-12">
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
                    <input 
                      type="email" required
                      value={newEmployeeForm.email}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                      placeholder="email@somepharm.dz"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Prénom</label>
                    <input 
                      type="text" required
                      value={newEmployeeForm.prenom}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, prenom: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nom</label>
                    <input 
                      type="text" required
                      value={newEmployeeForm.nom}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, nom: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Poste</label>
                    <select 
                      value={newEmployeeForm.poste}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, poste: e.target.value})}
                      disabled={!newEmployeeForm.departement}
                      className={`w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer
                        ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed bg-slate-950/40 text-slate-500" : ""}`}
                      required
                    >
                      <option value="" className="bg-slate-950 text-white">{newEmployeeForm.departement ? "Sélectionner un poste..." : "Choisissez d'abord un département"}</option>
                      {postes
                        .filter((p: any) => p.departement?.nomDept === newEmployeeForm.departement)
                        .filter((p: any) => getPositionLevel(p.titre) === 3)
                        .map((p: any) => (
                        <option key={p.idPoste} value={p.titre} className="bg-slate-950 text-white">{p.titre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Date d&apos;embauche</label>
                    <input 
                      type="date" required
                      value={newEmployeeForm.dateEmbauche}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, dateEmbauche: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Situation Familiale</label>
                    <select 
                      value={newEmployeeForm.situationFamiliale}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, situationFamiliale: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                      required
                    >
                      <option value="CELIBATAIRE" className="bg-slate-950 text-white">Célibataire</option>
                      <option value="MARIE" className="bg-slate-950 text-white">Marié</option>
                      <option value="DIVORCE" className="bg-slate-950 text-white">Divorcé</option>
                      <option value="VEUF" className="bg-slate-950 text-white">Veuf</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                  {/* Dept Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Département</label>
                    <select 
                      value={newEmployeeForm.departement}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const deptData = departments.find(d => d.nomDept === newDept);
                        setNewEmployeeForm({
                          ...newEmployeeForm, 
                          departement: newDept, 
                          poste: "",
                          managerId: deptData?.managerId ? String(deptData.managerId) : "null"
                        }); 
                      }}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                      required
                    >
                      <option value="" className="bg-slate-950 text-white">Sélectionner un service...</option>
                      {departments
                        .filter((dept: any) => {
                          const dName = dept.nomDept.toUpperCase();
                          const isRH = dName.includes("RESSOURCES HUMAINES") || dName.includes("RH");
                          if (isRH && currentUser?.role === "RH_ADMIN") return false;
                          return true;
                        })
                        .map((dept: any) => (
                          <option key={dept.idDept} value={dept.nomDept} className="bg-slate-950 text-white">{dept.nomDept}</option>
                        ))}
                    </select>
                  </div>
                  {/* Manager Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Manager Direct</label>
                    <select 
                      value={newEmployeeForm.managerId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, managerId: e.target.value})}
                      disabled={!newEmployeeForm.departement}
                      className={`w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer
                        ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed bg-slate-950/40 text-slate-500" : ""}`}
                    >
                      <option value="null" className="bg-slate-950 text-white">Aucun</option>
                      {(() => {
                        const deptData = departments.find(d => d.nomDept === newEmployeeForm.departement);
                        return employees.filter(e => {
                          const isInDept = e.departement === newEmployeeForm.departement;
                          const isHeadManager = deptData && e.idUser === deptData.managerId;
                          
                          // 🛡️ Hierarchy Guard: Only show users who are strictly higher in the hierarchy
                          const newLevel = getPositionLevel(newEmployeeForm.poste);
                          const targetLevel = getPositionLevel(e.poste);
                          const isManager = targetLevel < 3;
                          const isStrictlyHigher = targetLevel < newLevel;

                          return isInDept && (isManager || isHeadManager) && (isStrictlyHigher || isHeadManager);
                        }).map(u => (
                          <option key={u.idUser} value={u.idUser} className="bg-slate-950 text-white">
                            {u.prenom} {u.nom} ({u.poste}){u.idUser === deptData?.managerId ? " [CHEF DE SERVICE]" : ""}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  {/* Site Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Site / Agence</label>
                    <select 
                      value={newEmployeeForm.siteId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, siteId: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-slate-950 text-white">Sélectionner un site...</option>
                      {sites.map(s => (
                        <option key={s.idSite} value={s.idSite} className="bg-slate-950 text-white">{s.nomSite}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                    Annuler
                  </button>
                  <button type="submit" className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Créer le Profil
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] text-white w-full max-w-4xl rounded-[3rem] overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-indigo-500/5 to-sky-500/5 border-b border-slate-800/80 px-12 py-8 flex justify-between items-center text-white">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Modifier Profil : {editingEmployee.prenom} {editingEmployee.nom}</h2>
                  <p className="text-indigo-400/70 text-sm font-medium mt-1">Mise à jour des informations administratives.</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 p-3 rounded-2xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee} className="p-12 overflow-y-auto max-h-[70vh] no-scrollbar">
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
                    <input 
                      type="email" required
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Département</label>
                    <select 
                      value={editingEmployee.departement || ""}
                      onChange={(e) => setEditingEmployee({...editingEmployee, departement: e.target.value})}
                      disabled={!!originalDept && originalDept !== "Général" && originalDept !== ""}
                      className={`w-full border rounded-2xl py-4 px-6 font-bold outline-none transition-all cursor-pointer focus:ring-4 focus:ring-indigo-500/10 
                        ${(originalDept && originalDept !== "Général" && originalDept !== "") 
                          ? "bg-slate-950/40 border-slate-800/60 text-slate-500 cursor-not-allowed" 
                          : "bg-slate-950 border-slate-800/80 focus:border-indigo-500/40 text-white"}`}
                    >
                      <option value="" className="bg-slate-950 text-white">Sélectionner un service...</option>
                      {departments
                        .filter((dept: any) => {
                          const dName = dept.nomDept.toUpperCase();
                          const isRH = dName.includes("RESSOURCES HUMAINES") || dName.includes("RH");
                          // RH_ADMIN cannot move a user to RH dept if they weren't already there (or if they are "not defined")
                          if (isRH && currentUser?.role === "RH_ADMIN") {
                             return originalDept && (originalDept.toUpperCase().includes("RH") || originalDept.toUpperCase().includes("RESSOURCES HUMAINES"));
                          }
                          return true;
                        })
                        .map((dept: any) => (
                          <option key={dept.idDept} value={dept.nomDept} className="bg-slate-950 text-white">{dept.nomDept}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Poste</label>
                    <select 
                      value={editingEmployee.poste || ""}
                      onChange={(e) => setEditingEmployee({...editingEmployee, poste: e.target.value})}
                      disabled={!editingEmployee.departement}
                      className={`w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer
                        ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed bg-slate-950/40 text-slate-500" : ""}`}
                    >
                      <option value="" className="bg-slate-950 text-white">{editingEmployee.departement ? "Sélectionner un poste..." : "Choisissez d'abord un département"}</option>
                      {postes
                        .filter((p: any) => p.departement?.nomDept === editingEmployee.departement)
                        .filter((p: any) => {
                          const originalLevel = getPositionLevel(originalPoste);
                          const targetLevel = getPositionLevel(p.titre);
                          return targetLevel >= originalLevel; // Higher number means lower hierarchy
                        })
                        .map((p: any) => (
                          <option key={p.idPoste} value={p.titre} className="bg-slate-950 text-white">{p.titre}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Manager Direct</label>
                    <select 
                      value={editingEmployee.managerDirectId || "null"}
                      onChange={(e) => setEditingEmployee({...editingEmployee, managerDirectId: e.target.value})}
                      disabled={!editingEmployee.departement}
                      className={`w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer
                        ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed bg-slate-950/40 text-slate-500" : ""}`}
                    >
                      <option value="null" className="bg-slate-950 text-white">Aucun</option>
                      {(() => {
                        const deptData = departments.find(d => d.nomDept === editingEmployee.departement);
                        return employees.filter(e => {
                          if (e.idUser === editingEmployee.idUser) return false;
                          
                          const isInSameDept = e.departement === editingEmployee.departement;
                          const isDesignatedDeptManager = deptData && e.idUser === deptData.managerId;
  
                          // 🛡️ Hierarchy Guard: Only show users who are strictly higher in the hierarchy
                          const currentLevel = getPositionLevel(originalPoste);
                          const targetUserLevel = getPositionLevel(e.poste);
                          const isManager = targetUserLevel < 3;
                          const isStrictlyHigher = targetUserLevel < currentLevel;
  
                          return isInSameDept && (isManager || isDesignatedDeptManager) && (isStrictlyHigher || isDesignatedDeptManager);
                        }).map(u => (
                          <option key={u.idUser} value={u.idUser} className="bg-slate-950 text-white">
                            {u.prenom} {u.nom} ({u.poste}){u.idUser === deptData?.managerId ? " [CHEF DE SERVICE]" : ""}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Site</label>
                    <select 
                      value={editingEmployee.siteId || ""}
                      onChange={(e) => setEditingEmployee({...editingEmployee, siteId: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-slate-950 text-white">Sélectionner un site...</option>
                      {sites.map(s => (
                        <option key={s.idSite} value={s.idSite} className="bg-slate-950 text-white">{s.nomSite}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Situation Familiale</label>
                    <select 
                      value={editingEmployee.situationFamiliale || "CELIBATAIRE"}
                      onChange={(e) => setEditingEmployee({...editingEmployee, situationFamiliale: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500/40 rounded-2xl py-4 px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      <option value="CELIBATAIRE" className="bg-slate-950 text-white">Célibataire</option>
                      <option value="MARIE" className="bg-slate-950 text-white">Marié</option>
                      <option value="DIVORCE" className="bg-slate-950 text-white">Divorcé</option>
                      <option value="VEUF" className="bg-slate-950 text-white">Veuf</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                    Annuler
                  </button>
                  <button type="submit" className="bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Enregistrer les Modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- ACTIVATION SUCCESS MODAL --- */}
        {showActivationModal && activationResult && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.15)] w-full max-w-md rounded-[3rem] overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-300">
              <div className="bg-green-500/10 border-b border-green-500/20 px-8 py-6 text-green-400 text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Accès Générés avec Succès</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-slate-950/60 p-6 rounded-3xl space-y-4 border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">{activationResult.matricule}</span>
                      <button onClick={() => copyToClipboard(activationResult.matricule)} className="text-indigo-400 hover:text-indigo-300">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de Passe Temporaire</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-indigo-300 tracking-wider font-mono bg-indigo-500/10 px-3 py-1 rounded-lg border border-slate-800">
                        {activationResult.temporary_password}
                      </span>
                      <button onClick={() => copyToClipboard(activationResult.temporary_password)} className="text-indigo-400 hover:text-indigo-300">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-slate-800/80 rounded-2xl">
                  <AlertTriangle size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-indigo-300/80 leading-relaxed">
                    IMPORTANT : Transmettez ces accès en main propre ou via canal sécurisé. Le mot de passe sera masqué après la première connexion.
                  </p>
                </div>

                <button 
                  onClick={() => setShowActivationModal(false)}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-indigo-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {copySuccess ? <Check size={16} /> : null}
                  {copySuccess ? "Copié !" : "Fermer & Continuer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CONTENT AREA --- */}

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-slate-950/20 rounded-[2.5rem] border border-slate-800/80 shadow-sm overflow-hidden backdrop-blur-md">
            <div className="grid grid-cols-12 gap-4 px-8 py-6 bg-slate-900/40 border-b border-slate-800/80">
              <div className="col-span-3 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-4">Collaborateur</div>
              <div className="col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Statut Compte</div>
              {canSeeSensitiveInfo && (
                <>
                  <div className="col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">État Password</div>
                  <div className="col-span-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Activation</div>
                </>
              )}
              {!canSeeSensitiveInfo && (
                <div className="col-span-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Poste & Département</div>
              )}
              <div className="col-span-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-4">Actions</div>
            </div>
            
            <div className="flex flex-col">
              {filteredEmployees.map((emp) => (
                <EmployeeRow 
                  key={emp.idUser} 
                  employee={emp} 
                  currentUser={currentUser} 
                  isHRManager={isHRManager}
                  canSeeSensitiveInfo={canSeeSensitiveInfo}
                  onActivate={() => handleActivate(emp.idUser)} 
                  onReset={() => handleResetPassword(emp.idUser)}
                  onEdit={() => {
                    setEditingEmployee({
                      ...emp,
                      siteId: emp.idSite ? String(emp.idSite) : ""
                    });
                    setOriginalPoste(emp.poste);
                    setOriginalDept(emp.departement);
                    setShowEditModal(true);
                  }}
                  onConsult={() => {
                    setConsultingEmployee(emp);
                    setShowConsultModal(true);
                  }}
                />
              ))}
              {filteredEmployees.length === 0 && (
                <div className="p-20 text-center text-slate-400 font-bold">
                  Aucun collaborateur trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 shadow-[0_0_15px_rgba(99,102,241,0.05)] rounded-[2.5rem] p-12 overflow-x-auto no-scrollbar">
            <EmployeeTree employees={employees} managerId={null} level={0} />
          </div>
        )}
      {showConsultModal && (
        <ProfileConsultationModal 
          user={consultingEmployee} 
          onClose={() => setShowConsultModal(false)} 
        />
      )}
    </div>
  );
}

function EmployeeRow({ employee, currentUser, isHRManager, canSeeSensitiveInfo, onActivate, onReset, onEdit, onConsult }: { employee: any, currentUser: any, isHRManager: boolean, canSeeSensitiveInfo: boolean, onActivate: () => void, onReset: () => void, onEdit: () => void, onConsult: () => void }) {
  const currentRole = typeof currentUser?.role === "string" ? currentUser.role : currentUser?.role?.nomRole;
  const isSuperAdmin = currentRole === "SUPER_ADMIN" || currentRole === "ROLE_SUPER_ADMIN";

  const statusColors: any = {
    "INACTIF": "bg-red-500/10 text-red-400 border-red-500/20",
    "EN_ATTENTE_PREMIERE_CONNEXION": "bg-indigo-500/10 text-indigo-300 border border-slate-800",
    "ACTIF": "bg-green-500/10 text-green-400 border border-green-500/20"
  };

  const statusLabels: any = {
    "INACTIF": "Inactif",
    "EN_ATTENTE_PREMIERE_CONNEXION": "En Attente",
    "ACTIF": "Actif"
  };

  const pwdStatusColors: any = {
    "N/A": "bg-slate-900 text-slate-400 border border-slate-800",
    "TEMPORAIRE": "bg-indigo-500/10 text-indigo-300 border border-slate-800",
    "MODIFIE": "bg-green-500/10 text-green-400 border border-green-500/20"
  };

  const pwdStatusLabels: any = {
    "N/A": "N/A",
    "TEMPORAIRE": "Temporaire",
    "MODIFIE": "Modifié"
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-slate-800/60 hover:bg-indigo-500/5 transition-all group items-center">
      <div className="col-span-3 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-sm
          ${employee.statutCompte === "ACTIF" ? "bg-indigo-500/10 text-indigo-300 border border-slate-800" : "bg-slate-950/80 text-slate-500 border border-slate-900"}`}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.nom} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Users size={20} />
          )}
        </div>
        <div>
          <h4 className="font-black text-white uppercase italic tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">{employee.prenom} {employee.nom}</h4>
          <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mt-0.5">{employee.matricule || "NON ASSIGNÉ"}</p>
        </div>
      </div>

      <div className="col-span-2">
        <div className={`inline-flex items-center px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[employee.statutCompte] || statusColors.INACTIF}`}>
          {statusLabels[employee.statutCompte] || employee.statutCompte}
        </div>
      </div>

      {canSeeSensitiveInfo ? (
        <>
          <div className="col-span-2">
            <div className={`inline-flex items-center px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest ${pwdStatusColors[employee.passwordStatus] || pwdStatusColors["N/A"]}`}>
              {pwdStatusLabels[employee.passwordStatus] || employee.passwordStatus}
            </div>
          </div>

          <div className="col-span-2">
            <p className="font-bold text-white text-sm">{employee.activationDate || "N/A"}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{employee.poste || "Non défini"}</p>
          </div>
        </>
      ) : (
        <div className="col-span-4">
          <p className="font-bold text-slate-200 text-sm">{employee.poste || "Non défini"}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{employee.departement || "Général"}</p>
        </div>
      )}

      <div className="col-span-3 flex justify-end gap-2 pr-4">
        {/* 🛡️ PROTECTION: SUPER_ADMIN profiles can only be modified by other SUPER_ADMINs */}
        {(isHRManager && (isSuperAdmin || employee.role !== "SUPER_ADMIN")) && (
          <div className="flex gap-2">
            {canSeeSensitiveInfo && (
              <>
                {employee.statutCompte === "INACTIF" && (
                  <button 
                    onClick={onActivate}
                    className="p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 border border-green-500/30 transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)] group/btn relative"
                    title="Activer & Générer les accès"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {(employee.statutCompte === "ACTIF" || employee.statutCompte === "EN_ATTENTE_PREMIERE_CONNEXION") && (
                  <button 
                    onClick={onReset}
                    className={`p-3 rounded-xl transition-all border shadow-md group/btn relative
                      ${employee.passwordResetRequested 
                        ? "bg-sky-500/20 text-sky-300 border-indigo-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                        : "bg-indigo-500/10 text-indigo-300 border-slate-800 hover:bg-indigo-500/20"}`}
                    title="Réinitialiser le mot de passe"
                  >
                    <Key size={16} />
                    {employee.passwordResetRequested && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse" />
                    )}
                  </button>
                )}
              </>
            )}

            <button 
              onClick={onConsult}
              className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-400 hover:text-indigo-300 rounded-xl transition-all shadow-sm"
              title="Consulter le profil"
            >
              <Eye size={16} />
            </button>

            <button 
              onClick={onEdit}
              className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-400 hover:text-indigo-300 rounded-xl transition-all shadow-sm"
              title="Modifier le profil"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
