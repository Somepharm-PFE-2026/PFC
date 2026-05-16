package com.somepharm.hrportal.repository;

import com.somepharm.hrportal.entity.Annonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, Long> {
    List<Annonce> findAllByOrderByIsPinnedDescDatePublicationDesc();
    List<Annonce> findByTypeAnnonceOrderByDatePublicationDesc(String type);
    List<Annonce> findByStatusOrderByIsPinnedDescDatePublicationDesc(String status);
}
