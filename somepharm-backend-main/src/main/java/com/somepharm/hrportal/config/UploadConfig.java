package com.somepharm.hrportal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class UploadConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("./uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        // 🛡️ Fix for Windows: Use URI string to ensure 'file:///' and correct slashes
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations(uploadDir.toUri().toString());
    }
}
