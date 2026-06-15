package com.parallaxa.api.config;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.net.URISyntaxException;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseConfigTest {

    private final DatabaseConfig databaseConfig = new DatabaseConfig();

    @Test
    void testPostgresUrlConversion() throws URISyntaxException {
        String databaseUrl = "postgres://user:pass@host:5432/db";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl);

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
        DataSource dataSource = databaseConfig.dataSource(databaseUrl);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db?sslmode=require", hikari.getJdbcUrl());
        assertEquals("user", hikari.getUsername());
        assertEquals("pass", hikari.getPassword());
    }

    @Test
    void testStandardJdbcUrl() throws URISyntaxException {
        String databaseUrl = "jdbc:postgresql://host:5432/db";
        DataSource dataSource = databaseConfig.dataSource(databaseUrl);

        assertTrue(dataSource instanceof HikariDataSource);
        HikariDataSource hikari = (HikariDataSource) dataSource;

        assertEquals("jdbc:postgresql://host:5432/db", hikari.getJdbcUrl());
    }
}
