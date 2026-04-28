package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Requete;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequeteRepository extends JpaRepository<Requete, Long> {
    List<Requete> findTop5ByDemandeur_IdUserOrderByDateSoumissionDesc(Long idUser);
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Requete r JOIN FETCH r.demandeur WHERE r.statutCycleVie IN :statuses")
    List<Requete> findByStatutCycleVieIn(List<String> statuses);

    long countByStatutCycleVieIn(List<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Requete r WHERE r.statutCycleVie IN :statuses AND r.dateSoumission < :threshold")
    long countGlobalUrgentRequests(@org.springframework.data.repository.query.Param("statuses") List<String> statuses, 
                                 @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold);
}
