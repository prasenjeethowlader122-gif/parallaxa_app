package com.parallaxa.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String website;

    @JsonProperty("isVerified")
    private boolean isVerified;

    private String verificationStatus;
    private String role;
    private boolean twoFactorEnabled;

    @JsonProperty("isPrivate")
    private boolean isPrivate;

    private int followersCount;
    private int followingCount;
    private int postsCount;
    private LocalDateTime dateOfBirth;
    private LocalDateTime createdAt;
}
