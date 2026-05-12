package com.somepharm.hrportal.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;

@Entity
@Immutable
@Subselect("SELECT d.id_dept AS id_dept, d.nom_dept AS nom_dept, " +
           "COUNT(u.id_user) AS total_employes, " +
           "SUM(u.solde_conges) AS solde_conges_total " +
           "FROM DEPARTEMENT d " +
           "LEFT JOIN UTILISATEUR u ON d.id_dept = u.id_dept AND u.deleted = false " +
           "GROUP BY d.id_dept, d.nom_dept")
@Data
public class HrReportingView {
    @Id
    private Long idDept;
    private String nomDept;
    private Long totalEmployes;
    private Double soldeCongesTotal;
}
