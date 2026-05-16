package com.somepharm.hrportal.entity;

import lombok.Data;
import jakarta.persistence.*;

@Entity
@Table(name = "pdf_font")
@Data
public class PdfFont {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String style; // Regular, Bold, Italic, Bold Italic

    private long sizeKb;

    private String status = "LOADED"; // LOADED, MISSING, CORRUPTED
}
