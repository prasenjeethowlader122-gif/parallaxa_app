package com.parallaxa.api.controller;

import com.parallaxa.api.entity.Story;
import com.parallaxa.api.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {
    private final StoryService storyService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStories(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(storyService.getStories(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<Story> createStory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body
    ) {
        String mediaUrl = (String) body.get("mediaUrl");
        String mediaType = (String) body.get("mediaType");
        int duration = body.get("duration") != null ? ((Number) body.get("duration")).intValue() : 5;

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(storyService.createStory(userDetails.getUsername(), mediaUrl, mediaType, duration));
    }
}
