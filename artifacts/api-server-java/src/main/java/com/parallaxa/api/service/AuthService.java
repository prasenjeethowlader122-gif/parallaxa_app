package com.parallaxa.api.service;

import com.parallaxa.api.dto.*;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.UserRepository;
import com.parallaxa.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TwoFactorAuthService tfaService;
    private final FileUploadService fileUploadService;

    public AuthResponse register(
            String username,
            String email,
            String password,
            String displayName,
            String dateOfBirthStr,
            MultipartFile faceImage
    ) {
        String normalizedEmail    = email.trim().toLowerCase();
        String normalizedUsername = username.trim().toLowerCase();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepository.findByUsername(normalizedUsername).isPresent()) {
            throw new IllegalArgumentException("Username already taken");
        }

        LocalDateTime dateOfBirth = null;
        if (dateOfBirthStr != null && !dateOfBirthStr.isBlank()) {
            dateOfBirth = parseDateOfBirth(dateOfBirthStr);
        }

        String avatarUrl = null;
        if (faceImage != null && !faceImage.isEmpty()) {
            try {
                avatarUrl = fileUploadService.uploadFile(faceImage);
            } catch (Exception ignored) {}
        }

        var user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(normalizedUsername)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName.trim())
                .dateOfBirth(dateOfBirth)
                .avatarUrl(avatarUrl)
                .role("user")
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
        String jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    private LocalDateTime parseDateOfBirth(String raw) {
        String s = raw.trim();
        if (s.length() <= 10) {
            s = s + "T00:00:00";
        }
        // Strip timezone suffix (Z or +00:00) — store as local
        s = s.replaceAll("Z$", "").replaceAll("\\+\\d{2}:\\d{2}$", "");

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
        );
        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalDateTime.parse(s, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        var user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        // Check frozen status before verifying password to avoid leaking credential validity
        if (user.isFrozen()) {
            throw new IllegalStateException("Account is frozen");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (user.isTwoFactorEnabled()) {
            return AuthResponse.builder().twoFactorRequired(true).build();
        }

        String jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsername(username.toLowerCase().trim()).isEmpty();
    }

    public List<String> suggestUsernames(String base) {
        String cleaned = base.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
        if (cleaned.length() < 2) cleaned = "user";

        List<String> suggestions = new ArrayList<>();
        Random rng = new Random();
        int attempts = 0;
        while (suggestions.size() < 5 && attempts < 30) {
            attempts++;
            String candidate;
            int roll = rng.nextInt(3);
            if (roll == 0) {
                candidate = cleaned + rng.nextInt(1000);
            } else if (roll == 1) {
                candidate = cleaned + "_" + rng.nextInt(999);
            } else {
                String[] prefixes = {"x", "the", "real", "official", "hey"};
                candidate = prefixes[rng.nextInt(prefixes.length)] + "_" + cleaned;
            }
            if (candidate.length() >= 3 && isUsernameAvailable(candidate)) {
                suggestions.add(candidate);
            }
        }
        return suggestions;
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
        return MapResponse.builder().put("message", "2FA enabled successfully").build();
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
        return MapResponse.builder().put("message", "2FA disabled successfully").build();
    }

    public AuthResponse verify2FA(String email, String code) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isFrozen()) {
            throw new IllegalStateException("Account is frozen");
        }

        if (!user.isTwoFactorEnabled()) {
            throw new RuntimeException("2FA not enabled for this user");
        }
        if (!tfaService.isOtpValid(user.getTwoFactorSecret(), code)) {
            throw new RuntimeException("Invalid code");
        }

        String jwtToken = jwtService.generateToken(user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToDto(user))
                .twoFactorRequired(false)
                .build();
    }

    @Transactional
    public void forgotPassword(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpires(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            // In a real app, send an email here.
            System.out.println("RESET TOKEN for " + normalizedEmail + ": " + token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (user.getResetPasswordExpires().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        userRepository.save(user);
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
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
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now())
                .build();
    }
}
