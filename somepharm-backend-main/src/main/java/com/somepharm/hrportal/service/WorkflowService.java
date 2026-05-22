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
import java.util.UUID;

@Service
public class WorkflowService {

    private final WorkflowMappingRepository mappingRepository;
    private final WorkflowEtapeRepository etapeRepository;
    private final RequeteRepository requeteRepository;
    private final DepartementRepository departementRepository;
    private final DemandeCongeService congeService;
    private final DemandeAdministrativeService administrativeService;
    private final DemandeDocumentService documentService;

    public WorkflowService(WorkflowMappingRepository mappingRepository,
                           WorkflowEtapeRepository etapeRepository,
                           RequeteRepository requeteRepository,
                           DepartementRepository departementRepository,
                           @org.springframework.context.annotation.Lazy DemandeCongeService congeService,
                           @org.springframework.context.annotation.Lazy DemandeAdministrativeService administrativeService,
                           @org.springframework.context.annotation.Lazy DemandeDocumentService documentService) {
        this.mappingRepository = mappingRepository;
        this.etapeRepository = etapeRepository;
        this.requeteRepository = requeteRepository;
        this.departementRepository = departementRepository;
        this.congeService = congeService;
        this.administrativeService = administrativeService;
        this.documentService = documentService;
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
                req.setStatutCycleVie(mapRoleToStatus(firstStep.getRoleValidateur().getNomRole()));
                return;
            }
        }
        
        // Fallback if no mapping or circuit defined
        req.setStatutCycleVie("EN_ATTENTE_RH");
    }

    public boolean hasMapping(String typeRequete) {
        return mappingRepository.findByTypeRequete(typeRequete).isPresent();
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
            Requete saved = requeteRepository.save(req);
            return triggerTerminalActions(saved);
        }

        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(req.getCurrentCircuit().getIdCircuit());
        
        Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                .filter(e -> e.getOrdre() == req.getCurrentEtapeOrdre())
                .findFirst();

        if (currentStepOpt.isPresent()) {
            WorkflowEtape currentStep = currentStepOpt.get();
            String currentRole = currentStep.getRoleValidateur().getNomRole();
            
            // Move to next step
            Optional<WorkflowEtape> nextStepOpt = etapes.stream()
                    .filter(e -> e.getOrdre() > currentStep.getOrdre())
                    .findFirst();

            if (nextStepOpt.isPresent()) {
                WorkflowEtape nextStep = nextStepOpt.get();
                req.setCurrentEtapeOrdre(nextStep.getOrdre());
                req.setStatutCycleVie(mapRoleToStatus(nextStep.getRoleValidateur().getNomRole()));
                
                // Log action based on who validated
                if ("MANAGER".equals(currentRole) || "CHEF_DEPARTEMENT".equals(currentRole)) {
                    req.setDateActionManager(LocalDateTime.now());
                    req.setCommentaireManager(comment);
                } else {
                    req.setCommentaireAction(comment);
                }
            } else {
                // No more steps -> Final approval
                req.setStatutCycleVie("APPROUVÉ");
                req.setCommentaireAction(comment);
                if ("MANAGER".equals(currentRole) || "CHEF_DEPARTEMENT".equals(currentRole)) {
                    req.setDateActionManager(LocalDateTime.now());
                    req.setCommentaireManager(comment);
                }
            }
        } else {
            req.setStatutCycleVie("APPROUVÉ");
        }

        Requete saved = requeteRepository.save(req);

        // If the request is now fully approved, trigger side effects
        if ("APPROUVÉ".equalsIgnoreCase(saved.getStatutCycleVie())) {
            return triggerTerminalActions(saved);
        }

        return saved;
    }

    private Requete triggerTerminalActions(Requete req) {
        String action = "APPROUVE";
        String comment = req.getCommentaireAction();
        UUID id = req.getIdRequete();

        if (req instanceof DemandeConge) {
            return congeService.updateStatut(id, action, comment);
        } else if (req instanceof DemandeAdministrative) {
            return administrativeService.updateStatus(id, action, comment);
        } else if (req instanceof DemandeDocument) {
            return documentService.updateStatut(id, action, comment);
        }
        return req;
    }

    public boolean canUserValidate(Requete req, Utilisateur user) {
        if (req.getStatutCycleVie().startsWith("APPROUV") || req.getStatutCycleVie().startsWith("REFUS")) {
            return false;
        }

        if (req.getCurrentCircuit() == null) {
            System.out.println("[WORKFLOW DEBUG] canUserValidate: circuit is NULL for req=" + req.getIdRequete() + ", user=" + user.getMatricule() + " role=" + user.getRole().getNomRole() + " → fallback (HR only)");
            String role = user.getRole().getNomRole();
            return "RH_ADMIN".equals(role) || "HR_MANAGER".equals(role) || "SUPER_ADMIN".equals(role);
        }

        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(req.getCurrentCircuit().getIdCircuit());
        System.out.println("[WORKFLOW DEBUG] canUserValidate: req=" + req.getIdRequete() + " circuit=" + req.getCurrentCircuit().getIdCircuit() + " etapeOrdre=" + req.getCurrentEtapeOrdre() + " etapesCount=" + etapes.size());

        Optional<WorkflowEtape> currentStepOpt = etapes.stream()
                .filter(e -> req.getCurrentEtapeOrdre() != null && e.getOrdre() == req.getCurrentEtapeOrdre())
                .findFirst();

        if (!currentStepOpt.isPresent()) {
            System.out.println("[WORKFLOW DEBUG] canUserValidate: NO matching etape found for ordre=" + req.getCurrentEtapeOrdre() + " in circuit=" + req.getCurrentCircuit().getIdCircuit());
        }

        if (currentStepOpt.isPresent()) {
            WorkflowEtape step = currentStepOpt.get();
            String roleName = step.getRoleValidateur().getNomRole();
            
            // 🔍 DEBUG: Identify the step and request
            System.out.println("[WORKFLOW DEBUG] canUserValidate: Checking request " + req.getIdRequete() + " at step role: " + roleName);

            switch (roleName) {
                case "MANAGER":
                    if (req.getDemandeur() == null || req.getDemandeur().getManagerDirect() == null) {
                        System.out.println("[WORKFLOW DEBUG] MANAGER check failed: Demandeur or ManagerDirect is null.");
                        return false;
                    }
                    boolean isManager = java.util.Objects.equals(req.getDemandeur().getManagerDirect().getIdUser(), user.getIdUser());
                    System.out.println("[WORKFLOW DEBUG] MANAGER check: " + isManager + " (ReqMgr=" + req.getDemandeur().getManagerDirect().getIdUser() + ", CurrentUser=" + user.getIdUser() + ")");
                    return isManager;

                case "CHEF_DEPARTEMENT":
                    if (req.getDemandeur() == null || req.getDemandeur().getDepartement() == null) {
                        System.out.println("[WORKFLOW DEBUG] CHEF_DEPARTEMENT check failed: Demandeur or Department is null.");
                        return false;
                    }
                    Departement dept = req.getDemandeur().getDepartement();
                    boolean isChef = dept.getManager() != null && java.util.Objects.equals(dept.getManager().getIdUser(), user.getIdUser());
                    System.out.println("[WORKFLOW DEBUG] CHEF_DEPARTEMENT check: " + isChef + " (DeptMgr=" + (dept.getManager() != null ? dept.getManager().getIdUser() : "NULL") + ", CurrentUser=" + user.getIdUser() + ")");
                    return isChef;

                case "RH_ADMIN":
                    String roleA = user.getRole().getNomRole();
                    boolean isRH = "RH_ADMIN".equals(roleA) || "HR_MANAGER".equals(roleA) || "SUPER_ADMIN".equals(roleA);
                    System.out.println("[WORKFLOW DEBUG] RH_ADMIN check: " + isRH + " (UserRole=" + roleA + ")");
                    return isRH;

                case "HR_MANAGER":
                    String roleM = user.getRole().getNomRole();
                    boolean isHRM = "HR_MANAGER".equals(roleM) || "SUPER_ADMIN".equals(roleM);
                    System.out.println("[WORKFLOW DEBUG] HR_MANAGER check: " + isHRM + " (UserRole=" + roleM + ")");
                    return isHRM;

                default:
                    System.out.println("[WORKFLOW DEBUG] Unknown role: " + roleName);
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
                req.setStatutCycleVie(mapRoleToStatus(currentStepOpt.get().getRoleValidateur().getNomRole()));
            } else {
                // If the current step order no longer exists, move to the nearest higher order or reset
                Optional<WorkflowEtape> nextBestStep = etapes.stream()
                        .filter(e -> req.getCurrentEtapeOrdre() != null && e.getOrdre() >= req.getCurrentEtapeOrdre())
                        .findFirst();
                
                if (nextBestStep.isPresent()) {
                    req.setCurrentEtapeOrdre(nextBestStep.get().getOrdre());
                    req.setStatutCycleVie(mapRoleToStatus(nextBestStep.get().getRoleValidateur().getNomRole()));
                } else if (!etapes.isEmpty()) {
                    // Fallback to first step if completely lost
                    WorkflowEtape first = etapes.get(0);
                    req.setCurrentEtapeOrdre(first.getOrdre());
                    req.setStatutCycleVie(mapRoleToStatus(first.getRoleValidateur().getNomRole()));
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

    /**
     * When a mapping is created/updated, migrate all in-progress requests of that
     * typeRequete to start following the new circuit from its first step.
     */
    @Transactional
    public void syncRequestsForType(String typeRequete, WorkflowCircuit newCircuit) {
        List<WorkflowEtape> etapes = etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(newCircuit.getIdCircuit());
        if (etapes.isEmpty()) return;

        WorkflowEtape firstStep = etapes.get(0);

        List<Requete> allRequests = requeteRepository.findAll();
        List<Requete> toUpdate = new java.util.ArrayList<>();
        for (Requete req : allRequests) {
            if (!isPendingStatus(req.getStatutCycleVie())) continue;
            boolean matches = switch (typeRequete) {
                case "DEMANDE_CONGE" -> req instanceof DemandeConge;
                default -> {
                    if (req instanceof DemandeConge dc) {
                        if (dc.getTypeConge() != null) {
                            String specName = "CONGE_" + dc.getTypeConge().getNom().toUpperCase().replaceAll("[^A-Z0-9_]", "_");
                            yield typeRequete.equals(specName) || typeRequete.equals(dc.getTypeConge().getNom());
                        }
                        yield false;
                    }
                    else if (req instanceof DemandeDocument doc) yield typeRequete.equals(doc.getTypeDocument());
                    else if (req instanceof DemandeAdministrative adm) yield typeRequete.equals(adm.getTypeDemande());
                    else yield false;
                }
            };
            if (!matches) continue;
            req.setCurrentCircuit(newCircuit);
            req.setCurrentEtapeOrdre(firstStep.getOrdre());
            req.setStatutCycleVie(mapRoleToStatus(firstStep.getRoleValidateur().getNomRole()));
            toUpdate.add(req);
        }
        if (!toUpdate.isEmpty()) requeteRepository.saveAll(toUpdate);
    }
}
