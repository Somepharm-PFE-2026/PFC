package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "QR_CONFIG")
@Data
@NoArgsConstructor
public class QrConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salt_secret", nullable = false)
    private String saltSecret;

    @Column(name = "algorithm", nullable = false)
    private String algorithm = "HMAC-SHA256";

    @Column(name = "ttl_seconds", nullable = false)
    private int ttlSeconds = 300;

    @Column(name = "max_alert_margin_seconds", nullable = false)
    private int maxAlertMarginSeconds = 600; // Hard limit for "ALERTER" mode

    @Column(name = "expiry_behavior", nullable = false)
    private String expiryBehavior = "REJETER";

    @Column(name = "ecl_level", nullable = false)
    private String eclLevel = "Q";

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    @Column(name = "updated_by")
    private String updatedBy;
}
