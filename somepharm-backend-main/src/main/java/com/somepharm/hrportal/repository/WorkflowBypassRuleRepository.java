package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.WorkflowBypassRule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowBypassRuleRepository extends JpaRepository<WorkflowBypassRule, Long> {
}
