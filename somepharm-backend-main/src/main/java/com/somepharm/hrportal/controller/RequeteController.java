package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.DemandeAdministrative;
import com.somepharm.hrportal.entity.Requete;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.RequeteRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DemandeAdministrativeService;
import com.somepharm.hrportal.service.DemandeCongeService;
import com.somepharm.hrportal.service.DemandeDocumentService;
import com.somepharm.hrportal.service.WorkflowService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requetes")
@CrossOrigin(origins = "http://localhost:3000")
public class RequeteController {

    private final RequeteRepository requeteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeAdministrativeService administrativeService;
    private final DemandeCongeService congeService;
    private final DemandeDocumentService documentService;
    private final WorkflowService workflowService;

    public RequeteController(RequeteRepository requeteRepository, 
                             UtilisateurRepository utilisateurRepository,
                             DemandeAdministrativeService administrativeService,
                             DemandeCongeService congeService,
                             DemandeDocumentService documentService,
                             WorkflowService workflowService) {
        this.requeteRepository = requeteRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.administrativeService = administrativeService;
        this.congeService = congeService;
        this.documentService = documentService;
        this.workflowService = workflowService;
    }

    @GetMapping("/hr-queue")
    public ResponseEntity<List<Requete>> getHrQueue(Authentication auth) {
        // Robust role extraction from authorities
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("SUPER_ADMIN"));
        boolean isHrManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR_MANAGER") || a.getAuthority().equals("HR_MANAGER"));
        boolean isRhAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_RH_ADMIN") || a.getAuthority().equals("RH_ADMIN"));

