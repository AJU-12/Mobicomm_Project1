// DOM Elements
const searchInput = document.getElementById('searchInput');
const planFilter = document.getElementById('planFilter');
const statusFilter = document.getElementById('statusFilter');
const selectAllCheckbox = document.getElementById('selectAll');
const subscribersTable = document.getElementById('subscribersTable');
const blockedUsersTable = document.getElementById('blockedUsersTable');
const blockedUsersContainer = document.getElementById('blockedUsersContainer');
const historyModal = document.getElementById('historyModal');
const notificationIcon = document.getElementById('notificationIcon');
const notificationPopup = document.getElementById('notificationPopup');
const notificationOverlay = document.getElementById('notificationOverlay');
const notificationBadge = document.getElementById('notificationBadge');
const toast = document.getElementById('toast');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const closeNotificationBtn = document.querySelector('.notification-popup .close-btn');

// Store original table data for filtering
let subscribers = [];
let blockedUsers = [];

// Base URL for backend API
const BASE_URL = 'http://localhost:8080/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch dynamic data on page load
    fetchSubscribers();
    fetchBlockedUsers();
    fetchPlans();
    fetchUserStats();
    setupEventListeners();
});

// Fetch Subscribers
function fetchSubscribers() {
    fetch(`${BASE_URL}/subscribers`)
        .then(response => response.json())
        .then(data => {
            subscribers = data.map(subscriber => {
                const row = createSubscriberRow(subscriber);
                subscribersTable.appendChild(row);
                return {
                    ...subscriber,
                    element: row,
                    checkbox: row.querySelector('input[type="checkbox"]')
                };
            });
            updateActiveSubscriberCount();
        })
        .catch(error => {
            console.error('Error fetching subscribers:', error);
            showToast('Failed to load subscribers');
        });
}

// Create Subscriber Row
function createSubscriberRow(subscriber) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input class="select-user" onclick="enableStatusFilter()" type="checkbox"></td>
        <td>${subscriber.name}</td>
        <td>${subscriber.mobileNumber}</td>
        <td><span class="plan-badge ${getPlanBadgeClass(subscriber.plan)}">${subscriber.plan}</span></td>
        <td>${subscriber.lastRechargeDate || 'N/A'}</td>
        <td>${subscriber.expiryDate || 'N/A'}</td>
        <td><span class="status-badge ${getStatusBadgeClass(subscriber.status)}">${subscriber.status}</span></td>
        <td>
            <div class="action-buttons">
                <button class="view-history-btn" onclick='openModal("${subscriber.mobileNumber}")'><i class="fas fa-history"></i> History</button>
                <button class="edit-btn" onclick='editSubscriber("${subscriber.mobileNumber}")'><i class="fas fa-edit"></i></button>
            </div>
        </td>
    `;
    return row;
}

// Fetch Blocked Users
function fetchBlockedUsers() {
    fetch(`${BASE_URL}/subscribers/blocked`)
        .then(response => response.json())
        .then(data => {
            blockedUsers = data.map(blockedUser => {
                const row = createBlockedUserRow(blockedUser);
                blockedUsersTable.appendChild(row);
                return {
                    ...blockedUser,
                    element: row
                };
            });
            updateBlockedUserCount();
        })
        .catch(error => {
            console.error('Error fetching blocked users:', error);
            showToast('Failed to load blocked users');
        });
}

// Create Blocked User Row
function createBlockedUserRow(blockedUser) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${blockedUser.name}</td>
        <td>${blockedUser.mobileNumber}</td>
        <td><span class="plan-badge ${getPlanBadgeClass(blockedUser.plan)}">${blockedUser.plan}</span></td>
        <td>${blockedUser.lastRechargeDate || 'N/A'}</td>
        <td>${blockedUser.blockDate || 'N/A'}</td>
        <td>${blockedUser.blockReason || 'Administrative Action'}</td>
        <td><button class="unblock-btn" onclick='unblockUser("${blockedUser.mobileNumber}")'><i class="fas fa-unlock"></i> Unblock</button></td>
    `;
    return row;
}

