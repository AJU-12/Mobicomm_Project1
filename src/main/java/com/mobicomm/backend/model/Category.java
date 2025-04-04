package com.mobicomm.backend.model;

import jakarta.persistence.*;
import java.util.List;


import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "categories", uniqueConstraints = {@UniqueConstraint(columnNames = "name")})
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    // ✅ One-to-Many relationship with MobicommPlan (Cascade Delete Enabled)
    @JsonManagedReference
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MobicommPlan> plans; 

    // Default constructor (required by JPA)
    public Category() {}

    // Constructor with name
    public Category(String name) {
        this.name = name;
    }

    // Getter for ID
    public Long getId() {
        return id;
    }

    // Setter for ID
    public void setId(Long id) {
        this.id = id;
    }

    // Getter for name
    public String getName() {
        return name;
    }

    // Setter for name
    public void setName(String name) {
        this.name = name;
    }

    // Getter for Plans
    public List<MobicommPlan> getPlans() {
        return plans;
    }

    // Setter for Plans
    public void setPlans(List<MobicommPlan> plans) {
        this.plans = plans;
    }
    
    @Override
    public String toString() {
        return "Category{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", planCount=" + (plans != null ? plans.size() : 0) + // ✅ Show number of linked plans
                '}';
    }
}
