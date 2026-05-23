-- =====================================================================
-- SOMEPHARM HR PORTAL - DATABASE PROFILE SEEDING & CLEANUP SCRIPT
-- =====================================================================
-- This script replaces generic mock profiles (SP-EMP1 to SP-EMP10, etc.)
-- with realistic Algerian employees, updates existing HR accounts, and
-- seeds 2 weeks of realistic attendance (pointage) data.
-- =====================================================================

BEGIN;

-- =====================================================================
-- STEP 1: CLEAN UP MOCK PROFILES AND DEPENDENCIES
-- =====================================================================

-- Create a temporary table of mock user IDs to simplify cleanup
CREATE TEMP TABLE temp_mock_users AS
SELECT id_user, matricule FROM utilisateur 
WHERE matricule IN (
    'SP-EMP1', 'SP-EMP2', 'SP-EMP3', 'SP-EMP4', 'SP-EMP5', 
    'SP-EMP6', 'SP-EMP7', 'SP-EMP8', 'SP-EMP9', 'SP-EMP10', 
    'SP-EMP01', 'SP-MGR01', 'SP-SEC1', 'SP-SEC2', 'SP-EMP',
    'SP-MGR-VENTES', 'SP-EMP-VENTES1', 'SP-EMP-VENTES2', 
    'SP-MGR-COMPTA', 'SP-EMP-COMPTA', 'SP-MGR-SEC'
);

-- Delete dependent records for these mock users
DELETE FROM pointage WHERE id_utilisateur IN (SELECT id_user FROM temp_mock_users);
DELETE FROM bulletin_paie WHERE id_user IN (SELECT id_user FROM temp_mock_users);
DELETE FROM password_reset_ticket WHERE id_user IN (SELECT id_user FROM temp_mock_users);
DELETE FROM connection_log WHERE matricule IN (SELECT matricule FROM temp_mock_users);
DELETE FROM notification WHERE id_user IN (SELECT id_user FROM temp_mock_users);
DELETE FROM annonce_lecture WHERE id_utilisateur IN (SELECT id_user FROM temp_mock_users);
DELETE FROM workflow_delegation WHERE id_titulaire IN (SELECT id_user FROM temp_mock_users) OR id_delegue IN (SELECT id_user FROM temp_mock_users);
DELETE FROM terminal WHERE assigned_user_id IN (SELECT id_user FROM temp_mock_users);
DELETE FROM bon_de_sortie WHERE demandeur_id IN (SELECT id_user FROM temp_mock_users);

-- Delete requests and their subtypes
DELETE FROM demande_conge WHERE id_requete IN (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e'
) OR id_requete IN (SELECT id_requete FROM requete WHERE id_user IN (SELECT id_user FROM temp_mock_users));

DELETE FROM demande_document WHERE id_requete IN (SELECT id_requete FROM requete WHERE id_user IN (SELECT id_user FROM temp_mock_users));
DELETE FROM demande_administrative WHERE id_requete IN (SELECT id_requete FROM requete WHERE id_user IN (SELECT id_user FROM temp_mock_users));
DELETE FROM demande_regularisation WHERE id_requete IN (SELECT id_requete FROM requete WHERE id_user IN (SELECT id_user FROM temp_mock_users));

DELETE FROM requete WHERE id_requete IN (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e'
) OR id_user IN (SELECT id_user FROM temp_mock_users);

-- Set department managers to NULL if they were mock users
UPDATE departement SET id_manager = NULL WHERE id_manager IN (SELECT id_user FROM temp_mock_users);

-- Set direct managers of remaining users to NULL if they pointed to mock users
UPDATE utilisateur SET id_manager_direct = NULL WHERE id_manager_direct IN (SELECT id_user FROM temp_mock_users);

-- Delete from the core utilisateur table
DELETE FROM utilisateur WHERE id_user IN (SELECT id_user FROM temp_mock_users);

-- Drop the temporary table
DROP TABLE temp_mock_users;

-- =====================================================================
-- STEP 2: UPDATE HR & HRMGR PROFILES WITH REAL ALGERIAN DATA
-- =====================================================================

-- Update existing HR Manager (SP-HRMGR, ID = 1)
UPDATE utilisateur 
SET prenom = 'Yasmin', 
    nom = 'Benali', 
    email = 'y.benali@somepharm.dz', 
    telephone = '0550123456', 
    date_naissance = '1985-06-15', 
    date_embauche = '2018-03-10', 
    situation_familiale = 'MARIE', 
    solde_conges = 28.5, 
    contact_urgence = 'Karim Benali (Epoux) - 0550987654',
    photo_url = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yasmin',
    deleted = false,
    version = COALESCE(version, 0) + 1
