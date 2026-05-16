package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "annonce_lecture")
public class AnnonceLecture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLecture;

    @ManyToOne
    @JoinColumn(name = "id_annonce", nullable = false)
    private Annonce annonce;

    @ManyToOne
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    private LocalDateTime dateLecture;

    public AnnonceLecture(Annonce annonce, Utilisateur utilisateur) {
        this.annonce = annonce;
        this.utilisateur = utilisateur;
        this.dateLecture = LocalDateTime.now();
    }
}
