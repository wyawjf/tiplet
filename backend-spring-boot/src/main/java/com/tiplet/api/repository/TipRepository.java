package com.tiplet.api.repository;

import com.tiplet.api.model.Tip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TipRepository extends JpaRepository<Tip, String> {
    List<Tip> findByCreatorIdOrderByCreatedAtDesc(String creatorId);
    List<Tip> findByCreatorIdAndPaymentStatusOrderByCreatedAtDesc(String creatorId, String paymentStatus);
    Optional<Tip> findByStripeSessionId(String stripeSessionId);
}
