package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "requete", indexes = {
    @Index(name = "idx_req_statut", columnList = "statutCycleVie"),
    @Index(name = "idx_req_user", columnList = "id_user")
})
@Inheritance(strategy = InheritanceType.JOINED)
@SQLDelete(sql = "UPDATE requete SET deleted = true WHERE id_requete = ? AND version = ?")
@SQLRestriction("deleted = false")
@Data
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = DemandeConge.class, name = "CONGE"),
    @JsonSubTypes.Type(value = DemandeDocument.class, name = "DOCUMENT"),
    @JsonSubTypes.Type(value = DemandeAdministrative.class, name = "ADMINISTRATIVE")
})
public abstract class Requete {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_requete", updatable = false, nullable = false)
    private UUID idRequete;

    @Column(nullable = false)
    private LocalDateTime dateSoumission;

    private String description;

    /**
     * Possible values:
     * EN_ATTENTE_MANAGER (Initial state)
     * VALIDE_MANAGER (Approved by Dept Boss)
     * APPROUVE (Final approval by HR - Deducts balance)
     * REFUSE (Rejected at any step)
     */
    @Column(nullable = false)
    private String statutCycleVie;

    /**
     * Stores the reason for refusal or a general comment
     * from the validator (Manager or HR).
     */
    @Column(name = "commentaire_action", length = 500)
    private String commentaireAction;

    // --- 🚀 NEW: AUDIT & WORKFLOW HISTORY ---
    @Column(name = "date_action_manager")
    private LocalDateTime dateActionManager;

    @Column(name = "commentaire_manager", length = 500)
    private String commentaireManager;

    @Column(name = "justificatif_url")
    private String justificatifUrl;

    @Column(name = "date_arrivee_rh")
    private LocalDateTime dateArriveeRh;

    @ManyToOne
    @JoinColumn(name = "id_user", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "motDePasse", "authorities"})
    private Utilisateur demandeur;

    @Column(name = "is_urgent", nullable = false)
    private boolean isUrgent = false;

    @Column(name = "last_nudged_at")
    private LocalDateTime lastNudgedAt;

    @Column(name = "nudge_count", nullable = false)
    private int nudgeCount = 0;

    @ManyToOne
    @JoinColumn(name = "id_circuit")
    private WorkflowCircuit currentCircuit;

    @Column(name = "current_etape_ordre")
    private Integer currentEtapeOrdre;

    @Version
    private Long version;

    @Column(nullable = false)
    private boolean deleted = false;
}