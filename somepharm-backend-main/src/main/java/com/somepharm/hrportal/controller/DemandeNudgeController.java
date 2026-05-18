package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Requete;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.RequeteRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/demandes")
@CrossOrigin(origins = "http://localhost:3000")
public class DemandeNudgeController {

    private final RequeteRepository requeteRepository;
    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurRepository;

    public DemandeNudgeController(RequeteRepository requeteRepository, 
                                  NotificationService notificationService,
                                  UtilisateurRepository utilisateurRepository) {
        this.requeteRepository = requeteRepository;
        this.notificationService = notificationService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PutMapping("/{id}/nudge")
    public ResponseEntity<String> nudgeRequest(@PathVariable java.util.UUID id, Authentication auth) {
        // 1. Fetch Request
        Requete requete = requeteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée."));

        // 3. Status Check: Can only nudge if it's still with the manager
        if (!"EN_ATTENTE_MANAGER".equals(requete.getStatutCycleVie())) {
            return ResponseEntity.badRequest().body("Cette demande n'est plus en attente de validation manager.");
        }

        // 4. Anti-Spam Check (24h)
        LocalDateTime now = LocalDateTime.now();
        if (requete.getLastNudgedAt() != null && requete.getLastNudgedAt().plusHours(24).isAfter(now)) {
            return ResponseEntity.badRequest().body("Une seule relance autorisée toutes les 24h.");
        }

        // 5. Update Request
        requete.setUrgent(true);
        requete.setLastNudgedAt(now);
        requete.setNudgeCount(requete.getNudgeCount() + 1);
        
        // Traceability (Section 7): Capture the nudge in the commentary logic or a separate field if needed.
        // For now, we update the main timestamped status.
        String timeStr = now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String traceText = "\n[RELANCE RH le " + timeStr + "]";
        if (requete.getCommentaireAction() == null) {
            requete.setCommentaireAction(traceText);
        } else {
            requete.setCommentaireAction(requete.getCommentaireAction() + traceText);
        }

        requeteRepository.save(requete);

        // 6. Notify Manager
        Utilisateur employe = requete.getDemandeur();
        if (employe.getManagerDirect() != null) {
            String managerMsg = "⚠️ RELANCE RH: La demande de " + employe.getPrenom() + " " + employe.getNom() + 
                               " (" + employe.getMatricule() + ") nécessite votre attention immédiate.";
            notificationService.createNotification(employe.getManagerDirect().getIdUser(), managerMsg);
        }

        return ResponseEntity.ok("Relance envoyée avec succès.");
    }
}
