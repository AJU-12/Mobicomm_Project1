package com.mobicomm.backend.repository;

import com.mobicomm.backend.model.Transaction;
import com.mobicomm.backend.model.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByStatus(TransactionStatus status);
    Optional<Transaction> findByTransactionId(String transactionId);

}