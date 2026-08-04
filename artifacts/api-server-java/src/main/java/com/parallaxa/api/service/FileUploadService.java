package com.parallaxa.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${application.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
        Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("ফাইল খালি হতে পারে না।");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("অসমর্থিত ফাইল টাইপ। শুধু JPEG/PNG/WEBP/GIF আপলোড করা যাবে।");
        }

        // Verify physical file signatures (magic bytes) to block spoofed extensions
        try (java.io.InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            int bytesRead = is.read(header);
            if (bytesRead >= 4) {
                boolean valid = false;
                // Check PNG: 89 50 4E 47
                if ((header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 && (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47) {
                    valid = "image/png".equalsIgnoreCase(contentType);
                }
                // Check JPEG: FF D8 FF
                else if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
                    valid = "image/jpeg".equalsIgnoreCase(contentType);
                }
                // Check GIF: 47 49 46 38 ('GIF8')
                else if ((header[0] & 0xFF) == 0x47 && (header[1] & 0xFF) == 0x49 && (header[2] & 0xFF) == 0x46 && (header[3] & 0xFF) == 0x38) {
                    valid = "image/gif".equalsIgnoreCase(contentType);
                }
                // Check WEBP: RIFF at start and WEBP at offset 8
                else if ((header[0] & 0xFF) == 0x52 && (header[1] & 0xFF) == 0x49 && (header[2] & 0xFF) == 0x46 && (header[3] & 0xFF) == 0x46) {
                    if (bytesRead >= 12 && (header[8] & 0xFF) == 0x57 && (header[9] & 0xFF) == 0x45 && (header[10] & 0xFF) == 0x42 && (header[11] & 0xFF) == 0x50) {
                        valid = "image/webp".equalsIgnoreCase(contentType);
                    }
                }
                if (!valid) {
                    throw new IllegalArgumentException("ফাইল সিগনেচার মেলেনি বা ফাইল টাইপ স্পুফ করা হয়েছে।");
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not read file signature", e);
        }

        String ext = switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif"  -> ".gif";
            default -> throw new IllegalArgumentException("অসমর্থিত ফাইল টাইপ।");
        };

        try {
            Path copyLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(copyLocation)) {
                Files.createDirectories(copyLocation);
            }

            String fileName = UUID.randomUUID().toString() + ext;

            Path targetLocation = copyLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file. Please try again!", e);
        }
    }
}
