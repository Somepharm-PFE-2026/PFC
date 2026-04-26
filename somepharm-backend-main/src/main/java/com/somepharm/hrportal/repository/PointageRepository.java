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

    long countByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(LocalDateTime start, LocalDateTime end, Long managerId);

    List<Pointage> findAllByHorodatageBetweenAndEmploye_ManagerDirect_IdUser(LocalDateTime start, LocalDateTime end, Long managerId);

    List<Pointage> findByHorodatageBetween(LocalDateTime start, LocalDateTime end);

    List<Pointage> findByEmploye_IdUserAndHorodatageBetween(Long idUser, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.employe.departement = :dept AND p.horodatage BETWEEN :start AND :end")
    List<Pointage> findByDepartementAndDateRange(@Param("dept") String departement, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Pointage p WHERE p.horodatage BETWEEN :start AND :end AND p.statut = 'ANOMALIE'")
    List<Pointage> findAnomaliesByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Optional<Pointage> findTopByEmploye_MatriculeAndHorodatageBetweenOrderByHorodatageDesc(String matricule, LocalDateTime start, LocalDateTime end);
}