package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.dto.UserActivationResponse;
import com.somepharm.hrportal.dto.UserSummaryDTO;
import com.somepharm.hrportal.entity.Role;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.HelpdeskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "http://localhost:3000")
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private final HelpdeskService helpdeskService;
    private final com.somepharm.hrportal.repository.SiteRepository siteRepository;
    private final com.somepharm.hrportal.repository.RoleRepository roleRepository;

    public UtilisateurController(UtilisateurRepository utilisateurRepository,
                                 HelpdeskService helpdeskService,
                                 com.somepharm.hrportal.repository.SiteRepository siteRepository,
                                 com.somepharm.hrportal.repository.RoleRepository roleRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.helpdeskService = helpdeskService;
        this.siteRepository = siteRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Utilisateur> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return utilisateurRepository.findByMatricule(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<Utilisateur>> getAllUsers() {
        return ResponseEntity.ok(utilisateurRepository.findAll());
    }

    @GetMapping("/monitoring/profiles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<UserSummaryDTO>> getMonitoringProfiles() {
        return ResponseEntity.ok(utilisateurRepository.findAll().stream()
                .map(this::convertToSummaryDTO)
                .collect(java.util.stream.Collectors.toList()));
    }

    // --- NEW: THE SECURE DIRECTORY ENDPOINT (Role-Based Visibility) ---
    @GetMapping("/directory")
    public ResponseEntity<?> getEmployeeDirectory(Authentication auth) {
        try {
            if (auth == null) {
                System.err.println("[DIRECTORY ERROR] Authentication object is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Non authentifié");
            }

            System.out.println("[DIRECTORY DEBUG] Request by: " + auth.getName());

            // 1. Fetch current user
            Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé : " + auth.getName()));

            // 2. Extract roles safely
            List<String> roles = new ArrayList<>();
            for (var a : auth.getAuthorities()) {
                String role = a.getAuthority();
                if (role != null) roles.add(role);
            }

            // 3. Check for HR/Admin privileges
            boolean isHR = roles.stream().anyMatch(r -> 
                r.equals("ROLE_RH_ADMIN") || r.equals("RH_ADMIN") || 
                r.equals("ROLE_HR_MANAGER") || r.equals("HR_MANAGER") || 
                r.equals("ROLE_SUPER_ADMIN") || r.equals("SUPER_ADMIN")
            );

            if (isHR) {
                System.out.println("[DIRECTORY DEBUG] User is HR/Admin - Returning full directory (count=" + utilisateurRepository.count() + ")");
                List<UserSummaryDTO> dtos = utilisateurRepository.findAll().stream()
                        .map(this::convertToSummaryDTO)
                        .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(dtos);
            }

            // 4. Fallback for Managers
            boolean isManager = roles.stream().anyMatch(r -> r.contains("MANAGER"));
            if (isManager) {
                List<Utilisateur> directory = new ArrayList<>();
                findSubordinatesRecursive(currentUser.getIdUser(), directory);
                if (!directory.contains(currentUser)) directory.add(currentUser);
                
                List<UserSummaryDTO> dtos = directory.stream()
                        .map(this::convertToSummaryDTO)
                        .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(dtos);
            }

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Accès refusé. Réservé aux Managers et RH.");
        } catch (Exception e) {
            System.err.println("[DIRECTORY CRASH] Fatal error in getEmployeeDirectory: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur interne : " + e.getMessage());
        }
    }

    private void findSubordinatesRecursive(Long managerId, List<Utilisateur> directory) {
        List<Utilisateur> subordinates = utilisateurRepository.findAllByManagerDirect_IdUser(managerId);
        for (Utilisateur sub : subordinates) {
            directory.add(sub);
            findSubordinatesRecursive(sub.getIdUser(), directory);
        }
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody Utilisateur newUser) {
        try {
            // Check for unique matricule if provided
            if (newUser.getMatricule() != null && !newUser.getMatricule().isEmpty()) {
                if (utilisateurRepository.findByMatricule(newUser.getMatricule()).isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body("Le matricule " + newUser.getMatricule() + " est déjà utilisé.");
                }
            }

            // Step 1: HR Creation
            newUser.setStatutCompte("INACTIF");
            newUser.setPasswordStatus("N/A");
            newUser.setMustChangePassword(true);
            newUser.setSoldeConges(30.0);
            
            // Set a dummy password to satisfy NOT NULL constraint
            // This will be overwritten during Step 2: Activation
            newUser.setMotDePasse(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("LOCKED_ACCOUNTS_REQUIRE_PASSWORDS_2026"));

            if (newUser.getDepartement() == null || newUser.getDepartement().isEmpty()) {

                newUser.setDepartement("Général");
            }

            Utilisateur savedUser = utilisateurRepository.save(newUser);
            
            // Return DTO to avoid circular reference crashes
            return ResponseEntity.ok(convertToSummaryDTO(savedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la création : " + e.getMessage());
        }
    }


    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/{id}/activate")
    public ResponseEntity<UserActivationResponse> activateUser(@PathVariable Long id) {
        // Step 2: Activation by SUPER_ADMIN
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        if (!"INACTIF".equals(user.getStatutCompte())) {
            throw new RuntimeException("Seuls les comptes INACTIFS peuvent être activés.");
        }

        // Generate Matricule EMP-XXXX
        String matricule = "EMP-" + (int) (Math.random() * 9000 + 1000);
        // Ensure uniqueness (simple check for demo, usually needs a better generator)
        while(utilisateurRepository.findByMatricule(matricule).isPresent()) {
            matricule = "EMP-" + (int) (Math.random() * 9000 + 1000);
        }

        // Generate Temporary Password
        String tempPassword = "Bienvenue2026!";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        user.setMatricule(matricule);
        user.setMotDePasse(encoder.encode(tempPassword));
        user.setStatutCompte("EN_ATTENTE_PREMIERE_CONNEXION");
        user.setPasswordStatus("TEMPORAIRE");
        user.setActivationDate(LocalDate.now());
        user.setPasswordResetRequested(false);
        user.setTemporaryPassword(tempPassword); // Store for SUPER_ADMIN visibility

        utilisateurRepository.save(user);

        return ResponseEntity.ok(UserActivationResponse.builder()
                .matricule(matricule)
                .temporary_password(tempPassword)
                .account_status(user.getStatutCompte())
                .password_status(user.getPasswordStatus())
                .activation_date(user.getActivationDate())
                .build());
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PutMapping("/{matricule}/reset-password-super")
    public ResponseEntity<UserActivationResponse> resetPasswordSuper(@PathVariable String matricule) {
        // Manual Reset by SUPER_ADMIN
        Utilisateur user = utilisateurRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        // Allow reset if it was requested, even if status is SECURED
        String tempPassword = "Reset" + (int) (Math.random() * 9000 + 1000) + "!";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        user.setMotDePasse(encoder.encode(tempPassword));
        user.setStatutCompte("EN_ATTENTE_PREMIERE_CONNEXION");
        user.setPasswordStatus("TEMPORAIRE");
        user.setMustChangePassword(true);
        user.setPasswordResetRequested(false);
        user.setTemporaryPassword(tempPassword); // Store for SUPER_ADMIN visibility

        utilisateurRepository.save(user);

        return ResponseEntity.ok(UserActivationResponse.builder()
                .matricule(user.getMatricule())
                .temporary_password(user.getTemporaryPassword())
                .account_status(user.getStatutCompte())
                .password_status(user.getPasswordStatus())
                .activation_date(LocalDate.now())
                .build());
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/{matricule}/resend-activation")
    public ResponseEntity<?> resendActivation(@PathVariable String matricule) {
        Utilisateur user = utilisateurRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        // Security Check 1: Must be in waiting status
        if (!"EN_ATTENTE_PREMIERE_CONNEXION".equals(user.getStatutCompte())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Action refusée : Le compte " + matricule + " est déjà " + user.getStatutCompte() + "."));
        }

        // Security Check 2: Must still have a temporary password (unless reset is requested)
        if (!"TEMPORAIRE".equals(user.getPasswordStatus()) && !Boolean.TRUE.equals(user.getPasswordResetRequested())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Sécurité : Ce collaborateur a déjà personnalisé son accès. Utilisez 'Régénérer MDP' si besoin."));
        }

        return ResponseEntity.ok(UserActivationResponse.builder()
                .matricule(user.getMatricule())
                .temporary_password(user.getTemporaryPassword())
                .account_status(user.getStatutCompte())
                .password_status(user.getPasswordStatus())
                .activation_date(LocalDate.now())
                .build());
    }

    @PutMapping("/me/request-reset")
    public ResponseEntity<?> requestReset() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        try {
            // 🎫 Idempotent creation (handles check + flag + ticket)
            helpdeskService.createTicket(auth.getName());
            return ResponseEntity.ok().body(Collections.singletonMap("message", "Demande de réinitialisation envoyée au Super Admin."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        String newPassword = payload.get("newPassword");
        // Constraints: Min 8, 1 Upper, 1 Digit, 1 Special
        if (newPassword == null || newPassword.length() < 8 ||
            !newPassword.matches(".*[A-Z].*") ||
            !newPassword.matches(".*[0-9].*") ||
            !newPassword.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            return ResponseEntity.badRequest().body("Le mot de passe ne respecte pas les critères de sécurité (8+ chars, Majuscule, Chiffre, Caractère spécial).");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Session invalide"));

        // SUPER_ADMIN is exempt from the forced "mustChangePassword" lock behavior during regular edits, 
        // but here they are changing it themselves.
        
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        user.setMotDePasse(encoder.encode(newPassword));
        user.setStatutCompte("ACTIF");
        user.setPasswordStatus("MODIFIE");
        user.setMustChangePassword(false);
        user.setPasswordResetRequested(false);
        user.setTemporaryPassword(null); // Clear once changed!

        utilisateurRepository.save(user);
        
        // 🛡️ IMPORTANT: Complete and Secure the Helpdesk Reset Tickets
        helpdeskService.completeResetTickets(user.getMatricule());
        
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Utilisateur updatedData, Authentication auth) {
        Utilisateur existing = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String currentUserRole = currentUser.getRole().getNomRole();

        // 🛡️ ENFORCE HIERARCHY FOR DIRECT UPDATES
        if (existing.getRole() != null) {
            String targetRole = existing.getRole().getNomRole();
            
            if (targetRole.equals("RH_ADMIN") && !currentUserRole.equals("HR_MANAGER") && !currentUserRole.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("Seul un HR_MANAGER peut modifier directement le profil d'un RH_ADMIN");
            }
            if (targetRole.equals("HR_MANAGER") && !currentUserRole.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403).body("Seul le SUPER_ADMIN peut modifier directement le profil d'un HR_MANAGER");
            }
        }

        // Personal info
        existing.setNom(updatedData.getNom());
        existing.setPrenom(updatedData.getPrenom());
        existing.setTelephone(updatedData.getTelephone());
        existing.setEmail(updatedData.getEmail());
        if (updatedData.getRole() != null && updatedData.getRole().getIdRole() != null) {
            com.somepharm.hrportal.entity.Role role = roleRepository.findById(updatedData.getRole().getIdRole())
                    .orElseThrow(() -> new RuntimeException("Rôle introuvable"));
            existing.setRole(role);
        }
        existing.setDateNaissance(updatedData.getDateNaissance());
        existing.setPhotoUrl(updatedData.getPhotoUrl());
        existing.setContactUrgence(updatedData.getContactUrgence());

        // Professional context
        boolean departmentChanged = updatedData.getDepartement() != null && !updatedData.getDepartement().equals(existing.getDepartement());
        if (departmentChanged) {
            existing.setDepartement(updatedData.getDepartement());
            
            // Auto-remove this employee as manager for subordinates in the old department
            java.util.List<Utilisateur> subordinates = utilisateurRepository.findAllByManagerDirect_IdUser(existing.getIdUser());
            for (Utilisateur sub : subordinates) {
                // If subordinate is not in the newly assigned department, they lose this manager
                if (!sub.getDepartement().equals(existing.getDepartement())) {
                    sub.setManagerDirect(null);
                    utilisateurRepository.save(sub);
                }
            }
        }
        existing.setPoste(updatedData.getPoste());
        
        // Auto-Role Assignment Logic
        if (existing.getDepartement() != null && existing.getPoste() != null) {
            String targetPoste = "RESPONSABLE DE " + existing.getDepartement().toUpperCase();
            if (existing.getPoste().equalsIgnoreCase(targetPoste)) {
                // If they are not already an admin, make them a MANAGER
                if (existing.getRole() == null || existing.getRole().getIdRole() == 4) {
                    com.somepharm.hrportal.entity.Role managerRole = roleRepository.findById(3L).orElse(existing.getRole());
                    existing.setRole(managerRole);
                }
            } else {
                // If they were a MANAGER but no longer hold the RESPONSABLE DE poste, downgrade to EMPLOYE
                if (existing.getRole() != null && existing.getRole().getIdRole() == 3) {
                    com.somepharm.hrportal.entity.Role employeRole = roleRepository.findById(4L).orElse(existing.getRole());
                    existing.setRole(employeRole);
                }
            }
        }
        existing.setDateEmbauche(updatedData.getDateEmbauche());

        // Site
        if (updatedData.getSite() != null && updatedData.getSite().getIdSite() != null) {
            com.somepharm.hrportal.entity.Site site = siteRepository.findById(updatedData.getSite().getIdSite())
                    .orElse(null);
            existing.setSite(site);
        } else {
            existing.setSite(null);
        }

        // Manager direct
        if (updatedData.getManagerDirect() != null && updatedData.getManagerDirect().getIdUser() != null) {
            Utilisateur manager = utilisateurRepository.findById(updatedData.getManagerDirect().getIdUser())
                    .orElse(null);
            // Enforce team boundary: Manager must be in the exact same department
            if (manager != null && manager.getDepartement() != null && manager.getDepartement().equals(existing.getDepartement())) {
                existing.setManagerDirect(manager);
            } else {
                existing.setManagerDirect(null);
            }
        } else {
            existing.setManagerDirect(null);
        }

        // Leave balance
        if (updatedData.getSoldeConges() != null && updatedData.getSoldeConges() >= 0.0) {
            existing.setSoldeConges(updatedData.getSoldeConges());
        }

        return ResponseEntity.ok(utilisateurRepository.save(existing));
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PutMapping("/{id}/statut")
    public ResponseEntity<Utilisateur> toggleStatus(@PathVariable Long id) {
        Utilisateur existing = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        if ("ACTIF".equals(existing.getStatutCompte())) {
            existing.setStatutCompte("INACTIF");
        } else {
            existing.setStatutCompte("ACTIF");
        }
        return ResponseEntity.ok(utilisateurRepository.save(existing));
    }

    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    @PutMapping("/{id}/reset-password")
    @Deprecated
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id) {
        // This old method is deprecated in favor of resetPasswordSuper
        return ResponseEntity.status(HttpStatus.GONE).build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getUserById(@PathVariable Long id) {
        return utilisateurRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));
    }

    @GetMapping("/by-matricule/{matricule}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Utilisateur> getUserByMatricule(@PathVariable String matricule) {
        return utilisateurRepository.findByMatricule(matricule)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new RuntimeException("Matricule introuvable : " + matricule));
    }

    private UserSummaryDTO convertToSummaryDTO(Utilisateur u) {

        return UserSummaryDTO.builder()
                .idUser(u.getIdUser())
                .matricule(u.getMatricule())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .departement(u.getDepartement())
                .poste(u.getPoste())
                .role(u.getRole() != null ? u.getRole().getNomRole() : "EMPLOYE")
                .statutCompte(u.getStatutCompte())
                .passwordStatus(u.getPasswordStatus())
                .soldeConges(u.getSoldeConges())
                .idManagerDirect(u.getManagerDirect() != null ? u.getManagerDirect().getIdUser() : null)
                .temporaryPassword(isSuperAdmin() ? u.getTemporaryPassword() : null)
                .build();

    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

}