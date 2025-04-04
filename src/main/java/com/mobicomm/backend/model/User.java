package com.mobicomm.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String mobileNumber;

    @Column(unique = true)
    private String email;

    private String alternateMobileNumber;
    private String residentialAddress;

    private String password; // Only for admin

    @Enumerated(EnumType.STRING)
    private Role role; // Enum for role management

    // ✅ Correct Getter Methods
    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public String getAlternateMobileNumber() {
        return alternateMobileNumber;
    }

    public String getResidentialAddress() {
        return residentialAddress;
    }

	public Long getId() {
		// TODO Auto-generated method stub
		return id;
	}

	public Role getRole() {
		// TODO Auto-generated method stub
		return role;
	}

	public Object getPassword() {
		// TODO Auto-generated method stub
		return password;
	}
}
