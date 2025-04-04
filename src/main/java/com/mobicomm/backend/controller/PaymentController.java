package com.mobicomm.backend.controller;

import com.mobicomm.backend.model.Transaction;
import com.mobicomm.backend.model.TransactionStatus;
import com.mobicomm.backend.service.StripeService;
import com.mobicomm.backend.service.TransactionService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private StripeService stripeService;
    
    @Autowired
    private TransactionService transactionService;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> data) {
        try {
            // Validate request data
            if (!data.containsKey("amount") || !data.containsKey("currency") || 
                !data.containsKey("transactionId") || !data.containsKey("userId")) {
                return ResponseEntity.badRequest().body(
                    Map.of("error", "Missing required fields: amount, currency, transactionId, userId")
                );
            }

            // Parse and validate the data
            int amount;
            try {
                // Handle different number formats (Integer, Double, String)
                Object amountObj = data.get("amount");
                if (amountObj instanceof Integer) {
                    amount = (Integer) amountObj;
                } else if (amountObj instanceof Double) {
                    amount = ((Double) amountObj).intValue();
                } else {
                    amount = Integer.parseInt(amountObj.toString());
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount format"));
            }

            String currency = (String) data.get("currency");
            String transactionId = (String) data.get("transactionId");
            
            Long userId;
            try {
                Object userIdObj = data.get("userId");
                if (userIdObj instanceof Integer) {
                    userId = ((Integer) userIdObj).longValue();
                } else if (userIdObj instanceof Long) {
                    userId = (Long) userIdObj;
                } else {
                    userId = Long.valueOf(userIdObj.toString());
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid userId format"));
            }

            // Create payment intent
            String clientSecret = stripeService.createPaymentIntent(amount, currency, transactionId, userId);
            return ResponseEntity.ok(Map.of("clientSecret", clientSecret));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @GetMapping("/verify-payment/{paymentId}")
    public ResponseEntity<?> verifyPayment(@PathVariable String paymentId) {
        try {
            String status = stripeService.verifyPayment(paymentId);
            
            // If payment is successful, update transaction status
            if (status.equals("succeeded")) {
                // We should modify StripeService to return the transaction ID
                // For now, let's use the stripeService to get the payment intent
                String transactionId = stripeService.getTransactionIdFromPayment(paymentId);
                
                if (transactionId != null) {
                    transactionService.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED);
                }
            }
            
            return ResponseEntity.ok(Map.of("status", status));
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }
}
