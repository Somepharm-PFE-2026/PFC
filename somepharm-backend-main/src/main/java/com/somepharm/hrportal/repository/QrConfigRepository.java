package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.QrConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QrConfigRepository extends JpaRepository<QrConfig, Long> {
}
