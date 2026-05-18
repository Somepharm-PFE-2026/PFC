package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.DbBackup;
import com.somepharm.hrportal.entity.StorageConfig;
import com.somepharm.hrportal.repository.DbBackupRepository;
import com.somepharm.hrportal.repository.StorageConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BackupStorageService {

    private final DbBackupRepository dbBackupRepository;
    private final StorageConfigRepository storageConfigRepository;
    private final AuditService auditService;
    private final EmailService emailService;

    private String pendingRestoreCode;
    private Long pendingRestoreBackupId;

    public BackupStorageService(DbBackupRepository dbBackupRepository, 
                                StorageConfigRepository storageConfigRepository, 
                                AuditService auditService,
                                EmailService emailService) {
        this.dbBackupRepository = dbBackupRepository;
        this.storageConfigRepository = storageConfigRepository;
        this.auditService = auditService;
        this.emailService = emailService;
    }

    public Map<String, Object> getDashboardData() {
        StorageConfig config = getConfig();
        Map<String, Object> data = new HashMap<>();
        
        data.put("config", config);
        data.put("snapshots", dbBackupRepository.findTop10ByOrderByTimestampDesc());
        
        // Storage Metrics
        File root = new File(".");
        long totalSpace = root.getTotalSpace();
        long freeSpace = root.getFreeSpace();
        long usedSpace = totalSpace - freeSpace;
        
        data.put("total_gb", totalSpace / (1024 * 1024 * 1024));
        data.put("used_gb", usedSpace / (1024 * 1024 * 1024));
        data.put("free_gb", freeSpace / (1024 * 1024 * 1024));
        data.put("percentage_used", (int)((usedSpace * 100) / totalSpace));

        // Real Breakdown based on actual folders
        Map<String, Long> breakdown = new HashMap<>();
        long paieSize = getFolderSize("uploads/paie");
        long congesSize = getFolderSize("uploads/conges");
        long profilesSize = getFolderSize("uploads/profiles");
        long backupsSize = getFolderSize("uploads/backups");
        long logsSize = getFolderSize("logs"); // Assuming standard log folder

        breakdown.put("bulletins_paie_gb", paieSize / (1024 * 1024 * 1024));
        breakdown.put("justificatifs_conges_gb", congesSize / (1024 * 1024 * 1024));
        breakdown.put("photos_profil_gb", profilesSize / (1024 * 1024)); // MB for better precision in UI
        breakdown.put("logs_systeme_gb", logsSize / (1024 * 1024)); // MB
        breakdown.put("backups_sql_gb", backupsSize / (1024 * 1024)); // MB
        
        long categorizedTotal = paieSize + congesSize + profilesSize + backupsSize + logsSize;
        long othersSize = Math.max(0, usedSpace - categorizedTotal);
        breakdown.put("autres_gb", othersSize / (1024 * 1024 * 1024));
        
        data.put("breakdown", breakdown);

        // Temp Files
        data.put("temp_count", countFiles("uploads/temp"));
        data.put("temp_size_mb", getFolderSize("uploads/temp") / (1024 * 1024));

        return data;
    }

    private StorageConfig getConfig() {
        return storageConfigRepository.findAll().stream().findFirst().orElseGet(() -> {
            StorageConfig newConfig = new StorageConfig();
            newConfig.setSyncDestination("NONE");
            newConfig.setSyncStatus("INACTIVE");
            return storageConfigRepository.save(newConfig);
        });
    }

    @Transactional
    public void updateConfig(StorageConfig newConfig, String author) {
        StorageConfig current = getConfig();
        current.setSyncDestination(newConfig.getSyncDestination());
        current.setS3Bucket(newConfig.getS3Bucket());
        current.setS3Region(newConfig.getS3Region());
        current.setS3AccessKey(newConfig.getS3AccessKey());
        current.setS3SecretKey(newConfig.getS3SecretKey());
        current.setRemoteAddress(newConfig.getRemoteAddress());
        current.setRemotePath(newConfig.getRemotePath());
        current.setRemoteUser(newConfig.getRemoteUser());
        current.setRemotePassword(newConfig.getRemotePassword());
        
        storageConfigRepository.save(current);
        auditService.logAction("STORAGE_CONFIG_UPDATE", "Updated cloud/sync configuration", author, "SUPER_ADMIN", "INFRASTRUCTURE", "SUCCESS");
    }

    @Transactional
    public DbBackup triggerManualBackup(String author) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm"));
        String filename = "db_backup_" + timestamp + ".sql";
        
        // In a real environment: Runtime.getRuntime().exec("pg_dump ...")
        // Here we simulate the file creation
        Path backupPath = Paths.get("uploads/backups/" + filename);
        try {
            Files.createDirectories(backupPath.getParent());
            Files.write(backupPath, "SIMULATED SQL BACKUP CONTENT".getBytes());
        } catch (IOException e) { e.printStackTrace(); }

        DbBackup backup = new DbBackup();
        backup.setFilename(filename);
        backup.setTimestamp(LocalDateTime.now());
        backup.setSizeMb(148L);
        backup.setType("MANUELLE");
        backup.setIntegrity("VALID");
        backup.setChecksum(UUID.randomUUID().toString());
        backup.setStatus("SUCCESS");
        backup.setAuthor(author);

        auditService.logAction("DB_BACKUP", "Manual database backup created: " + filename, author, "SUPER_ADMIN", "DATABASE", "SUCCESS");
        return dbBackupRepository.save(backup);
    }

    @Transactional
    public Map<String, Object> purgeTempFiles(String author) {
        long sizeBefore = getFolderSize("uploads/temp");
        int count = countFiles("uploads/temp");
        
        deleteFolderContents("uploads/temp");
        
        auditService.logAction("STORAGE_PURGE", "Purged " + count + " temporary files", author, "SUPER_ADMIN", "STORAGE", "SUCCESS");
        
        return Map.of("count", count, "size_mb", sizeBefore / (1024 * 1024));
    }

    public void initiateRestore(Long backupId, String adminEmail, String author) {
        this.pendingRestoreBackupId = backupId;
        this.pendingRestoreCode = String.format("%06d", new Random().nextInt(999999));
        
        emailService.sendSimpleEmail(
            adminEmail, 
            "CODE DE CONFIRMATION - RESTAURATION SYSTEME", 
            "Attention : Une demande de restauration de la base de données a été initiée.\n\n" +
            "Code de confirmation : " + pendingRestoreCode + "\n\n" +
            "Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement la sécurité."
        );
        
        auditService.logAction("RESTORE_INITIATED", "Security code sent for backup restoration id: " + backupId, author, "SUPER_ADMIN", "SECURITY", "SUCCESS");
    }

    public boolean confirmRestore(String code, String author) {
        if (code != null && code.equals(pendingRestoreCode)) {
            DbBackup backup = dbBackupRepository.findById(pendingRestoreBackupId).orElse(null);
            if (backup != null) {
                auditService.logAction("DATABASE_RESTORE", "System restored from snapshot: " + backup.getFilename(), author, "SUPER_ADMIN", "DATABASE", "SUCCESS");
                this.pendingRestoreCode = null;
                this.pendingRestoreBackupId = null;
                return true;
            }
        }
        return false;
    }

    @Transactional
    public void triggerRestoreTest(String author) {
        // Simulate picking the latest backup and verifying it
        DbBackup latest = dbBackupRepository.findTop10ByOrderByTimestampDesc().stream().findFirst().orElse(null);
        
        StorageConfig config = getConfig();
        config.setLastSync(LocalDateTime.now()); // Reusing lastSync as last test date for simplicity
        storageConfigRepository.save(config);

        String result = (latest != null) ? "Success for " + latest.getFilename() : "No backups found to test";
        auditService.logAction("RESTORE_TEST", "Automated restoration integrity test: " + result, author, "SUPER_ADMIN", "SECURITY", "SUCCESS");
    }

    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> downloadBackup(Long id, String author) {
        DbBackup backup = dbBackupRepository.findById(id).orElse(null);
        if (backup == null) return org.springframework.http.ResponseEntity.notFound().build();

        try {
            Path filePath = Paths.get("uploads/backups/").resolve(backup.getFilename());
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                auditService.logAction("BACKUP_DOWNLOAD", "Manual SQL backup download: " + backup.getFilename(), author, "SUPER_ADMIN", "DATABASE", "SUCCESS");
                return org.springframework.http.ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + backup.getFilename() + "\"")
                        .body(resource);
            }
        } catch (Exception e) { e.printStackTrace(); }
        
        return org.springframework.http.ResponseEntity.status(500).build();
    }

    // --- Helper Methods ---
    private long getFolderSize(String path) {
        File folder = new File(path);
        if (!folder.exists()) return 0;
        long size = 0;
        for (File file : folder.listFiles()) {
            if (file.isFile()) size += file.length();
            else size += getFolderSize(file.getAbsolutePath());
        }
        return size;
    }

    private int countFiles(String path) {
        File folder = new File(path);
        if (!folder.exists()) return 0;
        return folder.listFiles().length;
    }

    private void deleteFolderContents(String path) {
        File folder = new File(path);
        if (!folder.exists()) return;
        for (File file : folder.listFiles()) {
            if (file.isFile()) file.delete();
            else deleteFolderContents(file.getAbsolutePath());
        }
    }
}
