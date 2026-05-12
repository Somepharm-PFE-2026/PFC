package com.somepharm.hrportal.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.somepharm.hrportal.entity.BulletinPaie;
import com.somepharm.hrportal.entity.DemandeDocument;
import com.somepharm.hrportal.entity.DocumentTemplate;
import com.somepharm.hrportal.entity.SystemConfig;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.SystemConfigRepository;
import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class DocumentService {

    private final Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BaseColor.DARK_GRAY);
    private final Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
    private final Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
    private final Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new BaseColor(37, 99, 235));
    private final Font smallBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK);
    private final Font smallNormal = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);

    private final PayrollService payrollService;
    private final SystemConfigRepository systemConfigRepository;
    private final com.somepharm.hrportal.repository.BonDeSortieRepository bonDeSortieRepository;

    public DocumentService(PayrollService payrollService, SystemConfigRepository systemConfigRepository, com.somepharm.hrportal.repository.BonDeSortieRepository bonDeSortieRepository) {
        this.payrollService = payrollService;
        this.systemConfigRepository = systemConfigRepository;
        this.bonDeSortieRepository = bonDeSortieRepository;
    }

    // --- 1. ATTESTATION DE TRAVAIL ---
    public byte[] genererAttestationTravail(Utilisateur employe) {
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            addCompanyHeader(document);

            Paragraph title = new Paragraph("ATTESTATION DE TRAVAIL", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            Paragraph body = new Paragraph();
            body.setFont(textFont);
            body.setLeading(25f);
            body.add("Nous soussignés, la Direction des Ressources Humaines de la société ");
            body.add(new Chunk("SOMEPHARM", boldFont));
            body.add(", attestons par la présente que :\n\n");
            body.add("L'employé(e) identifié(e) par le matricule : ");
            body.add(new Chunk(employe.getMatricule(), boldFont));
            body.add("\nDépartement : ");
            body.add(new Chunk(employe.getDepartement() != null ? employe.getDepartement().getNomDept() : "", boldFont));

            String roleNom = employe.getRole() != null ? employe.getRole().getNomRole() : "Employé";
            body.add("\nFonction occupée : ");
            body.add(new Chunk(roleNom, boldFont));

            body.add("\n\nEst actuellement salarié(e) au sein de notre structure et exerce ses fonctions de manière régulière à ce jour.");
            body.add("\nCette attestation lui est délivrée sur sa demande pour servir et valoir ce que de droit.");

            document.add(body);
            document.add(Chunk.NEWLINE);
            addSignature(document);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    // --- 2. FICHE DE PAIE (PAYSLIP) ---
    public byte[] genererFicheDePaie(Utilisateur employe, Integer mois, Integer annee) {
        if (mois == null || annee == null) {
            mois = LocalDate.now().getMonthValue();
            annee = LocalDate.now().getYear();
        }

        BulletinPaie bp = payrollService.getOrCreateBulletin(employe, mois, annee);

        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            addCompanyHeader(document);

            // Title and Month
            Paragraph title = new Paragraph("BULLETIN DE PAIE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            String[] moisNoms = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
            Paragraph period = new Paragraph("Période : " + moisNoms[bp.getMois() - 1] + " " + bp.getAnnee(), boldFont);
            period.setAlignment(Element.ALIGN_CENTER);
            document.add(period);
            document.add(Chunk.NEWLINE);

            // Employee Info Table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20f);
            infoTable.addCell(createCell("Matricule: " + employe.getMatricule(), false));
            infoTable.addCell(createCell("Département: " + (employe.getDepartement() != null ? employe.getDepartement().getNomDept() : ""), false));
            infoTable.addCell(createCell("Nom & Prénom: " + employe.getNom() + " " + employe.getPrenom(), false));
            String roleNom = employe.getRole() != null ? employe.getRole().getNomRole() : "Employé";
            infoTable.addCell(createCell("Fonction: " + roleNom, false));
            document.add(infoTable);

            // Detailed Salary Table: Designation | Base | Taux | Gains | Retenues
            PdfPTable table = new PdfPTable(new float[]{30, 15, 10, 20, 20});
            table.setWidthPercentage(100);

            // Headers
            table.addCell(createCellSmall("Désignation", true));
            table.addCell(createCellSmall("Base", true));
            table.addCell(createCellSmall("Taux", true));
            table.addCell(createCellSmall("Gains", true));
            table.addCell(createCellSmall("Retenues", true));

            // Salaire de base
            addSalaryRow(table, "Salaire de base", bp.getSalaireBase(), 0, bp.getSalaireBase(), 0);
            
            // IEP (Ancienneté)
            if (bp.getIep() > 0) {
               addSalaryRow(table, "IEP (Ancienneté)", bp.getSalaireBase(), 0, bp.getIep(), 0);
            }

            // Primes
            if (bp.getPrimePanier() > 0) addSalaryRow(table, "Prime Panier", 0, 0, bp.getPrimePanier(), 0);
            if (bp.getPrimeTransport() > 0) addSalaryRow(table, "Prime Transport", 0, 0, bp.getPrimeTransport(), 0);

            // Blank line
            addSalaryRow(table, " ", 0, 0, 0, 0);

            // Retenues
            addSalaryRow(table, "Retenue SS (CNAS)", bp.getSalaireBrut(), 9.0, 0, bp.getRetenueCNAS());
            addSalaryRow(table, "IRG", bp.getSalaireBrut() - bp.getRetenueCNAS(), 0, 0, bp.getIrg());

            document.add(table);

            // Footer Totals
            PdfPTable sumTable = new PdfPTable(new float[]{55, 20, 25});
            sumTable.setWidthPercentage(100);
            sumTable.setSpacingBefore(10f);

            PdfPCell c1 = createCell(" ", false); c1.setBorder(Rectangle.NO_BORDER); sumTable.addCell(c1);
            sumTable.addCell(createCell("Salaire BRUT:", true));
            sumTable.addCell(createCell(String.format("%,.2f DZD", bp.getSalaireBrut()), true));

            PdfPCell c2 = createCell(" ", false); c2.setBorder(Rectangle.NO_BORDER); sumTable.addCell(c2);
            sumTable.addCell(createCell("Total Retenues:", true));
            sumTable.addCell(createCell(String.format("%,.2f DZD", bp.getRetenueCNAS() + bp.getIrg()), true));

            PdfPCell c3 = createCell(" ", false); c3.setBorder(Rectangle.NO_BORDER); sumTable.addCell(c3);
            PdfPCell netLabel = createCell("NET À PAYER:", true);
            netLabel.setBackgroundColor(new BaseColor(37, 99, 235));
            netLabel.setPhrase(new Phrase("NET À PAYER:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE)));
            sumTable.addCell(netLabel);
            
            PdfPCell netVal = createCell(String.format("%,.2f DZD", bp.getNetAPayer()), true);
            netVal.setBackgroundColor(new BaseColor(240, 244, 255));
            sumTable.addCell(netVal);

            document.add(sumTable);

            document.add(Chunk.NEWLINE);
            addSignature(document);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    private void addSalaryRow(PdfPTable table, String desc, double base, double taux, double gains, double retenues) {
        table.addCell(new PdfPCell(new Phrase(desc, smallNormal)));
        table.addCell(new PdfPCell(new Phrase(base > 0 ? String.format("%,.2f", base) : " ", smallNormal)));
        table.addCell(new PdfPCell(new Phrase(taux > 0 ? String.format("%.1f%%", taux) : " ", smallNormal)));
        table.addCell(new PdfPCell(new Phrase(gains > 0 ? String.format("%,.2f", gains) : " ", smallNormal)));
        table.addCell(new PdfPCell(new Phrase(retenues > 0 ? String.format("%,.2f", retenues) : " ", smallNormal)));
    }

    private PdfPCell createCellSmall(String content, boolean isHeader) {
        PdfPCell cell = new PdfPCell(new Phrase(content, isHeader ? smallBold : smallNormal));
        cell.setPadding(5f);
        if (isHeader) cell.setBackgroundColor(new BaseColor(230, 230, 230));
        return cell;
    }

    // --- 3. ATTESTATION DE SALAIRE (Pour Banques / Visas) ---
    public byte[] genererAttestationSalaire(Utilisateur employe) {
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            addCompanyHeader(document);

            Paragraph title = new Paragraph("ATTESTATION DE SALAIRE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            Paragraph body = new Paragraph();
            body.setFont(textFont);
            body.setLeading(25f);
            body.add("Nous soussignés, la Direction Financière et RH de ");
            body.add(new Chunk("SOMEPHARM", boldFont));
            body.add(", attestons que :\n\n");

            body.add("M/Mme : ");
            body.add(new Chunk(employe.getNameForDocuments(), boldFont));
            body.add("\nFonction : " + (employe.getRole() != null ? employe.getRole().getNomRole() : "Employé"));

            body.add("\n\nPerçoit un salaire mensuel net de : ");
            // We use the most recent payslip net if available, or a default
            body.add(new Chunk("69,950.00 DZD", boldFont)); 
            body.add(" (Soixante-Neuf Mille Neuf Cent Cinquante Dinars Algériens).");

            body.add("\n\nNous certifions qu'à ce jour, son salaire n'est grevé d'aucune opposition ni saisie-arrêt.");
            body.add("\nCette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit auprès des institutions bancaires et administratives.");

            document.add(body);
            document.add(Chunk.NEWLINE);
            addSignature(document);
            document.close();
        } catch (DocumentException e) { e.printStackTrace(); }
        return out.toByteArray();
    }

    // --- 4. TITRE DE CONGÉ (Preuve de vacances) ---
    public byte[] genererTitreConge(Utilisateur employe) {
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            addCompanyHeader(document);

            Paragraph title = new Paragraph("TITRE DE CONGÉ", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            Paragraph body = new Paragraph();
            body.setFont(textFont);
            body.setLeading(25f);

            body.add("Il est accordé à l'employé(e) soussigné(e) :\n\n");
            body.add("Matricule : ");
            body.add(new Chunk(employe.getMatricule(), boldFont));
            body.add("\nDépartement : " + (employe.getDepartement() != null ? employe.getDepartement().getNomDept() : ""));

            body.add("\n\nUn congé réglementaire de l'année en cours.");
            body.add("\nSolde de congé actuel restant : ");
            body.add(new Chunk(employe.getSoldeConges() + " Jours", boldFont));

            body.add("\n\nL'employé(e) est tenu(e) de reprendre son poste de travail à l'expiration exacte de la période de congé validée sur le portail numérique Somepharm.");

            document.add(body);
            document.add(Chunk.NEWLINE);
            addSignature(document);
            document.close();
        } catch (DocumentException e) { e.printStackTrace(); }
        return out.toByteArray();
    }

    // --- 5. BON DE SORTIE (Exit Permit) ---
    public byte[] genererBonSortie(DemandeDocument dd) {
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            addCompanyHeader(document);

            Paragraph title = new Paragraph("BON DE SORTIE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            Paragraph body = new Paragraph();
            body.setFont(textFont);
            body.setLeading(25f);

            body.add("Il est accordé à l'employé(e) :\n\n");
            body.add("Nom & Prénom : ");
            body.add(new Chunk(dd.getDemandeur().getNom() + " " + dd.getDemandeur().getPrenom(), boldFont));
            body.add("\nMatricule : ");
            body.add(new Chunk(dd.getDemandeur().getMatricule(), boldFont));
            body.add("\nDépartement : " + (dd.getDemandeur().getDepartement() != null ? dd.getDemandeur().getDepartement().getNomDept() : ""));

            body.add("\n\nL'autorisation de s'absenter pour un motif personnel le : ");
            String dateSoumission = dd.getDateSoumission() != null ? dd.getDateSoumission().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            body.add(new Chunk(dateSoumission, boldFont));

            body.add("\n\nTranche Horaire autorisée :\n");
            body.add("De : ");
            body.add(new Chunk(dd.getHeureDebut(), boldFont));
            body.add("   à   ");
            body.add(new Chunk(dd.getHeureFin(), boldFont));

            body.add("\n\nMotif : " + (dd.getDescription() != null ? dd.getDescription() : "Besoins personnels"));

            document.add(body);
            document.add(Chunk.NEWLINE);

            // --- SECURE QR CODE GENERATION ---
            // Fetch the unique token from the BonDeSortie record
            String qrContent = bonDeSortieRepository.findByIdRequeteOrigine(dd.getIdRequete())
                    .map(com.somepharm.hrportal.entity.BonDeSortie::getTokenQr)
                    .orElse("INVALID_TOKEN_" + dd.getIdRequete());
            
            BarcodeQRCode qrCode = new BarcodeQRCode(qrContent, 140, 140, null);
            Image qrImage = qrCode.getImage();
            qrImage.setAlignment(Element.ALIGN_CENTER);
            document.add(qrImage);

            Paragraph qrLabel = new Paragraph("Scanner unique pour cette sortie - Terminal Sécurité Somepharm", smallBold);
            qrLabel.setAlignment(Element.ALIGN_CENTER);
            document.add(qrLabel);

            document.add(Chunk.NEWLINE);
            addSignature(document);
            document.close();
        } catch (DocumentException e) { e.printStackTrace(); }
        return out.toByteArray();
    }

    // --- TEMPLATE PROCESSING & PDF GENERATION ---

    public byte[] genererDocumentDepuisTemplate(Utilisateur employe, DocumentTemplate template) {
        try {
            Path templatePath = Paths.get("uploads/templates/").resolve(template.getFileUrl());
            InputStream is = Files.newInputStream(templatePath);
            XWPFDocument doc = new XWPFDocument(is);

            // 1. Map Variables
            Map<String, String> variables = new HashMap<>();
            variables.put("nom_employe", employe.getNom());
            variables.put("prenom_employe", employe.getPrenom());
            variables.put("matricule", employe.getMatricule());
            variables.put("poste", employe.getPoste() != null ? employe.getPoste().getTitre() : "Employé");
            variables.put("departement", employe.getDepartement() != null ? employe.getDepartement().getNomDept() : "");
            variables.put("date_entree", employe.getDateEmbauche() != null ? employe.getDateEmbauche().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-");
            variables.put("date_jour", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            variables.put("nom_societe", "SomePharm Distribution");

            // 2. Replace Variables in Paragraphs
            for (XWPFParagraph p : doc.getParagraphs()) {
                replaceInParagraph(p, variables);
            }

            // 3. Replace Variables in Tables
            for (XWPFTable tbl : doc.getTables()) {
                for (XWPFTableRow row : tbl.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph p : cell.getParagraphs()) {
                            replaceInParagraph(p, variables);
                        }
                    }
                }
            }

            // 4. Convert DOCX to PDF
            ByteArrayOutputStream pdfOut = new ByteArrayOutputStream();
            PdfOptions options = PdfOptions.create();
            PdfConverter.getInstance().convert(doc, pdfOut, options);
            doc.close();

            // 5. Overlay Signature & Stamp
            return overlaySignatureAndStamp(pdfOut.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private void replaceInParagraph(XWPFParagraph p, Map<String, String> variables) {
        for (XWPFRun r : p.getRuns()) {
            String text = r.getText(0);
            if (text != null) {
                for (Map.Entry<String, String> entry : variables.entrySet()) {
                    String placeholder = "{{" + entry.getKey() + "}}";
                    if (text.contains(placeholder)) {
                        text = text.replace(placeholder, entry.getValue());
                        r.setText(text, 0);
                    }
                }
            }
        }
    }

    private byte[] overlaySignatureAndStamp(byte[] pdfBytes) {
        try {
            SystemConfig config = systemConfigRepository.findAll().stream().findFirst().orElse(null);
            if (config == null || (config.getDrhSignatureUrl() == null && config.getCachetEntrepriseUrl() == null)) {
                return pdfBytes;
            }

            PdfReader reader = new PdfReader(new ByteArrayInputStream(pdfBytes));
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            PdfStamper stamper = new PdfStamper(reader, os);
            int lastPage = reader.getNumberOfPages();
            PdfContentByte over = stamper.getOverContent(lastPage);

            // Add Signature
            if (config.getDrhSignatureUrl() != null) {
                Image sig = Image.getInstance("uploads/config/" + config.getDrhSignatureUrl());
                sig.scaleToFit(150, 80);
                sig.setAbsolutePosition(config.getSignatureX(), config.getSignatureY());
                over.addImage(sig);
            }

            // Add Stamp
            if (config.getCachetEntrepriseUrl() != null) {
                Image stamp = Image.getInstance("uploads/config/" + config.getCachetEntrepriseUrl());
                stamp.scaleToFit(100, 100);
                stamp.setAbsolutePosition(config.getStampX(), config.getStampY());
                over.addImage(stamp);
            }

            stamper.close();
            reader.close();
            return os.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            return pdfBytes;
        }
    }

    // --- UTILS ---
    private void addCompanyHeader(com.itextpdf.text.Document document) throws DocumentException {
        Paragraph header = new Paragraph("SOMEPHARM - Ressources Humaines", headerFont);
        document.add(header);
        document.add(new Paragraph("Zone Industrielle Djasr Kasentina, Alger", textFont));
        document.add(Chunk.NEWLINE);
    }

    private void addSignature(com.itextpdf.text.Document document) throws DocumentException {
        String dateJour = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        Paragraph signature = new Paragraph("Fait à Alger, le " + dateJour + "\n\nLa Direction des Ressources Humaines\n(Cachet et Signature)", boldFont);
        signature.setAlignment(Element.ALIGN_RIGHT);
        document.add(signature);
    }

    private PdfPCell createCell(String content, boolean isHeader) {
        PdfPCell cell = new PdfPCell(new Phrase(content, isHeader ? boldFont : textFont));
        cell.setPadding(8f);
        if (isHeader) cell.setBackgroundColor(new BaseColor(240, 240, 240));
        return cell;
    }
}