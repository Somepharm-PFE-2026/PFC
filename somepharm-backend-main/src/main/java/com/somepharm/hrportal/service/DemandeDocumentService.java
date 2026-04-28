package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.DemandeDocumentDTO;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.entity.BonDeSortie;
import com.somepharm.hrportal.repository.DemandeDocumentRepository;
import com.somepharm.hrportal.repository.BonDeSortieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class DemandeDocumentService {

    private final DemandeDocumentRepository demandeDocumentRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final BonDeSortieRepository bonDeSortieRepository;

    public DemandeDocumentService(DemandeDocumentRepository demandeDocumentRepository, 
                                 AuditService auditService, 
                                 NotificationService notificationService, 
                                 BonDeSortieRepository bonDeSortieRepository) {
        this.demandeDocumentRepository = demandeDocumentRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.bonDeSortieRepository = bonDeSortieRepository;
    }

    public DemandeDocument createDemande(DemandeDocument demande) {
        if ("BON_SORTIE".equals(demande.getTypeDocument())) {
            LocalDateTime startOfDay = demande.getDateSoumission().toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = demande.getDateSoumission().toLocalDate().atTime(23, 59, 59);
            
            List<DemandeDocument> existing = demandeDocumentRepository.findByDemandeurAndTypeDocumentAndDateSoumissionBetween(
                demande.getDemandeur(), 
                "BON_SORTIE", 
                startOfDay, 
                endOfDay
            );
            
            boolean hasActiveRequest = existing.stream()
                .anyMatch(d -> !"ANNULÉ".equals(d.getStatutCycleVie()) && !"REFUSE".equals(d.getStatutCycleVie()) && !"REFUSÉ".equals(d.getStatutCycleVie()));
            
            if (hasActiveRequest) {
                throw new RuntimeException("Vous avez déjà une demande de bon de sortie pour aujourd'hui. Veuillez annuler la précédente si vous souhaitez en créer une nouvelle.");
            }
        }
        return demandeDocumentRepository.save(demande);
    }

    @Transactional
    public DemandeDocument annulerDemande(Long id, String matricule) {
        DemandeDocument demande = demandeDocumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!demande.getDemandeur().getMatricule().equals(matricule)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler cette demande.");
        }
        
        if (demande.getStatutCycleVie() != null && (demande.getStatutCycleVie().startsWith("APPROUV") || demande.getStatutCycleVie().startsWith("REFUS"))) {
            throw new RuntimeException("Les demandes déjà traitées ne peuvent pas être annulées.");
        }
        
        demande.setStatutCycleVie("ANNULÉ");
        
        String author = SecurityContextHolder.getContext().getAuthentication().getName();
        auditService.logAction("MUTATION", "Annulation de la demande de doc #" + id, author);
        
        return demandeDocumentRepository.save(demande);
    }

    public List<DemandeDocumentDTO> getAllDemandes() {
        return demandeDocumentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<DemandeDocument> getRequestsByMatricule(String matricule) {
        return demandeDocumentRepository.findByDemandeur_Matricule(matricule);
    }

    @Transactional
    public DemandeDocument updateStatut(Long id, String nouveauStatut, String commentaire) {
        DemandeDocument demande = demandeDocumentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de document non trouvée"));

        boolean isApproving = "APPROUVE".equalsIgnoreCase(nouveauStatut) || "APPROUVÉ".equalsIgnoreCase(nouveauStatut);
        
        demande.setStatutCycleVie(isApproving ? "APPROUVÉ" : nouveauStatut);
        demande.setCommentaireAction(commentaire);

        if (isApproving && "BON_SORTIE".equals(demande.getTypeDocument())) {
            if (!bonDeSortieRepository.existsByIdRequeteOrigine(demande.getIdRequete())) {
                BonDeSortie bds = new BonDeSortie();
                bds.setDemandeur(demande.getDemandeur());
                bds.setIdRequeteOrigine(demande.getIdRequete());
                bds.setHeureDebutAutorisee(demande.getHeureDebut());
                bds.setHeureFinAutorisee(demande.getHeureFin());
                bds.setMotif(demande.getDescription());
                bds.setStatut("EN_ATTENTE");
                bonDeSortieRepository.save(bds);
            }
        }

        String author = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // 🚀 SELF-APPROVAL PROTECTION: You cannot approve or reject your own request
        if (demande.getDemandeur().getMatricule().equals(author)) {
            throw new RuntimeException("Action interdite : vous ne pouvez pas valider ou refuser votre propre demande.");
        }

        auditService.logAction("MUTATION", "Changement de statut pour la demande de doc #" + id + " vers " + nouveauStatut, author);

        String notificationMessage = "Votre demande de document #" + id + " a été mise à jour : nouveau statut [" + nouveauStatut + "].";
        notificationService.createNotification(demande.getDemandeur().getIdUser(), notificationMessage);

        return demandeDocumentRepository.save(demande);
    }

    public DemandeDocumentDTO convertToDTO(DemandeDocument demande) {
        DemandeDocumentDTO dto = new DemandeDocumentDTO();
        dto.setIdRequete(demande.getIdRequete());
        dto.setDateSoumission(demande.getDateSoumission());
        dto.setDescription(demande.getDescription());
        dto.setStatutCycleVie(demande.getStatutCycleVie());
        dto.setCommentaireAction(demande.getCommentaireAction());

        if (demande.getDemandeur() != null) {
            dto.setDemandeurId(demande.getDemandeur().getIdUser());
            dto.setDemandeurMatricule(demande.getDemandeur().getMatricule());
        }

        dto.setUrgent(demande.isUrgent());
        if (demande.getLastNudgedAt() != null) {
            dto.setLastNudgedAt(demande.getLastNudgedAt().toString());
        }

        dto.setTypeDocument(demande.getTypeDocument());
        dto.setMois(demande.getMois());
        dto.setAnnee(demande.getAnnee());
        dto.setHeureDebut(demande.getHeureDebut());
        dto.setHeureFin(demande.getHeureFin());

        return dto;
    }
}
