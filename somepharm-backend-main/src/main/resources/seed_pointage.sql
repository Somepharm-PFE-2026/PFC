-- Seed data for Pointages (Attendance)
-- Target Date: Today (2026-04-22)

-- Clean existing pointages for today to avoid duplicates
DELETE FROM pointage WHERE horodatage::date = '2026-04-22';

-- Pointages for SP-EMP (Employee 1) - Correct Logic
INSERT INTO pointage (id_utilisateur, horodatage, type_pointage, methode, statut, is_modified_manually)
SELECT id_user, '2026-04-22 08:05:00', 'ENTREE', 'WEB', 'OK', false FROM utilisateur WHERE matricule = 'SP-EMP';

INSERT INTO pointage (id_utilisateur, horodatage, type_pointage, methode, statut, is_modified_manually)
SELECT id_user, '2026-04-22 12:30:00', 'SORTIE', 'WEB', 'OK', false FROM utilisateur WHERE matricule = 'SP-EMP';

-- Pointages for SP-MGR (Manager) - Late Entry
INSERT INTO pointage (id_utilisateur, horodatage, type_pointage, methode, statut, is_modified_manually)
SELECT id_user, '2026-04-22 09:15:00', 'ENTREE', 'MOBILE', 'RETARD', false FROM utilisateur WHERE matricule = 'SP-MGR';

-- Anomaly for SP-IT (IT Staff) - In entry but no exit yet
INSERT INTO pointage (id_utilisateur, horodatage, type_pointage, methode, statut, is_modified_manually)
SELECT id_user, '2026-04-22 08:30:00', 'ENTREE', 'BADGEUSE', 'OK', false FROM utilisateur WHERE matricule = 'SP-IT';

-- Regularized entry for SP-HR
INSERT INTO pointage (id_utilisateur, horodatage, type_pointage, methode, statut, is_modified_manually, modified_by, modification_reason, date_modification)
SELECT id_user, '2026-04-22 08:00:00', 'ENTREE', 'ADMIN', 'OK', true, 'SYSTEM', 'Régularisation automatique', '2026-04-22 10:00:00' FROM utilisateur WHERE matricule = 'SP-HR';
