package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Annonce;
import com.somepharm.hrportal.entity.AnnonceLecture;
import com.somepharm.hrportal.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnnonceLectureRepository extends JpaRepository<AnnonceLecture, Long> {
    Optional<AnnonceLecture> findByAnnonceAndUtilisateur(Annonce annonce, Utilisateur utilisateur);
    long countByAnnonce(Annonce annonce);
}
