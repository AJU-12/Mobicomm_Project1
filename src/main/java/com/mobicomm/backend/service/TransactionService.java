package com.mobicomm.backend.service;

import com.mobicomm.backend.exception.DuplicateTransactionException;
import com.mobicomm.backend.exception.TransactionNotFoundException;
import com.mobicomm.backend.model.MobicommPlan;
import com.mobicomm.backend.model.Transaction;
import com.mobicomm.backend.model.TransactionStatus;
import com.mobicomm.backend.model.User;
import com.mobicomm.backend.repository.TransactionRepository;
import com.mobicomm.backend.repository.UserRepository;
import com.mobicomm.backend.repository.MobicommPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MobicommPlanRepository planRepository;

    public Transaction saveTransaction(Transaction transaction) {
        // ✅ Check if transaction ID already exists
        Optional<Transaction> existingTransaction = transactionRepository.findByTransactionId(transaction.getTransactionId());
        if (existingTransaction.isPresent()) {
            throw new DuplicateTransactionException("Transaction ID already exists: " + transaction.getTransactionId());
        }

        // ✅ Ensure User exists
        User user = userRepository.findById(transaction.getUser().getId())
            .orElseThrow(() -> new TransactionNotFoundException("User not found with ID: " + transaction.getUser().getId()));
        transaction.setUser(user);  // ✅ Set user in transaction

        // ✅ Ensure Plan exists
        MobicommPlan plan = planRepository.findById(transaction.getPlan().getId())
            .orElseThrow(() -> new TransactionNotFoundException("Plan not found with ID: " + transaction.getPlan().getId()));
        transaction.setPlan(plan);  // ✅ Set plan in transaction

        transaction.setDateTime(ZonedDateTime.now()); // ✅ Uses correct timezone
        transaction.setStatus(TransactionStatus.PENDING); // ✅ Default status set to PENDING

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactionsByUserId(Long userId) {
        return transactionRepository.findByUserId(userId);
    }

    public List<Transaction> getTransactionsByStatus(TransactionStatus status) {
        return transactionRepository.findByStatus(status);  // ✅ Uses Enum instead of String
    }

    // ✅ New Method: Update Transaction Status
    // Update the updateTransactionStatus method to return Transaction
    // Update the updateTransactionStatus method to handle errors better
    public Transaction updateTransactionStatus(String transactionId, TransactionStatus status) {
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with ID: " + transactionId));
        
        transaction.setStatus(status);
        return transactionRepository.save(transaction);
    }
}
