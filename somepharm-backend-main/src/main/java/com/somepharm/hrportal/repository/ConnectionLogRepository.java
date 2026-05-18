package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.ConnectionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConnectionLogRepository extends JpaRepository<ConnectionLog, Long> {
    List<ConnectionLog> findByMatriculeOrderByTimestampDesc(String matricule);
    List<ConnectionLog> findTop5ByMatriculeAndResultOrderByTimestampDesc(String matricule, String result);
}
