package com.somepharm.hrportal.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pdf_error_log")
@Data
@NoArgsConstructor
public class PdfErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private String documentType;
    private String matricule;
    private String template;
    private String errorCode; // ERR_MEM, ERR_FONT, etc.

    @Column(length = 1000)
    private String probableCause;

    @Column(columnDefinition = "TEXT")
    private String stackTrace;

    private String status = "UNRESOLVED";

    public PdfErrorLog(String documentType, String matricule, String template, String errorCode, String probableCause, String stackTrace) {
        this.documentType = documentType;
        this.matricule = matricule;
        this.template = template;
        this.errorCode = errorCode;
        this.probableCause = probableCause;
        this.stackTrace = stackTrace;
        this.timestamp = LocalDateTime.now();
    }
}
