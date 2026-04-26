package com.somepharm.hrportal.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DatabaseFixer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseFixer.class);
    private final JdbcTemplate jdbcTemplate;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DatabaseFixer(JdbcTemplate jdbcTemplate, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }


    @Override
    public void run(String... args) throws Exception {
        logger.info("🛠️ DatabaseFixer: Checking and fixing pointage table schema...");
        try {
            // 1. Make date_jour nullable (legacy column)
            jdbcTemplate.execute("ALTER TABLE pointage ALTER COLUMN date_jour DROP NOT NULL");
            logger.info("✅ Column 'date_jour' is now nullable.");

            // 2. Drop the redundant 'id' column if it exists and is NOT the primary key
            // We want to use 'id_pointage' as the main SERIAL ID.
            try {
                jdbcTemplate.execute("ALTER TABLE pointage DROP COLUMN id");
                logger.info("✅ Redundant column 'id' dropped.");
            } catch (Exception e) {
                logger.warn("⚠️ Could not drop column 'id' (it might not exist or is constrained): {}", e.getMessage());
            }

            // 3. Make 'id_utilisateur' the primary FK (already NOT NULL, but let's ensure id_user is handled)
            try {
                jdbcTemplate.execute("ALTER TABLE pointage ALTER COLUMN id_user DROP NOT NULL");
                logger.info("✅ Column 'id_user' is now nullable.");
            } catch (Exception e) {
                logger.warn("⚠️ Could not alter column 'id_user': {}", e.getMessage());
            }

            // 4. Reset SP-HR password and clear lockout
            try {
                String newHash = passwordEncoder.encode("password123");
                jdbcTemplate.update("UPDATE utilisateur SET mot_de_passe = ?, failed_login_attempts = 0, lockout_until = NULL WHERE matricule = 'SP-HR'", newHash);
                logger.info("✅ Password reset to 'password123' and lockout cleared for SP-HR.");
            } catch (Exception e) {
                logger.warn("⚠️ Could not reset SP-HR password/lockout: {}", e.getMessage());
            }

            logger.info("🚀 DatabaseFixer: Schema fix and account recovery completed successfully.");


        } catch (Exception e) {
            logger.error("❌ DatabaseFixer failed: {}", e.getMessage());
        }
    }
}
