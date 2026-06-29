package com.tiplet.api.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.tiplet.api.model.Creator;
import com.tiplet.api.model.Tip;
import com.tiplet.api.repository.CreatorRepository;
import com.tiplet.api.repository.TipRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping
public class CheckoutController {

    @Autowired
    private CreatorRepository creatorRepository;

    @Autowired
    private TipRepository tipRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Data
    public static class CheckoutSessionRequest {
        private String creator_id;
        private String supporter_name;
        private String supporter_email;
        private String message;
        private Double amount;
        private String currency;
    }

    @Data
    public static class SimulationCompleteRequest {
        private String session_id;
    }

    @PostMapping("/api/checkout/session")
    public ResponseEntity<?> createCheckoutSession(@RequestBody CheckoutSessionRequest request) {
        if (request.getCreator_id() == null || request.getAmount() == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Missing required checkout parameters");
            return ResponseEntity.badRequest().body(error);
        }

        Optional<Creator> creatorOpt = creatorRepository.findById(request.getCreator_id());
        if (creatorOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Creator not found");
            return ResponseEntity.status(404).body(error);
        }

        Creator creator = creatorOpt.get();
        double amount = request.getAmount();

        if (amount < 3.0) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Minimum tip amount is €3.");
            return ResponseEntity.badRequest().body(error);
        }

        String sessionId = "session_" + UUID.randomUUID().toString().substring(0, 9);
        String currency = request.getCurrency() != null ? request.getCurrency() : "EUR";

        // Attempt real Stripe Checkout if configured
        if (stripeApiKey != null && !stripeApiKey.startsWith("sk_test_simulated")) {
            Stripe.apiKey = stripeApiKey;
            try {
                SessionCreateParams params = SessionCreateParams.builder()
                        .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                        .setCustomerEmail(request.getSupporter_email())
                        .setMode(SessionCreateParams.Mode.PAYMENT)
                        .setSuccessUrl(frontendUrl + "/success?session_id={CHECKOUT_SESSION_ID}&creator=" + creator.getUsername())
                        .setCancelUrl(frontendUrl + "/" + creator.getUsername())
                        .addLineItem(
                                SessionCreateParams.LineItem.builder()
                                        .setQuantity(1L)
                                        .setPriceData(
                                                SessionCreateParams.LineItem.PriceData.builder()
                                                        .setCurrency(currency.toLowerCase())
                                                        .setUnitAmount((long) (amount * 100)) // in cents
                                                        .setProductData(
                                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                        .setName("Support for " + creator.getDisplayName())
                                                                        .setDescription(request.getMessage() != null ? "\"" + request.getMessage() + "\"" : "Support Tiplet checkout")
                                                                        .build()
                                                        )
                                                        .build()
                                        )
                                        .build()
                        )
                        .putMetadata("creator_id", creator.getId())
                        .putMetadata("supporter_name", request.getSupporter_name() != null ? request.getSupporter_name() : "Anonymous")
                        .putMetadata("supporter_email", request.getSupporter_email() != null ? request.getSupporter_email() : "")
                        .putMetadata("message", request.getMessage() != null ? request.getMessage() : "")
                        .putMetadata("amount", String.valueOf(amount))
                        .putMetadata("currency", currency)
                        .build();

                Session stripeSession = Session.create(params);

                // Persist pending Tip record
                Tip pendingTip = Tip.builder()
                        .id("tip_" + sessionId)
                        .creatorId(creator.getId())
                        .supporterName(request.getSupporter_name() != null ? request.getSupporter_name() : "Anonymous")
                        .supporterEmail(request.getSupporter_email())
                        .message(request.getMessage())
                        .amount(amount)
                        .currency(currency)
                        .stripeSessionId(stripeSession.getId())
                        .paymentStatus("pending")
                        .createdAt(LocalDateTime.now())
                        .build();

                tipRepository.save(pendingTip);

                Map<String, Object> response = new HashMap<>();
                response.put("url", stripeSession.getUrl());
                response.put("session_id", stripeSession.getId());
                response.put("isSimulated", false);
                return ResponseEntity.ok(response);

            } catch (StripeException e) {
                System.err.println("Stripe Checkout error: " + e.getMessage() + ". Falling back to simulated checkout sandbox...");
            }
        }

        // ---------------- Simulated Checkout Fallback ----------------
        Tip pendingTip = Tip.builder()
                .id("tip_" + sessionId)
                .creatorId(creator.getId())
                .supporterName(request.getSupporter_name() != null ? request.getSupporter_name() : "Anonymous")
                .supporterEmail(request.getSupporter_email())
                .message(request.getMessage())
                .amount(amount)
                .currency(currency)
                .stripeSessionId(sessionId)
                .paymentStatus("pending")
                .createdAt(LocalDateTime.now())
                .build();

        tipRepository.save(pendingTip);

        Map<String, Object> response = new HashMap<>();
        response.put("url", frontendUrl + "/checkout/simulated?session_id=" + sessionId + "&creator=" + creator.getUsername());
        response.put("session_id", sessionId);
        response.put("isSimulated", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/checkout/simulated-complete")
    public ResponseEntity<?> simulatedComplete(@RequestBody SimulationCompleteRequest request) {
        if (request.getSession_id() == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Session ID is required");
            return ResponseEntity.badRequest().body(error);
        }

        Optional<Tip> tipOpt = tipRepository.findByStripeSessionId(request.getSession_id());
        if (tipOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Simulated tip session not found");
            return ResponseEntity.status(404).body(error);
        }

        Tip tip = tipOpt.get();
        tip.setPaymentStatus("paid");
        tipRepository.save(tip);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("tip", tip);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/webhook")
    public ResponseEntity<String> stripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        if (stripeApiKey == null || stripeApiKey.startsWith("sk_test_simulated")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Stripe webhooks not configured");
        }

        Stripe.apiKey = stripeApiKey;
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook Signature Verification Failed: " + e.getMessage());
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                Map<String, String> metadata = session.getMetadata();
                if (metadata != null) {
                    String creatorId = metadata.get("creator_id");
                    String supporterName = metadata.get("supporter_name");
                    String supporterEmail = metadata.get("supporter_email");
                    String message = metadata.get("message");
                    String amountStr = metadata.get("amount");
                    String currency = metadata.get("currency");

                    Optional<Tip> existingTipOpt = tipRepository.findByStripeSessionId(session.getId());
                    if (existingTipOpt.isPresent()) {
                        Tip existingTip = existingTipOpt.get();
                        existingTip.setPaymentStatus("paid");
                        tipRepository.save(existingTip);
                    } else {
                        Tip newTip = Tip.builder()
                                .id("tip_" + UUID.randomUUID().toString().substring(0, 9))
                                .creatorId(creatorId)
                                .supporterName(supporterName != null ? supporterName : "Anonymous")
                                .supporterEmail(supporterEmail)
                                .message(message)
                                .amount(Double.parseDouble(amountStr))
                                .currency(currency != null ? currency : "EUR")
                                .stripeSessionId(session.getId())
                                .paymentStatus("paid")
                                .createdAt(LocalDateTime.now())
                                .build();
                        tipRepository.save(newTip);
                    }
                }
            }
        }

        return ResponseEntity.ok("Received");
    }
}
