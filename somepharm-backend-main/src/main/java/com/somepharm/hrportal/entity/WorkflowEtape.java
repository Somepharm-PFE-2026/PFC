package com.somepharm.hrportal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "workflow_etape")
@Data
@NoArgsConstructor
public class WorkflowEtape {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEtape;

    @ManyToOne
    @JoinColumn(name = "id_circuit", nullable = false)
    @JsonIgnore
    private WorkflowCircuit circuit;

    /** Step order within the circuit (1, 2, 3...) */
    @Column(nullable = false)
    private int ordre;

    /** 
     * The role responsible for validation at this step.
     * Values: "MANAGER", "CHEF_DEPARTEMENT", "RH_ADMIN", "HR_MANAGER"
     */
    @Column(nullable = false, length = 50)
    private String roleValidateur;

    /** Display label for the step (e.g. "Validation Manager Direct") */
    @Column(length = 150)
    private String label;

    /** Whether this step can be skipped */
    @Column(nullable = false)
    private boolean optionnel = false;

    /** SLA: number of business hours allowed for this step */
    @Column(nullable = false)
    private int delaiHeures = 72;

    /**
     * What happens when the SLA expires.
     * Values: "RELANCE", "ESCALADE", "AUTO_VALIDATION"
     */
    @Column(length = 30)
    private String actionExpiration = "RELANCE";
}
