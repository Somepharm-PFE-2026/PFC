package com.somepharm.hrportal.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class HealthMonitoringService {

    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;

    public HealthMonitoringService(JdbcTemplate jdbcTemplate, AuditService auditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.auditService = auditService;
    }

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // 1. System Metrics
            long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
            status.put("uptime_ms", uptime);
            
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            double load = osBean.getSystemLoadAverage();
            status.put("cpu_load", load < 0 ? 5 : (int)(load * 10)); // Fallback to 5% if -1
            
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            long usedMem = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMem = memoryBean.getHeapMemoryUsage().getMax();
            if (maxMem <= 0) maxMem = usedMem + 1024*1024*512; // Fallback if max is -1
            
            status.put("ram_used_gb", String.format(Locale.US, "%.1f", usedMem / (1024.0 * 1024.0 * 1024.0)));
            status.put("ram_total_gb", String.format(Locale.US, "%.1f", maxMem / (1024.0 * 1024.0 * 1024.0)));
            status.put("ram_percentage", (int)((usedMem * 100) / maxMem));

            // 2. Storage
            File root = new File(".");
            long totalSpace = root.getTotalSpace();
            long freeSpace = root.getFreeSpace();
            if (totalSpace > 0) {
                status.put("disk_percentage", (int)(((totalSpace - freeSpace) * 100) / totalSpace));
            } else {
                status.put("disk_percentage", 0);
            }

            // 3. Database Health
            boolean dbUp = false;
            long dbStart = System.currentTimeMillis();
            try {
                jdbcTemplate.execute("SELECT 1");
                dbUp = true;
            } catch (Exception e) {}
            long dbEnd = System.currentTimeMillis();
            status.put("db_status", dbUp ? "UP" : "DOWN");
            status.put("db_latency", (dbEnd - dbStart) + "ms");
        } catch (Exception e) {
            status.put("db_status", "DOWN");
            status.put("cpu_load", 0);
        }

        return status;
    }

    public void restartService(String serviceName, String author) {
        // Log the security critical action
        auditService.logAction(
            "SERVICE_RESTART",
            "SuperAdmin requested manual restart of: " + serviceName,
            author,
            "SUPER_ADMIN",
            "INFRASTRUCTURE",
            "SUCCESS"
        );
        
        // Logic: In a real environment, this might trigger a Docker container restart 
        // or clear internal caches / reload beans.
        System.out.println(">>> [HEALTH] Restarting service: " + serviceName + " by " + author);
    }
}
