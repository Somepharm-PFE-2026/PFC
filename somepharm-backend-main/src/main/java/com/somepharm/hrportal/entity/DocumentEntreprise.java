package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "document_entreprise")
public class DocumentEntreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    
    private String description;

    // REGLEMENT, ORGANIGRAMME, CONVENTION, AUTRE
    private String categorie;

    private String fileUrl;

    private String version;

    private LocalDateTime datePublication;
    
    @Lob
    @Column(name = "content")
    private byte[] content;

    private boolean isPublic = true;
}
