package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "workflow_bypass_rule")
@Data
@NoArgsConstructor
public class WorkflowBypassRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRule;

    @Column(nullable = false, length = 100)
    private String nom;

    /**
     * The condition that triggers the bypass.
     * Values: "DEMANDEUR_EST_CHEF", "MANAGER_INACTIF", "SEUIL_URGENCE"
     */
    @Column(nullable = false, length = 50)
    private String conditionType;

    /** Which step role to skip when the condition is met ("MANAGER", "CHEF_DEPARTEMENT") */
    @Column(nullable = false, length = 50)
    private String etapeIgnoree;

    /** Optional: threshold in hours for time-based conditions (e.g., 48h for urgency) */
    private Integer seuilHeures;

    @Column(nullable = false)
    private boolean actif = true;
}
