package com.parallaxa.api.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.parallaxa.api.dto.*;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.UserRepository;
import com.parallaxa.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TwoFactorAuthService tfaService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already taken");
        }

        var user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .dateOfBirth(request.getDateOfBirth())
                .role("user")
                .build();

        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        if (user.isFrozen()) {
            throw new RuntimeException("Account is frozen");
        }

        if (user.isTwoFactorEnabled()) {
            return AuthResponse.builder()
                    .twoFactorRequired(true)
                    .build();
        }

        var jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public MapResponse setup2FA(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String secret = tfaService.generateNewSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String qrCodeUri = tfaService.generateQrCodeUri(secret, user.getEmail());

        return MapResponse.builder()
                .put("qrCodeUri", qrCodeUri)
                .put("secret", secret)
                .build();
    }

    @Transactional
    public MapResponse enable2FA(String userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTwoFactorSecret() == null) {
            throw new RuntimeException("2FA not set up");
        }

        if (!tfaService.isOtpValid(user.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Invalid code");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        return MapResponse.builder()
                .put("message", "2FA enabled successfully")
                .build();
    }

    @Transactional
    public MapResponse disable2FA(String userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isTwoFactorEnabled()) {
            throw new RuntimeException("2FA not enabled");
        }

        if (!tfaService.isOtpValid(user.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Invalid code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        return MapResponse.builder()
                .put("message", "2FA disabled successfully")
                .build();
    }

    public AuthResponse verify2FA(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isTwoFactorEnabled()) {
            throw new RuntimeException("2FA not enabled for this user");
        }

        if (!tfaService.isOtpValid(user.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Invalid code");
        }

        var jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .website(user.getWebsite())
                .isVerified(user.isVerified())
                .verificationStatus(user.getVerificationStatus())
                .role(user.getRole())
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .isPrivate(user.isPrivate())
                .followersCount(user.getFollowersCount())
                .followingCount(user.getFollowingCount())
                .postsCount(user.getPostsCount())
                .dateOfBirth(user.getDateOfBirth())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
