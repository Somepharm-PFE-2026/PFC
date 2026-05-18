package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.service.BackupStorageService;
import com.somepharm.hrportal.entity.DbBackup;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/storage")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class BackupStorageController {

    private final BackupStorageService backupStorageService;

    public BackupStorageController(BackupStorageService backupStorageService) {
        this.backupStorageService = backupStorageService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        return ResponseEntity.ok(backupStorageService.getDashboardData());
    }

    @PostMapping("/backup")
    public ResponseEntity<DbBackup> triggerBackup(Authentication auth) {
        return ResponseEntity.ok(backupStorageService.triggerManualBackup(auth.getName()));
    }

    @PutMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestBody com.somepharm.hrportal.entity.StorageConfig config, Authentication auth) {
        backupStorageService.updateConfig(config, auth.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/purge-temp")
    public ResponseEntity<Map<String, Object>> purgeTemp(Authentication auth) {
        return ResponseEntity.ok(backupStorageService.purgeTempFiles(auth.getName()));
    }

    @PostMapping("/restore/initiate/{id}")
    public ResponseEntity<Void> initiateRestore(@PathVariable Long id, @RequestParam String email, Authentication auth) {
        backupStorageService.initiateRestore(id, email, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/restore/confirm")
    public ResponseEntity<Map<String, Object>> confirmRestore(@RequestParam String code, Authentication auth) {
        boolean success = backupStorageService.confirmRestore(code, auth.getName());
        if (success) {
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Restauration terminée. Redémarrage du contexte..."));
        } else {
            return ResponseEntity.status(403).body(Map.of("status", "FAILED", "message", "Code de confirmation invalide."));
        }
    }

    @PostMapping("/restore/test")
    public ResponseEntity<Void> triggerTest(Authentication auth) {
        backupStorageService.triggerRestoreTest(auth.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadBackup(@PathVariable Long id, Authentication auth) {
        return backupStorageService.downloadBackup(id, auth.getName());
    }
}
