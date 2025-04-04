package com.mobicomm.backend.controller;

import com.mobicomm.backend.model.Category;
import com.mobicomm.backend.model.MobicommPlan;
import com.mobicomm.backend.service.MobicommPlanService;
import com.mobicomm.backend.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/mobicomm/plans")
@CrossOrigin(origins = "*")
public class MobicommPlanController {

    private final MobicommPlanService planService;
    private final CategoryService categoryService;
    private static final Logger logger = Logger.getLogger(MobicommPlanController.class.getName());

    public MobicommPlanController(MobicommPlanService planService, CategoryService categoryService) {
        this.planService = planService;
        this.categoryService = categoryService;
    }

    // Fetch all categories
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            return ResponseEntity.ok(categoryService.getAllCategories());
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error fetching categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch categories: " + e.getMessage()));
        }
    }

    // Add a new category
    @PostMapping("/categories")
    public ResponseEntity<?> addCategory(@RequestBody Map<String, String> request) {
        String categoryName = request.get("category");
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Category name is required and cannot be empty"));
        }

        try {
            // Check if category already exists
            if (categoryService.findCategoryByName(categoryName).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Category '" + categoryName + "' already exists"));
            }
            
            categoryService.addCategory(categoryName);
            return ResponseEntity.ok(Map.of("message", "Category added successfully"));
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error adding category: " + categoryName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error adding category: " + e.getMessage()));
        }
    }

    // Remove a category
    @DeleteMapping("/categories/{categoryName}")
    public ResponseEntity<?> removeCategory(@PathVariable String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid category name"));
        }

        try {
            // Check if category exists
            Optional<Category> categoryOpt = categoryService.findCategoryByName(categoryName);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Category '" + categoryName + "' not found"));
            }
            
            // Check if category is in use
            if (planService.isCategoryInUse(categoryName)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Cannot remove category '" + categoryName + "' as it is being used by existing plans"));
            }
            
            categoryService.removeCategory(categoryName);
            return ResponseEntity.ok(Map.of("message", "Category removed successfully"));
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error removing category: " + categoryName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error removing category: " + e.getMessage()));
        }
    }

    // Retrieve all plans
    @GetMapping
    public ResponseEntity<?> getAllPlans() {
        try {
            return ResponseEntity.ok(planService.getAllPlans());
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error fetching all plans", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch plans: " + e.getMessage()));
        }
    }

    // Retrieve active recharge plans (Filtered by category if provided)
    @GetMapping("/recharge")
    public ResponseEntity<?> getActiveRechargePlans(@RequestParam(required = false) String category) {
        try {
            List<MobicommPlan> plans = (category != null && !category.isEmpty()) ?
                    planService.getPlansByCategoryAndStatus(category, "Active") :
                    planService.getPlansByStatus("Active");

            return ResponseEntity.ok(plans);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error fetching active recharge plans", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch recharge plans: " + e.getMessage()));
        }
    }

    // GET: Retrieve a single plan by ID

    @GetMapping("/{id}")
    public ResponseEntity<Object> getPlanById(@PathVariable Long id) {
        Optional<MobicommPlan> plan = planService.getPlanById(id);
        
        if (plan.isPresent()) {
            return ResponseEntity.ok(plan.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Plan not found"));
        }
    }

    // POST: Create a new plan
    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody Map<String, Object> request) {
        try {
            // Extract category name from request
            String categoryName = (String) request.getOrDefault("category", "");
            
            if (categoryName == null || categoryName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Category is required"));
            }
            
            // Find the Category object by name
            Optional<Category> categoryOpt = categoryService.findCategoryByName(categoryName);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Category '" + categoryName + "' not found"));
            }
            
            // Create new plan and set properties
            MobicommPlan newPlan = new MobicommPlan();
            newPlan.setName((String) request.getOrDefault("name", ""));
            newPlan.setDetails((String) request.getOrDefault("details", ""));
            newPlan.setCategory(categoryOpt.get());
            
            // Handle price conversion
            Object priceObj = request.getOrDefault("price", 0.0);
            Double price;
            if (priceObj instanceof Number) {
                price = ((Number) priceObj).doubleValue();
            } else if (priceObj instanceof String) {
                price = Double.valueOf((String) priceObj);
            } else {
                price = 0.0;
            }
            newPlan.setPrice(price);
            
            newPlan.setValidity((String) request.getOrDefault("validity", ""));
            newPlan.setData((String) request.getOrDefault("data", ""));
            newPlan.setFeatures((String) request.getOrDefault("features", ""));
            newPlan.setBadge((String) request.getOrDefault("badge", ""));
            newPlan.setStatus((String) request.getOrDefault("status", "Active"));
            
            // Validate required fields
            if (newPlan.getName() == null || newPlan.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Plan name is required"));
            }
            
            if (newPlan.getPrice() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Price must be greater than zero"));
            }
            
            MobicommPlan savedPlan = planService.savePlan(newPlan);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPlan);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error creating plan", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create plan: " + e.getMessage()));
        }
    }

    // PUT: Update an existing plan
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        // Extract category name
        String categoryName = (String) request.getOrDefault("category", "");
        
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Category cannot be empty"));
        }
        
        // Find the Category object
        Optional<Category> categoryOpt = categoryService.findCategoryByName(categoryName);
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Category '" + categoryName + "' not found"));
        }
        
        try {
            Optional<MobicommPlan> planOpt = planService.getPlanById(id);
            
            if (planOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan with ID " + id + " not found"));
            }
            
            MobicommPlan existingPlan = planOpt.get();

            // Update fields if provided
            if (request.containsKey("name")) {
                String name = (String) request.get("name");
                if (name == null || name.trim().isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Plan name cannot be empty"));
                }
                existingPlan.setName(name);
            }
            
            if (request.containsKey("price")) {
                try {
                    Object priceObj = request.get("price");
                    Double price;
                    
                    if (priceObj instanceof Number) {
                        price = ((Number) priceObj).doubleValue();
                    } else if (priceObj instanceof String) {
                        price = Double.valueOf((String) priceObj);
                    } else {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Invalid price format"));
                    }
                    
                    if (price <= 0) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Price must be greater than zero"));
                    }
                    
                    existingPlan.setPrice(price);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid price format"));
                }
            }
            
            if (request.containsKey("status")) {
                existingPlan.setStatus((String) request.get("status"));
            }
            
            if (request.containsKey("details")) {
                existingPlan.setDetails((String) request.get("details"));
            }
            
            if (request.containsKey("validity")) {
                existingPlan.setValidity((String) request.get("validity"));
            }
            
            if (request.containsKey("data")) {
                existingPlan.setData((String) request.get("data"));
            }
            
            if (request.containsKey("features")) {
                existingPlan.setFeatures((String) request.get("features"));
            }
            
            if (request.containsKey("badge")) {
                existingPlan.setBadge((String) request.get("badge"));
            }

            // Set the Category object, not just the name
            existingPlan.setCategory(categoryOpt.get());
            
            MobicommPlan updatedPlan = planService.savePlan(existingPlan);
            return ResponseEntity.ok(updatedPlan);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error updating plan with ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update plan: " + e.getMessage()));
        }
    }

    // DELETE: Remove a plan by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable Long id) {
        try {
            Optional<MobicommPlan> planOpt = planService.getPlanById(id);
            
            if (planOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan with ID " + id + " not found"));
            }
            
            planService.deletePlan(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error deleting plan with ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete plan: " + e.getMessage()));
        }
    }

    // PATCH: Update only the status of a plan
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updatePlanStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Optional<MobicommPlan> planOpt = planService.getPlanById(id);
            
            if (planOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan with ID " + id + " not found"));
            }
            
            MobicommPlan plan = planOpt.get();
            
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Status cannot be empty"));
            }
            
            plan.setStatus(status);
            MobicommPlan updatedPlan = planService.savePlan(plan);
            return ResponseEntity.ok(updatedPlan);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error updating status for plan with ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update plan status: " + e.getMessage()));
        }
    }
    
    // Add this endpoint to check if a category is in use
    @GetMapping("/categories/{categoryName}/in-use")
    public ResponseEntity<?> isCategoryInUse(@PathVariable String categoryName) {
        try {
            boolean inUse = categoryService.isCategoryInUse(categoryName);
            return ResponseEntity.ok(Map.of("inUse", inUse));
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error checking if category is in use", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check category: " + e.getMessage()));
        }
    }
}
