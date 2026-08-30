// Mock Server Database (Can sync via localStorage if deployed on the same browser domain)
let serverState = {
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

// Initialize Server View on Load
document.addEventListener("DOMContentLoaded", () => {
    loadServerData();
    renderServerDashboard();
});

// Toast Notifications System
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// Load data (supports shared localStorage syncing if hosted locally)
function loadServerData() {
    const savedReports = localStorage.getItem('saferide_shared_reports');
    if (savedReports) {
        serverState.reports = JSON.parse(savedReports);
    }
}

function saveServerData() {
    localStorage.setItem('saferide_shared_reports', JSON.stringify(serverState.reports));
}

// Render Dashboard Metrics and Table Rows
function renderServerDashboard() {
    const tbody = document.getElementById('serverTableBody');
    const reports = serverState.reports;

    // Update Metrics
    document.getElementById('totalCount').textContent = reports.length;
    document.getElementById('pendingCount').textContent = reports.filter(r => r.status === 'Pending').length;
    document.getElementById('resolvedCount').textContent = reports.filter(r => r.status === 'Resolved').length;

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b;">No incoming reports found on server.</td></tr>`;
        return;
    }

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td>#${r.id}</td>
            <td><strong>${r.category}</strong></td>
            <td>${r.location}</td>
            <td>${r.author}</td>
            <td>${r.date}</td>
            <td><span class="badge badge-${r.status.toLowerCase().replace(' ', '')}">${r.status}</span></td>
            <td>
                <select onchange="serverUpdateStatus(${r.id}, this.value)">
                    <option value="">Update Status...</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Resolved">Resolved</option>
                </select>
                <button class="btn-sm" style="margin-left: 5px;" onclick="serverDeleteReport(${r.id})">Purge</button>
            </td>
        </tr>
    `).join('');
}

// Action Handlers
function serverUpdateStatus(id, newStatus) {
    if (!newStatus) return;
    const report = serverState.reports.find(r => r.id === id);
    if (report) {
        report.status = newStatus;
        saveServerData();
        renderServerDashboard();
        showToast(`Report #${id} status updated to ${newStatus}`);
    }
}

function serverDeleteReport(id) {
    if (confirm(`Are you sure you want to purge report #${id} from the developer database?`)) {
        serverState.reports = serverState.reports.filter(r => r.id !== id);
        saveServerData();
        renderServerDashboard();
        showToast(`Report #${id} purged successfully.`);
    }
}

function syncReports() {
    loadServerData();
    renderServerDashboard();
    showToast("Server data synchronized successfully!");
}
