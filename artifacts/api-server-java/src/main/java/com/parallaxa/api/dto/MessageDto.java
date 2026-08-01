package com.parallaxa.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.parallaxa.api.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto {
    private String id;
    private String conversationId;
    private String senderId;
    private String content;
    private String mediaUrl;

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;

    public static MessageDto from(Message message) {
        if (message == null) return null;
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .content(message.getContent() != null ? message.getContent() : "")
                .mediaUrl(message.getMediaUrl() != null ? message.getMediaUrl() : "")
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now())
                .build();
    }
}
