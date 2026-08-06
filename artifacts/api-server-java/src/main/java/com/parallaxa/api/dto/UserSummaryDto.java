package com.parallaxa.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isVerified")
    private boolean isVerified;

    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
