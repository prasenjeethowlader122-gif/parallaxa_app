package com.parallaxa.api.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.jdbc.DataSourceBuilder;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.net.URISyntaxException;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseConfigTest {

    private final DatabaseConfig databaseConfig = new DatabaseConfig();

    @Test
    void testPostgresUrlConversion() throws URISyntaxException {
        String databaseUrl = "postgres://user:pass@host:5432/db";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl, null, null);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db", hikari.getJdbcUrl());
        assertEquals("user", hikari.getUsername());
        assertEquals("pass", hikari.getPassword());
        assertEquals("org.postgresql.Driver", hikari.getDriverClassName());
    }

    @Test
    void testPostgresqlUrlConversion() throws URISyntaxException {
        String databaseUrl = "postgresql://user:pass@host:5432/db?sslmode=require";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl, null, null);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db?sslmode=require", hikari.getJdbcUrl());
        assertEquals("user", hikari.getUsername());
        assertEquals("pass", hikari.getPassword());
    }

    @Test
    void testStandardJdbcUrl() throws URISyntaxException {
        String databaseUrl = "jdbc:postgresql://host:5432/db";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl, null, null);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db", hikari.getJdbcUrl());
    }

    @Test
    void testSplitConfig() throws URISyntaxException {
        String databaseUrl = "jdbc:postgresql://host:5432/db";
        String user = "env_user";
        String pass = "env_pass";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl, user, pass);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db", hikari.getJdbcUrl());
        assertEquals("env_user", hikari.getUsername());
        assertEquals("env_pass", hikari.getPassword());
    }
}
