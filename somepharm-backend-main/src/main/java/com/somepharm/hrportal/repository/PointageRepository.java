package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Pointage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {

    long countByHorodatageBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT p.employe.idUser) FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.typePointage = 'ENTREE'")
    long countDistinctPresentByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Count distinct employees who have an ENTREE record today (for manager team)
    @Query("SELECT COUNT(DISTINCT p.employe.idUser) FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.employe.managerDirect.idUser = :managerId AND p.typePointage = 'ENTREE'")
    long countDistinctPresentByManagerAndDate(@Param("managerId") Long managerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Count distinct employees who have an ENTREE record today (for chef de département)
    @Query("SELECT COUNT(DISTINCT p.employe.idUser) FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.employe.departement.idDept = :idDept AND p.typePointage = 'ENTREE'")
    long countDistinctPresentByDeptAndDate(@Param("idDept") Long idDept, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // ENTREE records only (for late alert detection)
    @Query("SELECT p FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.employe.departement.idDept = :idDept AND p.typePointage = 'ENTREE'")
    List<Pointage> findEntreesByDeptAndDate(@Param("idDept") Long idDept, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.employe.managerDirect.idUser = :managerId AND p.typePointage = 'ENTREE'")
    List<Pointage> findEntreesByManagerAndDate(@Param("managerId") Long managerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Kept for matricule-presence checks (fetches all records to derive distinct matricules)
    List<Pointage> findAllByHorodatageBetweenAndEmploye_Departement_IdDept(LocalDateTime start, LocalDateTime end, Long idDept);

    List<Pointage> findAllByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(LocalDateTime start, LocalDateTime end, Long managerId);

    List<Pointage> findByHorodatageBetween(LocalDateTime start, LocalDateTime end);

    List<Pointage> findByEmploye_IdUserAndHorodatageBetween(Long idUser, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.employe.departement = :dept AND p.horodatage BETWEEN :start AND :end")
    List<Pointage> findByDepartementAndDateRange(@Param("dept") String departement, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.statut = 'ANOMALIE'")
    List<Pointage> findAnomaliesByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND (LOWER(p.employe.matricule) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.employe.nom) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.employe.prenom) LIKE LOWER(CONCAT('%', :term, '%')))")
    List<Pointage> searchByTermAndDateRange(@Param("term") String term, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Optional<Pointage> findTopByEmploye_MatriculeAndHorodatageBetweenOrderByHorodatageDesc(String matricule, LocalDateTime start, LocalDateTime end);
}