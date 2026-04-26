package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "DEMANDE_CONGE")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true) // Tells Lombok to include the parent's ID and Status
public class DemandeConge extends Requete {

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "motif", length = 255)
    private String motif;

    @ManyToOne
    @JoinColumn(name = "id_type_conge")
    private TypeConge typeConge;
}