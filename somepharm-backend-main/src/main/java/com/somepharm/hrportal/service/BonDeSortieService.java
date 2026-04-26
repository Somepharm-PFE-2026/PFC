package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.BonDeSortie;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.entity.Pointage;
import com.somepharm.hrportal.entity.AuditLog;
import com.somepharm.hrportal.entity.SystemConfig;
import com.somepharm.hrportal.dto.ScanResultDTO;
import com.somepharm.hrportal.repository.BonDeSortieRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.repository.PointageRepository;
import com.somepharm.hrportal.repository.AuditLogRepository;
import com.somepharm.hrportal.repository.SystemConfigRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BonDeSortieService {

    private final BonDeSortieRepository bonDeSortieRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PointageRepository pointageRepository;
    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;
    private final SystemConfigRepository systemConfigRepository;

    public BonDeSortieService(BonDeSortieRepository bonDeSortieRepository, 
                            UtilisateurRepository utilisateurRepository, 
                            PointageRepository pointageRepository, 
                            AuditService auditService, 
                            AuditLogRepository auditLogRepository, 
                            SystemConfigRepository systemConfigRepository) {
        this.bonDeSortieRepository = bonDeSortieRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.pointageRepository = pointageRepository;
        this.auditService = auditService;
        this.auditLogRepository = auditLogRepository;
        this.systemConfigRepository = systemConfigRepository;
    }

    @Transactional
    public ScanResultDTO scannerQrCode(String tokenQr) {
        BonDeSortie bds = bonDeSortieRepository.findByTokenQr(tokenQr)
                .orElseGet(() -> {
                    String author = SecurityContextHolder.getContext().getAuthentication().getName();
                    auditService.logFailure("SECURITY_SCAN", "SCAN QR INVALIDE: " + tokenQr, author, "SECURITY_AGENT", "EXIT_PERMIT");
                    throw new RuntimeException("QR Code Invalide ou introuvable.");
                });

        Utilisateur demandeur = bds.getDemandeur();
        ScanResultDTO.ScanResultDTOBuilder resultBuilder = ScanResultDTO.builder()
                .matricule(demandeur.getMatricule())
                .nomComplet(demandeur.getNom() + " " + demandeur.getPrenom())
                .departement(demandeur.getDepartement())
                .motif(bds.getMotif())
                .periodeDemandee(bds.getHeureDebutAutorisee() + " - " + bds.getHeureFinAutorisee())
                .dateDemande(bds.getHeureSortieEstimee() != null ? bds.getHeureSortieEstimee().toLocalDate().toString() : LocalDateTime.now().toLocalDate().toString())
                .heureScan(LocalDateTime.now().toLocalTime().toString().substring(0, 5));

        String scannerMatricule = SecurityContextHolder.getContext().getAuthentication().getName();

        if ("EN_ATTENTE".equals(bds.getStatut())) {
            // SCÉNARIO 1 : L'employé sort
            bds.setHeureSortieReelle(LocalDateTime.now());
            
            // Check if this is a "No Return" exit (end of day)
            String workEnd = systemConfigRepository.findAll().stream().findFirst().map(SystemConfig::getWorkingHoursEnd).orElse("17:00");
            boolean isDefinitiveExit = isAfterOrEqual(bds.getHeureFinAutorisee(), workEnd);

            if (isDefinitiveExit) {
                bds.setStatut("CLOTURE");
                // Simulate return at the end of the work day for deduction
                LocalTime endWorkTime = LocalTime.parse(workEnd);
                bds.setHeureRetourReelle(bds.getHeureSortieReelle().with(endWorkTime));
                calculerEtDeduireHeures(bds);
                bonDeSortieRepository.save(bds);

                recordPointage(demandeur, "SORTIE_AUTORISEE");
                auditService.logAction("SECURITY_SCAN", "SORTIE DÉFINITIVE pour " + demandeur.getMatricule() + " (Bon #" + bds.getId() + ")", scannerMatricule);

                return resultBuilder
                        .status("SUCCESS")
                        .typeScan("SORTIE")
                        .message("SORTIE DÉFINITIVE - Pas de retour attendu.")
                        .build();
            }

            bds.setStatut("EN_COURS");
            bonDeSortieRepository.save(bds);
            
            recordPointage(demandeur, "SORTIE_AUTORISEE");
            auditService.logSuccess("SECURITY_SCAN", "SORTIE autorisée pour " + demandeur.getMatricule() + " (Bon #" + bds.getId() + ")", scannerMatricule, "SECURITY_AGENT", "EXIT_PERMIT");

            return resultBuilder
                    .status("SUCCESS")
                    .typeScan("SORTIE")
                    .message("SORTIE AUTORISÉE - Bon voyage !")
                    .build();

        } else if ("EN_COURS".equals(bds.getStatut())) {
            // SCÉNARIO 2 : L'employé revient
            bds.setHeureRetourReelle(LocalDateTime.now());
            bds.setStatut("CLOTURE");
            calculerEtDeduireHeures(bds);
            bonDeSortieRepository.save(bds);

            // Record Pointage for HR
            recordPointage(demandeur, "ENTREE_AUTORISEE");

            auditService.logSuccess("SECURITY_SCAN", "RETOUR enregistré pour " + demandeur.getMatricule() + " (Bon #" + bds.getId() + ")", scannerMatricule, "SECURITY_AGENT", "EXIT_PERMIT");

            return resultBuilder
                    .status("SUCCESS")
                    .typeScan("ENTREE")
                    .message("RETOUR ENREGISTRÉ - Bon retour au poste.")
                    .build();
        }

        auditService.logFailure("SECURITY_SCAN", "BON DÉJÀ UTILISÉ pour " + demandeur.getMatricule(), scannerMatricule, "SECURITY_AGENT", "EXIT_PERMIT");
        return resultBuilder
                .status("ALREADY_USED")
                .message("Ce bon de sortie est déjà clôturé.")
                .build();
    }

    private void recordPointage(Utilisateur employe, String type) {
        Pointage p = new Pointage();
        p.setEmploye(employe);
        p.setHorodatage(LocalDateTime.now());
        p.setTypePointage(type);
        p.setMethode("SCANNER_SECURITE");
        p.setStatut("OK");
        pointageRepository.save(p);
    }

    private void calculerEtDeduireHeures(BonDeSortie bds) {
        LocalDateTime sortie = bds.getHeureSortieReelle();
        LocalDateTime retour = bds.getHeureRetourReelle();

        if (retour == null) {
            retour = sortie.withHour(16).withMinute(0).withSecond(0);
            bds.setHeureRetourReelle(retour);
        }

        long minutesAbsence = ChronoUnit.MINUTES.between(sortie, retour);
        if (minutesAbsence < 0) minutesAbsence = 0;

        double heuresAbsence = minutesAbsence / 60.0;
        double joursADeduire = heuresAbsence / 8.0;

        Utilisateur demandeur = bds.getDemandeur();
        demandeur.setSoldeConges(demandeur.getSoldeConges() - joursADeduire);
        utilisateurRepository.save(demandeur);
    }

    public List<AuditLog> getSecurityHistory(String matricule) {
        return auditLogRepository.findByAuteurOrderByTimestampDesc(matricule).stream()
                .filter(log -> "SECURITY_SCAN".equals(log.getTypeAction()))
                .limit(20)
                .toList();
    }

    private boolean isAfterOrEqual(String h1, String h2) {
        if (h1 == null || h2 == null) return false;
        try {
            return LocalTime.parse(h1).isAfter(LocalTime.parse(h2)) || 
                   LocalTime.parse(h1).equals(LocalTime.parse(h2));
        } catch (Exception e) { return false; }
    }

    @Scheduled(cron = "0 30 16 * * *")
    @Transactional
    public void cloturerSortiesNonRetournees() {
        List<BonDeSortie> sortiesEnCours = bonDeSortieRepository.findByStatut("EN_COURS");
        for (BonDeSortie bds : sortiesEnCours) {
            bds.setStatut("CLOTURE");
            calculerEtDeduireHeures(bds);
            bonDeSortieRepository.save(bds);
        }
    }
}