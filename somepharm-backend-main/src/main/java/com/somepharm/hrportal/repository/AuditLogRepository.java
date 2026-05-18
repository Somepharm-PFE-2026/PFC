package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByAuteurOrderByTimestampDesc(String auteur);
    List<AuditLog> findTop10ByOrderByTimestampDesc();
    long countByTimestampAfterAndTypeAction(java.time.LocalDateTime timestamp, String typeAction);
    long countByTimestampAfterAndTypeActionAndResult(java.time.LocalDateTime timestamp, String typeAction, String result);
    void deleteByTimestampBefore(java.time.LocalDateTime timestamp);
}
