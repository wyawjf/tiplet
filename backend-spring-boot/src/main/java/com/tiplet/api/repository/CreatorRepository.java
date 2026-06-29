package com.tiplet.api.repository;

import com.tiplet.api.model.Creator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CreatorRepository extends JpaRepository<Creator, String> {
    Optional<Creator> findByEmailIgnoreCase(String email);
    Optional<Creator> findByUsernameIgnoreCase(String username);
}
