package com.mobicomm.backend.repository;

import com.mobicomm.backend.model.Category;
import com.mobicomm.backend.model.MobicommPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MobicommPlanRepository extends JpaRepository<MobicommPlan, Long> {

    // ✅ Fetch plans by status
    List<MobicommPlan> findByStatusIgnoreCase(String status);
    
    // ✅ Fetch plans by category (Using Category object instead of String)
    List<MobicommPlan> findByCategoryAndStatus(Category category, String status);
    
    // ✅ Check if any plan is using a category
    boolean existsByCategory(Category category);
}