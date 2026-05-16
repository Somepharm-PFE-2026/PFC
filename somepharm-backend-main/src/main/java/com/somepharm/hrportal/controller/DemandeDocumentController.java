package com.somepharm.hrportal.controller;

import java.util.UUID;

import com.somepharm.hrportal.dto.DemandeDocumentDTO;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeDocumentRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DemandeDocumentService;
import com.somepharm.hrportal.service.WorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final WorkflowService workflowService;

    public DemandeDocumentController(DemandeDocumentService demandeDocumentService,
                                     UtilisateurRepository utilisateurRepository,
                                     DemandeDocumentRepository demandeDocumentRepository,
                                     WorkflowService workflowService) {
        this.demandeDocumentService = demandeDocumentService;
        this.utilisateurRepository = utilisateurRepository;
        this.demandeDocumentRepository = demandeDocumentRepository;
        this.workflowService = workflowService;
    }

    @PostMapping("/submit")
    public ResponseEntity<DemandeDocumentDTO> submitDemande(@RequestBody DemandeDocument demande) {
        demande.setDateSoumission(LocalDateTime.now());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        demande.setDemandeur(user);
        
        // 🚀 DYNAMIC ROUTING: Use WorkflowService to assign the circuit based on mapping
        workflowService.initiateWorkflow(demande, demande.getTypeDocument());

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

        String roleName = currentUser.getRole().getNomRole();
        if (!"RH_ADMIN".equals(roleName) && !"SUPER_ADMIN".equals(roleName) && !"HR_MANAGER".equals(roleName)
                && !"MANAGER".equals(roleName) && !"CHEF_DEPARTEMENT".equals(roleName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<DemandeDocument> allDemandesRaw = demandeDocumentRepository.findAll();

        List<DemandeDocumentDTO> filteredList = allDemandesRaw.stream()
                .filter(demande -> {
                    String currentRole = currentUser.getRole().getNomRole();
                    if ("RH_ADMIN".equals(currentRole) || "SUPER_ADMIN".equals(currentRole) || "HR_MANAGER".equals(currentRole)) {
                        return true;
                    }
                    if ("MANAGER".equals(currentRole) || "CHEF_DEPARTEMENT".equals(currentRole)) {
                        return workflowService.canUserValidate(demande, currentUser);
                    }
                    return false;
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

    @PreAuthorize("hasAnyRole('MANAGER', 'CHEF_DEPARTEMENT', 'RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PutMapping("/{id}/statut")
    public ResponseEntity<DemandeDocumentDTO> updateStatut(
            @PathVariable UUID id,
            @RequestParam String statut,
            @RequestParam(required = false) String commentaire,
            Authentication auth) {

        DemandeDocument demande = demandeDocumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 🛡️ SECURITY: Verify if the user is authorized to validate this specific request
        if (!workflowService.canUserValidate(demande, currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        DemandeDocument updated = demandeDocumentService.updateStatut(id, statut, commentaire);
        return ResponseEntity.ok(demandeDocumentService.convertToDTO(updated));
    }

    @PutMapping("/{id}/annuler")
    public ResponseEntity<DemandeDocumentDTO> annulerDemande(@PathVariable UUID id, Authentication auth) {
        DemandeDocument updated = demandeDocumentService.annulerDemande(id, auth.getName());
        return ResponseEntity.ok(demandeDocumentService.convertToDTO(updated));
    }
}