// Fetch Plans for Filter Dropdown
function fetchPlans() {
    fetch(`${BASE_URL}/plans`)
        .then(response => response.json())
        .then(plans => {
            plans.forEach(plan => {
                const option = document.createElement('option');
                option.value = plan.name;
                option.textContent = plan.name;
                planFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching plans:', error);
        });
}

// Fetch User Stats
function fetchUserStats() {
    fetch(`${BASE_URL}/subscribers/stats`)
        .then(response => response.json())
        .then(stats => {
            document.querySelector('.active-icon + .stat-info .stat-number').textContent = stats.activeSubscribers;
            document.querySelector('.inactive-icon + .stat-info .stat-number').textContent = stats.inactiveSubscribers;
            document.querySelector('.blocked-icon + .stat-info .stat-number').textContent = stats.blockedUsers;
            document.querySelector('.renewal-icon + .stat-info .stat-number').textContent = stats.pendingRenewals;
        })
        .catch(error => {
            console.error('Error fetching user stats:', error);
        });
}

// Helper Functions for Badge Classes
function getPlanBadgeClass(plan) {
    switch(plan) {
        case 'Premium': return 'premium';
        case 'Basic': return 'basic';
        case 'Standard': return 'standard';
        default: return 'default';
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Active': return 'active';
        case 'Inactive': return 'inactive';
        case 'Blocked': return 'blocked';
        default: return 'default';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', filterSubscribers);
    planFilter.addEventListener('change', filterSubscribers);
    notificationIcon.addEventListener('click', toggleNotifications);
    notificationOverlay.addEventListener('click', closeNotifications);
    closeNotificationBtn.addEventListener('click', closeNotifications);
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    // Profile Dropdown Functionality
    document.addEventListener('click', function(event) {
        const profileContainer = document.getElementById('profileContainer');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!profileContainer.contains(event.target)) {
            profileDropdown.style.display = 'none';
        }
    });
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    document.body.classList.toggle('menu-open');
    
    const sidebar = document.querySelector('.sidebar-container');
    const logo = document.querySelector('.logo-container');
    const profile = document.querySelector('.profile-container');
    
    if (document.body.classList.contains('menu-open')) {
        sidebar.style.left = 'var(--sidebar-offset)';
        logo.style.left = 'var(--sidebar-offset)';
        profile.style.left = 'var(--sidebar-offset)';
    } else {
        sidebar.style.left = '-300px';
        logo.style.left = '-300px';
        profile.style.left = '-300px';
    }
}

// Toggle profile dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Set active navigation
function setActive(element) {
    const navLinks = document.querySelectorAll('.nav-link, .profile-dropdown a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// Toggle select all checkboxes
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.select-user');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    enableStatusFilter();
}

// Enable status filter dropdown when at least one checkbox is selected
function enableStatusFilter() {
    const checkboxes = document.querySelectorAll('.select-user:checked');
    statusFilter.disabled = checkboxes.length === 0;
}

// Filter subscribers based on search input and plan filter
function filterSubscribers() {
    const searchTerm = searchInput.value.toLowerCase();
    const planValue = planFilter.value.toLowerCase();
    
    subscribers.forEach(subscriber => {
        const nameMatch = subscriber.name.toLowerCase().includes(searchTerm);
        const mobileMatch = subscriber.mobileNumber.includes(searchTerm);
        const planMatch = planValue === '' || subscriber.plan.toLowerCase().includes(planValue);
        
        if ((nameMatch || mobileMatch) && planMatch) {
            subscriber.element.style.display = '';
        } else {
            subscriber.element.style.display = 'none';
        }
    });
}

// Bulk update status for selected subscribers
function bulkUpdateStatus() {
    const selectedStatus = statusFilter.value;
    if (!selectedStatus) return;
    
    const checkboxes = document.querySelectorAll('.select-user:checked');
    const selectedSubscribers = [];
    
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const mobileNumber = row.cells[2].textContent;
        selectedSubscribers.push(mobileNumber);
    });
    
    // API Call to update status
    fetch(`${BASE_URL}/subscribers/bulk-update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mobileNumbers: selectedSubscribers,
            status: selectedStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const statusCell = row.cells[6];
            const statusBadge = statusCell.querySelector('.status-badge');
            
            // If user is being blocked, move to blocked users table
            if (selectedStatus === 'blocked') {
                blockSubscriber(row);
            } else {
                // Update status badge
                statusBadge.textContent = selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
                statusBadge.className = `status-badge ${getStatusBadgeClass(selectedStatus)}`;
            }
        });
        
        // Reset status filter
        statusFilter.value = '';
        statusFilter.disabled = true;
        selectAllCheckbox.checked = false;
        
        // Show toast notification
        showToast(`${checkboxes.length} subscribers updated to ${selectedStatus} status`);
        
        // Refresh user stats
        fetchUserStats();
    })
    .catch(error => {
        console.error('Error updating subscribers:', error);
        showToast('Failed to update subscribers');
    });
}

// Block subscriber and move to blocked users table
function blockSubscriber(row) {
    const cells = row.cells;
    const mobileNumber = cells[2].textContent;
    
    fetch(`${BASE_URL}/subscribers/block/${mobileNumber}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(blockedUser => {
        // Create new row for blocked users table
        const newRow = createBlockedUserRow(blockedUser);
        blockedUsersTable.appendChild(newRow);
        
        // Remove from subscribers table
        row.remove();
        
        // Update arrays
        const subscriberIndex = subscribers.findIndex(s => s.mobileNumber === mobileNumber);
        if (subscriberIndex !== -1) {
            subscribers.splice(subscriberIndex, 1);
        }
        
        blockedUsers.push({
            ...blockedUser,
            element: newRow
        });
        
        // Update UI
        updateActiveSubscriberCount();
        updateBlockedUserCount();
        
        // Show toast notification
        showToast(`${blockedUser.name} has been blocked`);
    })
    .catch(error => {
        console.error('Error blocking subscriber:', error);
        showToast('Failed to block subscriber');
    });
}

// Toggle blocked users table
function toggleBlockedUsersTable() {
    blockedUsersContainer.style.display = 
        blockedUsersContainer.style.display === 'none' ? 'block' : 'none';
}

// Unblock user and move back to subscribers table
function unblockUser(mobileNumber) {
    fetch(`${BASE_URL}/subscribers/unblock/${mobileNumber}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(unblockedUser => {
        // Create new row for subscribers table
        const newRow = createSubscriberRow(unblockedUser);
        subscribersTable.appendChild(newRow);
        
        // Find and remove from blocked users table
        const blockedUserRow = Array.from(blockedUsersTable.querySelectorAll('tr'))
            .find(row => row.cells[1].textContent === mobileNumber);
        
        if (blockedUserRow) {
            blockedUserRow.remove();
        }
        
        // Update arrays
        const blockedIndex = blockedUsers.findIndex(u => u.mobileNumber === mobileNumber);
        if (blockedIndex !== -1) {
            blockedUsers.splice(blockedIndex, 1);
        }
        
        subscribers.push({
            ...unblockedUser,
            element: newRow,
            checkbox: newRow.querySelector('input[type="checkbox"]')
        });
        
        // Update UI
        updateActiveSubscriberCount();
        updateBlockedUserCount();
        
        // Show toast notification
        showToast(`${unblockedUser.name} has been unblocked successfully`);
    })
    .catch(error => {
        console.error('Error unblocking user:', error);
        showToast('Failed to unblock user');
    });
}

// Update active subscriber count
function updateActiveSubscriberCount() {
    const activeSubscribersCount = subscribers.filter(s => s.status === 'Active').length;
    document.querySelector('.active-icon + .stat-info .stat-number').textContent = activeSubscribersCount;
}

// Update blocked users count
function updateBlockedUserCount() {
    const blockedUsersCount = blockedUsers.length;
    document.querySelector('.blocked-icon + .stat-info .stat-number').textContent = blockedUsersCount;
}

// Open modal with user history
function openModal(mobileNumber) {
    // Fetch user history
    fetch(`${BASE_URL}/subscribers/history/${mobileNumber}`)
        .then(response => response.json())
        .then(userData => {
            // Find user
            const user = subscribers.find(s => s.mobileNumber === mobileNumber) || 
                         blockedUsers.find(u => u.mobileNumber === mobileNumber);
            
            if (user) {
                // Update user info in modal
                const userInfoStrip = historyModal.querySelector('.user-info-strip');
                userInfoStrip.querySelector('.user-detail:nth-child(1) .value').textContent = 
                    `${user.name} (${user.mobileNumber})`;
                
                const planBadge = userInfoStrip.querySelector('.plan-badge');
                planBadge.textContent = user.plan;
                planBadge.className = `plan-badge ${getPlanBadgeClass(user.plan)} value`;
                
                const statusBadge = userInfoStrip.querySelector('.status-badge');
                statusBadge.textContent = user.status || 'Blocked';
                statusBadge.className = `${getStatusBadgeClass(user.status || 'Blocked')} status-badge value`;
                
                // Populate history table
                const historyTable = document.getElementById('historyTable');
                historyTable.innerHTML = ''; // Clear previous history
                
                userData.forEach(history => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${history.planName}</td>
                        <td>${history.rechargeDate}</td>
                        <td>₹${history.amount}</td>
                        <td>${history.paymentMode}</td>
                        <td><span class="status-badge ${getStatusBadgeClass(history.status)}">${history.status}</span></td>
                    `;
                    historyTable.appendChild(row);
                });
            }
            
            // Show modal
            historyModal.style.display = 'block';
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error fetching user history:', error);
            showToast('Failed to load user history');
        });
}

