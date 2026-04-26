"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, List, Network, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Filter, CheckCircle, XCircle, ShieldCheck, Key, AlertTriangle, Copy, Check
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import EmployeeTree from "../../components/EmployeeTree";

export default function CollaborateursPage() {
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const canSeeSensitiveInfo = false; // Clean layout for all HR roles
  const isSuperAdmin = false;



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
    matricule: "", nom: "", prenom: "", email: "", roleId: 4, 
    departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
    managerId: "", siteId: ""
  });

  // Auto-assign Role based on Department
  useEffect(() => {
    let targetRoleId = 4; // Default EMPLOYE
    const dept = newEmployeeForm.departement.toUpperCase();
    
    if (dept.includes("SECURITE") || dept.includes("SÉCURITÉ")) {
      targetRoleId = 7; // SECURITY_AGENTS
    } else if (dept.includes("RESSOURCES HUMAINES") || dept.includes("RH")) {
      targetRoleId = 1; // RH_ADMIN
    }
    
    setNewEmployeeForm(prev => ({ ...prev, roleId: targetRoleId }));
  }, [newEmployeeForm.departement]);

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
          matricule: newEmployeeForm.matricule,
          nom: newEmployeeForm.nom,
          prenom: newEmployeeForm.prenom,
          email: newEmployeeForm.email,
          role: { idRole: newEmployeeForm.roleId },
          departement: newEmployeeForm.departement,
          poste: newEmployeeForm.poste,
          dateEmbauche: newEmployeeForm.dateEmbauche,
          managerDirect: newEmployeeForm.managerId ? { idUser: parseInt(newEmployeeForm.managerId) } : null,
          site: newEmployeeForm.siteId ? { idSite: parseInt(newEmployeeForm.siteId) } : null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewEmployeeForm({
          matricule: "", nom: "", prenom: "", email: "", roleId: 4, 
          departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
          managerId: "", siteId: ""
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
    <div className="p-8">
      {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Users size={20} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Gestion Collaborateurs</h1>
            </div>
            <p className="text-gray-400 font-medium">Visualisez et gérez l'ensemble des talents de SomePharm.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
            <button 
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${viewMode === "list" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List size={16} /> Liste
            </button>
            <button 
              onClick={() => setViewMode("tree") }
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
              ${viewMode === "tree" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Network size={16} /> Hiérarchie
            </button>
          </div>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher par nom, matricule ou poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-transparent focus:border-blue-600 rounded-3xl py-5 pl-16 pr-6 font-bold text-gray-900 shadow-sm transition-all outline-none"
            />
          </div>
          
          <div className="flex gap-4">
            <button className="bg-white p-5 rounded-3xl border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
              <Filter size={20} />
            </button>
            {(currentUser?.role === "RH_ADMIN" || isHRManager) && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-8 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-3 active:scale-[0.98]"
              >
                <UserPlus size={18} /> Nouvel Employé
              </button>
            )}
          </div>
        </div>

        {/* --- MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-blue-600 px-12 py-8 flex justify-between items-center text-white">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Ajouter un Collaborateur</h2>
                  <p className="text-blue-100 text-sm opacity-80 mt-1">L'accès sera validé selon votre niveau d'accréditation.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateEmployee} className="p-12">
                <div className="grid grid-cols-2 gap-8 mb-10 text-gray-900">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Matricule</label>
                    <input 
                      type="text" required
                      value={newEmployeeForm.matricule}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, matricule: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all"
                      placeholder="e.g. SP001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email</label>
                    <input 
                      type="email" required
                      value={newEmployeeForm.email}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all"
                      placeholder="email@somepharm.dz"
                    />
                  </div>
                  <div className="space-y-2 text-gray-900">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Prénom</label>
                    <input 
                      type="text" required
                      value={newEmployeeForm.prenom}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, prenom: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-2 text-gray-900">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nom</label>
                    <input 
                      type="text" required
                      value={newEmployeeForm.nom}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, nom: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Poste</label>
                    <select 
                      value={newEmployeeForm.poste}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, poste: e.target.value})}
                      disabled={!newEmployeeForm.departement}
                      className={`w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900 
                        ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                      required
                    >
                      <option value="">{newEmployeeForm.departement ? "Sélectionner un poste..." : "Choisissez d'abord un département"}</option>
                      {postes.filter((p: any) => p.departement?.nomDept === newEmployeeForm.departement).map((p: any) => (
                        <option key={p.idPoste} value={p.titre}>{p.titre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Date d&apos;embauche</label>
                    <input 
                      type="date" required
                      value={newEmployeeForm.dateEmbauche}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, dateEmbauche: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                  {/* Dept Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Département</label>
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
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                      required
                    >
                      <option value="">Sélectionner un service...</option>
                      {departments.map((dept: any) => (
                        <option key={dept.idDept} value={dept.nomDept}>{dept.nomDept}</option>
                      ))}
                    </select>
                  </div>
                  {/* Manager Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Manager Direct</label>
                    <select 
                      value={newEmployeeForm.managerId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, managerId: e.target.value})}
                      disabled={!newEmployeeForm.departement}
                      className={`w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900
                        ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                    >
                      <option value="null">Aucun</option>
                      {(() => {
                        const deptData = departments.find(d => d.nomDept === newEmployeeForm.departement);
                        return employees.filter(e => {
                          const isManager = e.role?.nomRole !== 'EMPLOYE' && e.role?.nomRole !== 'SECURITY_AGENTS';
                          const isInDept = e.departement === newEmployeeForm.departement;
                          const isHeadManager = deptData && e.idUser === deptData.managerId;
                          return (isInDept && isManager) || isHeadManager;
                        }).map(u => (
                          <option key={u.idUser} value={u.idUser}>
                            {u.prenom} {u.nom} ({u.poste}){u.idUser === deptData?.managerId ? " [CHEF DE SERVICE]" : ""}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  {/* Site Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Site / Agence</label>
                    <select 
                      value={newEmployeeForm.siteId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, siteId: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="">Sélectionner un site...</option>
                      {sites.map(s => (
                        <option key={s.idSite} value={s.idSite}>{s.nomSite}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">
                    Annuler
                  </button>
                  <button type="submit" className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                    Créer le Profil
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* --- EDIT MODAL --- */}
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-blue-600 px-12 py-8 flex justify-between items-center text-white">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Modifier Profil : {editingEmployee.prenom} {editingEmployee.nom}</h2>
                  <p className="text-blue-100 text-sm opacity-80 mt-1">Mise à jour des informations administratives.</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee} className="p-12 overflow-y-auto max-h-[70vh] no-scrollbar">
                <div className="grid grid-cols-2 gap-8 mb-10 text-gray-900">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email</label>
                    <input 
                      type="email" required
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Département</label>
                    <select 
                      value={editingEmployee.departement || ""}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const deptData = departments.find(d => d.nomDept === newDept);
                        setEditingEmployee({
                          ...editingEmployee,
                          departement: newDept,
                          poste: "", 
                          managerDirectId: deptData?.managerId ? String(deptData.managerId) : "null"
                        });
                      }}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="">Sélectionner un service...</option>
                      {departments.map((dept: any) => (
                        <option key={dept.idDept} value={dept.nomDept}>{dept.nomDept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Poste</label>
                    <select 
                      value={editingEmployee.poste || ""}
                      onChange={(e) => setEditingEmployee({...editingEmployee, poste: e.target.value})}
                      disabled={!editingEmployee.departement}
                      className={`w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900 
                        ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                    >
                      <option value="">{editingEmployee.departement ? "Sélectionner un poste..." : "Choisissez d'abord un département"}</option>
                      {postes.filter((p: any) => p.departement?.nomDept === editingEmployee.departement).map((p: any) => (
                        <option key={p.idPoste} value={p.titre}>{p.titre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Manager Direct</label>
                    <select 
                      value={editingEmployee.managerDirectId || "null"}
                      onChange={(e) => setEditingEmployee({...editingEmployee, managerDirectId: e.target.value})}
                      disabled={!editingEmployee.departement}
                      className={`w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900
                        ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                    >
                      <option value="null">Aucun</option>
                      {(() => {
                        const deptData = departments.find(d => d.nomDept === editingEmployee.departement);
                        return employees.filter(e => {
                          if (e.idUser === editingEmployee.idUser) return false;
                          const isManager = e.role?.nomRole !== 'EMPLOYE' && e.role?.nomRole !== 'SECURITY_AGENTS';
                          const isInDept = e.departement === editingEmployee.departement;
                          const isHeadManager = deptData && e.idUser === deptData.managerId;
                          return (isInDept && isManager) || isHeadManager;
                        }).map(u => (
                          <option key={u.idUser} value={u.idUser}>
                            {u.prenom} {u.nom} ({u.poste}){u.idUser === deptData?.managerId ? " [CHEF DE SERVICE]" : ""}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Site</label>
                    <select 
                      value={editingEmployee.siteId || ""}
                      onChange={(e) => setEditingEmployee({...editingEmployee, siteId: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="">Sélectionner un site...</option>
                      {sites.map(s => (
                        <option key={s.idSite} value={s.idSite}>{s.nomSite}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Statut Compte</label>
                    <select 
                      value={editingEmployee.statutCompte}
                      onChange={(e) => setEditingEmployee({...editingEmployee, statutCompte: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="ACTIF">Actif</option>
                      <option value="INACTIF">Inactif</option>
                      <option value="EN_ATTENTE_PREMIERE_CONNEXION">En Attente</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">
                    Annuler
                  </button>
                  <button type="submit" className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                    Enregistrer les Modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- ACTIVATION SUCCESS MODAL --- */}
        {showActivationModal && activationResult && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-green-500/20">
              <div className="bg-green-600 px-8 py-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Accès Générés avec Succès</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Matricule</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900">{activationResult.matricule}</span>
                      <button onClick={() => copyToClipboard(activationResult.matricule)} className="text-blue-600 hover:text-blue-700">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mot de Passe Temporaire</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-600 tracking-wider font-mono bg-blue-50 px-3 py-1 rounded-lg">
                        {activationResult.temporary_password}
                      </span>
                      <button onClick={() => copyToClipboard(activationResult.temporary_password)} className="text-blue-600 hover:text-blue-700">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                    IMPORTANT : Transmettez ces accès en main propre ou via canal sécurisé. Le mot de passe sera masqué après la première connexion.
                  </p>
                </div>

                <button 
                  onClick={() => setShowActivationModal(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
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
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-8 py-6 bg-gray-50/50 border-b border-gray-100">
              <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4">Collaborateur</div>
              <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Statut Compte</div>
              {canSeeSensitiveInfo && (
                <>
                  <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">État Password</div>
                  <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Activation</div>
                </>
              )}
              {!canSeeSensitiveInfo && (
                <div className="col-span-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Poste & Département</div>
              )}
              <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right pr-4">Actions</div>
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
                    setEditingEmployee(emp);
                    setShowEditModal(true);
                  }}
                />
              ))}
              {filteredEmployees.length === 0 && (
                <div className="p-20 text-center text-gray-400 font-bold">
                  Aucun collaborateur trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 overflow-x-auto no-scrollbar">
            <EmployeeTree employees={employees} managerId={null} level={0} />
          </div>
        )}
    </div>
  );
}

function EmployeeRow({ employee, currentUser, isHRManager, canSeeSensitiveInfo, onActivate, onReset, onEdit }: { employee: any, currentUser: any, isHRManager: boolean, canSeeSensitiveInfo: boolean, onActivate: () => void, onReset: () => void, onEdit: () => void }) {
  const statusColors: any = {
    "INACTIF": "bg-red-50 text-red-600 border-red-100",
    "EN_ATTENTE_PREMIERE_CONNEXION": "bg-amber-50 text-amber-600 border-amber-100",
    "ACTIF": "bg-green-50 text-green-600 border-green-100"
  };

  const statusLabels: any = {
    "INACTIF": "Inactif 🔴",
    "EN_ATTENTE_PREMIERE_CONNEXION": "En Attente 🟡",
    "ACTIF": "Actif 🟢"
  };

  const pwdStatusColors: any = {
    "N/A": "bg-gray-50 text-gray-400 border-gray-100",
    "TEMPORAIRE": "bg-blue-50 text-blue-600 border-blue-100",
    "MODIFIE": "bg-emerald-50 text-emerald-600 border-emerald-100"
  };

  const pwdStatusLabels: any = {
    "N/A": "N/A",
    "TEMPORAIRE": "Temporaire 🔑",
    "MODIFIE": "Modifié ✅"
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-50 hover:bg-blue-50/30 transition-all group items-center">
      <div className="col-span-3 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm
          ${employee.statutCompte === "ACTIF" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.nom} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Users size={20} />
          )}
        </div>
        <div>
          <h4 className="font-black text-gray-900 uppercase italic tracking-tight leading-tight">{employee.prenom} {employee.nom}</h4>
          <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">{employee.matricule || "NON ASSIGNÉ"}</p>
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
            <p className="font-bold text-gray-900 text-sm">{employee.activationDate || "N/A"}</p>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{employee.poste || "Non défini"}</p>
          </div>
        </>
      ) : (
        <div className="col-span-4">
          <p className="font-bold text-gray-900 text-sm">{employee.poste || "Non défini"}</p>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{employee.departement || "Général"}</p>
        </div>
      )}

      <div className="col-span-3 flex justify-end gap-2 pr-4">
        {canSeeSensitiveInfo && (
          <>
            {employee.statutCompte === "INACTIF" && (
              <button 
                onClick={onActivate}
                className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-200 group/btn relative"
                title="Activer & Générer les accès"
              >
                <CheckCircle size={16} />
              </button>
            )}
            {(employee.statutCompte === "ACTIF" || employee.statutCompte === "EN_ATTENTE_PREMIERE_CONNEXION") && (
              <button 
                onClick={onReset}
                className={`p-3 rounded-xl transition-all shadow-lg group/btn relative
                  ${employee.passwordResetRequested ? "bg-amber-500 text-white shadow-amber-200" : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700"}`}
                title="Réinitialiser le mot de passe"
              >
                <Key size={16} />
                {employee.passwordResetRequested && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
            )}
          </>
        )}

        <button 
          onClick={onEdit}
          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-white hover:text-blue-600 transition-all border border-transparent hover:border-gray-100"
          title="Modifier le profil"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
