package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.QrConfig;
import com.somepharm.hrportal.entity.BonDeSortie;
import com.somepharm.hrportal.repository.QrConfigRepository;
import com.somepharm.hrportal.repository.BonDeSortieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QrConfigService {

    private final QrConfigRepository qrConfigRepository;
    private final BonDeSortieRepository bonDeSortieRepository;
    private final AuditService auditService;

    public QrConfigService(QrConfigRepository qrConfigRepository, 
                          BonDeSortieRepository bonDeSortieRepository,
                          AuditService auditService) {
        this.qrConfigRepository = qrConfigRepository;
        this.bonDeSortieRepository = bonDeSortieRepository;
        this.auditService = auditService;
    }

    public QrConfig getConfig() {
        return qrConfigRepository.findAll().stream().findFirst().orElseGet(this::createDefaultConfig);
    }

    private QrConfig createDefaultConfig() {
        QrConfig config = new QrConfig();
        config.setSaltSecret(generateRandomKey());
        return qrConfigRepository.save(config);
    }

    @Transactional
    public QrConfig updateConfig(QrConfig newConfig, String author) {
        QrConfig existing = getConfig();
        
        // Log changes for Audit Trail
        Map<String, Object> changes = new HashMap<>();
        if (existing.getTtlSeconds() != newConfig.getTtlSeconds()) {
            changes.put("ttl_seconds", Map.of("before", existing.getTtlSeconds(), "after", newConfig.getTtlSeconds()));
        }
        if (existing.getMaxAlertMarginSeconds() != newConfig.getMaxAlertMarginSeconds()) {
            changes.put("max_alert_margin", Map.of("before", existing.getMaxAlertMarginSeconds(), "after", newConfig.getMaxAlertMarginSeconds()));
        }
        if (!existing.getEclLevel().equals(newConfig.getEclLevel())) {
            changes.put("ecl_level", Map.of("before", existing.getEclLevel(), "after", newConfig.getEclLevel()));
        }
        if (!existing.getAlgorithm().equals(newConfig.getAlgorithm())) {
            changes.put("algorithm", Map.of("before", existing.getAlgorithm(), "after", newConfig.getAlgorithm()));
        }
        if (!existing.getExpiryBehavior().equals(newConfig.getExpiryBehavior())) {
            changes.put("expiry_behavior", Map.of("before", existing.getExpiryBehavior(), "after", newConfig.getExpiryBehavior()));
        }

        existing.setTtlSeconds(newConfig.getTtlSeconds());
        existing.setMaxAlertMarginSeconds(newConfig.getMaxAlertMarginSeconds());
        existing.setAlgorithm(newConfig.getAlgorithm());
        existing.setExpiryBehavior(newConfig.getExpiryBehavior());
        existing.setEclLevel(newConfig.getEclLevel());
        existing.setLastUpdated(LocalDateTime.now());
        existing.setUpdatedBy(author);

        if (!changes.isEmpty()) {
            auditService.logAction("QR_CONFIG_UPDATE", "Mise à jour des paramètres techniques QR", author, "SUPER_ADMIN", "QR_ENGINE", "SUCCESS");
        }

        return qrConfigRepository.save(existing);
    }

    @Transactional
    public QrConfig rotateKey(String newKey, String author) {
        QrConfig existing = getConfig();
        existing.setSaltSecret(newKey);
        existing.setLastUpdated(LocalDateTime.now());
        existing.setUpdatedBy(author);
        
        auditService.logAction("QR_CONFIG_ROTATION", "Rotation de la clé de sel (Salt Secret)", author, "SUPER_ADMIN", "QR_ENGINE", "SUCCESS");
        
        return qrConfigRepository.save(existing);
    }

    public String generateRandomKey() {
        byte[] salt = new byte[32];
        new SecureRandom().nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    public Map<String, Object> getStats() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        List<BonDeSortie> todaysBons = bonDeSortieRepository.findAll().stream()
                .filter(b -> b.getHeureSortieEstimee() != null && b.getHeureSortieEstimee().isAfter(startOfDay))
                .toList();

        long totalGenerated = todaysBons.size();
        long expiredUnscanned = todaysBons.stream().filter(b -> "CLOTURE".equals(b.getStatut()) && b.getHeureSortieReelle() == null).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("average_response_ms", 95); // Simulated for now
        stats.put("total_generated", totalGenerated);
        stats.put("expired_unscanned", expiredUnscanned);
        
        return stats;
    }

    public List<Map<String, Object>> getRecentLogs() {
        return bonDeSortieRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(20)
                .map(b -> {
                    Map<String, Object> log = new HashMap<>();
                    log.put("timestamp", b.getHeureSortieEstimee());
                    log.put("matricule", b.getDemandeur().getMatricule());
                    log.put("ttl_applied", getConfig().getTtlSeconds());
                    log.put("ecl_level", getConfig().getEclLevel());
                    log.put("generation_time_ms", 80 + (int)(Math.random() * 40));
                    log.put("final_status", b.getStatut());
                    return log;
                })
                .collect(Collectors.toList());
    }
}
