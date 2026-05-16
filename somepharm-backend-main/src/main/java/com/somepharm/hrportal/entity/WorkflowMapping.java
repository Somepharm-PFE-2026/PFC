package com.somepharm.hrportal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "workflow_mapping")
@Data
@NoArgsConstructor
public class WorkflowMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMapping;

    /**
     * The request type this mapping applies to.
     * Values: "DEMANDE_CONGE", "ATTESTATION_TRAVAIL", "ATTESTATION_SALAIRE",
     *         "FICHE_PAIE", "TITRE_CONGE", "MISE_A_JOUR_RIB", "BON_SORTIE", "REGULARISATION"
     */
    @Column(nullable = false, unique = true, length = 80)
    private String typeRequete;

    @ManyToOne
    @JoinColumn(name = "id_circuit", nullable = false)
    @JsonIgnoreProperties({"etapes"})
    private WorkflowCircuit circuit;
}
