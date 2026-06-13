package com.parallaxa.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryDto {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private boolean isVerified;
    private boolean isFollowing;
}
