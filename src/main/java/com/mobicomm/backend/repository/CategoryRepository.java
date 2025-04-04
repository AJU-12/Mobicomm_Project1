package com.mobicomm.backend.repository;

import com.mobicomm.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    boolean existsByName(String name);
    
    // ✅ Add method to find category by name
    Optional<Category> findByName(String name);
    
    // ✅ Ensure delete by name exists
    void deleteByName(String name);
}
