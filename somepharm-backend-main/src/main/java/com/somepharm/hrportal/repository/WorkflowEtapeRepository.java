package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.WorkflowEtape;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowEtapeRepository extends JpaRepository<WorkflowEtape, Long> {
    List<WorkflowEtape> findByCircuit_IdCircuitOrderByOrdreAsc(Long idCircuit);
}
