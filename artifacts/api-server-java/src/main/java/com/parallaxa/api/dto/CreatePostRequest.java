package com.parallaxa.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreatePostRequest {
    private String content;
    private String imageUrl;
    private String videoUrl;
    private String location;
    private String parentPostId;
    private List<String> hashtags;
}
