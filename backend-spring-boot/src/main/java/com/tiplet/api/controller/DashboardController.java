package com.tiplet.api.controller;

import com.tiplet.api.model.Creator;
import com.tiplet.api.model.Tip;
import com.tiplet.api.model.WidgetSettings;
import com.tiplet.api.repository.CreatorRepository;
import com.tiplet.api.repository.TipRepository;
import com.tiplet.api.repository.WidgetSettingsRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private CreatorRepository creatorRepository;

    @Autowired
    private WidgetSettingsRepository widgetSettingsRepository;

    @Autowired
    private TipRepository tipRepository;

    @Data
    public static class SettingsUpdateRequest {
        private String display_name;
        private String bio;
        private String avatar_url;
        private String button_text;
        private List<Integer> default_amounts;
        private String theme;
        private String thank_you_message;
        private String goal_text;
        private Double goal_amount;
    }

    private Optional<Creator> authenticate(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String username = authHeader.substring(7).trim();
        return creatorRepository.findByUsernameIgnoreCase(username);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getDashboardMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Creator> creatorOpt = authenticate(authHeader);
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(error);
        }

        Creator creator = creatorOpt.get();
        WidgetSettings settings = widgetSettingsRepository.findById(creator.getId()).orElseGet(() -> 
                WidgetSettings.builder().creatorId(creator.getId()).build()
        );
        List<Tip> tips = tipRepository.findByCreatorIdOrderByCreatedAtDesc(creator.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("creator", creator);
        response.put("settings", settings);
        response.put("tips", tips);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SettingsUpdateRequest request) {
        
        Optional<Creator> creatorOpt = authenticate(authHeader);
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(error);
        }

        Creator creator = creatorOpt.get();

        // Update profile
        if (request.getDisplay_name() != null) creator.setDisplayName(request.getDisplay_name());
        if (request.getBio() != null) creator.setBio(request.getBio());
        if (request.getAvatar_url() != null) creator.setAvatarUrl(request.getAvatar_url());
        creatorRepository.save(creator);

        // Update widget settings
        WidgetSettings settings = widgetSettingsRepository.findById(creator.getId()).orElseGet(() ->
                WidgetSettings.builder().creatorId(creator.getId()).build()
        );

        if (request.getButton_text() != null) settings.setButtonText(request.getButton_text());
        if (request.getDefault_amounts() != null) settings.setDefaultAmounts(request.getDefault_amounts());
        if (request.getTheme() != null) settings.setTheme(request.getTheme());
        if (request.getThank_you_message() != null) settings.setThankYouMessage(request.getThank_you_message());
        if (request.getGoal_text() != null) settings.setGoalText(request.getGoal_text());
        if (request.getGoal_amount() != null) settings.setGoalAmount(request.getGoal_amount());
        widgetSettingsRepository.save(settings);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("creator", creator);
        response.put("settings", settings);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upgrade-pro")
    public ResponseEntity<?> upgradePro(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Optional<Creator> creatorOpt = authenticate(authHeader);
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized");
            return ResponseEntity.status(401).body(error);
        }

        Creator creator = creatorOpt.get();
        creator.setPro(true);
        creatorRepository.save(creator);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("creator", creator);
        return ResponseEntity.ok(response);
    }
}
