package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.*;
import com.somepharm.hrportal.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final UtilisateurRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final ConnectionLogRepository connectionLogRepository;
    private final TerminalRepository terminalRepository;
    private final SystemConfigRepository configRepository;
    private final AuditService auditService;

    public AdminController(UtilisateurRepository userRepository,
                           AuditLogRepository auditLogRepository,
                           ConnectionLogRepository connectionLogRepository,
                           TerminalRepository terminalRepository,
                           SystemConfigRepository configRepository,
                           AuditService auditService) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.connectionLogRepository = connectionLogRepository;
        this.terminalRepository = terminalRepository;
        this.configRepository = configRepository;
        this.auditService = auditService;
    }

    // --- MODULE 1.2: Monitoring Profiles ---
    @GetMapping("/monitoring/profiles")
    public ResponseEntity<List<Utilisateur>> getAllProfiles() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // --- MODULE 1.3: Terminal Management ---
    @GetMapping("/terminals")
    public ResponseEntity<List<Terminal>> getTerminals() {
        return ResponseEntity.ok(terminalRepository.findAll());
    }

    @PostMapping("/terminals/revoke/{id}")
    public ResponseEntity<Void> revokeTerminal(@PathVariable Long id) {
        terminalRepository.findById(id).ifPresent(t -> {
            t.setStatus("REVOQUE");
            terminalRepository.save(t);
            auditService.logSuccess("TERMINAL_REVOKE", "Terminal révoqué : " + t.getTerminalId(), "SYSTEM", "SUPER_ADMIN", "TERMINAL");
        });
        return ResponseEntity.ok().build();
    }

    // --- MODULE 2.1: Password Reset Tickets ---
    @GetMapping("/tickets/resets")
    public ResponseEntity<List<Utilisateur>> getResetRequests() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getPasswordResetRequested()))
                .toList());
    }

    // --- MODULE 3: Logs ---
    @GetMapping("/logs/audit")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/logs/connections")
    public ResponseEntity<List<ConnectionLog>> getConnectionLogs() {
        return ResponseEntity.ok(connectionLogRepository.findAll());
    }

    // --- MODULE 4: Configuration ---
    @GetMapping("/config")
    public ResponseEntity<SystemConfig> getConfig() {
        return ResponseEntity.ok(configRepository.findAll().stream().findFirst().orElse(new SystemConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestBody SystemConfig config) {
        configRepository.save(config);
        auditService.logSuccess("CONFIG_UPDATE", "Configuration système mise à jour", "SYSTEM", "SUPER_ADMIN", "CONFIG");
        return ResponseEntity.ok().build();
    }

}
