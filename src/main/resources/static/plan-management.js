console.log("plan-management.js is loaded");

// Define functions that need to be globally accessible first
function openAddCategoryModal() {
    console.log("openAddCategoryModal() is called"); // Debug log
    document.getElementById('newCategoryName').value = ""; // Clear input
    openModal('addCategoryModal'); // Open modal function
}

// Make sure they're available in the global scope
window.openAddCategoryModal = openAddCategoryModal;

// Wait for the page to fully load before running any code
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Initialize the global plans array as empty – data will come from the backend
let plans = [];

// Application state variables
let currentView = "table";
let currentPage = 1;
let itemsPerPage = 10;
let filteredPlans = [];
let sortColumn = null;
let sortDirection = "asc";

// Get all the DOM elements we'll need
const DOM = {
    filterToggle: document.getElementById("toggleFilters"),
    filterBody: document.querySelector(".filter-body"),
    filterName: document.getElementById("filterName"),
    filterPriceMin: document.getElementById("filterPriceMin"),
    filterPriceMax: document.getElementById("filterPriceMax"),
    filterCategory: document.getElementById("filterCategory"),
    filterStatus: document.getElementById("filterStatus"),
    viewButtons: document.querySelectorAll(".view-btn"),
    tableView: document.getElementById("tableView"),
    resultsCount: document.getElementById("resultsCount"),
    plansTable: document.getElementById("plansTable"),
    pagination: document.getElementById("pagination"),
    showingStart: document.getElementById("showingStart"),
    showingEnd: document.getElementById("showingEnd"),
    totalItems: document.getElementById("totalItems"),
    itemsPerPageSelect: document.getElementById("itemsPerPage"),
    addPlanCategory: document.getElementById("addPlanCategory"),
    editPlanCategory: document.getElementById("editPlanCategory")
};

// Initialize the application
function init() {
    // Fetch plan data from the backend (this will update the global arrays)
    loadPlans();
    
    // Set up all event listeners
    setupEventListeners();
}

// Function to load plans from the backend API
function loadPlans() {
    fetch('http://localhost:8085/api/mobicomm/plans')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Update the global plans and filteredPlans arrays with the fetched data
            plans = data;
            filteredPlans = [...data];
            
            // Extract unique categories from the plans and populate the dropdowns
            populateCategoryDropdownsFromData();
            
            // Re-render the UI using the existing functions
            renderPlans();
            updatePagination();
            updateResultsInfo();
            console.log('Plans updated from backend:', data);
        })
        .catch(error => {
            console.error('Error fetching plans:', error);
            showNotification('Failed to load plans. Please try refreshing the page.', 'error');
        });
}

