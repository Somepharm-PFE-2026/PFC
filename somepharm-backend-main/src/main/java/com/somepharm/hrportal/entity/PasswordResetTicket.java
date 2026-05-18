package com.somepharm.hrportal.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "PASSWORD_RESET_TICKET")
@Data
@NoArgsConstructor
public class PasswordResetTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idTicket;

    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "secured_at")
    private LocalDateTime securedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status = TicketStatus.EN_ATTENTE;

    @Column(name = "channel")
    private String channel; // EMAIL / COPIER_COLLER

    @Column(name = "temporary_password")
    @JsonProperty("temporaryPassword")
    private String temporaryPassword;

    public enum TicketStatus {
        EN_ATTENTE,
        ENVOYÉ,
        EN_ATTENTE_EMPLOYÉ,
        SÉCURISÉ
    }
}
