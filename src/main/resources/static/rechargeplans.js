document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (loggedInUser) {
        // ✅ Change button to profile icon
        loginBtn.innerHTML = '<i class="fas fa-user"></i>'; 
        loginBtn.onclick = function () {
            window.location.href = "user-profile.html"; // Redirect to user profile
        };
    } else {
        loginBtn.innerHTML = '<span>Login</span>';
        loginBtn.onclick = function () {
            window.location.href = "login copy.html"; // Redirect to login page
        };
    }
});


document.addEventListener("DOMContentLoaded", async function () {
    const packsNav = document.querySelector(".packs-nav");
    const plansContainer = document.getElementById("plans-container");
    let currentCategory = "";

    // ✅ Reset buttons immediately when the page is shown (including navigating back)
    window.addEventListener("pageshow", function (event) {
        // The persisted property returns true if the page is loaded from the cache (back/forward navigation)
        if (event.persisted) {
            console.log("Page was loaded from cache (back navigation)");
        }
        resetProcessingState();
    });
    
    // Also add popstate event to catch more back navigation scenarios
    window.addEventListener("popstate", function() {
        console.log("Back/forward navigation detected");
        resetProcessingState();
    });

    // ✅ Function to reset "Processing..." states when navigating back
    function resetProcessingState() {
        console.log("Resetting processing states...");

        // ✅ Remove all processing states from localStorage
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("plan_") && key.endsWith("_processing")) {
                localStorage.removeItem(key);
            }
        });

        // ✅ Reset UI buttons
        document.querySelectorAll(".button-bp").forEach(button => {
            button.innerHTML = "BUY PLAN";
            button.disabled = false;
        });
    }

    // ✅ Fetch categories dynamically
    async function fetchCategories() {
        try {
            const response = await fetch("http://localhost:8085/api/mobicomm/plans/categories");
            if (!response.ok) throw new Error("Failed to fetch categories");

            const categories = await response.json();
            packsNav.innerHTML = ""; // Clear existing categories

            categories.forEach((category, index) => {
                const listItem = document.createElement("li");
                listItem.className = "nav-item";

                const link = document.createElement("a");
                link.className = `nav-link packsMaincat ${index === 0 ? "active" : ""}`;
                link.href = "#";
                link.textContent = category.replace(/-/g, " ");
                link.dataset.packname = category;

                if (index === 0) {
                    currentCategory = category;
                }

                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    document.querySelectorAll(".packsMaincat").forEach(tab => tab.classList.remove("active"));
                    link.classList.add("active");
                    currentCategory = category;
                    fetchPlansByCategory(currentCategory);
                });

                listItem.appendChild(link);
                packsNav.appendChild(listItem);
            });

            if (currentCategory) {
                fetchPlansByCategory(currentCategory);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    // ✅ Fetch plans dynamically by category
    // In your fetchPlansByCategory function, update the code that displays the "no plans" message:
    
    // Add or update the fetchPlansByCategory function to include proper "no plans" message
    async function fetchPlansByCategory(category) {
        try {
            const response = await fetch(`http://localhost:8085/api/mobicomm/plans/recharge?category=${category}`);
            if (!response.ok) throw new Error("Network response was not ok");
    
            const plans = await response.json();
            plansContainer.innerHTML = ""; // Clear previous plans
    
            if (!plans || plans.length === 0) {
                console.log("No plans found for category:", category); // Debug log
                plansContainer.innerHTML = `
                    <div class="no-plans-message">
                        <i class="fas fa-info-circle"></i>
                        <h3>No Plans Available</h3>
                        <p>There are currently no plans available for the "${category}" category. Please check back later or explore other categories.</p>
                    </div>
                `;
                return;
            }
    
            plans.forEach(plan => {
                const planCard = document.createElement("div");
                planCard.className = "plan-card";
    
                // Create badge with appropriate class
                let badgeClass = "";
                if (plan.badge) {
                    if (plan.badge === "Popular") badgeClass = "popular";
                    else if (plan.badge === "Best Value") badgeClass = "best-value";
                    else if (plan.badge === "Hot") badgeClass = "hot";
                    else if (plan.badge === "Best Seller") badgeClass = "best-value";
                }
    
                // Add badge HTML if provided
                const badgeHTML = plan.badge ? `<div class="plan-badge ${badgeClass}">${plan.badge}</div>` : "";
    
                planCard.innerHTML = `
                    ${badgeHTML}
                    <div class="plan-col plan-col-1">
                        <div class="plan-price">${plan.price}</div>
                        <div class="plan-details">${plan.name}</div>
                        <div class="plan-features">${plan.details}</div>
                    </div>
                    <div class="plan-col plan-col-2">
                        <div class="plan-data">${plan.data}</div>
                        <div class="plan-per-day">${plan.validity}</div>
                    </div>
                    <div class="plan-col plan-col-3">
                        <div class="plan-validity">${plan.features ? plan.features : "No extra features"}</div>
                        <div class="plan-validity-label">Features</div>
                    </div>
                    <div class="plan-col plan-col-4">
                        <button class="button-bp" data-plan='${JSON.stringify(plan)}' data-plan-id='${plan.id}'>BUY PLAN</button>
                    </div>
                `;
    
                plansContainer.appendChild(planCard);
            });
    
            if (typeof addCardEffects === 'function') {
                addCardEffects();
            }
            
            // Add buy plan event listeners after creating the buttons
            addBuyPlanEvents();
            
        } catch (error) {
            console.error("Error fetching plans:", error);
            plansContainer.innerHTML = `
                <div class="no-plans-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Plans</h3>
                    <p>We encountered a problem while loading the plans. Please try again later.</p>
                </div>
            `;
        }
    }

    // ✅ Add event listeners to "Buy Plan" buttons
    function addBuyPlanEvents() {
        document.querySelectorAll(".button-bp").forEach(button => {
            const planId = button.getAttribute("data-plan-id");
            
            // Reset any processing state
            if (localStorage.getItem(`plan_${planId}_processing`)) {
                button.innerHTML = "BUY PLAN";
                button.disabled = false;
                localStorage.removeItem(`plan_${planId}_processing`);
            }

            // Remove any existing event listeners (to prevent duplicates)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // ✅ Add event listener for clicking the "Buy Plan" button
            newButton.addEventListener("click", function() {
                const selectedPlan = JSON.parse(this.getAttribute("data-plan"));

                // ✅ Get badge details
                const badgeElement = this.closest(".plan-card").querySelector(".plan-badge");
                const badge = badgeElement ? badgeElement.innerText.trim() : null;

                // ✅ Show loader animation while processing
                this.innerHTML = '<div class="loading-spinner"></div> Processing...';
                this.disabled = true;

                // ✅ Store processing state in localStorage
                localStorage.setItem(`plan_${planId}_processing`, "true");

                // ✅ Redirect to pack-details.html with planId & badge in URL
                const urlParams = new URLSearchParams();
                urlParams.set("planId", selectedPlan.id);
                if (badge) urlParams.set("badge", encodeURIComponent(badge));

                console.log("Redirecting to pack-details.html with:", urlParams.toString());

                setTimeout(() => {
                    window.location.href = `pack-details.html?${urlParams.toString()}`;
                }, 600);
            });
        });
    }

    // ✅ Initialize categories and plans
    await fetchCategories();
    
    // Apply initial reset
    resetProcessingState();
});