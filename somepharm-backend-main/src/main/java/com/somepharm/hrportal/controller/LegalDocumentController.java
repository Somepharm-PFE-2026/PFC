package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.DocumentEntreprise;
import com.somepharm.hrportal.repository.DocumentEntrepriseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/documents-officiels")
@CrossOrigin(origins = "http://localhost:3000")
public class LegalDocumentController {

    private final DocumentEntrepriseRepository documentRepository;

    public LegalDocumentController(DocumentEntrepriseRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @GetMapping
    public ResponseEntity<List<DocumentEntreprise>> getAll() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @GetMapping("/public")
    public ResponseEntity<List<DocumentEntreprise>> getPublicLatest() {
        List<DocumentEntreprise> all = documentRepository.findAll();
        // Return only the latest document for each category based on datePublication
        java.util.Map<String, DocumentEntreprise> latestMap = new java.util.HashMap<>();
        for (DocumentEntreprise doc : all) {
            DocumentEntreprise existing = latestMap.get(doc.getCategorie());
            if (existing == null || doc.getDatePublication().isAfter(existing.getDatePublication())) {
                latestMap.put(doc.getCategorie(), doc);
            }
        }
        return ResponseEntity.ok(new java.util.ArrayList<>(latestMap.values()));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DocumentEntreprise> upload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file, 
                                                   @RequestParam("titre") String titre,
                                                   @RequestParam("categorie") String categorie,
                                                   @RequestParam("version") String version,
                                                   @RequestParam("description") String description) throws java.io.IOException {
        DocumentEntreprise doc = new DocumentEntreprise();
        doc.setTitre(titre);
        doc.setCategorie(categorie);
        doc.setVersion(version);
        doc.setDescription(description);
        doc.setContent(file.getBytes());
        doc.setFileUrl("/api/documents-officiels/download-stream/"); // We'll append ID later or use this as base
        doc.setDatePublication(LocalDateTime.now());
        return ResponseEntity.ok(documentRepository.save(doc));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        DocumentEntreprise doc = documentRepository.findById(id).orElseThrow();
        return ResponseEntity.ok()
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getTitre() + ".pdf\"")
            .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
            .body(doc.getContent());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<DocumentEntreprise> create(@RequestBody DocumentEntreprise doc) {
        doc.setDatePublication(LocalDateTime.now());
        return ResponseEntity.ok(documentRepository.save(doc));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
