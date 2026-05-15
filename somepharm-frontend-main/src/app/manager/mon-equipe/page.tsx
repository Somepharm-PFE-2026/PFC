"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, List, Network, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Filter, CheckCircle2, XCircle, ShieldCheck,
  Building, Briefcase, Plus, Shield
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import EmployeeTree from "../../components/EmployeeTree";
import Modal from "../../../components/ui/Modal";
import { useUI } from "../../../context/UIContext";

export default function CollaborateursPage() {
  const { addToast } = useUI();
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filtered employees for the list view
  const filteredEmployees = employees.filter(emp => 
    `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.poste?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: any = jwtDecode(token);
      let role = decoded.role;
      if (role && role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
      setCurrentUser({ ...decoded, role });
      fetchEmployees(token);
    }
  }, []);

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
        addToast("success", "Compte activé avec succès");
        fetchEmployees(token!);
      } else {
        addToast("error", "Erreur lors de l'activation");
      }
    } catch (err) {
      console.error("Activation failed", err);
      addToast("error", "Erreur technique");
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    matricule: "", nom: "", prenom: "", email: "", roleId: 1, 
    departement: "Général", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], managerId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
          managerDirect: newEmployeeForm.managerId ? { idUser: parseInt(newEmployeeForm.managerId) } : null
        })
      });

      if (response.ok) {
        addToast("success", "Collaborateur ajouté avec succès");
        setShowAddModal(false);
        fetchEmployees(token!);
        setNewEmployeeForm({
          matricule: "", nom: "", prenom: "", email: "", roleId: 1, 
          departement: "Général", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], managerId: ""
        });
      } else {
        addToast("error", "Erreur lors de l'ajout");
      }
    } catch (err) {
      console.error("Creation failed", err);
      addToast("error", "Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700 pb-12">
      {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">Mon Équipe</h1>
            <p className="text-slate-500 text-sm mt-1">Visualisez et gérez l'ensemble des talents de votre périmètre</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all
              ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List size={16} /> <span className="hidden sm:inline">Liste</span>
            </button>
            <button 
              onClick={() => setViewMode("tree") }
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all
              ${viewMode === "tree" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Network size={16} /> <span className="hidden sm:inline">Hiérarchie</span>
            </button>
          </div>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher par nom, matricule ou poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-teal-500 rounded-xl py-3.5 pl-14 pr-6 text-sm font-medium text-slate-900 shadow-sm transition-all outline-none"
            />
          </div>
          
          <div className="flex gap-3 w-full lg:w-auto">
            <button className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all shadow-sm shrink-0">
              <Filter size={20} />
            </button>
            {(currentUser?.role === "RH_ADMIN" || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_MANAGER") && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full lg:w-auto bg-teal-600 text-white px-6 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Nouvel Employé</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
            )}
          </div>
        </div>

        {/* --- MODAL --- */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Ajouter un Collaborateur"
        >
          <form onSubmit={handleCreateEmployee} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-slate-900">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Matricule</label>
                <input 
                  type="text" required
                  value={newEmployeeForm.matricule}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, matricule: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all"
                  placeholder="e.g. SP001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
                <input 
                  type="email" required
                  value={newEmployeeForm.email}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all"
                  placeholder="email@somepharm.dz"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                <input 
                  type="text" required
                  value={newEmployeeForm.prenom}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, prenom: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                <input 
                  type="text" required
                  value={newEmployeeForm.nom}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, nom: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
               {/* Role Select */}
               <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Rôle</label>
                <select 
                  value={newEmployeeForm.roleId}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, roleId: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all text-slate-900 cursor-pointer appearance-none"
                >
                  <option value={1}>Employé</option>
                  <option value={2}>Manager</option>
                  <option value={3}>HR Admin</option>
                  <option value={4}>Super Admin</option>
                  <option value={5}>Agent Sécurité</option>
                </select>
              </div>
              {/* Dept Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Département</label>
                <select 
                  value={newEmployeeForm.departement}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, departement: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all text-slate-900 cursor-pointer appearance-none"
                >
                  <option value="Général">Général</option>
                  <option value="Ressources Humaines">RH</option>
                  <option value="Finance">Finance</option>
                  <option value="Ventes">Ventes</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Sécurité">Sécurité</option>
                </select>
              </div>
              {/* Manager Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Manager Direct</label>
                <select 
                  value={newEmployeeForm.managerId}
                  onChange={(e) => setNewEmployeeForm({...newEmployeeForm, managerId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all text-slate-900 cursor-pointer appearance-none"
                >
                  <option value="">Aucun</option>
                  {employees.filter(e => e.role?.nomRole === "MANAGER" || e.role?.nomRole === "HR_MANAGER" || e.role?.nomRole === "SUPER_ADMIN").map(m => (
                    <option key={m.idUser} value={m.idUser}>{m.prenom} {m.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-teal-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Création..." : "Créer le Profil"}
              </button>
            </div>
          </form>
        </Modal>

        {/* --- CONTENT AREA --- */}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-8 h-8 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-5 lg:col-span-4 pl-2">Collaborateur</div>
              <div className="col-span-4 lg:col-span-3">Poste & Service</div>
              <div className="col-span-3">Status</div>
              <div className="hidden lg:block col-span-2 text-right pr-2">Actions</div>
            </div>
            
            <div className="flex flex-col divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <EmployeeRow key={emp.idUser} employee={emp} currentUser={currentUser} onActivate={() => handleActivate(emp.idUser)} />
              ))}
              {filteredEmployees.length === 0 && (
                <div className="p-16 text-center text-slate-400 font-medium text-sm italic">
                  Aucun collaborateur trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-12 overflow-x-auto custom-scrollbar">
            <EmployeeTree 
              employees={employees} 
              managerId={currentUser?.userId || currentUser?.idUser || currentUser?.id} 
              level={0} 
            />
          </div>
        )}
    </div>
  );
}

function EmployeeRow({ employee, currentUser, onActivate }: { employee: any, currentUser: any, onActivate: () => void }) {
  const isActive = employee.statutCompte === "ACTIF";

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-50/50 transition-all items-start md:items-center">
      <div className="w-full md:col-span-5 lg:col-span-4 flex items-center gap-4">
        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-2 border-white shadow-sm
          ${isActive ? "bg-teal-50 text-teal-600" : "bg-slate-50 text-slate-400"}`}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.nom} className="w-full h-full object-cover rounded-full" />
          ) : (
            <Users size={20} />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-slate-900 truncate">{employee.prenom} {employee.nom}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{employee.matricule}</p>
        </div>
      </div>

      <div className="w-full md:col-span-4 lg:col-span-3 pl-16 md:pl-0">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
          <Briefcase size={14} className="text-slate-400 shrink-0" />
          <span className="truncate">{employee.poste || "Non défini"}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
          <Building size={12} className="shrink-0" />
          <span className="truncate">{employee.departement || "Non défini"}</span>
        </div>
      </div>

      <div className="w-full md:col-span-3 pl-16 md:pl-0">
        {isActive ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">
            <CheckCircle2 size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Actif</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md">
            <ShieldCheck size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">En Attente</span>
          </div>
        )}
      </div>

      <div className="w-full lg:col-span-2 flex justify-end gap-2 pr-2 absolute right-6 md:relative md:right-0 -mt-10 md:mt-0">
        {!isActive && (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR_MANAGER" || currentUser?.role === "RH_ADMIN") && (
          <button 
            onClick={onActivate}
            className="p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-teal-100 group"
            title="Activer le compte"
          >
            <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
        <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-teal-600 transition-all shadow-sm">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
