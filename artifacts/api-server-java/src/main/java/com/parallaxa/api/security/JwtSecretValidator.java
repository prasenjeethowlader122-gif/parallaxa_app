package com.parallaxa.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class JwtSecretValidator {
    public JwtSecretValidator(@Value("${application.security.jwt.secret-key:#{null}}") String secret) {
        if (secret == null || secret.trim().isEmpty() || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be set and must be at least 32 bytes (256-bit).");
        }
    }
}
