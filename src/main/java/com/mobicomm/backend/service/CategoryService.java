package com.mobicomm.backend.service;

import com.mobicomm.backend.model.Category;
import com.mobicomm.backend.repository.CategoryRepository;
import com.mobicomm.backend.repository.MobicommPlanRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private static final Logger logger = Logger.getLogger(CategoryService.class.getName());

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MobicommPlanRepository planRepository; // ✅ Injected correctly

    // ✅ Fetch all categories
    // This method returns a List<String> instead of List<Category>
    public List<String> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(Category::getName)
            .collect(Collectors.toList());
    }

    // ✅ Add a new category (Only if it doesn't already exist)
    public Category addCategory(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required.");
        }

        return categoryRepository.findByName(categoryName)
            .orElseGet(() -> categoryRepository.save(new Category(categoryName))); // ✅ Return newly created category
    }

    // ✅ Remove a category safely
    public void removeCategory(String categoryName) {
        // ✅ Fetch Category object
        Category category = categoryRepository.findByName(categoryName)
            .orElseThrow(() -> new IllegalArgumentException("Category not found."));

        // ✅ Now, use the Category object
        if (planRepository.existsByCategory(category)) {
            throw new IllegalArgumentException("Cannot delete category. It is linked to existing plans.");
        }

        categoryRepository.delete(category);
        logger.info("Category '" + categoryName + "' removed successfully.");
    }
    
    // ✅ Find category by name (Newly added method)
    public Optional<Category> findCategoryByName(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return Optional.empty();
        }
        return categoryRepository.findByName(categoryName);
    }
    
    // ✅ Check if a category is in use by any plans
    public boolean isCategoryInUse(String categoryName) {
        Optional<Category> categoryOpt = findCategoryByName(categoryName);
        if (categoryOpt.isPresent()) {
            return planRepository.existsByCategory(categoryOpt.get());
        }
        return false;
    }
}
