package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "storage_config")
@Data
public class StorageConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String syncDestination; // AWS_S3 / NAS / FTP / NONE
    private String syncStatus; // ACTIVE / DELAYED / INACTIVE
    private LocalDateTime lastSync;

    // AWS S3 Config
    private String s3Bucket;
    private String s3Region;
    private String s3AccessKey;
    private String s3SecretKey;

    // NAS / FTP Config
    private String remoteAddress;
    private String remotePath;
    private String remoteUser;
    private String remotePassword;

    private int retentionPolicyMonths = 6;
    private String backupSchedule = "DAILY_02H00";
}
