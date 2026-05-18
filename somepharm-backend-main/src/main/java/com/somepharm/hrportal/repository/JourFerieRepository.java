package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.JourFerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JourFerieRepository extends JpaRepository<JourFerie, Long> {
}
