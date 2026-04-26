package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.DemandeCongeDTO;
import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeCongeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DemandeCongeService {

    private final DemandeCongeRepository demandeCongeRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public DemandeCongeService(DemandeCongeRepository demandeCongeRepository, AuditService auditService, NotificationService notificationService) {
        this.demandeCongeRepository = demandeCongeRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    public DemandeConge createDemande(DemandeConge demande) {
        return demandeCongeRepository.save(demande);
    }

    public List<DemandeCongeDTO> getAllDemandes() {
        return demandeCongeRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DemandeConge> getRequestsByMatricule(String matricule) {
        return demandeCongeRepository.findByDemandeur_Matricule(matricule);
    }

    /**
     * 🚀 NEW ALGERIAN BUSINESS LOGIC:
     * Calcule uniquement les jours ouvrables (Ignore Vendredi et Samedi)
     */
    private long calculerJoursOuvrables(LocalDate debut, LocalDate fin) {
        long joursOuvrables = 0;
        LocalDate dateCourante = debut;

        while (!dateCourante.isAfter(fin)) {
            DayOfWeek jour = dateCourante.getDayOfWeek();
            // En Algérie, le week-end = Vendredi et Samedi
            if (jour != DayOfWeek.FRIDAY && jour != DayOfWeek.SATURDAY) {
                joursOuvrables++;
            }
            // Passer au jour suivant
            dateCourante = dateCourante.plusDays(1);
        }
        return joursOuvrables;
    }

    @Transactional
    public DemandeConge updateStatut(Long id, String nouveauStatut, String commentaire) {
        DemandeConge demande = demandeCongeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        // 🚀 ACCENT-PROOF CHECK: Accepts "APPROUVE", "approuvé", etc.
        boolean isApproving = "APPROUVE".equalsIgnoreCase(nouveauStatut) || "APPROUVÉ".equalsIgnoreCase(nouveauStatut);
        boolean wasNotApproved = !"APPROUVE".equalsIgnoreCase(demande.getStatutCycleVie()) && !"APPROUVÉ".equalsIgnoreCase(demande.getStatutCycleVie());

        if (isApproving && wasNotApproved) {
            Utilisateur demandeur = demande.getDemandeur();

            // 🚀 Use the new Smart Math instead of ChronoUnit
            long jours = calculerJoursOuvrables(demande.getDateDebut(), demande.getDateFin());

            if (demandeur.getSoldeConges() < (int) jours) {
                throw new RuntimeException("Solde insuffisant (" + demandeur.getSoldeConges() + " jours restants, demande exige: " + jours + " jours).");
            }
            demandeur.setSoldeConges(demandeur.getSoldeConges() - (int) jours);
        }

        // Normalize the status string to ensure it's always saved correctly in the DB
        demande.setStatutCycleVie(isApproving ? "APPROUVÉ" : nouveauStatut);
        demande.setCommentaireAction(commentaire);

        String author = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        
        // 🚀 SELF-APPROVAL PROTECTION: You cannot approve or reject your own request
        if (demande.getDemandeur().getMatricule().equals(author)) {
            throw new RuntimeException("Action interdite : vous ne pouvez pas valider ou refuser votre propre demande.");
        }

        auditService.logAction("MUTATION", "Changement de statut pour la demande #" + id + " vers " + nouveauStatut, author);

        // --- NEW: Trigger Notification for the employee ---
        String notificationMessage = "Votre demande de congé #" + id + " a été mise à jour : nouveau statut [" + nouveauStatut + "].";
        notificationService.createNotification(demande.getDemandeur().getIdUser(), notificationMessage);

        return demandeCongeRepository.save(demande);
    }

    public DemandeCongeDTO convertToDTO(DemandeConge demande) {
        DemandeCongeDTO dto = new DemandeCongeDTO();
        dto.setIdRequete(demande.getIdRequete());
        dto.setDateSoumission(demande.getDateSoumission());
        dto.setDescription(demande.getDescription());

        // Removed the invalid setStatut line. Just keep this one:
        dto.setStatutCycleVie(demande.getStatutCycleVie());

        dto.setCommentaireAction(demande.getCommentaireAction());
        dto.setUrgent(demande.isUrgent());
        if (demande.getLastNudgedAt() != null) {
            dto.setLastNudgedAt(demande.getLastNudgedAt().toString());
        }

        if (demande.getDemandeur() != null) {
            dto.setDemandeurId(demande.getDemandeur().getIdUser());
            dto.setDemandeurMatricule(demande.getDemandeur().getMatricule());
        }

        dto.setDateDebut(demande.getDateDebut());
        dto.setDateFin(demande.getDateFin());
        dto.setMotif(demande.getMotif());
        dto.setTypeConge(demande.getTypeConge() != null ? demande.getTypeConge().getNom() : "Congé");

        return dto;
    }
}