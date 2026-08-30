// Local Application Mock Database State
let appState = {
    currentUser: null, // { name, email, role }
    reports: [
        {
            id: 1,
            category: "Road Hazard",
            location: "Tigbao-Caibaan Bypass Road, Tacloban",
            description: "Large pothole causing vehicular swerving during evening hours due to low lighting.",
            author: "maria.santos@gmail.com",
            status: "Pending",
            date: "2026-08-28"
        },
        {
            id: 2,
            category: "Public Transport Concern",
            location: "Avenida Veteranos corner Salazar St.",
            description: "Jeepney drivers refusing standard student discounts during peak morning hours.",
            author: "juan.delacruz@gmail.com",
            status: "Under Review",
            date: "2026-08-27"
        }
    ]
};

let leafletMap = null;

// Initialize App View & Mapping
document.addEventListener("DOMContentLoaded", () => {
    switchView('home');
    renderCommunityReports();
});

// View Navigation Router
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-nav'));

    if (viewName === 'home') {
        document.getElementById('view-home').style.display = 'block';
    } else if (viewName === 'community') {
        document.getElementById('view-community').style.display = 'block';
        initMap();
    } else if (viewName === 'submit') {
        if (!appState.currentUser) {
            alert("Please login first to submit a report.");
            openModal('loginModal');
            return;
        }
        document.getElementById('view-submit').style.display = 'block';
    } else if (viewName === 'dashboard') {
        if (!appState.currentUser) {
            switchView('home');
            return;
        }
        document.getElementById('view-dashboard').style.display = 'block';
        renderUserDashboard();
    } else if (viewName === 'admin') {
        if (!appState.currentUser || appState.currentUser.role !== 'admin') {
            alert("Access restricted to Administrators.");
            return;
        }
        document.getElementById('view-admin').style.display = 'block';
        renderAdminTable();
    }
}

// Modal Handlers
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// User Authentication Simulation
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    
    // Hardcoded Admin check or Regular User
    if (email === 'admin@saferide.ph') {
        appState.currentUser = { name: 'System Administrator', email: email, role: 'admin' };
    } else {
        appState.currentUser = { name: email.split('@')[0], email: email, role: 'user' };
    }

    closeModal('loginModal');
    updateNavbarAuth();
    switchView('dashboard');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;

    appState.currentUser = { name: name, email: email, role: 'user' };
    closeModal('registerModal');
    updateNavbarAuth();
    switchView('dashboard');
}

function logoutUser() {
    appState.currentUser = null;
    updateNavbarAuth();
    switchView('home');
}

function updateNavbarAuth() {
    const authArea = document.getElementById('navAuthArea');
    const userInfo = document.getElementById('navUserInfo');
    const userDashNav = document.getElementById('navUserDash');
    const adminDashNav = document.getElementById('navAdminDash');

    if (appState.currentUser) {
        authArea.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('loggedInUserName').textContent = appState.currentUser.name;
        userDashNav.style.display = 'block';
        
        if (appState.currentUser.role === 'admin') {
            adminDashNav.style.display = 'block';
        } else {
            adminDashNav.style.display = 'none';
        }
    } else {
        authArea.style.display = 'flex';
        userInfo.style.display = 'none';
        userDashNav.style.display = 'none';
        adminDashNav.style.display = 'none';
    }
}

// Reporting Logic
function handleReportSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('repCategory').value;
    const location = document.getElementById('repLocation').value;
    const description = document.getElementById('repDesc').value;

    const newReport = {
        id: appState.reports.length + 1,
        category,
        location,
        description,
        author: appState.currentUser.email,
        status: "Pending",
        date: new Date().toISOString().split('T')[0]
    };

    appState.reports.unshift(newReport);
    alert("Report submitted successfully to SafeRide-Tacloban network!");
    document.getElementById('reportForm').reset();
    switchView('community');
    renderCommunityReports();
}

