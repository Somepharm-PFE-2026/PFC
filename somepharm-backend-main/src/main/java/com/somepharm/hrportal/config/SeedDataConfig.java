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
            com.somepharm.hrportal.repository.PosteRepository posteRepository,
            com.somepharm.hrportal.repository.SiteRepository siteRepository) {
        return args -> {
            String hash = "$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2"; // 'password123'

            // =====================================================================
            // STEP 1: Ensure Roles exist
            // =====================================================================
            Role superAdminRole = roleRepository.findByNomRole("SUPER_ADMIN").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("SUPER_ADMIN");
                return roleRepository.save(r);
            });
            Role hrManagerRole = roleRepository.findByNomRole("HR_MANAGER").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("HR_MANAGER");
                return roleRepository.save(r);
            });
            Role rhAdminRole = roleRepository.findByNomRole("RH_ADMIN").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("RH_ADMIN");
                return roleRepository.save(r);
            });
            Role managerRole = roleRepository.findByNomRole("MANAGER").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("MANAGER");
                return roleRepository.save(r);
            });
            Role employeRole = roleRepository.findByNomRole("EMPLOYE").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("EMPLOYE");
                return roleRepository.save(r);
            });
            Role securityRole = roleRepository.findByNomRole("SECURITY_AGENTS").orElseGet(() -> {
                Role r = new Role();
                r.setNomRole("SECURITY_AGENTS");
                return roleRepository.save(r);
            });

            // =====================================================================
            // STEP 1.5: Seed SUPER_ADMIN User
            // =====================================================================
            if (userRepository.findByMatricule("SP-SUPER").isEmpty()) {
                Utilisateur superAdmin = new Utilisateur();
                superAdmin.setMatricule("SP-SUPER");
                superAdmin.setNom("System");
                superAdmin.setPrenom("Admin");
                superAdmin.setEmail("admin@somepharm.com");
                superAdmin.setMotDePasse(hash);
                superAdmin.setRole(superAdminRole);
                superAdmin.setStatutCompte("ACTIF");
                superAdmin.setSoldeConges(30.0);
                superAdmin.setMustChangePassword(false);
                userRepository.save(superAdmin);
            }

            // =====================================================================
            // STEP 2: Ensure Departments exist
            // =====================================================================
            Departement rhDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("RESSOURCES HUMAINES"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("RESSOURCES HUMAINES");
                    return departementService.createDepartement(nd);
                });

            Departement ventesDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("VENTES"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("VENTES");
                    return departementService.createDepartement(nd);
                });

            Departement comptaDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("COMPTABLE"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("COMPTABLE");
                    return departementService.createDepartement(nd);
                });

            Departement secDept = departementRepository.findAll().stream()
                .filter(d -> d.getNomDept().equalsIgnoreCase("SECURITE"))
                .findFirst()
                .orElseGet(() -> {
                    Departement nd = new Departement();
                    nd.setNomDept("SECURITE");
                    return departementService.createDepartement(nd);
                });

            // Get default site
            com.somepharm.hrportal.entity.Site defaultSite = siteRepository.findAll().stream().findFirst().orElse(null);

            // =====================================================================
            // STEP 3: Seed / Update Yasmin Benali (SP-HRMGR) & Meriem Bouaza (SP-HR)
            // =====================================================================
            Utilisateur hrmgr = userRepository.findByMatricule("SP-HRMGR").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(1L);
                u.setMatricule("SP-HRMGR");
                return u;
            });
            hrmgr.setPrenom("Yasmin");
            hrmgr.setNom("Benali");
            hrmgr.setEmail("y.benali@somepharm.dz");
            hrmgr.setMotDePasse(hash);
            hrmgr.setStatutCompte("ACTIF");
            hrmgr.setMustChangePassword(false);
            hrmgr.setRole(hrManagerRole);
            hrmgr.setDepartement(rhDept);
            hrmgr.setPoste(posteRepository.findByTitre("RESPONSABLE DE RESSOURCES HUMAINES").orElse(null));
            hrmgr.setTelephone("0550123456");
            hrmgr.setDateNaissance(java.time.LocalDate.of(1985, 6, 15));
            hrmgr.setDateEmbauche(java.time.LocalDate.of(2018, 3, 10));
            hrmgr.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            hrmgr.setSoldeConges(28.5);
            hrmgr.setContactUrgence("Karim Benali (Epoux) - 0550987654");
            hrmgr.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Yasmin");
            hrmgr.setSite(defaultSite);
            Utilisateur savedHrmgr = userRepository.save(hrmgr);

            if (rhDept.getManager() == null || !savedHrmgr.equals(rhDept.getManager())) {
                rhDept.setManager(savedHrmgr);
                departementRepository.save(rhDept);
            }

            Utilisateur hr = userRepository.findByMatricule("SP-HR").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(6L);
                u.setMatricule("SP-HR");
                return u;
            });
            hr.setPrenom("Meriem");
            hr.setNom("Bouaza");
            hr.setEmail("m.bouaza@somepharm.dz");
            hr.setMotDePasse(hash);
            hr.setStatutCompte("ACTIF");
            hr.setMustChangePassword(false);
            hr.setRole(rhAdminRole);
            hr.setDepartement(rhDept);
            hr.setPoste(posteRepository.findByTitre("EMP_RESSOURCES HUMAINES").orElse(null));
            hr.setTelephone("0661987654");
            hr.setDateNaissance(java.time.LocalDate.of(1992, 9, 22));
            hr.setDateEmbauche(java.time.LocalDate.of(2021, 6, 1));
            hr.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.CELIBATAIRE);
            hr.setSoldeConges(22.0);
            hr.setContactUrgence("Ahmed Bouaza (Père) - 0661123456");
            hr.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Meriem");
            hr.setManagerDirect(savedHrmgr);
            hr.setSite(defaultSite);
            userRepository.save(hr);

            // =====================================================================
            // STEP 4: Seed Sales Department Profiles
            // =====================================================================
            Utilisateur mgrVentes = userRepository.findByMatricule("SP-MGR-VENTES").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(31L);
                u.setMatricule("SP-MGR-VENTES");
                return u;
            });
            mgrVentes.setPrenom("Sofiane");
            mgrVentes.setNom("Hamdi");
            mgrVentes.setEmail("s.hamdi@somepharm.dz");
            mgrVentes.setMotDePasse(hash);
            mgrVentes.setStatutCompte("ACTIF");
            mgrVentes.setMustChangePassword(false);
            mgrVentes.setRole(managerRole);
            mgrVentes.setDepartement(ventesDept);
            mgrVentes.setPoste(posteRepository.findByTitre("RESPONSABLE DE VENTES").orElse(null));
            mgrVentes.setTelephone("0770123456");
            mgrVentes.setDateNaissance(java.time.LocalDate.of(1982, 11, 4));
            mgrVentes.setDateEmbauche(java.time.LocalDate.of(2015, 5, 15));
            mgrVentes.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            mgrVentes.setSoldeConges(30.0);
            mgrVentes.setContactUrgence("Nadia Hamdi (Epouse) - 0770987654");
            mgrVentes.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Sofiane");
            mgrVentes.setSite(defaultSite);
            Utilisateur savedMgrVentes = userRepository.save(mgrVentes);

            if (ventesDept.getManager() == null || !savedMgrVentes.equals(ventesDept.getManager())) {
                ventesDept.setManager(savedMgrVentes);
                departementRepository.save(ventesDept);
            }

            Utilisateur empVentes1 = userRepository.findByMatricule("SP-EMP-VENTES1").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(32L);
                u.setMatricule("SP-EMP-VENTES1");
                return u;
            });
            empVentes1.setPrenom("Amel");
            empVentes1.setNom("Chaoui");
            empVentes1.setEmail("a.chaoui@somepharm.dz");
            empVentes1.setMotDePasse(hash);
            empVentes1.setStatutCompte("ACTIF");
            empVentes1.setMustChangePassword(false);
            empVentes1.setRole(employeRole);
            empVentes1.setDepartement(ventesDept);
            empVentes1.setPoste(posteRepository.findByTitre("EMP_VENTES").orElse(null));
            empVentes1.setTelephone("0555321456");
            empVentes1.setDateNaissance(java.time.LocalDate.of(1995, 4, 18));
            empVentes1.setDateEmbauche(java.time.LocalDate.of(2022, 1, 10));
            empVentes1.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.CELIBATAIRE);
            empVentes1.setSoldeConges(30.0);
            empVentes1.setContactUrgence("Fatma Chaoui (Mère) - 0555987654");
            empVentes1.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Amel");
            empVentes1.setManagerDirect(savedMgrVentes);
            empVentes1.setSite(defaultSite);
            userRepository.save(empVentes1);

            Utilisateur empVentes2 = userRepository.findByMatricule("SP-EMP-VENTES2").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(33L);
                u.setMatricule("SP-EMP-VENTES2");
                return u;
            });
            empVentes2.setPrenom("Fares");
            empVentes2.setNom("Bensemra");
            empVentes2.setEmail("f.bensemra@somepharm.dz");
            empVentes2.setMotDePasse(hash);
            empVentes2.setStatutCompte("ACTIF");
            empVentes2.setMustChangePassword(false);
            empVentes2.setRole(employeRole);
            empVentes2.setDepartement(ventesDept);
            empVentes2.setPoste(posteRepository.findByTitre("EMP_VENTES").orElse(null));
            empVentes2.setTelephone("0662456789");
            empVentes2.setDateNaissance(java.time.LocalDate.of(1989, 8, 30));
            empVentes2.setDateEmbauche(java.time.LocalDate.of(2019, 9, 1));
            empVentes2.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            empVentes2.setSoldeConges(30.0);
            empVentes2.setContactUrgence("Lina Bensemra (Epouse) - 0662987654");
            empVentes2.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Fares");
            empVentes2.setManagerDirect(savedMgrVentes);
            empVentes2.setSite(defaultSite);
            userRepository.save(empVentes2);

            // =====================================================================
            // STEP 5: Seed Finance Department Profiles
            // =====================================================================
            Utilisateur mgrCompta = userRepository.findByMatricule("SP-MGR-COMPTA").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(34L);
                u.setMatricule("SP-MGR-COMPTA");
                return u;
            });
            mgrCompta.setPrenom("Nassima");
            mgrCompta.setNom("Haddad");
            mgrCompta.setEmail("n.haddad@somepharm.dz");
            mgrCompta.setMotDePasse(hash);
            mgrCompta.setStatutCompte("ACTIF");
            mgrCompta.setMustChangePassword(false);
            mgrCompta.setRole(managerRole);
            mgrCompta.setDepartement(comptaDept);
            mgrCompta.setPoste(posteRepository.findByTitre("RESPONSABLE DE COMPTABLE").orElse(null));
            mgrCompta.setTelephone("0552789123");
            mgrCompta.setDateNaissance(java.time.LocalDate.of(1980, 3, 25));
            mgrCompta.setDateEmbauche(java.time.LocalDate.of(2014, 2, 1));
            mgrCompta.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            mgrCompta.setSoldeConges(30.0);
            mgrCompta.setContactUrgence("Rachid Haddad (Epoux) - 0552987654");
            mgrCompta.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Nassima");
            mgrCompta.setSite(defaultSite);
            Utilisateur savedMgrCompta = userRepository.save(mgrCompta);

            if (comptaDept.getManager() == null || !savedMgrCompta.equals(comptaDept.getManager())) {
                comptaDept.setManager(savedMgrCompta);
                departementRepository.save(comptaDept);
            }

            Utilisateur empCompta = userRepository.findByMatricule("SP-EMP-COMPTA").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(35L);
                u.setMatricule("SP-EMP-COMPTA");
                return u;
            });
            empCompta.setPrenom("Yacine");
            empCompta.setNom("Brahimi");
            empCompta.setEmail("y.brahimi@somepharm.dz");
            empCompta.setMotDePasse(hash);
            empCompta.setStatutCompte("ACTIF");
            empCompta.setMustChangePassword(false);
            empCompta.setRole(employeRole);
            empCompta.setDepartement(comptaDept);
            empCompta.setPoste(posteRepository.findByTitre("EMP_COMPTABLE").orElse(null));
            empCompta.setTelephone("0775654321");
            empCompta.setDateNaissance(java.time.LocalDate.of(1993, 7, 12));
            empCompta.setDateEmbauche(java.time.LocalDate.of(2020, 11, 15));
            empCompta.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.CELIBATAIRE);
            empCompta.setSoldeConges(30.0);
            empCompta.setContactUrgence("Omar Brahimi (Frère) - 0775123456");
            empCompta.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Yacine");
            empCompta.setManagerDirect(savedMgrCompta);
            empCompta.setSite(defaultSite);
            userRepository.save(empCompta);

            // =====================================================================
            // STEP 6: Seed Security Department Profiles
            // =====================================================================
            Utilisateur mgrSec = userRepository.findByMatricule("SP-MGR-SEC").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(36L);
                u.setMatricule("SP-MGR-SEC");
                return u;
            });
            mgrSec.setPrenom("Mustapha");
            mgrSec.setNom("Khelifi");
            mgrSec.setEmail("m.khelifi@somepharm.dz");
            mgrSec.setMotDePasse(hash);
            mgrSec.setStatutCompte("ACTIF");
            mgrSec.setMustChangePassword(false);
            mgrSec.setRole(managerRole);
            mgrSec.setDepartement(secDept);
            mgrSec.setPoste(posteRepository.findByTitre("RESPONSABLE DE SECURITE").orElse(null));
            mgrSec.setTelephone("0660456123");
            mgrSec.setDateNaissance(java.time.LocalDate.of(1976, 5, 2));
            mgrSec.setDateEmbauche(java.time.LocalDate.of(2010, 10, 1));
            mgrSec.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            mgrSec.setSoldeConges(30.0);
            mgrSec.setContactUrgence("Khadidja Khelifi (Epouse) - 0660987654");
            mgrSec.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Mustapha");
            mgrSec.setSite(defaultSite);
            Utilisateur savedMgrSec = userRepository.save(mgrSec);

            if (secDept.getManager() == null || !savedMgrSec.equals(secDept.getManager())) {
                secDept.setManager(savedMgrSec);
                departementRepository.save(secDept);
            }

            Utilisateur sec1 = userRepository.findByMatricule("SP-SEC1").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(37L);
                u.setMatricule("SP-SEC1");
                return u;
            });
            sec1.setPrenom("Kamel");
            sec1.setNom("Zeroual");
            sec1.setEmail("k.zeroual@somepharm.dz");
            sec1.setMotDePasse(hash);
            sec1.setStatutCompte("ACTIF");
            sec1.setMustChangePassword(false);
            sec1.setRole(securityRole);
            sec1.setDepartement(secDept);
            sec1.setPoste(posteRepository.findByTitre("EMP_SECURITE").orElse(null));
            sec1.setTelephone("0559123456");
            sec1.setDateNaissance(java.time.LocalDate.of(1984, 1, 20));
            sec1.setDateEmbauche(java.time.LocalDate.of(2017, 4, 15));
            sec1.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            sec1.setSoldeConges(30.0);
            sec1.setContactUrgence("Fatiha Zeroual (Epouse) - 0559987654");
            sec1.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Kamel");
            sec1.setManagerDirect(savedMgrSec);
            sec1.setSite(defaultSite);
            userRepository.save(sec1);

            Utilisateur sec2 = userRepository.findByMatricule("SP-SEC2").orElseGet(() -> {
                Utilisateur u = new Utilisateur();
                u.setIdUser(38L);
                u.setMatricule("SP-SEC2");
                return u;
            });
            sec2.setPrenom("Redouane");
            sec2.setNom("Djeffal");
            sec2.setEmail("r.djeffal@somepharm.dz");
            sec2.setMotDePasse(hash);
            sec2.setStatutCompte("ACTIF");
            sec2.setMustChangePassword(false);
            sec2.setRole(securityRole);
            sec2.setDepartement(secDept);
            sec2.setPoste(posteRepository.findByTitre("EMP_SECURITE").orElse(null));
            sec2.setTelephone("0663789456");
            sec2.setDateNaissance(java.time.LocalDate.of(1987, 12, 5));
            sec2.setDateEmbauche(java.time.LocalDate.of(2019, 6, 1));
            sec2.setSituationFamiliale(com.somepharm.hrportal.entity.SituationFamiliale.MARIE);
            sec2.setSoldeConges(30.0);
            sec2.setContactUrgence("Zahra Djeffal (Mère) - 0663987654");
            sec2.setPhotoUrl("https://api.dicebear.com/7.x/adventurer/svg?seed=Redouane");
            sec2.setManagerDirect(savedMgrSec);
            sec2.setSite(defaultSite);
            userRepository.save(sec2);

            // =====================================================================
            // STEP 7: Seed Daily Pointage for employees if missing for today
            // =====================================================================
            List.of(empVentes1, empVentes2, empCompta, sec1, sec2).forEach(sub -> {
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
        };
    }
}
