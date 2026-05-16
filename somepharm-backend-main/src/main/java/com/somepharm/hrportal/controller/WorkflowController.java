package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.*;
import com.somepharm.hrportal.repository.*;
import com.somepharm.hrportal.service.WorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class WorkflowController {

    private final WorkflowCircuitRepository circuitRepository;
    private final WorkflowEtapeRepository etapeRepository;
    private final RequeteRepository requeteRepository;
    private final WorkflowMappingRepository mappingRepository;
    private final WorkflowBypassRuleRepository bypassRuleRepository;
    private final WorkflowDelegationRepository delegationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final WorkflowService workflowService;

    public WorkflowController(WorkflowCircuitRepository circuitRepository,
                              WorkflowEtapeRepository etapeRepository,
                              RequeteRepository requeteRepository,
                              WorkflowMappingRepository mappingRepository,
                              WorkflowBypassRuleRepository bypassRuleRepository,
                              WorkflowDelegationRepository delegationRepository,
                              UtilisateurRepository utilisateurRepository,
                              RoleRepository roleRepository,
                              WorkflowService workflowService) {
        this.circuitRepository = circuitRepository;
        this.etapeRepository = etapeRepository;
        this.requeteRepository = requeteRepository;
        this.mappingRepository = mappingRepository;
        this.bypassRuleRepository = bypassRuleRepository;
        this.delegationRepository = delegationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.workflowService = workflowService;
    }

    // ===================== CIRCUITS =====================

    @GetMapping("/circuits")
    public ResponseEntity<List<WorkflowCircuit>> getAllCircuits() {
        return ResponseEntity.ok(circuitRepository.findAll());
    }

    @PostMapping("/circuits")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<WorkflowCircuit> createCircuit(@RequestBody WorkflowCircuit circuit) {
        return ResponseEntity.ok(circuitRepository.save(circuit));
    }

    @DeleteMapping("/circuits/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<Void> deleteCircuit(@PathVariable Long id) {
        // 1. Clear mappings associated with this circuit
        List<WorkflowMapping> mappings = mappingRepository.findByCircuit_IdCircuit(id);
        mappingRepository.deleteAll(mappings);

        // 2. Clear requests currently using this circuit
        List<Requete> requests = requeteRepository.findByCurrentCircuit_IdCircuit(id);
        for (Requete req : requests) {
            req.setCurrentCircuit(null);
            req.setCurrentEtapeOrdre(0);
            // Optionally reset status if it was step-specific
            if (req.getStatutCycleVie().startsWith("EN_ATTENTE_") && !req.getStatutCycleVie().equals("EN_ATTENTE_RH")) {
                req.setStatutCycleVie("EN_ATTENTE_RH");
            }
        }
        requeteRepository.saveAll(requests);

        // 3. Delete the circuit itself
        circuitRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===================== ÉTAPES =====================

    @GetMapping("/circuits/{id}/etapes")
    public ResponseEntity<List<WorkflowEtape>> getEtapes(@PathVariable Long id) {
        return ResponseEntity.ok(etapeRepository.findByCircuit_IdCircuitOrderByOrdreAsc(id));
    }

    @PostMapping("/circuits/{id}/etapes")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<?> addEtape(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        WorkflowCircuit circuit = circuitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Circuit introuvable"));

        String roleNom = (String) payload.get("roleValidateur");
        if (roleNom == null || roleNom.isBlank()) {
            return ResponseEntity.badRequest().body("Le rôle validateur est obligatoire.");
        }

        WorkflowEtape etape = new WorkflowEtape();
        etape.setCircuit(circuit);
        
        Role role = roleRepository.findByNomRole(roleNom)
                .orElseThrow(() -> new RuntimeException("Rôle introuvable: " + roleNom));
        etape.setRoleValidateur(role);
        
        etape.setLabel(payload.get("label") != null ? payload.get("label").toString() : "");
        etape.setOrdre(payload.get("ordre") != null ? Integer.parseInt(payload.get("ordre").toString()) : 1);
        etape.setDelaiHeures(payload.get("delaiHeures") != null ? Integer.parseInt(payload.get("delaiHeures").toString()) : 72);
        etape.setActionExpiration(payload.get("actionExpiration") != null ? payload.get("actionExpiration").toString() : "RELANCE");
        etape.setOptionnel(payload.get("optionnel") != null && Boolean.parseBoolean(payload.get("optionnel").toString()));

        WorkflowEtape saved = etapeRepository.save(etape);
        workflowService.syncRequestsForCircuit(id);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/etapes/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<WorkflowEtape> updateEtape(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        WorkflowEtape etape = etapeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Étape introuvable"));
        if (payload.get("ordre") != null) etape.setOrdre(Integer.parseInt(payload.get("ordre").toString()));
        if (payload.get("roleValidateur") != null) {
            String roleName = payload.get("roleValidateur").toString();
            Role role = roleRepository.findByNomRole(roleName)
                    .orElseThrow(() -> new RuntimeException("Rôle introuvable: " + roleName));
            etape.setRoleValidateur(role);
        }
        if (payload.get("label") != null) etape.setLabel(payload.get("label").toString());
        if (payload.get("optionnel") != null) etape.setOptionnel(Boolean.parseBoolean(payload.get("optionnel").toString()));
        if (payload.get("delaiHeures") != null) etape.setDelaiHeures(Integer.parseInt(payload.get("delaiHeures").toString()));
        if (payload.get("actionExpiration") != null) etape.setActionExpiration(payload.get("actionExpiration").toString());
        
        WorkflowEtape saved = etapeRepository.save(etape);
        workflowService.syncRequestsForCircuit(etape.getCircuit().getIdCircuit());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/etapes/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<Void> deleteEtape(@PathVariable Long id) {
        Long circuitId = etapeRepository.findCircuitIdByEtapeId(id)
                .orElseThrow(() -> new RuntimeException("Étape introuvable"));
        int deletedOrdre = etapeRepository.findById(id).map(e -> e.getOrdre()).orElse(0);
        etapeRepository.deleteNative(id);
        if (deletedOrdre > 0) {
            etapeRepository.shiftOrdreAfterDelete(circuitId, deletedOrdre);
        }
        workflowService.syncRequestsForCircuit(circuitId);
        return ResponseEntity.ok().build();
    }

    // ===================== MAPPINGS =====================

    @GetMapping("/mappings")
    public ResponseEntity<List<WorkflowMapping>> getAllMappings() {
        return ResponseEntity.ok(mappingRepository.findAll());
    }

    @PostMapping("/mappings")
    @PreAuthorize("hasRole('HR_MANAGER')")
    @Transactional
    public ResponseEntity<WorkflowMapping> createMapping(@RequestBody Map<String, Object> payload) {
        String typeRequete = (String) payload.get("typeRequete");
        Long circuitId = Long.valueOf(payload.get("circuitId").toString());
        WorkflowCircuit circuit = circuitRepository.findById(circuitId)
                .orElseThrow(() -> new RuntimeException("Circuit introuvable"));

        WorkflowMapping mapping = mappingRepository.findByTypeRequete(typeRequete)
                .orElse(new WorkflowMapping());
        
        mapping.setTypeRequete(typeRequete);
        mapping.setCircuit(circuit);
        WorkflowMapping saved = mappingRepository.save(mapping);

        // Sync all in-progress requests of this type to follow the new circuit
        workflowService.syncRequestsForType(typeRequete, circuit);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/mappings/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
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
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<WorkflowBypassRule> createBypassRule(@RequestBody Map<String, Object> payload) {
        WorkflowBypassRule rule = new WorkflowBypassRule();
        rule.setNom(payload.get("nom").toString());
        rule.setConditionType(payload.get("conditionType").toString());
        if (payload.get("seuilHeures") != null) rule.setSeuilHeures(Integer.parseInt(payload.get("seuilHeures").toString()));
        String roleName = payload.get("etapeIgnoree") != null ? payload.get("etapeIgnoree").toString() : "MANAGER";
        roleRepository.findByNomRole(roleName).ifPresent(rule::setRoleIgnore);
        return ResponseEntity.ok(bypassRuleRepository.save(rule));
    }

    @PutMapping("/bypass-rules/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<WorkflowBypassRule> updateBypassRule(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        WorkflowBypassRule rule = bypassRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Règle introuvable"));
        if (payload.get("nom") != null) rule.setNom(payload.get("nom").toString());
        if (payload.get("conditionType") != null) rule.setConditionType(payload.get("conditionType").toString());
        if (payload.get("seuilHeures") != null) rule.setSeuilHeures(Integer.parseInt(payload.get("seuilHeures").toString()));
        if (payload.get("actif") != null) rule.setActif(Boolean.parseBoolean(payload.get("actif").toString()));
        if (payload.get("etapeIgnoree") != null) {
            roleRepository.findByNomRole(payload.get("etapeIgnoree").toString()).ifPresent(rule::setRoleIgnore);
        }
        return ResponseEntity.ok(bypassRuleRepository.save(rule));
    }

    @DeleteMapping("/bypass-rules/{id}")
    @PreAuthorize("hasRole('HR_MANAGER')")
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
    @PreAuthorize("hasRole('HR_MANAGER')")
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
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<Void> deleteDelegation(@PathVariable Long id) {
        delegationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
