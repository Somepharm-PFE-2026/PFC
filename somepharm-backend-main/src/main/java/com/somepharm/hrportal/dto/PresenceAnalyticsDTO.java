package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresenceAnalyticsDTO {
    private Map<String, Double> latenessByDept;
    private Map<String, Double> absenteeismTrend;
    private List<UtilisateurSummaryDTO> topLeaveBalances;
}
