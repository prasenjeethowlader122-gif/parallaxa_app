package com.parallaxa.api.controller;

import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.dto.UserDto;
import com.parallaxa.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Map<String, Object>> followUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(userService.followUser(userDetails.getUsername(), userId).getData());
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<Map<String, Object>> unfollowUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(userService.unfollowUser(userDetails.getUsername(), userId).getData());
    }
}
