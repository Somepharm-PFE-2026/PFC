package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "DEPARTEMENT")
@SQLDelete(sql = "UPDATE DEPARTEMENT SET deleted = true WHERE id_dept = ? AND version = ?")
@SQLRestriction("deleted = false")
@Data
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
@lombok.EqualsAndHashCode(onlyExplicitlyIncluded = true)
@lombok.ToString(onlyExplicitlyIncluded = true)
public class Departement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dept")
    @lombok.EqualsAndHashCode.Include
    @lombok.ToString.Include
    private Long idDept;

    @Column(name = "nom_dept", nullable = false, length = 100)
    private String nomDept;

    @OneToOne
    @JoinColumn(name = "id_manager", referencedColumnName = "id_user")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"departement", "poste", "managerDirect", "motDePasse", "role", "authorities", "customAttributes", "hibernateLazyInitializer", "handler"})
    private Utilisateur manager;

    @Version
    private Long version;

    @Column(nullable = false)
    private boolean deleted = false;
}