package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Like;
import com.parallaxa.api.entity.Post;
import com.parallaxa.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);
}
