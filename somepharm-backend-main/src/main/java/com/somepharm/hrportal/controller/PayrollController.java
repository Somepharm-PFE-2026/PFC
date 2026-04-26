package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.BulletinPaie;
import com.somepharm.hrportal.service.PayrollService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "http://localhost:3000")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<BulletinPaie>> getAllBulletins() {
        return ResponseEntity.ok(payrollService.getAll());
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<String> importCSV(
            @RequestParam("file") MultipartFile file,
            @RequestParam int mois,
            @RequestParam int annee) {
        int count = payrollService.importCSV(file, mois, annee);
        return ResponseEntity.ok(count + " bulletins importés avec succès.");
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<String> publish(@RequestParam int mois, @RequestParam int annee) {
        payrollService.publish(mois, annee);
        return ResponseEntity.ok("Bulletins publiés avec succès pour " + mois + "/" + annee);
    }
}
