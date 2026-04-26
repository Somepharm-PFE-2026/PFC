package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.WorkflowMapping;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowMappingRepository extends JpaRepository<WorkflowMapping, Long> {
}
