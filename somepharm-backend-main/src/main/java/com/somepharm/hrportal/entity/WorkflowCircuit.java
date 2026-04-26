package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workflow_circuit")
@Data
@NoArgsConstructor
public class WorkflowCircuit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCircuit;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean actif = true;

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    private List<WorkflowEtape> etapes = new ArrayList<>();
}
