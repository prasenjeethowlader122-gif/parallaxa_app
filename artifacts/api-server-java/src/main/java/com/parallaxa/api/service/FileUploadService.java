package com.parallaxa.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${application.upload.dir:uploads}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) {
        try {
            Path copyLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(copyLocation)) {
                Files.createDirectories(copyLocation);
            }

            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

            Path targetLocation = copyLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file. Please try again!", e);
        }
    }
}
