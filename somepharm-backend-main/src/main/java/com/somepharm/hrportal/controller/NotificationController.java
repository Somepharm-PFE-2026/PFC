package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.Notification;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurRepository;

    public NotificationController(NotificationService notificationService, UtilisateurRepository utilisateurRepository) {
        this.notificationService = notificationService;
        this.utilisateurRepository = utilisateurRepository;
    }

    private Utilisateur getCurrentUser(Authentication authentication) {
        return utilisateurRepository.findByMatricule(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        Utilisateur user = getCurrentUser(authentication);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user.getIdUser()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Integer> getUnreadCount(Authentication authentication) {
        Utilisateur user = getCurrentUser(authentication);
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(user.getIdUser()).size());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Utilisateur user = getCurrentUser(authentication);
        notificationService.markAllAsRead(user.getIdUser());
        return ResponseEntity.ok().build();
    }
}
