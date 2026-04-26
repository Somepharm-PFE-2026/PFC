package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.PasswordResetTicket;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.PasswordResetTicketRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class HelpdeskService {

    private final PasswordResetTicketRepository ticketRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    public HelpdeskService(PasswordResetTicketRepository ticketRepository,
            UtilisateurRepository utilisateurRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditService auditService) {
        this.ticketRepository = ticketRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    public List<PasswordResetTicket> getAllTickets() {
        return ticketRepository.findAllByOrderBySubmittedAtDesc();
    }

    public Map<String, Long> getCounters() {
        Map<String, Long> counters = new HashMap<>();
        counters.put("pending", ticketRepository.countPending());
        counters.put("waiting_employee", ticketRepository.countWaitingEmployee());
        counters.put("resolved_today",
                ticketRepository.countResolvedToday(LocalDateTime.now().withHour(0).withMinute(0)));
        return counters;
    }

    @Transactional
    public Map<String, Object> processTicket(Long idTicket, String channel, String adminMatricule) {
        PasswordResetTicket ticket = ticketRepository.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        if (ticket.getStatus() == PasswordResetTicket.TicketStatus.SÉCURISÉ) {
            throw new RuntimeException("Ce ticket est déjà sécurisé et ne peut plus être modifié");
        }

        Utilisateur user = ticket.getUtilisateur();

        // 1. Generate password SP-XXXX-X
        String rawPassword = "SP-" + (1000 + new Random().nextInt(8999)) + "-X";
        user.setMotDePasse(passwordEncoder.encode(rawPassword));
        user.setMustChangePassword(true);
        user.setStatutCompte("ACTIF");
        utilisateurRepository.save(user);

        // 2. Update ticket
        ticket.setStatus(PasswordResetTicket.TicketStatus.ENVOYÉ);
        ticket.setProcessedAt(LocalDateTime.now());
        ticket.setChannel(channel);
        ticket.setTemporaryPassword(rawPassword);
        ticketRepository.save(ticket);

        // 3. Audit
        auditService.logSuccess("PASSWORD_RESET",
                "Réinitialisation mot de passe via Ticket Helpdesk",
                adminMatricule,
                "SUPER_ADMIN",
                user.getMatricule());

        Map<String, Object> response = new HashMap<>();
        response.put("action", "PASSWORD_RESET_GENERATED");
        response.put("ticket_id", "TKT-" + ticket.getIdTicket());
        response.put("temporary_password", rawPassword);
        response.put("temporaryPassword", rawPassword);
        response.put("generated_at", ticket.getProcessedAt());

        return response;
    }

    @Transactional
    public void sendEmailWithPassword(Long idTicket, String rawPassword) {
        PasswordResetTicket ticket = ticketRepository.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        Utilisateur user = ticket.getUtilisateur();
        emailService.sendResetEmail(
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getMatricule(),
                rawPassword);

        ticket.setChannel("EMAIL");
        ticketRepository.save(ticket);
    }

    @Transactional
    public void markAsSent(Long idTicket) {
        PasswordResetTicket ticket = ticketRepository.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        ticket.setStatus(PasswordResetTicket.TicketStatus.EN_ATTENTE_EMPLOYÉ);
        ticketRepository.save(ticket);
    }

    public Map<String, Object> getUserHistory(String matricule) {
        Utilisateur user = utilisateurRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        List<PasswordResetTicket> history = ticketRepository.findByUtilisateurOrderBySubmittedAtDesc(user);
        long recentCount = ticketRepository.countRecentResets(user, LocalDateTime.now().minusDays(7));

        Map<String, Object> response = new HashMap<>();
        response.put("matricule", user.getMatricule());
        response.put("full_name", user.getNom() + " " + user.getPrenom());
        response.put("total_resets", history.size());
        response.put("alert", recentCount >= 2);
        response.put("alert_message", recentCount + " resets en 7 jours — comportement suspect.");
        response.put("history", history);

        return response;
    }

    @Transactional
    public void createTicket(String matricule) {
        Utilisateur user = utilisateurRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Matricule inconnu"));

        PasswordResetTicket ticket = new PasswordResetTicket();
        ticket.setUtilisateur(user);
        ticketRepository.save(ticket);
    }

    public String getActiveTicketStatus(String matricule) {
        Utilisateur user = utilisateurRepository.findByMatricule(matricule)
                .orElse(null);
        if (user == null) return null;
        
        // 🛡️ AUTO-HEAL: If the user has already changed their password, 
        // any remaining reset tickets should be marked as SECURED.
        if (Boolean.FALSE.equals(user.getMustChangePassword())) {
            completeResetTickets(matricule);
            return null;
        }

        return ticketRepository.findByUtilisateurOrderBySubmittedAtDesc(user).stream()
                .filter(t -> t.getStatus() != PasswordResetTicket.TicketStatus.SÉCURISÉ)
                .map(t -> t.getStatus().name())
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void completeResetTickets(String matricule) {
        String cleanMatricule = matricule.trim();
        System.out.println("[HELPDESK] Completing tickets for: [" + cleanMatricule + "]");
        
        Utilisateur user = utilisateurRepository.findByMatricule(cleanMatricule)
                .orElse(null);
                
        if (user == null) {
            System.out.println("[HELPDESK] User not found for matricule: " + cleanMatricule);
            return;
        }

        List<PasswordResetTicket> activeTickets = ticketRepository.findByUtilisateurOrderBySubmittedAtDesc(user);
        System.out.println("[HELPDESK] Found tickets count: " + activeTickets.size());
        
        for (PasswordResetTicket ticket : activeTickets) {
            System.out.println("[HELPDESK] Processing Ticket ID: " + ticket.getIdTicket() + " | Status: " + ticket.getStatus());
            if (ticket.getStatus() != PasswordResetTicket.TicketStatus.SÉCURISÉ) {
                ticket.setStatus(PasswordResetTicket.TicketStatus.SÉCURISÉ);
                ticket.setSecuredAt(LocalDateTime.now());
                ticket.setTemporaryPassword(null); 
                ticketRepository.save(ticket);
                System.out.println("[HELPDESK] Ticket " + ticket.getIdTicket() + " successfully SECURED.");
            }
        }
    }
}
