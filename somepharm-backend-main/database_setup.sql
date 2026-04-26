

-- 1. TABLES of reference and security
CREATE TABLE ROLE (
                      id_role SERIAL PRIMARY KEY,
                      nom_role VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE PRIVILEGE (
                           id_privilege SERIAL PRIMARY KEY,
                           nom_privilege VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ROLE_PRIVILEGE (
                                id_role INT REFERENCES ROLE(id_role) ON DELETE CASCADE,
                                id_privilege INT REFERENCES PRIVILEGE(id_privilege) ON DELETE CASCADE,
                                PRIMARY KEY (id_role, id_privilege)
);

CREATE TABLE TYPE_CONGE (
                            id_type_conge SERIAL PRIMARY KEY,
                            libelle VARCHAR(100) NOT NULL,
                            requiert_justificatif BOOLEAN DEFAULT FALSE
);

CREATE TABLE TAG (
                     id_tag SERIAL PRIMARY KEY,
                     nom_tag VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE POSTE (
                       id_poste SERIAL PRIMARY KEY,
                       titre_poste VARCHAR(100) NOT NULL,
                       effectif_minimum INT NOT NULL DEFAULT 1
);

-- creation of departemnt without la Foreign Key manager pour ingnore error of boucle temporelle
CREATE TABLE DEPARTEMENT (
                             id_dept SERIAL PRIMARY KEY,
                             nom_dept VARCHAR(100) NOT NULL,
                             id_manager INT -- Sera lié plus tard via ALTER TABLE
);

-- 2. UTILISATEURS and employee
CREATE TABLE UTILISATEUR (
                             id_user SERIAL PRIMARY KEY,
                             matricule VARCHAR(20) NOT NULL UNIQUE,
                             email VARCHAR(100) NOT NULL UNIQUE,
                             mot_de_passe VARCHAR(255) NOT NULL,
                             statut_compte VARCHAR(20) DEFAULT 'ACTIF',
                             id_role INT REFERENCES ROLE(id_role)
);

-- add of the contraints pour le manager du departement  maintenant que UTILISATEUR existe
ALTER TABLE DEPARTEMENT
    ADD CONSTRAINT fk_dept_manager FOREIGN KEY (id_manager) REFERENCES UTILISATEUR(id_user);

CREATE TABLE PROFIL_RH (
                           id_profil SERIAL PRIMARY KEY,
                           nom VARCHAR(100) NOT NULL,
                           prenom VARCHAR(100) NOT NULL,
                           date_embauche DATE NOT NULL,
                           id_user INT UNIQUE REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE,
                           id_dept INT REFERENCES DEPARTEMENT(id_dept),
                           id_poste INT REFERENCES POSTE(id_poste)
);

-- 3. donnee RH and media
CREATE TABLE FICHIER_ATTACHE (
                                 id_fichier SERIAL PRIMARY KEY,
                                 chemin_url VARCHAR(255) NOT NULL,
                                 type_mime VARCHAR(50),
                                 taille_ko INT
);

CREATE TABLE POINTAGE (
                          id_pointage SERIAL PRIMARY KEY,
                          date_jour DATE NOT NULL,
                          heure_entree TIME,
                          heure_sortie TIME,
                          statut_presence VARCHAR(50),
                          id_user INT REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE
);

CREATE TABLE SOLDE_CONGE (
                             id_solde SERIAL PRIMARY KEY,
                             jours_restants FLOAT NOT NULL DEFAULT 0.0,
                             heures_recup FLOAT NOT NULL DEFAULT 0.0,
                             id_user INT REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE,
                             id_type_conge INT REFERENCES TYPE_CONGE(id_type_conge)
);

-- 4. workflow and  L'HÉRITAGE (REQUETES)
CREATE TABLE REQUETE (
                         id_requete SERIAL PRIMARY KEY,
                         local_sync_uuid VARCHAR(50) UNIQUE,
                         statut_cycle_vie VARCHAR(50) NOT NULL DEFAULT 'BROUILLON',
                         date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         id_user INT REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE
);

CREATE TABLE DEMANDE_CONGE (
                               id_requete INT PRIMARY KEY REFERENCES REQUETE(id_requete) ON DELETE CASCADE,
                               date_debut DATE NOT NULL,
                               date_fin DATE NOT NULL,
                               id_type_conge INT REFERENCES TYPE_CONGE(id_type_conge)
);

CREATE TABLE BON_SORTIE (
                            id_requete INT PRIMARY KEY REFERENCES REQUETE(id_requete) ON DELETE CASCADE,
                            heure_prevue TIME NOT NULL,
                            motif TEXT NOT NULL
);

CREATE TABLE DEMANDE_DOC (
                             id_requete INT PRIMARY KEY REFERENCES REQUETE(id_requete) ON DELETE CASCADE,
                             type_document VARCHAR(100) NOT NULL,
                             id_fichier_genere INT REFERENCES FICHIER_ATTACHE(id_fichier)
);

CREATE TABLE ETAPE_VALIDATION (
                                  id_etape SERIAL PRIMARY KEY,
                                  niveau INT NOT NULL,
                                  decision_prise VARCHAR(50),
                                  commentaire_refus TEXT,
                                  date_traitement TIMESTAMP,
                                  id_requete INT REFERENCES REQUETE(id_requete) ON DELETE CASCADE,
                                  id_validateur INT REFERENCES UTILISATEUR(id_user)
);

-- 5. COMMUNICATION and ai
CREATE TABLE ANNONCE (
                         id_annonce SERIAL PRIMARY KEY,
                         titre VARCHAR(200) NOT NULL,
                         contenu TEXT NOT NULL,
                         date_pub TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         id_auteur INT REFERENCES UTILISATEUR(id_user)
);

CREATE TABLE ANNONCE_TAG (
                             id_annonce INT REFERENCES ANNONCE(id_annonce) ON DELETE CASCADE,
                             id_tag INT REFERENCES TAG(id_tag) ON DELETE CASCADE,
                             PRIMARY KEY (id_annonce, id_tag)
);

CREATE TABLE TICKET_RH (
                           id_ticket SERIAL PRIMARY KEY,
                           sujet VARCHAR(200) NOT NULL,
                           message_confidentiel TEXT NOT NULL,
                           statut_resolution VARCHAR(50) DEFAULT 'OUVERT',
                           id_user INT REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE,
                           id_fichier_preuve INT REFERENCES FICHIER_ATTACHE(id_fichier)
);

CREATE TABLE HISTORIQUE_CHATBOT (
                                    id_chat SERIAL PRIMARY KEY,
                                    prompt_employe TEXT NOT NULL,
                                    reponse_ia TEXT NOT NULL,
                                    date_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    id_user INT REFERENCES UTILISATEUR(id_user) ON DELETE CASCADE
);

-- FIN DU SCRIPT