// Render Community Reports Feed & Map Markers
function renderCommunityReports(filteredList = null) {
    const container = document.getElementById('communityReportsList');
    const listToRender = filteredList || appState.reports;

    if (listToRender.length === 0) {
        container.innerHTML = `<p>No reports found matching your criteria.</p>`;
        return;
    }

    container.innerHTML = listToRender.map(r => `
        <div class="report-card">
            <div class="report-meta">
                <span>📅 ${r.date}</span>
                <span class="badge badge-${r.status.toLowerCase().replace(' ', '')}">${r.status}</span>
            </div>
            <h4>${r.category}</h4>
            <p><strong>Location:</strong> ${r.location}</p>
            <p style="margin-top: 8px; font-size: 14px;">${r.description}</p>
        </div>
    `).join('');
}

function filterReports() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;

    const filtered = appState.reports.filter(r => {
        const matchesKeyword = r.location.toLowerCase().includes(keyword) || r.description.toLowerCase().includes(keyword);
        const matchesCat = cat === "" || r.category === cat;
        const matchesStatus = status === "" || r.status === status;
        return matchesKeyword && matchesCat && matchesStatus;
    });

    renderCommunityReports(filtered);
}

// Leaflet Map Initialization (Centered on Tacloban City)
function initMap() {
    if (leafletMap) {
        leafletMap.invalidateSize();
        return;
    }
    // Tacloban City Coordinates
    leafletMap = L.map('taclobanMap').setView([11.2434, 125.0046], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    // Sample pinned locations in Tacloban
    L.marker([11.2434, 125.0046]).addTo(leafletMap)
        .bindPopup("<b>Tacloban City Hall Area</b><br/>General Transit Hub.");
    L.marker([11.2500, 125.0100]).addTo(leafletMap)
        .bindPopup("<b>Avenida Veteranos</b><br/>Reported Public Transport Congestion.");
}

// User Dashboard View Rendering
function renderUserDashboard() {
    document.getElementById('profileName').textContent = appState.currentUser.name;
    document.getElementById('profileEmail').textContent = appState.currentUser.email;

    const userReports = appState.reports.filter(r => r.author === appState.currentUser.email);
    const container = document.getElementById('myReportsList');

    if (userReports.length === 0) {
        container.innerHTML = `<p>You haven't submitted any reports yet.</p>`;
        return;
    }

    container.innerHTML = userReports.map(r => `
        <div class="report-card" style="margin-bottom: 10px;">
            <div class="report-meta">
                <span>${r.date}</span>
                <span class="badge badge-${r.status.toLowerCase().replace(' ', '')}">${r.status}</span>
            </div>
            <strong>${r.category}</strong> - ${r.location}
            <p style="font-size: 13px; margin-top: 5px;">${r.description}</p>
            <button class="btn-sm" style="margin-top:8px;" onclick="deleteMyReport(${r.id})">Delete Report</button>
        </div>
    `).join('');
}

function deleteMyReport(id) {
    if (confirm("Are you sure you want to remove your report?")) {
        appState.reports = appState.reports.filter(r => r.id !== id);
        renderUserDashboard();
        renderCommunityReports();
    }
}

// Admin Portal View Rendering
function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    
    tbody.innerHTML = appState.reports.map(r => `
        <tr>
            <td>#${r.id}</td>
            <td>${r.category}</td>
            <td>${r.location}</td>
            <td>${r.author}</td>
            <td><span class="badge badge-${r.status.toLowerCase().replace(' ', '')}">${r.status}</span></td>
            <td>
                <select onchange="adminUpdateStatus(${r.id}, this.value)">
                    <option value="">Change Status...</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <button class="btn-sm" style="margin-left: 5px;" onclick="adminDeleteReport(${r.id})">Remove</button>
            </td>
        </tr>
    `).join('');
}

function adminUpdateStatus(id, newStatus) {
    if (!newStatus) return;
    const report = appState.reports.find(r => r.id === id);
    if (report) {
        report.status = newStatus;
        renderAdminTable();
        renderCommunityReports();
    }
}

function adminDeleteReport(id) {
    if (confirm("Admin action: Remove false or inappropriate report?")) {
        appState.reports = appState.reports.filter(r => r.id !== id);
        renderAdminTable();
        renderCommunityReports();
    }
}
