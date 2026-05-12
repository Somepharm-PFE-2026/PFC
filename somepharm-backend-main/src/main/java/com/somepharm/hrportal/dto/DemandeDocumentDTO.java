package com.somepharm.hrportal.dto;

import java.util.UUID;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DemandeDocumentDTO {
    // Fields from Requete
    private UUID idRequete;
    private LocalDateTime dateSoumission;
    private String description;
    private String statutCycleVie;
    private String commentaireAction;

    // Fields from Utilisateur
    private Long demandeurId;
    private String demandeurMatricule;
    private boolean isUrgent;
    private String lastNudgedAt;

    // Fields from DemandeDocument
    private String typeDocument;
    private Integer mois;
    private Integer annee;
    private String heureDebut;
    private String heureFin;
}