// Close modal
function closeModal() {
    historyModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Edit subscriber
function editSubscriber(mobileNumber) {
    // Navigate to edit page or open edit modal
    window.location.href = `/edit-subscriber?mobile=${mobileNumber}`;
}

// Toggle notifications
function toggleNotifications() {
    if (notificationPopup.style.display === 'block') {
        closeNotifications();
    } else {
        // Fetch notifications
        fetch(`${BASE_URL}/notifications`)
            .then(response => response.json())
            .then(notifications => {
                const notificationList = document.getElementById('notificationList');
                notificationList.innerHTML = ''; // Clear previous notifications
                
                notifications.forEach(notification => {
                    const notificationItem = document.createElement('div');
                    notificationItem.classList.add('notification-item');
                    if (notification.unread) {
                        notificationItem.classList.add('unread');
                    }
                    notificationItem.innerHTML = `
                        <div class="notification-icon">
                            <i class="${notification.icon}"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                            <span class="notification-time">${notification.time}</span>
                        </div>
                    `;
                    notificationList.appendChild(notificationItem);
                });
                
                notificationPopup.style.display = 'block';
                notificationOverlay.style.display = 'block';
                
                // Mark notifications as read
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => {
                    item.classList.remove('unread');
                });
                
                // Clear notification badge
                notificationBadge.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching notifications:', error);
                showToast('Failed to load notifications');
            });
    }
}

