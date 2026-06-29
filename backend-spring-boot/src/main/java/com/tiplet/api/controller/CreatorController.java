package com.tiplet.api.controller;

import com.tiplet.api.model.Creator;
import com.tiplet.api.model.Tip;
import com.tiplet.api.model.WidgetSettings;
import com.tiplet.api.repository.CreatorRepository;
import com.tiplet.api.repository.TipRepository;
import com.tiplet.api.repository.WidgetSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/creators")
public class CreatorController {

    @Autowired
    private CreatorRepository creatorRepository;

    @Autowired
    private WidgetSettingsRepository widgetSettingsRepository;

    @Autowired
    private TipRepository tipRepository;

    @GetMapping("/{username}")
    public ResponseEntity<?> getCreatorDetails(@PathVariable String username) {
        Optional<Creator> creatorOpt = creatorRepository.findByUsernameIgnoreCase(username);
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Creator not found");
            return ResponseEntity.status(404).body(error);
        }

        Creator creator = creatorOpt.get();
        Optional<WidgetSettings> settingsOpt = widgetSettingsRepository.findById(creator.getId());
        WidgetSettings settings = settingsOpt.orElseGet(() -> {
            // Default fallback settings
            return WidgetSettings.builder()
                    .creatorId(creator.getId())
                    .buttonText("Support me")
                    .defaultAmounts(List.of(5, 10, 20))
                    .theme("orange")
                    .build();
        });

        Map<String, Object> response = new HashMap<>();
        response.put("creator", creator);
        response.put("settings", settings);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}/tips")
    public ResponseEntity<?> getCreatorTips(@PathVariable String username) {
        Optional<Creator> creatorOpt = creatorRepository.findByUsernameIgnoreCase(username);
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Creator not found");
            return ResponseEntity.status(404).body(error);
        }

        List<Tip> paidTips = tipRepository.findByCreatorIdAndPaymentStatusOrderByCreatedAtDesc(
                creatorOpt.get().getId(), "paid"
        );
        return ResponseEntity.ok(paidTips);
    }
}
