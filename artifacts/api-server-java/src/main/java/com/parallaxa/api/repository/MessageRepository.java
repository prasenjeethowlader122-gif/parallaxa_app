package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Conversation;
import com.parallaxa.api.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    Page<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);
    Optional<Message> findTopByConversationOrderByCreatedAtDesc(Conversation conversation);
}
