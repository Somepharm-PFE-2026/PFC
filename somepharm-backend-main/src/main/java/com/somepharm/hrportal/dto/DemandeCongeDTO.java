package com.somepharm.hrportal.dto;

import java.util.UUID;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DemandeCongeDTO {
    // Fields from Requete (Parent)
    private UUID idRequete;
    private LocalDateTime dateSoumission;
    private String description;
    private String statutCycleVie;
    private String commentaireAction; // 👈 New field added here

    // Fields from Utilisateur (Requester)
    private Long demandeurId;
    private String demandeurMatricule;
    private boolean isUrgent;
    private String lastNudgedAt;

    // Fields from DemandeConge (Child)
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String motif;
    private String typeConge;
}