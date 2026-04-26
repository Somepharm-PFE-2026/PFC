package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "DEPARTEMENT")
@Data
@NoArgsConstructor
public class Departement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dept")
    private Long idDept;

    @Column(name = "nom_dept", nullable = false, length = 100)
    private String nomDept;

    @OneToOne
    @JoinColumn(name = "id_manager", referencedColumnName = "id_user")
    private Utilisateur manager;
}