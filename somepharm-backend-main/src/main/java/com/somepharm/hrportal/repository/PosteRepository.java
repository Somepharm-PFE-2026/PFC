package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Poste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PosteRepository extends JpaRepository<Poste, Long> {
    long countByDepartement_IdDept(Long idDept);
    Optional<Poste> findByTitre(String titre);
}
