package com.mobicomm.backend.service;

import com.mobicomm.backend.model.MobicommPlan;
import com.mobicomm.backend.repository.MobicommPlanRepository;
import com.mobicomm.backend.repository.CategoryRepository;
import com.mobicomm.backend.model.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class MobicommPlanService {

    @Autowired
    private MobicommPlanRepository planRepository;

    @Autowired
    private CategoryRepository categoryRepository; // ✅ Injected Category Repository

    private static final Logger logger = Logger.getLogger(MobicommPlanService.class.getName());

    // ✅ Fetch all plans (Admin Dashboard)
    public List<MobicommPlan> getAllPlans() {
        return planRepository.findAll();
    }

    // ✅ Fetch distinct categories from the database
    public List<String> getDistinctCategories() {
        return categoryRepository.findAll().stream().map(Category::getName).collect(Collectors.toList());
    }

    // ✅ Fetch only active plans (Recharge Plans Page)
    public List<MobicommPlan> getPlansByStatus(String status) {
        return planRepository.findByStatusIgnoreCase(status);
    }

    // ✅ Fetch active plans filtered by category (Using Category Object)
    public List<MobicommPlan> getPlansByCategoryAndStatus(String categoryName, String status) {
        Optional<Category> categoryOpt = categoryRepository.findByName(categoryName);
        if (categoryOpt.isEmpty()) {
            throw new IllegalArgumentException("Category does not exist.");
        }
        // Pass the Category object, not just the name
        return planRepository.findByCategoryAndStatus(categoryOpt.get(), status);
    }

    // ✅ Fetch a single plan by ID
    public Optional<MobicommPlan> getPlanById(Long id) {
        return planRepository.findById(id);
    }

    // ✅ Save or update a plan (Ensures valid category)
    public MobicommPlan savePlan(MobicommPlan plan) {
        try {
            if (plan.getCategory() == null) {
                throw new IllegalArgumentException("Category is required.");
            }

            // Get the category name from the plan
            String categoryName = plan.getCategory();
            
            // Find the Category object by name
            Optional<Category> categoryOpt = categoryRepository.findByName(categoryName);
            if (categoryOpt.isEmpty()) {
                throw new IllegalArgumentException("Category does not exist.");
            }
            
            plan.setCategory(categoryOpt.get()); // ✅ Set correct category reference

            if (plan.getStatus() == null || plan.getStatus().trim().isEmpty()) {
                plan.setStatus("Active"); // Default status
            }

            return planRepository.save(plan);
        } catch (Exception e) {
            logger.severe("Error saving plan: " + e.getMessage());
            throw new RuntimeException("Failed to save plan.");
        }
    }

    // ✅ Delete a plan by ID (Ensures plan exists before deletion)
    public void deletePlan(Long id) {
        if (!planRepository.existsById(id)) {
            logger.warning("Attempted to delete non-existing plan with ID: " + id);
            throw new RuntimeException("Plan not found.");
        }
        planRepository.deleteById(id);
    }
    
 // Check if a category is in use by any plans
    public boolean isCategoryInUse(String categoryName) {
        Optional<Category> categoryOpt = categoryRepository.findByName(categoryName);
        if (categoryOpt.isPresent()) {
            return planRepository.existsByCategory(categoryOpt.get());
        }
        return false;
    }
}
