document.getElementById("plansNav").addEventListener("click", () => {
    event.preventDefault();
    window.location.href = "sub-managements.html";
});



document.getElementById("manageplansNav").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "plan-managements.html";
});

document.getElementById("profilenav").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "profile.html";
});

document.getElementById("settingnav").addEventListener("click", () => {
    event.preventDefault();
    window.location.href = "profile.html";
});








// Global variables for pagination and data management
let currentPage = 1;
let rowsPerPage = 10;
let subscribersData = [];
let filteredData = [];

// DOM elements cache for performance
const domElements = {
    profileDropdown: document.getElementById('profileDropdown'),
    plansTable: document.getElementById('plansTable'),
    pagination: document.getElementById('pagination'),
    searchInput: document.getElementById('searchInput'),
    rowsPerPageSelect: document.getElementById('rowsPerPage'),
    sortFilter: document.getElementById('sortFilter'),
    emptyState: document.getElementById('emptyState'),
    historyModal: document.getElementById('historyModal'),
    subscriberInfo: document.getElementById('subscriberInfo'),
    historyTable: document.getElementById('historyTable'),
    toast: document.getElementById('toast'),
    refreshIndicator: document.getElementById('refreshIndicator'),
    lastUpdatedTime: document.getElementById('lastUpdatedTime'),
    manualRefreshBtn: document.getElementById('manualRefreshBtn'),
    mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
    sidebar: document.querySelector('.sidebar-container'),
    summaryCards: document.querySelectorAll('.card')
};

// ==========================================
// Initialize the dashboard on page load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    setupEventListeners();
    updateLastRefreshedTime();
    
    // Set initial rows per page from dropdown
    rowsPerPage = parseInt(domElements.rowsPerPageSelect.value) || 10;
});

// ==========================================
// Data Initialization and Management
// ==========================================

function initializeData() {
    // Mock data generation for subscribers with expiring plans
    subscribersData = generateMockSubscribers(50);
    filteredData = [...subscribersData];
    
    // Initial rendering
    renderTable();
    updatePagination();
    
    // Set a periodic data refresh
    setInterval(simulateDataRefresh, 60000); // Refresh every minute
}

function generateMockSubscribers(count) {
    const plans = ['Basic Plan', 'Standard Plan', 'Premium Plan', 'Family Plan', 'Business Plan'];
    const names = ['John Smith', 'Maria Garcia', 'James Johnson', 'Patricia Williams', 'Robert Brown', 
                  'Linda Jones', 'Michael Miller', 'Elizabeth Davis', 'William Wilson', 'Barbara Martinez',
                  'David Anderson', 'Jennifer Taylor', 'Richard Thomas', 'Susan Moore', 'Joseph Jackson',
                  'Jessica White', 'Charles Harris', 'Sarah Martin', 'Daniel Thompson', 'Nancy Robinson'];
    
    const subscribers = [];
    
    for (let i = 0; i < count; i++) {
        // Generate a random date within the next 7 days
        const today = new Date();
        const randomDays = Math.floor(Math.random() * 7);
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + randomDays);
        
        // Only include if within 3 days (to match requirement for expiring plans)
        if (randomDays <= 3) {
            const subscriber = {
                id: `SUB${1000 + i}`,
                name: names[Math.floor(Math.random() * names.length)],
                mobile: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
                plan: plans[Math.floor(Math.random() * plans.length)],
                expiryDate: expiryDate,
                history: generateRechargeHistory(5)
            };
            subscribers.push(subscriber);
        }
    }
    
    // Sort by expiry date (default)
    return subscribers.sort((a, b) => a.expiryDate - b.expiryDate);
}

function generateRechargeHistory(count) {
    const plans = ['Basic Plan', 'Standard Plan', 'Premium Plan', 'Family Plan', 'Business Plan'];
    const paymentModes = ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Wallet'];
    const history = [];
    
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (i * 30)); // Each recharge roughly a month apart
        
        history.push({
            plan: plans[Math.floor(Math.random() * plans.length)],
            date: date,
            paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)]
        });
    }
    
    return history;
}

