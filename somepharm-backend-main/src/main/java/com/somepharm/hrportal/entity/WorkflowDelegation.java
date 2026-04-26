package com.somepharm.hrportal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "workflow_delegation")
@Data
@NoArgsConstructor
public class WorkflowDelegation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDelegation;

    /** The person being replaced (the absent validator) */
    @ManyToOne
    @JoinColumn(name = "id_titulaire", nullable = false)
    @JsonIgnoreProperties({"managerDirect", "motDePasse", "authorities", "hibernateLazyInitializer", "handler"})
    private Utilisateur titulaire;

    /** The replacement validator */
    @ManyToOne
    @JoinColumn(name = "id_delegue", nullable = false)
    @JsonIgnoreProperties({"managerDirect", "motDePasse", "authorities", "hibernateLazyInitializer", "handler"})
    private Utilisateur delegue;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false)
    private boolean actif = true;
}
