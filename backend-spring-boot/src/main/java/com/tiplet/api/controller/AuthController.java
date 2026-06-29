package com.tiplet.api.controller;

import com.tiplet.api.model.Creator;
import com.tiplet.api.model.WidgetSettings;
import com.tiplet.api.repository.CreatorRepository;
import com.tiplet.api.repository.WidgetSettingsRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private CreatorRepository creatorRepository;

    @Autowired
    private WidgetSettingsRepository widgetSettingsRepository;

    @Data
    public static class LoginRequest {
        private String email;
    }

    @Data
    public static class RegisterRequest {
        private String email;
        private String username;
        private String displayName;
        private String bio;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Email is required");
            return ResponseEntity.badRequest().body(error);
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<Creator> existing = creatorRepository.findByEmailIgnoreCase(email);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (existing.isPresent()) {
            response.put("creator", existing.get());
            response.put("isNew", false);
            return ResponseEntity.ok(response);
        }

        // Auto-register passwordless user matching server.ts behavior
        String namePart = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
        String username = namePart + "_" + ((int) (100 + Math.random() * 900));

        Creator newCreator = Creator.builder()
                .id(username)
                .email(email)
                .username(username)
                .displayName(namePart.substring(0, 1).toUpperCase() + namePart.substring(1))
                .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80")
                .bio("Happy Tiplet Creator! Adjust your short bio and goal settings in the widget settings tab.")
                .stripeAccountId("acct_simulated_" + username)
                .isPro(false)
                .createdAt(LocalDateTime.now())
                .build();

        creatorRepository.save(newCreator);

        // Also create default widget settings
        WidgetSettings settings = WidgetSettings.builder()
                .creatorId(newCreator.getId())
                .buttonText("Support " + newCreator.getDisplayName())
                .defaultAmounts(List.of(5, 10, 20))
                .theme("orange")
                .thank_you_message("Thank you for your support!")
                .build();
        
        widgetSettingsRepository.save(settings);

        response.put("creator", newCreator);
        response.put("isNew", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getUsername() == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Email and username are required");
            return ResponseEntity.badRequest().body(error);
        }

        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim().toLowerCase();

        if (creatorRepository.findByEmailIgnoreCase(email).isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Email is already taken");
            return ResponseEntity.badRequest().body(error);
        }

        if (creatorRepository.findByUsernameIgnoreCase(username).isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Username is already taken");
            return ResponseEntity.badRequest().body(error);
        }

        Creator newCreator = Creator.builder()
                .id(username)
                .email(email)
                .username(username)
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : username)
                .avatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80")
                .bio(request.getBio() != null ? request.getBio() : "Welcome to my page!")
                .stripeAccountId("acct_simulated_" + username)
                .isPro(false)
                .createdAt(LocalDateTime.now())
                .build();

        creatorRepository.save(newCreator);

        WidgetSettings settings = WidgetSettings.builder()
                .creatorId(newCreator.getId())
                .buttonText("Support " + newCreator.getDisplayName())
                .defaultAmounts(List.of(5, 10, 20))
                .theme("orange")
                .thank_you_message("Thank you for your support!")
                .build();
        
        widgetSettingsRepository.save(settings);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("creator", newCreator);
        return ResponseEntity.ok(response);
    }
}
