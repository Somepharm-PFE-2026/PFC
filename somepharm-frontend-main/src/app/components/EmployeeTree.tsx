"use client";
import React, { useState } from "react";
import { User, ChevronDown, ChevronRight, MapPin, Briefcase, Network } from "lucide-react";

interface Employee {
  idUser: number;
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  email: string;
  photoUrl?: string;
  idManagerDirect?: number;
  statutCompte: string;
}

interface TreeProps {
  employees: Employee[];
  managerId: number | null;
  level: number;
}

export default function EmployeeTree({ employees, managerId, level }: TreeProps) {
  // 🛡️ Safety: Prevent infinite recursion in case of data cycles
  if (level > 10) return null;

  const directReports = (employees || []).filter((emp) => {
    if (managerId === null) {
      // 🛡️ Root Detection: Either no manager OR the manager is not in the current list
      // Using == for type-flexible comparison (string vs number)
      const hasManagerInList = emp.idManagerDirect && (employees || []).some(e => e.idUser == emp.idManagerDirect);
      return !hasManagerInList;
    }
    return emp.idManagerDirect == managerId;
  });

  if (directReports.length === 0) {
    if (level === 0 && (employees || []).length > 0) {
      return (
        <div className="p-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Network size={32} />
          </div>
          <h3 className="text-gray-900 font-black uppercase tracking-widest text-sm mb-2">Structure Introuvable</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto">
            Les collaborateurs sont présents dans la liste mais aucune hiérarchie n&apos;a pu être établie.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${level > 0 ? "ml-12 pl-6 border-l-2 border-dashed border-gray-200" : ""}`}>
      {directReports.map((emp) => (
        <TreeNode key={emp.idUser} employee={emp} allEmployees={employees} level={level} />
      ))}
    </div>
  );
}

function TreeNode({ employee, allEmployees, level }: { employee: Employee; allEmployees: Employee[]; level: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasReports = allEmployees.some((e) => e.idManagerDirect === employee.idUser);
  const isActive = employee.statutCompte === "ACTIF";

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Node Card */}
      <div className={`flex items-center gap-4 p-4 rounded-3xl transition-all border
        ${isActive 
          ? "bg-white border-gray-100 shadow-sm hover:border-blue-200" 
          : "bg-gray-50 border-gray-100 opacity-80"
        }`}>
        
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border-2 
          ${isActive ? "border-blue-50 bg-blue-50 text-blue-500" : "border-gray-200 bg-gray-100 text-gray-400"}`}>
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt={employee.nom} className="w-full h-full object-cover" />
          ) : (
            <User size={20} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">
            {employee.prenom} <span className="uppercase">{employee.nom}</span>
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            <span className="flex items-center gap-1"><Briefcase size={10} /> {employee.poste || "Non assigné"}</span>
            <span className="flex items-center gap-1"><MapPin size={10} /> {employee.departement}</span>
          </div>
        </div>

        {/* Toggle */}
        {hasReports && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
              ${isExpanded ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasReports && (
        <div className="mt-4">
          <EmployeeTree employees={allEmployees} managerId={employee.idUser} level={level + 1} />
        </div>
      )}
    </div>
  );
}


