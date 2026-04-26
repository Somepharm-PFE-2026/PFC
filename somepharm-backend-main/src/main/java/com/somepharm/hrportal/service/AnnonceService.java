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
        if ("GENERAL".equals(a.getTargetType())) return true;
        if (a.getTargetType() == null) return true; // Default to general if not specified

        if ("DEPARTMENT".equals(a.getTargetType())) {
            return user.getDepartement() != null && user.getDepartement().equalsIgnoreCase(a.getTargetValue());
        }
        if ("ROLE".equals(a.getTargetType())) {
            return user.getRole() != null && user.getRole().getNomRole().equalsIgnoreCase(a.getTargetValue());
        }
        if ("SITE".equals(a.getTargetType())) {
            return user.getSite() != null && String.valueOf(user.getSite().getIdSite()).equals(a.getTargetValue());
        }
        if ("SELECTIVE".equals(a.getTargetType())) {
            if (a.getTargetValue() == null) return false;
            return List.of(a.getTargetValue().split(",")).contains(String.valueOf(user.getIdUser()));
        }
        return false;
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
        long count = annonceLectureRepository.countByAnnonce(a);
        return Map.of("count", count);
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
