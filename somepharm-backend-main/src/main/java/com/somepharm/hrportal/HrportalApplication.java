package com.somepharm.hrportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 🚀 THIS IS THE MAGIC LINE that enables your 16:30 Auto-Clôture task!
public class HrportalApplication {

	public static void main(String[] args) {
		SpringApplication.run(HrportalApplication.class, args);
	}

}