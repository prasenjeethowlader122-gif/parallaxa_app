package com.parallaxa.api.controller;

import com.parallaxa.api.dto.AuthResponse;
import com.parallaxa.api.dto.LoginRequest;
import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * Multipart/form-data registration (Flutter sends FormData via Dio).
     * Simple string fields use @RequestParam (works with multipart text parts).
     * The optional file uses @RequestPart.
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
            @RequestPart("username") String username,
            @RequestPart("email") String email,
            @RequestPart("password") String password,
            @RequestPart("displayName") String displayName,
            @RequestPart(value = "dateOfBirth", required = false) String dateOfBirth,
            @RequestPart(value = "faceImage", required = false) MultipartFile faceImage
    ) {
        log.info("Registration attempt for username: {}, email: {}", username, email);
        try {
            AuthResponse response = authService.register(
                    username, email, password, displayName, dateOfBirth, faceImage);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Conflict");
            error.put("message", Objects.requireNonNullElse(e.getMessage(), "Conflict"));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "InternalServerError",
                            "message", "Registration failed. Please try again."));
        }
    }

    /**
     * JSON registration (no file upload).
     */
    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> registerJson(@RequestBody Map<String, String> body) {
        log.info("JSON Registration attempt for username: {}, email: {}", body.get("username"), body.get("email"));
        try {
            String username    = body.get("username");
            String email       = body.get("email");
            String password    = body.get("password");
            String displayName = body.get("displayName");
            String dateOfBirth = body.get("dateOfBirth");

            if (username == null || email == null || password == null || displayName == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "BadRequest", "message", "Missing required fields"));
            }

            AuthResponse response = authService.register(
                    username, email, password, displayName, dateOfBirth, null);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Conflict");
            error.put("message", Objects.requireNonNullElse(e.getMessage(), "Conflict"));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "InternalServerError",
                            "message", "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (IllegalStateException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Forbidden");
            error.put("message", Objects.requireNonNullElse(e.getMessage(), "Forbidden"));
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized", "message", "Invalid credentials"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.mapToDto(
                authService.getUserById(userDetails.getUsername())));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Reset link sent if email exists"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");
        if (token == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and password are required"));
        }
        try {
            authService.resetPassword(token, password);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        boolean available = authService.isUsernameAvailable(username.toLowerCase().trim());
        return ResponseEntity.ok(Map.of("available", available));
    }

    @GetMapping("/suggest-usernames")
    public ResponseEntity<Map<String, Object>> suggestUsernames(@RequestParam String username) {
        var suggestions = authService.suggestUsernames(username.toLowerCase().trim());
        return ResponseEntity.ok(Map.of("suggestions", suggestions));
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<Map<String, Object>> setup2FA(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.setup2FA(userDetails.getUsername()).getData());
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<Map<String, Object>> enable2FA(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(authService.enable2FA(userDetails.getUsername(), body.get("code")).getData());
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<Map<String, Object>> disable2FA(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(authService.disable2FA(userDetails.getUsername(), body.get("code")).getData());
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verify2FA(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verify2FA(body.get("email"), body.get("code")));
    }
}
