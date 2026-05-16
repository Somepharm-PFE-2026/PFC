package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "document_template")
public class DocumentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    
    private String typeDocument; // e.g., "ATTESTATION_TRAVAIL", "ORDRE_MISSION"

    private String fileUrl; // Path to the .docx template

    private String description;

    private String categorie; // ADMINISTRATIF, LEGAL, INTERNE

    private boolean active = true;

    // Mapping for automated generation
    @Column(columnDefinition = "TEXT")
    private String mappingJson; // Stores which tags correspond to which DB fields
}
