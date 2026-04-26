package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "SYSTEM_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Working Hours ---
    @Column(name = "working_hours_start")
    private String workingHoursStart = "08:00";

    @Column(name = "working_hours_end")
    private String workingHoursEnd = "17:00";

    @Column(name = "tolerance_minutes")
    private int toleranceMinutes = 15;

    @Column(name = "urgency_delay_hours")
    private int urgencyDelayHours = 48;

    // --- Document Settings ---
    @Column(name = "drh_signature_url")
    private String drhSignatureUrl;

    @Column(name = "cachet_entreprise_url")
    private String cachetEntrepriseUrl;

    @Column(name = "signature_x")
    private float signatureX = 400;

    @Column(name = "signature_y")
    private float signatureY = 150;

    @Column(name = "stamp_x")
    private float stampX = 100;

    @Column(name = "stamp_y")
    private float stampY = 150;

    // --- Security ---
    @Column(name = "max_failed_attempts")
    private int maxFailedAttempts = 5;

    @Column(name = "lockout_duration_minutes")
    private int lockoutDurationMinutes = 15;

    @Column(name = "qr_code_lifetime_minutes")
    private int qrCodeLifetimeMinutes = 10;
}