function simulateDataRefresh() {
    // Show refreshing state
    domElements.refreshIndicator.classList.add('refreshing');
    
    setTimeout(() => {
        // Update summary cards with slight variations
        updateSummaryCards();
        
        // Refresh expiring subscribers data
        const randomIndex = Math.floor(Math.random() * subscribersData.length);
        if (randomIndex < subscribersData.length) {
            // Simulate a plan extension for a random subscriber
            const subscriber = subscribersData[randomIndex];
            const newExpiryDate = new Date(subscriber.expiryDate);
            newExpiryDate.setDate(newExpiryDate.getDate() + 1);
            subscriber.expiryDate = newExpiryDate;
            
            // Update filtered data as well
            filteredData = applyFilters(subscribersData);
            
            // Re-render table with updated data
            renderTable();
            updatePagination();
        }
        
        // Update last refreshed time
        updateLastRefreshedTime();
        
        // Remove refreshing state
        domElements.refreshIndicator.classList.remove('refreshing');
        
        // Show toast notification
        showToast('Data refreshed successfully', 'success');
    }, 1000);
}

function updateSummaryCards() {
    // Generate random variations for summary metrics
    const totalSubscribers = parseInt(document.getElementById('totalSubscribers').textContent.replace(',', ''));
    const activePlans = parseInt(document.getElementById('activePlans').textContent.replace(',', ''));
    const expiringPlans = parseInt(document.getElementById('expiringPlans').textContent.replace(',', ''));
    
    // Small random variations
    const newTotal = totalSubscribers + Math.floor(Math.random() * 10) - 3;
    const newActive = activePlans + Math.floor(Math.random() * 8) - 2;
    const newExpiring = expiringPlans + Math.floor(Math.random() * 5) - 1;
    
    // Update DOM with animation
    updateCardWithAnimation('totalSubscribers', newTotal.toLocaleString());
    updateCardWithAnimation('activePlans', newActive.toLocaleString());
    updateCardWithAnimation('expiringPlans', newExpiring.toLocaleString());
}

function updateCardWithAnimation(id, value) {
    const element = document.getElementById(id);
    
    // Add pulse animation
    element.parentElement.parentElement.classList.add('pulse');
    
    // Update value
    element.textContent = value;
    
    // Remove animation class after animation completes
    setTimeout(() => {
        element.parentElement.parentElement.classList.remove('pulse');
    }, 1000);
}

function updateLastRefreshedTime() {
    const now = new Date();
    domElements.lastUpdatedTime.textContent = now.toLocaleTimeString();
}

// ==========================================
// Table Rendering and Pagination
// ==========================================

