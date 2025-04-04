document.addEventListener('DOMContentLoaded', async function() {
    // Authentication check
    const userMobile = localStorage.getItem("loggedInUser");
    if (!userMobile) {
        window.location.href = "login.html";
        return;
    }

    // DOM elements
    const profileSection = document.getElementById("user-profile");
    const rechargeHistoryList = document.querySelector(".history-list");
    const emptyState = document.querySelector(".empty-state");
    const rechargeHistoryLink = document.getElementById('recharge-history-link');
    const rechargeHistoryModal = document.getElementById('recharge-history-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const viewButtons = document.querySelectorAll('.view-btn');
    const historyList = document.querySelector('.history-list');
    const filterButtonsContainer = document.querySelector('.date-filter');
    const dateInputs = document.querySelectorAll('.date-input');
    const filterBtn = document.querySelector('.filter-btn');
    const rechargeButtons = document.querySelectorAll('.recharge-btn');
    const sparkles = document.querySelectorAll('.sparkle');
    const progressBar = document.querySelector('.progress');
    const dataLeft = document.querySelector('.data-left');
    const logo = document.querySelector('.logo');

    // Background change elements
    const changeBgBtn = document.getElementById('change-bg-btn');
    const backgroundModal = document.getElementById('background-modal');
    const closeBgModalBtn = document.getElementById('close-bg-modal');
    const headerGradient = document.querySelector('.header-gradient');
    const bgOptions = document.querySelectorAll('.bg-option');

    // Add reset button to filter container
    const resetBtn = document.createElement('button');
    resetBtn.className = 'filter-btn';
    resetBtn.innerHTML = '<i class="fas fa-undo"></i> Reset';
    resetBtn.style.backgroundColor = '#64748B';
    filterButtonsContainer.appendChild(resetBtn);

    // Add toast styles if they don't exist yet
    if (!document.getElementById('toast-styles')) {
        const toastStyles = document.createElement('style');
        toastStyles.id = 'toast-styles';
        toastStyles.innerHTML = `
            .confirmation-toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: #10B981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .confirmation-toast.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        `;
        document.head.appendChild(toastStyles);
    }

    // Fetch user profile and recharge history
    await fetchUserProfile();
    await fetchRechargeHistory();

    // Background change functionality
    // Load saved background if exists
	// Load saved background if exists
	const savedBg = localStorage.getItem('userBackground');
	if (savedBg) {
	    headerGradient.className = 'header-gradient ' + savedBg;
	    
	    // Also update the profile pic if it's using initials
	    const profilePic = document.getElementById("profile-pic");
	    if (profilePic && !profilePic.style.backgroundImage) {
	        const initialsElement = profilePic.querySelector('div');
	        if (initialsElement) {
	            // Remove any existing gradient classes
	            initialsElement.className = '';
	            // Add the saved gradient class
	            initialsElement.classList.add(savedBg);
	        }
	    }
	}

	// Open background selection modal
	changeBgBtn.addEventListener('click', function() {
	    backgroundModal.classList.add('active');
	    document.body.style.overflow = 'hidden';
	    
	    // Mark the current background as selected
	    const currentBg = headerGradient.className.replace('header-gradient ', '');
	    bgOptions.forEach(option => {
	        if (option.dataset.bg === currentBg) {
	            option.classList.add('selected');
	        } else {
	            option.classList.remove('selected');
	        }
	    });
	});

	// Close background selection modal
	closeBgModalBtn.addEventListener('click', function() {
	    backgroundModal.classList.remove('active');
	    document.body.style.overflow = 'auto';
	});

	// Background selection
	bgOptions.forEach(option => {
	    option.addEventListener('click', function() {
	        const bgClass = this.dataset.bg;
	        
	        // Update header gradient
	        headerGradient.className = 'header-gradient ' + bgClass;
	        
	        // Also update profile pic gradient if using initials
	        const profilePic = document.getElementById("profile-pic");
	        if (!profilePic.style.backgroundImage) {
	            const initialsElement = profilePic.querySelector('div');
	            if (initialsElement) {
	                // Remove all gradient classes and add the new one
	                initialsElement.className = '';
	                initialsElement.classList.add(bgClass);
	            }
	        }
	        
	        // Save to localStorage
	        localStorage.setItem('userBackground', bgClass);
	        
	        // Update selection UI
	        bgOptions.forEach(opt => opt.classList.remove('selected'));
	        this.classList.add('selected');
	        
	        // Show confirmation
	        const confirmationToast = document.createElement('div');
	        confirmationToast.className = 'confirmation-toast';
	        confirmationToast.textContent = 'Background updated successfully!';
	        document.body.appendChild(confirmationToast);
	        
	        setTimeout(() => {
	            confirmationToast.classList.add('show');
	        }, 100);
	        
	        setTimeout(() => {
	            confirmationToast.classList.remove('show');
	            setTimeout(() => {
	                document.body.removeChild(confirmationToast);
	            }, 300);
	        }, 3000);
	    });
	});

    // Function to fetch user profile
    async function fetchUserProfile() {
        try {
            const response = await fetch(`http://localhost:8085/api/user/profile/${userMobile}`);
            if (!response.ok) throw new Error("Failed to fetch user profile");
            const userData = await response.json();

            // Populate existing input fields without modifying the HTML structure
            document.getElementById("userName").value = userData.name || "";
            document.getElementById("mobileNumber").value = userData.mobile || "";
            document.getElementById("alternateNumber").value = userData.alternateMobile || "";
            document.getElementById("emailAddress").value = userData.email || "";
            document.getElementById("residentialAddress").value = userData.address || "";
            document.getElementById("circle").value = userData.circle || "";

            // Handle email verification button correctly
            const verifyBtn = document.getElementById("verifyEmailBtn");
            if (userData.emailVerified) {
                verifyBtn.textContent = "Verified";
                verifyBtn.disabled = true;
            } else {
                verifyBtn.textContent = "Verify Email";
                verifyBtn.addEventListener("click", () => verifyEmail(userData.email));
            }

			// Set profile picture if available
			// Inside the fetchUserProfile function, update the profile picture section:
			if (userData.profilePic) {
			    document.getElementById("profile-pic").style.backgroundImage = `url(${userData.profilePic})`;
			} else {
			    // Get initials from user's name
			    const nameParts = userData.name ? userData.name.split(' ') : ['U'];
			    let initials = nameParts[0].charAt(0).toUpperCase();
			    
			    // Add second initial if available
			    if (nameParts.length > 1) {
			        initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
			    }
			    
			    // Get the current header gradient class
			    const currentGradient = headerGradient.className.replace('header-gradient ', '');
			    
			    // Set the profile pic with the current gradient class
			    document.getElementById("profile-pic").innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 600; color: white;" class="${currentGradient}">${initials}</div>`;
			}

        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    }

    // Function to fetch recharge history
    async function fetchRechargeHistory() {
        try {
            const response = await fetch(`http://localhost:8085/api/recharges/history/${userMobile}`);
            if (!response.ok) throw new Error("Failed to fetch recharge history");
            const historyData = await response.json();

            if (historyData.length === 0) {
                emptyState.style.display = "block";
                rechargeHistoryList.style.display = "none";
                return;
            }

            rechargeHistoryList.innerHTML = historyData.map(recharge => `
                <div class="history-card">
                    <div class="plan-icon ${recharge.status === 'failed' ? 'failed-icon' : 'success-icon'}">
                        <i class="fas fa-${recharge.status === 'failed' ? 'times' : 'bolt'}"></i>
                    </div>
                    <div class="history-details">
                        <h4>${recharge.planName}</h4>
                        <div class="plan-row">
                            <div class="plan-feature">
                                <i class="fas fa-wifi"></i>
                                <span>${recharge.dataPerDay}GB/day</span>
                            </div>
                            <div class="plan-feature">
                                <i class="fas fa-phone-alt"></i>
                                <span>${recharge.calls}</span>
                            </div>
                            <div class="plan-feature">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${recharge.validity} days</span>
                            </div>
                        </div>
                        <div class="transaction-id">Transaction ID: ${recharge.transactionId}</div>
                    </div>
                    <div class="price-container">
                        <div class="recharge-price">₹${recharge.price}</div>
                        <div class="recharge-status status-${recharge.status === 'failed' ? 'failed' : 'success'}">
                            <i class="fas fa-${recharge.status === 'failed' ? 'times' : 'check'}-circle"></i>
                            ${recharge.status === 'failed' ? 'Failed' : 'Successful'}
                        </div>
                        <div class="recharge-date">${formatDate(recharge.rechargeDate)}</div>
                    </div>
                </div>
            `).join("");

            emptyState.style.display = "none";
            rechargeHistoryList.style.display = "flex";

            // Add event listeners to the newly created recharge buttons
            document.querySelectorAll('.recharge-btn').forEach(button => {
                button.addEventListener('click', function() {
                    alert('Redirecting to recharge page...');
                });
            });

        } catch (error) {
            console.error("Error fetching recharge history:", error);
            // Show empty state if there's an error
            emptyState.style.display = "block";
            rechargeHistoryList.style.display = "none";
        }
    }

    function formatDate(dateString) {
        const options = { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true };
        return new Date(dateString).toLocaleDateString("en-US", options);
    }

    function verifyEmail(email) {
        if (!email || email === "Not Set") {
            alert("No email found. Please update your email first.");
            return;
        }

        alert(`Verification email sent to ${email}. Please check your inbox.`);
        document.querySelector(".verify-btn").textContent = "Resend Email";
    }

    // Modal functionality
    rechargeHistoryLink.addEventListener('click', function() {
        rechargeHistoryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeModalBtn.addEventListener('click', function() {
        rechargeHistoryModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    rechargeHistoryModal.addEventListener('click', function(e) {
        if (e.target === rechargeHistoryModal) {
            rechargeHistoryModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Background modal functionality
    backgroundModal.addEventListener('click', function(e) {
        if (e.target === backgroundModal) {
            backgroundModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // View toggle functionality
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            if (this.querySelector('.fa-th-large')) {
                historyList.classList.add('grid-view');
                addGridViewStyles();
            } else {
                historyList.classList.remove('grid-view');
            }
        });
    });

    function addGridViewStyles() {
        if (!document.getElementById('grid-view-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'grid-view-styles';
            styleSheet.innerHTML = `
                .history-list.grid-view {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                }
                
                .history-list.grid-view .history-card {
                    flex-direction: column;
                    height: 100%;
                    align-items: flex-start;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    // Date filter functionality
    filterBtn.addEventListener('click', function() {
        const fromDate = new Date(dateInputs[0].value);
        const toDate = new Date(dateInputs[1].value);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            alert('Please select valid from and to dates');
            return;
        }

        let visibleCards = 0;
        const historyCards = document.querySelectorAll('.history-card');

        historyCards.forEach(card => {
            const dateText = card.querySelector('.recharge-date').textContent;
            const cardDate = new Date(dateText);

            if (cardDate >= fromDate && cardDate <= toDate) {
                card.style.display = 'flex';
                visibleCards++;
            } else {
                card.style.display = 'none';
            }
        });

        emptyState.style.display = visibleCards === 0 ? "block" : "none";
        historyList.style.display = visibleCards === 0 ? "none" : "flex";
    });

    resetBtn.addEventListener('click', function() {
        dateInputs.forEach(input => input.value = '');
        document.querySelectorAll('.history-card').forEach(card => card.style.display = 'flex');
        emptyState.style.display = 'none';
        historyList.style.display = 'flex';
    });

    // Navigation functionality
    document.getElementById("navi-recharge").addEventListener('click', function() {
        window.location.href = "rechargeplans.html";
    });
    
    // Recharge button functionality
    rechargeButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Redirecting to recharge page...');
        });
    });

    // Sparkle animation
    sparkles.forEach(sparkle => {
        sparkle.style.animationDelay = `${Math.random() * 2}s`;
    });

    // Add CSS fix for change background icon visibility
    const bgIconFixStyle = document.createElement('style');
    bgIconFixStyle.innerHTML = `
        .change-bg-icon {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
        }
    `;
    document.head.appendChild(bgIconFixStyle);
});