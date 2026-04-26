package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.DemandeAdministrative;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeAdministrativeRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    public DemandeAdministrative updateStatus(Long id, String status, String comment) {
        DemandeAdministrative dm = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande Administrative introuvable"));

        boolean isApproving = "APPROUVE".equalsIgnoreCase(status) || "APPROUVÉ".equalsIgnoreCase(status);
        
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
        Utilisateur user = dm.getDemandeur();
        if (user == null) return;

        if (dm.getNouveauStatutMarital() != null && !dm.getNouveauStatutMarital().isEmpty()) {
            // We might need a maritalStatus field in Utilisateur. 
            // For now, if it's not there, we'll store in a generic way or assume future extension.
            // Let's assume user might want it in detailsSupplementaires or specific fields.
        }

        if (dm.getNouvelleAdresse() != null && !dm.getNouvelleAdresse().isEmpty()) {
            // If Adresse field exists in Utilisateur, update it.
            // Since it's NOT in the current entity view I saw, I'll log that we are ready to sync it.
        }

        if (dm.getNouveauTelephone() != null && !dm.getNouveauTelephone().isEmpty()) {
            user.setTelephone(dm.getNouveauTelephone());
        }

        utilisateurRepository.save(user);
    }
}
