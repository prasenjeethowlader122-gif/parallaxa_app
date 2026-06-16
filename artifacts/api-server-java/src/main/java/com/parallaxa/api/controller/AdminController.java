package com.parallaxa.api.controller;

import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.PostRepository;
import com.parallaxa.api.repository.StoryRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final StoryRepository storyRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("users", userRepository.count());
        stats.put("posts", postRepository.count());
        stats.put("stories", storyRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(Map.of("users", users));
    }

    @PostMapping("/users/{userId}/freeze")
    public ResponseEntity<Void> freezeUser(@PathVariable String userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setFrozen(true);
            userRepository.save(u);
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/unfreeze")
    public ResponseEntity<Void> unfreezeUser(@PathVariable String userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setFrozen(false);
            userRepository.save(u);
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/approve-verification")
    public ResponseEntity<Void> approveVerification(@PathVariable String userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setVerified(true);
            u.setVerificationStatus("approved");
            userRepository.save(u);
        });
        return ResponseEntity.noContent().build();
    }
}
