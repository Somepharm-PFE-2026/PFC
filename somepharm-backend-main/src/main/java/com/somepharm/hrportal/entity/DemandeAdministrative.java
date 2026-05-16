package com.somepharm.hrportal.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "demande_administrative")
@Data
@EqualsAndHashCode(callSuper = true)
public class DemandeAdministrative extends Requete {

    private String typeDemande; // SITUATION_FAMILIALE, ADRESSE, etc.
    
    // Specifically tracked fields for automation
    private String nouveauStatutMarital;
    private String nouvelleAdresse;
    private String nouveauTelephone;
    
    private String detailsSupplementaires;
}
