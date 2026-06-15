---
name: Java Backend Setup
description: Port config, schema compat, and build quirks for artifacts/api-server-java
---

## Port
Run Java backend on PORT=8000 (not 8080 — artifacts/api-server Node.js artifact occupies 8080).
Workflow: `cd artifacts/api-server-java && PORT=8000 mvn spring-boot:run`

## Java Version
pom.xml must use `<java.version>17</java.version>` — GraalVM 22.3 provides Java 19 runtime; targets Java 17 bytecode fine.
**Why:** Original pom had 21 which fails to compile on the available runtime.

## DatabaseConfig
`@ConditionalOnProperty` was removed. The dataSource bean now takes a single `String databaseUrl` @Value arg.
Hibernate ddl-auto=update produces a non-fatal `id cannot be cast to bigint` warning from other tables — Spring continues normally.

## Registration endpoint
`@RequestParam` for simple string fields (username, email, password, displayName, dateOfBirth) — NOT `@RequestPart`.
Flutter Dio sends FormData where text fields have no Content-Type per part; `@RequestParam` handles this; `@RequestPart` for strings is unreliable.
JSON registration via separate `consumes = APPLICATION_JSON_VALUE` method also supported.

## Auth flow verified
- Multipart register → 201 + token ✓
- JSON login → 200 + token ✓
- Wrong credentials → 401 ✓
