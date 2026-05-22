package com.somepharm.hrportal.config;

import com.somepharm.hrportal.entity.TypeConge;
import com.somepharm.hrportal.repository.TypeCongeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 🚀 DATABASE INITIALIZER
 * Pre-populates the TypeConge table with official SomePharm categories.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(com.somepharm.hrportal.repository.UtilisateurRepository userRepo, 
                                com.somepharm.hrportal.repository.RoleRepository roleRepo,
                                org.springframework.security.crypto.password.PasswordEncoder encoder) {
        return args -> {
            // 1. Initialize Roles
            List<String> roles = List.of("RH_ADMIN", "MANAGER", "EMPLOYE", "SUPER_ADMIN", "HR_MANAGER", "SECURITY_AGENTS", "CHEF_DEPARTEMENT");
            for (String roleName : roles) {
                if (roleRepo.findByNomRole(roleName).isEmpty()) {
                    com.somepharm.hrportal.entity.Role role = new com.somepharm.hrportal.entity.Role();
                    role.setNomRole(roleName);
                    roleRepo.save(role);
                    System.out.println("✅ ROLE: " + roleName + " initialized.");
                }
            }

            // 2. Initialize HR Manager User
            if (userRepo.findByMatricule("SP-HRMGR").isEmpty()) {
                createTestUser(userRepo, roleRepo, encoder, "SP-HRMGR", "HR", "Manager", "hrmanager@somepharm.dz", "HR_MANAGER");
            }

            // 5. Initialize Super Admin
            if (userRepo.findByMatricule("SP-ADMIN").isEmpty()) {
                createTestUser(userRepo, roleRepo, encoder, "SP-ADMIN", "Admin", "System", "admin@somepharm.dz", "SUPER_ADMIN");
            }
        };
    }

    private void createTestUser(com.somepharm.hrportal.repository.UtilisateurRepository userRepo, 
                                com.somepharm.hrportal.repository.RoleRepository roleRepo,
                                org.springframework.security.crypto.password.PasswordEncoder encoder,
                                String matricule, String prenom, String nom, String email, String roleName) {
        com.somepharm.hrportal.entity.Role role = roleRepo.findByNomRole(roleName)
                .orElseThrow(() -> new RuntimeException("Role " + roleName + " not found"));
        
        com.somepharm.hrportal.entity.Utilisateur user = new com.somepharm.hrportal.entity.Utilisateur();
        user.setMatricule(matricule);
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setEmail(email);
        user.setMotDePasse(encoder.encode("password123"));
        user.setRole(role);
        user.setStatutCompte("ACTIF");
        user.setMustChangePassword(false);
        user.setSoldeConges(30.0);
        
        userRepo.save(user);
        System.out.println("✅ USER: " + matricule + " (" + roleName + ") created with password: password123");
    }

    @Bean
    CommandLineRunner initTypeConges(TypeCongeRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                List<TypeConge> types = List.of(
                    new TypeConge("Congé Annuel", 30, false, "#3B82F6", "Droit standard acquis après 12 mois de service."),
                    new TypeConge("Maladie", 0, true, "#EF4444", "Déclaration obligatoire dans les 48h avec certificat médical."),
                    new TypeConge("Maternité / Paternité", 98, true, "#EC4899", "98 jours pour maternité, 3 jours pour paternité."),
                    new TypeConge("Mariage", 3, true, "#F59E0B", "Soumis à la présentation d'un acte de mariage officiel."),
                    new TypeConge("Naissance", 3, true, "#8B5CF6", "Pour le père de famille, à prendre dans les 15 jours."),
                    new TypeConge("Décès", 3, true, "#6B7280", "Ascendants, descendants ou conjoint (3 jours)."),
                    new TypeConge("Récupération", 0, false, "#10B981", "Compensation des heures supplémentaires effectuées."),
                    new TypeConge("Pèlerinage", 30, true, "#059669", "Une fois dans la carrière pour le Hadj (Titre de transport requis)."),
                    new TypeConge("Congé Sans Solde", 0, false, "#94A3B8", "Absence exceptionnelle non rémunérée.")
                );
                repository.saveAll(types);
                System.out.println("✅ MASTER DATA: TypeConge initialized with " + types.size() + " categories.");
            }
        };
    }
}
