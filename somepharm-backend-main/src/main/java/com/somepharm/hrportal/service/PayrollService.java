package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.BulletinPaie;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.BulletinPaieRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PayrollService {

    private final BulletinPaieRepository bulletinRepository;
    private final UtilisateurRepository utilisateurRepository;

    public PayrollService(BulletinPaieRepository bulletinRepository, UtilisateurRepository utilisateurRepository) {
        this.bulletinRepository = bulletinRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    public int importCSV(MultipartFile file, int mois, int annee) {
        int count = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (firstLine) { firstLine = false; continue; }
                
                String[] data = line.split(",");
                if (data.length < 8) continue;
                
                String matricule = data[0].trim();
                Utilisateur user = utilisateurRepository.findByMatricule(matricule).orElse(null);
                if (user == null) continue;
                
                BulletinPaie bp = bulletinRepository.findByEmployeAndMoisAndAnnee(user, mois, annee)
                        .orElse(new BulletinPaie());
                
                bp.setEmploye(user);
                bp.setMois(mois);
                bp.setAnnee(annee);
                bp.setSalaireBase(Double.parseDouble(data[1].trim()));
                bp.setIep(Double.parseDouble(data[2].trim()));
                bp.setPrimePanier(Double.parseDouble(data[3].trim()));
                bp.setPrimeTransport(Double.parseDouble(data[4].trim()));
                bp.setAutresPrimes(Double.parseDouble(data[5].trim()));
                bp.setRetenueCNAS(Double.parseDouble(data[6].trim()));
                bp.setIrg(Double.parseDouble(data[7].trim()));
                
                bulletinRepository.save(bp);
                count++;
            }
            return count;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'importation du CSV: " + e.getMessage());
        }
    }

    public void publish(int mois, int annee) {
        List<BulletinPaie> bulletins = bulletinRepository.findAll().stream()
                .filter(b -> b.getMois() == mois && b.getAnnee() == annee)
                .toList();
        
        for (BulletinPaie b : bulletins) {
            b.setDatePublication(LocalDateTime.now());
            bulletinRepository.save(b);
        }
    }

    public List<BulletinPaie> getAll() {
        return bulletinRepository.findAll();
    }

    public BulletinPaie getOrCreateBulletin(Utilisateur employe, int mois, int annee) {
        return bulletinRepository.findByEmployeAndMoisAndAnnee(employe, mois, annee)
                .orElseGet(() -> {
                    BulletinPaie bp = new BulletinPaie();
                    bp.setEmploye(employe);
                    bp.setMois(mois);
                    bp.setAnnee(annee);
                    bp.setSalaireBase(employe.getSoldeConges() > 0 ? 45000.0 : 0); // Placeholder
                    return bulletinRepository.save(bp);
                });
    }
}
