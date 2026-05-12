package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "POSTE")
@Data
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class Poste {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_poste")
    private Long idPoste;

    @Column(name = "titre", nullable = false, length = 100)
    private String titre;

    @Column(name = "description", length = 500)
    private String description;


    @Column(name = "effectif_minimum")
    private Integer effectifMinimum = 1;

    @ManyToOne
    @JoinColumn(name = "id_dept")
    private Departement departement;

    public Poste(String titre) {
        this.titre = titre;
    }
}
