package com.parallaxa.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostDto {
    private String id;
    private UserSummaryDto author;
    private String parentPostId;
    private String content;
    private String imageUrl;
    private String videoUrl;
    private String location;
    private PostDto repostOf;
    private List<String> hashtags;
    private int likesCount;
    private int repostsCount;
    private int repliesCount;
    private int commentsCount;
    private boolean isLiked;
    private boolean isSaved;
    private LocalDateTime createdAt;
}