function renderTable() {
    const tbody = domElements.plansTable;
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    
    if (filteredData.length === 0) {
        domElements.emptyState.style.display = 'flex';
        domElements.pagination.style.display = 'none';
    } else {
        domElements.emptyState.style.display = 'none';
        domElements.pagination.style.display = 'flex';
        
        for (let i = startIndex; i < endIndex; i++) {
            const subscriber = filteredData[i];
            const tr = document.createElement('tr');
            
            // Add expiring-soon class if expiring in less than 2 days
            const daysUntilExpiry = Math.ceil((subscriber.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 1) {
                tr.classList.add('expiring-soon');
            }
            
            tr.innerHTML = `
                <td class="subscriber-name">${subscriber.name}</td>
                <td class="mobile-number">${subscriber.mobile}</td>
                <td class="plan-name">${subscriber.plan}</td>
                <td class="expiry-date">
                    ${formatDate(subscriber.expiryDate)}
                    ${daysUntilExpiry <= 1 ? '<span class="expiry-badge">Today</span>' : ''}
                </td>
                <td class="action-cell">
                    <button class="view-btn" data-subscriber-id="${subscriber.id}" aria-label="View history for ${subscriber.name}">
                        <i class="fas fa-history"></i> View History
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        }
    }
}

function updatePagination() {
    const paginationContainer = domElements.pagination;
    paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('pagination-btn');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.classList.add('page-number');
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', () => {
            currentPage = 1;
            renderTable();
            updatePagination();
        });
        paginationContainer.appendChild(firstPageBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.classList.add('ellipsis');
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-number');
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
            updatePagination();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.classList.add('ellipsis');
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.classList.add('page-number');
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', () => {
            currentPage = totalPages;
            renderTable();
            updatePagination();
        });
        paginationContainer.appendChild(lastPageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('pagination-btn');
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// ==========================================
// Filtering and Sorting
// ==========================================

function filterTable() {
    const searchTerm = domElements.searchInput.value.toLowerCase();
    filteredData = applyFilters(subscribersData, searchTerm);
    
    // Reset to first page when filtering
    currentPage = 1;
    renderTable();
    updatePagination();
}

function applyFilters(data, searchTerm = '') {
    // Filter by search term if provided
    let filtered = searchTerm 
        ? data.filter(subscriber => 
            subscriber.name.toLowerCase().includes(searchTerm) || 
            subscriber.mobile.toLowerCase().includes(searchTerm))
        : [...data];
    
    // Apply sort if selected
    const sortValue = domElements.sortFilter.value;
    if (sortValue === 'asc') {
        filtered.sort((a, b) => a.expiryDate - b.expiryDate);
    } else if (sortValue === 'desc') {
        filtered.sort((a, b) => b.expiryDate - a.expiryDate);
    }
    
    return filtered;
}

function sortTable() {
    filterTable(); // Reusing filter function as it includes sort logic
}

function updateRowsPerPage() {
    rowsPerPage = parseInt(domElements.rowsPerPageSelect.value);
    currentPage = 1; // Reset to first page
    renderTable();
    updatePagination();
}

// ==========================================
// Modal Management
// ==========================================

function openHistoryModal(subscriberId) {
    const subscriber = subscribersData.find(sub => sub.id === subscriberId);
    
    if (!subscriber) return;
    
    // Populate subscriber info
    domElements.subscriberInfo.innerHTML = `
        <p><strong>Name:</strong> ${subscriber.name}</p>
        <p><strong>Mobile Number:</strong> ${subscriber.mobile}</p>
        <p><strong>Current Plan:</strong> ${subscriber.plan}</p>
        <p><strong>Plan Expires on:</strong> ${formatDate(subscriber.expiryDate)}</p>
    `;
    
    // Populate history table
    domElements.historyTable.innerHTML = '';
    subscriber.history.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.plan}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.paymentMode}</td>
        `;
        domElements.historyTable.appendChild(tr);
    });
    
    // Show modal with animation
    domElements.historyModal.style.display = 'flex';
    // Use setTimeout to trigger the animation (browser needs time to recognize the display change)
    setTimeout(() => {
        domElements.historyModal.classList.add('showing');
    }, 10);
    
    // Store the current subscriber ID for export functions
    domElements.historyModal.dataset.currentSubscriber = subscriberId;
    
    // Set focus to close button for accessibility
    const closeBtn = domElements.historyModal.querySelector('.close-btn');
    closeBtn.focus();
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    domElements.historyModal.classList.remove('showing');
    
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        domElements.historyModal.style.display = 'none';
        
        // Restore background scrolling
        document.body.style.overflow = '';
        
        // Return focus to the button that opened the modal
        const button = document.querySelector(`button[data-subscriber-id="${domElements.historyModal.dataset.currentSubscriber}"]`);
        if (button) {
            button.focus();
        }
    }, 300);
}

// ==========================================
// Export Functionality
// ==========================================

