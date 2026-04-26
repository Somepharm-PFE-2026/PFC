package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "http://localhost:3000")
public class ConfigController {

    private final SystemConfigRepository systemConfigRepository;
    private final TypeCongeRepository typeCongeRepository;
    private final JourFerieRepository jourFerieRepository;
    private final DocumentTemplateRepository templateRepository;
    private final PosteRepository posteRepository;
    private final SiteRepository siteRepository;
    private final com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository;

    public ConfigController(SystemConfigRepository systemConfigRepository,
                            TypeCongeRepository typeCongeRepository,
                            JourFerieRepository jourFerieRepository,
                            DocumentTemplateRepository templateRepository,
                            PosteRepository posteRepository,
                            SiteRepository siteRepository,
                            com.somepharm.hrportal.repository.UtilisateurRepository utilisateurRepository) {
        this.systemConfigRepository = systemConfigRepository;
        this.typeCongeRepository = typeCongeRepository;
        this.jourFerieRepository = jourFerieRepository;
        this.templateRepository = templateRepository;
        this.posteRepository = posteRepository;
        this.siteRepository = siteRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @GetMapping("/system")
    public ResponseEntity<SystemConfig> getSystemConfig() {
        return ResponseEntity.ok(systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig()));
    }

    @PostMapping("/system")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<SystemConfig> updateSystemConfig(@RequestBody SystemConfig config) {
        return ResponseEntity.ok(systemConfigRepository.save(config));
    }

    @GetMapping("/leave-types")
    public ResponseEntity<List<TypeConge>> getLeaveTypes() {
        return ResponseEntity.ok(typeCongeRepository.findAll());
    }

    @PostMapping("/leave-types")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<TypeConge> saveLeaveType(@RequestBody TypeConge type) {
        return ResponseEntity.ok(typeCongeRepository.save(type));
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<JourFerie>> getHolidays() {
        return ResponseEntity.ok(jourFerieRepository.findAll());
    }

    @PostMapping("/holidays")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<JourFerie> saveHoliday(@RequestBody JourFerie ferie) {
        return ResponseEntity.ok(jourFerieRepository.save(ferie));
    }

    @PostMapping("/holidays/import")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<List<JourFerie>> importNationalHolidays() {
        int year = java.time.LocalDate.now().getYear();
        List<JourFerie> nationalHolidays = List.of(
            new JourFerie("Jour de l'An", java.time.LocalDate.of(year, 1, 1)),
            new JourFerie("Yennayer (Nouvel An Berbère)", java.time.LocalDate.of(year, 1, 12)),
            new JourFerie("Fête du Travail", java.time.LocalDate.of(year, 5, 1)),
            new JourFerie("Fête de l'Indépendance", java.time.LocalDate.of(year, 7, 5)),
            new JourFerie("Déclenchement de la Révolution", java.time.LocalDate.of(year, 11, 1)),
            new JourFerie("Aïd el-Fitr", java.time.LocalDate.of(year, 3, 30)), // Mock mobile dates
            new JourFerie("Aïd el-Adha", java.time.LocalDate.of(year, 6, 6))
        );

        for (JourFerie h : nationalHolidays) {
            if (jourFerieRepository.findAll().stream().noneMatch(existing -> existing.getNom().equals(h.getNom()) && existing.getDate().getYear() == year)) {
                jourFerieRepository.save(h);
            }
        }
        return ResponseEntity.ok(jourFerieRepository.findAll());
    }

    @GetMapping("/templates")
    public ResponseEntity<List<DocumentTemplate>> getTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    // --- POSTE MANAGEMENT ---

    @GetMapping("/postes")
    public ResponseEntity<List<Poste>> getAllPostes() {
        return ResponseEntity.ok(posteRepository.findAll());
    }

    @PostMapping("/postes")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<Poste> savePoste(@RequestBody Poste poste) {
        return ResponseEntity.ok(posteRepository.save(poste));
    }

    @DeleteMapping("/postes/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<?> deletePoste(@PathVariable Long id) {
        Poste poste = posteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Poste introuvable"));
        
        long count = utilisateurRepository.countByPoste(poste.getTitre());
        if (count > 0) {
            return ResponseEntity.badRequest()
                    .body("Action impossible : " + count + " employés occupent actuellement ce poste. Veuillez réassigner ces collaborateurs avant de supprimer l'intitulé.");
        }
        
        posteRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- SITE MANAGEMENT ---

    @GetMapping("/sites")
    public ResponseEntity<List<Site>> getAllSites() {
        return ResponseEntity.ok(siteRepository.findAll());
    }

    @PostMapping("/sites")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<Site> saveSite(@RequestBody Site site) {
        return ResponseEntity.ok(siteRepository.save(site));
    }

    @DeleteMapping("/sites/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<Void> deleteSite(@PathVariable Long id) {
        siteRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- SIGNATURE & STAMP UPLOADS ---
    private final String uploadDir = "uploads/config/";

    @PostMapping("/system/signature")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<SystemConfig> uploadSignature(@RequestParam("file") MultipartFile file) throws IOException {
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        Files.createDirectories(Paths.get(uploadDir));
        
        String fileName = "signature_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(uploadDir).resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        config.setDrhSignatureUrl(fileName);
        return ResponseEntity.ok(systemConfigRepository.save(config));
    }

    @PostMapping("/system/stamp")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN', 'RH_ADMIN')")
    public ResponseEntity<SystemConfig> uploadStamp(@RequestParam("file") MultipartFile file) throws IOException {
        SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(new SystemConfig());
        Files.createDirectories(Paths.get(uploadDir));
        
        String fileName = "stamp_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(uploadDir).resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        config.setCachetEntrepriseUrl(fileName);
        return ResponseEntity.ok(systemConfigRepository.save(config));
    }
}
