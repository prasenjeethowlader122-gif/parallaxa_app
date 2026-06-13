package com.parallaxa.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResponse<T> {
    private List<T> posts; // Keeping naming consistent with existing API
    private String nextCursor;

    // For other types like users
    private List<T> users;
}