WHERE id_user = 1;

-- Update existing HR Specialist (SP-HR, ID = 6)
UPDATE utilisateur 
SET prenom = 'Meriem', 
    nom = 'Bouaza', 
    email = 'm.bouaza@somepharm.dz', 
    telephone = '0661987654', 
    date_naissance = '1992-09-22', 
    date_embauche = '2021-06-01', 
    situation_familiale = 'CELIBATAIRE', 
    solde_conges = 22.0, 
    contact_urgence = 'Ahmed Bouaza (Père) - 0661123456',
    photo_url = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Meriem',
    id_manager_direct = 1,
    deleted = false,
    version = COALESCE(version, 0) + 1
WHERE id_user = 6;

-- Ensure the HR Department manager is correctly mapped
UPDATE departement SET id_manager = 1 WHERE id_dept = 2;

-- =====================================================================
-- STEP 3: INSERT NEW REAL ALGERIAN PROFILES
-- =====================================================================
-- Password hash is BCrypt for 'password123'
-- ($2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2)

-- 1. Sales Department (VENTES, ID = 3)
-- Manager: Sofiane Hamdi (ID = 31)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, version)
VALUES (31, 'SP-MGR-VENTES', 'Hamdi', 'Sofiane', 's.hamdi@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0770123456', '1982-11-04', '2015-05-15', 'Nadia Hamdi (Epouse) - 0770987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sofiane', 2, 3, 5, 1, 1);

UPDATE departement SET id_manager = 31 WHERE id_dept = 3;

-- Sales Employee 1: Amel Chaoui (ID = 32)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, id_manager_direct, version)
VALUES (32, 'SP-EMP-VENTES1', 'Chaoui', 'Amel', 'a.chaoui@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'CELIBATAIRE', '0555321456', '1995-04-18', '2022-01-10', 'Fatma Chaoui (Mère) - 0555987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amel', 3, 3, 6, 1, 31, 1);

-- Sales Employee 2: Fares Bensemra (ID = 33)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, id_manager_direct, version)
VALUES (33, 'SP-EMP-VENTES2', 'Bensemra', 'Fares', 'f.bensemra@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0662456789', '1989-08-30', '2019-09-01', 'Lina Bensemra (Epouse) - 0662987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Fares', 3, 3, 6, 1, 31, 1);

-- 2. Finance Department (COMPTABLE, ID = 4)
-- Manager: Nassima Haddad (ID = 34)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, version)
VALUES (34, 'SP-MGR-COMPTA', 'Haddad', 'Nassima', 'n.haddad@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0552789123', '1980-03-25', '2014-02-01', 'Rachid Haddad (Epoux) - 0552987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nassima', 2, 4, 7, 1, 1);

UPDATE departement SET id_manager = 34 WHERE id_dept = 4;

-- Finance Employee: Yacine Brahimi (ID = 35)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, id_manager_direct, version)
VALUES (35, 'SP-EMP-COMPTA', 'Brahimi', 'Yacine', 'y.brahimi@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'CELIBATAIRE', '0775654321', '1993-07-12', '2020-11-15', 'Omar Brahimi (Frère) - 0775123456', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Yacine', 3, 4, 8, 1, 34, 1);

-- 3. Security Department (SECURITE, ID = 1)
-- Manager: Mustapha Khelifi (ID = 36)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, version)
VALUES (36, 'SP-MGR-SEC', 'Khelifi', 'Mustapha', 'm.khelifi@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0660456123', '1976-05-02', '2010-10-01', 'Khadidja Khelifi (Epouse) - 0660987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mustapha', 2, 1, 1, 1, 1);

UPDATE departement SET id_manager = 36 WHERE id_dept = 1;

-- Security Guard 1: Kamel Zeroual (ID = 37)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, id_manager_direct, version)
VALUES (37, 'SP-SEC1', 'Zeroual', 'Kamel', 'k.zeroual@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0559123456', '1984-01-20', '2017-04-15', 'Fatiha Zeroual (Epouse) - 0559987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kamel', 6, 1, 2, 1, 36, 1);

