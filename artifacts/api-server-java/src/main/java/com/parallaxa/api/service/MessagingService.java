package com.parallaxa.api.service;

import com.corundumstudio.socketio.SocketIOServer;
import com.parallaxa.api.dto.MessageDto;
import com.parallaxa.api.entity.Conversation;
import com.parallaxa.api.entity.Message;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.repository.ConversationRepository;
import com.parallaxa.api.repository.MessageRepository;
import com.parallaxa.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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

    private void assertParticipant(Conversation c, String userId) {
        boolean isParticipant = c.getUser1().getId().equals(userId)
                              || c.getUser2().getId().equals(userId);
        if (!isParticipant) {
            throw new AccessDeniedException("আপনি এই কথোপকথনের অংশ নন");
        }
    }

    public Map<String, Object> mapConversation(Conversation c, String userId) {
        User user = userRepository.findById(userId).orElseThrow();
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

        // Last message mapping
        Optional<Message> lastMsgOpt = messageRepository.findTopByConversationOrderByCreatedAtDesc(c);
        if (lastMsgOpt.isPresent()) {
            map.put("lastMessage", MessageDto.from(lastMsgOpt.get()));
        } else {
            map.put("lastMessage", null);
        }

        long unreadCount = messageRepository.countByConversationAndIsReadFalseAndSenderNot(c, user);
        map.put("unreadCount", unreadCount);

        return map;
    }

    public List<Map<String, Object>> getConversations(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<Conversation> conversations = conversationRepository.findByUserOrderByUpdatedAtDesc(user);

        return conversations.stream()
                .map(c -> mapConversation(c, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> getMessages(String userId, String conversationId, String cursor, int limit) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Conversation not found"));
        assertParticipant(conversation, userId);

        // Mark unread messages from the other user as read on fetch
        User user = userRepository.findById(userId).orElseThrow();
        User otherUser = conversation.getUser1().getId().equals(userId) ? conversation.getUser2() : conversation.getUser1();
        List<Message> unread = messageRepository.findByConversationAndIsReadFalseAndSender(conversation, otherUser);
        if (!unread.isEmpty()) {
            unread.forEach(m -> m.setRead(true));
            messageRepository.saveAll(unread);
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit);
        org.springframework.data.domain.Page<Message> messagePage;

        if (cursor != null && !cursor.trim().isEmpty()) {
            Optional<Message> cursorMsgOpt = messageRepository.findById(cursor);
            if (cursorMsgOpt.isPresent()) {
                messagePage = messageRepository.findByConversationAndCreatedAtLessThanOrderByCreatedAtDesc(
                        conversation, cursorMsgOpt.get().getCreatedAt(), pageable);
            } else {
                messagePage = messageRepository.findByConversationOrderByCreatedAtDesc(conversation, pageable);
            }
        } else {
            messagePage = messageRepository.findByConversationOrderByCreatedAtDesc(conversation, pageable);
        }

        List<MessageDto> messageDtos = messagePage.getContent().stream()
                .map(MessageDto::from)
                .collect(Collectors.toList());

        String nextCursor = null;
        if (!messagePage.isEmpty()) {
            nextCursor = messagePage.getContent().get(messagePage.getContent().size() - 1).getId();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("messages", messageDtos);
        response.put("nextCursor", nextCursor);
        return response;
    }

    @Transactional
    public Message sendMessage(String senderId, String conversationId, String content, String mediaUrl) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Conversation not found"));
        assertParticipant(conversation, senderId);

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
