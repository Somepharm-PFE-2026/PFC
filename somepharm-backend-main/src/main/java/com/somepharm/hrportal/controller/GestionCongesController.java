package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.AuditLog;
import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.AuditLogRepository;
import com.somepharm.hrportal.repository.DemandeCongeRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 🏢 HR CONGES COMMAND CENTER
 * Specialized controller for global leave management, payroll exports, and social debt reporting.
 */
@RestController
@RequestMapping("/api/hr/conges")
@PreAuthorize("hasRole('RH_ADMIN') or hasRole('HR_MANAGER') or hasRole('SUPER_ADMIN')")
public class GestionCongesController {

    private final DemandeCongeRepository congeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AuditLogRepository auditLogRepository;

    public GestionCongesController(DemandeCongeRepository congeRepository, 
                                   UtilisateurRepository utilisateurRepository,
                                   AuditLogRepository auditLogRepository) {
        this.congeRepository = congeRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * 1. VISION GLOBALE (Gantt Source)
     * Returns all leaves with status mapping for visual risk management.
     */
    @GetMapping("/planning")
    public ResponseEntity<List<Map<String, Object>>> getGlobalPlanning() {
        List<DemandeConge> allLeaves = congeRepository.findAll();
        
        List<Map<String, Object>> result = allLeaves.stream().map(leaf -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", leaf.getIdRequete());
            map.put("employee", leaf.getDemandeur().getPrenom() + " " + leaf.getDemandeur().getNom());
            map.put("matricule", leaf.getDemandeur().getMatricule());
            map.put("departement", leaf.getDemandeur().getDepartement() != null ? leaf.getDemandeur().getDepartement().getNomDept() : "");
            map.put("start", leaf.getDateDebut());
            map.put("end", leaf.getDateFin());
            map.put("type", leaf.getTypeConge() != null ? leaf.getTypeConge().getNom() : "Autre");
            map.put("color", leaf.getTypeConge() != null ? leaf.getTypeConge().getCouleurHex() : "#94A3B8");
            
            // 🛡️ RISK VISUAL TREATMENT
            // Solid for Approved, Transparent for Pending
            String status = leaf.getStatutCycleVie();
            boolean isApproved = "APPROUVE".equals(status) || "APPROUVÉ".equals(status);
            map.put("isApproved", isApproved);
            map.put("status", status);
            
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * 2. SUIVI DES SOLDES
     * List of all employees with their current counters.
     */
    @GetMapping("/balances")
    public ResponseEntity<List<Map<String, Object>>> getEmployeeBalances() {
        List<Utilisateur> users = utilisateurRepository.findAll();
        
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getIdUser());
            map.put("matricule", u.getMatricule());
            map.put("nomComplet", u.getPrenom() + " " + u.getNom());
            map.put("departement", u.getDepartement() != null ? u.getDepartement().getNomDept() : "");
            map.put("soldeRestant", u.getSoldeConges());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * 3. AJUSTEMENT MANUEL (Audit-Ready)
     * Corrections to employee balances with mandatory justification.
     */
    @PostMapping("/adjust")
    public ResponseEntity<?> adjustBalance(@RequestBody Map<String, Object> payload, Authentication auth) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Double amount = Double.valueOf(payload.get("amount").toString());
        String reason = (String) payload.get("reason");

        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Un commentaire justificatif est obligatoire pour toute correction manuelle.");
        }

        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        Double oldBalance = user.getSoldeConges();
        user.setSoldeConges(oldBalance + amount);
        utilisateurRepository.save(user);

        // 🛡️ TRACEABILITY LOG
        String logDesc = String.format("Correction manuelle du solde de %s : %.1f -> %.1f. Motif : %s", 
                user.getMatricule(), oldBalance, user.getSoldeConges(), reason);
        
        AuditLog log = new AuditLog("SOLDE_ADJUSTMENT", logDesc, auth.getName());
        auditLogRepository.save(log);

        return ResponseEntity.ok(Map.of("message", "Solde mis à jour avec succès", "newBalance", user.getSoldeConges()));
    }

    /**
     * 4. ANALYTICS (Social Debt & Absenteeism)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        List<Utilisateur> users = utilisateurRepository.findAll();
        
        // --- Social Debt: Top remaining balances ---
        List<Map<String, Object>> topSocialDebt = users.stream()
                .sorted(Comparator.comparingDouble(Utilisateur::getSoldeConges).reversed())
                .limit(5)
                .map(u -> {
                    Map<String, Object> debtMap = new HashMap<>();
                    debtMap.put("matricule", u.getMatricule());
                    debtMap.put("solde", u.getSoldeConges());
                    return debtMap;
                })
                .collect(Collectors.toList());

        // --- Absenteeism Rate (Simple calculation for the month) ---
        long totalEmployees = users.size();
        LocalDate now = LocalDate.now();
        List<DemandeConge> activeAbsences = congeRepository.findAll().stream()
                .filter(l -> ("APPROUVE".equals(l.getStatutCycleVie()) || "APPROUVÉ".equals(l.getStatutCycleVie()))
                        && !l.getDateDebut().isAfter(now) && !l.getDateFin().isBefore(now))
                .collect(Collectors.toList());
        
        double absenteeismRate = (totalEmployees > 0) ? (double) activeAbsences.size() / totalEmployees * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("absenteeismRate", Math.round(absenteeismRate * 10) / 10.0);
        stats.put("topSocialDebt", topSocialDebt);
        stats.put("activeAbsencesCount", activeAbsences.size());
        stats.put("totalEmployees", totalEmployees);

        return ResponseEntity.ok(stats);
    }
}
