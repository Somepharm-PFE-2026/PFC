package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.service.HelpdeskService;
import com.somepharm.hrportal.entity.PasswordResetTicket;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.security.Principal;

@RestController
@RequestMapping("/api/admin/tickets")
@CrossOrigin(origins = "http://localhost:3000")
public class HelpdeskController {

    private final HelpdeskService helpdeskService;

    public HelpdeskController(HelpdeskService helpdeskService) {
        this.helpdeskService = helpdeskService;
    }

    @PostMapping("/public/request-reset")
    public ResponseEntity<Void> requestReset(@RequestBody Map<String, String> request) {
        helpdeskService.createTicket(request.get("matricule"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request-reset")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> requestResetAuth(Principal principal) {
        helpdeskService.createTicket(principal.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getMyStatus(Principal principal) {
        String status = helpdeskService.getActiveTicketStatus(principal.getName());
        return ResponseEntity.ok(Map.of("status", status != null ? status : "NONE"));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTickets() {
        return ResponseEntity.ok(Map.of(
            "tickets", helpdeskService.getAllTickets(),
            "counters", helpdeskService.getCounters()
        ));
    }

    @PostMapping("/{id}/process")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> processTicket(
            @PathVariable Long id, 
            @RequestBody Map<String, String> request,
            Principal principal) {
        String channel = request.getOrDefault("channel", "COPIER_COLLER");
        return ResponseEntity.ok(helpdeskService.processTicket(id, channel, principal.getName()));
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> finalizeTicket(@PathVariable Long id) {
        helpdeskService.markAsSent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/send-email")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> sendEmail(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String rawPassword = request.get("password");
        helpdeskService.sendEmailWithPassword(id, rawPassword);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history/{matricule}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getHistory(@PathVariable String matricule) {
        return ResponseEntity.ok(helpdeskService.getUserHistory(matricule));
    }
}
