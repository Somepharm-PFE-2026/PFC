package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bon_de_sortie")
public class BonDeSortie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Utilisateur demandeur;

    @Column(name = "token_qr", nullable = false, unique = true)
    private String tokenQr; // The unique data embedded inside the QR Code

    @Column(name = "heure_sortie_estimee")
    private LocalDateTime heureSortieEstimee;

    @Column(name = "duree_estimee_heures")
    private int dureeEstimeeHeures; // How many hours they asked for

    @Column(name = "heure_sortie_reelle")
    private LocalDateTime heureSortieReelle; // Stamped when Guard scans OUT

    @Column(name = "heure_retour_reelle")
    private LocalDateTime heureRetourReelle; // Stamped when Guard scans IN

    @Column(name = "id_requete_origine")
    private Long idRequeteOrigine;

    @Column(name = "heure_debut_autorisee")
    private String heureDebutAutorisee;

    @Column(name = "heure_fin_autorisee")
    private String heureFinAutorisee;

    @Column(name = "statut")
    private String statut; // "EN_ATTENTE", "EN_COURS", "CLOTURE"

    @Column(name = "motif")
    private String motif;

    @PrePersist
    protected void onCreate() {
        // Generate a random, unguessable token for the QR code when created
        if (this.tokenQr == null) {
            this.tokenQr = UUID.randomUUID().toString();
        }
        if (this.statut == null) {
            this.statut = "EN_ATTENTE";
        }
    }

    // --- GETTERS AND SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Utilisateur getDemandeur() { return demandeur; }
    public void setDemandeur(Utilisateur demandeur) { this.demandeur = demandeur; }

    public String getTokenQr() { return tokenQr; }
    public void setTokenQr(String tokenQr) { this.tokenQr = tokenQr; }

    public LocalDateTime getHeureSortieEstimee() { return heureSortieEstimee; }
    public void setHeureSortieEstimee(LocalDateTime heureSortieEstimee) { this.heureSortieEstimee = heureSortieEstimee; }

    public int getDureeEstimeeHeures() { return dureeEstimeeHeures; }
    public void setDureeEstimeeHeures(int dureeEstimeeHeures) { this.dureeEstimeeHeures = dureeEstimeeHeures; }

    public LocalDateTime getHeureSortieReelle() { return heureSortieReelle; }
    public void setHeureSortieReelle(LocalDateTime heureSortieReelle) { this.heureSortieReelle = heureSortieReelle; }

    public LocalDateTime getHeureRetourReelle() { return heureRetourReelle; }
    public void setHeureRetourReelle(LocalDateTime heureRetourReelle) { this.heureRetourReelle = heureRetourReelle; }

    public Long getIdRequeteOrigine() { return idRequeteOrigine; }
    public void setIdRequeteOrigine(Long idRequeteOrigine) { this.idRequeteOrigine = idRequeteOrigine; }

    public String getHeureDebutAutorisee() { return heureDebutAutorisee; }
    public void setHeureDebutAutorisee(String heureDebutAutorisee) { this.heureDebutAutorisee = heureDebutAutorisee; }

    public String getHeureFinAutorisee() { return heureFinAutorisee; }
    public void setHeureFinAutorisee(String heureFinAutorisee) { this.heureFinAutorisee = heureFinAutorisee; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
}