package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DbBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DbBackupRepository extends JpaRepository<DbBackup, Long> {
    List<DbBackup> findTop10ByOrderByTimestampDesc();
}