// Function to fetch categories from backend and populate dropdowns
function populateCategoryDropdownsFromData() {
    fetch("http://localhost:8085/api/mobicomm/plans/categories")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(categories => {
            console.log("Raw categories data:", JSON.stringify(categories)); // Debug log
            
            // Extract category names from the response
            let uniqueCategories = [];
            
            // Handle both array of strings and array of objects
            if (categories && categories.length > 0) {
                if (typeof categories[0] === 'string') {
                    uniqueCategories = categories; // Already strings
                } else if (typeof categories[0] === 'object') {
                    // Try to extract name property if it exists
                    uniqueCategories = categories.map(category => {
                        if (category && typeof category === 'object') {
                            return category.name || category.categoryName || JSON.stringify(category);
                        }
                        return String(category); // Convert to string as fallback
                    });
                }
            }

            console.log("Processed categories:", uniqueCategories);

            // Update all dropdowns
            const categoryDropdowns = [DOM.addPlanCategory, DOM.editPlanCategory, DOM.filterCategory];

            categoryDropdowns.forEach(dropdown => {
                if (!dropdown) return;
                dropdown.innerHTML = '<option value="" disabled selected>Select Category</option>';
                uniqueCategories.forEach(categoryName => {
                    if (categoryName && typeof categoryName === 'string') {
                        const option = document.createElement('option');
                        option.value = categoryName;
                        option.textContent = categoryName;
                        dropdown.appendChild(option);
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error fetching categories:", error);
            showNotification("Failed to load categories. Please refresh the page.", "error");
        });
}

function saveNewCategory() {
    const categoryName = document.getElementById('newCategoryName').value.trim();

    if (!categoryName) {
        showNotification('Enter a valid category name.', 'error');
        return;
    }

	fetch('http://localhost:8085/api/mobicomm/plans/categories', {
	    method: 'POST',
	    headers: { 'Content-Type': 'application/json' },
	    body: JSON.stringify({ category: categoryName })
	})
	.then(async response => {
	    const contentType = response.headers.get("content-type");
	    
	    // ✅ Ensure response is JSON before parsing
	    if (contentType && contentType.includes("application/json")) {
	        return response.json();
	    } else {
	        return response.text().then(text => ({ error: text }));
	    }
	})
	.then(data => {
	    if (data.error) {
	        throw new Error(data.error);
	    }
	    
	    showNotification('Category added successfully!', 'success');
	    closeModal('addCategoryModal');
	    populateCategoryDropdownsFromData();
	})
	.catch(error => {
	    console.error("Error adding category:", error);
	    showNotification(error.message || 'Error adding category.', 'error');
	});
}

// Make sure saveNewCategory is also globally accessible
window.saveNewCategory = saveNewCategory;




function removeCategory() {
    const selectedCategory = DOM.filterCategory.value;

    if (!selectedCategory) {
        showNotification("Please select a category to remove", "error");
        return;
    }

    // First check if category is in use
    fetch(`http://localhost:8085/api/mobicomm/plans/categories/${selectedCategory}/in-use`)
        .then(response => response.json())
        .then(data => {
            if (data.inUse) {
                showNotification("Cannot delete category. It is linked to existing plans.", "error");
                return;
            }
            
            // If not in use, show confirmation dialog
            showConfirmation(`Are you sure you want to remove the category "${selectedCategory}"?`, () => {
                fetch(`http://localhost:8085/api/mobicomm/plans/categories/${selectedCategory}`, {
                    method: "DELETE",
                })
                .then(async response => {
                    const text = await response.text();
                    if (!response.ok) {
                        throw new Error(text || "Error removing category");
                    }
                    return text;
                })
                .then(() => {
                    showNotification(`Category "${selectedCategory}" removed successfully`, "success");
                    populateCategoryDropdownsFromData();
                })
                .catch(error => {
                    console.error("Full backend error:", error);
                    showNotification(error.message || "Error removing category. Try again!", "error");
                });
            });
        })
        .catch(error => {
            console.error("Error checking if category is in use:", error);
            showNotification("Error checking category status. Try again!", "error");
        });
}

// Make function globally accessible
window.removeCategory = removeCategory;


// Set up all event listeners
function setupEventListeners() {
    // Mobile menu toggle
    document.querySelector('.mobile-menu-toggle').addEventListener('click', toggleMobileMenu);

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });

    // Profile dropdown
    document.getElementById("profilenav").addEventListener("click", toggleProfileDropdown);

    // Filter toggle
    DOM.filterToggle.addEventListener("click", toggleFilters);

    // Filter actions
    document.querySelector(".filter-apply-btn").addEventListener("click", applyFilters);
    document.querySelector(".filter-clear-btn").addEventListener("click", clearFilters);

    // View toggle buttons (keep this for future use if needed)
    DOM.viewButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Since we're removing card view, just keep the table view active
            if (btn.dataset.view === "table") {
                setView("table");
            }
        });
    });

    // Items per page
    DOM.itemsPerPageSelect.addEventListener("change", changeItemsPerPage);

    // Add plan button
    document.querySelector(".add-plan-btn").addEventListener("click", openAddPlanModal);

    // Form submission buttons
    document.getElementById("addPlanForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveNewPlan();
    });

    document.getElementById("editPlanForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveEditPlan();
    });

    // Close modals when clicking outside
    window.addEventListener('click', closeModalsOnClickOutside);

    // Close modals with ESC key
    document.addEventListener('keydown', handleEscKey);
    
    // Export dropdown
    document.getElementById('exportDropdown').addEventListener('click', toggleExportDropdown);
}

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar-container');
    sidebar.classList.toggle('active');

    // Change icon based on menu state
    const toggleIcon = document.querySelector('.mobile-menu-toggle i');
    toggleIcon.classList.toggle('fa-bars');
    toggleIcon.classList.toggle('fa-times');
}

