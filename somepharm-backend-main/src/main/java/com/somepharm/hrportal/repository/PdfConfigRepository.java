package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.PdfConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PdfConfigRepository extends JpaRepository<PdfConfig, Long> {
}
