package com.mobicomm.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transactionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "plan_id", nullable = false, foreignKey = @ForeignKey(name = "FK_transaction_plan"))
    private MobicommPlan plan;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private ZonedDateTime dateTime;  // ✅ Now stores timezone info

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;  // ✅ Uses Enum instead of String
    
    @Column
    private String paymentMethod;
    
    @Column
    private String paymentIntentId;
    
    // ✅ Getter for transactionId
    public String getTransactionId() {
        return transactionId;
    }

    // ✅ Getter for User
    public User getUser() {
        return user;
    }

    // ✅ Getter for Plan
    public MobicommPlan getPlan() {
        return plan;
    }

    // ✅ Getter for Status
    public TransactionStatus getStatus() {
        return status;
    }

    // ✅ Getter for DateTime
    public ZonedDateTime getDateTime() {
        return dateTime;
    }

    // ✅ Setter for transactionId
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    // ✅ Setter for User
    public void setUser(User user) {
        this.user = user;
    }

    // ✅ Setter for Plan
    public void setPlan(MobicommPlan plan) {
        this.plan = plan;
    }

    // ✅ Setter for Status
    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    // ✅ Setter for DateTime
    public void setDateTime(ZonedDateTime dateTime) {
        this.dateTime = dateTime;
    }
}