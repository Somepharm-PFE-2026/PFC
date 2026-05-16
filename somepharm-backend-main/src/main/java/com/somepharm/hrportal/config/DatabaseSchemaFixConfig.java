package com.somepharm.hrportal.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseSchemaFixConfig {

    @Bean
    public CommandLineRunner fixSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("[SCHEMA] Checking QR_CONFIG table...");
                jdbcTemplate.execute("ALTER TABLE qr_config ADD COLUMN IF NOT EXISTS max_alert_margin_seconds INTEGER DEFAULT 600;");
                System.out.println("[SCHEMA] QR_CONFIG table verified/updated successfully.");
            } catch (Exception e) {
                System.err.println("[SCHEMA] Error updating QR_CONFIG table: " + e.getMessage());
            }
        };
    }
}
