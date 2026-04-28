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
            return "HR_MANAGER".equals(user.getRole().getNomRole()) || "SUPER_ADMIN".equals(user.getRole().getNomRole());
        }

        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(req.getCurrentCircuit().getIdCircuit());
        Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                .filter(e -> e.getOrdre() == req.getCurrentEtapeOrdre())
                .findFirst();

        if (currentStepOpt.isPresent()) {
            WorkflowEtape step = currentStepOpt.get();
            switch (step.getRoleValidateur()) {
                case "MANAGER":
                    return req.getDemandeur().getManagerDirect() != null && 
                           req.getDemandeur().getManagerDirect().getIdUser().equals(user.getIdUser());
                case "CHEF_DEPARTEMENT":
                    String deptName = req.getDemandeur().getDepartement();
                    if (deptName == null) return false;
                    Optional<Departement> deptOpt = departementRepository.findByNomDept(deptName);
                    return deptOpt.isPresent() && 
                           deptOpt.get().getManager() != null &&
                           deptOpt.get().getManager().getIdUser().equals(user.getIdUser());
                case "HR_MANAGER":
                    return "HR_MANAGER".equals(user.getRole().getNomRole()) || 
                           "SUPER_ADMIN".equals(user.getRole().getNomRole()) ||
                           "RH_ADMIN".equals(user.getRole().getNomRole());
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

    private String mapRoleToStatus(String role) {
        switch (role) {
            case "MANAGER":
                return "EN_ATTENTE_MANAGER";
            case "CHEF_DEPARTEMENT":
                return "EN_ATTENTE_CHEF_DEPT";
            case "HR_MANAGER":
                return "EN_ATTENTE_RH";
            default:
                return "EN_ATTENTE_RH";
        }
    }
}
