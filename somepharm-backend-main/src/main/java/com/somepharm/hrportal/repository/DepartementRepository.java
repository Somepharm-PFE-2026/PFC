package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Departement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartementRepository extends JpaRepository<Departement, Long> {
    // Spring Data JPA automatically provides findAll(), save(), findById(), etc.
}