package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    @EntityGraph(attributePaths = {"role"})
    Optional<Utilisateur> findByMatricule(String matricule);

    // --- NEW: Custom query to filter users by their department (For the Manager Role) ---
    List<Utilisateur> findByDepartement(String departement);

    // --- DASHBOARD: Count team members for a manager ---
    long countByManagerDirect_IdUser(Long managerId);

    // --- DASHBOARD: List all team members ---
    List<Utilisateur> findAllByManagerDirect_IdUser(Long managerId);

    // --- DASHBOARD: Role distribution ---
    List<Utilisateur> findAllByOrderByRoleAsc();

    long countByDepartement(String departement);

    long countByPoste(String poste);

    long countByStatutCompte(String statutCompte);
}