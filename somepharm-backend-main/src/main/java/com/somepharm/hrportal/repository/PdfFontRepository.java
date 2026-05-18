package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.PdfFont;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PdfFontRepository extends JpaRepository<PdfFont, Long> {
}
