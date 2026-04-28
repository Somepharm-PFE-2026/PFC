package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Departement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartementRepository extends JpaRepository<Departement, Long> {
    Optional<Departement> findByNomDept(String nomDept);
}