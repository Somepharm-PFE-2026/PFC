"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Search, List, Network, 
  MoreHorizontal, Phone, Mail, MapPin, 
  Filter, CheckCircle, XCircle, ShieldCheck
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import EmployeeTree from "../../components/EmployeeTree";

export default function CollaborateursPage() {
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
        fetchEmployees(token!);
      }
    } catch (err) {
      console.error("Activation failed", err);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    matricule: "", nom: "", prenom: "", email: "", roleId: 1, 
    departement: "Général", poste: "", dateEmbauche: new Date().toISOString().split('T')[0], managerId: ""
  });

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
          managerDirect: newEmployeeForm.managerId ? { idUser: parseInt(newEmployeeForm.managerId) } : null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchEmployees(token!);
      }
    } catch (err) {
      console.error("Creation failed", err);
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
            {(currentUser?.role === "RH_ADMIN" || currentUser?.role === "SUPER_ADMIN") && (
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
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                   {/* Role Select */}
                   <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Rôle</label>
                    <select 
                      value={newEmployeeForm.roleId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, roleId: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value={1}>Employé</option>
                      <option value={2}>Manager</option>
                      <option value={3}>HR Admin</option>
                    </select>
                  </div>
                  {/* Dept Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Département</label>
                    <select 
                      value={newEmployeeForm.departement}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, departement: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="Général">Général</option>
                      <option value="Finance">Finance</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Informatique">Informatique</option>
                    </select>
                  </div>
                  {/* Manager Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Manager Direct</label>
                    <select 
                      value={newEmployeeForm.managerId}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, managerId: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 px-6 font-bold outline-none transition-all text-gray-900"
                    >
                      <option value="">Aucun</option>
                      {employees.filter(e => e.role?.nomRole === "MANAGER" || e.role?.nomRole === "SUPER_ADMIN").map(m => (
                        <option key={m.idUser} value={m.idUser}>{m.prenom} {m.nom}</option>
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

        {/* --- CONTENT AREA --- */}

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-8 py-6 bg-gray-50/50 border-b border-gray-100">
              <div className="col-span-4 text-[10px] font-black uppercase text-gray-400 tracking-widest pl-4">Collaborateur</div>
              <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Poste & Service</div>
              <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</div>
              <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right pr-4">Actions</div>
            </div>
            
            <div className="flex flex-col">
              {filteredEmployees.map((emp) => (
                <EmployeeRow key={emp.idUser} employee={emp} currentUser={currentUser} onActivate={() => handleActivate(emp.idUser)} />
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
            <EmployeeTree 
              employees={employees} 
              managerId={currentUser?.userId || currentUser?.idUser} 
              level={0} 
            />
          </div>
        )}
    </div>
  );
}

function EmployeeRow({ employee, currentUser, onActivate }: { employee: any, currentUser: any, onActivate: () => void }) {
  const isActive = employee.statutCompte === "ACTIF";
  const isPending = employee.statutCompte === "INACTIF" && employee.mustChangePassword;

  return (
    <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-gray-50 hover:bg-blue-50/30 transition-all group items-center">
      <div className="col-span-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white
          ${isActive ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.nom} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Users size={20} />
          )}
        </div>
        <div>
          <h4 className="font-black text-gray-900 uppercase italic tracking-tight">{employee.prenom} {employee.nom}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{employee.matricule}</p>
        </div>
      </div>

      <div className="col-span-3">
        <p className="font-bold text-gray-900 text-sm">{employee.poste || "Non défini"}</p>
        <p className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest">{employee.departement}</p>
      </div>

      <div className="col-span-3">
        {isActive ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full">
            <CheckCircle size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Actif</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">En Attente</span>
          </div>
        )}
      </div>

      <div className="col-span-2 flex justify-end gap-2 pr-4">
        {!isActive && currentUser?.role === "SUPER_ADMIN" && (
          <button 
            onClick={onActivate}
            className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-200"
            title="Activer le compte"
          >
            <CheckCircle size={16} />
          </button>
        )}
        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-white hover:text-blue-600 transition-all border border-transparent hover:border-gray-100">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