// Handle navigation link clicks
function handleNavLinkClick(event) {
    event.preventDefault();

    // Close mobile menu if on small screens
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar-container').classList.remove('active');
        document.querySelector('.mobile-menu-toggle i').className = 'fas fa-bars';
    }

    // Highlight the active link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// Toggle profile dropdown
function toggleProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Toggle filters visibility
function toggleFilters() {
    if (DOM.filterBody.style.maxHeight) {
        // Hide filters if visible
        DOM.filterBody.style.maxHeight = null;
    } else {
        // Show filters if hidden
        DOM.filterBody.style.maxHeight = DOM.filterBody.scrollHeight + "px";
    }
}

// Apply filters to the plans
function applyFilters() {
    const nameFilter = DOM.filterName.value.toLowerCase();
    const minPrice = DOM.filterPriceMin.value ? parseFloat(DOM.filterPriceMin.value) : 0;
    const maxPrice = DOM.filterPriceMax.value ? parseFloat(DOM.filterPriceMax.value) : Infinity;
    const categoryFilter = DOM.filterCategory.value;
    const statusFilter = DOM.filterStatus.value;

    filteredPlans = plans.filter(plan => {
        if (nameFilter && !plan.name.toLowerCase().includes(nameFilter)) return false;
        if (plan.price < minPrice || plan.price > maxPrice) return false;
        if (categoryFilter && plan.category !== categoryFilter) return false;
        if (statusFilter && plan.status !== statusFilter) return false;
        return true;
    });

    currentPage = 1;
    renderPlans();
    updatePagination();
    updateResultsInfo();
}

// Clear all filters
function clearFilters() {
    DOM.filterName.value = "";
    DOM.filterPriceMin.value = "";
    DOM.filterPriceMax.value = "";
    DOM.filterCategory.value = "";
    DOM.filterStatus.value = "";

    filteredPlans = [...plans];
    currentPage = 1;
    renderPlans();
    updatePagination();
    updateResultsInfo();
}

// Set the current view (only table view is supported now)
function setView(view) {
    currentView = "table"; // Force table view
    
    // Update UI to reflect table view only
    DOM.viewButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === "table");
    });
    
    DOM.tableView.style.display = "block";
    
    // Remove reference to card view from DOM
    const cardsView = document.getElementById("cardsView");
    if (cardsView) {
        cardsView.style.display = "none";
    }
    
    renderPlans();
}

// Change items per page
function changeItemsPerPage() {
    itemsPerPage = parseInt(DOM.itemsPerPageSelect.value);
    currentPage = 1;
    renderPlans();
    updatePagination();
    updateResultsInfo();
}

// Render plans based on current state
function renderPlans() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredPlans.length);
    const plansToShow = filteredPlans.slice(startIndex, endIndex);

    renderTableView(plansToShow);
}

