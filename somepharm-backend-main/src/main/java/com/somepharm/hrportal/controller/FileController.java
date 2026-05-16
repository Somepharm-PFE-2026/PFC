package com.somepharm.hrportal.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads/communication")
@CrossOrigin(origins = "http://localhost:3000")
public class FileController {

    private final Path root = Paths.get("uploads/communication");

    public FileController() {
        try {
            Files.createDirectories(root);
            System.out.println("?? FileController: Root directory initialized at " + root.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("?? FileController: Could not initialize folder: " + e.getMessage());
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println("?? Received upload request for file: " + file.getOriginalFilename());
        try {
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path targetPath = this.root.resolve(filename);
            Files.copy(file.getInputStream(), targetPath);
            System.out.println("?? File saved successfully to " + targetPath.toAbsolutePath());
            return ResponseEntity.ok("/api/uploads/communication/download/" + filename);
        } catch (Exception e) {
            System.err.println("?? Upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body("Could not upload file: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path file = root.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read file!");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}
