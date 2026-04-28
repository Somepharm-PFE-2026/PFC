package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.DepartementDTO;
import com.somepharm.hrportal.entity.Departement;
import com.somepharm.hrportal.repository.DepartementRepository;
import com.somepharm.hrportal.repository.PosteRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.repository.RoleRepository;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DepartementService {

    private final DepartementRepository departementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PosteRepository posteRepository;
    private final RoleRepository roleRepository;

    public DepartementService(DepartementRepository departementRepository, 
                              UtilisateurRepository utilisateurRepository,
                              PosteRepository posteRepository,
                              RoleRepository roleRepository) {
        this.departementRepository = departementRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.posteRepository = posteRepository;
        this.roleRepository = roleRepository;
    }

    public Departement createDepartement(Departement departement) {
        Departement savedDept = departementRepository.save(departement);
        
        // Auto-create default positions for this new department
        createDefaultPostes(savedDept);
        
        return savedDept;
    }

    private void createDefaultPostes(Departement dept) {
        String deptName = dept.getNomDept().toUpperCase();
        
        // 1. Manager Position
        String managerTitre = "RESPONSABLE DE " + deptName;
        if (!posteRepository.existsByTitreAndDepartement_IdDept(managerTitre, dept.getIdDept())) {
            com.somepharm.hrportal.entity.Poste managerPoste = new com.somepharm.hrportal.entity.Poste();
            managerPoste.setTitre(managerTitre);
            managerPoste.setTitrePoste(managerTitre);
            managerPoste.setDepartement(dept);
            posteRepository.save(managerPoste);
        }
        
        // 2. Employee Position
        String employeeTitre = "EMP_" + deptName;
        if (!posteRepository.existsByTitreAndDepartement_IdDept(employeeTitre, dept.getIdDept())) {
            com.somepharm.hrportal.entity.Poste employeePoste = new com.somepharm.hrportal.entity.Poste();
            employeePoste.setTitre(employeeTitre);
            employeePoste.setTitrePoste(employeeTitre);
            employeePoste.setDepartement(dept);
            posteRepository.save(employeePoste);
        }
    }

    @PostConstruct
    public void init() {
        syncDepartementPostes();
        fixHierarchyCycles();
    }

    public void fixHierarchyCycles() {
        System.out.println("[HIERARCHY CHECK] Scanning for cycles...");
        List<com.somepharm.hrportal.entity.Utilisateur> all = utilisateurRepository.findAll();
        for (com.somepharm.hrportal.entity.Utilisateur u : all) {
            java.util.Set<Long> visited = new java.util.HashSet<>();
            com.somepharm.hrportal.entity.Utilisateur current = u;
            
            while (current != null && current.getManagerDirect() != null) {
                if (visited.contains(current.getIdUser()) || current.getIdUser().equals(current.getManagerDirect().getIdUser())) {
                    // 🛡️ CYCLE DETECTED!
                    System.err.println("Hierarchical Cycle detected for user: " + current.getIdUser() + " (" + current.getNom() + "). Breaking cycle.");
                    current.setManagerDirect(null);
                    utilisateurRepository.save(current);
                    break;
                }
                visited.add(current.getIdUser());
                
                // Move up the chain
                current = current.getManagerDirect();
                
                // Safety break for extremely deep or buggy chains
                if (visited.size() > 500) {
                    System.err.println("Chain too deep (>500) for user: " + u.getIdUser() + ". Breaking chain to avoid crash.");
                    u.setManagerDirect(null);
                    utilisateurRepository.save(u);
                    break;
                }
            }
        }
        System.out.println("[HIERARCHY CHECK] Scan complete.");
    }

    public void syncDepartementPostes() {
        System.out.println("[POSTE AUTO-CONFIG] Synchronizing default positions for all departments...");
        List<Departement> departments = departementRepository.findAll();
        for (Departement dept : departments) {
            createDefaultPostes(dept);
        }
        System.out.println("[POSTE AUTO-CONFIG] Synchronization complete.");
    }

    public List<DepartementDTO> getAllDepartements() {
        return departementRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DepartementDTO convertToDTO(Departement departement) {
        DepartementDTO dto = new DepartementDTO();
        dto.setIdDept(departement.getIdDept());
        dto.setNomDept(departement.getNomDept());

        if (departement.getManager() != null) {
            dto.setManagerId(departement.getManager().getIdUser());
            dto.setManagerMatricule(departement.getManager().getMatricule());
            dto.setManagerEmail(departement.getManager().getEmail());
            dto.setManagerNom(departement.getManager().getNom());
            dto.setManagerPrenom(departement.getManager().getPrenom());
        }

        return dto;
    }

    public Departement updateDepartement(Long id, Departement updatedData, boolean forceOverwriteAll) {
        Departement existing = departementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Département introuvable"));

        if (updatedData.getNomDept() != null) {
            existing.setNomDept(updatedData.getNomDept());
        }

        if (updatedData.getManager() != null && updatedData.getManager().getIdUser() != null) {
            com.somepharm.hrportal.entity.Utilisateur oldManager = existing.getManager();
            com.somepharm.hrportal.entity.Utilisateur newManager = utilisateurRepository.findById(updatedData.getManager().getIdUser())
                    .orElseThrow(() -> new RuntimeException("Manager introuvable"));
            
            if (forceOverwriteAll) {
                // 🛡️ MODE: ASSIGN DEPARTMENT HEAD
                
                // 1. Demote Old Manager if exists
                if (oldManager != null && !oldManager.getIdUser().equals(newManager.getIdUser())) {
                    oldManager.setPoste("EMP_" + existing.getNomDept().toUpperCase());
                    roleRepository.findByNomRole("EMPLOYE").ifPresent(oldManager::setRole);
                    oldManager.setManagerDirect(newManager); // 🛡️ Smart Link: Old head reports to new head
                    utilisateurRepository.save(oldManager);
                }

                // 2. Promote New Manager to RESPONSABLE
                newManager.setPoste("RESPONSABLE DE " + existing.getNomDept().toUpperCase());
                roleRepository.findByNomRole("MANAGER").ifPresent(newManager::setRole);
                newManager.setManagerDirect(null);
                utilisateurRepository.save(newManager);

                existing.setManager(newManager);

                // 3. 🛡️ SMART CASCADE: Preserve sub-hierarchies (Team Leads)
                List<com.somepharm.hrportal.entity.Utilisateur> allDeptEmployees = utilisateurRepository.findByDepartement(existing.getNomDept());
                for (com.somepharm.hrportal.entity.Utilisateur emp : allDeptEmployees) {
                    // Do not update the new manager themselves!
                    if (newManager.getIdUser().equals(emp.getIdUser())) continue;

                    // CASE A: Employee was reporting directly to the OLD manager
                    // CASE B: Employee had no manager assigned
                    boolean reportsToOldManager = oldManager != null && emp.getManagerDirect() != null && emp.getManagerDirect().getIdUser().equals(oldManager.getIdUser());
                    boolean hasNoManager = emp.getManagerDirect() == null;

                    if (reportsToOldManager || hasNoManager) {
                        emp.setManagerDirect(newManager);
                        utilisateurRepository.save(emp);
                    }
                    // CASE C: Employee reports to someone else (e.g., a Team Lead) -> LEAVE UNCHANGED
                }
            } else {
                // 🛡️ MODE: ASSIGN TEAM LEAD (CHEF D'EQUIPE)
                
                // 1. Promote to Chef d'équipe
                newManager.setPoste("CHEF D'EQUIPE");
                roleRepository.findByNomRole("MANAGER").ifPresent(newManager::setRole);
                
                // 2. Resolve hierarchy: Their manager is the current Department Head
                if (existing.getManager() != null && !existing.getManager().getIdUser().equals(newManager.getIdUser())) {
                    newManager.setManagerDirect(existing.getManager());
                } else {
                    newManager.setManagerDirect(null);
                }
                
                utilisateurRepository.save(newManager);
                
                // 3. 🛡️ SMART CASCADE (if checkbox was checked in frontend)
                // Note: The 'forceOverwriteAll' boolean is used here too if passed
                if (forceOverwriteAll) {
                    List<com.somepharm.hrportal.entity.Utilisateur> allDeptEmployees = utilisateurRepository.findByDepartement(existing.getNomDept());
                    for (com.somepharm.hrportal.entity.Utilisateur emp : allDeptEmployees) {
                        if (newManager.getIdUser().equals(emp.getIdUser())) continue;

                        // If they were already a Chef d'équipe, demote them because they now report to a new Lead
                        if ("CHEF D'EQUIPE".equalsIgnoreCase(emp.getPoste())) {
                            emp.setPoste("EMP_" + existing.getNomDept().toUpperCase());
                            roleRepository.findByNomRole("EMPLOYE").ifPresent(emp::setRole);
                        }
                        
                        emp.setManagerDirect(newManager);
                        utilisateurRepository.save(emp);
                    }
                }
            }
        }

        return departementRepository.save(existing);
    }

    public void deleteDepartement(Long id) {
        Departement dept = departementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Département introuvable"));

        // 🛡️ FAIL-SAFE: Check for linked job positions
        long posteCount = posteRepository.countByDepartement_IdDept(id);
        if (posteCount > 0) {
            throw new RuntimeException("Impossible de supprimer ce département : " + posteCount + " poste(s) y sont encore liés.");
        }

        // 🛡️ FAIL-SAFE: Check for active employees
        long userCount = utilisateurRepository.countByDepartement(dept.getNomDept());
        if (userCount > 0) {
            throw new RuntimeException("Impossible de supprimer ce département : " + userCount + " collaborateur(s) y sont encore affectés.");
        }

        departementRepository.delete(dept);
    }
}