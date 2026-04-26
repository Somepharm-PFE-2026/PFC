package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.BonDeSortie;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.entity.AuditLog;
import com.somepharm.hrportal.dto.ScanResultDTO;
import com.somepharm.hrportal.repository.BonDeSortieRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.BonDeSortieService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sorties")
@CrossOrigin(origins = "http://localhost:3000")
public class BonDeSortieController {

    private final BonDeSortieService bonDeSortieService;
    private final BonDeSortieRepository bonDeSortieRepository;
    private final UtilisateurRepository utilisateurRepository;

    public BonDeSortieController(BonDeSortieService bonDeSortieService, BonDeSortieRepository bonDeSortieRepository,
            UtilisateurRepository utilisateurRepository) {
        this.bonDeSortieService = bonDeSortieService;
        this.bonDeSortieRepository = bonDeSortieRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    // 1. Pour l'employé : Demander un bon de sortie
    @PostMapping("/demander")
    public ResponseEntity<BonDeSortie> demanderSortie(@RequestParam int dureeEstimeeHeures) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur demandeur = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        BonDeSortie bon = new BonDeSortie();
        bon.setDemandeur(demandeur);
        bon.setDureeEstimeeHeures(dureeEstimeeHeures);

        return ResponseEntity.ok(bonDeSortieRepository.save(bon));
    }

    // 2. Pour l'employé : Voir ses propres bons de sortie
    @GetMapping("/mes-sorties")
    public ResponseEntity<List<BonDeSortie>> getMesSorties() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur demandeur = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        List<BonDeSortie> mesSorties = bonDeSortieRepository.findAll().stream()
                .filter(b -> b.getDemandeur().getIdUser().equals(demandeur.getIdUser()))
                .toList();

        return ResponseEntity.ok(mesSorties);
    }

    // 3. Pour l'Agent de Sécurité : Scanner le QR Code
    @PostMapping("/scan/{tokenQr}")
    public ResponseEntity<ScanResultDTO> scannerSortie(@PathVariable String tokenQr) {
        try {
            ScanResultDTO resultat = bonDeSortieService.scannerQrCode(tokenQr);
            return ResponseEntity.ok(resultat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ScanResultDTO.builder()
                    .status("ERROR")
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/scan-history")
    public ResponseEntity<List<AuditLog>> getScanHistory(Authentication auth) {
        return ResponseEntity.ok(bonDeSortieService.getSecurityHistory(auth.getName()));
    }
}