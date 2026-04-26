package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanResultDTO {
    private String status; // "SUCCESS", "ERROR", "ALREADY_USED"
    private String message;
    
    // Requester Info
    private String matricule;
    private String nomComplet;
    private String departement;
    private String photoUrl;

    // Request Info
    private String dateDemande;
    private String periodeDemandee; // e.g. "14:00 - 15:00"
    private String motif;
    
    // Action Info
    private String typeScan; // "SORTIE" (Exit) or "ENTREE" (Return)
    private String heureScan;
}
