package com.somepharm.hrportal.config;

import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.entity.Departement;
import com.somepharm.hrportal.entity.Role;
import com.somepharm.hrportal.repository.RoleRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.repository.DepartementRepository;
import com.somepharm.hrportal.service.DepartementService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.Optional;
import java.util.List;

@Configuration
public class SeedDataConfig {

    @Bean
    public CommandLineRunner seedEmployees(
            UtilisateurRepository userRepository, 
            RoleRepository roleRepository,
            DepartementRepository departementRepository,
            com.somepharm.hrportal.repository.PointageRepository pointageRepository,
            com.somepharm.hrportal.service.DepartementService departementService,
            com.somepharm.hrportal.repository.PosteRepository posteRepository) {
        return args -> {
            String hash = "$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2";

            // =====================================================================
            // STEP 1: Ensure SECURITY_AGENTS Role exists
            // =====================================================================
            Role securityRole = roleRepository.findByNomRole("SECURITY_AGENTS").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("SECURITY_AGENTS");
                return roleRepository.save(r);
            });

            // =====================================================================
            // STEP 1.5: Ensure SUPER_ADMIN Role and SP-SUPER user exist
            // =====================================================================
            Role superAdminRole = roleRepository.findByNomRole("SUPER_ADMIN").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("SUPER_ADMIN");
                return roleRepository.save(r);
            });

            if (userRepository.findByMatricule("SP-SUPER").isEmpty()) {
                Utilisateur superAdmin = new Utilisateur();
                superAdmin.setMatricule("SP-SUPER");
                superAdmin.setNom("System");
                superAdmin.setPrenom("Admin");
                superAdmin.setEmail("admin@somepharm.com");
                superAdmin.setMotDePasse(hash); // Maps to 'password123'
                superAdmin.setRole(superAdminRole);
                superAdmin.setStatutCompte("ACTIF");
                superAdmin.setSoldeConges(30.0);
                superAdmin.setMustChangePassword(false);
                userRepository.save(superAdmin);
            }

            // =====================================================================
            // STEP 2: Ensure SECURITE Department exists with auto-generated Poste
            // =====================================================================
            Departement secDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("SECURITE"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("SECURITE");
                    return departementService.createDepartement(nd);
                });

            // =====================================================================
            // STEP 3: Ensure RESSOURCES HUMAINES Department exists
            // =====================================================================
            Role rhAdminRole = roleRepository.findByNomRole("RH_ADMIN").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("RH_ADMIN");
                return roleRepository.save(r);
            });
            Role hrManagerRole = roleRepository.findByNomRole("HR_MANAGER").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("HR_MANAGER");
                return roleRepository.save(r);
            });

            Departement rhDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("RESSOURCES HUMAINES"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("RESSOURCES HUMAINES");
                    return departementService.createDepartement(nd); // auto-creates RESPONSABLE DE RESSOURCES HUMAINES poste
                });

            // =====================================================================
            // STEP 4: Assign SP-HRMGR as the manager of RESSOURCES HUMAINES
            //         and ensure all HR users have correct roles & department
            // =====================================================================
            Utilisateur hrmgr = userRepository.findByMatricule("SP-HRMGR").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setMatricule("SP-HRMGR");
                u.setNom("Manager");
                u.setPrenom("HR");
                u.setEmail("hrmgr@somepharm.com");
                u.setMotDePasse(hash);
                u.setStatutCompte("ACTIF");
                u.setSoldeConges(30.0);
                u.setMustChangePassword(false);
                return u;
            });
            
            // Always ensure role is correct for the HR manager account
            if (hrManagerRole != null) hrmgr.setRole(hrManagerRole);
            hrmgr.setManagerDirect(null);
            // Only assign dept/poste on first creation — do not override user-made changes
            if (hrmgr.getDepartement() == null) hrmgr.setDepartement(rhDept);
            if (hrmgr.getPoste() == null) hrmgr.setPoste(posteRepository.findByTitre("RESPONSABLE DE RESSOURCES HUMAINES").orElse(null));
            Utilisateur savedMgr = userRepository.save(hrmgr);

            // Only set as dept manager if none is assigned yet — never overwrite a user-made assignment
            if (rhDept.getManager() == null) {
                rhDept.setManager(savedMgr);
                departementRepository.save(rhDept);
            }

            // Ensure SP-HR is in the RESSOURCES HUMAINES department with RH_ADMIN role
            Utilisateur hr = userRepository.findByMatricule("SP-HR").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setMatricule("SP-HR");
                u.setNom("Admin");
                u.setPrenom("HR");
                u.setEmail("hr@somepharm.com");
                u.setMotDePasse(hash);
                u.setStatutCompte("ACTIF");
                u.setSoldeConges(30.0);
                u.setMustChangePassword(false);
                return u;
            });
            
            hr.setDepartement(rhDept);
            if (hr.getPoste() == null) hr.setPoste(posteRepository.findByTitre("EMP_RESSOURCES HUMAINES").orElse(null));
            if (rhAdminRole != null) hr.setRole(rhAdminRole);
            // Assign SP-HRMGR as direct manager
            hr.setManagerDirect(savedMgr);
            userRepository.save(hr);

            // =====================================================================
            // STEP 5: Seed generic employees (SP-EMP1 to SP-EMP10)
            // =====================================================================
            Role employeRole = roleRepository.findByNomRole("EMPLOYE").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("EMPLOYE");
                return roleRepository.save(r);
            });
            if (employeRole != null) {
                for (int i = 1; i <= 10; i++) {
                    String mat = "SP-EMP" + i;
                    if (userRepository.findByMatricule(mat).isEmpty()) {
                        Utilisateur u = new Utilisateur();
                        u.setMatricule(mat);
                        u.setNom("Employé");
                        u.setPrenom(String.valueOf(i));
                        u.setEmail("emp" + i + "@somepharm.com");
                        u.setMotDePasse(hash);
                        u.setRole(employeRole);
                        u.setStatutCompte("ACTIF");
                        u.setSoldeConges(30.0);
                        u.setMustChangePassword(false);
                        userRepository.save(u);
                    }
                }
            }

            // =====================================================================
            // STEP 6: Seed Security Agents (SP-SEC1 and SP-SEC2)
            // =====================================================================
            for (int i = 1; i <= 2; i++) {
                String mat = "SP-SEC" + i;
                if (userRepository.findByMatricule(mat).isEmpty()) {
                    Utilisateur u = new Utilisateur();
                    u.setMatricule(mat);
                    u.setNom("Agent Sécurité");
                    u.setPrenom(String.valueOf(i));
                    u.setEmail("sec" + i + "@somepharm.com");
                    u.setMotDePasse(hash);
                    u.setRole(securityRole);
                    u.setDepartement(secDept);
                    u.setPoste(posteRepository.findByTitre("EMP_SECURITE").orElse(null));
                    u.setStatutCompte("ACTIF");
                    u.setSoldeConges(30.0);
                    u.setMustChangePassword(false);
                    userRepository.save(u);
                }
            }
            // =====================================================================
            // STEP 7: Ensure VENTES Department exists and assign SP-EMP as Manager
            // =====================================================================
            Departement ventesDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("VENTES"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("VENTES");
                    return departementService.createDepartement(nd);
                });

            Utilisateur spEmp = userRepository.findByMatricule("SP-EMP").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setMatricule("SP-EMP");
                u.setNom("Responsable");
                u.setPrenom("Ventes");
                u.setEmail("ventes@somepharm.com");
                u.setMotDePasse(hash);
                u.setStatutCompte("ACTIF");
                u.setSoldeConges(30.0);
                u.setMustChangePassword(false);
                Role managerRole = roleRepository.findByNomRole("MANAGER").orElseGet(() -> {
                    Role r = new Role();
                    r.setNomRole("MANAGER");
                    return roleRepository.save(r);
                });
                u.setRole(managerRole);
                return u;
            });
            
            // Only assign dept/poste on first creation — do not override user-made changes
            if (spEmp.getDepartement() == null) spEmp.setDepartement(ventesDept);
            if (spEmp.getPoste() == null) spEmp.setPoste(posteRepository.findByTitre("RESPONSABLE DE VENTES").orElse(null));
            userRepository.save(spEmp);

            // Only set as dept manager if none is assigned yet — never overwrite a user-made assignment
            if (ventesDept.getManager() == null) {
                ventesDept.setManager(spEmp);
                departementRepository.save(ventesDept);
            }

            // Assign subordinates to SP-EMP (SP-EMP1, SP-EMP2, SP-EMP3) — only on first creation
            List.of("SP-EMP1", "SP-EMP2", "SP-EMP3").forEach(mat -> {
                userRepository.findByMatricule(mat).ifPresent(sub -> {
                    boolean changed = false;
                    if (sub.getManagerDirect() == null) { sub.setManagerDirect(spEmp); changed = true; }
                    if (sub.getDepartement() == null) { sub.setDepartement(ventesDept); changed = true; }
                    if (changed) userRepository.save(sub);

                    // Seed pointage for today if not present
                    java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
                    java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(23, 59, 59);
                    if (pointageRepository.findByEmploye_IdUserAndHorodatageBetween(sub.getIdUser(), startOfDay, endOfDay).isEmpty()) {
                        com.somepharm.hrportal.entity.Pointage p = new com.somepharm.hrportal.entity.Pointage();
                        p.setEmploye(sub);
                        p.setHorodatage(java.time.LocalDateTime.now().withHour(8).withMinute(5));
                        p.setTypePointage("ENTREE");
                        p.setMethode("WEB");
                        p.setStatut("OK");
                        pointageRepository.save(p);
                    }
                });
            });
        };
    }
}
