package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DemandeAdministrative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeAdministrativeRepository extends JpaRepository<DemandeAdministrative, Long> {
    List<DemandeAdministrative> findByDemandeur_IdUser(Long idUser);
}
