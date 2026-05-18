package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.TypeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TypeCongeRepository extends JpaRepository<TypeConge, Long> {
    Optional<TypeConge> findByNom(String nom);
}
