package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "UTILISATEUR_HISTORY")
@Data
@NoArgsConstructor
public class UtilisateurHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHistory;

    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "id_dept_precedent")
    private Departement departementPrecedent;

    @ManyToOne
    @JoinColumn(name = "id_poste_precedent")
    private Poste postePrecedent;

    @ManyToOne
    @JoinColumn(name = "id_dept_nouveau")
    private Departement departementNouveau;

    @ManyToOne
    @JoinColumn(name = "id_poste_nouveau")
    private Poste posteNouveau;

    @Column(name = "date_changement", nullable = false)
    private LocalDateTime dateChangement = LocalDateTime.now();

    @Column(name = "modifie_par")
    private String modifiePar;

    @Column(name = "motif_changement", length = 500)
    private String motifChangement;
}
