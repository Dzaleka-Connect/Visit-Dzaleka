// Shared documentation logic

const sidebarContent = `
<nav class="sidebar">
  <div class="sidebar-header">
    <a href="../index.html" class="logo">
      <div class="logo-icon">VD</div>
      <div>
        <div class="logo-text">Visit Dzaleka</div>
        <div class="logo-version">Documentation v1.0</div>
      </div>
    </a>
  </div>
  
  <div class="search-container">
    <input type="text" id="search-input" placeholder="Search documentation...">
  </div>
  <div id="search-results"></div>
  
  <div class="nav-section">
    <div class="nav-section-title">Getting Started</div>
    <a href="introduction.html" class="nav-item" data-page="introduction">Introduction</a>
    <a href="installation.html" class="nav-item" data-page="installation">Installation</a>
    <a href="quick-start.html" class="nav-item" data-page="quick-start">Quick Start</a>
  </div>
  
  <div class="nav-section">
    <div class="nav-section-title">User Guide</div>
    <a href="dashboard.html" class="nav-item" data-page="dashboard">Dashboard</a>
    <a href="bookings.html" class="nav-item" data-page="bookings">Managing Bookings</a>
    <a href="guides.html" class="nav-item" data-page="guides">Guide Management</a>
    <a href="zones.html" class="nav-item" data-page="zones">Zones & Points of Interest</a>
    <a href="security.html" class="nav-item" data-page="security">Security Module</a>
    <a href="users.html" class="nav-item" data-page="users">User Management</a>
    <a href="settings.html" class="nav-item" data-page="settings">Settings</a>
    <a href="email.html" class="nav-item" data-page="email">Email System</a>
    <a href="reports.html" class="nav-item" data-page="reports">Reports & Analytics</a>
  </div>
  
  <div class="nav-section">
    <div class="nav-section-title">Developer Guide</div>
    <a href="architecture.html" class="nav-item" data-page="architecture">Architecture Overview</a>
    <a href="api-reference.html" class="nav-item" data-page="api-reference">API Reference</a>
    <a href="database.html" class="nav-item" data-page="database">Database Schema</a>
    <a href="components.html" class="nav-item" data-page="components">UI Components</a>
    <a href="contributing.html" class="nav-item" data-page="contributing">Contributing</a>
  </div>
  
  <div class="nav-section">
    <div class="nav-section-title">Reference</div>
    <a href="cli.html" class="nav-item" data-page="cli">CLI Commands</a>
    <a href="environment.html" class="nav-item" data-page="environment">Environment Variables</a>
    <a href="troubleshooting.html" class="nav-item" data-page="troubleshooting">Troubleshooting</a>
    <a href="changelog.html" class="nav-item" data-page="changelog">Changelog</a>
  </div>
</nav>
`;

// Search index
const searchIndex = [
    { title: "Introduction", section: "Getting Started", url: "introduction.html", keywords: "overview welcome about dzaleka refugee camp" },
    { title: "Installation", section: "Getting Started", url: "installation.html", keywords: "setup install npm node postgres database" },
    { title: "Quick Start", section: "Getting Started", url: "quick-start.html", keywords: "quick start guide tutorial" },
    { title: "Authentication", section: "User Guide", url: "authentication.html", keywords: "login logout password email register account roles" },
    { title: "Dashboard", section: "User Guide", url: "dashboard.html", keywords: "dashboard stats analytics charts overview" },
    { title: "Managing Bookings", section: "User Guide", url: "bookings.html", keywords: "booking reservation tour schedule visitors" },
    { title: "Guide Management", section: "User Guide", url: "guides.html", keywords: "guide tour leader availability earnings performance" },
    { title: "Zones & POI", section: "User Guide", url: "zones.html", keywords: "zones areas points interest locations map" },
    { title: "Security Module", section: "User Guide", url: "security.html", keywords: "security checkin checkout incidents visitor verification" },
    { title: "User Management", section: "User Guide", url: "users.html", keywords: "users admin roles permissions accounts" },
    { title: "Settings", section: "User Guide", url: "settings.html", keywords: "settings configuration preferences" },
    { title: "Email System", section: "User Guide", url: "email.html", keywords: "email templates notifications reminders" },
    { title: "Reports & Analytics", section: "User Guide", url: "reports.html", keywords: "reports analytics revenue earnings statistics" },
    { title: "Architecture", section: "Developer Guide", url: "architecture.html", keywords: "architecture stack react express typescript" },
    { title: "API Reference", section: "Developer Guide", url: "api-reference.html", keywords: "api endpoints rest http" },
    { title: "Database Schema", section: "Developer Guide", url: "database.html", keywords: "database schema postgres drizzle tables" },
    { title: "UI Components", section: "Developer Guide", url: "components.html", keywords: "components ui shadcn radix" },
    { title: "Contributing", section: "Developer Guide", url: "contributing.html", keywords: "contribute github pull request open source" },
    { title: "CLI Commands", section: "Reference", url: "cli.html", keywords: "cli commands npm script terminal" },
    { title: "Environment Variables", section: "Reference", url: "environment.html", keywords: "environment variables env configuration" },
    { title: "Troubleshooting", section: "Reference", url: "troubleshooting.html", keywords: "troubleshoot errors problems issues help" },
    { title: "Changelog", section: "Reference", url: "changelog.html", keywords: "changelog updates versions history" },
];

document.addEventListener('DOMContentLoaded', () => {
    // Inject sidebar
    const layout = document.createElement('div');
    layout.className = 'layout';
    layout.innerHTML = sidebarContent;

    // Move main content inside layout
    const mainContent = document.querySelector('.doc-content');
    if (mainContent) {
        mainContent.classList.add('main-content');
        document.body.appendChild(layout);
        layout.appendChild(mainContent);
    }

    // Initialize search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            const results = searchIndex.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.keywords.includes(query)
            );

            searchResults.innerHTML = results.map(item => `
        <a href="${item.url}" class="search-result-item">
          <div class="section">${item.section}</div>
          ${item.title}
        </a>
      `).join('');
        });
    }

    // Set active nav item
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '');

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });
});
