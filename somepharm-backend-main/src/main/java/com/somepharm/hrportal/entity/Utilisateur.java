package com.somepharm.hrportal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.Check;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "UTILISATEUR", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_matricule", columnList = "matricule")
})
@SQLDelete(sql = "UPDATE UTILISATEUR SET deleted = true WHERE id_user = ? AND version = ?")
@SQLRestriction("deleted = false")
@Check(constraints = "solde_conges >= 0")
@Data
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
@lombok.EqualsAndHashCode(onlyExplicitlyIncluded = true)
@lombok.ToString(onlyExplicitlyIncluded = true)
public class Utilisateur implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_user")
    @lombok.EqualsAndHashCode.Include
    @lombok.ToString.Include
    private Long idUser;

    @Column(unique = true, length = 20)
    private String matricule;

    @Column(unique = true, length = 100)
    private String email;

    @Column(name = "mot_de_passe")
    private String motDePasse;

    @Column(name = "statut_compte", length = 30)
    private String statutCompte = "INACTIF";

    @Column(name = "password_status", length = 20)
    private String passwordStatus = "N/A";

    @Column(name = "activation_date")
    private LocalDate activationDate;

    @Column(name = "password_reset_requested")
    private Boolean passwordResetRequested = false;

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "lockout_until")
    private java.time.LocalDateTime lockoutUntil;

    @Column(name = "temporary_password")
    private String temporaryPassword;

    @ManyToOne
    @JoinColumn(name = "id_role", referencedColumnName = "id_role")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Role role;

    // --- Personal Info ---
    private String nom;
    private String prenom;
    private String telephone;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "photo_url")
    private String photoUrl;

    // --- Professional Context ---
    @ManyToOne
    @JoinColumn(name = "id_dept")
    @JsonIgnoreProperties({"manager", "hibernateLazyInitializer", "handler"})
    private Departement departement;

    @ManyToOne
    @JoinColumn(name = "id_poste")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Poste poste;

    @Version
    private Long version;

    @Column(nullable = false)
    private boolean deleted = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> customAttributes = new HashMap<>();

    @ManyToOne
    @JoinColumn(name = "id_site")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Site site;

    @Column(name = "date_embauche")
    private LocalDate dateEmbauche;

    @ManyToOne
    @JoinColumn(name = "id_manager_direct", referencedColumnName = "id_user")
    @JsonIgnoreProperties({"managerDirect", "motDePasse", "role", "authorities", "hibernateLazyInitializer", "handler"})
    private Utilisateur managerDirect;

    // --- HR Data ---
    @Column(name = "solde_conges", nullable = false)
    private Double soldeConges = 30.0;

    @Column(name = "must_change_password")
    private Boolean mustChangePassword = true;

    @Column(name = "contact_urgence")
    private String contactUrgence;

    @Enumerated(EnumType.STRING)
    @Column(name = "situation_familiale")
    private SituationFamiliale situationFamiliale = SituationFamiliale.CELIBATAIRE;

    // --- SPRING SECURITY METHODS ---

    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role != null && this.role.getNomRole() != null) {
            // Standardizing with ROLE_ prefix for robust Spring Security filter compatibility
            return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.getNomRole()));
        }
        // Fallback default
        return List.of(new SimpleGrantedAuthority("ROLE_EMPLOYE"));
    }

    @JsonIgnore
    @Override
    public String getPassword() {
        return this.motDePasse;
    }

    @JsonIgnore
    @Override
    public String getUsername() {
        return this.matricule; // Using Matricule as the login ID!
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() {
        return "ACTIF".equals(this.statutCompte) || "EN_ATTENTE_PREMIERE_CONNEXION".equals(this.statutCompte);
    }

    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @JsonIgnore
    @Override
    public boolean isEnabled() {
        return "ACTIF".equals(this.statutCompte) || "EN_ATTENTE_PREMIERE_CONNEXION".equals(this.statutCompte);
    }

    /**
     * Proactive cleaning for character encoding errors (e.g. "p??re" -> "père")
     * This ensures the user NEVER sees syntaxing errors even if DB data was corrupted during import.
     */
    @PostLoad
    protected void cleanEncodingErrors() {
        if (this.contactUrgence != null) {
            // Fix both lowercase and uppercase patterns
            this.contactUrgence = this.contactUrgence.replace("p??re", "père")
                                                  .replace("P??re", "Père")
                                                  .replace("m??re", "mère")
                                                  .replace("M??re", "Mère")
                                                  .replace("fr??re", "frère")
                                                  .replace("Fr??re", "Frère")
                                                  .replace("??", "è"); 
        }
    }

    // Helper for official documents
    public String getNameForDocuments() {
        if (nom == null && prenom == null) return matricule;
        return (prenom != null ? prenom : "") + " " + (nom != null ? nom.toUpperCase() : "");
    }
}