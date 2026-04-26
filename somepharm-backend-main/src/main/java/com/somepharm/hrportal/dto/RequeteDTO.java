package com.somepharm.hrportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequeteDTO {
    private Long idRequete;
    private LocalDateTime dateSoumission;
    private String statutCycleVie;
    private String description;
    
    // Unified label: will contain "Congé", "Attestation", etc.
    private String typeLabel;
    
    // Original specific fields to maintain frontend compatibility if needed
    private String typeConge;
    private String typeDocument;
}
