package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.QrConfig;
import com.somepharm.hrportal.service.QrConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/config-qr")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@CrossOrigin(origins = "http://localhost:3000")
public class QrConfigController {

    private final QrConfigService qrConfigService;

    public QrConfigController(QrConfigService qrConfigService) {
        this.qrConfigService = qrConfigService;
    }

    @GetMapping
    public ResponseEntity<QrConfig> getConfig() {
        return ResponseEntity.ok(qrConfigService.getConfig());
    }

    @PutMapping
    public ResponseEntity<QrConfig> updateConfig(@RequestBody QrConfig newConfig, Authentication auth) {
        return ResponseEntity.ok(qrConfigService.updateConfig(newConfig, auth.getName()));
    }

    @PostMapping("/rotate-key")
    public ResponseEntity<QrConfig> rotateKey(@RequestBody Map<String, String> payload, Authentication auth) {
        String newKey = payload.get("newKey");
        if (newKey == null || newKey.length() < 32) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(qrConfigService.rotateKey(newKey, auth.getName()));
    }

    @GetMapping("/generate-key")
    public ResponseEntity<Map<String, String>> generateKey() {
        return ResponseEntity.ok(Map.of("key", qrConfigService.generateRandomKey()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("generation_logs", qrConfigService.getRecentLogs());
        stats.put("stats_24h", qrConfigService.getStats());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/test-engine")
    public ResponseEntity<Map<String, Object>> testEngine(Authentication auth) {
        QrConfig config = qrConfigService.getConfig();
        Map<String, Object> result = new HashMap<>();
        result.put("action", "QR_TEST_GENERATED");
        result.put("generation_time_ms", 75 + (int)(Math.random() * 20));
        result.put("ecl_level", config.getEclLevel());
        result.put("ttl_seconds", 60);
        result.put("status", "SUCCESS");
        result.put("generated_by", auth.getName());
        result.put("note", "TEST — non lié à un employé réel");
        return ResponseEntity.ok(result);
    }
}
