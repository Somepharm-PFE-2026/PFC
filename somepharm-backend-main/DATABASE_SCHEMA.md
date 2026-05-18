# SomePharm HR Portal - Database Schema

This document lists all database entities and their fields used in the SomePharm HR Portal backend.

## Base Class: Requete (Request)
Parent entity for all types of requests (Leave, Documents, Administrative).
*Table: `requete`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idRequete` | Long (PK) | Unique identifier |
| `dateSoumission` | LocalDateTime | Date when the request was submitted |
| `description` | String | Description of the request |
| `statutCycleVie` | String | Workflow status (e.g., EN_ATTENTE_MANAGER, APPROUVE) |
| `commentaireAction` | String | Comment from validator |
| `dateActionManager` | LocalDateTime | Timestamp of manager approval/refusal |
| `nomManagerAction` | String | Name of the manager who took action |
| `commentaireManager` | String | Manager's comment |
| `justificatif_url` | String | URL to attached justification document |
| `dateArriveeRh` | LocalDateTime | Timestamp when request reached HR step |
| `demandeur` | Utilisateur (FK) | The user who created the request |
| `isUrgent` | boolean | Urgency flag |
| `lastNudgedAt` | LocalDateTime | Last time a nudge was sent |
| `nudgeCount` | int | Number of nudges sent |

---

## 1. Annonce (Announcement)
*Table: `annonce`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idAnnonce` | Long (PK) | |
| `titre` | String | Title |
| `contenu` | String (TEXT) | Content |
| `typeAnnonce` | String | NEWS, EVENT, NOTE_SERVICE |
| `auteur` | Utilisateur (FK) | Author |
| `datePublication` | LocalDateTime | |
| `isPinned` | boolean | |
| `dateExpiration` | LocalDateTime | |
| `imageUrl` | String | |
| `targetType` | String | GENERAL, DEPARTMENT, ROLE, SITE, SELECTIVE |
| `targetValue` | String (TEXT) | Values for targeting |
| `priority` | String | NORMAL, URGENT |
| `status` | String | DRAFT, PUBLISHED, ARCHIVED |
| `attachmentUrl` | String | |

## 2. AnnonceLecture (Announcement Read Status)
*Table: `annonce_lecture`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idLecture` | Long (PK) | |
| `annonce` | Annonce (FK) | |
| `utilisateur` | Utilisateur (FK) | |
| `dateLecture` | LocalDateTime | |

## 3. AuditLog
*Table: `AUDIT_LOG`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idLog` | Long (PK) | |
| `typeAction` | String | e.g., LOGIN_SUCCESS, CONFIG_CHANGE |
| `description` | String | |
| `role` | String | Role of the actor |
| `targetEntity` | String | Entity affected |
| `result` | String | SUCCESS or FAILURE |
| `auteur` | String | Name/ID of the actor |
| `timestamp` | LocalDateTime | |

## 4. BonDeSortie (Exit Permit)
*Table: `bon_de_sortie`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `demandeur` | Utilisateur (FK) | |
| `tokenQr` | String | Unique QR code data |
| `heureSortieEstimee` | LocalDateTime | |
| `dureeEstimeeHeures` | int | |
| `heureSortieReelle` | LocalDateTime | Actual exit time |
| `heureRetourReelle` | LocalDateTime | Actual return time |
| `idRequeteOrigine` | Long | Link to original request |
| `heureDebutAutorisee` | String | |
| `heureFinAutorisee` | String | |
| `statut` | String | EN_ATTENTE, EN_COURS, CLOTURE |
| `motif` | String | |

## 5. BulletinPaie (Payslip)
*Table: `BULLETIN_PAIE`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `employe` | Utilisateur (FK) | |
| `mois` | int | |
| `annee` | int | |
| `salaireBase` | double | |
| `iep` | double | Seniority allowance |
| `primePanier` | double | |
| `primeTransport` | double | |
| `autresPrimes` | double | |
| `retenueCNAS` | double | |
| `irg` | double | Income tax |
| `salaireBrut` | double | |
| `netAPayer` | double | |
| `datePublication` | LocalDateTime | |
| `isDownloaded` | boolean | |
| `dateConsultation` | LocalDateTime | |

