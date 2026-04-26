package com.somepharm.hrportal.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pdf_config")
@Data
public class PdfConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "engine", nullable = false)
    private String engine = "PUPPETEER"; // PUPPETEER, PDFKIT, DOCX_TEMPLATER

    @Column(name = "engine_status")
    private String engineStatus = "OPERATIONAL";

    @Column(name = "default_font")
    private String defaultFont = "Arial";

    @Column(name = "timeout_seconds")
    private int timeoutSeconds = 30;

    @Column(name = "ram_allocated_mb")
    private int ramAllocatedMb = 512;

    @Column(name = "max_concurrent_jobs")
    private int maxConcurrentJobs = 3;

    @Column(name = "retention_policy_months")
    private int retentionPolicyMonths = 12;

    // Storage Paths
    @Column(name = "path_paie")
    private String pathPaie = "/storage/paie/AAAA/MM/";

    @Column(name = "path_attestations")
    private String pathAttestations = "/storage/attestations/AAAA/";

    @Column(name = "path_bons_sortie")
    private String pathBonsSortie = "/storage/bons-sortie/AAAA/MM/";

    @Column(name = "path_fonts")
    private String pathFonts = "/storage/fonts/";

    @Column(name = "path_templates")
    private String pathTemplates = "/storage/templates/";

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "updated_by")
    private String updatedBy;
}
