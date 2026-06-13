package com.parallaxa.api.service;

import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.entity.Story;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.FollowRepository;
import com.parallaxa.api.repository.StoryRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryService {
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    public List<Map<String, Object>> getStories(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<User> following = followRepository.findByFollower(user).stream()
                .map(f -> f.getFollowing())
                .collect(Collectors.toList());
        following.add(user);

        List<Story> activeStories = storyRepository.findByUserInAndExpiresAtAfterOrderByCreatedAtDesc(following, LocalDateTime.now());

        // Group by user
        Map<String, List<Story>> grouped = activeStories.stream()
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Story>> entry : grouped.entrySet()) {
            User storyUser = userRepository.findById(entry.getKey()).orElseThrow();
            Map<String, Object> group = new HashMap<>();
            group.put("user", Map.of(
                    "id", storyUser.getId(),
                    "username", storyUser.getUsername(),
                    "displayName", storyUser.getDisplayName(),
                    "avatarUrl", storyUser.getAvatarUrl() != null ? storyUser.getAvatarUrl() : ""
            ));
            group.put("stories", entry.getValue().stream().map(this::mapToDto).collect(Collectors.toList()));
            group.put("hasUnviewed", true); // Simplified
            result.add(group);
        }

        return result;
    }

    @Transactional
    public Story createStory(String userId, String mediaUrl, String mediaType, int duration) {
        User user = userRepository.findById(userId).orElseThrow();
        Story story = Story.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .duration(duration)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        return storyRepository.save(story);
    }

    private Map<String, Object> mapToDto(Story story) {
        return Map.of(
                "id", story.getId(),
                "userId", story.getUser().getId(),
                "mediaUrl", story.getMediaUrl(),
                "mediaType", story.getMediaType(),
                "duration", story.getDuration(),
                "viewsCount", story.getViewsCount(),
                "createdAt", story.getCreatedAt() != null ? story.getCreatedAt() : LocalDateTime.now(),
                "expiresAt", story.getExpiresAt()
        );
    }
}
