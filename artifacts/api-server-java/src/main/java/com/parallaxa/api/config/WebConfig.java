package com.parallaxa.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${application.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward to index.html for any path that doesn't have a dot (not a static file)
        // and isn't an API call.
        // We explicitly avoid /api and /uploads
        registry.addViewController("/{path:[^\\.]*}")
                .setViewName("forward:/index.html");

        registry.addViewController("/{path1:[^\\.]*}/{path2:[^\\.]*}")
                .setViewName("forward:/index.html");

        registry.addViewController("/{path1:[^\\.]*}/{path2:[^\\.]*}/{path3:[^\\.]*}")
                .setViewName("forward:/index.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String uploadAbsolutePath = uploadPath.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadAbsolutePath + "/")
                .setCacheControl(CacheControl.noCache().mustRevalidate());

        // Entry points that should not be cached
        registry.addResourceHandler("/index.html", "/manifest.json", "/flutter_bootstrap.js")
                .addResourceLocations("classpath:/public/", "file:/app/public/")
                .setCacheControl(CacheControl.noStore().mustRevalidate());

        registry.addResourceHandler("/public/**")
                .addResourceLocations("classpath:/public/", "file:/app/public/");

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/public/", "file:/app/public/");
    }
}
