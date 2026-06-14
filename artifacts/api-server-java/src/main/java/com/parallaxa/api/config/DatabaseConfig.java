package com.parallaxa.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    @ConditionalOnProperty(name = "DATABASE_URL")
    public DataSource dataSource(@Value("${DATABASE_URL}") String databaseUrl) throws URISyntaxException {
        String url = databaseUrl;
        String username = null;
        String password = null;

        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            URI dbUri = new URI(url);
            url = "jdbc:postgresql://" + dbUri.getHost() + (dbUri.getPort() != -1 ? ":" + dbUri.getPort() : "") + dbUri.getPath();

            if (dbUri.getQuery() != null) {
                url += "?" + dbUri.getQuery();
            }

            String userInfo = dbUri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":");
                username = parts[0];
                password = parts[1];
            }
        }

        DataSourceBuilder<?> builder = DataSourceBuilder.create().url(url);
        if (username != null) {
            builder.username(username);
        }
        if (password != null) {
            builder.password(password);
        }

        if (url.startsWith("jdbc:postgresql:")) {
            builder.driverClassName("org.postgresql.Driver");
        }

        logger.info("Connecting to database with URL: {}", maskUrl(url));

        return builder.build();
    }

    private String maskUrl(String url) {
        if (url == null) return null;
        // Basic masking of password in JDBC URL if present
        return url.replaceAll(":([^/@:]+)@", ":****@");
    }
}
