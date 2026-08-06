package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Post;
import com.parallaxa.api.entity.SavedPost;
import com.parallaxa.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Optional<SavedPost> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);
    Page<SavedPost> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    void deleteByPost(Post post);
    List<SavedPost> findByUser(User user);
}
