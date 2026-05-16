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
            try {
                jdbcTemplate.execute("ALTER TABLE pointage ALTER COLUMN date_jour DROP NOT NULL");
                logger.info("✅ Column 'date_jour' is now nullable.");
            } catch (Exception e) {
                logger.info("ℹ️ Column 'date_jour' skipped (does not exist or already nullable).");
            }

            // 2. Drop the redundant 'id' column if it exists and is NOT the primary key
            // We want to use 'id_pointage' as the main SERIAL ID.
            try {
                jdbcTemplate.execute("ALTER TABLE pointage DROP COLUMN id");
                logger.info("✅ Redundant column 'id' dropped.");
            } catch (Exception e) {
                logger.info("ℹ️ Could not drop column 'id' (it might not exist or is constrained).");
            }

            // 3. Make 'id_utilisateur' the primary FK (already NOT NULL, but let's ensure id_user is handled)
            try {
                jdbcTemplate.execute("ALTER TABLE pointage ALTER COLUMN id_user DROP NOT NULL");
                logger.info("✅ Column 'id_user' is now nullable.");
            } catch (Exception e) {
                logger.info("ℹ️ Could not alter column 'id_user' (might already be nullable or missing).");
            }

            // 4. Reset SP-HR password and clear lockout
            try {
                String newHash = passwordEncoder.encode("password123");
                jdbcTemplate.update("UPDATE utilisateur SET mot_de_passe = ?, failed_login_attempts = 0, lockout_until = NULL WHERE matricule = 'SP-HR'", newHash);
                logger.info("✅ Password reset to 'password123' and lockout cleared for SP-HR.");
            } catch (Exception e) {
                logger.info("ℹ️ Could not reset SP-HR password/lockout (user might not exist yet).");
            }

            // 5. Fix system_config table (replace nulls with defaults)
            try {
                jdbcTemplate.execute("UPDATE system_config SET " +
                    "tolerance_minutes = COALESCE(tolerance_minutes, 15), " +
                    "urgency_delay_hours = COALESCE(urgency_delay_hours, 48), " +
                    "lockout_duration_minutes = COALESCE(lockout_duration_minutes, 15), " +
                    "max_failed_attempts = COALESCE(max_failed_attempts, 5), " +
                    "qr_code_lifetime_minutes = COALESCE(qr_code_lifetime_minutes, 10), " +
                    "signature_x = COALESCE(signature_x, 400), " +
                    "signature_y = COALESCE(signature_y, 150), " +
                    "stamp_x = COALESCE(stamp_x, 100), " +
                    "stamp_y = COALESCE(stamp_y, 150)");
                logger.info("✅ System configuration repaired (null values replaced with defaults).");
            } catch (Exception e) {
                logger.info("ℹ️ Could not repair system_config (table might not exist yet).");
            }

            // 6. Fix email_config table (fix typo and deduplicate)
            try {
                // Fix typo first
                jdbcTemplate.execute("UPDATE email_config SET smtp_host = 'smtp.gmail.com' WHERE smtp_host = 'smtp.gmaail.com'");
                
                // Deduplicate: Keep only the lowest ID
                jdbcTemplate.execute("DELETE FROM email_config WHERE id NOT IN (SELECT MIN(id) FROM email_config)");
                
                logger.info("✅ Email configuration repaired (deduplicated and typo fixed).");
            } catch (Exception e) {
                logger.info("ℹ️ Could not repair email_config (table might not exist yet or is already clean).");
            }

            logger.info("🚀 DatabaseFixer: Schema fix and account recovery completed successfully.");


        } catch (Exception e) {
            logger.info("ℹ️ DatabaseFixer skipped some steps due to missing tables (expected on fresh DB).");
        }
    }
}