-- Security Guard 2: Redouane Djeffal (ID = 38)
INSERT INTO utilisateur (id_user, matricule, nom, prenom, email, mot_de_passe, statut_compte, must_change_password, password_reset_requested, failed_login_attempts, solde_conges, deleted, situation_familiale, telephone, date_naissance, date_embauche, contact_urgence, photo_url, id_role, id_dept, id_poste, id_site, id_manager_direct, version)
VALUES (38, 'SP-SEC2', 'Djeffal', 'Redouane', 'r.djeffal@somepharm.dz', '$2a$10$EPIWwlTdIVJ3RBXwvp86vO64sHbCGVZxZeQ7bBwPjJ9h8JQC7Ib/2', 'ACTIF', false, false, 0, 30.0, false, 'MARIE', '0663789456', '1987-12-05', '2019-06-01', 'Zahra Djeffal (Mère) - 0663987654', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Redouane', 6, 1, 2, 1, 36, 1);

-- =====================================================================
-- STEP 4: SEED REALISTIC POINTAGES (ATTENDANCE LOGS)
-- =====================================================================
-- Time period: May 10, 2026 to May 21, 2026
-- Working days in Algeria: Sunday to Thursday (Weekends: Friday, Saturday)
-- Theoretical start: 08:00 (tolerance: 21 mins), end: 17:00

-- Create a helper function to seed Entry/Exit pairs easily
CREATE OR REPLACE FUNCTION seed_pointage_pair(
    p_id_user bigint, 
    p_date date, 
    p_entry_time time, 
    p_exit_time time,
    p_entry_statut varchar, 
    p_exit_statut varchar
) RETURNS void AS $$
BEGIN
    -- Insert Entry
    IF p_entry_time IS NOT NULL THEN
        INSERT INTO pointage (horodatage, type_pointage, methode, statut, is_modified_manually, id_utilisateur)
        VALUES (p_date + p_entry_time, 'ENTREE', 'WEB', p_entry_statut, false, p_id_user);
    END IF;
    
    -- Insert Exit
    IF p_exit_time IS NOT NULL THEN
        INSERT INTO pointage (horodatage, type_pointage, methode, statut, is_modified_manually, id_utilisateur)
        VALUES (p_date + p_exit_time, 'SORTIE', 'WEB', p_exit_statut, false, p_id_user);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply function to generate realistic attendance data:

-- ----------------------------------------------------
-- Amel Chaoui (SP-EMP-VENTES1, ID = 32) - Punctual Worker
-- ----------------------------------------------------
SELECT seed_pointage_pair(32, '2026-05-10', '08:05:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-11', '08:02:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-12', '08:04:00', '17:04:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-13', '08:08:00', '17:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-14', '08:05:00', '17:03:00', 'OK', 'OK');
-- Weekend (15, 16) - No logs
SELECT seed_pointage_pair(32, '2026-05-17', '08:12:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-18', '08:03:00', '17:05:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-19', '08:07:00', '17:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-20', '08:05:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(32, '2026-05-21', '08:04:00', '17:01:00', 'OK', 'OK');

-- ----------------------------------------------------
-- Fares Bensemra (SP-EMP-VENTES2, ID = 33) - Occasional Tardiness
-- ----------------------------------------------------
SELECT seed_pointage_pair(33, '2026-05-10', '08:08:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-11', '08:05:00', '12:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-12', '08:10:00', '14:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-13', '08:04:00', '13:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-14', '08:09:00', '11:30:00', 'OK', 'OK');
-- Weekend (15, 16) - No logs
SELECT seed_pointage_pair(33, '2026-05-17', '08:35:00', '17:00:00', 'RETARD', 'OK'); -- LATE clock-in (08:35 > 08:21)
SELECT seed_pointage_pair(33, '2026-05-18', '08:08:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-19', '08:45:00', '17:05:00', 'RETARD', 'OK'); -- LATE clock-in (08:45 > 08:21)
SELECT seed_pointage_pair(33, '2026-05-20', '08:12:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(33, '2026-05-21', '08:06:00', '17:00:00', 'OK', 'OK');

-- ----------------------------------------------------
-- Yacine Brahimi (SP-EMP-COMPTA, ID = 35) - Overtime
-- ----------------------------------------------------
SELECT seed_pointage_pair(35, '2026-05-10', '08:04:00', '17:03:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-11', '08:05:00', '17:05:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-12', '08:02:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-13', '08:06:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-14', '08:05:00', '17:00:00', 'OK', 'OK');
-- Weekend: Saturday Overtime work (Compensated)
SELECT seed_pointage_pair(35, '2026-05-16', '09:00:00', '13:00:00', 'HEURES_SUP', 'HEURES_SUP');
-- Working week
SELECT seed_pointage_pair(35, '2026-05-17', '08:05:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-18', '08:00:00', '19:30:00', 'OK', 'HEURES_SUP'); -- Evening Overtime (19:30 > 17:00)
SELECT seed_pointage_pair(35, '2026-05-19', '08:07:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-20', '08:05:00', '17:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(35, '2026-05-21', '08:03:00', '17:04:00', 'OK', 'OK');

-- ----------------------------------------------------
-- Kamel Zeroual (SP-SEC1, ID = 37) - Missing Exit (Anomaly)
-- ----------------------------------------------------
SELECT seed_pointage_pair(37, '2026-05-10', '07:55:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-11', '07:58:00', '17:05:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-12', '07:54:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-13', '07:57:00', '17:03:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-14', '07:56:00', '17:02:00', 'OK', 'OK');
-- Weekend (15, 16) - No logs
SELECT seed_pointage_pair(37, '2026-05-17', '07:58:00', '17:04:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-18', '07:55:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-19', '07:59:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(37, '2026-05-20', '07:55:00', NULL, 'OK', NULL); -- MISSING CLOCK-OUT (ANOMALIE)
SELECT seed_pointage_pair(37, '2026-05-21', '07:56:00', '17:02:00', 'OK', 'OK');

-- ----------------------------------------------------
-- Redouane Djeffal (SP-SEC2, ID = 38) - Missing Entry (Anomaly)
-- ----------------------------------------------------
SELECT seed_pointage_pair(38, '2026-05-10', '08:02:00', '17:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-11', '07:59:00', '17:04:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-12', '08:01:00', '17:03:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-13', '08:03:00', '17:01:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-14', '07:58:00', '17:02:00', 'OK', 'OK');
-- Weekend (15, 16) - No logs
SELECT seed_pointage_pair(38, '2026-05-17', '08:01:00', '17:03:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-18', '08:03:00', '17:02:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-19', '08:02:00', '17:00:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-20', '08:00:00', '17:05:00', 'OK', 'OK');
SELECT seed_pointage_pair(38, '2026-05-21', NULL, '17:00:00', NULL, 'OK'); -- MISSING CLOCK-IN (ANOMALIE)

-- Clean up helper function
DROP FUNCTION seed_pointage_pair(bigint, date, time, time, varchar, varchar);

-- =====================================================================
-- STEP 5: SEED REALISTIC LEAVE REQUESTS
-- =====================================================================

-- Profile 1: Fares Bensemra (ID = 33, Sales Employee)
-- Request 1: Approved Annual Leave (Conge Annuel)
-- Dates: June 1, 2026 to June 10, 2026 (10 calendar days, 8 working days)
-- Status: 'APPROUVE', balance_deducted = true
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '2026-05-12 09:15:00',
    'Demande de conge annuel pour convenance personnelle',
    'APPROUVE',
    'Valide et approuve par le departement RH.',
    '2026-05-13 14:00:00',
    'Approuve pour la periode demandee.',
    false,
    0,
    33,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    '2026-06-01',
    '2026-06-10',
    'Voyage de vacances en famille a Jijel',
    1, -- Conge Annuel
    true
);

-- Profile 1: Fares Bensemra (ID = 33, Sales Employee)
-- Request 2: Rejected Sick Leave (Maladie)
-- Dates: May 18, 2026 to May 19, 2026 (2 calendar days, 2 working days)
-- Status: 'REFUSE', balance_deducted = false
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    '2026-05-18 08:30:00',
    'Demande de conge maladie',
    'REFUSE',
    'Refuse car le certificat n''a pas ete fourni dans les 48 heures reglementaires.',
    '2026-05-20 10:30:00',
    'Veuillez fournir un justificatif medical valide.',
    false,
    0,
    33,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    '2026-05-18',
    '2026-05-19',
    'Grippe saisonniere legere sans certificat',
    2, -- Maladie
    false
);

-- Profile 2: Amel Chaoui (ID = 32, Sales Employee)
-- Request 3: Approved Sick Leave (Maladie)
-- Dates: May 12, 2026 to May 14, 2026 (3 calendar days, 3 working days)
-- Status: 'APPROUVE', balance_deducted = true (processed)
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, justificatif_url, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    '2026-05-11 15:40:00',
    'Demande de conge maladie justifie',
    'APPROUVE',
    'Certificat medical valide recu et traite.',
    '2026-05-12 09:00:00',
    'Repos maladie approuve, bon retablissement.',
    '/uploads/certifs/amel_certif_medical.pdf',
    true,
    0,
    32,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    '2026-05-12',
    '2026-05-14',
    'Consultation medicale urgente et repos prescrit',
    2, -- Maladie
    true
);

-- Profile 3: Yacine Brahimi (ID = 35, Finance Employee)
-- Request 4: Pending HR Validation Annual Leave (Conge Annuel)
-- Dates: July 5, 2026 to July 20, 2026 (16 calendar days, 12 working days)
-- Status: 'EN_ATTENTE_RH', balance_deducted = false
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    '2026-05-20 11:20:00',
    'Demande de conge annuel d''ete',
    'EN_ATTENTE_RH',
    '2026-05-21 09:30:00',
    'Recommande favorablement par le responsable financier.',
    false,
    0,
    35,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    '2026-07-05',
    '2026-07-20',
    'Repos estival annuel et voyage familial',
    1, -- Conge Annuel
    false
);

-- Profile 3: Yacine Brahimi (ID = 35, Finance Employee)
-- Request 5: Approved Marriage Leave (Mariage)
-- Dates: June 15, 2026 to June 17, 2026 (3 calendar days, 3 working days)
-- Status: 'APPROUVE', balance_deducted = true
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    '2026-05-10 14:00:00',
    'Conge de mariage officiel',
    'APPROUVE',
    'Felicitations ! Documents de mariage valides.',
    '2026-05-11 11:00:00',
    'Felicitations pour votre mariage.',
    false,
    0,
    35,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    '2026-06-15',
    '2026-06-17',
    'Celebration de mon mariage personnel',
    4, -- Mariage
    true
);

