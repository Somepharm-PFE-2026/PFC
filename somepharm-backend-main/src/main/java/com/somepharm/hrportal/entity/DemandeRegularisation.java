package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "demande_regularisation")
@PrimaryKeyJoinColumn(name = "id_requete")
public class DemandeRegularisation extends Requete {

    @ManyToOne
    @JoinColumn(name = "id_pointage", nullable = false)
    private Pointage pointageConcerne;

    private LocalDateTime heureProposee;
    
    @Column(columnDefinition = "TEXT")
    private String motifRegularisation;

    // Type of regularization: "SORTIE_MANQUANTE", "ENTREE_MANQUANTE", "ERREUR_HEURE"
    private String typeRegularisation;
}
