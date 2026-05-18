package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DemandeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DemandeCongeRepository extends JpaRepository<DemandeConge, UUID> {
    // This finds requests where the Demandeur's matricule matches the input
    List<DemandeConge> findByDemandeur_Matricule(String matricule);

    // --- DASHBOARD: Recent requests (Employee) ---
    List<DemandeConge> findTop3ByDemandeur_IdUserOrderByDateSoumissionDesc(Long idUser);

    // --- DASHBOARD: Pending for manager ---
    long countByDemandeur_ManagerDirect_IdUserAndStatutCycleVieIn(Long managerId, List<String> statuts);

    // --- DASHBOARD: Global pending for HR ---
    long countByStatutCycleVieIn(List<String> statuts);

    // --- ANALYTICS: Team Leaves in Range ---
    @Query("SELECT d FROM DemandeConge d WHERE d.demandeur.managerDirect.idUser = :managerId " +
           "AND (d.statutCycleVie = 'APPROUVE' OR d.statutCycleVie = 'APPROUVÉ') " +
           "AND d.dateDebut <= :endDate AND d.dateFin >= :startDate")
    List<DemandeConge> findApprovedTeamLeavesInRange(@Param("managerId") Long managerId, 
                                                   @Param("startDate") LocalDate startDate, 
                                                   @Param("endDate") LocalDate endDate);

    @Query("SELECT d FROM DemandeConge d WHERE d.demandeur.departement.idDept = :idDept " +
           "AND (d.statutCycleVie = 'APPROUVE' OR d.statutCycleVie = 'APPROUVÉ') " +
           "AND d.dateDebut <= :endDate AND d.dateFin >= :startDate")
    List<DemandeConge> findApprovedDeptLeavesInRange(@Param("idDept") Long idDept, 
                                                   @Param("startDate") LocalDate startDate, 
                                                   @Param("endDate") LocalDate endDate);

    // --- ANALYTICS: Global Leaves on Date ---
    @Query("SELECT COUNT(d) FROM DemandeConge d WHERE " +
           "(d.statutCycleVie = 'APPROUVE' OR d.statutCycleVie = 'APPROUVÉ') " +
           "AND d.dateDebut <= :targetDate AND d.dateFin >= :targetDate")
    long countGlobalApprovedLeavesOnDate(@Param("targetDate") LocalDate targetDate);

    // --- ANALYTICS: Count Urgent (>48h) ---
    @Query("SELECT COUNT(d) FROM DemandeConge d WHERE d.demandeur.managerDirect.idUser = :managerId " +
           "AND d.statutCycleVie = 'EN_ATTENTE_MANAGER' AND d.dateSoumission < :threshold")
    long countUrgentRequests(@Param("managerId") Long managerId, @Param("threshold") LocalDateTime threshold);

    @Query("SELECT COUNT(d) FROM DemandeConge d WHERE d.statutCycleVie IN :statuts AND d.dateSoumission < :threshold")
    long countGlobalUrgentRequests(@Param("statuts") List<String> statuts, @Param("threshold") LocalDateTime threshold);
}