-- Profile 4: Kamel Zeroual (ID = 37, Security Guard)
-- Request 6: Approved Naissance Leave (Naissance)
-- Dates: May 24, 2026 to May 26, 2026 (3 calendar days, 3 working days)
-- Status: 'APPROUVE', balance_deducted = true
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    '2026-05-22 10:00:00',
    'Conge de naissance (Pere)',
    'APPROUVE',
    'Felicitations pour le nouveau-ne ! Livret de famille a fournir des reception.',
    '2026-05-22 11:00:00',
    'Felicitations Kamel, conge de naissance accorde.',
    true,
    0,
    37,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    '2026-05-24',
    '2026-05-26',
    'Naissance de mon fils et demarches administratives',
    5, -- Naissance
    true
);

-- Profile 5: Redouane Djeffal (ID = 38, Security Guard)
-- Request 7: Pending Manager Validation Annual Leave (Conge Annuel)
-- Dates: August 10, 2026 to August 24, 2026 (15 calendar days, 11 working days)
-- Status: 'EN_ATTENTE_MANAGER', balance_deducted = false
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    '2026-05-21 16:30:00',
    'Demande de conge annuel tardif',
    'EN_ATTENTE_MANAGER',
    false,
    0,
    38,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d',
    '2026-08-10',
    '2026-08-24',
    'Visite familiale en province',
    1, -- Conge Annuel
    false
);

