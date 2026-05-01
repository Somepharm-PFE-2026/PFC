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
    private final com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository;
    private final com.somepharm.hrportal.repository.TypeCongeRepository typeCongeRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final HolidayService holidayService;

    public DemandeCongeService(DemandeCongeRepository demandeCongeRepository, 
                               com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository,
                               com.somepharm.hrportal.repository.TypeCongeRepository typeCongeRepository,
                               AuditService auditService, 
                               NotificationService notificationService, 
                               HolidayService holidayService) {
        this.demandeCongeRepository = demandeCongeRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.typeCongeRepository = typeCongeRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.holidayService = holidayService;
    }

    public DemandeConge createDemande(DemandeConge demande) {
        // 🚀 OVERLAP PREVENTION: Check if user already has a leave for these dates
        List<DemandeConge> existing = demandeCongeRepository.findByDemandeur_Matricule(demande.getDemandeur().getMatricule());
        
        boolean hasOverlap = existing.stream()
            .filter(d -> {
                String status = d.getStatutCycleVie() != null ? d.getStatutCycleVie().toUpperCase() : "";
                return !status.equals("ANNULÉ") && 
                       !status.equals("ANNULE") && 
                       !status.contains("REFUSE") && 
                       !status.contains("REFUSÉ");
            })
            .anyMatch(d -> {
                LocalDate startA = d.getDateDebut();
                LocalDate endA = d.getDateFin();
                LocalDate startB = demande.getDateDebut();
                LocalDate endB = demande.getDateFin();
                
                // Logic: (StartA <= EndB) and (EndA >= StartB)
                return !startA.isAfter(endB) && !endB.isBefore(startA) && !endA.isBefore(startB);
            });
        
        if (hasOverlap) {
            throw new RuntimeException("Vous avez déjà une demande de congé (active ou validée) sur cette période. Veuillez choisir d'autres dates ou annuler la précédente.");
        }

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
    public long calculerJoursOuvrables(LocalDate debut, LocalDate fin) {
        long joursOuvrables = 0;
        LocalDate dateCourante = debut;

        while (!dateCourante.isAfter(fin)) {
            DayOfWeek jour = dateCourante.getDayOfWeek();
            // En Algérie, le week-end = Vendredi et Samedi
            if (jour != DayOfWeek.FRIDAY && jour != DayOfWeek.SATURDAY && !holidayService.isHoliday(dateCourante)) {
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

        if (isApproving && !demande.isBalanceDeducted()) {
            // 🚀 FETCH FULL TYPE: Ensure we have the name even if only ID was sent
            com.somepharm.hrportal.entity.TypeConge fullType = null;
            if (demande.getTypeConge() != null && demande.getTypeConge().getIdTypeConge() != null) {
                fullType = typeCongeRepository.findById(demande.getTypeConge().getIdTypeConge()).orElse(null);
            }

            // 🚀 STRAT: Only deduct for "Congé Annuel". Other leaves are free.
            boolean isAnnualLeave = fullType != null && "Congé Annuel".equalsIgnoreCase(fullType.getNom());

            if (isAnnualLeave) {
                Utilisateur demandeur = demande.getDemandeur();
                long jours = calculerJoursOuvrables(demande.getDateDebut(), demande.getDateFin());

                System.out.println("--- BALANCE DEDUCTION TRIGGERED ---");
                System.out.println("Employee: " + demandeur.getMatricule() + " (Role: " + demandeur.getRole().getNomRole() + ")");
                System.out.println("Current Balance: " + demandeur.getSoldeConges());
                System.out.println("Deducting: " + jours + " days");

                if (demandeur.getSoldeConges() < (int) jours) {
                    throw new RuntimeException("Solde insuffisant (" + demandeur.getSoldeConges() + " jours restants, demande exige: " + jours + " jours).");
                }
                
                demandeur.setSoldeConges(demandeur.getSoldeConges() - (int) jours);
                utilisateurRepository.save(demandeur); // 🚀 CRITICAL: Explicitly save the user entity!
                demande.setBalanceDeducted(true);
                
                System.out.println("New Balance: " + demandeur.getSoldeConges());
                System.out.println("------------------------------------");
            } else {
                System.out.println("Approval: Leave type [" + (fullType != null ? fullType.getNom() : "NULL") + "] does not require balance deduction.");
                demande.setBalanceDeducted(true); // Mark as "processed" even if no deduction needed
            }
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

    @Transactional
    public DemandeConge annulerDemande(Long id, String matricule) {
        DemandeConge demande = demandeCongeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!demande.getDemandeur().getMatricule().equals(matricule)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler cette demande.");
        }
        
        if (demande.getStatutCycleVie() != null && (demande.getStatutCycleVie().startsWith("APPROUV") || demande.getStatutCycleVie().startsWith("REFUS"))) {
            throw new RuntimeException("Les demandes déjà traitées ne peuvent pas être annulées.");
        }
        
        demande.setStatutCycleVie("ANNULÉ");
        
        String author = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        auditService.logAction("MUTATION", "Annulation de la demande de congé #" + id, author);
        
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