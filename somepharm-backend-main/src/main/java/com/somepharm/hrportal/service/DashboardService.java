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
    private final HolidayService holidayService;
    private final WorkflowService workflowService;
    private final DepartementRepository departementRepository;

    public DashboardService(UtilisateurRepository utilisateurRepository,
                            DemandeCongeRepository demandeCongeRepository,
                            PointageRepository pointageRepository,
                            AuditLogRepository auditLogRepository,
                            SystemConfigRepository systemConfigRepository,
                            DemandeCongeService demandeCongeService,
                            RequeteRepository requeteRepository,
                            PresenceService presenceService,
                            JourFerieRepository jourFerieRepository,
                            EmailConfigRepository emailConfigRepository,
                            HolidayService holidayService,
                            WorkflowService workflowService,
                            DepartementRepository departementRepository) {
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
        this.holidayService = holidayService;
        this.workflowService = workflowService;
        this.departementRepository = departementRepository;
    }

    private final LocalDateTime startTime = LocalDateTime.now();

    public Map<String, Object> getEmployeeData(Utilisateur user) {
        Map<String, Object> data = new HashMap<>();
        data.put("soldeConges", user.getSoldeConges());
        
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

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Map<String, Object> getManagerData(Utilisateur manager) {
        Map<String, Object> data = new HashMap<>();
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);

        // 🔍 IDENTIFY SCOPE: Is this user a Chef de Département or a Direct Manager?
        List<Departement> managedDepts = departementRepository.findByManager_IdUser(manager.getIdUser());
        boolean isChefDept = !managedDepts.isEmpty();
        
        long totalTeam;
        long presentTodayCount;
        List<Pointage> entreesToday;   // ENTREE records only — for late alerts
        List<Pointage> allPointagesToday; // All records — for deriving present matricules
        List<Utilisateur> teamMembers;

        if (isChefDept) {
            List<Long> deptIds = managedDepts.stream().map(Departement::getIdDept).collect(Collectors.toList());
            totalTeam = managedDepts.stream().mapToLong(d -> utilisateurRepository.countByDepartement_IdDept(d.getIdDept())).sum();

            presentTodayCount = 0;
            entreesToday = new ArrayList<>();
            allPointagesToday = new ArrayList<>();
            teamMembers = new ArrayList<>();

            for (Long deptId : deptIds) {
                presentTodayCount += pointageRepository.countDistinctPresentByDeptAndDate(deptId, start, end);
                entreesToday.addAll(pointageRepository.findEntreesByDeptAndDate(deptId, start, end));
                allPointagesToday.addAll(pointageRepository.findAllByHorodatageBetweenAndEmploye_Departement_IdDept(start, end, deptId));
                teamMembers.addAll(utilisateurRepository.findAllByDepartement_IdDept(deptId));
            }
        } else {
            totalTeam = utilisateurRepository.countByManagerDirect_IdUser(manager.getIdUser());
            presentTodayCount = pointageRepository.countDistinctPresentByManagerAndDate(manager.getIdUser(), start, end);
            entreesToday = pointageRepository.findEntreesByManagerAndDate(manager.getIdUser(), start, end);
            allPointagesToday = pointageRepository.findAllByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(start, end, manager.getIdUser());
            teamMembers = utilisateurRepository.findAllByManagerDirect_IdUser(manager.getIdUser());
        }

        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        int urgencyHours = (config != null && config.getUrgencyDelayHours() > 0) ? config.getUrgencyDelayHours() : 48;
        LocalDateTime urgencyLimit = LocalDateTime.now().minusHours(urgencyHours);

        // PENDING VALIDATION COUNT — use direct COUNT queries to avoid JOIN FETCH on polymorphic Requete
        long pendingActionCount = 0;
        long urgentPendingCount = 0;
        if (isChefDept) {
            List<String> chefStatuses = List.of("EN_ATTENTE_CHEF_DEPT");
            for (Departement dept : managedDepts) {
                pendingActionCount += requeteRepository.countPendingByDeptId(chefStatuses, dept.getIdDept());
                urgentPendingCount += requeteRepository.countUrgentPendingByDeptId(chefStatuses, dept.getIdDept(), urgencyLimit);
            }
        } else {
            List<String> mgStatuses = List.of("EN_ATTENTE_MANAGER");
            pendingActionCount = requeteRepository.countPendingByManagerId(mgStatuses, manager.getIdUser());
            urgentPendingCount = requeteRepository.countUrgentPendingByManagerId(mgStatuses, manager.getIdUser(), urgencyLimit);
        }

        data.put("teamTotalCount", totalTeam);
        data.put("teamAttendanceCount", presentTodayCount);
        data.put("presenceRateToday", totalTeam > 0 ? Math.round(((double) presentTodayCount / totalTeam) * 100) : 0);
        data.put("pendingActionCount", pendingActionCount);
        data.put("urgentPendingCount", urgentPendingCount);

        // Late arrivals — only from ENTREE records, deduplicated by matricule
        List<Map<String, String>> lateAlerts = entreesToday.stream()
                .filter(p -> "RETARD".equals(p.getStatut()))
                .collect(Collectors.toMap(
                    p -> p.getEmploye().getMatricule(),
                    p -> Map.of(
                        "matricule", p.getEmploye().getMatricule(),
                        "heure", p.getHorodatage() != null ? p.getHorodatage().toString().substring(11, 16) : "--:--"
                    ),
                    (a, b) -> a
                ))
                .values().stream()
                .collect(Collectors.toList());
        data.put("lateAlerts", lateAlerts);

        // Absence Tracking Today
        List<DemandeConge> leavesToday;
        if (isChefDept) {
            leavesToday = new ArrayList<>();
            for (Departement d : managedDepts) {
                leavesToday.addAll(demandeCongeRepository.findApprovedDeptLeavesInRange(d.getIdDept(), today, today));
            }
        } else {
            leavesToday = demandeCongeRepository.findApprovedTeamLeavesInRange(manager.getIdUser(), today, today);
        }

        List<String> matriculesOnLeave = leavesToday.stream().map(d -> d.getDemandeur().getMatricule()).collect(Collectors.toList());
        // Use ENTREE records to determine who actually showed up (distinct by matricule)
        List<String> matriculesPresent = entreesToday.stream()
                .map(p -> p.getEmploye().getMatricule())
                .distinct()
                .collect(Collectors.toList());
        
        boolean isHoliday = holidayService.isHoliday(today);
        List<Map<String, String>> absentsList = isHoliday ? new ArrayList<>() : teamMembers.stream()
                .filter(u -> !matriculesPresent.contains(u.getMatricule()))
                .map(u -> Map.of(
                    "matricule", u.getMatricule(),
                    "reason", matriculesOnLeave.contains(u.getMatricule()) ? "Congé/Maladie" : "Inconnu"
                ))
                .collect(Collectors.toList());
        data.put("absentsToday", absentsList);
        data.put("isHoliday", isHoliday);

        // Heatmap Logic
        List<Map<String, Object>> heatmap = new ArrayList<>();
        boolean isCurrentlyUnderstaffed = false;
        double threshold = 0.3;
        
        int dayValue = today.getDayOfWeek().getValue();
        int offsetToSunday = (dayValue == 7) ? 0 : dayValue; 
        LocalDate startOfPlanning = today.minusDays(offsetToSunday);

        for (int i = 0; i < 35; i++) {
            LocalDate targetDate = startOfPlanning.plusDays(i);
            long count;
            if (isChefDept) {
                count = 0;
                for (Departement d : managedDepts) {
                    count += demandeCongeRepository.findApprovedDeptLeavesInRange(d.getIdDept(), targetDate, targetDate).size();
                }
            } else {
                count = demandeCongeRepository.findApprovedTeamLeavesInRange(manager.getIdUser(), targetDate, targetDate).size();
            }
            
            boolean isCritical = totalTeam > 0 && ((double)count / totalTeam) >= threshold;
            int dow = targetDate.getDayOfWeek().getValue();
            boolean isWeekend = (dow == 5 || dow == 6);
            boolean isHolidayOnDate = holidayService.isHoliday(targetDate);

            if (isCritical && !isWeekend && !isHolidayOnDate && !targetDate.isBefore(today) && targetDate.isBefore(today.plusDays(7))) {
                isCurrentlyUnderstaffed = true;
            }

            heatmap.add(Map.of(
                "date", targetDate.toString(),
                "dayLabel", targetDate.getDayOfMonth() + " " + targetDate.getMonth().toString().substring(0, 3),
                "dayName", targetDate.getDayOfWeek().toString().substring(0, 3),
                "absenceCount", count,
                "isWeekend", isWeekend,
                "isHoliday", isHolidayOnDate,
                "isCritical", isCritical
            ));
        }
        data.put("teamCapacityHeatmap", heatmap);
        data.put("isUnderstaffedAlert", isCurrentlyUnderstaffed);
        data.put("upcomingTeamAbsences", leavesToday.stream().map(demandeCongeService::convertToDTO).collect(Collectors.toList()));
        
        return data;
    }

    public Map<String, Object> getHRAdminData() {
        Map<String, Object> data = new HashMap<>();
        long totalHeadcount = utilisateurRepository.count();
        
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);
        long presentToday = pointageRepository.countDistinctPresentByDate(start, end);
        
        boolean isHoliday = holidayService.isHoliday(today);
        int dow = today.getDayOfWeek().getValue();
        boolean isWeekend = (dow == 5 || dow == 6);

        long onLeaveTodayCount = demandeCongeRepository.countGlobalApprovedLeavesOnDate(today);
        double absenteeismRate = 0;
        
        if (!isHoliday && !isWeekend && totalHeadcount > 0) {
            long expectedToWork = totalHeadcount - onLeaveTodayCount;
            if (expectedToWork > 0) {
                long absents = expectedToWork - presentToday;
                if (absents < 0) absents = 0;
                absenteeismRate = ((double) absents / expectedToWork) * 100;
            }
        }
        
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        int urgencyHours = config.getUrgencyDelayHours() > 0 ? config.getUrgencyDelayHours() : 48;

        List<String> hrStatusList = List.of("EN_ATTENTE_RH", "VALIDE_MANAGER");
        long globalPendingCount = requeteRepository.countByStatutCycleVieIn(hrStatusList);
        long globalUrgentCount = requeteRepository.countGlobalUrgentRequests(hrStatusList, LocalDateTime.now().minusHours(urgencyHours));

        data.put("totalHeadcount", totalHeadcount);
        data.put("absenteeismRate", Math.round(absenteeismRate * 10.0) / 10.0);
        data.put("globalPendingCount", globalPendingCount);
        data.put("globalUrgentPendingCount", globalUrgentCount);
        data.put("isHoliday", isHoliday);
        data.put("attendanceAnomaliesCount", presenceService.getAnomalies(today).size());
        
        return data;
    }

    public Map<String, Object> getSuperAdminData() {
        Map<String, Object> data = new HashMap<>();
        data.put("dbStatus", "CONNECTED");
        data.put("serverUptime", startTime.toString());
        data.put("storageUsage", 12.5);
        data.put("recentLogs", auditLogRepository.findTop10ByOrderByTimestampDesc());
        
        Map<String, Long> roleDistribution = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getNomRole() != null)
                .collect(Collectors.groupingBy(u -> u.getRole().getNomRole(), Collectors.counting()));
        data.put("roleDistribution", roleDistribution);
        
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        data.put("systemConfig", config);
        
        return data;
    }

    public Map<String, Object> getCockpitData() {
        Map<String, Object> cockpit = new HashMap<>();
        cockpit.put("pending_activations", utilisateurRepository.countByStatutCompte("INACTIF"));

        List<Utilisateur> activeUsers = utilisateurRepository.findAll().stream()
                .filter(u -> !"INACTIF".equals(u.getStatutCompte()))
                .collect(Collectors.toList());
        
        Map<String, Long> passwordStats = new HashMap<>();
        passwordStats.put("secured", activeUsers.stream().filter(u -> "SÉCURISÉ".equals(u.getPasswordStatus()) || "MODIFIE".equals(u.getPasswordStatus())).count());
        passwordStats.put("temporary", activeUsers.stream().filter(u -> "TEMPORAIRE".equals(u.getPasswordStatus())).count());
        cockpit.put("password_stats", passwordStats);

        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        cockpit.put("failed_logins_24h", auditLogRepository.countByTimestampAfterAndTypeAction(oneDayAgo, "LOGIN_FAILURE"));

        Map<String, String> services = new HashMap<>();
        Optional<EmailConfig> emailConfig = emailConfigRepository.findAll().stream().findFirst();
        services.put("smtp", (emailConfig.isPresent() && emailConfig.get().getSmtpHost() != null) ? "OPERATIONAL" : "DOWN");
        services.put("pdf_generator", "OPERATIONAL");
        services.put("database", "OPERATIONAL");
        services.put("api", "OPERATIONAL");
        cockpit.put("services", services);

        long hoursRunning = java.time.Duration.between(startTime, LocalDateTime.now()).toHours();
        cockpit.put("uptime_percentage", hoursRunning > 0 ? 99.9 : 100.0);
        
        java.io.File root = new java.io.File(".");
        long usedSpace = root.getTotalSpace() - root.getUsableSpace();
        
        Map<String, Object> storage = new HashMap<>();
        storage.put("used_gb", Math.round((double) usedSpace / (1024 * 1024 * 1024) * 10.0) / 10.0);
        storage.put("total_gb", Math.round((double) root.getTotalSpace() / (1024 * 1024 * 1024) * 10.0) / 10.0);
        storage.put("percentage", (int) ((double) usedSpace / root.getTotalSpace() * 100));
        cockpit.put("storage", storage);

        cockpit.put("recent_audit", auditLogRepository.findTop10ByOrderByTimestampDesc().stream()
                .limit(5)
                .map(log -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("timestamp", log.getTimestamp());
                    m.put("role", log.getRole());
                    m.put("action", log.getTypeAction());
                    m.put("target", log.getTargetEntity());
                    return m;
                })
                .collect(Collectors.toList()));

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        Map<String, Long> qrScans = new HashMap<>();
        qrScans.put("valid", auditLogRepository.countByTimestampAfterAndTypeActionAndResult(startOfToday, "SECURITY_SCAN", "SUCCESS"));
        qrScans.put("failed", auditLogRepository.countByTimestampAfterAndTypeActionAndResult(startOfToday, "SECURITY_SCAN", "FAILURE"));
        cockpit.put("qr_scans_today", qrScans);

        return cockpit;
    }

    @org.springframework.transaction.annotation.Transactional
    public void purgeOldLogs(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        auditLogRepository.deleteByTimestampBefore(cutoff);
    }
}
