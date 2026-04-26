package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.service.HealthMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/health")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminHealthController {

    private final HealthMonitoringService healthMonitoringService;

    public AdminHealthController(HealthMonitoringService healthMonitoringService) {
        this.healthMonitoringService = healthMonitoringService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        return ResponseEntity.ok(healthMonitoringService.getHealthStatus());
    }

    @PostMapping("/restart/{service}")
    public ResponseEntity<Map<String, String>> restartService(@PathVariable String service, Authentication auth) {
        healthMonitoringService.restartService(service, auth.getName());
        return ResponseEntity.ok(Map.of("message", "Service " + service + " a été redémarré avec succès !"));
    }
}
