package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "BULLETIN_PAIE")
@Data
@NoArgsConstructor
public class BulletinPaie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "poste", "departement", "managerDirect", "site"})
    private Utilisateur employe;

    @Column(nullable = false)
    private int mois; // 1 to 12

    @Column(nullable = false)
    private int annee;

    // --- GAINS (Earnings) ---
    private double salaireBase;
    private double iep; // Indemnité d'Expérience Professionnelle (Ancienneté)
    private double primePanier;
    private double primeTransport;
    private double autresPrimes;

    // --- RETENUES (Deductions) ---
    private double retenueCNAS; // Usually 9% of Gross
    private double irg; // Progressive Income Tax

    private double salaireBrut;
    private double netAPayer;

    @Column(name = "date_publication")
    private java.time.LocalDateTime datePublication;

    private boolean isDownloaded = false;
    
    @Column(name = "date_consultation")
    private java.time.LocalDateTime dateConsultation;

    @PrePersist
    @PreUpdate
    public void calculateTotals() {
        this.salaireBrut = salaireBase + iep + primePanier + primeTransport + autresPrimes;
        // Calculation logic will be refined in PayrollService, 
        // but this ensures we have totals in the DB.
        this.netAPayer = salaireBrut - retenueCNAS - irg;
    }
}
