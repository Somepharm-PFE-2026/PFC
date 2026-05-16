import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Seed {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("password123");
        
        System.out.println("BEGIN;");
        for (int i = 1; i <= 10; i++) {
            System.out.println(String.format("INSERT INTO utilisateur (matricule, nom, prenom, email, mot_de_passe, id_role, statut_compte) VALUES ('SP-EMP%d', 'Employee', '%d', 'emp%d@somepharm.com', '%s', 4, 'ACTIF');", i, i, i, hash));
        }
        System.out.println("COMMIT;");
    }
}
