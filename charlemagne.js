const API_BASE = 'http://localhost:5000/api';

async function fetchCommunityReports() {
    try {
        const response = await fetch(`${API_BASE}/reports`);
        const reports = await response.json();
        appState.reports = reports;
        renderCommunityReports();
    } catch (error) {
        console.error('Failed to load reports from database:', error);
    }
}