## 6. ConnectionLog
*Table: `CONNECTION_LOG`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `matricule` | String | |
| `ipAddress` | String | |
| `userAgent` | String | |
| `timestamp` | LocalDateTime | |
| `result` | String | SUCCESS, FAILURE |

## 7. DbBackup
*Table: `db_backups`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `filename` | String | |
| `timestamp` | LocalDateTime | |
| `sizeMb` | Long | |
| `type` | String | AUTOMATIQUE / MANUELLE |
| `integrity` | String | VALID / WARNING / CORRUPTED |
| `checksum` | String | |
| `status` | String | SUCCESS / FAILED |
| `author` | String | |

## 8. DemandeAdministrative
*Table: `demande_administrative` (Extends Requete)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `typeDemande` | String | SITUATION_FAMILIALE, ADRESSE, etc. |
| `nouveauStatutMarital`| String | |
| `nouvelleAdresse` | String | |
| `nouveauTelephone` | String | |
| `detailsSupplementaires`| String | |

## 9. DemandeConge (Leave Request)
*Table: `DEMANDE_CONGE` (Extends Requete)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `dateDebut` | LocalDate | Start date |
| `dateFin` | LocalDate | End date |
| `motif` | String | Reason |
| `typeConge` | TypeConge (FK) | |

## 10. DemandeDocument (Document Request)
*Table: `DEMANDE_DOCUMENT` (Extends Requete)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `typeDocument` | String | ATTESTATION_TRAVAIL, FICHE_PAIE, etc. |
| `mois` | Integer | |
| `annee` | Integer | |
| `heureDebut` | String | |
| `heureFin` | String | |

## 11. DemandeRegularisation (Pointage Correction)
*Table: `demande_regularisation` (Extends Requete)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `pointageConcerne` | Pointage (FK) | |
| `heureProposee` | LocalDateTime | |
| `motifRegularisation` | String (TEXT) | |
| `typeRegularisation` | String | SORTIE_MANQUANTE, ENTREE_MANQUANTE, etc. |

## 12. Departement
*Table: `DEPARTEMENT`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idDept` | Long (PK) | |
| `nomDept` | String | |
| `manager` | Utilisateur (FK) | |

## 13. DocumentEntreprise (Company Document)
*Table: `document_entreprise`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `titre` | String | |
| `description` | String | |
| `categorie` | String | REGLEMENT, ORGANIGRAMME, etc. |
| `fileUrl` | String | |
| `version` | String | |
| `datePublication` | LocalDateTime | |
| `content` | byte[] (LOB) | Binary content |
| `isPublic` | boolean | |

## 14. DocumentTemplate
*Table: `document_template`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `nom` | String | |
| `typeDocument` | String | |
| `fileUrl` | String | Path to .docx template |
| `description` | String | |
| `categorie` | String | |
| `active` | boolean | |
| `mappingJson` | String (TEXT) | DB to template field mapping |

## 15. EmailConfig
*Table: `EMAIL_CONFIG`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `smtpHost` | String | |
| `smtpPort` | int | |
| `smtpUser` | String | |
| `smtpPass` | String | |
| `smtpSecure` | boolean | |
| `welcomeEmailSubject` | String | |
| `welcomeEmailBody` | String (TEXT) | |
| `entrepriseNom` | String | |
| `urlConnexion` | String | |

## 16. JourFerie (Public Holiday)
*Table: `jour_ferie`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `nom` | String | |
| `date` | LocalDate | |
| `isRecurrent` | boolean | Annual vs lunar based |

## 17. Notification
*Table: `NOTIFICATION`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idNotification` | Long (PK) | |
| `idUser` | Long | Target user ID |
| `message` | String | |
| `timestamp` | LocalDateTime | |
| `isRead` | boolean | |

