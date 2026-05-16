package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.DocumentTemplate;
import com.somepharm.hrportal.repository.DocumentTemplateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/document-templates")
@CrossOrigin(origins = "http://localhost:3000")
public class DocumentTemplateController {

    private final DocumentTemplateRepository repository;
    private final String uploadDir = "uploads/templates/";

    public DocumentTemplateController(DocumentTemplateRepository repository) {
        this.repository = repository;
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @GetMapping
    public List<DocumentTemplate> getAllTemplates() {
        return repository.findAll();
    }

    @PostMapping
    public DocumentTemplate createTemplate(@RequestBody DocumentTemplate template) {
        return repository.save(template);
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<DocumentTemplate> uploadTemplateFile(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        DocumentTemplate template = repository.findById(id).orElseThrow();
        
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(uploadDir).resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        template.setFileUrl(fileName);
        repository.save(template);
        
        return ResponseEntity.ok(template);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public DocumentTemplate updateTemplate(@PathVariable Long id, @RequestBody DocumentTemplate template) {
        template.setId(id);
        return repository.save(template);
    }
}
