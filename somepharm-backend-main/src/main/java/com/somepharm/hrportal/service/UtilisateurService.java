package com.somepharm.hrportal.service;

import com.somepharm.hrportal.dto.UtilisateurDTO;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    public UtilisateurService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    // 1. We keep the create method returning the Entity for now (used internally)
    public Utilisateur createUtilisateur(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }

    // 2. We change this to return a List of DTOs!
    public List<UtilisateurDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::convertToDTO) // Convert every user in the database to a DTO
                .collect(Collectors.toList());
    }

    // 3. The magic "Packing" method
    public UtilisateurDTO convertToDTO(Utilisateur utilisateur) {
        UtilisateurDTO dto = new UtilisateurDTO();
        dto.setIdUser(utilisateur.getIdUser());
        dto.setMatricule(utilisateur.getMatricule());
        dto.setEmail(utilisateur.getEmail());
        dto.setStatutCompte(utilisateur.getStatutCompte());

        // Safely extract the role name if the user has a role assigned
        if (utilisateur.getRole() != null) {
            dto.setRoleName(utilisateur.getRole().getNomRole());
        }

        return dto;
    }
}