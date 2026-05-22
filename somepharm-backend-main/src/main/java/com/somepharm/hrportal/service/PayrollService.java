package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.AttendanceReportDTO;
import com.somepharm.hrportal.dto.DailyAttendanceDTO;
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
    private final AttendanceCalculationService attendanceService;

    public PayrollService(BulletinPaieRepository bulletinRepository, 
                          UtilisateurRepository utilisateurRepository,
                          AttendanceCalculationService attendanceService) {
        this.bulletinRepository = bulletinRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.attendanceService = attendanceService;
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
                
                recalculateDeductionsIfNecessary(bp);
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
        List<BulletinPaie> list = bulletinRepository.findAll();
        for (BulletinPaie bp : list) {
            if (recalculateDeductionsIfNecessary(bp)) {
                bulletinRepository.save(bp);
            }
        }
        return list;
    }

    public BulletinPaie getOrCreateBulletin(Utilisateur employe, int mois, int annee) {
        BulletinPaie bp = bulletinRepository.findByEmployeAndMoisAndAnnee(employe, mois, annee)
                .orElseGet(() -> {
                    BulletinPaie newBp = new BulletinPaie();
                    newBp.setEmploye(employe);
                    newBp.setMois(mois);
                    newBp.setAnnee(annee);
                    newBp.setSalaireBase(employe.getSoldeConges() > 0 ? 45000.0 : 0); // Placeholder
                    return bulletinRepository.save(newBp);
                });
        if (recalculateDeductionsIfNecessary(bp)) {
            bp = bulletinRepository.save(bp);
        }
        return bp;
    }

    public boolean recalculateDeductionsIfNecessary(BulletinPaie bp) {
        if (bp.getEmploye() == null) return false;
        
        // Skip if no pointages at all for this employee in the month
        AttendanceReportDTO report;
        try {
            report = attendanceService.calculateMonthlyReport(bp.getEmploye().getMatricule(), bp.getAnnee(), bp.getMois());
        } catch (Exception e) {
            return false;
        }
        
        if (report == null || report.getDaysPresent() == 0) {
            // For employees with no pointages (like HR/Managers), make sure they have a baseline CNAS/IRG if they are 0
            if (bp.getRetenueCNAS() == 0 && bp.getIrg() == 0 && bp.getSalaireBase() > 0) {
                double gross = bp.getSalaireBase() + bp.getIep() + bp.getPrimePanier() + bp.getPrimeTransport() + bp.getAutresPrimes();
                bp.setRetenueCNAS(Math.round((gross * 0.09) * 100.0) / 100.0);
                bp.setIrg(Math.round(((gross - bp.getRetenueCNAS()) * 0.10) * 100.0) / 100.0);
                bp.calculateTotals();
                return true;
            }
            return false;
        }

        // Calculate under-hours only for days with significant absence (worked < 7.0 hours)
        double underHours = 0;
        if (report.getDailyDetails() != null) {
            for (DailyAttendanceDTO daily : report.getDailyDetails()) {
                if ("OK".equals(daily.getStatus()) || "RETARD".equals(daily.getStatus()) || "ANOMALIE".equals(daily.getStatus())) {
                    double worked = daily.getHours();
                    if (worked > 0 && worked < 7.0) {
                        underHours += (8.0 - worked);
                    }
                }
            }
        }

        // Round underHours to 2 decimal places
        underHours = Math.round(underHours * 100.0) / 100.0;

        // If there are no under-hours, make sure we calculate baseline CNAS/IRG if they are 0
        if (underHours <= 0) {
            if (bp.getRetenueCNAS() == 0 && bp.getIrg() == 0 && bp.getSalaireBase() > 0) {
                double gross = bp.getSalaireBase() + bp.getIep() + bp.getPrimePanier() + bp.getPrimeTransport() + bp.getAutresPrimes();
                bp.setRetenueCNAS(Math.round((gross * 0.09) * 100.0) / 100.0);
                bp.setIrg(Math.round(((gross - bp.getRetenueCNAS()) * 0.10) * 100.0) / 100.0);
                bp.calculateTotals();
                return true;
            }
            return false;
        }

        // Calculate deduction based on Algeria standard monthly working hours (173.33 hours)
        double hourlyRate = bp.getSalaireBase() / 173.33;
        double deduction = Math.round((underHours * hourlyRate) * 100.0) / 100.0;

        double originalAutresPrimes = bp.getAutresPrimes() < 0 ? 0 : bp.getAutresPrimes();
        double targetAutresPrimes = originalAutresPrimes - deduction;

        // If the current value is already correct, do nothing
        if (bp.getAutresPrimes() == targetAutresPrimes && bp.getRetenueCNAS() > 0 && bp.getIrg() > 0) {
            return false;
        }

        // Calculate original baseline gross (before this deduction)
        double originalGross = bp.getSalaireBase() + bp.getIep() + bp.getPrimePanier() + bp.getPrimeTransport() + originalAutresPrimes;
        double originalCnas = bp.getRetenueCNAS() > 0 ? bp.getRetenueCNAS() : Math.round((originalGross * 0.09) * 100.0) / 100.0;
        double originalIrg = bp.getIrg() > 0 ? bp.getIrg() : Math.round(((originalGross - originalCnas) * 0.10) * 100.0) / 100.0;

        bp.setAutresPrimes(targetAutresPrimes);
        
        // Calculate new gross
        double newGross = bp.getSalaireBase() + bp.getIep() + bp.getPrimePanier() + bp.getPrimeTransport() + targetAutresPrimes;
        double newCnas = Math.round((newGross * 0.09) * 100.0) / 100.0;
        
        // Proportional IRG tax adjustment
        double originalTaxable = originalGross - originalCnas;
        double newTaxable = newGross - newCnas;
        double newIrg;
        if (originalTaxable > 0) {
            newIrg = Math.round((originalIrg * newTaxable / originalTaxable) * 100.0) / 100.0;
        } else {
            newIrg = Math.round((newTaxable * 0.10) * 100.0) / 100.0;
        }
        newIrg = Math.max(0, newIrg);

        bp.setRetenueCNAS(newCnas);
        bp.setIrg(newIrg);
        bp.calculateTotals();
        
        return true;
    }
}
