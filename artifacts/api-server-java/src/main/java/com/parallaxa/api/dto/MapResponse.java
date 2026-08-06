package com.parallaxa.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MapResponse {
    @Builder.Default
    private Map<String, Object> data = new HashMap<>();

    public static class MapResponseBuilder {
        private Map<String, Object> data = new HashMap<>();

        public MapResponseBuilder put(String key, Object value) {
            data.put(key, value);
            return this;
        }
    }
}
