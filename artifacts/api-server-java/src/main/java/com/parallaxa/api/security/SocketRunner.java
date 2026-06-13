package com.parallaxa.api.security;

import com.corundumstudio.socketio.SocketIOServer;
import com.parallaxa.api.security.JwtService;
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
            client.joinRoom("conversation:" + conversationId);
            log.info("Client {} joined conversation: {}", client.getSessionId(), conversationId);
        });

        server.start();
        log.info("Socket.IO server started on port: {}", server.getConfiguration().getPort());
    }
}
