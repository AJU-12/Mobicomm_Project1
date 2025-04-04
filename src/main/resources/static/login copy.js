// Initialize EmailJS
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("T5e2FgDlCSqCvJyjM"); // Replace with your EmailJS Public Key
});

function showToast(message, type = "error") {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s ease-out";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
    const phoneForm = document.getElementById("phoneForm");
    const otpForm = document.getElementById("otpForm");
    const phoneInput = document.getElementById("phoneNumber");
    const otpInput = document.getElementById("otp");
    const resendLink = document.getElementById("resendOtp");
    const sendOtpButton = document.getElementById("sendOtpButton");
    const numberFeedback = document.getElementById("numberFeedback");

    // Function to check if the number is registered in the database
    async function validatePhoneNumber(number) {
        try {
            const response = await fetch(`http://localhost:8085/api/user/validate/${number}`);
            const data = await response.json();
            console.log("API Response:", data); // Debugging log

            if (response.ok && data.exists) {
                return data; // User exists
            } else {
                return null; // User not found
            }
        } catch (error) {
            console.error("Error validating phone number:", error);
            return null;
        }
    }

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    phoneInput.addEventListener("input", async () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, ""); // Remove non-numeric characters
        const number = phoneInput.value.trim();

        if (number.length === 0) {
            numberFeedback.textContent = "";
            sendOtpButton.disabled = true;
            return;
        }

        if (number.length === 10) {
            const userData = await validatePhoneNumber(number);
            if (userData) {
                numberFeedback.textContent = "✓ Number verified";
                numberFeedback.className = "input-feedback success";
                sendOtpButton.disabled = false;
            } else {
                numberFeedback.textContent = "✗ Number not registered";
                numberFeedback.className = "input-feedback error";
                sendOtpButton.disabled = true;
            }
        } else {
            numberFeedback.textContent = "10 digits required";
            sendOtpButton.disabled = true;
        }
    });

    phoneForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const number = phoneInput.value.trim();
        if (number.length !== 10) {
            showToast("Please enter a valid 10-digit mobile number");
            return;
        }

        const userData = await validatePhoneNumber(number);
        if (!userData) {
            showToast("Mobile number not registered.");
            return;
        }

        const otp = generateOTP();
        localStorage.setItem("otp", otp); // Store OTP for verification
        console.log("Generated OTP (For Debugging):", otp); // Remove this in production

        sendOtpButton.disabled = true;
        sendOtpButton.textContent = "Sending...";

        try {
            const response = await fetch("http://localhost:8085/api/user/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: number, otp: otp }),
            });

            if (!response.ok) throw new Error("Failed to send OTP");

            showToast(`OTP sent to ${userData.email || "your registered email"}`, "success");
            phoneForm.style.display = "none";
            otpForm.style.display = "block";
        } catch (error) {
            console.error("Error sending OTP:", error);
            showToast("Failed to send OTP. Try again later.");
        } finally {
            sendOtpButton.disabled = false;
            sendOtpButton.textContent = "Send OTP";
        }
    });

    otpForm.addEventListener("submit", function (e) {
        e.preventDefault();

        if (otpInput.value.length !== 6) {
            showToast("Please enter a valid 6-digit OTP");
            return;
        }

        const storedOTP = localStorage.getItem("otp");
        if (otpInput.value === storedOTP) {
            localStorage.setItem("loggedInUser", phoneInput.value);
            window.location.href = "user-profile.html";
        } else {
            showToast("Invalid OTP. Try again.");
        }
    });

    resendLink.addEventListener("click", async function () {
        otpInput.value = "";
        resendLink.textContent = "Sending...";
        resendLink.style.pointerEvents = "none";

        const number = phoneInput.value.trim();
        const userData = await validatePhoneNumber(number);
        if (!userData) {
            showToast("Mobile number not registered.");
            return;
        }

        const newOtp = generateOTP();
        localStorage.setItem("otp", newOtp);
        console.log("Resent OTP (For Debugging):", newOtp); // Remove this in production

        try {
            const response = await fetch("http://localhost:8085/api/user/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: number, otp: newOtp }),
            });

            if (!response.ok) throw new Error("Failed to resend OTP");

            showToast("New OTP sent!", "success");
        } catch (error) {
            console.error("Error resending OTP:", error);
            showToast("Failed to resend OTP.");
        } finally {
            resendLink.textContent = "Resend OTP";
            resendLink.style.pointerEvents = "auto";
        }
    });
});
