package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Story;
import com.parallaxa.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, String> {
    List<Story> findByUserInAndExpiresAtAfterOrderByCreatedAtDesc(Collection<User> users, LocalDateTime now);
    List<Story> findByUserAndExpiresAtAfterOrderByCreatedAtDesc(User user, LocalDateTime now);
}
