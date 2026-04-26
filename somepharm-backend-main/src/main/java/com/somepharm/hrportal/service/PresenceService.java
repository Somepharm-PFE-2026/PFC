package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.Pointage;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.PointageRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    private final PointageRepository pointageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final com.somepharm.hrportal.repository.JourFerieRepository jourFerieRepository;
    private final com.somepharm.hrportal.repository.SystemConfigRepository systemConfigRepository;
    private final NotificationService notificationService;

    public PresenceService(PointageRepository pointageRepository, 
                           UtilisateurRepository utilisateurRepository, 
                           NotificationService notificationService,
                           com.somepharm.hrportal.repository.JourFerieRepository jourFerieRepository,
                           com.somepharm.hrportal.repository.SystemConfigRepository systemConfigRepository) {
        this.pointageRepository = pointageRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.notificationService = notificationService;
        this.jourFerieRepository = jourFerieRepository;
        this.systemConfigRepository = systemConfigRepository;
    }

    /**
     * 📊 Live Monitoring Stats for Today
     */
    public Map<String, Object> getLiveStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        boolean isHoliday = jourFerieRepository.findAll().stream()
                .anyMatch(h -> h.getDate().equals(today));

        List<Pointage> todayPointages = pointageRepository.findByHorodatageBetween(startOfDay, endOfDay);
        long totalEmployees = utilisateurRepository.count();
        
        Map<Long, Pointage> latestByEmployee = todayPointages.stream()
                .collect(Collectors.toMap(
                        p -> p.getEmploye().getIdUser(),
                        p -> p,
                        (p1, p2) -> p1.getHorodatage().isAfter(p2.getHorodatage()) ? p1 : p2
                ));

        long presentCount = latestByEmployee.values().stream()
                .filter(p -> "ENTREE".equals(p.getTypePointage()))
                .count();
        
        long lateCount = todayPointages.stream()
                .filter(p -> "RETARD".equals(p.getStatut()))
                .map(p -> p.getEmploye().getIdUser())
                .distinct()
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("presentCount", presentCount);
        stats.put("absentCount", isHoliday ? 0 : totalEmployees - presentCount);
        stats.put("lateCount", lateCount);
        stats.put("isHoliday", isHoliday);
        stats.put("todayLogs", todayPointages);

        return stats;
    }

    /**
     * ⚠️ Anomaly Detection (Missing Punches)
     */
    public List<Map<String, Object>> getAnomalies(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        
        List<Pointage> pointages = pointageRepository.findByHorodatageBetween(start, end);
        
        // Group by employee
        return pointages.stream()
                .collect(Collectors.groupingBy(p -> p.getEmploye()))
                .entrySet().stream()
                .filter(entry -> {
                    List<Pointage> empLogs = entry.getValue();
                    long entries = empLogs.stream().filter(p -> "ENTREE".equals(p.getTypePointage())).count();
                    long exits = empLogs.stream().filter(p -> "SORTIE".equals(p.getTypePointage())).count();
                    return entries != exits;
                })
                .map(entry -> {
                    Map<String, Object> anomaly = new HashMap<>();
                    anomaly.put("employe", entry.getKey());
                    anomaly.put("logs", entry.getValue());
                    anomaly.put("date", date);
                    anomaly.put("type", "SORTIE_MANQUANTE");
                    return anomaly;
                })
                .collect(Collectors.toList());
    }

    /**
     * 🔔 Nudge System: Send reminders to all employees with anomalies for a date
     */
    public void nudgeAnomalies(LocalDate date) {
        List<Map<String, Object>> anomalies = getAnomalies(date);
        for (Map<String, Object> anomaly : anomalies) {
            Utilisateur emp = (Utilisateur) anomaly.get("employe");
            String message = "⚠️ Anomalie de pointage détectée le " + date + ". Veuillez régulariser votre sortie sur votre portail.";
            notificationService.createNotification(emp.getIdUser(), message);
        }
    }

    /**
     * ✍️ Forced Modification (HR direct action)
     */
    public Pointage forceRegularize(Long pointageId, LocalDateTime newTime, String hrMatricule, String reason) {
        Pointage pointage = pointageRepository.findById(pointageId)
                .orElseThrow(() -> new RuntimeException("Pointage non trouvé"));
        
        pointage.setHorodatage(newTime);
        pointage.setModifiedManually(true);
        pointage.setModifiedBy(hrMatricule);
        pointage.setModificationReason(reason);
        pointage.setDateModification(LocalDateTime.now());
        pointage.setStatut("REGULARISE");
        
        return pointageRepository.save(pointage);
    }

    public Pointage addManualPointage(Long idUser, LocalDateTime time, String type, String hrMatricule, String reason) {
        Utilisateur employe = utilisateurRepository.findById(idUser)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Pointage p = new Pointage();
        p.setEmploye(employe);
        p.setHorodatage(time);
        p.setTypePointage(type);
        p.setMethode("ADMIN_MANUAL");
        p.setStatut("REGULARISE");
        p.setModifiedManually(true);
        p.setModifiedBy(hrMatricule);
        p.setModificationReason(reason);
        p.setDateModification(LocalDateTime.now());

        return pointageRepository.save(p);
    }

    public Pointage savePointage(Pointage pointage) {
        return pointageRepository.save(pointage);
    }
}
