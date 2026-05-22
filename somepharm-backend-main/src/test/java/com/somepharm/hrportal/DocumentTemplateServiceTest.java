package com.somepharm.hrportal;

import com.somepharm.hrportal.entity.DocumentTemplate;
import com.somepharm.hrportal.entity.Utilisateur;
import com.somepharm.hrportal.repository.DocumentTemplateRepository;
import com.somepharm.hrportal.repository.UtilisateurRepository;
import com.somepharm.hrportal.service.DocumentService;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DocumentTemplateServiceTest {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private DocumentTemplateRepository templateRepository;

    @Autowired
    private com.somepharm.hrportal.repository.RoleRepository roleRepository;

    @Test
    public void testEndToEndTemplateGeneration() throws IOException {
        // 1. Create a programmatically constructed test DOCX template with placeholders
        Path templatesDir = Paths.get("uploads/templates");
        Files.createDirectories(templatesDir);
        Path templatePath = templatesDir.resolve("test_template.docx");

        try (XWPFDocument doc = new XWPFDocument()) {
            doc.createStyles();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageSz pgSz = sectPr.addNewPgSz();
            pgSz.setW(java.math.BigInteger.valueOf(11906));
            pgSz.setH(java.math.BigInteger.valueOf(16838));
            // Paragraph 1: Standard tags in single runs
            XWPFParagraph p1 = doc.createParagraph();
            XWPFRun r1 = p1.createRun();
            r1.setText("ATTESTATION DE PRESENCE (Test)");
            r1.setBold(true);

            XWPFParagraph p2 = doc.createParagraph();
            XWPFRun r2 = p2.createRun();
            r2.setText("Nous soussignons, {{nom_societe}}, certifions que l'employé(e) :");

            XWPFParagraph p3 = doc.createParagraph();
            XWPFRun r3 = p3.createRun();
            r3.setText("Nom & Prénom : {{prenom_employe}} {{nom_employe}}");

            XWPFParagraph p4 = doc.createParagraph();
            XWPFRun r4 = p4.createRun();
            r4.setText("Matricule : {{matricule}}");

            XWPFParagraph p5 = doc.createParagraph();
            XWPFRun r5 = p5.createRun();
            r5.setText("Poste : {{poste}} dans le service {{departement}}");

            XWPFParagraph p6 = doc.createParagraph();
            XWPFRun r6 = p6.createRun();
            r6.setText("Date d'embauche : {{date_entree}}");

            XWPFParagraph pRole = doc.createParagraph();
            XWPFRun rRole = pRole.createRun();
            rRole.setText("Rôle de l'employé : {{role_employe}}");

            // Paragraph 2: Placeholder split across multiple runs to verify our robust XML run merging
            XWPFParagraph p7 = doc.createParagraph();
            XWPFRun r7a = p7.createRun();
            r7a.setText("Fait le : {{");
            XWPFRun r7b = p7.createRun();
            r7b.setText("date_jour");
            XWPFRun r7c = p7.createRun();
            r7c.setText("}}");

            try (OutputStream os = Files.newOutputStream(templatePath)) {
                doc.write(os);
            }
        }

        assertTrue(Files.exists(templatePath), "Template docx should be created successfully");

        com.somepharm.hrportal.entity.Role secRole = roleRepository.findByNomRole("SECURITY_AGENTS").orElseGet(() -> {
            com.somepharm.hrportal.entity.Role r = new com.somepharm.hrportal.entity.Role();
            r.setNomRole("SECURITY_AGENTS");
            return roleRepository.save(r);
        });

        // 2. Setup/Fetch a test employee
        Utilisateur testEmployee = utilisateurRepository.findByMatricule("SP-EMP1").orElseGet(() -> {
            Utilisateur mock = new Utilisateur();
            mock.setMatricule("SP-EMP1");
            mock.setNom("Lovelace");
            mock.setPrenom("Ada");
            mock.setEmail("ada.lovelace@somepharm.com");
            mock.setStatutCompte("ACTIF");
            mock.setDateEmbauche(LocalDate.of(2025, 1, 15));
            mock.setRole(secRole);
            return utilisateurRepository.save(mock);
        });
        if (testEmployee.getRole() == null) {
            testEmployee.setRole(secRole);
            testEmployee = utilisateurRepository.save(testEmployee);
        }

        // 3. Setup template entity
        DocumentTemplate template = templateRepository.findAll().stream()
                .filter(t -> "test_template.docx".equals(t.getFileUrl()))
                .findFirst()
                .orElseGet(() -> {
                    DocumentTemplate dt = new DocumentTemplate();
                    dt.setNom("Attestation Test");
                    dt.setCategorie("ADMINISTRATIF");
                    dt.setTypeDocument("ATTESTATION_TEST");
                    dt.setFileUrl("test_template.docx");
                    dt.setDescription("Modèle d'attestation pour les tests automatiques");
                    return templateRepository.save(dt);
                });

        // 4. Generate the personalized PDF
        byte[] pdfBytes = documentService.genererDocumentDepuisTemplate(testEmployee, template);

        assertNotNull(pdfBytes, "Generated PDF bytes should not be null");
        assertTrue(pdfBytes.length > 4, "Generated PDF should have content");

        // Verify PDF Magic Bytes (should start with '%PDF-')
        String pdfHeader = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", pdfHeader, "Output file must be a valid PDF");

        // 5. Write the generated PDF to uploads/templates/test_output.pdf for manual inspection
        Path outputPath = templatesDir.resolve("test_output.pdf");
        Files.write(outputPath, pdfBytes);
        assertTrue(Files.exists(outputPath), "Generated PDF output should be written to file");

        System.out.println("--- TEMPLATE SYSTEM END-TO-END TEST SUCCESSFUL ---");
        System.out.println("Test Docx Template: " + templatePath.toAbsolutePath());
        System.out.println("Generated Test PDF: " + outputPath.toAbsolutePath());
    }

    @Test
    public void generateBeautifulTemplate() throws IOException {
        // Output path is the project root (relative to somepharm-backend-main)
        Path templatePath = Paths.get("../beautiful_template.docx");

        try (XWPFDocument doc = new XWPFDocument()) {
            // Set beautiful premium margins (1.2 inches = 1728 dxa)
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar pageMar = sectPr.addNewPgMar();
            pageMar.setLeft(java.math.BigInteger.valueOf(1728));
            pageMar.setRight(java.math.BigInteger.valueOf(1728));
            pageMar.setTop(java.math.BigInteger.valueOf(1728));
            pageMar.setBottom(java.math.BigInteger.valueOf(1728));

            // --- 1. SLEEK BRAND HEADER TABLE (3-CELL MULTI-COLUMN BRANDING) ---
            XWPFTable headerTable = doc.createTable(1, 3);
            headerTable.setWidth("100%");
            // Set table to be completely borderless
            headerTable.setInsideHBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            headerTable.setCellMargins(60, 100, 60, 100);

            // Cell 0: Modern Vertical Teal Left Brand Bar
            XWPFTableCell cellAccentBar = headerTable.getRow(0).getCell(0);
            cellAccentBar.setWidth("160");
            cellAccentBar.setColor("0D9488"); // Radiant Mint Teal Solid Bar

            // Cell 1: Principal Corporate Branding Text
            XWPFTableCell cellBrandText = headerTable.getRow(0).getCell(1);
            cellBrandText.setWidth("5840");
            XWPFParagraph pBrand = cellBrandText.getParagraphs().get(0);
            pBrand.setSpacingAfter(40);
            
            XWPFRun rBrandTitle = pBrand.createRun();
            rBrandTitle.setText("SOMEPHARM DISTRIBUTION\n");
            rBrandTitle.setBold(true);
            rBrandTitle.setFontFamily("Segoe UI");
            rBrandTitle.setFontSize(14);
            rBrandTitle.setColor("0B192C"); // Luxurious Deep Sapphire Navy
            
            XWPFRun rBrandSlogan = pBrand.createRun();
            rBrandSlogan.setText("Solutions & Logistique de Santé de Haute Qualité");
            rBrandSlogan.setFontFamily("Segoe UI");
            rBrandSlogan.setFontSize(8.5);
            rBrandSlogan.setItalic(true);
            rBrandSlogan.setColor("64748B"); // Muted Muted Blue-Gray

            // Cell 2: Right Security / Portal Verification Badge
            XWPFTableCell cellBadge = headerTable.getRow(0).getCell(2);
            cellBadge.setWidth("3500");
            XWPFParagraph pBadge = cellBadge.getParagraphs().get(0);
            pBadge.setAlignment(ParagraphAlignment.RIGHT);
            pBadge.setSpacingAfter(40);
            
            XWPFRun rBadgeTitle = pBadge.createRun();
            rBadgeTitle.setText("PORTAIL RESSOURCES HUMAINES\n");
            rBadgeTitle.setBold(true);
            rBadgeTitle.setFontFamily("Segoe UI");
            rBadgeTitle.setFontSize(8.5);
            rBadgeTitle.setColor("475569");
            
            XWPFRun rBadgeStatus = pBadge.createRun();
            rBadgeStatus.setText("◆ DOCUMENT OFFICIELEMENT CERTIFIÉ");
            rBadgeStatus.setBold(true);
            rBadgeStatus.setFontFamily("Segoe UI");
            rBadgeStatus.setFontSize(8);
            rBadgeStatus.setColor("0D9488"); // Accent Mint Teal

            // --- 2. PIXEL-PERFECT TOP ACCENT DIVIDER BAR ---
            // Creating a real 2pt solid divider line using a colored table row
            XWPFTable dividerTable = doc.createTable(1, 1);
            dividerTable.setWidth("100%");
            dividerTable.setCellMargins(0, 0, 0, 0);
            dividerTable.setInsideHBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            dividerTable.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            dividerTable.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            dividerTable.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            dividerTable.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            dividerTable.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            
            XWPFTableRow divRow = dividerTable.getRow(0);
            divRow.setHeight(40); // Generates a clean thin bar
            XWPFTableCell divCell = divRow.getCell(0);
            divCell.setColor("0B192C"); // Solid Deep Sapphire

            // Spacing after header
            XWPFParagraph spacingHeaderPara = doc.createParagraph();
            spacingHeaderPara.setSpacingBefore(150);
            spacingHeaderPara.setSpacingAfter(150);

            // --- 3. ALIGNED DOCUMENT METADATA (Ref & Date) ---
            XWPFTable metadataTable = doc.createTable(1, 2);
            metadataTable.setWidth("100%");
            metadataTable.setInsideHBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            metadataTable.setCellMargins(0, 0, 0, 0);

            // Left Meta: Ref
            XWPFTableCell cellMetaLeft = metadataTable.getRow(0).getCell(0);
            cellMetaLeft.setWidth("5000");
            XWPFParagraph pMetaLeft = cellMetaLeft.getParagraphs().get(0);
            XWPFRun rmRefLabel = pMetaLeft.createRun();
            rmRefLabel.setText("Référence : ");
            rmRefLabel.setBold(true);
            rmRefLabel.setFontFamily("Segoe UI");
            rmRefLabel.setFontSize(9.5);
            rmRefLabel.setColor("475569");
            
            XWPFRun rmRefVal = pMetaLeft.createRun();
            rmRefVal.setText("SP-AT/{{matricule}}/2026");
            rmRefVal.setFontFamily("Segoe UI");
            rmRefVal.setFontSize(9.5);
            rmRefVal.setColor("0D9488"); // Teal color for reference highlight

            // Right Meta: Date
            XWPFTableCell cellMetaRight = metadataTable.getRow(0).getCell(1);
            cellMetaRight.setWidth("4500");
            XWPFParagraph pMetaRight = cellMetaRight.getParagraphs().get(0);
            pMetaRight.setAlignment(ParagraphAlignment.RIGHT);
            XWPFRun rmDateLabel = pMetaRight.createRun();
            rmDateLabel.setText("Fait à Alger, le : ");
            rmDateLabel.setBold(true);
            rmDateLabel.setFontFamily("Segoe UI");
            rmDateLabel.setFontSize(9.5);
            rmDateLabel.setColor("475569");
            
            XWPFRun rmDateVal = pMetaRight.createRun();
            rmDateVal.setText("{{date_jour}}");
            rmDateVal.setFontFamily("Segoe UI");
            rmDateVal.setFontSize(9.5);
            rmDateVal.setColor("0B192C");

            // Spacing after metadata
            XWPFParagraph spacingMetaPara = doc.createParagraph();
            spacingMetaPara.setSpacingBefore(300);
            spacingMetaPara.setSpacingAfter(300);

            // --- 4. EXECUTIVE TITLE BLOCK ---
            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            titlePara.setSpacingBefore(100);
            titlePara.setSpacingAfter(60);
            
            XWPFRun tr1 = titlePara.createRun();
            tr1.setText("ATTESTATION DE TRAVAIL");
            tr1.setBold(true);
            tr1.setFontFamily("Segoe UI");
            tr1.setFontSize(24);
            tr1.setColor("0B192C"); // Deep Sapphire Black

            XWPFParagraph subtitlePara = doc.createParagraph();
            subtitlePara.setAlignment(ParagraphAlignment.CENTER);
            subtitlePara.setSpacingAfter(450);
            
            XWPFRun tr2 = subtitlePara.createRun();
            tr2.setText("— CERTIFICATION OFFICIELLE D'ACTIVITÉ ET D'ENGAGEMENT —");
            tr2.setBold(true);
            tr2.setFontFamily("Segoe UI");
            tr2.setFontSize(9);
            tr2.setColor("0D9488"); // Mint Teal

            // --- 5. LUXURIOUS INTRODUCTORY STATEMENT CALLOUT PANEL ---
            XWPFTable calloutTable = doc.createTable(1, 1);
            calloutTable.setWidth("100%");
            calloutTable.setCellMargins(180, 220, 180, 220); // Spaced out elegantly
            
            // 5pt Mint Teal left accent border, other borders completely clear
            calloutTable.setLeftBorder(XWPFTable.XWPFBorderType.SINGLE, 36, 0, "0D9488");
            calloutTable.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            calloutTable.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            calloutTable.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");

            XWPFTableCell calloutCell = calloutTable.getRow(0).getCell(0);
            calloutCell.setColor("F0FDFA"); // Very soft Mint Teal background tint
            
            XWPFParagraph cp = calloutCell.getParagraphs().get(0);
            XWPFRun crHeader = cp.createRun();
            crHeader.setText("✦  DÉCLARATION DU DÉPARTEMENT R.H.  ✦\n");
            crHeader.setBold(true);
            crHeader.setFontFamily("Segoe UI");
            crHeader.setFontSize(9.5);
            crHeader.setColor("0D9488");
            
            XWPFRun cpSpacing = cp.createRun();
            cpSpacing.setText("\n");
            cpSpacing.setFontSize(4);

            XWPFRun crBody = cp.createRun();
            crBody.setText("La Direction Générale des Ressources Humaines de la société par actions ");
            crBody.setFontFamily("Segoe UI");
            crBody.setFontSize(10.5);
            crBody.setColor("334155");

            XWPFRun crBold1 = cp.createRun();
            crBold1.setText("{{nom_societe}}");
            crBold1.setBold(true);
            crBold1.setFontFamily("Segoe UI");
            crBold1.setFontSize(10.5);
            crBold1.setColor("0B192C");

            XWPFRun crBody2 = cp.createRun();
            crBody2.setText(" certifie par la présente, après vérification des registres internes d'affectation et de sécurité sociale, que le collaborateur désigné ci-après est engagé sous contrat régulier au sein de notre établissement :");
            crBody2.setFontFamily("Segoe UI");
            crBody2.setFontSize(10.5);
            crBody2.setColor("334155");

            // Spacing after callout box
            XWPFParagraph spacingCalloutPara = doc.createParagraph();
            spacingCalloutPara.setSpacingBefore(300);
            spacingCalloutPara.setSpacingAfter(100);

            // --- 6. MODERN CARD PROFILE DATA GRID ---
            // 6 rows to incorporate all required placeholders
            XWPFTable table = doc.createTable(6, 2);
            table.setWidth("100%");
            table.setCellMargins(160, 220, 160, 220); // Generous padding for clean dashboard look

            // Minimalist border design: no vertical borders, solid Mint Teal top/bottom, thin grey dividers
            table.setInsideHBorder(XWPFTable.XWPFBorderType.SINGLE, 6, 0, "E2E8F0");
            table.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            table.setTopBorder(XWPFTable.XWPFBorderType.SINGLE, 16, 0, "0D9488"); // Top Teal Accent Line
            table.setBottomBorder(XWPFTable.XWPFBorderType.SINGLE, 16, 0, "0D9488"); // Bottom Teal Accent Line
            table.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            table.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");

            String[][] tableData = {
                {"Matricule Salarié", "{{matricule}}"},
                {"Nom Complet", "{{prenom_employe}} {{nom_employe}}"},
                {"Poste & Fonction", "{{poste}}"},
                {"Rôle & Droits d'Accès", "{{role_employe}}"},
                {"Département / Direction", "{{departement}}"},
                {"Date de Recrutement", "{{date_entree}}"}
            };

            for (int i = 0; i < 6; i++) {
                XWPFTableRow row = table.getRow(i);
                
                // Key Column
                XWPFTableCell cellKey = row.getCell(0);
                cellKey.setColor("F8FAFC"); // Neutral very light blue-gray background
                cellKey.setWidth("3000");
                XWPFParagraph pKey = cellKey.getParagraphs().get(0);
                XWPFRun rKey = pKey.createRun();
                rKey.setText("│  " + tableData[i][0].toUpperCase()); // Vertical dash bullet prefix
                rKey.setBold(true);
                rKey.setFontFamily("Segoe UI");
                rKey.setFontSize(8.5);
                rKey.setColor("475569"); // Charcoal

                // Value Column
                XWPFTableCell cellVal = row.getCell(1);
                cellVal.setWidth("6500");
                XWPFParagraph pVal = cellVal.getParagraphs().get(0);
                XWPFRun rVal = pVal.createRun();
                rVal.setText(tableData[i][1]);
                rVal.setFontFamily("Segoe UI");
                rVal.setFontSize(10.5);
                rVal.setColor("0B192C"); // Navy
                
                // Highlight important fields
                if (i == 0 || i == 1 || i == 3) {
                    rVal.setBold(true);
                    if (i == 1) {
                        rVal.setFontSize(11);
                        rVal.setColor("1E1B4B"); // Extra Deep Navy highlight
                    } else if (i == 3) {
                        rVal.setColor("0D9488"); // Teal color for role
                    }
                }
            }

            // Spacing after table
            XWPFParagraph spacingTablePara = doc.createParagraph();
            spacingTablePara.setSpacingBefore(400);

            // --- 7. CLOSING DECLARATION ---
            XWPFParagraph closingPara = doc.createParagraph();
            closingPara.setSpacingAfter(450);
            XWPFRun cr1 = closingPara.createRun();
            cr1.setText("En foi de quoi, la présente attestation officielle est établie pour servir et valoir ce que de droit, conformément aux dispositions réglementaires en vigueur de l'entreprise.\n");
            cr1.setFontFamily("Segoe UI");
            cr1.setFontSize(11);
            cr1.setColor("334155");

            // --- 8. POLISHED SIGNATURE CONTAINER ---
            XWPFParagraph sigPara = doc.createParagraph();
            sigPara.setAlignment(ParagraphAlignment.RIGHT);
            sigPara.setSpacingBefore(100);
            sigPara.setSpacingAfter(950); // High padding to let the digital stamp/signature upload overlay flawlessly

            XWPFRun sr1 = sigPara.createRun();
            sr1.setText("Pour la Direction Générale,\n");
            sr1.setFontFamily("Segoe UI");
            sr1.setFontSize(10.5);
            sr1.setColor("475569");

            XWPFRun sr2 = sigPara.createRun();
            sr2.setText("Le Département des Ressources Humaines\n");
            sr2.setBold(true);
            sr2.setFontFamily("Segoe UI");
            sr2.setFontSize(11);
            sr2.setColor("0B192C");

            XWPFRun sr3 = sigPara.createRun();
            sr3.setText("[ Signature Numérique & Cachet Électronique ]");
            sr3.setFontFamily("Segoe UI");
            sr3.setFontSize(8.5);
            sr3.setItalic(true);
            sr3.setColor("CBD5E1"); // Light placeholder guideline

            // --- 9. DYNAMIC SOLID FOOTER ACCENT BAR ---
            XWPFTable footerDividerTable = doc.createTable(1, 1);
            footerDividerTable.setWidth("100%");
            footerDividerTable.setCellMargins(0, 0, 0, 0);
            footerDividerTable.setInsideHBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            footerDividerTable.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            footerDividerTable.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            footerDividerTable.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            footerDividerTable.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            footerDividerTable.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, "FFFFFF");
            
            XWPFTableRow footerDivRow = footerDividerTable.getRow(0);
            footerDivRow.setHeight(25); // Sleek thin bar
            XWPFTableCell footerDivCell = footerDivRow.getCell(0);
            footerDivCell.setColor("0D9488"); // Accent Mint Teal Bottom Bar

            // --- 10. COMPACT CORPORATE FOOTER TEXT ---
            XWPFParagraph footerTextPara = doc.createParagraph();
            footerTextPara.setAlignment(ParagraphAlignment.CENTER);
            footerTextPara.setSpacingBefore(180);
            footerTextPara.setSpacingAfter(50);
            
            XWPFRun ftr = footerTextPara.createRun();
            ftr.setText("SomePharm Distribution SPA — Siège Social : Zone Industrielle, Djasr Kasentina, Alger\nCapital Social : 100 000 000 DZD — RC : 16/00-09843B23 — NIF : 000216098436574 — E-mail : rh@somepharm.com");
            ftr.setFontFamily("Segoe UI");
            ftr.setFontSize(8);
            ftr.setItalic(true);
            ftr.setColor("94A3B8"); // Clean muted gray

            try (OutputStream os = Files.newOutputStream(templatePath)) {
                doc.write(os);
            }
        }

        System.out.println("--- BEAUTIFUL TEMPLATE CREATION SUCCESSFUL ---");
        System.out.println("Saved to project root: " + templatePath.toAbsolutePath());
    }
}
