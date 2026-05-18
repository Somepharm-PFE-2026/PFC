package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserActivationResponse {
    private String matricule;
    private String temporary_password;
    private String account_status;
    private String password_status;
    private LocalDate activation_date;
}
