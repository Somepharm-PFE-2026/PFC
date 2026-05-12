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
    List<Utilisateur> findByDepartement_NomDept(String nomDept);

    // --- DASHBOARD: Count team members for a manager ---
    long countByManagerDirect_IdUser(Long managerId);

    // --- DASHBOARD: List all team members ---
    List<Utilisateur> findAllByManagerDirect_IdUser(Long managerId);

    List<Utilisateur> findAllByDepartement_IdDept(Long idDept);

    long countByDepartement_IdDept(Long idDept);

    // --- DASHBOARD: Role distribution ---
    List<Utilisateur> findAllByOrderByRoleAsc();

    long countByDepartement_NomDept(String nomDept);

    long countByPoste_Titre(String titre);

    long countByStatutCompte(String statutCompte);

    long countByRole_NomRoleIgnoreCase(String nomRole);

    long countBySite_IdSite(Long idSite);
}