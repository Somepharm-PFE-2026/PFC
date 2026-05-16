package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurSummaryDTO {
    private String matricule;
    private String nomComplet;
    private String departement;
    private Double soldeConges;
}
