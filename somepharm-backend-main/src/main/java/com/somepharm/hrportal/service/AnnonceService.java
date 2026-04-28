package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.Annonce;
import com.somepharm.hrportal.entity.AnnonceLecture;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.AnnonceLectureRepository;
import com.somepharm.hrportal.repository.AnnonceRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final AnnonceLectureRepository annonceLectureRepository;
    private final UtilisateurRepository utilisateurRepository;

    public AnnonceService(AnnonceRepository annonceRepository, 
                          AnnonceLectureRepository annonceLectureRepository,
                          UtilisateurRepository utilisateurRepository) {
        this.annonceRepository = annonceRepository;
        this.annonceLectureRepository = annonceLectureRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    public List<Annonce> getAllAnnonces() {
        return annonceRepository.findAllByOrderByIsPinnedDescDatePublicationDesc();
    }

    public List<Annonce> getAnnoncesForUser(Long userId) {
        Utilisateur user = utilisateurRepository.findById(userId).orElseThrow();
        List<Annonce> all = annonceRepository.findByStatusOrderByIsPinnedDescDatePublicationDesc("PUBLISHED");
        return all.stream().filter(a -> isTargeted(a, user)).collect(Collectors.toList());
    }

    private boolean isTargeted(Annonce a, Utilisateur user) {
        if ("GENERAL".equals(a.getTargetType()) || a.getTargetType() == null) return true;

        String targetValue = a.getTargetValue() != null ? a.getTargetValue().trim() : "";
        if (targetValue.isEmpty() && !"GENERAL".equals(a.getTargetType())) return false;

        if ("DEPARTMENT".equals(a.getTargetType())) {
            return user.getDepartement() != null && user.getDepartement().equalsIgnoreCase(targetValue);
        }

        if ("ROLE".equals(a.getTargetType())) {
            if (user.getRole() == null) return false;
            String userRole = user.getRole().getNomRole();
            
            if (isRoleMatch(userRole, targetValue)) return true;
            
            // Special Case: RH_ADMIN includes HR_MANAGER
            if (isRoleMatch(targetValue, "RH_ADMIN") && isRoleMatch(userRole, "HR_MANAGER")) return true;
            
            // Special Case: SECURITY_AGENTS targeting also includes anyone in the SECURITE department
            if (isRoleMatch(targetValue, "SECURITY_AGENTS") && "SECURITE".equalsIgnoreCase(user.getDepartement())) return true;
            
            return false;
        }

        if ("SITE".equals(a.getTargetType())) {
            if (user.getSite() == null) return false;
            return String.valueOf(user.getSite().getIdSite()).equals(targetValue);
        }

        if ("SELECTIVE".equals(a.getTargetType())) {
            if (targetValue.isEmpty()) return false;
            String[] userIds = targetValue.split("\\s*,\\s*");
            String currentId = String.valueOf(user.getIdUser());
            for (String id : userIds) {
                if (id.equals(currentId)) return true;
            }
            return false;
        }

        return false;
    }

    private boolean isRoleMatch(String roleA, String roleB) {
        if (roleA == null || roleB == null) return false;
        String a = roleA.toUpperCase().trim();
        String b = roleB.toUpperCase().trim();
        if (a.startsWith("ROLE_")) a = a.substring(5);
        if (b.startsWith("ROLE_")) b = b.substring(5);
        return a.equals(b);
    }

    public boolean isRead(Long annonceId, Long userId) {
        Annonce a = annonceRepository.findById(annonceId).orElseThrow();
        Utilisateur u = utilisateurRepository.findById(userId).orElseThrow();
        return annonceLectureRepository.findByAnnonceAndUtilisateur(a, u).isPresent();
    }

    public void markAsRead(Long annonceId, Long userId) {
        Annonce a = annonceRepository.findById(annonceId).orElseThrow();
        Utilisateur u = utilisateurRepository.findById(userId).orElseThrow();
        if (annonceLectureRepository.findByAnnonceAndUtilisateur(a, u).isEmpty()) {
            annonceLectureRepository.save(new AnnonceLecture(a, u));
        }
    }

    public long getUnreadCount(Long userId) {
        List<Annonce> targeted = getAnnoncesForUser(userId);
        Utilisateur u = utilisateurRepository.findById(userId).orElseThrow();
        
        long readCount = targeted.stream()
                .filter(a -> annonceLectureRepository.findByAnnonceAndUtilisateur(a, u).isPresent())
                .count();
                
        return targeted.size() - readCount;
    }

    public Map<String, Object> getReadStats(Long annonceId) {
        Annonce a = annonceRepository.findById(annonceId).orElseThrow();
        long readCount = annonceLectureRepository.countByAnnonce(a);
        long totalTarget = calculateTargetSize(a);
        return Map.of(
            "count", readCount,
            "totalTarget", totalTarget,
            "engagementRate", totalTarget > 0 ? (double) readCount / totalTarget * 100 : 0
        );
    }

    public long calculateTargetSize(Annonce a) {
        if ("GENERAL".equals(a.getTargetType()) || a.getTargetType() == null) {
            return utilisateurRepository.count();
        }
        if ("DEPARTMENT".equals(a.getTargetType())) {
            return utilisateurRepository.countByDepartement(a.getTargetValue());
        }
        if ("ROLE".equals(a.getTargetType())) {
            // Using the isTargeted logic directly on the user list to avoid double counting
            // (e.g., users who match both the role and a special department fallback)
            return utilisateurRepository.findAll().stream()
                    .filter(u -> isTargeted(a, u))
                    .count();
        }
        if ("SITE".equals(a.getTargetType())) {
            try {
                return utilisateurRepository.countBySite_IdSite(Long.parseLong(a.getTargetValue()));
            } catch (Exception e) {
                return 0;
            }
        }
        if ("SELECTIVE".equals(a.getTargetType())) {
            if (a.getTargetValue() == null || a.getTargetValue().isEmpty()) return 0;
            return a.getTargetValue().split(",").length;
        }
        return 0;
    }

    public Annonce saveAnnonce(Annonce annonce) {
        if (annonce.getDatePublication() == null) {
            annonce.setDatePublication(LocalDateTime.now());
        }
        return annonceRepository.save(annonce);
    }

    public void deleteAnnonce(Long id) {
        annonceRepository.deleteById(id);
    }

    public Annonce togglePin(Long id) {
        Annonce a = annonceRepository.findById(id).orElseThrow();
        a.setPinned(!a.isPinned());
        return annonceRepository.save(a);
    }
}
