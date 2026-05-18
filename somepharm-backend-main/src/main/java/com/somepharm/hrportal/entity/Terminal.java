package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "TERMINAL")
@Data
@NoArgsConstructor
public class Terminal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "terminal_id", unique = true, nullable = false)
    private String terminalId; // Unique device identifier

    @Column(nullable = false)
    private String model;

    @ManyToOne
    @JoinColumn(name = "assigned_user_id")
    private Utilisateur assignedUser;

    @Column(nullable = false)
    private String status = "ACTIF"; // ACTIF, REVOQUE

    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