## 18. PasswordResetTicket
*Table: `PASSWORD_RESET_TICKET`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idTicket` | Long (PK) | |
| `utilisateur` | Utilisateur (FK) | |
| `submittedAt` | LocalDateTime | |
| `processedAt` | LocalDateTime | |
| `securedAt` | LocalDateTime | |
| `status` | TicketStatus (Enum)| EN_ATTENTE, ENVOYÉ, etc. |
| `channel` | String | EMAIL / COPIER_COLLER |
| `temporaryPassword` | String | |

## 19. PdfConfig
*Table: `pdf_config`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `engine` | String | PUPPETEER, PDFKIT, etc. |
| `engineStatus` | String | |
| `defaultFont` | String | |
| `timeoutSeconds` | int | |
| `ramAllocatedMb` | int | |
| `maxConcurrentJobs` | int | |
| `retentionPolicyMonths`| int | |
| `pathPaie` | String | Storage path |
| `pathAttestations` | String | |
| `pathBonsSortie` | String | |
| `pathFonts` | String | |
| `pathTemplates` | String | |
| `lastUpdated` | LocalDateTime | |
| `updatedBy` | String | |

## 20. PdfErrorLog
*Table: `pdf_error_log`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `timestamp` | LocalDateTime | |
| `documentType` | String | |
| `matricule` | String | |
| `template` | String | |
| `errorCode` | String | |
| `probableCause` | String | |
| `stackTrace` | String (TEXT) | |
| `status` | String | |

## 21. PdfFont
*Table: `pdf_font`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `name` | String | |
| `fileName` | String | |
| `style` | String | |
| `sizeKb` | long | |
| `status` | String | |

## 22. Pointage (Clock-in/out)
*Table: `pointage`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `employe` | Utilisateur (FK) | |
| `horodatage` | LocalDateTime | |
| `typePointage` | String | ENTREE / SORTIE |
| `methode` | String | WEB, MOBILE, BADGEUSE |
| `latitude` | Double | |
| `longitude` | Double | |
| `statut` | String | OK, RETARD, ANOMALIE |
| `isModifiedManually` | boolean | |
| `modifiedBy` | String | |
| `modificationReason` | String | |
| `dateModification` | LocalDateTime | |

## 23. Poste (Job Position)
*Table: `POSTE`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idPoste` | Long (PK) | |
| `titre` | String | |
| `description` | String | |
| `titre_poste` | String | Legacy field |
| `effectif_minimum` | Integer | |
| `departement` | Departement (FK) | |

## 24. QrConfig (QR Code Security)
*Table: `QR_CONFIG`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `saltSecret` | String | Secret for hashing |
| `algorithm` | String | |
| `ttlSeconds` | int | Token validity duration |
| `maxAlertMarginSeconds`| int | |
| `expiryBehavior` | String | |
| `eclLevel` | String | Error Correction Level |
| `lastUpdated` | LocalDateTime | |
| `updatedBy` | String | |

## 25. Role
*Table: `ROLE`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idRole` | Long (PK) | |
| `nomRole` | String | e.g., ADMIN, RH, EMPLOYE, MANAGER |

## 26. Site (Location)
*Table: `SITE`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idSite` | Long (PK) | |
| `nomSite` | String | |
| `adresse` | String | |
| `ville` | String | |

## 27. StorageConfig
*Table: `storage_config`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `syncDestination` | String | AWS_S3 / NAS / FTP / NONE |
| `syncStatus` | String | |
| `lastSync` | LocalDateTime | |
| `s3Bucket` | String | |
| `s3Region` | String | |
| `s3AccessKey` | String | |
| `s3SecretKey` | String | |
| `remoteAddress` | String | |
| `remotePath` | String | |
| `remoteUser` | String | |
| `remotePassword` | String | |
| `retentionPolicyMonths`| int | |
| `backupSchedule` | String | |

