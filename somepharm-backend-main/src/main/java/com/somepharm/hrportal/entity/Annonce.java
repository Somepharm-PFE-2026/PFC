package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "annonce")
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAnnonce;

    private String titre;
    
    @Column(columnDefinition = "TEXT")
    private String contenu;

    // NEWS, EVENT, NOTE_SERVICE
    private String typeAnnonce;

    @ManyToOne
    @JoinColumn(name = "id_auteur")
    private Utilisateur auteur;

    private LocalDateTime datePublication;
    
    private boolean isPinned = false;
    
    private LocalDateTime dateExpiration;

    // Optionnel: Image pour l'annonce
    private String imageUrl;

    // --- NEW COMMUNICATION HUB FIELDS ---

    // TARGETING: GENERAL, DEPARTMENT, ROLE, SITE, SELECTIVE
    @Column(name = "target_type")
    private String targetType = "GENERAL";

    // Value for targeting (Dept Name, Role Name, Site ID, or list of User IDs)
    @Column(name = "target_value", columnDefinition = "TEXT")
    private String targetValue;

    // PRIORITY: NORMAL, URGENT
    private String priority = "NORMAL";

    // STATUS: DRAFT, PUBLISHED, ARCHIVED
    private String status = "PUBLISHED";

    @Column(name = "attachment_url")
    private String attachmentUrl;
}
