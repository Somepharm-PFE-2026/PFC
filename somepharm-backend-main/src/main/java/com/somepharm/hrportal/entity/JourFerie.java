package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "jour_ferie")
public class JourFerie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private RecurrenceType recurrenceType = RecurrenceType.ANNUEL;

    private Integer recurrenceInterval = 1;

    private boolean isRecurrent = true; // Kept for DB compatibility

    @PrePersist
    @PreUpdate
    private void syncRecurrenceFlag() {
        this.isRecurrent = (this.recurrenceType == RecurrenceType.ANNUEL);
    }

    public JourFerie(String nom, LocalDate date) {
        this.nom = nom;
        this.date = date;
        this.recurrenceType = RecurrenceType.ANNUEL;
        this.isRecurrent = true;
    }

    public JourFerie(String nom, LocalDate date, RecurrenceType type) {
        this.nom = nom;
        this.date = date;
        this.recurrenceType = type;
        this.isRecurrent = (type == RecurrenceType.ANNUEL);
    }

    public JourFerie(String nom, LocalDate date, RecurrenceType type, Integer interval) {
        this.nom = nom;
        this.date = date;
        this.recurrenceType = type;
        this.recurrenceInterval = interval;
        this.isRecurrent = (type == RecurrenceType.ANNUEL);
    }
}
