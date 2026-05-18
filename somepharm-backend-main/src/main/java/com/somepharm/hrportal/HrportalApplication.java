package com.somepharm.hrportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
@EnableScheduling // 🚀 THIS IS THE MAGIC LINE that enables your 16:30 Auto-Clôture task!
@EnableAsync      // 🚀 Enables background processing for Emails!
public class HrportalApplication {

	public static void main(String[] args) {
		SpringApplication.run(HrportalApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				System.out.println("Checking database schema for 'balance_deducted' column...");
				jdbcTemplate.execute("ALTER TABLE demande_conge ADD COLUMN IF NOT EXISTS balance_deducted BOOLEAN DEFAULT FALSE");
				System.out.println("✅ Database schema is up to date.");
			} catch (Exception e) {
				System.err.println("⚠️ Database update note: " + e.getMessage());
			}
		};
	}

}