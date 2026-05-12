package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DemandeAdministrative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DemandeAdministrativeRepository extends JpaRepository<DemandeAdministrative, UUID> {
    List<DemandeAdministrative> findByDemandeur_IdUser(Long idUser);
}
