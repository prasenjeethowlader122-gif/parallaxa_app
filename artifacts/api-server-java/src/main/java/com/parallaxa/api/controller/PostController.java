package com.parallaxa.api.controller;

import com.parallaxa.api.dto.*;
import com.parallaxa.api.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping("/feed")
    public ResponseEntity<PageResponse<PostDto>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "20") int limit
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getFeed(userId, limit));
    }

    @GetMapping("/feed/following")
    public ResponseEntity<PageResponse<PostDto>> getFollowingFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "20") int limit
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(postService.getFollowingFeed(userDetails.getUsername(), limit));
    }

    @PostMapping("/posts")
    public ResponseEntity<PostDto> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreatePostRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(userDetails.getUsername(), request));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDto> getPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getPost(postId, userId));
    }

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<Map<String, Object>> likePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        return ResponseEntity.ok(postService.likePost(userDetails.getUsername(), postId).getData());
    }

    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<Map<String, Object>> unlikePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        return ResponseEntity.ok(postService.unlikePost(userDetails.getUsername(), postId).getData());
    }

    @PostMapping("/posts/{postId}/repost")
    public ResponseEntity<PostDto> repostPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        return ResponseEntity.ok(postService.repostPost(userDetails.getUsername(), postId));
    }

    @GetMapping("/posts/{postId}/replies")
    public ResponseEntity<PageResponse<PostDto>> getPostReplies(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getPostReplies(postId, userId));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId
    ) {
        postService.deletePost(userDetails.getUsername(), postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/explore")
    public ResponseEntity<PageResponse<PostDto>> getExplorePosts(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getExplorePosts(userId));
    }

    @GetMapping("/users/{userId}/posts")
    public ResponseEntity<PageResponse<PostDto>> getUserPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String userId
    ) {
        String currentUserId = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getUserPosts(currentUserId, userId));
    }

    @GetMapping("/posts/saved")
    public ResponseEntity<PageResponse<PostDto>> getSavedPosts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.getSavedPosts(userDetails.getUsername()));
    }
}
