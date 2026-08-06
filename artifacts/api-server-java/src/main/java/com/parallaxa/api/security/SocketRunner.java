package com.parallaxa.api.security;

import com.corundumstudio.socketio.SocketIOServer;
import com.parallaxa.api.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocketRunner implements CommandLineRunner {

    private final SocketIOServer server;
    private final JwtService jwtService;
    private final ConversationRepository conversationRepository;

    @Override
    public void run(String... args) throws Exception {
        server.addConnectListener(client -> {
            String token = client.getHandshakeData().getUrlParams().get("token") != null
                ? client.getHandshakeData().getUrlParams().get("token").get(0) : null;
            try {
                String userId = jwtService.extractUserId(token);
                client.set("userId", userId);
                log.info("Client connected: {}, userId: {}", client.getSessionId(), userId);
            } catch (Exception e) {
                client.disconnect();
                log.warn("Client connection failed: invalid token");
            }
        });

        server.addEventListener("join_conversation", String.class, (client, conversationId, ackSender) -> {
            String userId = client.get("userId");
            if (userId == null) {
                log.warn("Unauthorized join_conversation: no authenticated userId associated with client={}", client.getSessionId());
                return;
            }
            conversationRepository.findById(conversationId)
                .filter(c -> c.getUser1().getId().equals(userId) || c.getUser2().getId().equals(userId))
                .ifPresentOrElse(
                    c -> {
                        client.joinRoom("conversation:" + conversationId);
                        log.info("Client {} (userId={}) joined conversation: {}", client.getSessionId(), userId, conversationId);
                    },
                    () -> log.warn("Unauthorized join attempt: user={} conv={}", userId, conversationId)
                );
        });

        server.start();
        log.info("Socket.IO server started on port: {}", server.getConfiguration().getPort());
    }
}
