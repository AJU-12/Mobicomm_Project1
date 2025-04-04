package com.mobicomm.backend.controller;

import com.mobicomm.backend.model.Role;
import com.mobicomm.backend.model.User;
import com.mobicomm.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/validate/{adminId}")
    public ResponseEntity<Map<String, Object>> validateAdminId(@PathVariable String adminId) {
        User admin = userService.getUserByMobileNumber(adminId);
        boolean exists = (admin != null && admin.getRole() == Role.ADMIN);
        String email = exists ? (admin.getEmail() != null ? admin.getEmail() : "Not Available") : "";
        return ResponseEntity.ok(Map.of("exists", exists, "email", email));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> credentials) {
        String adminId = credentials.get("adminId");
        String password = credentials.get("password");

        User admin = userService.getUserByMobileNumber(adminId);
        if (admin == null || admin.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid admin ID"));
        }

        if (!admin.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid password"));
        }

        return ResponseEntity.ok(Map.of("message", "Login successful"));
    }
}