package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.DemandeRegularisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DemandeRegularisationRepository extends JpaRepository<DemandeRegularisation, UUID> {
    List<DemandeRegularisation> findByPointageConcerne_Id(Long idPointage);
}
