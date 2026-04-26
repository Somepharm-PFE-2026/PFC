package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Pointage;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.PointageRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import com.somepharm.hrportal.dto.PointageStatusDTO;
import java.util.List;
import java.util.Comparator;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pointage")
@CrossOrigin(origins = "http://localhost:3000")
public class PointageController {

    private final PointageRepository pointageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final com.somepharm.hrportal.repository.SystemConfigRepository systemConfigRepository;

    public PointageController(PointageRepository pointageRepository, 
                             UtilisateurRepository utilisateurRepository,
                             com.somepharm.hrportal.repository.SystemConfigRepository systemConfigRepository) {
        this.pointageRepository = pointageRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.systemConfigRepository = systemConfigRepository;
    }

    // 1. Endpoint pour pointer (Entrée ou Sortie)
    @PostMapping("/action")
    public ResponseEntity<?> pointer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur employe = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime debutJour = LocalDate.now().atStartOfDay();
        LocalDateTime finJour = LocalDate.now().atTime(LocalTime.MAX);

        // Trouver le dernier pointage de la journée
        Optional<Pointage> dernierPointage = pointageRepository.findTopByEmploye_MatriculeAndHorodatageBetweenOrderByHorodatageDesc(
                employe.getMatricule(), debutJour, finJour);

        if (dernierPointage.isEmpty() || "SORTIE".equals(dernierPointage.get().getTypePointage())) {
            // ---> SCÉNARIO 1 : L'employé arrive (ou revient d'une pause)
            Pointage nouveau = new Pointage();
            nouveau.setEmploye(employe);
            nouveau.setHorodatage(maintenant);
            nouveau.setTypePointage("ENTREE");
            nouveau.setMethode("WEB");

            com.somepharm.hrportal.entity.SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new com.somepharm.hrportal.entity.SystemConfig());
            LocalTime standardStart = LocalTime.parse(config.getWorkingHoursStart());
            LocalTime limitWithTolerance = standardStart.plusMinutes(config.getToleranceMinutes());

            if (dernierPointage.isEmpty() && maintenant.toLocalTime().isAfter(limitWithTolerance)) {
                nouveau.setStatut("RETARD");
            } else {
                nouveau.setStatut("OK");
            }
            return ResponseEntity.ok(pointageRepository.save(nouveau));

        } else {
            // ---> SCÉNARIO 2 : L'employé part
            Pointage nouveau = new Pointage();
            nouveau.setEmploye(employe);
            nouveau.setHorodatage(maintenant);
            nouveau.setTypePointage("SORTIE");
            nouveau.setMethode("WEB");
            nouveau.setStatut("OK");
            
            return ResponseEntity.ok(pointageRepository.save(nouveau));
        }
    }

    // 2. Endpoint pour savoir si le prochain bouton est "Entrée" ou "Sortie"
    @GetMapping("/statut-jour")
    public ResponseEntity<PointageStatusDTO> getStatutAujourdhui() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        LocalDateTime debutJour = LocalDate.now().atStartOfDay();
        LocalDateTime finJour = LocalDate.now().atTime(LocalTime.MAX);

        List<Pointage> logs = pointageRepository.findByHorodatageBetween(debutJour, finJour).stream()
                .filter(p -> p.getEmploye().getMatricule().equals(auth.getName()))
                .sorted(Comparator.comparing(Pointage::getHorodatage))
                .collect(Collectors.toList());

        if (logs.isEmpty()) {
            return ResponseEntity.ok().build();
        }

        PointageStatusDTO dto = new PointageStatusDTO();
        Pointage latest = logs.get(logs.size() - 1);
        dto.setTypePointage(latest.getTypePointage());
        dto.setStatut(latest.getStatut());

        Optional<Pointage> entree = logs.stream().filter(p -> "ENTREE".equals(p.getTypePointage())).findFirst();
        Optional<Pointage> sortie = logs.stream().filter(p -> "SORTIE".equals(p.getTypePointage())).findAny();

        entree.ifPresent(p -> dto.setHeureEntree(p.getHorodatage().toLocalTime().toString()));
        sortie.ifPresent(p -> dto.setHeureSortie(p.getHorodatage().toLocalTime().toString()));

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/search")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<Pointage>> search(
            @RequestParam(required = false) String matricule,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        if (matricule != null && !matricule.isEmpty()) {
            Optional<Utilisateur> user = utilisateurRepository.findByMatricule(matricule);
            if (user.isPresent()) {
                return ResponseEntity.ok(pointageRepository.findByEmploye_IdUserAndHorodatageBetween(user.get().getIdUser(), start, end));
            }
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(pointageRepository.findByHorodatageBetween(start, end));
    }
}