package com.parallaxa.api.service;

import com.parallaxa.api.entity.Notification;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.entity.Post;
import com.parallaxa.api.repository.NotificationRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(User user, User fromUser, String type, Post post, String commentId, String commentContent) {
        if (user == null || fromUser == null) {
            return;
        }
        if (user.getId().equals(fromUser.getId())) {
            return; // Don't notify self
        }
        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .fromUser(fromUser)
                .type(type)
                .post(post)
                .commentId(commentId)
                .commentContent(commentContent)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    public List<Map<String, Object>> getNotifications(String userId, int limit) {
        User user = userRepository.findById(userId).orElseThrow();
        PageRequest pageRequest = PageRequest.of(0, limit);
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);

        return notifications.getContent().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<Notification> unread = notificationRepository.findByUserAndIsReadFalse(user);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public long getUnreadCount(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    private Map<String, Object> mapToDto(Notification n) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", n.getId());
        dto.put("type", n.getType());
        dto.put("isRead", n.isRead());
        dto.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt() : LocalDateTime.now());

        Map<String, Object> fromUser = new HashMap<>();
        fromUser.put("id", n.getFromUser().getId());
        fromUser.put("username", n.getFromUser().getUsername());
        fromUser.put("displayName", n.getFromUser().getDisplayName());
        fromUser.put("avatarUrl", n.getFromUser().getAvatarUrl());
        dto.put("fromUser", fromUser);

        if (n.getPost() != null) {
            Map<String, Object> post = new HashMap<>();
            post.put("id", n.getPost().getId());
            post.put("content", n.getPost().getContent());
            dto.put("post", post);
        }

        return dto;
    }
}