-- Profile 6: Meriem Bouaza (ID = 6, HR Specialist)
-- Request 8: Approved Deces Leave (Deces)
-- Dates: April 12, 2026 to April 14, 2026 (3 calendar days, 3 working days)
-- Status: 'APPROUVE', balance_deducted = true
INSERT INTO requete (id_requete, date_soumission, description, statut_cycle_vie, commentaire_action, date_action_manager, commentaire_manager, is_urgent, nudge_count, id_user, deleted, version)
VALUES (
    'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e',
    '2026-04-12 08:00:00',
    'Conge exceptionnel pour deces',
    'APPROUVE',
    'Condoleances les plus sinceres. Traite par la DRH.',
    '2026-04-12 08:30:00',
    'Toutes nos condoleances Meriem, accorde immediatement.',
    true,
    0,
    6,
    false,
    1
);

INSERT INTO demande_conge (id_requete, date_debut, date_fin, motif, id_type_conge, balance_deducted)
VALUES (
    'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e',
    '2026-04-12',
    '2026-04-14',
    'Deces de ma grand-mere maternelle',
    6, -- Deces
    true
);

-- Profile 1: Fares Bensemra (ID = 33): Deduct 8 working days from initial 30.0 -> 22.0
UPDATE utilisateur SET solde_conges = 22.0 WHERE id_user = 33;

-- =====================================================================
-- STEP 6: SYNCHRONIZE DATABASE PRIMARY KEY SEQUENCES
-- =====================================================================
SELECT setval('utilisateur_id_user_seq', COALESCE((SELECT MAX(id_user) FROM utilisateur), 1));
SELECT setval('pointage_id_pointage_seq', COALESCE((SELECT MAX(id_pointage) FROM pointage), 1));

COMMIT;
