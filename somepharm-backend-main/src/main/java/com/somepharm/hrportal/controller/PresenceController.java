package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Pointage;
import com.somepharm.hrportal.service.PresenceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presence")
@CrossOrigin(origins = "http://localhost:3000")
public class PresenceController {

    private final PresenceService presenceService;
    private final com.somepharm.hrportal.service.AttendanceCalculationService calculationService;
    private final com.somepharm.hrportal.service.AttendanceStatsService statsService;

    public PresenceController(PresenceService presenceService, 
                            com.somepharm.hrportal.service.AttendanceCalculationService calculationService,
                            com.somepharm.hrportal.service.AttendanceStatsService statsService) {
        this.presenceService = presenceService;
        this.calculationService = calculationService;
        this.statsService = statsService;
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<com.somepharm.hrportal.dto.PresenceAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(statsService.getAnalytics());
    }

    @GetMapping("/report")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<com.somepharm.hrportal.dto.AttendanceReportDTO> getReport(
            @RequestParam String matricule,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(calculationService.calculateMonthlyReport(matricule, year, month));
    }

    @GetMapping("/live-stats")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getLiveStats() {
        return ResponseEntity.ok(presenceService.getLiveStats());
    }

    @GetMapping("/anomalies")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAnomalies(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(presenceService.getAnomalies(date));
    }

    @PostMapping("/nudge")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<String> nudge(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        presenceService.nudgeAnomalies(date);
        return ResponseEntity.ok("Relances envoyées avec succès.");
    }

    @PostMapping("/force-regularize")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Pointage> forceRegularize(
            @RequestParam Long pointageId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime newTime,
            @RequestParam String reason,
            org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(presenceService.forceRegularize(pointageId, newTime, auth.getName(), reason));
    }

    @PostMapping("/add-manual")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Pointage> addManualPointage(
            @RequestParam Long idUser,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime time,
            @RequestParam String type,
            @RequestParam String reason,
            org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(presenceService.addManualPointage(idUser, time, type, auth.getName(), reason));
    }
    @GetMapping("/anomalies-calendar")
    @PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> getAnomaliesCalendar(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(presenceService.getMonthlyAnomaliesSummary(year, month));
    }
}
