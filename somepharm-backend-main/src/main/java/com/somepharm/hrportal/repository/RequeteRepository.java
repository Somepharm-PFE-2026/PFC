package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Requete;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequeteRepository extends JpaRepository<Requete, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Requete r JOIN FETCH r.demandeur d WHERE r.statutCycleVie NOT IN ('APPROUVÉ', 'REFUSÉ', 'ANNULÉ')")
    List<Requete> findAllPendingWithDetails();

    List<Requete> findTop5ByDemandeur_IdUserOrderByDateSoumissionDesc(Long idUser);
    List<Requete> findByCurrentCircuit_IdCircuit(Long idCircuit);
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Requete r JOIN FETCH r.demandeur WHERE r.statutCycleVie IN :statuses")
    List<Requete> findByStatutCycleVieIn(List<String> statuses);

    long countByStatutCycleVieIn(List<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.dateSoumission < :threshold")
    long countGlobalUrgentRequests(@org.springframework.data.repository.query.Param("statuses") List<String> statuses,
                                 @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);

    // Dashboard: pending count for a direct manager
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.demandeur.managerDirect.idUser = :managerId")
    long countPendingByManagerId(@org.springframework.data.repository.query.Param("statuses") List<String> statuses,
                                  @org.springframework.data.repository.query.Param("managerId") Long managerId);

    // Dashboard: urgent pending count for a direct manager (old requests or flagged urgent)
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.demandeur.managerDirect.idUser = :managerId AND (r.isUrgent = true OR r.dateSoumission < :threshold)")
    long countUrgentPendingByManagerId(@org.springframework.data.repository.query.Param("statuses") List<String> statuses,
                                        @org.springframework.data.repository.query.Param("managerId") Long managerId,
                                        @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);

    // Dashboard: pending count for a department (chef de département)
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.demandeur.departement.idDept = :deptId")
    long countPendingByDeptId(@org.springframework.data.repository.query.Param("statuses") List<String> statuses,
                               @org.springframework.data.repository.query.Param("deptId") Long deptId);

    // Dashboard: urgent pending count for a department
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.demandeur.departement.idDept = :deptId AND (r.isUrgent = true OR r.dateSoumission < :threshold)")
    long countUrgentPendingByDeptId(@org.springframework.data.repository.query.Param("statuses") List<String> statuses,
                                     @org.springframework.data.repository.query.Param("deptId") Long deptId,
                                     @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);
}
