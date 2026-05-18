package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.AuditLog;
import com.somepharm.hrportal.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logAction(String type, String description, String author, String role, String target, String result) {
        auditLogRepository.save(new AuditLog(type, description, author, role, target, result));
    }

    public void logAction(String type, String description, String author) {
        logAction(type, description, author, "UNKNOWN", "SYSTEM", "SUCCESS");
    }

    public void logFailure(String type, String description, String author, String role, String target) {
        logAction(type, description, author, role, target, "FAILURE");
    }

    public void logSuccess(String type, String description, String author, String role, String target) {
        logAction(type, description, author, role, target, "SUCCESS");
    }
}
