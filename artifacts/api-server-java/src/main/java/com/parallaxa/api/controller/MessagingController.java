package com.parallaxa.api.controller;

import com.parallaxa.api.dto.MessageDto;
import com.parallaxa.api.entity.Conversation;
import com.parallaxa.api.entity.Message;
import com.parallaxa.api.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessagingController {
    private final MessagingService messagingService;

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messagingService.getConversations(userDetails.getUsername()));
    }

    @PostMapping("/conversations/start")
    public ResponseEntity<Conversation> startConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.startConversation(userDetails.getUsername(), body.get("userId")));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String conversationId,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "30") int limit
    ) {
        return ResponseEntity.ok(messagingService.getMessages(
                userDetails.getUsername(),
                conversationId,
                cursor,
                limit
        ));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String conversationId,
            @RequestBody Map<String, String> body
    ) {
        Message message = messagingService.sendMessage(
                userDetails.getUsername(),
                conversationId,
                body.get("content"),
                body.get("mediaUrl")
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MessageDto.from(message));
    }
}
