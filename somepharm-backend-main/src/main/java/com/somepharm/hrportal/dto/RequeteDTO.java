package com.somepharm.hrportal.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequeteDTO {
    private UUID idRequete;
    private LocalDateTime dateSoumission;
    private String statutCycleVie;
    private String description;
    private String commentaireAction;
    private String commentaireManager;
    private boolean urgent;

    // type discriminator: CONGE | DOCUMENT | ADMINISTRATIVE
    private String type;
    private String typeLabel;

    // Demandeur info (flat — avoids entity serialization)
    private String demandeurMatricule;
    private String demandeurNom;
    private String demandeurPrenom;

    // Leave-specific
    private String typeConge;
    private LocalDate dateDebut;
    private LocalDate dateFin;

    // Document-specific
    private String typeDocument;
    private String heureDebut;
    private String heureFin;

    // Administrative-specific
    private String typeDemande;
}