function exportCSV() {
    const subscriberId = domElements.historyModal.dataset.currentSubscriber;
    const subscriber = subscribersData.find(sub => sub.id === subscriberId);
    
    if (!subscriber) return;
    
    // Create CSV content
    let csvContent = 'Plan Name,Recharge Date,Payment Mode\n';
    
    subscriber.history.forEach(record => {
        csvContent += `"${record.plan}","${formatDate(record.date)}","${record.paymentMode}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${subscriber.name}_recharge_history.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    
    // Show success toast
    showToast('CSV downloaded successfully', 'success');
}

function exportPDF() {
    const subscriberId = domElements.historyModal.dataset.currentSubscriber;
    const subscriber = subscribersData.find(sub => sub.id === subscriberId);
    
    if (!subscriber) return;
    
    // Using jsPDF with autoTable plugin
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(`Recharge History for ${subscriber.name}`, 14, 15);
    
    // Add subscriber info
    doc.setFontSize(10);
    doc.text(`Mobile: ${subscriber.mobile}`, 14, 25);
    doc.text(`Current Plan: ${subscriber.plan}`, 14, 30);
    doc.text(`Expiry Date: ${formatDate(subscriber.expiryDate)}`, 14, 35);
    
    // Format the data for autoTable
    const tableData = subscriber.history.map(record => [
        record.plan, 
        formatDate(record.date), 
        record.paymentMode
    ]);
    
    // Generate the table
    doc.autoTable({
        startY: 40,
        head: [['Plan Name', 'Recharge Date', 'Payment Mode']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [74, 108, 247],
            textColor: [255, 255, 255]
        }
    });
    
    // Save PDF
    doc.save(`${subscriber.name}_recharge_history.pdf`);
    
    // Show success toast
    showToast('PDF downloaded successfully', 'success');
}

// ==========================================
// UI & Navigation Functions
// ==========================================

function toggleDropdown() {
    const dropdown = domElements.profileDropdown;
    const isHidden = dropdown.getAttribute('aria-hidden') === 'true';
    
    dropdown.style.display = isHidden ? 'block' : 'none';
    dropdown.setAttribute('aria-hidden', !isHidden);
    
    // Update aria-expanded state
    document.querySelector('.profile-image').setAttribute('aria-expanded', isHidden);
}

function toggleSidebar() {
    domElements.sidebar.classList.toggle('active');
    
    // Add logo when sidebar is active on mobile
    const logoContainer = document.querySelector('.logo-container');
    if (domElements.sidebar.classList.contains('active')) {
        logoContainer.style.left = '0';
    } else {
        logoContainer.style.left = '-100%';
    }
}

function setActive(element) {
    // Remove active class from all navlinks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.setAttribute('aria-current', 'false');
    });
    
    // Add active class to clicked element
    element.classList.add('active');
    element.setAttribute('aria-current', 'page');
}

function showToast(message, type = 'info') {
    const toast = domElements.toast;
    toast.textContent = message;
    toast.className = 'toast'; // Reset classes
    
    // Add type-specific class
    toast.classList.add(type);
    
    // Show toast
    toast.style.display = 'block';
    setTimeout(() => {
        toast.classList.add('showing');
    }, 10);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('showing');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3000);
}

// ==========================================
// Helper Functions
// ==========================================

function formatDate(date) {
    // Format: DD MMM YYYY
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ==========================================
// Event Listeners Setup
// ==========================================

function setupEventListeners() {
    // Profile dropdown toggle
    document.querySelector('.profile-image').addEventListener('click', toggleDropdown);
    document.querySelector('.profile-image').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-container')) {
            domElements.profileDropdown.style.display = 'none';
            domElements.profileDropdown.setAttribute('aria-hidden', 'true');
            document.querySelector('.profile-image').setAttribute('aria-expanded', 'false');
        }
    });
    
    // Mobile menu toggle
    domElements.mobileMenuToggle.addEventListener('click', toggleSidebar);
    domElements.mobileMenuToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSidebar();
        }
    });
    
    // Manual refresh button
    domElements.manualRefreshBtn.addEventListener('click', simulateDataRefresh);
    
    // Modal close button and outside click
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    domElements.historyModal.addEventListener('click', (e) => {
        if (e.target === domElements.historyModal) {
            closeModal();
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && domElements.historyModal.classList.contains('showing')) {
            closeModal();
        }
    });
    
    // Set up delegated event listener for "View History" buttons
    domElements.plansTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn') || e.target.parentElement.classList.contains('view-btn')) {
            const button = e.target.classList.contains('view-btn') ? e.target : e.target.parentElement;
            const subscriberId = button.dataset.subscriberId;
            openHistoryModal(subscriberId);
        }
    });
    
    // Sidebar menu links - set active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => setActive(link));
    });
    
    // Navigation keyboard accessibility
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActive(link);
                link.click();
            }
        });
    });
}