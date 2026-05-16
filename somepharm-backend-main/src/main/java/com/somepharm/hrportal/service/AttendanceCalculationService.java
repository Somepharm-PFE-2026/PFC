package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.AttendanceReportDTO;
import com.somepharm.hrportal.dto.DailyAttendanceDTO;
import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.Pointage;
import com.somepharm.hrportal.entity.SystemConfig;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DemandeCongeRepository;
import com.somepharm.hrportal.repository.PointageRepository;
import com.somepharm.hrportal.repository.SystemConfigRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceCalculationService {

    private final PointageRepository pointageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeCongeRepository congeRepository;
    private final SystemConfigRepository configRepository;
    private final HolidayService holidayService;

    public AttendanceCalculationService(PointageRepository pointageRepository, 
                                        UtilisateurRepository utilisateurRepository, 
                                        DemandeCongeRepository congeRepository, 
                                        SystemConfigRepository configRepository,
                                        HolidayService holidayService) {
        this.pointageRepository = pointageRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.congeRepository = congeRepository;
        this.configRepository = configRepository;
        this.holidayService = holidayService;
    }

    public AttendanceReportDTO calculateMonthlyReport(String matricule, int year, int month) {
        Utilisateur employe = utilisateurRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        SystemConfig config = configRepository.findAll().stream().findFirst()
                .orElse(new SystemConfig());

        LocalTime theoreticalStart = LocalTime.parse(config.getWorkingHoursStart());
        LocalTime theoreticalEnd = LocalTime.parse(config.getWorkingHoursEnd());
        int tolerance = config.getToleranceMinutes();

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);
        if (endOfMonth.isAfter(LocalDate.now())) {
            endOfMonth = LocalDate.now();
        }

        List<DailyAttendanceDTO> details = new ArrayList<>();
        double totalHours = 0;
        double totalOvertime = 0;
        double totalLateMinutes = 0;
        int daysPresent = 0;
        int daysAbsent = 0;
        int daysOnLeave = 0;

        for (LocalDate date = startOfMonth; !date.isAfter(endOfMonth); date = date.plusDays(1)) {
            DailyAttendanceDTO daily = calculateDaily(employe, date, theoreticalStart, theoreticalEnd, tolerance);
            details.add(daily);
            
            totalHours += daily.getHours();
            totalOvertime += daily.getOvertime();
            totalLateMinutes += daily.getLateMinutes();
            
            if ("ABSENT".equals(daily.getStatus())) daysAbsent++;
            else if ("CONGE".equals(daily.getStatus())) daysOnLeave++;
            else if (!"WEEKEND".equals(daily.getStatus())) daysPresent++;
        }

        AttendanceReportDTO report = new AttendanceReportDTO();
        report.setMatricule(matricule);
        report.setNomComplet(employe.getPrenom() + " " + employe.getNom());
        report.setTotalHours(Math.round(totalHours * 100.0) / 100.0);
        report.setTotalOvertime(Math.round(totalOvertime * 100.0) / 100.0);
        report.setTotalLateMinutes(totalLateMinutes);
        report.setDaysPresent(daysPresent);
        report.setDaysAbsent(daysAbsent);
        report.setDaysOnLeave(daysOnLeave);
        report.setDailyDetails(details);

        return report;
    }

    private DailyAttendanceDTO calculateDaily(Utilisateur employe, LocalDate date, LocalTime thStart, LocalTime thEnd, int tolerance) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);
        
        List<Pointage> logs = pointageRepository.findByEmploye_IdUserAndHorodatageBetween(employe.getIdUser(), dayStart, dayEnd);
        
        DailyAttendanceDTO daily = new DailyAttendanceDTO();
        daily.setDate(date.toString());
        daily.setHours(0);
        daily.setOvertime(0);
        daily.setLateMinutes(0);
        
        List<DemandeConge> conges = congeRepository.findByDemandeur_Matricule(employe.getMatricule());
        boolean onLeave = conges.stream()
                .filter(c -> "APPROUVE".equals(c.getStatutCycleVie()) || "APPROUVÉ".equals(c.getStatutCycleVie()))
                .anyMatch(c -> !date.isBefore(c.getDateDebut()) && !date.isAfter(c.getDateFin()));
        
        boolean isWeekend = (date.getDayOfWeek().getValue() == 5 || date.getDayOfWeek().getValue() == 6);
        boolean isHoliday = holidayService.isHoliday(date);
        
        if (logs.isEmpty()) {
            if (onLeave) {
                daily.setStatus("CONGE");
                double hours = Duration.between(thStart, thEnd).toMinutes() / 60.0;
                daily.setHours(hours);
                daily.setEntry("CONGÉ");
                daily.setExit("CONGÉ");
            } else if (isWeekend) {
                daily.setStatus("WEEKEND");
                daily.setEntry("-");
                daily.setExit("-");
            } else if (isHoliday) {
                daily.setStatus("FERIE");
                double hours = Duration.between(thStart, thEnd).toMinutes() / 60.0;
                daily.setHours(hours);
                daily.setEntry("FÉRIÉ");
                daily.setExit("FÉRIÉ");
            } else {
                daily.setStatus("ABSENT");
                daily.setEntry("MISSING");
                daily.setExit("MISSING");
            }
            return daily;
        }

        Pointage entry = logs.stream().filter(p -> "ENTREE".equals(p.getTypePointage()))
                .min((p1, p2) -> p1.getHorodatage().compareTo(p2.getHorodatage())).orElse(null);
        Pointage exit = logs.stream().filter(p -> "SORTIE".equals(p.getTypePointage()))
                .max((p1, p2) -> p1.getHorodatage().compareTo(p2.getHorodatage())).orElse(null);

        // Fallback : Si l'employé est parti définitivement avec un Bon de Sortie, 
        // la SORTIE_AUTORISEE compte comme son pointage de sortie final.
        if (exit == null) {
            exit = logs.stream().filter(p -> "SORTIE_AUTORISEE".equals(p.getTypePointage()))
                    .max((p1, p2) -> p1.getHorodatage().compareTo(p2.getHorodatage())).orElse(null);
        }

        if (entry != null) {
            daily.setEntry(entry.getHorodatage().toLocalTime().toString().substring(0, 5));
            LocalTime eTime = entry.getHorodatage().toLocalTime();
            if (!isWeekend && !isHoliday && !onLeave && eTime.isAfter(thStart.plusMinutes(tolerance))) {
                daily.setLateMinutes(Duration.between(thStart, eTime).toMinutes());
                daily.setStatus("RETARD");
            } else {
                daily.setStatus("OK");
            }
        } else {
            daily.setEntry("???");
            daily.setStatus("ANOMALIE");
        }

        if (exit != null) {
            daily.setExit(exit.getHorodatage().toLocalTime().toString().substring(0, 5));
            LocalTime exTime = exit.getHorodatage().toLocalTime();
            if (!isWeekend && !isHoliday && !onLeave && exTime.isAfter(thEnd)) {
                daily.setOvertime(Duration.between(thEnd, exTime).toMinutes() / 60.0);
            }
        } else {
            daily.setExit("???");
            daily.setStatus("ANOMALIE");
        }

        if (entry != null && exit != null) {
            double grossHours = Duration.between(entry.getHorodatage(), exit.getHorodatage()).toMinutes() / 60.0;
            // Lunch deduction if worked > 5h
            if (grossHours > 5) grossHours -= 1.0;

            // Déduction de l'absence non rémunérée (Bon de Sortie en milieu de journée)
            Pointage sortieAuth = logs.stream().filter(p -> "SORTIE_AUTORISEE".equals(p.getTypePointage()))
                    .max((p1, p2) -> p1.getHorodatage().compareTo(p2.getHorodatage())).orElse(null);
            Pointage entreeAuth = logs.stream().filter(p -> "ENTREE_AUTORISEE".equals(p.getTypePointage()))
                    .max((p1, p2) -> p1.getHorodatage().compareTo(p2.getHorodatage())).orElse(null);
            
            // On s'assure qu'il est revenu. (S'il n'est pas revenu, la sortieAuth sert déjà d'exit final, donc pas de déduction supplémentaire)
            if (sortieAuth != null && entreeAuth != null && entreeAuth.getHorodatage().isAfter(sortieAuth.getHorodatage())) {
                double absenceHours = Duration.between(sortieAuth.getHorodatage(), entreeAuth.getHorodatage()).toMinutes() / 60.0;
                grossHours -= absenceHours;
            }

            double finalHours = Math.max(0, Math.round(grossHours * 100.0) / 100.0);
            
            if (onLeave) {
                daily.setStatus("ANOMALIE");
                daily.setHours(0);
                daily.setOvertime(0);
            } else if (isWeekend || isHoliday) {
                daily.setStatus("HEURES_SUP");
                daily.setHours(0);
                daily.setOvertime(finalHours); // 100% overtime
            } else {
                daily.setHours(finalHours);
            }
        }

        return daily;
    }
}
