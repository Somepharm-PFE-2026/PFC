package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.EmailConfig;
import com.somepharm.hrportal.repository.EmailConfigRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;
import java.util.HashMap;
import java.util.Map;
import com.somepharm.hrportal.entity.Utilisateur;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;


@Service
public class EmailService {

    private final EmailConfigRepository configRepository;

    public EmailService(EmailConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    private JavaMailSenderImpl getMailSender() {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(config.getSmtpHost() != null ? config.getSmtpHost().trim() : null);
        mailSender.setPort(config.getSmtpPort());
        mailSender.setUsername(config.getSmtpUser() != null ? config.getSmtpUser().trim() : null);
        mailSender.setPassword(config.getSmtpPass() != null ? config.getSmtpPass().trim() : null);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.debug", "true");

        // --- SMART SMTP LOGIC ---
        if (config.getSmtpPort() == 465) {
            // SSL/TLS (Implicit)
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.starttls.enable", "false");
        } else {
            // STARTTLS (Explicit) - Ports 587, 25, 2525
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.enable", "false");
        }
        
        // Safety for identity check (Gmail/Outlook requirement)
        props.put("mail.smtp.ssl.checkserveridentity", "true");

        return mailSender;
    }

    @Async
    public void sendResetEmail(String to, String nom, String prenom, String matricule, String tempPassword) {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        
        JavaMailSenderImpl mailSender = getMailSender();
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String subject = "🔑 Réinitialisation de votre mot de passe — " + config.getEntrepriseNom();
            String body = "Bonjour " + prenom + " " + nom + ",<br><br>" +
                    "Une demande de réinitialisation de mot de passe a été traitée pour votre compte.<br><br>" +
                    "Voici vos nouveaux identifiants temporaires :<br>" +
                    "  • Matricule : <b>" + matricule + "</b><br>" +
                    "  • Mot de passe : <b>" + tempPassword + "</b><br><br>" +
                    "Connectez-vous à cette adresse : <a href=\"" + config.getUrlConnexion() + "\">" + config.getUrlConnexion() + "</a><br><br>" +
                    "IMPORTANT : Ce mot de passe est à usage unique. Vous devrez définir un nouveau mot de passe personnel dès votre connexion.<br><br>" +
                    "Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement le service IT.<br><br>" +
                    "Cordialement,<br>" +
                    "L'équipe IT — " + config.getEntrepriseNom();

            helper.setFrom(config.getSmtpUser());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(mimeMessage);
            System.out.println("Email de reset envoyé avec succès à " + to);
        } catch (Exception e) {
            System.err.println("Échec de l'envoi de l'email : " + e.getMessage());
            throw new RuntimeException("Erreur SMTP : " + e.getMessage());
        }
    }

    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        JavaMailSenderImpl mailSender = getMailSender();
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setFrom(config.getSmtpUser());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Échec de l'envoi de l'email simple : " + e.getMessage());
            throw new RuntimeException("Erreur SMTP : " + e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(Utilisateur user, String tempPassword) {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            System.out.println("⚠️ Aucun email défini pour " + user.getMatricule() + ". Envoi annulé.");
            return;
        }

        JavaMailSenderImpl mailSender = getMailSender();
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            // Variable Replacement Logic
            String subject = config.getWelcomeEmailSubject();
            String body = config.getWelcomeEmailBody();

            Map<String, String> vars = new HashMap<>();
            vars.put("PRENOM", user.getPrenom() != null ? user.getPrenom() : "");
            vars.put("NOM", user.getNom() != null ? user.getNom() : "");
            vars.put("MATRICULE", user.getMatricule() != null ? user.getMatricule() : "");
            vars.put("MOT_DE_PASSE_TEMPORAIRE", tempPassword);
            vars.put("URL_CONNEXION", config.getUrlConnexion());
            vars.put("NOM_ENTREPRISE", config.getEntrepriseNom());

            for (Map.Entry<String, String> entry : vars.entrySet()) {
                String placeholder = "{{" + entry.getKey() + "}}";
                subject = subject.replace(placeholder, entry.getValue());
                body = body.replace(placeholder, entry.getValue());
            }

            helper.setFrom(config.getSmtpUser());
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML content!

            mailSender.send(mimeMessage);
            System.out.println("✅ Email de bienvenue envoyé avec succès (HTML) à " + user.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Échec de l'envoi de l'email de bienvenue : " + e.getMessage());
            e.printStackTrace();
        }
    }
}
