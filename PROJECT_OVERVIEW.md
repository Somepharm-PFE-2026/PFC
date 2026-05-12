# SomePharm HR Portal — Project Overview

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [Database](#7-database)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Core Features & Domains](#9-core-features--domains)
10. [REST API Reference](#10-rest-api-reference)
11. [Workflow Engine](#11-workflow-engine)
12. [Running the Project](#12-running-the-project)
13. [Key Architectural Patterns](#13-key-architectural-patterns)

---

## 1. Project Summary

**SomePharm HR Portal** is a full-stack enterprise Human Resources management system built for a pharmaceutical company. It centralizes employee management, leave requests, attendance tracking, payroll, document handling, company communications, and administrative workflows into a single platform accessible to four distinct user roles: Employee, Manager, HR, and Admin/SuperAdmin.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Spring Boot | 3.3.0 |
| Backend Language | Java | 17 |
| Build Tool | Maven | — |
| ORM | JPA / Hibernate | — |
| Database | PostgreSQL | 16 |
| Security | Spring Security + JWT (JJWT) | 0.11.5 |
| PDF Generation | iTextPDF | 5.5.13.3 |
| Word/Excel Export | Apache POI | 5.2.3 |
| Word-to-PDF | XDocReport | 2.0.4 |
| Email | Spring Mail + Nodemailer | — |
| Frontend Framework | Next.js | 14.2.35 |
| Frontend Language | TypeScript / React | 18 |
| Styling | Tailwind CSS | 3.4.1 |
| Icons | Lucide React | 1.7.0 |
| Rich Text | React Quill | 3.8.3 |
| QR Code | html5-qrcode, qrcode.react | — |
| Token Parsing | jwt-decode | 4.0.0 |
| Containerization | Docker / Docker Compose | — |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  Next.js 14 Frontend                  │
│   Employee | Manager | HR | Admin portals (port 3000) │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP + JWT Bearer Token
┌──────────────────────▼───────────────────────────────┐
│              Spring Boot 3 Backend (port 8080)        │
│  SecurityFilter → Controllers → Services → Repos      │
└──────────────────────┬───────────────────────────────┘
                       │ JPA / JDBC
┌──────────────────────▼───────────────────────────────┐
│              PostgreSQL 16 (port 5432)                │
│              Database: somepharm_hr_db                │
└──────────────────────────────────────────────────────┘
```

The system follows a classic **layered architecture**: REST controllers receive HTTP requests, delegate business logic to service classes, which interact with the database through Spring Data JPA repositories. DTOs act as data contracts between the API surface and the internal domain model.

---

## 4. Project Structure

```
PFC/
├── somepharm-backend-main/          # Spring Boot backend
│   ├── src/main/java/com/somepharm/hrportal/
│   │   ├── config/                  # Security, JWT, DB, Email, Upload config
│   │   ├── controller/              # 27 REST API controllers
│   │   ├── service/                 # 24 business-logic services
│   │   ├── entity/                  # 41 JPA domain entities
│   │   ├── repository/              # Spring Data JPA repositories
│   │   └── dto/                     # 16 Data Transfer Objects
│   └── src/main/resources/
│       └── application.properties   # Runtime configuration
├── somepharm-frontend-main/         # Next.js 14 frontend
│   └── src/app/
│       ├── employee/                # Employee portal pages
│       ├── manager/                 # Manager portal pages
│       ├── hr/                      # HR portal pages
│       ├── admin/                   # Admin cockpit pages
│       ├── components/              # Shared UI components
│       └── context/                 # React context / global state
├── docker-compose.yml               # PostgreSQL container setup
└── PROJECT_OVERVIEW.md              # This file
```

---

## 5. Backend — Spring Boot

### 5.1 Configuration Layer (`config/`)

| Class | Responsibility |
|---|---|
| `SecurityConfig` | JWT filter chain, CORS, stateless session, endpoint permissions |
| `JwtService` | Token generation (24h expiry), validation, claim extraction |
| `JwtAuthenticationFilter` | Intercepts every request to validate Bearer token |
| `AppConfig` | BCryptPasswordEncoder, UserDetailsService, AuthenticationManager beans |
| `DataInitializer` | Seed data on startup |
| `DatabaseFixer` / `SchemaFixer` | Schema repair utilities |
| `UploadConfig` | Multipart file upload paths and limits |
| `EmailConfig` | SMTP server configuration |

### 5.2 Entity Layer — Domain Model (41 entities)

#### User & Organization

| Entity | Key Fields |
|---|---|
| `Utilisateur` | matricule (PK login), motDePasse (BCrypt), role, soldeConges (30 days default), statut (ACTIF / INACTIF / EN_ATTENTE_PREMIERE_CONNEXION), id_manager_direct (self-ref), jsonb custom attributes |
| `Role` | ROLE_ADMIN, ROLE_MANAGER, ROLE_EMPLOYE, ROLE_RH, ROLE_SUPERADMIN |
| `Departement` | name, manager (FK to Utilisateur) |
| `Poste` | Job title |
| `Site` | Physical work location |
| `UtilisateurHistory` | Audit trail of user changes |

#### Requests & Workflow

| Entity | Key Fields |
|---|---|
| `Requete` *(abstract base, Joined Table Inheritance)* | statut_cycle_vie (EN_ATTENTE_MANAGER → VALIDE_MANAGER → APPROUVE / REFUSE), workflow circuit & step refs, audit timestamps |
| `DemandeConge` | Leave dates, type, overlap detection support |
| `DemandeDocument` | Document type, delivery channel |
| `DemandeAdministrative` | Generic admin requests |
| `DemandeRegularisation` | Punch regularization requests |
| `WorkflowCircuit` | Named approval chain template |
| `WorkflowEtape` | Ordered step within a circuit |
| `WorkflowMapping` | Maps request types to circuits |
| `WorkflowDelegation` | Manager delegation rules |
| `WorkflowBypassRule` | Conditional skip rules |

#### Attendance

| Entity | Key Fields |
|---|---|
| `Pointage` | horodatage, type (ENTREE/SORTIE), methode (WEB/MOBILE/BADGEUSE), statut (OK/RETARD/ANOMALIE), manual correction audit |
| `SystemConfig` | Work hours start, tolerance minutes, global settings |
| `Terminal` | Physical badge reader definitions |

#### Payroll

| Entity | Key Fields |
|---|---|
| `BulletinPaie` | salaire_base, bonus (experience, meal, transport), deductions (CNAS 9%, IRG progressive), publication date |

#### Exit Passes

| Entity | Key Fields |
|---|---|
| `BonDeSortie` | QR token, estimated exit/return, actual exit/return, statut (EN_ATTENTE / EN_COURS / CLOTURE) |

#### Communication & Documents

| Entity | Key Fields |
|---|---|
| `Annonce` | type (NEWS/EVENT/NOTE_SERVICE), targeting (GENERAL/DEPARTMENT/ROLE/SITE/SELECTIVE), priorite (NORMAL/URGENT), statut (DRAFT/PUBLISHED/ARCHIVED) |
| `AnnonceLecture` | Per-user read receipts |
| `DocumentEntreprise` | Company-level shared documents |
| `DocumentTemplate` | Dynamic variable-based templates |
| `JourFerie` | Public holidays calendar |

#### System & Admin

| Entity | Key Fields |
|---|---|
| `AuditLog` | User action logging |
| `ConnectionLog` | Login/logout events |
| `Notification` | User in-app notifications |
| `PasswordResetTicket` | Secure one-time reset tokens |
| `DbBackup` | Backup run metadata |
| `PdfConfig` / `PdfFont` / `PdfErrorLog` | PDF generation settings |
| `QrConfig` | QR code generation settings |
| `StorageConfig` | File storage configuration |

### 5.3 Controller Layer (27 controllers)

| Controller | Base Path | Notes |
|---|---|---|
| `AuthenticationController` | `/api/auth` | Login & registration |
| `UtilisateurController` | `/api/utilisateurs` | User CRUD, activation, password reset |
| `DepartementController` | `/api/departements` | Department management |
| `DemandeCongeController` | `/api/demandes` | Leave request lifecycle |
| `DemandeDocumentController` | `/api/demandes-document` | Document request lifecycle |
| `DemandeAdministrativeController` | `/api/demandes-admin` | Administrative requests |
| `RequeteController` | `/api/requetes` | Generic request operations |
| `WorkflowController` | `/api/workflows` | Circuit management & actions |
| `GestionCongesController` | `/api/conges` | Leave balance management |
| `PointageController` | `/api/pointage` | Clock in/out |
| `PresenceController` | `/api/presence` | Attendance reports |
| `DashboardController` | `/api/dashboard` | HR & admin analytics |
| `AnnonceController` | `/api/annonces` | Announcements |
| `DocumentController` | `/api/documents` | Document repository |
| `DocumentTemplateController` | `/api/templates` | Template management |
| `NotificationController` | `/api/notifications` | In-app notifications |
| `PayrollController` | `/api/paie` | Salary slips |
| `BonDeSortieController` | `/api/bons-de-sortie` | Exit pass management |
| `ConfigController` | `/api/config` | System configuration |
| `AdminController` | `/api/admin` | System administration |
| `AdminHealthController` | `/api/admin/health` | Health metrics |
| `QrConfigController` | `/api/admin/qr-config` | QR settings |
| `PdfConfigController` | `/api/admin/pdf-config` | PDF settings |
| `FileController` | `/api/files` | File upload/download |
| `HelpdeskController` | `/api/admin/tickets` | Internal helpdesk |
| `BackupStorageController` | `/api/admin/storage` | Database backups |
| `DemandeNudgeController` | `/api/demandes/{id}/nudge` | Reminder system |

### 5.4 Service Layer (24 services)

| Service | Responsibility |
|---|---|
| `DemandeCongeService` | Overlap detection, working-days calculation, balance validation |
| `WorkflowService` | Dynamic approval routing, multi-step chains, role-based decisions |
| `PointageService` | Clock event processing, tardiness detection |
| `AttendanceCalculationService` | Hours worked, overtime, daily stats |
| `PayrollService` | Salary slip generation with tax/deduction rules |
| `NotificationService` | In-app notification dispatch |
| `EmailService` | SMTP email dispatch |
| `AnnonceService` | Targeting rules, read tracking |
| `AuditService` | Action logging |
| `UtilisateurService` | User lifecycle, activation, password flows |
| `DocumentService` | Document generation and storage |
| `HolidayService` | Public holiday calendar |
| `PdfConfigService` | Dynamic PDF settings |
| `QrConfigService` | QR code configuration |
| `HelpdeskService` | Support ticket management |
| `BackupService` / `BackupStorageService` | Automated DB backup |
| `HealthMonitoringService` | System health checks |
| `DemandeDocumentService` | Document request workflow |
| `DemandeAdministrativeService` | Administrative request handling |

### 5.5 DTO Layer (16 DTOs)

| DTO | Usage |
|---|---|
| `AuthenticationRequest` / `AuthenticationResponse` | Login credentials and returned JWT |
| `RegisterRequest` | New user registration |
| `DemandeCongeDTO` | Leave request data |
| `DemandeDocumentDTO` | Document request data |
| `RequeteDTO` | Generic request container (polymorphic) |
| `UtilisateurDTO` / `UserSummaryDTO` | Full and abbreviated user info |
| `PointageStatusDTO` | Current punch state |
| `AttendanceReportDTO` / `DailyAttendanceDTO` / `PresenceAnalyticsDTO` | Reporting payloads |
| `DepartementDTO` | Department info |
| `ScanResultDTO` | QR / badge scan result |
| `UserActivationResponse` | Activation workflow result |

---

## 6. Frontend — Next.js

### 6.1 Portal Structure

The frontend is divided into **4 role-specific portals**, each with its own sidebar and page set.

#### Employee Portal (`/employee`)

| Route | Description |
|---|---|
| `/employee/dashboard` | Hub with attendance widget, quick actions, announcements |
| `/employee/demandes` | Submit and track leave / document requests |
| `/employee/bons-de-sortie` | Request exit passes, view QR codes |
| `/employee/communication` | Read company announcements |
| `/employee/profil` | Personal profile and settings |
| `/employee/documents` | Access company documents |
| `/employee/calendrier` | Leave calendar view |

#### Manager Portal (`/manager`)

| Route | Description |
|---|---|
| `/manager/dashboard` | Team overview, pending approvals |
| `/manager/demandes` | Approve or refuse team leave requests |
| `/manager/equipe` | Team member management |
| `/manager/rapports` | Team attendance reports |
| `/manager/employes` | Employee list |

#### HR Portal (`/hr`)

| Route | Description |
|---|---|
| `/hr/dashboard` | HR analytics and KPIs |
| `/hr/demandes` | Final HR approval queue |
| `/hr/employes` | Full employee directory |
| `/hr/paie` | Payroll slip generation and distribution |
| `/hr/absences` | Absence tracking |
| `/hr/rapports` | HR analytics reports |
| `/hr/documents` | Company document library |
| `/hr/conges` | Leave balance management |

#### Admin Cockpit (`/admin`)

| Route | Description |
|---|---|
| `/admin/dashboard` | System overview, backup, user management |
| `/admin/activation` | User account activation |
| `/admin/collaborateurs` | Employee master data |
| `/admin/config-mail` | SMTP configuration |
| `/admin/config-pdf` | PDF generation settings |
| `/admin/config-qr` | QR code settings |
| `/admin/health` | System health metrics |
| `/admin/monitoring` | Performance monitoring |
| `/admin/audit` | Audit log viewer |
| `/admin/tickets` | Helpdesk tickets |
| `/admin/storage` | Database backup management |
| `/admin/settings` | Global system settings |

### 6.2 Shared Components (`/components`)

| Component | Purpose |
|---|---|
| `SidebarEmployee` / `SidebarManager` / `SidebarAdmin` / `SidebarSuperAdmin` | Role-specific navigation sidebars |
| `NotificationCenter` | Real-time in-app notifications |
| `UrgentAnnouncementPopup` | Full-screen urgent alert overlay |
| `EmployeeTree` | Organizational hierarchy visualization |
| `SettingsView` | Configuration UI shell |

### 6.3 State Management

- **`UIContext.tsx`**: Global React context managing sidebar state, open modal tracking, and the active HR request being processed. No external state library is used — React Context is sufficient for the current scope.

---

## 7. Database

### 7.1 Connection

```
Host:     localhost
Port:     5432
Database: somepharm_hr_db
User:     postgres
Password: admin2026
Timezone: Africa/Casablanca
```

### 7.2 Key Tables

| Table | Notes |
|---|---|
| `utilisateur` | Core user table, soft-delete via `deleted` column + SQLRestriction |
| `role` | Role definitions |
| `departement` | Department hierarchy |
| `requete` | Base inheritance table for all request types |
| `demande_conge` | Leave request rows (Joined Table Inheritance) |
| `demande_document` | Document request rows |
| `demande_administrative` | Administrative request rows |
| `pointage` | Clock in/out records |
| `bulletin_paie` | Monthly payroll slips |
| `annonce` | Company announcements |
| `annonce_lecture` | Per-user read receipts |
| `bon_de_sortie` | Exit pass records with QR tokens |
| `workflow_circuit` | Approval chain templates |
| `workflow_etape` | Individual circuit steps |
| `workflow_mapping` | Request type → circuit routing |
| `notification` | User notifications |
| `audit_log` | Action tracking |
| `connection_log` | Login events |
| `jour_ferie` | Public holidays |
| `document_entreprise` | Company-level documents |
| `document_template` | Variable-based document templates |

### 7.3 Notable Schema Patterns

- **Soft deletes**: `deleted BOOLEAN` column + Hibernate `@SQLRestriction("deleted = false")` on entities, so deleted records are invisible to all queries without extra filtering.
- **Optimistic locking**: `@Version Long version` fields prevent lost-update race conditions on shared records.
- **JSON attributes**: Some entities use `columnDefinition = "jsonb"` for flexible, schema-less custom fields.
- **Joined Table Inheritance**: `requete` is the discriminated base table; each subtype has its own joined table for extra columns.
- **DDL strategy**: `spring.jpa.hibernate.ddl-auto=update` — schema evolves automatically on startup.

---

## 8. Authentication & Authorization

### 8.1 Login Flow

```
1. POST /api/auth/login  {matricule, motDePasse}
2. DaoAuthenticationProvider + BCryptPasswordEncoder validates credentials
3. JwtService generates signed JWT (HS256, 24h expiry) with claims:
     sub   = matricule
     role  = ROLE_ADMIN | ROLE_MANAGER | ROLE_EMPLOYE | ROLE_RH | ROLE_SUPERADMIN
     solde = leave balance (days)
     dept  = department name
     poste = job title
4. Token returned to client → stored in localStorage
5. All subsequent requests: Authorization: Bearer <token>
6. JwtAuthenticationFilter validates token and sets SecurityContext
```

### 8.2 Endpoint Permissions

| Endpoint Pattern | Access |
|---|---|
| `/api/auth/**` | Public |
| `/api/uploads/**` | Public (file downloads) |
| `/api/admin/tickets/public/**` | Public (helpdesk submission) |
| All others | Requires valid JWT |

### 8.3 Additional Security Measures

- Method-level `@PreAuthorize` annotations for fine-grained role checks.
- Account lockout: 5 failed attempts → 15-minute lock.
- First-login password change enforcement (`EN_ATTENTE_PREMIERE_CONNEXION` status).
- Secure password reset via one-time `PasswordResetTicket` tokens.
- CORS restricted to `localhost:3000` and `localhost:3001`.

---

## 9. Core Features & Domains

### 9.1 Leave Management (Congés)

Employees submit leave requests specifying date range and leave type. The system:
- Detects overlapping requests and rejects duplicates.
- Calculates working days (excluding weekends and public holidays).
- Validates remaining leave balance (`soldeConges`).
- Routes the request through the configured workflow (Manager → HR approval chain).
- Automatically deducts balance upon final approval.

### 9.2 Workflow Engine

A generic configurable engine routes **any request type** through a defined approval chain:
- `WorkflowCircuit` defines a named chain (e.g., "Leave Approval").
- `WorkflowEtape` defines each ordered step with the required approver role.
- `WorkflowMapping` binds a request class to a circuit.
- Supports manager delegation, HR bypass rules, and nudge reminders for stale approvals.

### 9.3 Attendance & Time Tracking

- Web-based punch in/out via `/api/pointage/action`.
- Automatic status classification: OK, RETARD (late), ANOMALIE.
- Manual corrections with a full audit trail of who changed what.
- Daily and monthly attendance reports per employee and department.
- Integration-ready with physical badge reader terminals.

### 9.4 Document Management

- Employees request official documents (employment certificates, attestations).
- Admin/HR can create and publish document templates with variable substitution.
- PDF generation with configurable fonts and layout.
- File uploads capped at 10 MB.

### 9.5 Payroll (Paie)

Monthly salary slips (`BulletinPaie`) are generated with:
- **Gross**: base salary + experience bonus + meal allowance + transport allowance + other bonuses.
- **Deductions**: CNAS at 9%, and IRG using Algeria's progressive income tax brackets.
- Slips are published by HR, and employees can download them as PDFs.

### 9.6 Exit Passes (Bons de Sortie)

- Employees request temporary leave from the workplace during work hours.
- A QR-code token is generated, scannable by security guards.
- The system tracks estimated vs. actual exit and return times.
- Pass lifecycle: EN_ATTENTE → EN_COURS → CLOTURE.

### 9.7 Communication Hub (Annonces)

Company-wide announcements with:
- **Types**: NEWS, EVENT, NOTE_SERVICE.
- **Targeting**: General (all), Department, Role, Site, or Selective (individual list).
- **Priority**: NORMAL or URGENT (urgent ones trigger a full-screen popup overlay).
- **Lifecycle**: DRAFT → PUBLISHED → ARCHIVED.
- Per-user read receipts are stored in `AnnonceLecture`.

### 9.8 Admin Dashboard

The admin cockpit provides:
- User account activation workflow with temporary password generation.
- Multi-user import and bulk management.
- Database backup scheduling and download.
- Audit log and connection log viewers.
- System health metrics (CPU, memory, DB size, uptime).
- Configuration management for email, PDF, QR, and storage settings.

---

## 10. REST API Reference

### Authentication

| Method | Path | Body / Params | Description |
|---|---|---|---|
| POST | `/api/auth/login` | `{matricule, motDePasse}` | Returns JWT token |
| POST | `/api/auth/register` | `RegisterRequest` | Creates pending user |

### User Management

| Method | Path | Description |
|---|---|---|
| GET | `/api/utilisateurs` | List all users |
| GET | `/api/utilisateurs/{matricule}` | Get user |
| PUT | `/api/utilisateurs/{matricule}` | Update user |
| POST | `/api/utilisateurs/{matricule}/activate` | Activate account |
| POST | `/api/utilisateurs/{matricule}/reset-password-super` | Force password reset (admin) |
| POST | `/api/utilisateurs/{matricule}/resend-activation` | Resend activation email |

### Leave Requests

| Method | Path | Description |
|---|---|---|
| POST | `/api/demandes/submit` | Submit leave request |
| GET | `/api/demandes/me` | My requests |
| GET | `/api/demandes/all` | All requests (role-filtered) |
| GET | `/api/demandes/types` | Available leave types |

### Generic Request Actions

| Method | Path | Description |
|---|---|---|
| POST | `/api/requetes/{id}/action` | Manager or HR action (approve/refuse + comment) |
| POST | `/api/demandes/{id}/nudge` | Send reminder for pending request |

### Attendance

| Method | Path | Description |
|---|---|---|
| POST | `/api/pointage/action` | Clock in or out |
| GET | `/api/pointage/status` | Current punch status |
| GET | `/api/presence/report` | Attendance report (date range + employee) |

### Payroll

| Method | Path | Description |
|---|---|---|
| GET | `/api/paie/list` | List salary slips |
| GET | `/api/paie/bulletin/{id}` | Download salary slip |

### Announcements

| Method | Path | Description |
|---|---|---|
| GET | `/api/annonces` | List visible announcements |
| POST | `/api/annonces` | Create announcement |
| PUT | `/api/annonces/{id}` | Update announcement |
| POST | `/api/annonces/{id}/mark-read` | Mark as read |

### Workflow

| Method | Path | Description |
|---|---|---|
| GET | `/api/workflows/circuits` | List all workflow circuits |
| POST | `/api/workflows/{id}/action` | Perform approval step |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/cockpit` | Admin system overview |
| POST | `/api/dashboard/actions/backup` | Trigger database backup |
| POST | `/api/dashboard/actions/purge-logs` | Purge old logs |
| GET | `/api/admin/health` | System health metrics |
| GET | `/api/admin/audit` | Audit logs |

---

## 11. Workflow Engine

The workflow engine is the backbone of all multi-step approval processes. It is fully configurable at runtime without code changes.

```
Request Submitted
      │
      ▼
WorkflowMapping  ──lookup──►  WorkflowCircuit (e.g., "Leave Flow")
                                      │
                              WorkflowEtape #1 (Manager, ordre=1)
                                      │ approve
                              WorkflowEtape #2 (RH, ordre=2)
                                      │ approve
                                   APPROUVÉ
                                      │ refuse (any step)
                                   REFUSÉ
```

- **WorkflowDelegation**: A manager can delegate their approval rights to another user for a period.
- **WorkflowBypassRule**: Define conditions under which a step is skipped automatically.
- **Nudge system**: If a step remains pending beyond a threshold, the employee can trigger a reminder notification to the approver.

---

## 12. Running the Project

### Prerequisites

- Docker Desktop (for PostgreSQL)
- Java 17 JDK
- Maven 3.8+
- Node.js 18+ and npm

### 1. Start the Database

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 container with the `somepharm_hr_db` database.

### 2. Start the Backend

```bash
cd somepharm-backend-main
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**. Hibernate will auto-update the schema on first run.

### 3. Start the Frontend

```bash
cd somepharm-frontend-main
npm install
npm run dev
```

The frontend starts on **http://localhost:3000**.

### Default Credentials

The `DataInitializer` seeds a default admin and test users on first startup. Check `DataInitializer.java` for the seeded matricules and passwords.

---

## 13. Key Architectural Patterns

| Pattern | Where Applied | Why |
|---|---|---|
| **Joined Table Inheritance** | `Requete` base → `DemandeConge`, `DemandeDocument`, `DemandeAdministrative` | Single polymorphic query surface with type-specific columns cleanly separated |
| **Soft Deletes** | `Utilisateur`, critical entities via `@SQLRestriction` | Preserve audit history; prevent accidental data loss |
| **Optimistic Locking** | `@Version Long version` on concurrency-sensitive entities | Prevent lost-update races on shared records without pessimistic DB locks |
| **JWT Stateless Auth** | All API requests | No server-side session storage; horizontally scalable |
| **DTO Pattern** | All controller ↔ service boundaries | Prevent over-serialization of JPA entities; explicit API contracts |
| **Service Layer** | All business logic isolated from controllers | Testable, reusable, transactional units |
| **Repository Pattern** | Spring Data JPA repos per entity | Abstracted data access; custom JPQL/native queries where needed |
| **Polymorphic JSON** | `@JsonTypeInfo` on `Requete` subtypes | Frontend can send any request subtype to a single endpoint |
| **Role-Based Access** | `@PreAuthorize` on methods and `SecurityConfig` rules | Fine-grained per-endpoint and per-method authorization |
| **Dynamic Workflow** | `WorkflowCircuit` / `WorkflowEtape` / `WorkflowMapping` | Approval chains configurable at runtime without code changes |
