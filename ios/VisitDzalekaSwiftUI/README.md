# Visit Dzaleka iOS SwiftUI App

Standalone SwiftUI app scaffold for Visit Dzaleka.

This folder is separate from the existing web app and is designed so the iOS app can grow independently while still matching the Visit Dzaleka product surface.

## What Is Included

- SwiftUI app entry point and tab navigation
- Explore/home screen with tour highlights and visitor guidance
- Booking request flow
- My trips dashboard with status and payment guidance
- Guide dashboard with assignments, readiness, training, and payout status
- Support center with ticket creation
- Map/zones and points of interest screen
- Real URLSession API client using the existing Visit Dzaleka web app routes
- Checked-in `VisitDzaleka.xcodeproj`
- XcodeGen `project.yml` for regenerating the project if you prefer generated projects

## Open In Xcode

```sh
cd ios/VisitDzalekaSwiftUI
open VisitDzaleka.xcodeproj
```

The included Xcode project builds a standalone iOS app target named `VisitDzaleka`.

## Optional XcodeGen Regeneration

Install XcodeGen if you do not have it:

```sh
brew install xcodegen
```

Then run:

```sh
cd ios/VisitDzalekaSwiftUI
xcodegen generate
```

## App URLs

- Public app: `https://visit.dzaleka.com`
- External services directory only: `https://services.dzaleka.com`

The app uses `URLSessionVisitDzalekaAPI` and the same session-based auth routes as the web app.

## Suggested Next Steps

1. Add real authentication and secure token storage.
2. Add certificate and itinerary views that call the existing backend routes.
3. Add push notifications for booking status, guide assignment, support replies, and training reminders.
4. Add saved itinerary access for confirmed visitors and guides.
5. Add XCTest coverage for the booking form, trip status display, and guide workflow.
