package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.service.DashboardService;
import com.somepharm.hrportal.service.BackupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    private final DashboardService dashboardService;
    private final com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository;
    private final com.somepharm.hrportal.repository.EmailConfigRepository emailConfigRepository;
    private final com.somepharm.hrportal.service.AuditService auditService;
    private final BackupService backupService;

    public DashboardController(DashboardService dashboardService, 
                               com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository,
                               com.somepharm.hrportal.repository.EmailConfigRepository emailConfigRepository,
                               com.somepharm.hrportal.service.AuditService auditService,
                               BackupService backupService) {
        this.dashboardService = dashboardService;
        this.utilisateurRepository = utilisateurRepository;
        this.emailConfigRepository = emailConfigRepository;
        this.auditService = auditService;
        this.backupService = backupService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        try {
            if (auth == null) {
                return ResponseEntity.status(401).body("Authentication required");
            }

            Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String role = (user.getRole() != null) ? user.getRole().getNomRole() : "EMPLOYE";
            if (role.startsWith("ROLE_")) role = role.replace("ROLE_", "");

            Map<String, Object> response = new HashMap<>();
            response.put("role", role);
            response.put("dateDuJour", LocalDate.now().toString());

            if ("EMPLOYE".equals(role) || "SECURITY_AGENTS".equals(role)) {
                response.put("employeeData", dashboardService.getEmployeeData(user));
            } else if ("MANAGER".equals(role)) {
                response.put("managerData", dashboardService.getManagerData(user));
            } else if ("RH_ADMIN".equals(role) || "HR_MANAGER".equals(role)) {
                response.put("hrAdminData", dashboardService.getHRAdminData());
            } else if ("SUPER_ADMIN".equals(role)) {
                response.put("hrAdminData", dashboardService.getHRAdminData()); // Admins see HR data too
                response.put("superAdminData", dashboardService.getSuperAdminData());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[DASHBOARD CRASH] Fatal error for user " + (auth != null ? auth.getName() : "unknown") + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Error: " + e.getMessage());
        }
    }

    @GetMapping("/cockpit")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getCockpitData() {
        Map<String, Object> response = new HashMap<>();
        response.put("cockpit", dashboardService.getCockpitData());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/actions/backup")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> forceBackup(Authentication auth) {
        try {
            String backupPath = backupService.executeBackup();
            auditService.logSuccess("BACKUP_MANUAL", "Sauvegarde réussie : " + backupPath, auth.getName(), "SUPER_ADMIN", "DATABASE");
            return ResponseEntity.ok(Map.of(
                "message", "Backup completed successfully",
                "path", backupPath
            ));
        } catch (Exception e) {
            System.err.println("[BACKUP ERROR] " + e.getMessage());
            auditService.logAction("BACKUP_FAILURE", "Échec de la sauvegarde : " + e.getMessage(), auth.getName(), "SUPER_ADMIN", "DATABASE", "FAILURE");
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/actions/purge-logs")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> purgeLogs(Authentication auth) {
        dashboardService.purgeOldLogs(90);
        auditService.logSuccess("LOGS_PURGE", "Purge des logs de plus de 90 jours", auth.getName(), "SUPER_ADMIN", "LOGS");
        return ResponseEntity.ok(Map.of("message", "Logs purged successfully"));
    }

    @GetMapping("/email-config")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getEmailConfig() {
        return ResponseEntity.ok(emailConfigRepository.findAll().stream().findFirst().orElse(new com.somepharm.hrportal.entity.EmailConfig()));
    }

    @PutMapping("/email-config")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateEmailConfig(@RequestBody com.somepharm.hrportal.entity.EmailConfig config, Authentication auth) {
        emailConfigRepository.save(config);
        auditService.logSuccess("EMAIL_CONFIG_UPDATE", "Configuration email mise à jour", auth.getName(), "SUPER_ADMIN", "CONFIG");
        return ResponseEntity.ok(config);
    }
}