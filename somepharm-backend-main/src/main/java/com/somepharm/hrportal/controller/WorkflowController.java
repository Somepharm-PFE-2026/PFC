package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow")
@CrossOrigin(origins = "http://localhost:3000")
public class WorkflowController {

    private final WorkflowCircuitRepository circuitRepository;
    private final WorkflowEtapeRepository etapeRepository;
    private final WorkflowMappingRepository mappingRepository;
    private final WorkflowBypassRuleRepository bypassRuleRepository;
    private final WorkflowDelegationRepository delegationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public WorkflowController(WorkflowCircuitRepository circuitRepository,
                              WorkflowEtapeRepository etapeRepository,
                              WorkflowMappingRepository mappingRepository,
                              WorkflowBypassRuleRepository bypassRuleRepository,
                              WorkflowDelegationRepository delegationRepository,
                              UtilisateurRepository utilisateurRepository) {
        this.circuitRepository = circuitRepository;
        this.etapeRepository = etapeRepository;
        this.mappingRepository = mappingRepository;
        this.bypassRuleRepository = bypassRuleRepository;
        this.delegationRepository = delegationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    // ===================== CIRCUITS =====================

    @GetMapping("/circuits")
    public ResponseEntity<List<WorkflowCircuit>> getAllCircuits() {
        return ResponseEntity.ok(circuitRepository.findAll());
    }

    @PostMapping("/circuits")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowCircuit> createCircuit(@RequestBody WorkflowCircuit circuit) {
        return ResponseEntity.ok(circuitRepository.save(circuit));
    }

    @DeleteMapping("/circuits/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteCircuit(@PathVariable Long id) {
        circuitRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===================== ÉTAPES =====================

    @GetMapping("/circuits/{id}/etapes")
    public ResponseEntity<List<WorkflowEtape>> getEtapes(@PathVariable Long id) {
        return ResponseEntity.ok(etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(id));
    }

    @PostMapping("/circuits/{id}/etapes")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowEtape> addEtape(@PathVariable Long id, @RequestBody WorkflowEtape etape) {
        WorkflowCircuit circuit = circuitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Circuit introuvable"));
        etape.setCircuit(circuit);
        return ResponseEntity.ok(etapeRepository.save(etape));
    }

    @PutMapping("/etapes/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowEtape> updateEtape(@PathVariable Long id, @RequestBody WorkflowEtape updated) {
        WorkflowEtape etape = etapeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Étape introuvable"));
        etape.setOrdre(updated.getOrdre());
        etape.setRoleValidateur(updated.getRoleValidateur());
        etape.setLabel(updated.getLabel());
        etape.setOptionnel(updated.isOptionnel());
        etape.setDelaiHeures(updated.getDelaiHeures());
        etape.setActionExpiration(updated.getActionExpiration());
        return ResponseEntity.ok(etapeRepository.save(etape));
    }

    @DeleteMapping("/etapes/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEtape(@PathVariable Long id) {
        etapeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===================== MAPPINGS =====================

    @GetMapping("/mappings")
    public ResponseEntity<List<WorkflowMapping>> getAllMappings() {
        return ResponseEntity.ok(mappingRepository.findAll());
    }

    @PostMapping("/mappings")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowMapping> createMapping(@RequestBody Map<String, Object> payload) {
        WorkflowMapping mapping = new WorkflowMapping();
        mapping.setTypeRequete((String) payload.get("typeRequete"));

        Long circuitId = Long.valueOf(payload.get("circuitId").toString());
        WorkflowCircuit circuit = circuitRepository.findById(circuitId)
                .orElseThrow(() -> new RuntimeException("Circuit introuvable"));
        mapping.setCircuit(circuit);

        return ResponseEntity.ok(mappingRepository.save(mapping));
    }

    @DeleteMapping("/mappings/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteMapping(@PathVariable Long id) {
        mappingRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===================== BYPASS RULES =====================

    @GetMapping("/bypass-rules")
    public ResponseEntity<List<WorkflowBypassRule>> getAllBypassRules() {
        return ResponseEntity.ok(bypassRuleRepository.findAll());
    }

    @PostMapping("/bypass-rules")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowBypassRule> createBypassRule(@RequestBody WorkflowBypassRule rule) {
        return ResponseEntity.ok(bypassRuleRepository.save(rule));
    }

    @PutMapping("/bypass-rules/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowBypassRule> updateBypassRule(@PathVariable Long id, @RequestBody WorkflowBypassRule updated) {
        WorkflowBypassRule rule = bypassRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Règle introuvable"));
        rule.setNom(updated.getNom());
        rule.setConditionType(updated.getConditionType());
        rule.setEtapeIgnoree(updated.getEtapeIgnoree());
        rule.setSeuilHeures(updated.getSeuilHeures());
        rule.setActif(updated.isActif());
        return ResponseEntity.ok(bypassRuleRepository.save(rule));
    }

    @DeleteMapping("/bypass-rules/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteBypassRule(@PathVariable Long id) {
        bypassRuleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===================== DELEGATIONS =====================

    @GetMapping("/delegations")
    public ResponseEntity<List<WorkflowDelegation>> getAllDelegations() {
        return ResponseEntity.ok(delegationRepository.findAll());
    }

    @PostMapping("/delegations")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<WorkflowDelegation> createDelegation(@RequestBody Map<String, Object> payload) {
        WorkflowDelegation delegation = new WorkflowDelegation();
        
        Long titulaireId = Long.valueOf(payload.get("titulaireId").toString());
        Long delegueId = Long.valueOf(payload.get("delegueId").toString());
        
        delegation.setTitulaire(utilisateurRepository.findById(titulaireId)
                .orElseThrow(() -> new RuntimeException("Titulaire introuvable")));
        delegation.setDelegue(utilisateurRepository.findById(delegueId)
                .orElseThrow(() -> new RuntimeException("Délégué introuvable")));
        delegation.setDateDebut(java.time.LocalDate.parse(payload.get("dateDebut").toString()));
        delegation.setDateFin(java.time.LocalDate.parse(payload.get("dateFin").toString()));
        delegation.setActif(true);

        return ResponseEntity.ok(delegationRepository.save(delegation));
    }

    @DeleteMapping("/delegations/{id}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteDelegation(@PathVariable Long id) {
        delegationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