// Close notifications
function closeNotifications() {
    notificationPopup.style.display = 'none';
    notificationOverlay.style.display = 'none';
}

// Show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Export history as CSV
function exportCSV() {
    const mobileNumber = document.querySelector('.user-info-strip .user-detail:nth-child(1) .value')
        .textContent.match(/\(([^)]+)\)/)[1];
    
    fetch(`${BASE_URL}/subscribers/export-csv/${mobileNumber}`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Recharge_History_${mobileNumber}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast('CSV export completed');
        })
        .catch(error => {
            console.error('Error exporting CSV:', error);
            showToast('Failed to export CSV');
        });
}

// Export history as PDF
function exportPDF() {
    const mobileNumber = document.querySelector('.user-info-strip .user-detail:nth-child(1) .value')
        .textContent.match(/\(([^)]+)\)/)[1];
    
    fetch(`${BASE_URL}/subscribers/export-pdf/${mobileNumber}`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Recharge_History_${mobileNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast('PDF export completed');
        })
        .catch(error => {
            console.error('Error exporting PDF:', error);
            showToast('Failed to export PDF');
        });
}

// Pagination functionality
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumbers = document.querySelectorAll('.page-number');

// Add event listeners to pagination
pageNumbers.forEach((pageNum, index) => {
    pageNum.addEventListener('click', () => {
        pageNumbers.forEach(p => p.classList.remove('active'));
        pageNum.classList.add('active');
        
        prevPageBtn.disabled = index === 0;
        nextPageBtn.disabled = index === pageNumbers.length - 1;
        
        // Fetch page data
        fetchPageData(index + 1);
    });
});

// Fetch page data
function fetchPageData(pageNumber) {
    fetch(`${BASE_URL}/subscribers?page=${pageNumber}`)
        .then(response => response.json())
        .then(data => {
            // Clear existing table
            subscribersTable.innerHTML = '';
            
            // Populate with new data
            data.forEach(subscriber => {
                const row = createSubscriberRow(subscriber);
                subscribersTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching page data:', error);
            showToast('Failed to load page data');
        });
}

// Next page navigation
nextPageBtn.addEventListener('click', () => {
    const activePage = document.querySelector('.page-number.active');
    const nextPage = activePage.nextElementSibling;
    if (nextPage && nextPage.classList.contains('page-number')) {
        activePage.classList.remove('active');
        nextPage.classList.add('active');
        
        prevPageBtn.disabled = false;
        nextPageBtn.disabled = nextPage.nextElementSibling === null || 
                              !nextPage.nextElementSibling.classList.contains('page-number');
        
        fetchPageData(Array.from(pageNumbers).indexOf(nextPage) + 1);
    }
});

// Previous page navigation
prevPageBtn.addEventListener('click', () => {
    const activePage = document.querySelector('.page-number.active');
    const prevPage = activePage.previousElementSibling;
    if (prevPage && prevPage.classList.contains('page-number')) {
        activePage.classList.remove('active');
        prevPage.classList.add('active');
        
        nextPageBtn.disabled = false;
        prevPageBtn.disabled = prevPage.previousElementSibling === null || 
                              !prevPage.previousElementSibling.classList.contains('page-number');
        
        fetchPageData(Array.from(pageNumbers).indexOf(prevPage) + 1);
    }
});