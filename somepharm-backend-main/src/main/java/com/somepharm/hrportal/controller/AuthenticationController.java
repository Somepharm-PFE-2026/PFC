package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.config.JwtService;
import com.somepharm.hrportal.dto.AuthenticationRequest;
import com.somepharm.hrportal.dto.AuthenticationResponse;
import com.somepharm.hrportal.dto.RegisterRequest;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository repository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final com.somepharm.hrportal.service.AuditService auditService;
    private final com.somepharm.hrportal.repository.ConnectionLogRepository connectionLogRepository;
    private final jakarta.servlet.http.HttpServletRequest httpRequest;

    public AuthenticationController(
            AuthenticationManager authenticationManager,
            UtilisateurRepository repository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            com.somepharm.hrportal.service.AuditService auditService,
            com.somepharm.hrportal.repository.ConnectionLogRepository connectionLogRepository,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        this.authenticationManager = authenticationManager;
        this.repository = repository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.connectionLogRepository = connectionLogRepository;
        this.httpRequest = httpRequest;
    }

    // --- 1. THE REGISTER ENDPOINT ---
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        Utilisateur user = new Utilisateur();
        user.setMatricule(request.getMatricule());
        user.setEmail(request.getEmail());

        // Encrypting the password before it hits the database!
        user.setMotDePasse(passwordEncoder.encode(request.getPassword()));
        user.setStatutCompte("ACTIF");

        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthenticationResponse.builder().token(jwtToken).build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        String matricule = request.getMatricule();
        String ip = httpRequest.getRemoteAddr();
        String ua = httpRequest.getHeader("User-Agent");

        var userOpt = repository.findByMatricule(matricule);
        
        if (userOpt.isPresent()) {
            Utilisateur user = userOpt.get();
            
            // Check lockout
            if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(java.time.LocalDateTime.now())) {
                connectionLogRepository.save(new com.somepharm.hrportal.entity.ConnectionLog(matricule, ip, ua, "LOCKED"));
                return ResponseEntity.status(423).build(); // Locked
            }

            try {
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(matricule, request.getPassword())
                );
                
                // Success
                user.setFailedLoginAttempts(0);
                user.setLockoutUntil(null);
                repository.save(user);

                connectionLogRepository.save(new com.somepharm.hrportal.entity.ConnectionLog(matricule, ip, ua, "SUCCESS"));
                auditService.logSuccess("LOGIN", "Connexion réussie", matricule, user.getRole().getNomRole(), "AUTH");

                var jwtToken = jwtService.generateToken(user);
                return ResponseEntity.ok(AuthenticationResponse.builder()
                        .token(jwtToken)
                        .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                        .build());
            } catch (Exception e) {
                // Failure
                int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
                user.setFailedLoginAttempts(attempts);
                if (attempts >= 5) {
                    user.setLockoutUntil(java.time.LocalDateTime.now().plusMinutes(15));
                }
                repository.save(user);

                connectionLogRepository.save(new com.somepharm.hrportal.entity.ConnectionLog(matricule, ip, ua, "FAILURE"));
                return ResponseEntity.status(401).build();
            }
        } else {
            // User not found
            connectionLogRepository.save(new com.somepharm.hrportal.entity.ConnectionLog(matricule, ip, ua, "NOT_FOUND"));
            return ResponseEntity.status(401).build();
        }
    }
}