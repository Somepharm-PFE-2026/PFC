package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.dto.DepartementDTO;
import com.somepharm.hrportal.entity.Departement;
import com.somepharm.hrportal.service.DepartementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/departements")
@CrossOrigin(origins = "http://localhost:3000")
public class DepartementController {

    private final DepartementService departementService;

    public DepartementController(DepartementService departementService) {
        this.departementService = departementService;
    }

    // POST: Create a new Department
    @PostMapping
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Departement> createDepartement(@RequestBody Departement departement) {
        Departement savedDept = departementService.createDepartement(departement);
        return new ResponseEntity<>(savedDept, HttpStatus.CREATED);
    }

    // GET: Get all Departments
    @GetMapping
    public ResponseEntity<List<DepartementDTO>> getAllDepartements() {
        return ResponseEntity.ok(departementService.getAllDepartements());
    }

    // PUT: Update a Department (e.g. Assign Manager)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Departement> updateDepartement(
            @PathVariable Long id, 
            @RequestBody Departement updatedDept,
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "false") boolean forceOverwriteAll) {
        return ResponseEntity.ok(departementService.updateDepartement(id, updatedDept, forceOverwriteAll));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteDepartement(@PathVariable Long id) {
        departementService.deleteDepartement(id);
        return ResponseEntity.ok().build();
    }
}