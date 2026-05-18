package com.somepharm.hrportal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Fixes legacy NOT NULL constraints on columns that are no longer mapped by JPA entities.
 * Safe to run on every startup — silently ignores errors if already fixed.
 */
@Component
public class SchemaFixer {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void fixLegacyConstraints() {
        // id_role_validateur was an old FK; role_validateur (varchar) is now used instead.
        // The old column must be nullable so inserts don't fail.
        String sql = "ALTER TABLE workflow_etape ALTER COLUMN id_role_validateur DROP NOT NULL";
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (Exception ignored) {
            // Already nullable or column doesn't exist — safe to ignore
        }
    }
}
