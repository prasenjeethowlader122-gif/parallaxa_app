package com.parallaxa.api.service;

import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.dto.UserDto;
import com.parallaxa.api.entity.Follow;
import com.parallaxa.api.entity.Notification;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.FollowRepository;
import com.parallaxa.api.repository.NotificationRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final AuthService authService;
    private final NotificationRepository notificationRepository;

    public UserDto getUser(String userId) {
        User user;
        if ("me".equals(userId)) {
            throw new RuntimeException("Me alias should be handled by calling with actual ID");
        } else {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        return authService.mapToDto(user);
    }

    @Transactional
    public UserDto updateProfile(String userId, Map<String, Object> updates) {
        User user = userRepository.findById(userId).orElseThrow();

        if (updates.containsKey("displayName")) user.setDisplayName((String) updates.get("displayName"));
        if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
        if (updates.containsKey("website")) user.setWebsite((String) updates.get("website"));
        if (updates.containsKey("avatarUrl")) user.setAvatarUrl((String) updates.get("avatarUrl"));
        if (updates.containsKey("isPrivate")) user.setPrivate((Boolean) updates.get("isPrivate"));

        return authService.mapToDto(userRepository.save(user));
    }

    @Transactional
    public MapResponse followUser(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        User follower = userRepository.findById(followerId).orElseThrow();
        User following = userRepository.findById(followingId).orElseThrow();

        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            return MapResponse.builder().put("message", "Already following").build();
        }

        Follow follow = Follow.builder().follower(follower).following(following).build();
        followRepository.save(follow);

        follower.setFollowingCount(follower.getFollowingCount() + 1);
        following.setFollowersCount(following.getFollowersCount() + 1);
        userRepository.save(follower);
        userRepository.save(following);

        // Create notification for follow
        notificationRepository.save(Notification.builder()
                .id(UUID.randomUUID().toString())
                .user(following)
                .fromUser(follower)
                .type("follow")
                .build());

        return MapResponse.builder().put("message", "Followed").build();
    }

    @Transactional
    public MapResponse unfollowUser(String followerId, String followingId) {
        User follower = userRepository.findById(followerId).orElseThrow();
        User following = userRepository.findById(followingId).orElseThrow();

        followRepository.findByFollowerAndFollowing(follower, following).ifPresent(follow -> {
            followRepository.delete(follow);
            follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
            following.setFollowersCount(Math.max(0, following.getFollowersCount() - 1));
            userRepository.save(follower);
            userRepository.save(following);
        });

        return MapResponse.builder().put("message", "Unfollowed").build();
    }
}
