package com.tiplet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tip {

    @Id
    private String id; // e.g. tip_xxxxxx

    @Column(name = "creator_id", nullable = false)
    private String creatorId;

    @Column(name = "supporter_name")
    private String supporterName = "Anonymous";

    @Column(name = "supporter_email")
    private String supporterEmail;

    @Column(columnDefinition = "TEXT")
    private String message;

    private double amount;

    private String currency = "EUR";

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "payment_status")
    private String paymentStatus = "pending"; // pending, paid

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
