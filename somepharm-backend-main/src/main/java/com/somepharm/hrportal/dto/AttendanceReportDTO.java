package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceReportDTO {
    private String matricule;
    private String nomComplet;
    private double totalHours;
    private double totalOvertime;
    private double totalLateMinutes;
    private int daysPresent;
    private int daysAbsent;
    private int daysOnLeave;
    private List<DailyAttendanceDTO> dailyDetails;
}
