package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DemandeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.somepharm.hrportal.entity.Utilisateur;
import java.time.LocalDateTime;

@Repository
public interface DemandeDocumentRepository extends JpaRepository<DemandeDocument, Long> {
    List<DemandeDocument> findByDemandeur_Matricule(String matricule);
    
    List<DemandeDocument> findByDemandeurAndTypeDocumentAndDateSoumissionBetween(
        Utilisateur demandeur, 
        String typeDocument, 
        LocalDateTime start, 
        LocalDateTime end
    );
}
