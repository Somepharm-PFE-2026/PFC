package com.somepharm.hrportal.dto;

import lombok.Data;

@Data
public class DepartementDTO {
    private Long idDept;
    private String nomDept;

    // Instead of the whole Manager object, we just send the safe details!
    private Long managerId;
    private String managerMatricule;
    private String managerEmail;
    private String managerNom;
    private String managerPrenom;
}