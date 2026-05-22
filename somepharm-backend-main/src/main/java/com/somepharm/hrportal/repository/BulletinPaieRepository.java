package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.BulletinPaie;
import com.somepharm.hrportal.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BulletinPaieRepository extends JpaRepository<BulletinPaie, Long> {
    Optional<BulletinPaie> findByEmployeAndMoisAndAnnee(Utilisateur employe, int mois, int annee);
    
    // Get the most recent one
    Optional<BulletinPaie> findFirstByEmployeOrderByAnneeDescMoisDesc(Utilisateur employe);

    List<BulletinPaie> findByEmployeAndDatePublicationIsNotNullOrderByAnneeDescMoisDesc(Utilisateur employe);
}
