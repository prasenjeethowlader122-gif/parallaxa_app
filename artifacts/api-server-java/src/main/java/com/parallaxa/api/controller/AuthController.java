package com.parallaxa.api.controller;

import com.parallaxa.api.dto.AuthResponse;
import com.parallaxa.api.dto.LoginRequest;
import com.parallaxa.api.dto.RegisterRequest;
import com.parallaxa.api.dto.MapResponse;
import com.parallaxa.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok().build();
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
