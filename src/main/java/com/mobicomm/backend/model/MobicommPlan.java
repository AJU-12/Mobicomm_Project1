package com.mobicomm.backend.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Entity
@Table(name = "plans")
public class MobicommPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) // ✅ Name is required
    private String name;

    private String details;

    @Column(nullable = false, columnDefinition = "DECIMAL(10,2)") // ✅ Ensure price is stored correctly
    private double price;

    private String validity;
    private String data;
    private String badge;

    @Column(nullable = false)
    private String status = "Active"; // ✅ Set default in Java instead of column definition
    
    
    private String features;

    // ✅ Many-to-One relationship with Category
    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Transaction> transactions;

    public MobicommPlan() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    
    public String getValidity() { return validity; }
    public void setValidity(String validity) { this.validity = validity; }
    
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    // Getter that returns the category name as a string for JSON serialization
    public String getCategory() {
        return category != null ? category.getName() : null;
    }
    
    // Setter that takes a Category object
    public void setCategory(Category category) {
        this.category = category;
    }
    
    @Override
    public String toString() {
        return "MobicommPlan{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", price=" + price +
                ", validity='" + validity + '\'' +
                ", category=" + (category != null ? category.getName() : "null") + // ✅ Show category name
                '}';
    }
}
