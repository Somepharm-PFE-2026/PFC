package com.somepharm.hrportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "SITE")
@Data
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_site")
    private Long idSite;

    @Column(name = "nom_site", nullable = false, length = 100)
    private String nomSite;

    @Column(name = "adresse")
    private String adresse;

    @Column(name = "ville")
    private String ville;

    public Site(String nomSite) {
        this.nomSite = nomSite;
    }
}
