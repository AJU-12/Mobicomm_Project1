package com.mobicomm.backend.controller;

import com.mobicomm.backend.model.Transaction;
import com.mobicomm.backend.model.TransactionStatus;
import com.mobicomm.backend.service.TransactionService;
import com.mobicomm.backend.exception.TransactionNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@CrossOrigin(origins = "*")  // Added for CORS support
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/save")
    public ResponseEntity<?> saveTransaction(@RequestBody Transaction transaction) {
        try {
            Transaction savedTransaction = transactionService.saveTransaction(transaction);
            return ResponseEntity.ok(savedTransaction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getTransactionsByUserId(@PathVariable Long userId) {
        try {
            List<Transaction> transactions = transactionService.getTransactionsByUserId(userId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getTransactionsByStatus(@PathVariable String status) {
        try {
            TransactionStatus transactionStatus = TransactionStatus.valueOf(status.toUpperCase());
            List<Transaction> transactions = transactionService.getTransactionsByStatus(transactionStatus);
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid transaction status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/update-status")
    public ResponseEntity<?> updateTransactionStatus(@RequestBody Map<String, String> request) {
        try {
            String transactionId = request.get("transactionId");
            String statusStr = request.get("status");
            
            if (transactionId == null || statusStr == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Transaction ID and status are required"));
            }
            
            TransactionStatus status;
            try {
                status = TransactionStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value"));
            }
            
            Transaction updatedTransaction = transactionService.updateTransactionStatus(transactionId, status);
            return ResponseEntity.ok(updatedTransaction);
        } catch (TransactionNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update transaction status: " + e.getMessage()));
        }
    }
}
