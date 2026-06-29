package com.tiplet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "widget_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetSettings {

    @Id
    @Column(name = "creator_id")
    private String creatorId; // Matches the Creator's ID

    @Column(name = "button_text")
    private String buttonText = "Support me";

    @ElementCollection
    @CollectionTable(name = "widget_preset_amounts", joinColumns = @JoinColumn(name = "creator_id"))
    @Column(name = "preset_amount")
    private List<Integer> defaultAmounts = List.of(5, 10, 20);

    private String theme = "orange"; // orange, light, dark, glass

    @Column(name = "thank_you_message", columnDefinition = "TEXT")
    private String thankYouMessage = "Thank you for your support!";

    @Column(name = "goal_text")
    private String goalText;

    @Column(name = "goal_amount")
    private double goalAmount = 0.0;
}
