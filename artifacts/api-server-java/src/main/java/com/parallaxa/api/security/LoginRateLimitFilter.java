package com.parallaxa.api.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private long lastCleanup = System.currentTimeMillis();

    private Bucket newBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(15))
                .build())
            .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri != null && uri.matches(".*\\/api\\/auth\\/(login|register|2fa\\/verify)")) {
            // Lazy eviction of buckets map once an hour to prevent memory leak
            long now = System.currentTimeMillis();
            synchronized (buckets) {
                if (now - lastCleanup > java.time.Duration.ofHours(1).toMillis()) {
                    buckets.clear();
                    lastCleanup = now;
                }
            }

            // Identify client IP behind proxy (e.g. Nginx, Cloudflare) via X-Forwarded-For
            String key = req.getHeader("X-Forwarded-For");
            if (key != null && !key.isEmpty()) {
                key = key.split(",")[0].trim();
            } else {
                key = req.getRemoteAddr();
            }

            if (key == null || key.isEmpty()) {
                key = "unknown";
            }
            Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());
            if (!bucket.tryConsume(1)) {
                res.setStatus(429);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
