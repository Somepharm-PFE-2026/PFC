package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.DepartementDTO;
import com.somepharm.hrportal.entity.Departement;
import com.somepharm.hrportal.repository.DepartementRepository;
import com.somepharm.hrportal.repository.PosteRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
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
        
        // Auto-create a default manager "Poste" for this new department
        com.somepharm.hrportal.entity.Poste managerPoste = new com.somepharm.hrportal.entity.Poste();
        managerPoste.setTitre("RESPONSABLE DE " + savedDept.getNomDept().toUpperCase());
        managerPoste.setTitrePoste("RESPONSABLE DE " + savedDept.getNomDept().toUpperCase());
        managerPoste.setDepartement(savedDept);
        posteRepository.save(managerPoste);
        
        return savedDept;
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
            
            // Automatically upgrade their poste and role!
            newManager.setPoste("RESPONSABLE DE " + existing.getNomDept());
            roleRepository.findByNomRole("MANAGER").ifPresent(newManager::setRole);
            newManager.setManagerDirect(null);
            newManager = utilisateurRepository.save(newManager);

            existing.setManager(newManager);

            // Safe Manager Inheritance Logic
            List<com.somepharm.hrportal.entity.Utilisateur> allDeptEmployees = utilisateurRepository.findByDepartement(existing.getNomDept());
            
            for (com.somepharm.hrportal.entity.Utilisateur emp : allDeptEmployees) {
                // Do not update the new manager themselves!
                if (newManager.getIdUser() != null && newManager.getIdUser().equals(emp.getIdUser())) continue;
                
                if (forceOverwriteAll) {
                    // Force overwrite for EVERYONE in the department
                    emp.setManagerDirect(newManager);
                    utilisateurRepository.save(emp);
                } else {
                    // Cible B: No manager assigned
                    if (emp.getManagerDirect() == null) {
                        emp.setManagerDirect(newManager);
                        utilisateurRepository.save(emp);
                    } 
                    // Cible A: Manager was the old department head
                    else if (oldManager != null && emp.getManagerDirect().getIdUser().equals(oldManager.getIdUser())) {
                        emp.setManagerDirect(newManager);
                        utilisateurRepository.save(emp);
                    }
                    // Cible C: Different manager (Team Lead) -> do not touch
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