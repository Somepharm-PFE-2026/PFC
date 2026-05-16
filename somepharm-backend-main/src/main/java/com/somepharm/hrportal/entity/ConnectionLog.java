package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "CONNECTION_LOG")
@Data
@NoArgsConstructor
public class ConnectionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String matricule;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false)
    private String result; // SUCCESS, FAILURE

    public ConnectionLog(String matricule, String ipAddress, String userAgent, String result) {
        this.matricule = matricule;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.result = result;
        this.timestamp = LocalDateTime.now();
    }
}
