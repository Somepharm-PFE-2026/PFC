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

    public RequeteController(RequeteRepository requeteRepository, 
                             UtilisateurRepository utilisateurRepository,
                             DemandeAdministrativeService administrativeService,
                             DemandeCongeService congeService,
                             DemandeDocumentService documentService) {
        this.requeteRepository = requeteRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.administrativeService = administrativeService;
        this.congeService = congeService;
        this.documentService = documentService;
    }

    @GetMapping("/hr-queue")
    public ResponseEntity<List<Requete>> getHrQueue(Authentication auth) {
        // Robust role extraction from authorities
        boolean isSuperAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("SUPER_ADMIN"));
        boolean isHrManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR_MANAGER") || a.getAuthority().equals("HR_MANAGER"));
        boolean isRhAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_RH_ADMIN") || a.getAuthority().equals("RH_ADMIN"));

        List<Requete> queue = requeteRepository.findByStatutCycleVieIn(
            List.of("EN_ATTENTE_RH", "ATTENTE", "VALIDE_MANAGER", "EN_ATTENTE_MANAGER", "APPROUVE", "APPROUVÉ", "REFUSE", "REFUSÉ", "EN_ATTENTE", "VALIDÉ_MANAGER", "ANNULE", "ANNULÉ")
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


    @PutMapping("/{id}/manager-validate")
    public ResponseEntity<?> managerValidate(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        Requete req = requeteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Requete introuvable"));

        String comment = payload.get("comment");
        Utilisateur manager = utilisateurRepository.findByMatricule(auth.getName()).get();

        req.setStatutCycleVie("VALIDE_MANAGER");
        req.setDateActionManager(LocalDateTime.now());
        req.setNomManagerAction(manager.getPrenom() + " " + manager.getNom());
        req.setCommentaireManager(comment);
        
        // 🚀 Set the HR Chronometer start anchor
        req.setDateArriveeRh(LocalDateTime.now());

        return ResponseEntity.ok(requeteRepository.save(req));
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

        // 🛡️ ENFORCE HIERARCHY
        if (req.getDemandeur() != null && req.getDemandeur().getRole() != null) {
            String demandeurRole = req.getDemandeur().getRole().getNomRole();
            
            if (demandeurRole.equals("RH_ADMIN") && !role.equals("HR_MANAGER") && !role.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("Action impossible : Seul un HR_MANAGER peut valider la demande d'un RH_ADMIN");
            }
            if (demandeurRole.equals("HR_MANAGER") && !role.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("Action impossible : Seul le SUPER_ADMIN peut valider la demande d'un HR_MANAGER");
            }
        }

        // action values: APPROUVE, REFUSE, ATTENTE
        String comment = payload != null ? payload.get("comment") : "";

        if (req instanceof DemandeAdministrative) {
            return ResponseEntity.ok(administrativeService.updateStatus(id, action, comment));
        } else if (req instanceof DemandeConge) {
            return ResponseEntity.ok(congeService.updateStatut(id, action, comment));
        } else if (req instanceof DemandeDocument) {
            return ResponseEntity.ok(documentService.updateStatut(id, action, comment));
        } else {
            // Generic update for other types if any
            req.setStatutCycleVie(action);
            req.setCommentaireAction(comment);
            return ResponseEntity.ok(requeteRepository.save(req));
        }
    }

    @PostMapping("/submit-administrative")
    public ResponseEntity<DemandeAdministrative> submitAdministrative(@RequestBody DemandeAdministrative demande, Authentication auth) {
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        demande.setDemandeur(currentUser);
        demande.setDateSoumission(LocalDateTime.now());
        demande.setStatutCycleVie("EN_ATTENTE_RH"); // Direct to HR as requested
        demande.setDateArriveeRh(LocalDateTime.now()); // Start ticking HR chronometer

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