// Render table view
// In your renderTableView function
function renderTableView(plans) {
    let html = "";
    plans.forEach(plan => {
        console.log(`Plan ${plan.id} category:`, plan.category); // Debug log
        
        const statusClass = plan.status === "Active" ? "active-status" : "inactive-status";
        const statusAction = plan.status === "Active" ? "Deactivate" : "Activate";
        
        // Use a fallback for category if it's undefined
        const categoryDisplay = plan.category || "Uncategorized";
        
        html += `
            <tr data-id="${plan.id}">
                <td>
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-description">${plan.details}</div>
                </td>
                <td><span class="type-badge">${categoryDisplay}</span></td>
                <td class="price-cell">$${plan.price}</td>
                <td>${plan.validity}</td>
                <td>${plan.data}</td>
                <td>${plan.features || "N/A"}</td>
                <td>
                    <span class="status-badge ${statusClass}" id="status-badge-${plan.id}">
                        ${plan.status}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" title="Edit" onclick="editPlan(${plan.id})">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="action-btn duplicate-btn" title="Duplicate" onclick="duplicatePlan(${plan.id})">
                        <i class="fa fa-copy"></i>
                    </button>
                    <button class="action-btn status-btn" title="Toggle Status" onclick="toggleStatus(${plan.id})" id="status-btn-${plan.id}">
                        <i class="fa fa-power-off"></i> 
                    </button>
                    <button class="action-btn delete-btn" title="Delete" onclick="deletePlan(${plan.id})">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    DOM.plansTable.innerHTML = html;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    let paginationHtml = `
        <button class="pagination-btn pagination-prev" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fa fa-chevron-left"></i>
        </button>
    `;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="pagination-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
    }
    paginationHtml += `
        <button class="pagination-btn pagination-next" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fa fa-chevron-right"></i>
        </button>
    `;
    DOM.pagination.innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderPlans();
    updatePagination();
    updateResultsInfo();
}

// Make changePage globally accessible for pagination buttons
window.changePage = changePage;

// Update results information
function updateResultsInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredPlans.length);
    DOM.resultsCount.textContent = filteredPlans.length;
    DOM.totalItems.textContent = filteredPlans.length;
    if (filteredPlans.length === 0) {
        DOM.showingStart.textContent = 0;
        DOM.showingEnd.textContent = 0;
    } else {
        DOM.showingStart.textContent = startIndex;
        DOM.showingEnd.textContent = endIndex;
    }
}

// Edit plan function improved to handle category properly
function editPlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    document.getElementById('editPlanName').value = plan.name;
    document.getElementById('editPlanDetails').value = plan.details;
    document.getElementById('editPlanPrice').value = plan.price;
    document.getElementById('editPlanValidity').value = plan.validity;
    document.getElementById('editPlanData').value = plan.data;
    document.getElementById('editPlanFeatures').value = plan.features || "";
    document.getElementById('editPlanBadge').value = plan.badge || "";
    document.getElementById('editPlanStatus').value = plan.status || "Active";
    document.getElementById('editPlanForm').dataset.planId = planId;
    
    // Make sure the category exists in the dropdown
    const categorySelect = document.getElementById('editPlanCategory');
    let categoryExists = false;
    
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === plan.category) {
            categorySelect.selectedIndex = i;
            categoryExists = true;
            break;
        }
    }
    
    // If the category doesn't exist, add it
    if (!categoryExists && plan.category) {
        const option = document.createElement('option');
        option.value = plan.category;
        option.textContent = plan.category;
        categorySelect.appendChild(option);
        categorySelect.value = plan.category;
    }
    
    openModal('editPlanModal');
}

// Make sure editPlan is globally accessible
window.editPlan = editPlan;

// Show confirmation modal
function showConfirmation(message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const msgElement = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    msgElement.textContent = message;
    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    modal.style.display = 'block';
}

// Duplicate plan - fixed to handle backend ID generation properly
function duplicatePlan(planId) {
    showConfirmation("Are you sure you want to duplicate this plan?", () => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        
        // Create a new plan object without the ID, so the backend will generate a new one
        const newPlan = {
            name: `${plan.name} (Copy)`,
            details: plan.details,
            category: plan.category,
            price: plan.price,
            validity: plan.validity,
            data: plan.data,
            features: plan.features,
            badge: plan.badge,
            status: plan.status
        };
        
        // Send to backend to create a new plan with proper ID
        fetch('http://localhost:8085/api/mobicomm/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlan)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to duplicate plan');
            }
            return response.json();
        })
        .then(data => {
            showNotification("Plan duplicated successfully!", "success");
            loadPlans(); // Refresh list from the database
        })
        .catch(error => {
            console.error('Error duplicating plan:', error);
            showNotification("Error duplicating plan. Please try again.", "error");
        });
    });
}

// Make sure duplicatePlan is globally accessible
window.duplicatePlan = duplicatePlan;

// Toggle plan status
function toggleStatus(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newStatus = plan.status === "Active" ? "Inactive" : "Active";

    showConfirmation(`Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} this plan?`, () => {
        fetch(`http://localhost:8085/api/mobicomm/plans/${planId}/status?status=${newStatus}`, {
            method: "PATCH"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to update status");
            }
            return response.json();
        })
        .then(updatedPlan => {
            console.log("Status Updated Successfully:", updatedPlan);
            showNotification(`Plan marked as ${newStatus}`, "success");

            // Update UI instantly without refreshing
            plan.status = newStatus;
            renderPlans();
        })
        .catch(error => {
            console.error("Error updating plan status:", error);
            showNotification("Error updating status. Try again!", "error");
        });
    });
}

