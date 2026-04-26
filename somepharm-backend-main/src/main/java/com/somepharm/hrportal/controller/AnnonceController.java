package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Annonce;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.AnnonceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/annonces")
@CrossOrigin(origins = "http://localhost:3000")
public class AnnonceController {

    private final AnnonceService annonceService;
    private final UtilisateurRepository utilisateurRepository;

    public AnnonceController(AnnonceService annonceService, UtilisateurRepository utilisateurRepository) {
        this.annonceService = annonceService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @GetMapping
    public ResponseEntity<List<Annonce>> getAll() {
        return ResponseEntity.ok(annonceService.getAllAnnonces());
    }

    @GetMapping("/targeted")
    public ResponseEntity<List<Map<String, Object>>> getTargeted(Authentication auth) {
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName()).orElseThrow();
        List<Annonce> targeted = annonceService.getAnnoncesForUser(user.getIdUser());
        
        List<Map<String, Object>> result = targeted.stream().map(a -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("idAnnonce", a.getIdAnnonce());
            map.put("titre", a.getTitre());
            map.put("contenu", a.getContenu());
            map.put("typeAnnonce", a.getTypeAnnonce());
            map.put("datePublication", a.getDatePublication());
            map.put("priority", a.getPriority());
            map.put("isPinned", a.isPinned());
            map.put("imageUrl", a.getImageUrl());
            map.put("auteur", a.getAuteur());
            map.put("attachmentUrl", a.getAttachmentUrl());
            map.put("isRead", annonceService.isRead(a.getIdAnnonce(), user.getIdUser()));
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication auth) {
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName()).orElseThrow();
        annonceService.markAsRead(id, user.getIdUser());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication auth) {
        Utilisateur user = utilisateurRepository.findByMatricule(auth.getName()).orElseThrow();
        return ResponseEntity.ok(annonceService.getUnreadCount(user.getIdUser()));
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable Long id) {
        return ResponseEntity.ok(annonceService.getReadStats(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Annonce> create(@RequestBody Annonce annonce, Authentication auth) {
        Utilisateur auteur = utilisateurRepository.findByMatricule(auth.getName()).orElseThrow();
        annonce.setAuteur(auteur);
        return ResponseEntity.ok(annonceService.saveAnnonce(annonce));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        annonceService.deleteAnnonce(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('RH_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<Annonce> togglePin(@PathVariable Long id) {
        return ResponseEntity.ok(annonceService.togglePin(id));
    }
}
