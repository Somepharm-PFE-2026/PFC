package com.somepharm.hrportal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Fixes legacy NOT NULL constraints on columns that are no longer mapped by JPA entities.
 * Also ensures that missing soft-delete columns exist in PostgreSQL.
 * Safe to run on every startup — silently ignores errors if already fixed.
 */
@Component
public class SchemaFixer {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void fixLegacyConstraints() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            // 1. Drop old not null constraint
            try {
                String sql1 = "ALTER TABLE workflow_etape ALTER COLUMN id_role_validateur DROP NOT NULL";
                stmt.execute(sql1);
            } catch (Exception ignored) {}

            // 2. Add missing soft delete columns
            try {
                String sql2 = "ALTER TABLE DEPARTEMENT ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false";
                stmt.execute(sql2);
            } catch (Exception ignored) {}

            try {
                String sql3 = "ALTER TABLE UTILISATEUR ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false";
                stmt.execute(sql3);
            } catch (Exception ignored) {}

            try {
                String sql4 = "ALTER TABLE requete ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false";
                stmt.execute(sql4);
            } catch (Exception ignored) {}

            try {
                String sql5 = "ALTER TABLE type_conge DROP COLUMN IF EXISTS libelle CASCADE";
                stmt.execute(sql5);
            } catch (Exception ignored) {}

            // 3. Patch legacy rows where version or deleted columns are null
            try {
                String sql6 = "UPDATE UTILISATEUR SET version = 0 WHERE version IS NULL";
                stmt.execute(sql6);
            } catch (Exception ignored) {}

            try {
                String sql7 = "UPDATE UTILISATEUR SET deleted = false WHERE deleted IS NULL";
                stmt.execute(sql7);
            } catch (Exception ignored) {}

            try {
                String sql8 = "UPDATE DEPARTEMENT SET version = 0 WHERE version IS NULL";
                stmt.execute(sql8);
            } catch (Exception ignored) {}

            try {
                String sql9 = "UPDATE DEPARTEMENT SET deleted = false WHERE deleted IS NULL";
                stmt.execute(sql9);
            } catch (Exception ignored) {}

            try {
                String sql10 = "UPDATE requete SET version = 0 WHERE version IS NULL";
                stmt.execute(sql10);
            } catch (Exception ignored) {}

            try {
                String sql11 = "UPDATE requete SET deleted = false WHERE deleted IS NULL";
                stmt.execute(sql11);
            } catch (Exception ignored) {}

        } catch (Exception e) {
            System.err.println("SchemaFixer failed to check or apply schema patches: " + e.getMessage());
        }
    }
}


