package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {
    List<DocumentTemplate> findByCategorie(String categorie);
    List<DocumentTemplate> findByActiveTrue();
}
