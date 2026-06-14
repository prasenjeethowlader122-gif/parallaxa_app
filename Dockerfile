# -- Build Expo web --
FROM node:22-slim AS expo-builder
RUN npm install -g pnpm@10
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/ ./lib/
COPY artifacts/social-app/ ./artifacts/social-app/
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/social-app exec expo export --platform web --output-dir web-export

# -- Build Java API --
FROM maven:3.9.9-eclipse-temurin-21-alpine AS api-builder
WORKDIR /app
COPY artifacts/api-server-java/pom.xml .
COPY artifacts/api-server-java/src ./src
RUN mvn clean package -DskipTests

# -- Production image --
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/uploads /app/public

# Copy the built jar
COPY --from=api-builder /app/target/*.jar app.jar

# Copy Expo web build to public folder served by Spring Boot
COPY --from=expo-builder /app/artifacts/social-app/web-export /app/public

# Environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
EXPOSE 9092

# Start the application
CMD ["java", "-jar", "app.jar"]
