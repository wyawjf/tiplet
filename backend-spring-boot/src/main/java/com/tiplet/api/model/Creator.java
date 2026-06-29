package com.tiplet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "creators")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Creator {

    @Id
    private String id; // username matching React state (e.g., 'wyatt')

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Column(name = "is_pro")
    private boolean isPro = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
