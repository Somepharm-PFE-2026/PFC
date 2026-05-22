package com.somepharm.hrportal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class BackupService {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPass;

    private static final String BACKUP_DIR = "backups";

    public String executeBackup() throws IOException, InterruptedException {
        // 1. Prepare Directory
        File directory = new File(BACKUP_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. Prepare Filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String dbName = extractDbName(dbUrl);
        String fileName = dbName + "_" + timestamp + ".sql";
        File backupFile = new File(directory, fileName);

        // 3. Prepare Command (Windows specific path found)
        String pgDumpPath = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe";
        // Fallback to "pg_dump" if the hardcoded path doesn't exist
        if (!new File(pgDumpPath).exists()) {
            pgDumpPath = "pg_dump"; 
        }

        ProcessBuilder pb = new ProcessBuilder(
            pgDumpPath,
            "--host", "localhost",
            "--port", extractPort(dbUrl),
            "--username", dbUser,
            "--format", "plain",
            "--file", backupFile.getAbsolutePath(),
            dbName
        );

        // Set Password via Environment Variable (Postgres standard)
        Map<String, String> env = pb.environment();
        env.put("PGPASSWORD", dbPass);

        // 4. Execute
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return backupFile.getAbsolutePath();
        } else {
            throw new IOException("pg_dump failed with exit code " + exitCode);
        }
    }

    private String extractPort(String url) {
        // jdbc:postgresql://localhost:5433/somepharm_hr_db?charSet=UTF-8
        int prefixIndex = url.indexOf("://");
        if (prefixIndex != -1) {
            String remainder = url.substring(prefixIndex + 3);
            int colonIndex = remainder.indexOf(":");
            int slashIndex = remainder.indexOf("/");
            if (colonIndex != -1 && colonIndex < slashIndex) {
                return remainder.substring(colonIndex + 1, slashIndex);
            }
        }
        return "5432"; // default fallback
    }

    private String extractDbName(String url) {
        // jdbc:postgresql://localhost:5432/somepharm_hr_db?charSet=UTF-8
        String name = url.substring(url.lastIndexOf("/") + 1);
        if (name.contains("?")) {
            name = name.substring(0, name.indexOf("?"));
        }
        return name;
    }
}
