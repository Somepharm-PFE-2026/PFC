package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.dto.DemandeDocumentDTO;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeDocumentRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DemandeDocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demandes-documents")
@CrossOrigin(origins = "http://localhost:3000")
public class DemandeDocumentController {

    private final DemandeDocumentService demandeDocumentService;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeDocumentRepository demandeDocumentRepository;

    public DemandeDocumentController(DemandeDocumentService demandeDocumentService,
                                     UtilisateurRepository utilisateurRepository,
                                     DemandeDocumentRepository demandeDocumentRepository) {
        this.demandeDocumentService = demandeDocumentService;
        this.utilisateurRepository = utilisateurRepository;
        this.demandeDocumentRepository = demandeDocumentRepository;
    }

    @PostMapping("/submit")
    public ResponseEntity<DemandeDocumentDTO> submitDemande(@RequestBody DemandeDocument demande) {
        demande.setDateSoumission(LocalDateTime.now());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        demande.setDemandeur(user);
        
        // Documents usually go straight to RH_ADMIN for approval, bypassing the MANAGER.
        // As per the plan: unified RH list means they go to EN_ATTENTE_RH or similar.
        demande.setStatutCycleVie("EN_ATTENTE_RH");

        DemandeDocument saved = demandeDocumentService.createDemande(demande);
        return new ResponseEntity<>(demandeDocumentService.convertToDTO(saved), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<List<DemandeDocumentDTO>> getMyRequests(java.security.Principal principal) {
        List<DemandeDocumentDTO> list = demandeDocumentService.getRequestsByMatricule(principal.getName())
                .stream()
                .sorted((d1, d2) -> {
                    if (d1.getDateSoumission() == null) return 1;
                    if (d2.getDateSoumission() == null) return -1;
                    return d2.getDateSoumission().compareTo(d1.getDateSoumission());
                })
                .map(demandeDocumentService::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all")
    public ResponseEntity<List<DemandeDocumentDTO>> getAll(Authentication auth) {
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Only RH_ADMIN and SUPER_ADMIN should see all document requests
        String roleName = currentUser.getRole().getNomRole();
        if (!"RH_ADMIN".equals(roleName) && !"SUPER_ADMIN".equals(roleName) && !"HR_MANAGER".equals(roleName)) {
             return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<DemandeDocument> allDemandesRaw = demandeDocumentRepository.findAll();

        List<DemandeDocumentDTO> filteredList = allDemandesRaw.stream()
                .filter(demande -> {
                    String currentRole = currentUser.getRole().getNomRole();
                    // HR and Super Admin see everything
                    if ("RH_ADMIN".equals(currentRole) || "SUPER_ADMIN".equals(currentRole) || "HR_MANAGER".equals(currentRole)) {
                        return true;
                    }
                    // Default logic: only see pending/standard items if any (mostly handled by specific endpoints)
                    return "EN_ATTENTE_RH".equals(demande.getStatutCycleVie());
                })
                .sorted((d1, d2) -> {
                    if (d1.getDateSoumission() == null) return 1;
                    if (d2.getDateSoumission() == null) return -1;
                    return d2.getDateSoumission().compareTo(d1.getDateSoumission());
                })
                .map(demandeDocumentService::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredList);
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<DemandeDocumentDTO> updateStatut(
            @PathVariable Long id,
            @RequestParam String statut,
            @RequestParam(required = false) String commentaire) {

        DemandeDocument updated = demandeDocumentService.updateStatut(id, statut, commentaire);
        return ResponseEntity.ok(demandeDocumentService.convertToDTO(updated));
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<DemandeDocumentDTO> annulerDemande(@PathVariable Long id, Authentication auth) {
        DemandeDocument updated = demandeDocumentService.annulerDemande(id, auth.getName());
        return ResponseEntity.ok(demandeDocumentService.convertToDTO(updated));
    }
}
