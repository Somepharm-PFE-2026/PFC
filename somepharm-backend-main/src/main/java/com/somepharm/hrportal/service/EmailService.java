package com.somepharm.hrportal.service;

import com.somepharm.hrportal.entity.EmailConfig;
import com.somepharm.hrportal.repository.EmailConfigRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

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
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");

        return mailSender;
    }

    public void sendResetEmail(String to, String nom, String prenom, String matricule, String tempPassword) {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        
        JavaMailSenderImpl mailSender = getMailSender();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(config.getSmtpUser());
        message.setTo(to);
        
        String subject = "🔑 Réinitialisation de votre mot de passe — " + config.getEntrepriseNom();
        String body = "Bonjour " + prenom + " " + nom + ",\n\n" +
                "Une demande de réinitialisation de mot de passe a été traitée pour votre compte.\n\n" +
                "Voici vos nouveaux identifiants temporaires :\n" +
                "  • Matricule : " + matricule + "\n" +
                "  • Mot de passe : " + tempPassword + "\n\n" +
                "Connectez-vous à cette adresse : " + config.getUrlConnexion() + "\n\n" +
                "IMPORTANT : Ce mot de passe est à usage unique. Vous devrez définir un nouveau mot de passe personnel dès votre connexion.\n\n" +
                "Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement le service IT.\n\n" +
                "Cordialement,\n" +
                "L'équipe IT — " + config.getEntrepriseNom();

        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            System.out.println("Email envoyé avec succès à " + to);
        } catch (Exception e) {
            System.err.println("Échec de l'envoi de l'email : " + e.getMessage());
            throw new RuntimeException("Erreur SMTP : " + e.getMessage());
        }
    }

    public void sendSimpleEmail(String to, String subject, String body) {
        EmailConfig config = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        JavaMailSenderImpl mailSender = getMailSender();
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(config.getSmtpUser());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Échec de l'envoi de l'email simple : " + e.getMessage());
            throw new RuntimeException("Erreur SMTP : " + e.getMessage());
        }
    }
}
