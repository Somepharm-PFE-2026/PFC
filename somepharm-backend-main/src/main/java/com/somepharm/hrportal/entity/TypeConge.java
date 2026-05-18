package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 📝 MASTER DATA: LEAVE TYPES
 * Defines the rules for different types of absences (Annual, Sick, Marriage, etc.)
 * This table is manageable by HR and SuperAdmins.
 */
@Entity
@Table(name = "TYPE_CONGE")
@Data
@NoArgsConstructor
public class TypeConge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_type_conge")
    private Long idTypeConge;

    @Column(nullable = false, unique = true, length = 50)
    private String nom; // e.g., "Congé Annuel", "Maladie", "Mariage"

    @Column(name = "quota_initial")
    private Integer quotaInitial = 0; // Default days per year (e.g., 30 for Annual)

    @Column(name = "justificatif_obligatoire")
    private boolean justificatifObligatoire = false;

    @Column(length = 255)
    private String description;

    @Column(name = "couleur_hex", length = 7)
    private String couleurHex = "#3B82F6"; // Default blue for the Gantt chart

    public TypeConge(String nom, Integer quotaInitial, boolean justificatifObligatoire, String couleurHex) {
        this.nom = nom;
        this.quotaInitial = quotaInitial;
        this.justificatifObligatoire = justificatifObligatoire;
        this.couleurHex = couleurHex;
    }

    public TypeConge(String nom, Integer quotaInitial, boolean justificatifObligatoire, String couleurHex, String description) {
        this.nom = nom;
        this.quotaInitial = quotaInitial;
        this.justificatifObligatoire = justificatifObligatoire;
        this.couleurHex = couleurHex;
        this.description = description;
    }
}
