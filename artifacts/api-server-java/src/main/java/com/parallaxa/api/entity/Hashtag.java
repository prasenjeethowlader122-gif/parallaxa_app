package com.parallaxa.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hashtags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hashtag {
    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    @Builder.Default
    @Column(name = "post_count", nullable = false)
    private int postCount = 0;
}
