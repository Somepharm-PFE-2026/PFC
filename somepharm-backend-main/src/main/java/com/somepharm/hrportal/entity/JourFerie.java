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
    
    public JourFerie(String nom, LocalDate date) {
        this.nom = nom;
        this.date = date;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private LocalDate date;

    private boolean isRecurrent = true; // If it's on the same date every year (National Day) vs Religious (Lunar)
}
