package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "EMAIL_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- SMTP SETTINGS ---
    private String smtpHost;
    private int smtpPort = 587;
    private String smtpUser;
    private String smtpPass;
    private boolean smtpSecure = false;

    // --- TEMPLATE ---
    private String welcomeEmailSubject = "Bienvenue {{PRENOM}} — Vos accès à l'application RH";
    
    @Column(columnDefinition = "TEXT")
    private String welcomeEmailBody = "Bonjour {{PRENOM}} {{NOM}},\n\nVotre compte a été créé et activé. Voici vos informations de connexion :\n\n  Matricule : {{MATRICULE}}\n  Mot de passe temporaire : {{MOT_DE_PASSE_TEMPORAIRE}}\n\nConnectez-vous ici : {{URL_CONNEXION}}\n\nIMPORTANT : Lors de votre première connexion, vous serez obligé(e) de définir un nouveau mot de passe personnel. Ce mot de passe temporaire ne fonctionnera qu'une seule fois.\n\nCordialement,\nL'équipe IT — {{NOM_ENTREPRISE}}";

    // --- GLOBAL VARS ---
    private String entrepriseNom = "SomePharm";
    private String urlConnexion = "http://localhost:3000/login";
}
