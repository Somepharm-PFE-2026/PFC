package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttendanceDTO {
    private String date;
    private String entry;
    private String exit;
    private double hours;
    private String status; // OK, RETARD, ABSENT, CONGE
    private double overtime;
    private double lateMinutes;
}
