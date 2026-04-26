package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DocumentEntreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentEntrepriseRepository extends JpaRepository<DocumentEntreprise, Long> {
    List<DocumentEntreprise> findByCategorieOrderByDatePublicationDesc(String categorie);
}
