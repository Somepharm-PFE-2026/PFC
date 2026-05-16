package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.dto.UserActivationResponse;
import com.somepharm.hrportal.dto.UserSummaryDTO;
import com.somepharm.hrportal.entity.Role;
import com.somepharm.hrportal.entity.SituationFamiliale;
import com.somepharm.hrportal.entity.Site;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.HelpdeskService;
import com.somepharm.hrportal.service.EmailService;
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
    private final com.somepharm.hrportal.repository.DepartementRepository departementRepository;
    private final com.somepharm.hrportal.repository.PosteRepository posteRepository;
    private final EmailService emailService;

    public UtilisateurController(UtilisateurRepository utilisateurRepository,
            HelpdeskService helpdeskService,
            com.somepharm.hrportal.repository.SiteRepository siteRepository,
            com.somepharm.hrportal.repository.RoleRepository roleRepository,
            com.somepharm.hrportal.repository.DepartementRepository departementRepository,
            com.somepharm.hrportal.repository.PosteRepository posteRepository,
            EmailService emailService) {
        this.utilisateurRepository = utilisateurRepository;
        this.helpdeskService = helpdeskService;
        this.siteRepository = siteRepository;
        this.roleRepository = roleRepository;
        this.departementRepository = departementRepository;
        this.posteRepository = posteRepository;
        this.emailService = emailService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDTO> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return utilisateurRepository.findByMatricule(auth.getName())
                .map(this::convertToSummaryDTO)
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
                if (role != null)
                    roles.add(role);
            }

            // 3. Check for HR/Admin privileges
            boolean isHR = roles.stream().anyMatch(r -> r.equals("ROLE_RH_ADMIN") || r.equals("RH_ADMIN") ||
                    r.equals("ROLE_HR_MANAGER") || r.equals("HR_MANAGER") ||
                    r.equals("ROLE_SUPER_ADMIN") || r.equals("SUPER_ADMIN"));

            if (isHR) {
                System.out.println("[DIRECTORY DEBUG] User is HR/Admin - Returning full directory (count="
                        + utilisateurRepository.count() + ")");
                List<UserSummaryDTO> dtos = utilisateurRepository.findAll().stream()
                        .map(this::convertToSummaryDTO)
                        .collect(java.util.stream.Collectors.toList());
                return ResponseEntity.ok(dtos);
            }

            // 4. Fallback for Managers
            boolean isManager = roles.stream().anyMatch(r -> r.contains("MANAGER"));
            if (isManager) {
                List<Utilisateur> directory;
                String poste = currentUser.getPoste() != null ? currentUser.getPoste().getTitre() : "";
                int myLevel = getPositionLevel(poste);

                if (myLevel == 1) {
                    // 🛡️ Department Head: See everyone in department with lower level
                    directory = utilisateurRepository.findByDepartement_NomDept(currentUser.getDepartement() != null ? currentUser.getDepartement().getNomDept() : "");
                    directory.removeIf(u -> getPositionLevel(u.getPoste() != null ? u.getPoste().getTitre() : "") <= myLevel);
                } else {
                    // 🛡️ Team Manager: See subordinates
                    directory = new ArrayList<>();
                    findSubordinatesRecursive(currentUser.getIdUser(), directory);
                }

                // Always ensure self is excluded
                directory.removeIf(u -> u.getIdUser().equals(currentUser.getIdUser()));

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
            // 🛠️ SECURITY FIX: Resolve Role from DB BEFORE security checks
            // This prevents skipping checks when the request only contains the role ID.
            if (newUser.getRole() != null && newUser.getRole().getIdRole() != null) {
                roleRepository.findById(newUser.getRole().getIdRole()).ifPresent(newUser::setRole);
            }

            // 🛡️ SECURITY: Only SUPER_ADMIN can create another SUPER_ADMIN or HR_MANAGER
            if (newUser.getRole() != null) {
                String targetRole = newUser.getRole().getNomRole();
                if ("SUPER_ADMIN".equals(targetRole) || "HR_MANAGER".equals(targetRole)) {
                    if (!isSuperAdmin()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Droit insuffisant : Seul un SUPER_ADMIN peut créer un compte de ce rang (" + targetRole + ").");
                    }
                }
            }

            // 🛡️ SECURITY: Check dept-based restrictions and auto-assign roles
            if (newUser.getDepartement() != null && newUser.getDepartement().getIdDept() != null) {
                com.somepharm.hrportal.entity.Departement dept = departementRepository.findById(newUser.getDepartement().getIdDept()).orElse(null);
                if (dept != null) {
                    String deptName = dept.getNomDept().toUpperCase();
                    if (deptName.contains("RESSOURCES HUMAINES")) {
                        // Only HR_MANAGER or SUPER_ADMIN can create users in RH
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        Utilisateur creator = utilisateurRepository.findByMatricule(auth.getName()).orElse(null);
                        if (creator != null && "RH_ADMIN".equals(creator.getRole().getNomRole())) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                    .body("Droit insuffisant : Seul un HR_MANAGER peut affecter un collaborateur au département RESSOURCES HUMAINES.");
                        }
                        // Auto-assign RH_ADMIN role
                        roleRepository.findByNomRole("RH_ADMIN").ifPresent(newUser::setRole);
                    } else if (deptName.contains("SECURITE") || deptName.contains("SÉCURITÉ")) {
                        // Auto-assign SECURITY_AGENTS role for security department
                        roleRepository.findByNomRole("SECURITY_AGENTS").ifPresent(newUser::setRole);
                    }
                }
            }

            // Check for unique matricule if provided
            if (newUser.getMatricule() != null && !newUser.getMatricule().isEmpty()) {
                if (utilisateurRepository.findByMatricule(newUser.getMatricule()).isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("Le matricule " + newUser.getMatricule() + " est déjà utilisé.");
                }
            }

            // Step 1: HR Creation
            newUser.setStatutCompte("INACTIF");
            newUser.setPasswordStatus("N/A");
            newUser.setMustChangePassword(true);
            newUser.setSoldeConges(30.0);

            if (newUser.getSituationFamiliale() == null) {
                newUser.setSituationFamiliale(SituationFamiliale.CELIBATAIRE);
            }

            // Set a dummy password to satisfy NOT NULL constraint
            // This will be overwritten during Step 2: Activation
            newUser.setMotDePasse(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                    .encode("LOCKED_ACCOUNTS_REQUIRE_PASSWORDS_2026"));

            // 🛠️ FIX: Resolve all associated entities from DB to avoid detached entity errors
            // (JPA requires @Version to be populated on any cascaded/merged entity)
            // 🛠️ FIX: Role already resolved above
            if (newUser.getDepartement() != null && newUser.getDepartement().getIdDept() != null) {
                departementRepository.findById(newUser.getDepartement().getIdDept()).ifPresent(newUser::setDepartement);
            }
            if (newUser.getPoste() != null && newUser.getPoste().getIdPoste() != null) {
                posteRepository.findById(newUser.getPoste().getIdPoste()).ifPresent(newUser::setPoste);
            }
            // 🛠️ FIX: Resolve managerDirect from DB — raw stub from request body has version=null
            if (newUser.getManagerDirect() != null && newUser.getManagerDirect().getIdUser() != null) {
                utilisateurRepository.findById(newUser.getManagerDirect().getIdUser()).ifPresent(newUser::setManagerDirect);
            } else {
                newUser.setManagerDirect(null);
            }
            if (newUser.getSite() != null && newUser.getSite().getIdSite() != null) {
                siteRepository.findById(newUser.getSite().getIdSite()).ifPresent(newUser::setSite);
            }
            Utilisateur savedUser = utilisateurRepository.save(newUser);

            // Return DTO to avoid circular reference crashes
            return ResponseEntity.ok(convertToSummaryDTO(savedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la création : " + e.getMessage());
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
        while (utilisateurRepository.findByMatricule(matricule).isPresent()) {
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

        // 📧 Automate Welcome Email
        emailService.sendWelcomeEmail(user, tempPassword);

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
                    .body(Map.of("message",
                            "Action refusée : Le compte " + matricule + " est déjà " + user.getStatutCompte() + "."));
        }

        // Security Check 2: Must still have a temporary password (unless reset is
        // requested)
        if (!"TEMPORAIRE".equals(user.getPasswordStatus()) && !Boolean.TRUE.equals(user.getPasswordResetRequested())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "Sécurité : Ce collaborateur a déjà personnalisé son accès. Utilisez 'Régénérer MDP' si besoin."));
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
            return ResponseEntity.ok()
                    .body(Collections.singletonMap("message", "Demande de réinitialisation envoyée au Super Admin."));
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
            return ResponseEntity.badRequest().body(
                    "Le mot de passe ne respecte pas les critères de sécurité (8+ chars, Majuscule, Chiffre, Caractère spécial).");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Session invalide"));

        // SUPER_ADMIN is exempt from the forced "mustChangePassword" lock behavior
        // during regular edits,
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
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Utilisateur updatedData,
            Authentication auth) {
        Utilisateur existing = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        String currentUserRole = currentUser.getRole().getNomRole();

        // 🛡️ ENFORCE HIERARCHY FOR DIRECT UPDATES
        if (existing.getRole() != null) {
            String targetRole = existing.getRole().getNomRole();

            if (targetRole.equals("RH_ADMIN") && !currentUserRole.equals("HR_MANAGER")
                    && !currentUserRole.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403)
                        .body("Seul un HR_MANAGER peut modifier directement le profil d'un RH_ADMIN");
            }
            if (targetRole.equals("HR_MANAGER") && !currentUserRole.equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403)
                        .body("Seul le SUPER_ADMIN peut modifier directement le profil d'un HR_MANAGER");
            }
        }

        // Personal info
        existing.setNom(updatedData.getNom());
        existing.setPrenom(updatedData.getPrenom());
        existing.setTelephone(updatedData.getTelephone());
        existing.setEmail(updatedData.getEmail());
        if (updatedData.getRole() != null && updatedData.getRole().getIdRole() != null) {
            Role role = roleRepository.findById(updatedData.getRole().getIdRole())
                    .orElseThrow(() -> new RuntimeException("Rôle introuvable"));
            
            // 🛡️ SECURITY FIX: Prevent unauthorized role elevation
            String targetRoleName = role.getNomRole();
            if (("SUPER_ADMIN".equals(targetRoleName) || "HR_MANAGER".equals(targetRoleName)) && !"SUPER_ADMIN".equals(currentUserRole)) {
                return ResponseEntity.status(403).body("Droit insuffisant : Impossible d'assigner le rôle " + targetRoleName);
            }
            
            existing.setRole(role);
        }
        existing.setDateNaissance(updatedData.getDateNaissance());
        existing.setPhotoUrl(updatedData.getPhotoUrl());
        existing.setContactUrgence(updatedData.getContactUrgence());
        if (updatedData.getSituationFamiliale() != null) {
            existing.setSituationFamiliale(updatedData.getSituationFamiliale());
        }

        // Professional context
        com.somepharm.hrportal.entity.Departement currentDept = existing.getDepartement();
        if (updatedData.getDepartement() != null && updatedData.getDepartement().getIdDept() != null) {
            com.somepharm.hrportal.entity.Departement newDept = departementRepository.findById(updatedData.getDepartement().getIdDept()).orElse(null);
            if (newDept != null) {
                String newDeptName = newDept.getNomDept().toUpperCase();
                boolean isTargetRH = newDeptName.contains("RESSOURCES HUMAINES");

                if (isTargetRH) {
                    // Rule: Only HR_MANAGER or SUPER_ADMIN can move a "non défini" (null dept) user to RH
                    if (currentDept == null && !"HR_MANAGER".equals(currentUserRole) && !"SUPER_ADMIN".equals(currentUserRole)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Droit insuffisant : Seul un HR_MANAGER peut affecter un profil sans département au département RESSOURCES HUMAINES.");
                    }
                    // RH_ADMIN cannot move ANY user to RH
                    if ("RH_ADMIN".equals(currentUserRole)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Droit insuffisant : Seul un HR_MANAGER peut affecter un utilisateur au département RESSOURCES HUMAINES.");
                    }
                }

                // Apply the department change
                existing.setDepartement(newDept);
            }
        }

        if (updatedData.getPoste() != null && updatedData.getPoste().getIdPoste() != null) {
            existing.setPoste(posteRepository.findById(updatedData.getPoste().getIdPoste()).orElse(null));
        } else {
            existing.setPoste(null);
        }

        // Site
        if (updatedData.getSite() != null && updatedData.getSite().getIdSite() != null) {
            Site site = siteRepository.findById(updatedData.getSite().getIdSite())
                    .orElseThrow(() -> new RuntimeException("Site introuvable"));
            existing.setSite(site);
        } else {
            existing.setSite(null);
        }

        // Manager direct
        if (updatedData.getManagerDirect() != null && updatedData.getManagerDirect().getIdUser() != null) {
            Utilisateur manager = utilisateurRepository.findById(updatedData.getManagerDirect().getIdUser())
                    .orElse(null);
            // Enforce team boundary: Manager must be in the exact same department
            if (manager != null && manager.getDepartement() != null
                    && manager.getDepartement().equals(existing.getDepartement())) {
                existing.setManagerDirect(manager);

                // 🛡️ SMART DEMOTION: If a Team Lead (Chef d'équipe) is now managed by another
                // Team Lead, they must step down
                if (manager.getPoste() != null && manager.getPoste().getTitre() != null && manager.getPoste().getTitre().contains("CHEF D'EQUIPE")) {
                    if (existing.getPoste() != null && existing.getPoste().getTitre() != null && existing.getPoste().getTitre().contains("CHEF D'EQUIPE")) {
                        System.out.println("[HIERARCHY] Stepping down " + existing.getMatricule()
                                + " because their new manager is a Team Lead.");
                        existing.setPoste(null); // Assuming reset Poste or fetch from repo
                        roleRepository.findByNomRole("EMPLOYE").ifPresent(existing::setRole);
                    }
                }
            } else {
                existing.setManagerDirect(null);
            }
        } else {
            existing.setManagerDirect(null);
        }
        existing.setDateEmbauche(updatedData.getDateEmbauche());

        // Auto-Role Assignment Logic (Sync Role with Department/Position)
        if (existing.getDepartement() != null && existing.getDepartement().getNomDept() != null) {
            String deptUpper = existing.getDepartement().getNomDept().toUpperCase();

            // 1. Force specific roles for critical departments (always overrides)
            if (deptUpper.contains("SECURITE") || deptUpper.contains("SÉCURITÉ")) {
                roleRepository.findByNomRole("SECURITY_AGENTS").ifPresent(existing::setRole);
            } else if (deptUpper.contains("RESSOURCES HUMAINES")) {
                // Only assign RH_ADMIN if not already a HR_MANAGER or SUPER_ADMIN
                String currentRoleName = existing.getRole() != null ? existing.getRole().getNomRole() : null;
                if (!"HR_MANAGER".equals(currentRoleName) && !"SUPER_ADMIN".equals(currentRoleName)) {
                    roleRepository.findByNomRole("RH_ADMIN").ifPresent(existing::setRole);
                }
            } else {
                // 2. Hierarchy based elevation/demotion for other departments
                if (existing.getPoste() != null && existing.getPoste().getTitre() != null) {
                    String managerPostePattern = "RESPONSABLE DE " + deptUpper;
                    String chefPostePattern = "CHEF D'EQUIPE";
                    String employeePostePattern = "EMP_" + deptUpper;
                    String currentPoste = existing.getPoste().getTitre().toUpperCase();

                    if (currentPoste.equalsIgnoreCase(managerPostePattern)
                            || currentPoste.equalsIgnoreCase(chefPostePattern)) {
                        if (existing.getRole() == null || "EMPLOYE".equals(existing.getRole().getNomRole())) {
                            roleRepository.findByNomRole("MANAGER").ifPresent(existing::setRole);
                        }
                    } else if (currentPoste.equalsIgnoreCase(employeePostePattern)) {
                        if (existing.getRole() != null) {
                            String roleName = existing.getRole().getNomRole();
                            if ("MANAGER".equals(roleName)) {
                                System.out.println("[HIERARCHY] Demoting " + existing.getMatricule()
                                        + " from MANAGER to EMPLOYE due to position change.");
                                roleRepository.findByNomRole("EMPLOYE").ifPresent(existing::setRole);
                            } else if (roleName == null
                                    || (!roleName.equals("HR_MANAGER") && !roleName.equals("SUPER_ADMIN")
                                            && !roleName.equals("RH_ADMIN") && !roleName.equals("SECURITY_AGENTS"))) {
                                roleRepository.findByNomRole("EMPLOYE").ifPresent(existing::setRole);
                            }
                        } else {
                            roleRepository.findByNomRole("EMPLOYE").ifPresent(existing::setRole);
                        }
                    }
                }
            }
        }

        // Leave balance
        if (updatedData.getSoldeConges() != null && updatedData.getSoldeConges() >= 0.0) {
            existing.setSoldeConges(updatedData.getSoldeConges());
        }

        // 🛡️ STATUT COMPTE: Only SUPER_ADMIN can modify
        if (updatedData.getStatutCompte() != null
                && !updatedData.getStatutCompte().equals(existing.getStatutCompte())) {
            if ("SUPER_ADMIN".equals(currentUserRole)) {
                existing.setStatutCompte(updatedData.getStatutCompte());
            }
        }

        return ResponseEntity.ok(utilisateurRepository.save(existing));
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
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
                .departement(u.getDepartement() != null ? u.getDepartement().getNomDept() : "")
                .poste(u.getPoste() != null ? u.getPoste().getTitre() : "")
                .role(u.getRole() != null ? u.getRole().getNomRole() : "EMPLOYE")
                .statutCompte(u.getStatutCompte())
                .passwordStatus(u.getPasswordStatus())
                .soldeConges(u.getSoldeConges())
                .idManagerDirect(u.getManagerDirect() != null ? u.getManagerDirect().getIdUser() : null)
                .managerDirect(u.getManagerDirect() != null ? 
                    UserSummaryDTO.ManagerDTO.builder()
                        .idUser(u.getManagerDirect().getIdUser())
                        .nom(u.getManagerDirect().getNom())
                        .prenom(u.getManagerDirect().getPrenom())
                        .build() 
                    : null)
                .idSite(u.getSite() != null ? u.getSite().getIdSite() : null)
                .temporaryPassword(isSuperAdmin() ? u.getTemporaryPassword() : null)
                .situationFamiliale(u.getSituationFamiliale() != null ? u.getSituationFamiliale().name() : null)
                .build();

    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private int getPositionLevel(String poste) {
        if (poste == null)
            return 3;
        String p = poste.toUpperCase();
        if (p.startsWith("RESPONSABLE DE "))
            return 1;
        if (p.contains("CHEF") || p.contains("MANAGER") || p.contains("RESPONSABLE"))
            return 2;
        return 3;
    }

}