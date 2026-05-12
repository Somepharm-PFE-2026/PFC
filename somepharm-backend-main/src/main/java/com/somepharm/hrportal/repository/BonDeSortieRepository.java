package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.BonDeSortie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BonDeSortieRepository extends JpaRepository<BonDeSortie, Long> {
    // Allows the scanner to find the pass using the QR code text
    Optional<BonDeSortie> findByTokenQr(String tokenQr);

    // Allows the system to find all passes that haven't returned yet
    List<BonDeSortie> findByStatut(String statut);

    boolean existsByIdRequeteOrigine(UUID idRequeteOrigine);

    Optional<BonDeSortie> findByIdRequeteOrigine(UUID idRequeteOrigine);
}