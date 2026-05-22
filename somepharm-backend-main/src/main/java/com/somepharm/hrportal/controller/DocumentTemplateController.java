package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.DocumentTemplate;
import com.somepharm.hrportal.repository.DocumentTemplateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DocumentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
    private final DocumentService documentService;
    private final UtilisateurRepository utilisateurRepository;
    private final String uploadDir = "uploads/templates/";

    public DocumentTemplateController(DocumentTemplateRepository repository, DocumentService documentService, UtilisateurRepository utilisateurRepository) {
        this.repository = repository;
        this.documentService = documentService;
        this.utilisateurRepository = utilisateurRepository;
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

    @GetMapping("/{id}/generate")
    public ResponseEntity<byte[]> generateDocument(
            @PathVariable Long id,
            @RequestParam(required = false) String matricule) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur currentUser = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        Utilisateur employe = currentUser;

        if (matricule != null && !matricule.trim().isEmpty() && !matricule.equals(currentUser.getMatricule())) {
            // Privilege verification
            String roleName = currentUser.getRole() != null ? currentUser.getRole().getNomRole() : "EMPLOYE";
            boolean isPrivileged = "RH_ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName) || "HR_MANAGER".equals(roleName);

            if (!isPrivileged) {
                return ResponseEntity.status(403).build(); // Only Admin/HR can generate for other employees
            }

            employe = utilisateurRepository.findByMatricule(matricule)
                    .orElseThrow(() -> new RuntimeException("Employé ciblé introuvable"));
        }

        DocumentTemplate template = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Modèle introuvable"));

        if (template.getFileUrl() == null) {
            return ResponseEntity.badRequest().build();
        }

        byte[] pdfBytes = documentService.genererDocumentDepuisTemplate(employe, template);
        if (pdfBytes == null) {
            return ResponseEntity.internalServerError().build();
        }

        String fileName = template.getNom().replaceAll("\\s+", "_") + "_" + employe.getMatricule() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", fileName);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
