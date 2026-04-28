package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.dto.DemandeCongeDTO;
import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeCongeRepository; // NEW: Needed to fetch raw data
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DemandeCongeService;
import com.somepharm.hrportal.service.WorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/demandes")
@CrossOrigin(origins = "http://localhost:3000")
public class DemandeCongeController {

    private final DemandeCongeService demandeCongeService;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeCongeRepository demandeCongeRepository;
    private final com.somepharm.hrportal.repository.TypeCongeRepository typeCongeRepository;
    private final WorkflowService workflowService;

    public DemandeCongeController(DemandeCongeService demandeCongeService,
                                  UtilisateurRepository utilisateurRepository,
                                  DemandeCongeRepository demandeCongeRepository,
                                  com.somepharm.hrportal.repository.TypeCongeRepository typeCongeRepository,
                                  WorkflowService workflowService) {
        this.demandeCongeService = demandeCongeService;
        this.utilisateurRepository = utilisateurRepository;
        this.demandeCongeRepository = demandeCongeRepository;
        this.typeCongeRepository = typeCongeRepository;
        this.workflowService = workflowService;
    }

    @GetMapping("/types")
    public ResponseEntity<List<com.somepharm.hrportal.entity.TypeConge>> getLeaveTypes() {
        return ResponseEntity.ok(typeCongeRepository.findAll());
    }

    @PostMapping("/submit")
    public ResponseEntity<DemandeCongeDTO> submitDemande(@RequestBody DemandeConge demande) {
        demande.setDateSoumission(java.time.LocalDateTime.now());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        demande.setDemandeur(user);
        
        // 🛡️ SECURITY & BALANCE CHECK: Ensure the user has enough days
        if (demande.getDateDebut() != null && demande.getDateFin() != null) {
            // Check 1: Start date cannot be in the past
            if (demande.getDateDebut().isBefore(java.time.LocalDate.now())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Check 2: Balance check
            long requestedDays = demandeCongeService.calculerJoursOuvrables(demande.getDateDebut(), demande.getDateFin());
            if (user.getSoldeConges() < requestedDays) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        }
        
        // 🚀 DYNAMIC ROUTING: Use WorkflowService to assign the circuit based on mapping
        workflowService.initiateWorkflow(demande, "DEMANDE_CONGE");

        DemandeConge saved = demandeCongeService.createDemande(demande);
        return new ResponseEntity<>(demandeCongeService.convertToDTO(saved), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<List<DemandeCongeDTO>> getMyRequests(Principal principal) {
        List<DemandeCongeDTO> list = demandeCongeService.getRequestsByMatricule(principal.getName())
                .stream()
                // 🚀 UPGRADE: Sort the employee's personal requests so the newest is at the top
                .sorted((d1, d2) -> {
                    if (d1.getDateSoumission() == null) return 1;
                    if (d2.getDateSoumission() == null) return -1;
                    return d2.getDateSoumission().compareTo(d1.getDateSoumission());
                })
                .map(demandeCongeService::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/all")
    public ResponseEntity<List<DemandeCongeDTO>> getAll(Authentication auth) {
        // 1. Who is asking to see the data?
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // 2. Fetch ALL raw entities directly from the database
        List<DemandeConge> allDemandesRaw = demandeCongeRepository.findAll();

        // 3. Filter by Department and Sort by Date
        List<DemandeCongeDTO> filteredList = allDemandesRaw.stream()
                .filter(demande -> {
                    String roleName = currentUser.getRole().getNomRole();
                    
                    // 🚀 TRANSPARENCY HUB: RH_ADMIN and SUPER_ADMIN now see everything
                    if ("RH_ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName) || "HR_MANAGER".equals(roleName)) {
                        return true;
                    }

                    // MANAGER is restricted: Only sees requests they are supposed to validate
                    if ("MANAGER".equals(roleName)) {
                        return workflowService.canUserValidate(demande, currentUser);
                    }

                    // NORMAL EMPLOYEES shouldn't be calling this, but if they do, block it.
                    return false;
                })
                // 🚀 UPGRADE: Sort the manager's view so newest requests are at the top
                .sorted((d1, d2) -> {
                    if (d1.getDateSoumission() == null) return 1;
                    if (d2.getDateSoumission() == null) return -1;
                    return d2.getDateSoumission().compareTo(d1.getDateSoumission());
                })
                // 4. Convert the secure, sorted list back to DTOs for the Frontend
                .map(demandeCongeService::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredList);
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<DemandeCongeDTO> update(
            @PathVariable Long id,
            @RequestParam String statut,
            @RequestParam(required = false) String commentaire) {

        DemandeConge updated = demandeCongeService.updateStatut(id, statut, commentaire);
        return ResponseEntity.ok(demandeCongeService.convertToDTO(updated));
    }
    @PutMapping("/{id}/annuler")
    public ResponseEntity<DemandeCongeDTO> annulerDemande(@PathVariable Long id, Authentication auth) {
        DemandeConge updated = demandeCongeService.annulerDemande(id, auth.getName());
        return ResponseEntity.ok(demandeCongeService.convertToDTO(updated));
    }
}