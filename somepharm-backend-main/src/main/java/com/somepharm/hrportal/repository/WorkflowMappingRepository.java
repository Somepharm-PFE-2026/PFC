package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.WorkflowMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkflowMappingRepository extends JpaRepository<WorkflowMapping, Long> {
    Optional<WorkflowMapping> findByTypeRequete(String typeRequete);
    java.util.List<WorkflowMapping> findByCircuit_IdCircuit(Long idCircuit);
}
