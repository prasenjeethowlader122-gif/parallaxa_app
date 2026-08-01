package com.parallaxa.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.parallaxa.api.entity.User;
import java.time.LocalDateTime;

public record AdminUserDto(
    String id,
    String username,
    String email,
    String displayName,
    String role,
    @JsonProperty("isVerified") boolean isVerified,
    @JsonProperty("isFrozen") boolean isFrozen,
    boolean twoFactorEnabled,
    int followersCount,
    int followingCount,
    int postsCount,
    LocalDateTime createdAt
) {
    public static AdminUserDto from(User u) {
        return new AdminUserDto(
            u.getId(),
            u.getUsername(),
            u.getEmail(),
            u.getDisplayName(),
            u.getRole(),
            u.isVerified(),
            u.isFrozen(),
            u.isTwoFactorEnabled(),
            u.getFollowersCount(),
            u.getFollowingCount(),
            u.getPostsCount(),
            u.getCreatedAt()
        );
    }
}
