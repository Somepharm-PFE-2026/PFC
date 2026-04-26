package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointageStatusDTO {
    private String typePointage; // "ENTREE", "SORTIE"
    private String heureEntree;
    private String heureSortie;
    private String statut; // "OK", "RETARD", etc.
}
