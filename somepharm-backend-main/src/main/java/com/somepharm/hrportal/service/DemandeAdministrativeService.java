package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.DemandeAdministrative;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeAdministrativeRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DemandeAdministrativeService {

    private final DemandeAdministrativeRepository repository;
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public DemandeAdministrativeService(DemandeAdministrativeRepository repository,
                                        UtilisateurRepository utilisateurRepository,
                                        NotificationService notificationService,
                                        AuditService auditService) {
        this.repository = repository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    public DemandeAdministrative createDemande(DemandeAdministrative demande) {
        demande.setDateSoumission(LocalDateTime.now());
        // For administrative requests (Situation familiale, etc.), 
        // they often go straight to HR list or need a Manager witness depending on policy.
        // User asked: "Exception: Si une demande ne nécessite pas d'avis... elle peut arriver directement chez le RH."
        // We will assume MISE_A_JOUR_INFO goes to EN_ATTENTE_RH directly.
        demande.setStatutCycleVie("EN_ATTENTE_RH");
        demande.setDateArriveeRh(LocalDateTime.now());
        return repository.save(demande);
    }

    public List<DemandeAdministrative> getAll() {
        return repository.findAll();
    }

    @Transactional
    public DemandeAdministrative updateStatus(UUID id, String status, String comment) {
        DemandeAdministrative dm = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande Administrative introuvable"));

        System.out.println("[DEBUG] updateStatus called for ID: " + id + " with status: " + status);
        boolean isApproving = "APPROUVE".equalsIgnoreCase(status) || "APPROUVÉ".equalsIgnoreCase(status);
        System.out.println("[DEBUG] isApproving: " + isApproving);
        
        if (isApproving) {
            // AUTOMATIC DATA SYNC
            applyChangesToUser(dm);
            dm.setStatutCycleVie("APPROUVÉ");
        } else {
            dm.setStatutCycleVie(status);
        }

        dm.setCommentaireAction(comment);
        
        // Audit
        String author = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        auditService.logAction("MUTATION_ADMIN", "Validation admin #" + id + " -> " + status, author);
        
        notificationService.createNotification(dm.getDemandeur().getIdUser(), 
            "Votre demande administrative #" + id + " a été mise à jour : [" + status + "]");

        return repository.save(dm);
    }

    private void applyChangesToUser(DemandeAdministrative dm) {
        if (dm.getDemandeur() == null) return;
        
        // Refetch to ensure we are working with a managed entity from the current session
        Utilisateur user = utilisateurRepository.findById(dm.getDemandeur().getIdUser())
                .orElse(dm.getDemandeur());

        if (dm.getNouveauStatutMarital() != null && !dm.getNouveauStatutMarital().isEmpty()) {
            try {
                // Ensure case-insensitive matching and handle potential extra spaces
                String status = dm.getNouveauStatutMarital().trim().toUpperCase();
                com.somepharm.hrportal.entity.SituationFamiliale sf = com.somepharm.hrportal.entity.SituationFamiliale.valueOf(status);
                user.setSituationFamiliale(sf);
                System.out.println("[SYNC SUCCESS] Updated family situation for user " + user.getMatricule() + " to " + sf);
            } catch (Exception e) {
                System.err.println("[SYNC ERROR] Failed to parse marital status: " + dm.getNouveauStatutMarital());
            }
        }

        if (dm.getNouveauTelephone() != null && !dm.getNouveauTelephone().isEmpty()) {
            user.setTelephone(dm.getNouveauTelephone());
        }

        // The save here is important as it's within a Transactional method
        utilisateurRepository.save(user);
        utilisateurRepository.flush(); // Force immediate database sync
    }
}