## 28. SystemConfig
*Table: `SYSTEM_CONFIG`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `workingHoursStart` | String | |
| `workingHoursEnd` | String | |
| `toleranceMinutes` | Integer | |
| `urgencyDelayHours` | Integer | |
| `drhSignatureUrl` | String | |
| `cachetEntrepriseUrl` | String | |
| `signatureX` | Float | |
| `signatureY` | Float | |
| `stampX` | Float | |
| `stampY` | Float | |
| `maxFailedAttempts` | Integer | |
| `lockoutDurationMinutes`| Integer | |
| `qrCodeLifetimeMinutes`| Integer | |

## 29. Terminal (Registered Devices)
*Table: `TERMINAL`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Long (PK) | |
| `terminalId` | String | |
| `model` | String | |
| `assignedUser` | Utilisateur (FK) | |
| `status` | String | ACTIF, REVOQUE |
| `lastActivity` | LocalDateTime | |
| `createdAt` | LocalDateTime | |

## 30. TypeConge (Leave Type Master Data)
*Table: `TYPE_CONGE`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idTypeConge` | Long (PK) | |
| `nom` | String | e.g., "Congé Annuel" |
| `quotaInitial` | Integer | Default days per year |
| `justificatifObligatoire`| boolean | |
| `description` | String | |
| `couleurHex` | String | For UI/Calendar |

## 31. Utilisateur (User / Employee)
The core entity for all employees and administrators.
*Table: `UTILISATEUR`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idUser` | Long (PK) | |
| `matricule` | String (Unique) | Primary login ID |
| `email` | String (Unique) | |
| `motDePasse` | String | Hashed password |
| `statutCompte` | String | ACTIF, INACTIF, etc. |
| `passwordStatus` | String | |
| `activationDate` | LocalDate | |
| `passwordResetRequested`| Boolean | |
| `failedLoginAttempts` | Integer | |
| `lockoutUntil` | LocalDateTime | |
| `temporaryPassword` | String | |
| `role` | Role (FK) | |
| `nom` | String | |
| `prenom` | String | |
| `telephone` | String | |
| `dateNaissance` | LocalDate | |
| `photoUrl` | String | |
| `departement` | String | |
| `poste` | String | |
| `site` | Site (FK) | |
| `dateEmbauche` | LocalDate | |
| `managerDirect` | Utilisateur (FK) | |
| `soldeConges` | Double | Leave balance |
| `mustChangePassword` | Boolean | |
| `contactUrgence` | String | |

## 32. WorkflowBypassRule
*Table: `workflow_bypass_rule`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idRule` | Long (PK) | |
| `nom` | String | |
| `conditionType` | String | DEMANDEUR_EST_CHEF, etc. |
| `etapeIgnoree` | String | |
| `seuilHeures` | Integer | |
| `actif` | boolean | |

## 33. WorkflowCircuit (Workflow Definition)
*Table: `workflow_circuit`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idCircuit` | Long (PK) | |
| `nom` | String | |
| `description` | String | |
| `actif` | boolean | |
| `etapes` | List<WorkflowEtape> | Ordered list of steps |

## 34. WorkflowDelegation (Validator Delegation)
*Table: `workflow_delegation`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idDelegation` | Long (PK) | |
| `titre` | Utilisateur (FK) | Absent validator |
| `delegue` | Utilisateur (FK) | Replacement validator |
| `dateDebut` | LocalDate | |
| `dateFin` | LocalDate | |
| `actif` | boolean | |

## 35. WorkflowEtape (Workflow Step)
*Table: `workflow_etape`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idEtape` | Long (PK) | |
| `circuit` | WorkflowCircuit (FK)| |
| `ordre` | int | |
| `roleValidateur` | String | MANAGER, HR_MANAGER, etc. |
| `label` | String | |
| `optionnel` | boolean | |
| `delaiHeures` | int | SLA duration |
| `actionExpiration` | String | RELANCE, ESCALADE, etc. |

## 36. WorkflowMapping
Maps request types to specific workflow circuits.
*Table: `workflow_mapping`*

| Field | Type | Description |
| :--- | :--- | :--- |
| `idMapping` | Long (PK) | |
| `typeRequete` | String (Unique) | CONGE, ATTESTATION, etc. |
| `circuit` | WorkflowCircuit (FK)| |
