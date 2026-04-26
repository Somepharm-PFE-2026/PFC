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
            com.somepharm.hrportal.service.DepartementService departementService) {
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
            Role rhAdminRole   = roleRepository.findByNomRole("RH_ADMIN").orElse(null);
            Role hrManagerRole = roleRepository.findByNomRole("HR_MANAGER").orElse(null);

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
            Optional<Utilisateur> hrmgrOpt = userRepository.findByMatricule("SP-HRMGR");
            hrmgrOpt.ifPresent(hrmgr -> {
                // Ensure SP-HRMGR is assigned to the RH department as manager
                hrmgr.setDepartement("RESSOURCES HUMAINES");
                hrmgr.setPoste("RESPONSABLE DE RESSOURCES HUMAINES");
                if (hrManagerRole != null) hrmgr.setRole(hrManagerRole);
                hrmgr.setManagerDirect(null); // Manager of the dept has no direct manager
                Utilisateur savedMgr = userRepository.save(hrmgr);

                // Set this person as the department manager if not already
                if (rhDept.getManager() == null || !rhDept.getManager().getIdUser().equals(savedMgr.getIdUser())) {
                    rhDept.setManager(savedMgr);
                    departementRepository.save(rhDept);
                }
            });

            // Ensure SP-HR is in the RESSOURCES HUMAINES department with RH_ADMIN role
            Optional<Utilisateur> hrOpt = userRepository.findByMatricule("SP-HR");
            hrOpt.ifPresent(hr -> {
                hr.setDepartement("RESSOURCES HUMAINES");
                if (hr.getPoste() == null || hr.getPoste().isBlank()) hr.setPoste("CHARGE RH");
                if (rhAdminRole != null) hr.setRole(rhAdminRole);
                // Assign SP-HRMGR as direct manager
                hrmgrOpt.ifPresent(hr::setManagerDirect);
                userRepository.save(hr);
            });

            // =====================================================================
            // STEP 5: Seed generic employees (SP-EMP1 to SP-EMP10)
            // =====================================================================
            Role employeRole = roleRepository.findByNomRole("EMPLOYE").orElse(null);
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
                    u.setDepartement(secDept.getNomDept());
                    u.setPoste("AGENT DE SECURITE");
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

            Optional<Utilisateur> spEmpOpt = userRepository.findByMatricule("SP-EMP");
            spEmpOpt.ifPresent(spEmp -> {
                spEmp.setDepartement("VENTES");
                spEmp.setPoste("RESPONSABLE DE VENTES");
                // Ensure the department manager is set
                if (ventesDept.getManager() == null || !ventesDept.getManager().getIdUser().equals(spEmp.getIdUser())) {
                    ventesDept.setManager(spEmp);
                    departementRepository.save(ventesDept);
                }
                userRepository.save(spEmp);

                // Assign subordinates to SP-EMP (SP-EMP1, SP-EMP2, SP-EMP3)
                List.of("SP-EMP1", "SP-EMP2", "SP-EMP3").forEach(mat -> {
                    userRepository.findByMatricule(mat).ifPresent(sub -> {
                        sub.setManagerDirect(spEmp);
                        sub.setDepartement("VENTES");
                        userRepository.save(sub);

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
            });
        };
    }
}
