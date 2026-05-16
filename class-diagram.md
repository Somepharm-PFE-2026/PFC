# Class Diagram — Reference

## Enumerations

### «enumeration» SituationFamiliale
- CELIBATAIRE
- MARIE
- DIVORCE
- VEUF

---

## Core Entities

### Role
| Attribute | Type |
|---|---|
| idRole | Long |
| nomRole | String |

---

### USER (Utilisateur)
| Attribute | Type |
|---|---|
| idUser | Long |
| matricule | String |
| email | String |
| motDePasse | String |
| nom | String |
| prenom | String |
| telephone | String |
| dateNaissance | LocalDate |
| photoUrl | String |
| statutCompte | String |
| passwordStatus | String |
| activationDate | LocalDate |
| failedLoginAttempts | Integer |
| lockoutUntil | LocalDateTime |
| temporaryPassword | String |
| soldeConges | Double |
| mustChangePassword | Boolean |
| contactUrgence | String |
| situationFamiliale | SituationFamiliale |
| dateEmbauche | LocalDate |
| deleted | Boolean |
| version | Long |
| customAttributes | Map |

**Methods**
| Method | Return |
|---|---|
| getAuthorities() | Collection |
| getPassword() | String |
| getUsername() | String |
| isAccountNonLocked() | boolean |
| isEnabled() | boolean |
| getNameForDocuments() | String |

---

### Departement
| Attribute | Type |
|---|---|
| idDept | Long |
| nomDept | String |
| deleted | Boolean |
| version | Long |

---

### Poste
| Attribute | Type |
|---|---|
| idPoste | Long |
| titre | String |
| description | String |
| effectifMinimum | Integer |

---

### Site
| Attribute | Type |
|---|---|
| idSite | Long |
| nomSite | String |
| adresse | String |
| ville | String |

---

### TypeConge
| Attribute | Type |
|---|---|
| idTypeConge | Long |
| nom | String |
| quotaInitial | Integer |
| justificatifObligatoire | Boolean |
| description | String |
| couleurHex | String |

---

### Pointage
| Attribute | Type |
|---|---|
| id | Long |
| horodatage | LocalDateTime |
| typePointage | String |
| methode | String |
| latitude | Double |
| longitude | Double |
| statut | String |
| isModifiedManually | Boolean |
| modifiedBy | String |
| modificationReason | String |
| dateModification | LocalDateTime |

---

### BulletinPaie
| Attribute | Type |
|---|---|
| id | Long |
| mois | Integer |
| annee | Integer |
| salaireBase | Double |
| iep | Double |
| primePanier | Double |
| primeTransport | Double |
| autresPrimes | Double |
| retenueCNAS | Double |
| irg | Double |
| salaireBrut | Double |
| netAPayer | Double |
| datePublication | LocalDateTime |
| isDownloaded | Boolean |
| dateConsultation | LocalDateTime |

**Methods**
| Method | Return |
|---|---|
| calculateTotals() | void |

---

### BonDeSortie
| Attribute | Type |
|---|---|
| id | Long |
| tokenQr | String |
| heureSortieEstimee | LocalDateTime |
| dureeEstimeeHeures | Integer |
| heureSortieReelle | LocalDateTime |
| heureRetourReelle | LocalDateTime |
| idRequeteOrigine | UUID |
| heureDebutAutorisee | String |
| heureFinAutorisee | String |
| statut | String |
| motif | String |

---

### UtilisateurHistory
| Attribute | Type |
|---|---|
| idHistory | Long |
| dateChangement | LocalDateTime |
| modifiePar | String |
| motifChangement | String |

---

### Annonce
| Attribute | Type |
|---|---|
| idAnnonce | Long |
| titre | String |
| contenu | String |
| typeAnnonce | String |
| datePublication | LocalDateTime |
| isPinned | Boolean |
| dateExpiration | LocalDateTime |
| imageUrl | String |
| targetType | String |
| targetValue | String |
| priority | String |
| status | String |
| attachmentUrl | String |

---

### AnnonceLecture
| Attribute | Type |
|---|---|
| idLecture | Long |
| dateLecture | LocalDateTime |

---

### DocumentEntreprise
| Attribute | Type |
|---|---|
| id | Long |
| titre | String |
| description | String |
| categorie | String |
| fileUrl | String |
| version | String |
| datePublication | LocalDateTime |
| isPublic | Boolean |

---

### PasswordResetTicket
| Attribute | Type |
|---|---|
| idTicket | Long |
| submittedAt | LocalDateTime |
| processedAt | LocalDateTime |
| securedAt | LocalDateTime |
| status | TicketStatus |
| channel | String |
| temporaryPassword | String |

---

### Terminal
| Attribute | Type |
|---|---|
| id | Long |
| terminalId | String |
| model | String |
| status | String |
| lastActivity | LocalDateTime |
| createdAt | LocalDateTime |

---

## Workflow Classes

### WorkflowCircuit
| Attribute | Type |
|---|---|
| idCircuit | Long |
| nom | String |
| description | String |
| actif | Boolean |

---

### WorkflowEtape
| Attribute | Type |
|---|---|
| idEtape | Long |
| ordre | Integer |
| roleValidateur | String |
| label | String |
| optionnel | Boolean |
| delaiHeures | Integer |
| actionExpiration | String |

---

### WorkflowMapping
| Attribute | Type |
|---|---|
| idMapping | Long |
| typeRequete | String |

---

### WorkflowDelegation
| Attribute | Type |
|---|---|
| idDelegation | Long |
| dateDebut | LocalDate |
| dateFin | LocalDate |
| actif | Boolean |

---

### WorkflowBypassRule
| Attribute | Type |
|---|---|
| idRule | Long |
| nom | String |
| conditionType | String |
| seuilHeures | Integer |
| actif | Boolean |

---

## Request Classes (extend «abstract» Requete)

### «abstract» Requete
| Attribute | Type |
|---|---|
| idRequete | UUID |
| dateSoumission | LocalDateTime |
| description | String |
| statutCycleVie | String |
| commentaireAction | String |
| dateActionManager | LocalDateTime |
| commentaireManager | String |
| justificatifUrl | String |
| dateArriveeRh | LocalDateTime |
| isUrgent | Boolean |
| lastNudgedAt | LocalDateTime |
| nudgeCount | Integer |
| currentEtapeOrdre | Integer |
| deleted | Boolean |
| version | Long |

---

### DemandeConge *(extends Requete)*
| Attribute | Type |
|---|---|
| dateDebut | LocalDate |
| dateFin | LocalDate |
| motif | String |
| balanceDeducted | Boolean |

---

### DemandeDocument *(extends Requete)*
| Attribute | Type |
|---|---|
| typeDocument | String |
| mois | Integer |
| annee | Integer |
| heureDebut | String |
| heureFin | String |

---

### DemandeAdministrative *(extends Requete)*
| Attribute | Type |
|---|---|
| typeDemande | String |
| nouveauStatutMarital | String |
| nouvelleAdresse | String |
| nouveauTelephone | String |
| detailsSupplementaires | String |

---

### DemandeRegularisation *(extends Requete)*
| Attribute | Type |
|---|---|
| heureProposee | LocalDateTime |
| motifRegularisation | String |
| typeRegularisation | String |
