package com.parallaxa.api.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/healthz")
    public ResponseEntity<HealthStatus> healthCheck() {
        return ResponseEntity.ok(new HealthStatus("ok"));
    }

    @Data
    @AllArgsConstructor
    static class HealthStatus {
        private String status;
    }
}