        List<Requete> queue = requeteRepository.findByStatutCycleVieIn(
            List.of("EN_ATTENTE_RH", "ATTENTE", "VALIDE_MANAGER", "EN_ATTENTE_MANAGER", "EN_ATTENTE_CHEF_DEPT", "APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "EN_ATTENTE", "VALIDÉ_MANAGER", "ANNULE", "ANNULÉ")
        );

        List<Requete> filtered = queue.stream().filter(r -> {
            if (r.getDemandeur() == null || r.getDemandeur().getRole() == null) return true;
            String demandeurRole = r.getDemandeur().getRole().getNomRole();
            if (demandeurRole.startsWith("ROLE_")) demandeurRole = demandeurRole.replace("ROLE_", "");
            
            if (isSuperAdmin) {
                // SUPER_ADMIN sees everything
                return true;
            } else if (isHrManager) {
                // HR_MANAGER sees everyone except SUPER_ADMIN (optional: can see themselves but can't validate)
                return !demandeurRole.equals("SUPER_ADMIN");
            } else if (isRhAdmin) {
                // RH_ADMIN manages standard employees and managers only
                return !demandeurRole.equals("RH_ADMIN") && !demandeurRole.equals("HR_MANAGER") && !demandeurRole.equals("SUPER_ADMIN");
            }
            return false;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }
    @GetMapping("/manager-queue")
    public ResponseEntity<List<Requete>> getManagerQueue(Authentication auth) {
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        List<Requete> allRequetes = requeteRepository.findAllPendingWithDetails();
        
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Requete> filtered = allRequetes.stream()
                .filter(req -> {
                    boolean canValidate = workflowService.canUserValidate(req, currentUser);
                    if (!canValidate) {
                        System.out.println("[DEBUG] Manager Queue: User " + currentUser.getMatricule() + " CANNOT validate request " + req.getIdRequete() + " (Status: " + req.getStatutCycleVie() + ")");
                        return false;
                    }
                    
                    // 🚀 MIDNIGHT RULE: Cancelled requests disappear for managers after today
                    if (req.getStatutCycleVie() != null && req.getStatutCycleVie().startsWith("ANNUL")) {
                        return req.getDateSoumission() != null && req.getDateSoumission().isAfter(todayStart);
                    }
                    
                    System.out.println("[DEBUG] Manager Queue: User " + currentUser.getMatricule() + " CAN validate request " + req.getIdRequete());
                    return true;
                })
                .sorted((r1, r2) -> {
                    if (r1.getDateSoumission() == null) return 1;
                    if (r2.getDateSoumission() == null) return -1;
                    return r2.getDateSoumission().compareTo(r1.getDateSoumission());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @PutMapping("/{id}/manager-validate")
    public ResponseEntity<?> managerValidate(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        Requete req = requeteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requete introuvable"));

        String comment = payload.get("comment");
        Utilisateur manager = utilisateurRepository.findByMatricule(auth.getName()).get();

        if (!workflowService.canUserValidate(req, manager)) {
            return ResponseEntity.status(403).body("Action impossible : Vous n'êtes pas le validateur désigné pour cette étape du workflow.");
        }

        // 🚀 DYNAMIC WORKFLOW: Progress based on circuit
        return ResponseEntity.ok(workflowService.processValidation(req, "APPROUVE", comment, manager.getPrenom() + " " + manager.getNom()));
    }

    @PutMapping("/{id}/hr-action")
    public ResponseEntity<?> hrAction(@PathVariable Long id, @RequestParam String action, @RequestBody(required = false) Map<String, String> payload, Authentication auth) {
        System.out.println("[SECURITY DEBUG] HR Action attempt by user: " + auth.getName());
        System.out.println("[SECURITY DEBUG] User Authorities: " + auth.getAuthorities());

        boolean isHR = auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_RH_ADMIN") || a.equals("RH_ADMIN") || 
                               a.equals("ROLE_HR_MANAGER") || a.equals("HR_MANAGER") || 
                               a.equals("ROLE_SUPER_ADMIN") || a.equals("SUPER_ADMIN"));
        
        if (!isHR) {
            System.err.println("[SECURITY ERROR] User " + auth.getName() + " is NOT authorized as HR!");
            return ResponseEntity.status(403).body("Accès refusé : Rôle RH requis.");
        }

        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String role = currentUser.getRole().getNomRole();

        Requete req = requeteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requete introuvable"));

        if (!workflowService.canUserValidate(req, currentUser)) {
            return ResponseEntity.status(403).body("Action impossible : Vous n'êtes pas le validateur désigné pour cette étape du workflow ou n'avez pas les droits RH requis.");
        }

        // action values: APPROUVE, REFUSE, ATTENTE
        String comment = payload != null ? payload.get("comment") : "";

        // 🚀 DYNAMIC WORKFLOW: Progress based on circuit
        Requete updated = workflowService.processValidation(req, action, comment, currentUser.getPrenom() + " " + currentUser.getNom());
        
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/submit-administrative")
    public ResponseEntity<DemandeAdministrative> submitAdministrative(@RequestBody DemandeAdministrative demande, Authentication auth) {
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        demande.setDemandeur(currentUser);
        demande.setDateSoumission(LocalDateTime.now());
        
        // 🚀 DYNAMIC ROUTING: Use WorkflowService
        workflowService.initiateWorkflow(demande, demande.getTypeDemande());

        return ResponseEntity.ok(requeteRepository.save(demande));
    }

    @PostMapping("/{id}/upload-justificatif")
    public ResponseEntity<?> uploadJustificatif(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "comment", required = false) String comment,
            Authentication auth) throws IOException {

        Requete req = requeteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requete introuvable"));

        // Security check: Only the owner can upload for their request
        if (!req.getDemandeur().getMatricule().equals(auth.getName())) {
            return ResponseEntity.status(403).body("Non autorisé à modifier cette requête");
        }

        // Save file to 'uploads' directory
        String uploadDir = "./uploads";
        File directory = new File(uploadDir);
        if (!directory.exists()) directory.mkdirs();

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Update Requete
        req.setJustificatifUrl("/api/uploads/" + fileName);
        if (comment != null && !comment.isEmpty()) {
            req.setDescription((req.getDescription() != null ? req.getDescription() + "\n--- Réponse Employé ---\n" : "") + comment);
        }
        
        // Push back to HR queue
        req.setStatutCycleVie("EN_ATTENTE_RH");
        req.setDateArriveeRh(LocalDateTime.now()); // Reset/update the arrival time for priority

        return ResponseEntity.ok(requeteRepository.save(req));
    }
}
