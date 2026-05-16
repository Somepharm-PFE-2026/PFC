package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.PdfErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PdfErrorLogRepository extends JpaRepository<PdfErrorLog, Long> {
    List<PdfErrorLog> findTop10ByOrderByTimestampDesc();
}
