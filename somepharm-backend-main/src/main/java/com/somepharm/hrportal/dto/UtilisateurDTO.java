package com.somepharm.hrportal.dto;

import lombok.Data;

@Data
public class UtilisateurDTO {
    private Long idUser;
    private String matricule;
    private String email;
    private String statutCompte;

    // Notice we can even flatten the Role object into just a simple String!
    private String roleName;
}