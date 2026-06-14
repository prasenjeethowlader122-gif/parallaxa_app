# -- Build Flutter web --
FROM debian:bookworm-slim AS flutter-builder
RUN apt-get update && apt-get install -y curl git unzip xz-utils zip libglu1-mesa
RUN git clone https://github.com/flutter/flutter.git -b stable /flutter
ENV PATH="/flutter/bin:/flutter/bin/cache/dart-sdk/bin:${PATH}"
RUN flutter doctor
WORKDIR /app
COPY . .
WORKDIR /app/artifacts/social-flutter-app
RUN flutter pub get
RUN dart run build_runner build --delete-conflicting-outputs
RUN flutter build web --release --base-href /

# -- Build Java API --
FROM maven:3.9.9-eclipse-temurin-21-alpine AS api-builder
WORKDIR /app
COPY artifacts/api-server-java/pom.xml .
COPY artifacts/api-server-java/src ./src
RUN mvn clean package -DskipTests

# -- Production image --
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/uploads /app/public

# Copy the built jar
COPY --from=api-builder /app/target/*.jar app.jar

# Copy Flutter web build to public folder served by Spring Boot
COPY --from=flutter-builder /app/artifacts/social-flutter-app/build/web /app/public

# Environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
EXPOSE 9092

# Start the application
CMD ["java", "-jar", "app.jar"]
