package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.WorkflowEtapeRepository;
import com.somepharm.hrportal.repository.WorkflowMappingRepository;
import com.somepharm.hrportal.repository.RequeteRepository;
import com.somepharm.hrportal.repository.DepartementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WorkflowService {

    private final WorkflowMappingRepository mappingRepository;
    private final WorkflowEtapeRepository etapeRepository;
    private final RequeteRepository requeteRepository;
    private final DepartementRepository departementRepository;

    public WorkflowService(WorkflowMappingRepository mappingRepository,
                           WorkflowEtapeRepository etapeRepository,
                           RequeteRepository requeteRepository,
                           DepartementRepository departementRepository) {
        this.mappingRepository = mappingRepository;
        this.etapeRepository = etapeRepository;
        this.requeteRepository = requeteRepository;
        this.departementRepository = departementRepository;
    }

    @Transactional
    public void initiateWorkflow(Requete req, String typeRequete) {
        Optional<WorkflowMapping> mappingOpt = mappingRepository.findByTypeRequete(typeRequete);
        
        if (mappingOpt.isPresent()) {
            WorkflowCircuit circuit = mappingOpt.get().getCircuit();
            List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(circuit.getIdCircuit());
            
            if (!etapes.isEmpty()) {
                WorkflowEtape firstStep = etapes.get(0);
                req.setCurrentCircuit(circuit);
                req.setCurrentEtapeOrdre(firstStep.getOrdre());
                req.setStatutCycleVie(mapRoleToStatus(firstStep.getRoleValidateur()));
                return;
            }
        }
        
        // Fallback if no mapping or circuit defined
        req.setStatutCycleVie("EN_ATTENTE_RH");
    }

    @Transactional
    public Requete processValidation(Requete req, String action, String comment, String actorName) {
        if ("REFUSE".equalsIgnoreCase(action) || "REFUSÉ".equalsIgnoreCase(action)) {
            req.setStatutCycleVie("REFUSÉ");
            req.setCommentaireAction(comment);
            return requeteRepository.save(req);
        }

        if (req.getCurrentCircuit() == null) {
            // Fallback for requests without dynamic workflow
            req.setStatutCycleVie("APPROUVÉ");
            req.setCommentaireAction(comment);
            return requeteRepository.save(req);
        }

        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(req.getCurrentCircuit().getIdCircuit());
        
        Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                .filter(e -> e.getOrdre() == req.getCurrentEtapeOrdre())
                .findFirst();

        if (currentStepOpt.isPresent()) {
            WorkflowEtape currentStep = currentStepOpt.get();
            
            // Move to next step
            Optional<WorkflowEtape> nextStepOpt = etapes.stream()
                    .filter(e -> e.getOrdre() > currentStep.getOrdre())
                    .findFirst();

            if (nextStepOpt.isPresent()) {
                WorkflowEtape nextStep = nextStepOpt.get();
                req.setCurrentEtapeOrdre(nextStep.getOrdre());
                req.setStatutCycleVie(mapRoleToStatus(nextStep.getRoleValidateur()));
                
                // Log action based on who validated
                if ("MANAGER".equals(currentStep.getRoleValidateur()) || "CHEF_DEPARTEMENT".equals(currentStep.getRoleValidateur())) {
                    req.setDateActionManager(LocalDateTime.now());
                    req.setNomManagerAction(actorName);
                    req.setCommentaireManager(comment);
                } else {
                    req.setCommentaireAction(comment);
                }
            } else {
                // No more steps -> Final approval
                req.setStatutCycleVie("APPROUVÉ");
                req.setCommentaireAction(comment);
                if ("MANAGER".equals(currentStep.getRoleValidateur()) || "CHEF_DEPARTEMENT".equals(currentStep.getRoleValidateur())) {
                    req.setDateActionManager(LocalDateTime.now());
                    req.setNomManagerAction(actorName);
                    req.setCommentaireManager(comment);
                }
            }
        } else {
            req.setStatutCycleVie("APPROUVÉ");
        }

        return requeteRepository.save(req);
    }

    public boolean canUserValidate(Requete req, Utilisateur user) {
        if (req.getStatutCycleVie().startsWith("APPROUV") || req.getStatutCycleVie().startsWith("REFUS")) {
            return false;
        }

        if (req.getCurrentCircuit() == null) {
            // Fallback: HR can validate everything if no circuit
            String role = user.getRole().getNomRole();
            return "RH_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "SUPER_ADMIN".equals(role);
        }

        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(req.getCurrentCircuit().getIdCircuit());
        Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                .filter(e -> e.getOrdre() == req.getCurrentEtapeOrdre())
                .findFirst();

        if (currentStepOpt.isPresent()) {
            WorkflowEtape step = currentStepOpt.get();
            switch (step.getRoleValidateur()) {
                case "MANAGER":
                    if (req.getDemandeur() == null || req.getDemandeur().getManagerDirect() == null) return false;
                    return req.getDemandeur().getManagerDirect().getIdUser().equals(user.getIdUser());
                case "CHEF_DEPARTEMENT":
                    String deptName = req.getDemandeur().getDepartement();
                    if (deptName == null) return false;
                    Optional<Departement> deptOpt = departementRepository.findByNomDept(deptName);
                    return deptOpt.isPresent() && 
                           deptOpt.get().getManager() != null &&
                           deptOpt.get().getManager().getIdUser().equals(user.getIdUser());
                case "RH_ADMIN":
                    String roleA = user.getRole().getNomRole();
                    return "RH_ADMIN".equals(roleA) || "HR_MANAGER".equals(roleA) || "SUPER_ADMIN".equals(roleA);
                case "HR_MANAGER":
                    String roleM = user.getRole().getNomRole();
                    return "HR_MANAGER".equals(roleM) || "SUPER_ADMIN".equals(roleM);
                default:
                    return false;
            }
        }

        return false;
    }

    public static boolean isPendingStatus(String status) {
        if (status == null) return false;
        return status.equals("EN_ATTENTE_MANAGER") || 
               status.equals("EN_ATTENTE_CHEF_DEPT") || 
               status.equals("EN_ATTENTE_RH") || 
               status.equals("VALIDE_MANAGER") ||
               status.equals("ATTENTE");
    }

    @Transactional
    public void syncRequestsForCircuit(Long idCircuit) {
        List<Requete> requests = requeteRepository.findByCurrentCircuit_IdCircuit(idCircuit);
        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(idCircuit);
        
        for (Requete req : requests) {
            // Only sync pending requests
            if (!isPendingStatus(req.getStatutCycleVie())) continue;
            
            // Find if current step order still exists
            Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                    .filter(e -> req.getCurrentEtapeOrdre() != null && e.getOrdre() == req.getCurrentEtapeOrdre())
                    .findFirst();
            
            if (currentStepOpt.isPresent()) {
                // Update status to match validator role of the step (in case it changed)
                req.setStatutCycleVie(mapRoleToStatus(currentStepOpt.get().getRoleValidateur()));
            } else {
                // If the current step order no longer exists, move to the nearest higher order or reset
                Optional<WorkflowEtape> nextBestStep = etapes.stream()
                        .filter(e -> req.getCurrentEtapeOrdre() != null && e.getOrdre() >= req.getCurrentEtapeOrdre())
                        .findFirst();
                
                if (nextBestStep.isPresent()) {
                    req.setCurrentEtapeOrdre(nextBestStep.get().getOrdre());
                    req.setStatutCycleVie(mapRoleToStatus(nextBestStep.get().getRoleValidateur()));
                } else if (!etapes.isEmpty()) {
                    // Fallback to first step if completely lost
                    WorkflowEtape first = etapes.get(0);
                    req.setCurrentEtapeOrdre(first.getOrdre());
                    req.setStatutCycleVie(mapRoleToStatus(first.getRoleValidateur()));
                } else {
                    // No steps left in circuit -> Fallback to RH
                    req.setCurrentCircuit(null);
                    req.setCurrentEtapeOrdre(0);
                    req.setStatutCycleVie("EN_ATTENTE_RH");
                }
            }
        }
        requeteRepository.saveAll(requests);
    }

    private String mapRoleToStatus(String role) {
        switch (role) {
            case "MANAGER":
                return "EN_ATTENTE_MANAGER";
            case "CHEF_DEPARTEMENT":
                return "EN_ATTENTE_CHEF_DEPT";
            case "RH_ADMIN":
            case "HR_MANAGER":
                return "EN_ATTENTE_RH";
            default:
                return "EN_ATTENTE_RH";
        }
    }
}
