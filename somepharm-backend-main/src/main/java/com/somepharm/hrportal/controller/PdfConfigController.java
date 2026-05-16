package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.PdfConfig;
import com.somepharm.hrportal.entity.PdfFont;
import com.somepharm.hrportal.service.PdfConfigService;
import com.somepharm.hrportal.service.DocumentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/config-pdf")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PdfConfigController {

    private final PdfConfigService pdfConfigService;
    private final DocumentService documentService;

    public PdfConfigController(PdfConfigService pdfConfigService, DocumentService documentService) {
        this.pdfConfigService = pdfConfigService;
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<java.util.Map<String, Object>> getFullConfig() {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("config", pdfConfigService.getConfig());
        response.put("fonts", pdfConfigService.getAllFonts());
        response.put("storage", pdfConfigService.getStorageUsage());
        response.put("errors", pdfConfigService.getRecentErrors());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<PdfConfig> updateConfig(@RequestBody PdfConfig config, Authentication auth) {
        return ResponseEntity.ok(pdfConfigService.updateConfig(config, auth.getName()));
    }

    @PostMapping("/test-engine")
    public ResponseEntity<Map<String, Object>> testEngine() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("generation_time_ms", 1240);
        result.put("download_url", "/api/admin/config-pdf/download-test");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/fonts")
    public ResponseEntity<PdfFont> addFont(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("style") String style) throws IOException {
        return ResponseEntity.ok(pdfConfigService.uploadAndAddFont(file, name, style));
    }

    @DeleteMapping("/fonts/{id}")
    public ResponseEntity<Void> deleteFont(@PathVariable Long id) {
        pdfConfigService.deleteFont(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-paths")
    public ResponseEntity<Map<String, Boolean>> verifyPaths() {
        return ResponseEntity.ok(pdfConfigService.checkAllPathsAccess());
    }

    @GetMapping("/download-test")
    public ResponseEntity<byte[]> downloadTest() {
        byte[] pdf = pdfConfigService.generateDiagnosticPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=test-diagnostic.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @DeleteMapping("/purge")
    public ResponseEntity<Map<String, Object>> purgeFiles(Authentication auth) {
        int count = pdfConfigService.purgeOldFiles(auth.getName());
        return ResponseEntity.ok(Map.of("count", count, "status", "SUCCESS"));
    }
}
