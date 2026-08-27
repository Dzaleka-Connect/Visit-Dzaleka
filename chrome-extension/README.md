# Visit Dzaleka — Chrome Extension

A Chrome extension for quick toolbar access to the [Visit Dzaleka](https://visit.dzaleka.com) platform.

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Booking stats, next-booking countdown, quick-action buttons, and role-specific status cards |
| **Role-Aware Hub** | Visitor, guide, staff, and security shortcuts adapt to the signed-in role |
| **Workflow Snapshot** | Current visit/work queue, payment status, failed-email counts, pending counts, and next useful action |
| **Guide Workflow Panel** | Next assignment, check-in, no-show, availability, training readiness, and payout status |
| **Explore** | Camp zones and points of interest with full descriptions |
| **Blog** | Latest posts with thumbnails and excerpts |
| **Alerts** | Real-time notifications with unread badge, type filters, single-read actions, snooze, role visibility, and deep links |
| **Search** | Instant search across bookings, help articles, staff manuals, zones, POIs, and blog posts |
| **Dark Mode** | Light/dark toggle, preference saved between sessions |
| **Booking Verifier** | Check booking status by reference from signed-in or signed-out states |
| **Keyboard Shortcut** | `Cmd+Shift+D` (Mac) / `Ctrl+Shift+D` (Windows) |

## Installation

### From Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/realbakari/DzalekaVisit.git
   cd DzalekaVisit/chrome-extension
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `chrome-extension/` folder
6. The extension icon appears in your toolbar

### From Chrome Web Store

> Coming soon — see [STORE_LISTING.md](STORE_LISTING.md) for listing details.

## Project Structure

```
chrome-extension/
├── manifest.json      # Extension config (Manifest V3)
├── popup.html         # 4-tab popup UI
├── popup.css          # Styles (light + dark themes)
├── popup.js           # All popup logic (API, search, countdown, dark mode)
├── background.js      # Service worker (notification polling every 5 min)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── STORE_LISTING.md   # Chrome Web Store listing content
```

## How It Works

- **Authentication**: Uses the browser's existing session cookies for `visit.dzaleka.com`. You must be logged in to the website in the same browser for Dashboard and Alerts to work. Blog, Explore, and Booking Verifier work without login.
- **Role-Aware Shortcuts**: Dashboard actions change for visitors, guides, staff, and security so the toolbar mirrors the main app workflows.
- **Background Polling**: A service worker checks for new notifications every 5 minutes, filters out internal notifications for non-staff roles, and opens the related app screen when a desktop alert is clicked.
- **Dark Mode**: Toggles a `.dark` class on `<body>` which overrides all CSS variables. Preference is saved via `chrome.storage.local`.
- **Search**: Searches in-memory data (bookings, help articles, staff manuals, zones, POIs, blog posts) with a 200ms debounce. App records open in a new tab; zone/POI results switch to the Explore tab.

## API Endpoints Used

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/auth/user` | ✅ | Check login status |
| `GET /api/bookings/my-bookings` | ✅ | Dashboard stats + countdown |
| `GET /api/notifications` | ✅ | Alerts tab |
| `PATCH /api/notifications/:id/read` | ✅ | Mark one notification read |
| `PATCH /api/notifications/mark-all-read` | ✅ | Mark all read button |
| `GET /api/help/articles` | ✅ | Help article search |
| `GET /api/blog` | ❌ | Blog tab |
| `GET /api/public/zones` | ❌ | Explore tab (zones) |
| `GET /api/public/points-of-interest` | ❌ | Explore tab (POIs) |
| `GET /api/bookings/verify/:ref` | ❌ | Booking verifier |
| `GET /api/bookings/my-tours` | ✅ | Guide dashboard hub |
| `GET /api/bookings/recent` | ✅ | Staff operations hub |
| `GET /api/training/stats` | ✅ | Guide training status card |
| `GET /api/guides/me/earnings` | ✅ | Guide payout status card |
| `POST /api/bookings/:id/guide-check-in` | ✅ | Guide workflow check-in |
| `POST /api/bookings/:id/guide-no-show` | ✅ | Guide workflow no-show |
| `GET /api/stats` | ✅ | Admin/coordinator status cards |
| `GET /api/email-logs?status=failed` | ✅ | Failed-email status card |

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Dark mode preference |
| `notifications` | Desktop alerts for new notifications |
| `alarms` | Background polling interval |
| `host_permissions` | API access to `visit.dzaleka.com` |

## Design

Matches the main application's design system:
- **Accent**: Sky-600 (`#0284C7`)
- **Font**: Manrope
- **Theme**: Light by default, dark mode available
- **Animations**: Minimal — `transition: background-color 0.15s` only

Defined in the project's [design_guidelines.md](../design_guidelines.md).

## Development

To make changes:

1. Edit files in `chrome-extension/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Visit Dzaleka card
4. Click the extension icon to test

No build step is required — all files are plain HTML, CSS, and JavaScript.

## License

Part of the Visit Dzaleka project. See the [root LICENSE](../LICENSE) for details.
