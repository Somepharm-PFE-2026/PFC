package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "pointage")
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pointage")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_utilisateur", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"poste", "managerDirect", "motDePasse", "role", "authorities", "customAttributes"})
    private Utilisateur employe;

    private LocalDateTime horodatage; // Single timestamp for IN or OUT

    @Column(name = "type_pointage")
    private String typePointage;

    // Methode: "WEB", "MOBILE", "BADGEUSE"
    private String methode;

    // Geolocation (Optional, for Mobile)
    private Double latitude;
    private Double longitude;

    // Statut: "OK", "RETARD", "ANOMALIE"
    private String statut;

    // Audit for manual correction
    @Column(name = "is_modified_manually")
    private boolean isModifiedManually = false;

    @Column(name = "modified_by")
    private String modifiedBy;

    @Column(name = "modification_reason")
    private String modificationReason;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}