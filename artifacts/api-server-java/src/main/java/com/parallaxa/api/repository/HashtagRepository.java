package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Hashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, String> {
    Optional<Hashtag> findByName(String name);
    List<Hashtag> findByNameContainingIgnoreCase(String name);
}
