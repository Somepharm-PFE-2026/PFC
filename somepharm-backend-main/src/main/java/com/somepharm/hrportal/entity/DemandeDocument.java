package com.somepharm.hrportal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "DEMANDE_DOCUMENT")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DemandeDocument extends Requete {

    /**
     * Possible values: ATTESTATION_TRAVAIL, ATTESTATION_SALAIRE, RELEVE_EMOLUMENTS, FICHE_PAIE, TITRE_CONGE
     */
    @Column(name = "type_document", nullable = false, length = 100)
    private String typeDocument;

    @Column(name = "mois")
    private Integer mois;

    @Column(name = "annee")
    private Integer annee;

    @Column(name = "heure_debut", length = 10)
    private String heureDebut;

    @Column(name = "heure_fin", length = 10)
    private String heureFin;
}
