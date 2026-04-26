package com.somepharm.hrportal.controller;

import com.somepharm.hrportal.entity.DemandeConge;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.Requete;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.RequeteRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DocumentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class DocumentController {

    private final DocumentService documentService;
    private final UtilisateurRepository utilisateurRepository;
    private final RequeteRepository requeteRepository;

    public DocumentController(DocumentService documentService, UtilisateurRepository utilisateurRepository, RequeteRepository requeteRepository) {
        this.documentService = documentService;
        this.utilisateurRepository = utilisateurRepository;
        this.requeteRepository = requeteRepository;
    }

    @GetMapping("/fiche-paie")
    public ResponseEntity<byte[]> downloadFichePaieDirect(@RequestParam int mois, @RequestParam int annee) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur employe = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        byte[] pdfBytes = documentService.genererFicheDePaie(employe, mois, annee);
        String fileName = "Fiche_Paie_" + employe.getMatricule() + "_" + mois + "_" + annee + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", fileName);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/download/{idRequete}")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long idRequete) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur employe = utilisateurRepository.findByMatricule(auth.getName())
                .orElseThrow(() -> new RuntimeException("Employé introuvable"));

        Requete requete = requeteRepository.findById(idRequete)
                .orElseThrow(() -> new RuntimeException("Requête introuvable"));

        // Only the requester or an ADMIN can download the document
        String roleName = employe.getRole().getNomRole();
        boolean isPrivileged = "RH_ADMIN".equals(roleName) || "SUPER_ADMIN".equals(roleName) || "HR_MANAGER".equals(roleName);
        
        if (!requete.getDemandeur().getIdUser().equals(employe.getIdUser()) && !isPrivileged) {
            return ResponseEntity.status(403).build();
        }

        // Must be approved to generate official documents
        boolean isApproved = "APPROUVÉ".equalsIgnoreCase(requete.getStatutCycleVie()) || "APPROUVE".equalsIgnoreCase(requete.getStatutCycleVie());
        if (!isApproved) {
            return ResponseEntity.status(403).build(); // Forbidden to download unapproved documents
        }

        byte[] pdfBytes = null;
        String fileName = "Document.pdf";

        if (requete instanceof DemandeConge) {
            pdfBytes = documentService.genererTitreConge(requete.getDemandeur());
            fileName = "Titre_Conge_" + requete.getDemandeur().getMatricule() + ".pdf";
        } else if (requete instanceof DemandeDocument) {
            String type = ((DemandeDocument) requete).getTypeDocument();
            switch (type) {
                case "ATTESTATION_TRAVAIL":
                    pdfBytes = documentService.genererAttestationTravail(requete.getDemandeur());
                    fileName = "Attestation_Travail_" + requete.getDemandeur().getMatricule() + ".pdf";
                    break;
                case "ATTESTATION_SALAIRE":
                    pdfBytes = documentService.genererAttestationSalaire(requete.getDemandeur());
                    fileName = "Attestation_Salaire_" + requete.getDemandeur().getMatricule() + ".pdf";
                    break;
                case "BON_SORTIE":
                    pdfBytes = documentService.genererBonSortie((DemandeDocument) requete);
                    fileName = "Bon_Sortie_" + requete.getDemandeur().getMatricule() + ".pdf";
                    break;
                case "FICHE_PAIE":
                    Integer mois = ((DemandeDocument) requete).getMois();
                    Integer annee = ((DemandeDocument) requete).getAnnee();
                    pdfBytes = documentService.genererFicheDePaie(requete.getDemandeur(), mois, annee);
                    fileName = "Fiche_Paie_" + requete.getDemandeur().getMatricule() + ".pdf";
                    break;
                case "RELEVE_EMOLUMENTS":
                    // Using Fiche de Paie for now as mock, or add genererReleveEmoluments to DocumentService soon
                    pdfBytes = documentService.genererFicheDePaie(requete.getDemandeur(), null, null);
                    fileName = "Releve_Emoluments_" + requete.getDemandeur().getMatricule() + ".pdf";
                    break;
                default:
                    throw new RuntimeException("Type de document inconnu");
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", fileName);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}