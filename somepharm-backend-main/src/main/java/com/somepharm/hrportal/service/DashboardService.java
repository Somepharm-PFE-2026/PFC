package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UtilisateurRepository utilisateurRepository;
    private final DemandeCongeRepository demandeCongeRepository;
    private final PointageRepository pointageRepository;
    private final AuditLogRepository auditLogRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final DemandeCongeService demandeCongeService;
    private final RequeteRepository requeteRepository;
    private final PresenceService presenceService;
    private final JourFerieRepository jourFerieRepository;
    private final EmailConfigRepository emailConfigRepository;

    private final LocalDateTime startTime = LocalDateTime.now();

    public DashboardService(UtilisateurRepository utilisateurRepository,
                            DemandeCongeRepository demandeCongeRepository,
                            PointageRepository pointageRepository,
                            AuditLogRepository auditLogRepository,
                            SystemConfigRepository systemConfigRepository,
                            DemandeCongeService demandeCongeService,
                            RequeteRepository requeteRepository,
                            PresenceService presenceService,
                            JourFerieRepository jourFerieRepository,
                            EmailConfigRepository emailConfigRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.demandeCongeRepository = demandeCongeRepository;
        this.pointageRepository = pointageRepository;
        this.auditLogRepository = auditLogRepository;
        this.systemConfigRepository = systemConfigRepository;
        this.demandeCongeService = demandeCongeService;
        this.requeteRepository = requeteRepository;
        this.presenceService = presenceService;
        this.jourFerieRepository = jourFerieRepository;
        this.emailConfigRepository = emailConfigRepository;
    }

    public Map<String, Object> getEmployeeData(Utilisateur user) {
        Map<String, Object> data = new HashMap<>();
        data.put("soldeConges", user.getSoldeConges());
        
        // Unified query across all request types
        List<com.somepharm.hrportal.dto.RequeteDTO> recentRequests = requeteRepository.findTop5ByDemandeur_IdUserOrderByDateSoumissionDesc(user.getIdUser())
                .stream()
                .map(this::mapToRequeteDTO)
                .collect(Collectors.toList());
                
        data.put("recentRequests", recentRequests);
        return data;
    }

    private com.somepharm.hrportal.dto.RequeteDTO mapToRequeteDTO(Requete requete) {
        com.somepharm.hrportal.dto.RequeteDTO dto = com.somepharm.hrportal.dto.RequeteDTO.builder()
                .idRequete(requete.getIdRequete())
                .dateSoumission(requete.getDateSoumission())
                .statutCycleVie(requete.getStatutCycleVie())
                .description(requete.getDescription())
                .build();

        if (requete instanceof DemandeConge) {
            DemandeConge dc = (DemandeConge) requete;
            String typeName = dc.getTypeConge() != null ? dc.getTypeConge().getNom() : "Congé";
            dto.setTypeLabel(typeName);
            dto.setTypeConge(typeName);
        } else if (requete instanceof DemandeDocument) {
            DemandeDocument dd = (DemandeDocument) requete;
            dto.setTypeLabel(dd.getTypeDocument());
            dto.setTypeDocument(dd.getTypeDocument());
        } else {
            dto.setTypeLabel("Autre");
        }

        return dto;
    }

    public Map<String, Object> getManagerData(Utilisateur manager) {
        Map<String, Object> data = new HashMap<>();
        LocalDate today = LocalDate.now();
        
        // 1. Fundamental Counts & Urgency (Pillar 1)
        long totalTeam = utilisateurRepository.countByManagerDirect_IdUser(manager.getIdUser());
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);
        long presentTodayCount = pointageRepository.countByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(start, end, manager.getIdUser());
        
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        int urgencyHours = config.getUrgencyDelayHours() > 0 ? config.getUrgencyDelayHours() : 48;
        long urgentPendingCount = demandeCongeRepository.countUrgentRequests(manager.getIdUser(), LocalDateTime.now().minusHours(urgencyHours));

        data.put("teamTotalCount", totalTeam);
        data.put("teamAttendanceCount", presentTodayCount);
        data.put("presenceRateToday", totalTeam > 0 ? Math.round(((double) presentTodayCount / totalTeam) * 100) : 0);
        data.put("pendingActionCount", demandeCongeRepository.countByDemandeur_ManagerDirect_IdUserAndStatutCycleVieIn(
                manager.getIdUser(), List.of("EN_ATTENTE_MANAGER")));
        data.put("urgentPendingCount", urgentPendingCount);

        // 2. Alert Hudson: Late Arrivals (Pillar 2)
        List<Pointage> teamPointagesToday = pointageRepository.findAllByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(start, end, manager.getIdUser());
        List<Map<String, String>> lateAlerts = teamPointagesToday.stream()
                .filter(p -> "RETARD".equals(p.getStatut()))
                .map(p -> Map.of(
                    "matricule", p.getEmploye().getMatricule(),
                    "heure", p.getHorodatage() != null ? p.getHorodatage().toString().substring(11, 16) : "--:--"
                ))
                .collect(Collectors.toList());
        data.put("lateAlerts", lateAlerts);

        // 3. Absence Tracking Today (Pillar 2)
        List<DemandeConge> leavesToday = demandeCongeRepository.findApprovedTeamLeavesInRange(manager.getIdUser(), today, today);
        List<String> matriculesOnLeave = leavesToday.stream().map(d -> d.getDemandeur().getMatricule()).collect(Collectors.toList());
        List<String> matriculesPresent = teamPointagesToday.stream().map(p -> p.getEmploye().getMatricule()).collect(Collectors.toList());
        
        List<Utilisateur> teamMembers = utilisateurRepository.findAllByManagerDirect_IdUser(manager.getIdUser());
        List<Map<String, String>> absentsList = teamMembers.stream()
                .filter(u -> !matriculesPresent.contains(u.getMatricule()))
                .map(u -> Map.of(
                    "matricule", u.getMatricule(),
                    "reason", matriculesOnLeave.contains(u.getMatricule()) ? "Congé/Maladie" : "Inconnu"
                ))
                .collect(Collectors.toList());
        data.put("absentsToday", absentsList);

        // 4. Team Capacity Heatmap - 35 Days (aligned to Sunday start)
        List<Map<String, Object>> heatmap = new ArrayList<>();
        boolean isCurrentlyUnderstaffed = false;
        double threshold = 0.3; // 30% absence threshold
        
        // Calculate offset to start from the current week's SUNDAY
        // In Algeria, work week is Sun-Thu.
        // getDayOfWeek().getValue() is 1 (Mon) to 7 (Sun)
        int dayValue = today.getDayOfWeek().getValue();
        int offsetToSunday = (dayValue == 7) ? 0 : dayValue; // Since Sunday is 7, offset is 0 if today is Sunday, else it's today's value (Mon=1, etc.)
        LocalDate startOfPlanning = today.minusDays(offsetToSunday);

        for (int i = 0; i < 35; i++) {
            LocalDate targetDate = startOfPlanning.plusDays(i);
            long count = demandeCongeRepository.findApprovedTeamLeavesInRange(manager.getIdUser(), targetDate, targetDate).size();
            boolean isCritical = totalTeam > 0 && ((double)count / totalTeam) >= threshold;
            
            int dow = targetDate.getDayOfWeek().getValue();
            // In Algeria: Weekend = Fri (5), Sat (6). Work = Sun (7), Mon-Thu (1-4).
            boolean isWeekend = (dow == 5 || dow == 6);

            // Understaffed alert only looks at the next 7 days from TODAY (not from startOfPlanning)
            // It only counts working days
            if (isCritical && !isWeekend && !targetDate.isBefore(today) && targetDate.isBefore(today.plusDays(7))) {
                isCurrentlyUnderstaffed = true;
            }

            heatmap.add(Map.of(
                "date", targetDate.toString(),
                "dayLabel", targetDate.getDayOfMonth() + " " + targetDate.getMonth().toString().substring(0, 3),
                "dayName", targetDate.getDayOfWeek().toString().substring(0, 3),
                "absenceCount", count,
                "isWeekend", isWeekend,
                "isCritical", isCritical
            ));
        }
        data.put("teamCapacityHeatmap", heatmap);
        data.put("isUnderstaffedAlert", isCurrentlyUnderstaffed);

        // 5. Traditional Absence List
        data.put("upcomingTeamAbsences", leavesToday.stream().map(demandeCongeService::convertToDTO).collect(Collectors.toList()));
        
        return data;
    }

    public Map<String, Object> getHRAdminData() {
        Map<String, Object> data = new HashMap<>();
        long totalHeadcount = utilisateurRepository.count();
        
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);
        long presentToday = pointageRepository.countByHorodatageBetween(start, end);
        
        boolean isHoliday = jourFerieRepository.findAll().stream()
                .anyMatch(h -> h.getDate().equals(today));

        // Absenteeism Rate: (Employees NOT present)
        // If it's a holiday, absenteeism is 0% by definition
        double absenteeismRate = 0;
        if (!isHoliday && totalHeadcount > 0) {
            absenteeismRate = ((double)(totalHeadcount - presentToday) / totalHeadcount) * 100;
        }
        
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        int urgencyHours = config.getUrgencyDelayHours() > 0 ? config.getUrgencyDelayHours() : 48;

        List<String> hrStatusList = List.of("EN_ATTENTE_RH", "VALIDE_MANAGER");
        long globalPendingCount = demandeCongeRepository.countByStatutCycleVieIn(hrStatusList);
        long globalUrgentCount = demandeCongeRepository.countGlobalUrgentRequests(hrStatusList, LocalDateTime.now().minusHours(urgencyHours));

        data.put("totalHeadcount", totalHeadcount);
        data.put("absenteeismRate", Math.round(absenteeismRate * 10.0) / 10.0);
        data.put("globalPendingCount", globalPendingCount);
        data.put("globalUrgentPendingCount", globalUrgentCount);
        data.put("isHoliday", isHoliday);

        // NEW: Anomaly Tracking
        data.put("attendanceAnomaliesCount", presenceService.getAnomalies(today).size());
        
        return data;
    }

    public Map<String, Object> getSuperAdminData() {
        Map<String, Object> data = new HashMap<>();
        
        // Health metrics
        data.put("dbStatus", "CONNECTED"); // Static for now as we are running
        data.put("serverUptime", startTime.toString());
        data.put("storageUsage", 12.5); // Mock 12.5 GB
        
        // Logs
        data.put("recentLogs", auditLogRepository.findTop10ByOrderByTimestampDesc());
        
        // Role distribution with null-safety
        Map<String, Long> roleDistribution = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getNomRole() != null)
                .collect(Collectors.groupingBy(u -> u.getRole().getNomRole(), Collectors.counting()));
        data.put("roleDistribution", roleDistribution);

        
        // System Config
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        data.put("systemConfig", config);
        
        return data;
    }

    public Map<String, Object> getCockpitData() {
        Map<String, Object> cockpit = new HashMap<>();

        // 1. Pending Activations
        cockpit.put("pending_activations", utilisateurRepository.countByStatutCompte("INACTIF"));

        // 2. Password Stats (excluding INACTIF)
        List<Utilisateur> activeUsers = utilisateurRepository.findAll().stream()
                .filter(u -> !"INACTIF".equals(u.getStatutCompte()))
                .collect(Collectors.toList());
        
        Map<String, Long> passwordStats = new HashMap<>();
        passwordStats.put("secured", activeUsers.stream().filter(u -> "SÉCURISÉ".equals(u.getPasswordStatus()) || "MODIFIE".equals(u.getPasswordStatus())).count());
        passwordStats.put("temporary", activeUsers.stream().filter(u -> "TEMPORAIRE".equals(u.getPasswordStatus())).count());
        cockpit.put("password_stats", passwordStats);

        // 3. Failed Logins (24h)
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        cockpit.put("failed_logins_24h", auditLogRepository.countByTimestampAfterAndTypeAction(oneDayAgo, "LOGIN_FAILURE"));

        // 4. Services Status
        Map<String, String> services = new HashMap<>();
        Optional<EmailConfig> emailConfig = emailConfigRepository.findAll().stream().findFirst();
        services.put("smtp", (emailConfig.isPresent() && emailConfig.get().getSmtpHost() != null) ? "OPERATIONAL" : "DOWN");
        services.put("pdf_generator", "OPERATIONAL");
        services.put("database", "OPERATIONAL");
        services.put("api", "OPERATIONAL");
        cockpit.put("services", services);

        // 5. Uptime & Storage
        long hoursRunning = java.time.Duration.between(startTime, LocalDateTime.now()).toHours();
        cockpit.put("uptime_percentage", hoursRunning > 0 ? 99.9 : 100.0);
        
        java.io.File root = new java.io.File(".");
        long totalSpace = root.getTotalSpace();
        long usableSpace = root.getUsableSpace();
        long usedSpace = totalSpace - usableSpace;
        
        Map<String, Object> storage = new HashMap<>();
        storage.put("used_gb", Math.round((double) usedSpace / (1024 * 1024 * 1024) * 10.0) / 10.0);
        storage.put("total_gb", Math.round((double) totalSpace / (1024 * 1024 * 1024) * 10.0) / 10.0);
        storage.put("percentage", (int) ((double) usedSpace / totalSpace * 100));
        cockpit.put("storage", storage);

        // 6. Recent Audit (5 last entries)
        List<Map<String, Object>> recentAudit = auditLogRepository.findTop10ByOrderByTimestampDesc().stream()
                .limit(5)
                .map(log -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("timestamp", log.getTimestamp());
                    m.put("role", log.getRole());
                    m.put("action", log.getTypeAction());
                    m.put("target", log.getTargetEntity());
                    return m;
                })
                .collect(Collectors.toList());
        cockpit.put("recent_audit", recentAudit);

        // 7. QR Scans Today
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long validScans = auditLogRepository.countByTimestampAfterAndTypeActionAndResult(startOfToday, "SECURITY_SCAN", "SUCCESS");
        long failedScans = auditLogRepository.countByTimestampAfterAndTypeActionAndResult(startOfToday, "SECURITY_SCAN", "FAILURE");
        
        Map<String, Long> qrScans = new HashMap<>();
        qrScans.put("valid", validScans);
        qrScans.put("failed", failedScans);
        cockpit.put("qr_scans_today", qrScans);

        return cockpit;
    }

    @org.springframework.transaction.annotation.Transactional
    public void purgeOldLogs(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        auditLogRepository.deleteByTimestampBefore(cutoff);
    }
}
