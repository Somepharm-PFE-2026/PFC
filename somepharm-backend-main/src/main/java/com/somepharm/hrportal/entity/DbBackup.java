package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "db_backups")
@Data
public class DbBackup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String filename;
    private LocalDateTime timestamp;
    private Long sizeMb;
    private String type; // AUTOMATIQUE / MANUELLE
    private String integrity; // VALID / WARNING / CORRUPTED
    private String checksum;
    private String status; // SUCCESS / FAILED
    private String author;
}
