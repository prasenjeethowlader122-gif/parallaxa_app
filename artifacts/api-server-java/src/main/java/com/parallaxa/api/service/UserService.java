package com.parallaxa.api.service;

import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.dto.UserDto;
import com.parallaxa.api.entity.Follow;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.FollowRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final AuthService authService;

    public UserDto getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return authService.mapToDto(user);
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
