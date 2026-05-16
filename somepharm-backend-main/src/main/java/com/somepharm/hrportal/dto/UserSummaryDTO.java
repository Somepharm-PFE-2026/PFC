package com.somepharm.hrportal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryDTO {
    private Long idUser;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String departement;
    private String poste;
    private String role;
    private String statutCompte;
    private String passwordStatus;
    private Double soldeConges;
    private Long idManagerDirect;
    private Long idSite;
    private String temporaryPassword;
    private String situationFamiliale;
    private ManagerDTO managerDirect;

    @Data
    @Builder
    public static class ManagerDTO {
        private Long idUser;
        private String nom;
        private String prenom;
    }
}


