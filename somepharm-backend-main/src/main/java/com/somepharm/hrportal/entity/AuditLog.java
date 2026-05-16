package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "AUDIT_LOG")
@Data
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    @Column(name = "type_action", nullable = false)
    private String typeAction; // e.g., "LOGIN_SUCCESS", "LOGIN_FAILURE", "MUTATION", "CONFIG_CHANGE"

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "role")
    private String role;

    @Column(name = "target_entity")
    private String targetEntity;

    @Column(name = "result")
    private String result; // SUCCESS or FAILURE

    @Column(name = "auteur")
    private String auteur;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public AuditLog(String typeAction, String description, String auteur, String role, String targetEntity, String result) {
        this.typeAction = typeAction;
        this.description = description;
        this.auteur = auteur;
        this.role = role;
        this.targetEntity = targetEntity;
        this.result = result;
        this.timestamp = LocalDateTime.now();
    }

    public AuditLog(String typeAction, String description, String auteur) {
        this(typeAction, description, auteur, "UNKNOWN", "SYSTEM", "SUCCESS");
    }
}
