package com.parallaxa.api.service;

import com.corundumstudio.socketio.SocketIOServer;
import com.parallaxa.api.entity.Conversation;
import com.parallaxa.api.entity.Message;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.ConversationRepository;
import com.parallaxa.api.repository.MessageRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessagingService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SocketIOServer socketIOServer;

    public List<Map<String, Object>> getConversations(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<Conversation> conversations = conversationRepository.findByUserOrderByUpdatedAtDesc(user);

        return conversations.stream().map(c -> {
            User otherUser = c.getUser1().getId().equals(userId) ? c.getUser2() : c.getUser1();
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            Map<String, Object> participantMap = new HashMap<>();
            participantMap.put("id", otherUser.getId());
            participantMap.put("username", otherUser.getUsername());
            participantMap.put("displayName", otherUser.getDisplayName());
            participantMap.put("avatarUrl", otherUser.getAvatarUrl() != null ? otherUser.getAvatarUrl() : "");
            map.put("participant", participantMap);
            map.put("updatedAt", c.getUpdatedAt());
            // Last message could be added here
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Message sendMessage(String senderId, String conversationId, String content, String mediaUrl) {
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow();
        User sender = userRepository.findById(senderId).orElseThrow();

        Message message = Message.builder()
                .id(UUID.randomUUID().toString())
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .mediaUrl(mediaUrl)
                .build();

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        Message savedMessage = messageRepository.save(message);

        // Broadcast the message to the conversation room
        Map<String, Object> messageData = new HashMap<>();
        messageData.put("id", savedMessage.getId());
        messageData.put("conversationId", conversationId);
        messageData.put("senderId", senderId);
        messageData.put("content", content != null ? content : "");
        messageData.put("mediaUrl", mediaUrl != null ? mediaUrl : "");
        messageData.put("createdAt", savedMessage.getCreatedAt() != null ? savedMessage.getCreatedAt() : LocalDateTime.now());

        socketIOServer.getRoomOperations("conversation:" + conversationId)
                .sendEvent("new_message", messageData);

        return savedMessage;
    }

    @Transactional
    public Conversation startConversation(String user1Id, String user2Id) {
        User u1 = userRepository.findById(user1Id).orElseThrow();
        User u2 = userRepository.findById(user2Id).orElseThrow();

        return conversationRepository.findBetweenUsers(u1, u2)
                .orElseGet(() -> {
                    Conversation c = Conversation.builder()
                            .id(UUID.randomUUID().toString())
                            .user1(u1)
                            .user2(u2)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return conversationRepository.save(c);
                });
    }
}
