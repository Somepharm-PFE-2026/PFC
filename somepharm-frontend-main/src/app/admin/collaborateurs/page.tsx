"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, List, Network, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Filter, CheckCircle, XCircle, ShieldCheck, Key, 
  AlertTriangle, Copy, Check, Fingerprint, ShieldAlert,
  Building2, Briefcase, UserCircle, Settings2, Trash2,
  Calendar, AtSign, Hash, X
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import EmployeeTree from "../../components/EmployeeTree";

export default function AdminCollaborateursPage() {
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [postes, setPostes] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    matricule: "", nom: "", prenom: "", email: "", roleId: 4, 
    departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
    managerId: "null", siteId: ""
  });

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.nom || ""} ${emp.prenom || ""}`.toLowerCase();
    const matricule = (emp.matricule || "").toLowerCase();
    const poste = (emp.poste || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || matricule.includes(query) || poste.includes(query);
    const matchesFilter = !filterDept || emp.departement === filterDept;
    return matchesSearch && matchesFilter;
  });

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
      if (response.ok) setDepartments(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchPostes = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/config/postes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setPostes(await response.json());
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
          managerDirect: newEmployeeForm.managerId === "null" ? null : { idUser: parseInt(newEmployeeForm.managerId) },
          site: newEmployeeForm.siteId ? { idSite: parseInt(newEmployeeForm.siteId) } : null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewEmployeeForm({
          matricule: "", nom: "", prenom: "", email: "", roleId: 4, 
          departement: "", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], 
          managerId: "null", siteId: ""
        });
        fetchEmployees(token!);
      } else {
        const errorText = await response.text();
        alert(errorText || "Erreur lors de la création.");
      }
    } catch (err) { console.error("Creation failed", err); }
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
    } catch (err) { console.error("Update failed", err); }
  };

  return (
    <div className="min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      {/* --- PREMIUM HEADER --- */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[3px] bg-red-600 rounded-full" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic text-glow">Identity & Org Management</span>
          </div>
          <h1 className="text-7xl font-black text-gray-950 tracking-tighter uppercase italic leading-[0.8] mb-4">
            Staff <span className="text-red-600">Directory</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] ml-1">Gestion administrative et organisationnelle du capital humain</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-gray-100 shadow-xl">
          <button 
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
            ${viewMode === "list" ? "bg-red-600 text-white shadow-2xl shadow-red-200 scale-105" : "text-gray-400 hover:text-red-600"}`}
          >
            <List size={18} /> Liste HR
          </button>
          <button 
            onClick={() => setViewMode("tree") }
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
            ${viewMode === "tree" ? "bg-red-600 text-white shadow-2xl shadow-red-200 scale-105" : "text-gray-400 hover:text-red-600"}`}
          >
            <Network size={18} /> Organigramme
          </button>
        </div>
      </div>

      {/* --- ADVANCED SEARCH & ACTIONS --- */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 group w-full">
          <div className="absolute inset-0 bg-white blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors z-10" size={24} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, matricule, poste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full h-24 bg-white border border-gray-100 rounded-[2.5rem] pl-20 pr-10 text-xl font-black italic text-gray-950 focus:ring-8 focus:ring-red-600/5 focus:border-red-600 transition-all outline-none z-10 placeholder:text-gray-200"
          />
        </div>
        
        <div className="flex gap-4 z-10 w-full lg:w-auto">
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`h-24 w-24 rounded-[2.5rem] border border-gray-100 transition-all flex items-center justify-center ${filterDept ? "bg-red-600 text-white shadow-xl shadow-red-200" : "bg-white text-gray-400 hover:text-red-600 hover:shadow-2xl"}`}
          >
            <Filter size={24} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 lg:flex-none h-24 px-12 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <UserPlus size={24} /> Recrutement Direct
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-40 space-y-8">
          <div className="w-20 h-20 border-8 border-red-600/10 border-t-red-600 rounded-full animate-spin shadow-2xl" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse italic">Synchronisation Nucleus...</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
          <div className="grid grid-cols-12 gap-8 px-12 py-10 bg-gray-50/80 border-b border-gray-100">
            <div className="col-span-4 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic">Collaborateur & Identité</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic">Poste & Organisation</div>
            <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic">Localisation</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] italic text-right">Maintenance RH</div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {filteredEmployees.map((emp) => (
              <HRProfileRow 
                key={emp.idUser} 
                employee={emp} 
                onEdit={() => {
                  setEditingEmployee(emp);
                  setShowEditModal(true);
                }}
              />
            ))}
            {filteredEmployees.length === 0 && (
              <div className="p-32 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-950 uppercase italic tracking-tighter">Aucun Node Détecté</h3>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Vérifiez vos filtres ou effectuez un recrutement direct</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl p-20 overflow-x-auto no-scrollbar">
          <EmployeeTree employees={employees} managerId={null} level={0} />
        </div>
      )}

      {/* --- ADD MODAL (Recrutement Direct) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] p-16 max-w-5xl w-full shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="text-red-600" size={24} />
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] italic">Onboarding Hub</span>
                </div>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gray-950">Provisionnement <span className="text-red-600">Direct</span></h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Création d'une nouvelle identité numérique</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                <X size={32} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-10">
              <div className="grid grid-cols-3 gap-8">
                {/* Personal Info */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2"><Hash size={12} /> Matricule</label>
                  <input required value={newEmployeeForm.matricule} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, matricule: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none" placeholder="EX: SP2026-001" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Prénom</label>
                  <input required value={newEmployeeForm.prenom} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, prenom: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none" placeholder="JEAN" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nom</label>
                  <input required value={newEmployeeForm.nom} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, nom: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none" placeholder="DU PONT" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2"><AtSign size={12} /> Email Professionnel</label>
                  <input type="email" required value={newEmployeeForm.email} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none" placeholder="j.dupont@somepharm.dz" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2"><Calendar size={12} /> Date d&apos;embauche</label>
                  <input type="date" required value={newEmployeeForm.dateEmbauche} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, dateEmbauche: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Département</label>
                  <select required value={newEmployeeForm.departement} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, departement: e.target.value, managerId: "null", poste: ""})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none">
                    <option value="">Sélectionner...</option>
                    {departments.map(d => <option key={d.idDept} value={d.nomDept}>{d.nomDept}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Poste</label>
                  <select 
                    required 
                    value={newEmployeeForm.poste} 
                    onChange={(e) => setNewEmployeeForm({...newEmployeeForm, poste: e.target.value})} 
                    disabled={!newEmployeeForm.departement}
                    className={`w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none transition-all ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Sélectionner...</option>
                    {postes.filter(p => !newEmployeeForm.departement || p.departement?.nomDept === newEmployeeForm.departement).map(p => (
                      <option key={p.idPoste} value={p.titre}>{p.titre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Manager Direct</label>
                  <select 
                    value={newEmployeeForm.managerId} 
                    onChange={(e) => setNewEmployeeForm({...newEmployeeForm, managerId: e.target.value})} 
                    disabled={!newEmployeeForm.departement}
                    className={`w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none transition-all ${!newEmployeeForm.departement ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="null">Aucun (Top Level)</option>
                    {employees.filter(e => (!newEmployeeForm.departement || e.departement === newEmployeeForm.departement) && (e.role === "MANAGER" || e.role === "HR_MANAGER" || e.role === "SUPER_ADMIN")).map(u => (
                      <option key={u.idUser} value={u.idUser}>{u.nom} {u.prenom} ({u.poste})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Site d&apos;affectation</label>
                  <select required value={newEmployeeForm.siteId} onChange={(e) => setNewEmployeeForm({...newEmployeeForm, siteId: e.target.value})} className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-red-600/5 outline-none">
                    <option value="">Sélectionner...</option>
                    {sites.map(s => <option key={s.idSite} value={s.idSite}>{s.nomSite}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full h-24 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-red-600 transition-all shadow-2xl active:scale-95 pt-2">
                Initier Onboarding & Générer Profil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- FILTER MODAL --- */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white rounded-[4rem] p-16 max-w-xl w-full shadow-2xl animate-in slide-in-from-top-8 duration-500">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-gray-950">Filtres <span className="text-red-600">Avancés</span></h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Affiner la vue du directoire</p>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:text-red-600 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Filtrer par Département</label>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => { setFilterDept(""); setShowFilterModal(false); }}
                    className={`h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-left transition-all ${!filterDept ? "bg-red-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                  >
                    Tous les départements
                  </button>
                  {departments.map(d => (
                    <button 
                      key={d.idDept}
                      onClick={() => { setFilterDept(d.nomDept); setShowFilterModal(false); }}
                      className={`h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-left transition-all ${filterDept === d.nomDept ? "bg-red-600 text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                    >
                      {d.nomDept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button 
                onClick={() => { setFilterDept(""); setShowFilterModal(false); }}
                className="flex-1 h-20 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-all"
              >
                Réinitialiser
              </button>
              <button 
                onClick={() => setShowFilterModal(false)}
                className="flex-[2] h-20 bg-gray-950 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL (Update Profil) --- */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-8">
           <div className="bg-white rounded-[4rem] p-16 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase text-gray-950">Mise à jour <span className="text-red-600">Profil</span></h2>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Modification administrative de {editingEmployee.nom} {editingEmployee.prenom}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee} className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Département</label>
                  <select 
                    value={editingEmployee.departement || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, departement: e.target.value, managerDirectId: "null", poste: "" })}
                    className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-red-600/5 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {departments.map(d => <option key={d.idDept} value={d.nomDept}>{d.nomDept}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Poste Occupé</label>
                  <select 
                    value={editingEmployee.poste || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, poste: e.target.value })}
                    disabled={!editingEmployee.departement}
                    className={`w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-red-600/5 outline-none transition-all ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Sélectionner...</option>
                    {postes.filter(p => !editingEmployee.departement || p.departement?.nomDept === editingEmployee.departement).map(p => (
                      <option key={p.idPoste} value={p.titre}>{p.titre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Site de Rattachement</label>
                  <select 
                    value={editingEmployee.siteId || (editingEmployee.site?.idSite) || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, siteId: e.target.value })}
                    className="w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-red-600/5 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {sites.map(s => <option key={s.idSite} value={s.idSite}>{s.nomSite}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Manager Direct</label>
                  <select 
                    value={editingEmployee.managerDirectId || (editingEmployee.managerDirect?.idUser) || ""}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, managerDirectId: e.target.value })}
                    disabled={!editingEmployee.departement}
                    className={`w-full h-16 px-8 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-950 focus:ring-4 focus:ring-red-600/5 outline-none transition-all ${!editingEmployee.departement ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="null">Aucun (Top Level)</option>
                    {employees.filter(e => 
                      e.idUser !== editingEmployee.idUser && 
                      e.departement === editingEmployee.departement &&
                      (e.role === "MANAGER" || e.role === "HR_MANAGER" || e.role === "SUPER_ADMIN" || e.role === "RH_ADMIN")
                    ).map(e => (
                      <option key={e.idUser} value={e.idUser}>{e.nom} {e.prenom} ({e.poste})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 pt-10">
                  <button type="submit" className="w-full h-24 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-red-600 transition-all shadow-2xl active:scale-95">
                    Enregistrer les Modifications
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function HRProfileRow({ employee, onEdit }: { employee: any, onEdit: () => void }) {
  return (
    <div className="grid grid-cols-12 gap-8 px-12 py-10 hover:bg-gray-50 transition-all group items-center">
      {/* Identity */}
      <div className="col-span-4 flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 border-2 border-white shadow-xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
            <UserCircle size={32} />
          </div>
          <div className={`absolute -right-2 -bottom-2 w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-black shadow-lg ${
            employee.statutCompte === 'ACTIF' ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {employee.statutCompte === 'ACTIF' ? <Check size={12} /> : <XCircle size={12} />}
          </div>
        </div>
        <div>
          <h4 className="text-xl font-black text-gray-950 uppercase italic tracking-tight leading-none mb-1">{employee.prenom} {employee.nom}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-red-600/40 uppercase tracking-widest">{employee.matricule}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{employee.email}</span>
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="col-span-3">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={14} className="text-red-600" />
          <p className="font-black text-gray-900 text-sm italic uppercase tracking-tight">{employee.poste || "Poste non défini"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Building2 size={14} className="text-gray-300" />
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{employee.departement || "Structure Générale"}</p>
        </div>
      </div>

      {/* Location */}
      <div className="col-span-2">
        <div className="flex items-center gap-3 mb-2 text-gray-500">
          <MapPin size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">{employee.site?.nomSite || "Site Central"}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <Smartphone size={14} />
          <span className="text-[10px] font-bold">{employee.telephone || "---"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-3 flex justify-end gap-3">
        <button 
          onClick={onEdit}
          className="h-16 px-8 bg-white border border-gray-100 rounded-2xl flex items-center gap-3 text-gray-400 hover:text-red-600 hover:shadow-xl hover:border-red-100 transition-all group/btn"
        >
          <Settings2 size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Éditer Profil</span>
        </button>
      </div>
    </div>
  );
}

// Re-using Smartphone from lucide-react if needed
function Smartphone({ size, className }: any) {
  return <Phone size={size} className={className} />;
}