// Make sure toggleStatus is globally accessible
window.toggleStatus = toggleStatus;

// Delete Plan
function deletePlan(planId) {
    showConfirmation("Are you sure you want to delete this plan?", () => {
        fetch(`http://localhost:8085/api/mobicomm/plans/${planId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to delete plan");
            }
            showNotification('Plan deleted successfully!', 'info');
            loadPlans(); // Refresh list from the database
        })
        .catch(error => {
            console.error('Error deleting plan:', error);
            showNotification("Error deleting plan. Try again!", "error");
        });
    });
}

// Make sure deletePlan is globally accessible
window.deletePlan = deletePlan;

// Open add plan modal
function openAddPlanModal() {
    document.getElementById('addPlanForm').reset();
    // Set default status to Active
    document.getElementById('addPlanStatus').value = 'Active';
    openModal('addPlanModal');
}

// Save new plan function improved to handle all fields properly
function saveNewPlan() {
    // Get the category select element
    const categorySelect = document.getElementById('addPlanCategory');
    // Get the selected category value
    const categoryName = categorySelect.value;
    
    console.log("Selected category:", categoryName); // Debug log
    
    const newPlan = {
        name: document.getElementById('addPlanName').value.trim(),
        details: document.getElementById('addPlanDetails').value.trim(),
        category: categoryName, // Send the category name (string)
        price: parseFloat(document.getElementById('addPlanPrice').value) || 0,
        validity: document.getElementById('addPlanValidity').value.trim(),
        data: document.getElementById('addPlanData').value.trim(),
        features: document.getElementById('addPlanFeatures').value.trim(),
        badge: document.getElementById('addPlanBadge').value.trim(),
        status: document.getElementById('addPlanStatus').value.trim() || "Active"
    };

    // Debug log the entire plan object
    console.log("Sending plan data:", JSON.stringify(newPlan));

    // Rest of your function remains the same
    fetch('http://localhost:8085/api/mobicomm/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
    })
    .then(async response => {
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
        }
        try {
            return JSON.parse(text); // Parse text as JSON if possible
        } catch (e) {
            throw new Error("Invalid JSON response: " + text);
        }
    })
    .then(data => {
        showNotification('Plan added successfully!', 'success');
        closeModal('addPlanModal');
        loadPlans();
    })
    .catch(error => {
        console.error('Error adding plan:', error);
        showNotification(error.message || 'Error adding plan. Please try again.', 'error');
    });
}


// Save edit plan function improved to handle all fields properly
function saveEditPlan() {
    const planId = document.getElementById('editPlanForm').dataset.planId;
    
    // Get the category select element
    const categorySelect = document.getElementById('editPlanCategory');
    // Get the selected category value
    const categoryValue = categorySelect.value;
    
    const updatedPlan = {
        name: document.getElementById('editPlanName').value.trim(),
        details: document.getElementById('editPlanDetails').value.trim(),
        category: categoryValue, 
        price: parseFloat(document.getElementById('editPlanPrice').value) || 0,
        validity: document.getElementById('editPlanValidity').value.trim(),
        data: document.getElementById('editPlanData').value.trim(),
        badge: document.getElementById('editPlanBadge').value.trim(),
        status: document.getElementById('editPlanStatus').value.trim() || "Active",
        features: document.getElementById('editPlanFeatures').value.trim()
    };

    // Validate required fields
    if (!updatedPlan.name || !updatedPlan.category || isNaN(updatedPlan.price) || !updatedPlan.validity) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    fetch(`http://localhost:8085/api/mobicomm/plans/${planId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedPlan)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error("Failed to update plan: " + text);
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification("Plan updated successfully!", "success");
        closeModal('editPlanModal');
        loadPlans();
    })
    .catch(error => {
        console.error("Error updating plan:", error);
        showNotification("Error updating plan. Try again!", "error");
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

// Make modal functions globally accessible
window.openModal = openModal;
window.closeModal = closeModal;

function closeModalsOnClickOutside(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
}

function handleEscKey(event) {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="display: block"]');
        openModals.forEach(modal => closeModal(modal.id));
    }
}

// Toggle export dropdown
function toggleExportDropdown() {
    const dropdownMenu = document.getElementById('exportDropdownMenu');
    dropdownMenu.classList.toggle('show');
}

// Export to Excel
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(plans.map(plan => ({
        ID: plan.id,
        Name: plan.name,
        Details: plan.details,
        Category: plan.category,
        Price: plan.price,
        Validity: plan.validity,
        Data: plan.data,
        Features: plan.features,
        Status: plan.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plans");
    XLSX.writeFile(wb, "plans_report.xlsx");
    document.getElementById('exportDropdownMenu').classList.remove('show');
}

// Make export functions globally accessible
window.exportToExcel = exportToExcel;

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Mobicomm Plans Report", 14, 16);
    doc.setFontSize(10);
    const tableColumns = ["ID", "Name", "Details", "Category", "Price", "Validity", "Data", "Features", "Status"];
    const tableRows = plans.map(plan => [
        plan.id,
        plan.name,
        plan.details,
        plan.category,
        plan.price,
        plan.validity,
        plan.data,
        plan.features,
        plan.status
    ]);
    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 20
    });
    doc.save("plans_report.pdf");
    document.getElementById('exportDropdownMenu').classList.remove('show');
}

// Make PDF export globally accessible
window.exportToPDF = exportToPDF;

// Add functionality to sort the table
function sortTable(columnIndex) {
    const columns = ["name", "category", "price", "validity", "data", "features", "status"];
    const column = columns[columnIndex];
    
    // Toggle direction if sorting the same column again
    if (sortColumn === column) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
        sortColumn = column;
        sortDirection = "asc";
    }
    
    // Sort the filtered plans
    filteredPlans.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        // Handle numerical sorting for price
        if (column === "price") {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else if (typeof valA === "string" && typeof valB === "string") {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });
    
    // Reset to first page and update display
    currentPage = 1;
    renderPlans();
    updatePagination();
    updateResultsInfo();
    
    // Update sort icons
    const headers = document.querySelectorAll('th.sortable');
    headers.forEach((header, index) => {
        const icon = header.querySelector('i');
        if (index === columnIndex) {
            icon.className = sortDirection === "asc" ? "fa fa-sort-up" : "fa fa-sort-down";
        } else {
            icon.className = "fa fa-sort";
        }
    });}
