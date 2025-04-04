package com.mobicomm.backend.controller;

import com.mobicomm.backend.model.Role;
import com.mobicomm.backend.model.User;
import com.mobicomm.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5500") // Adjust if frontend runs on a different port
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ✅ Fetch User by Mobile Number (Used in Payment Gateway)
    @GetMapping("/mobile/{mobileNumber}")
    public ResponseEntity<?> getUserByMobile(@PathVariable String mobileNumber) {
        User user = userService.getUserByMobileNumber(mobileNumber);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
    }

    // ✅ Validate if a User Exists by Mobile Number
    @GetMapping("/validate/{mobileNumber}")
    public ResponseEntity<Map<String, Object>> validateUser(@PathVariable String mobileNumber) {
        User user = userService.getUserByMobileNumber(mobileNumber);
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                "exists", true,
                "email", user.getEmail() != null ? user.getEmail() : "Not Available"
            ));
        }
        return ResponseEntity.ok(Map.of("exists", false));
    }

    // ✅ Send OTP to Mobile Number (Simulated)
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String mobileNumber = request.get("mobile");
        String otp = request.get("otp");

        // Simulate OTP sending (Replace with actual OTP logic)
        System.out.println("Sending OTP " + otp + " to " + mobileNumber);

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully!"));
    }

    // ✅ Fetch User Profile by Mobile Number
    @GetMapping("/profile/{mobileNumber}")
    public ResponseEntity<?> getUserProfile(@PathVariable String mobileNumber) {
        User user = userService.getUserByMobileNumber(mobileNumber);
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                "name", user.getName(),
                "mobile", user.getMobileNumber(),
                "alternateMobile", user.getAlternateMobileNumber(),
                "email", user.getEmail(),
                "address", user.getResidentialAddress()
            ));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
    }
    
    
 // ✅ Fetch All Subscribers
    @GetMapping("/subscribers")
    public ResponseEntity<?> getAllSubscribers() {
        // Fetch only users with SUBSCRIBER role
        List<User> subscribers = userService.getAllUsers().stream()
            .filter(user -> user.getRole() == Role.SUBSCRIBER)
            .collect(Collectors.toList());

        // Transform users to a format suitable for the frontend
        List<Map<String, String>> subscriberDetails = subscribers.stream()
            .map(user -> Map.of(
                "name", user.getName(),
                "mobile", user.getMobileNumber(),
                "email", user.getEmail() != null ? user.getEmail() : "N/A",
                "currentPlan", "Basic Plan", // You might want to link this with a Plan entity
                "lastRecharge", "2024-03-01", // Placeholder - link with actual recharge data
                "expiryDate", "2024-04-01", // Placeholder - link with actual plan expiry
                "status", "Active" // Placeholder - you might want to create a more dynamic status determination
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(subscriberDetails);
    }
}
