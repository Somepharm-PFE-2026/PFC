package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.PasswordResetTicket;
import com.somepharm.hrportal.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface PasswordResetTicketRepository extends JpaRepository<PasswordResetTicket, Long> {
    
    List<PasswordResetTicket> findAllByOrderBySubmittedAtDesc();
    
    List<PasswordResetTicket> findByUtilisateurOrderBySubmittedAtDesc(Utilisateur utilisateur);
    
    @Query("SELECT COUNT(t) FROM PasswordResetTicket t WHERE t.status = 'EN_ATTENTE'")
    long countPending();
    
    @Query("SELECT COUNT(t) FROM PasswordResetTicket t WHERE t.status = 'EN_ATTENTE_EMPLOYÉ'")
    long countWaitingEmployee();
    
    @Query("SELECT COUNT(t) FROM PasswordResetTicket t WHERE (t.status = 'ENVOYÉ' OR t.status = 'SÉCURISÉ') AND t.processedAt >= :startOfDay")
    long countResolvedToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(t) FROM PasswordResetTicket t WHERE t.utilisateur = :user AND t.submittedAt >= :since")
    long countRecentResets(@Param("user") Utilisateur user, @Param("since") LocalDateTime since);
}
