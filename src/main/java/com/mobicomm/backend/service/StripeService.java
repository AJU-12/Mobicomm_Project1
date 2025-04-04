package com.mobicomm.backend.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class StripeService {
    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        logger.info("Stripe API key initialized");
    }

    public String createPaymentIntent(int amount, String currency, String transactionId, Long userId) throws StripeException {
        try {
            // Ensure amount is properly formatted (Stripe expects amount in smallest currency unit)
            // For example, 100 INR should be 10000 paise (100 * 100)
            long amountInSmallestUnit = amount * 100;
            
            // Changed from Map<String, Object> to Map<String, String>
            Map<String, String> metadata = new HashMap<>();
            metadata.put("transactionId", transactionId);
            metadata.put("userId", userId.toString());

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInSmallestUnit)
                    .setCurrency(currency.toLowerCase())
                    .putAllMetadata(metadata)
                    .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                            .setEnabled(true)
                            .build()
                    )
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);
            logger.info("Payment intent created successfully for transaction: {}", transactionId);
            return paymentIntent.getClientSecret();
        } catch (StripeException e) {
            logger.error("Error creating payment intent: {}", e.getMessage(), e);
            throw e;
        }
    }

    public String verifyPayment(String paymentIntentId) throws StripeException {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            logger.info("Payment verification for ID {}: Status {}", paymentIntentId, paymentIntent.getStatus());
            return paymentIntent.getStatus();
        } catch (StripeException e) {
            logger.error("Error verifying payment {}: {}", paymentIntentId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Retrieves the transaction ID from a payment intent's metadata
     * 
     * @param paymentIntentId The Stripe payment intent ID
     * @return The transaction ID stored in the payment intent's metadata
     * @throws StripeException If there's an error retrieving the payment intent
     */
    public String getTransactionIdFromPayment(String paymentIntentId) throws StripeException {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            logger.info("Retrieved payment intent: {}", paymentIntentId);
            return paymentIntent.getMetadata().get("transactionId");
        } catch (StripeException e) {
            logger.error("Error retrieving payment intent {}: {}", paymentIntentId, e.getMessage(), e);
            throw e;
        }
    }
}
