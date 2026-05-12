package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.WorkflowEtape;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkflowEtapeRepository extends JpaRepository<WorkflowEtape, Long> {
    List<WorkflowEtape> findByCircuit_IdCircuitOrderByOrdreAsc(Long idCircuit);

    @Query("SELECT e.circuit.idCircuit FROM WorkflowEtape e WHERE e.idEtape = :id")
    Optional<Long> findCircuitIdByEtapeId(@Param("id") Long id);

    @Modifying
    @Query(value = "DELETE FROM workflow_etape WHERE id_etape = :id", nativeQuery = true)
    void deleteNative(@Param("id") Long id);

    @Modifying
    @Query(value = "UPDATE workflow_etape SET ordre = ordre - 1 WHERE id_circuit = :circuitId AND ordre > :deletedOrdre", nativeQuery = true)
    void shiftOrdreAfterDelete(@Param("circuitId") Long circuitId, @Param("deletedOrdre") int deletedOrdre);
}
