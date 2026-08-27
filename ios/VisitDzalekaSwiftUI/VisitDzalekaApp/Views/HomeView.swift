import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @StateObject private var notificationPrompt = NotificationPermissionPromptModel()

    private var nextBooking: Booking? {
        appModel.content.bookings
            .filter { $0.status != .completed && $0.status != .cancelled && $0.status != .noShow }
            .sorted { "\($0.visitDate) \($0.visitTime)" < "\($1.visitDate) \($1.visitTime)" }
            .first
    }

    private var notificationPromptCopy: (title: String, message: String) {
        switch appModel.content.currentUser?.role {
        case .admin, .coordinator:
            return (
                "Stay informed about operations",
                "Get timely alerts for bookings, failed emails, support tickets, incidents, and schedule changes."
            )
        case .guide:
            return (
                "Stay informed about guide work",
                "Get timely alerts for assignments, visitor changes, training reminders, and safety notices."
            )
        default:
            return (
                "Stay informed about your visit",
                "Get timely alerts for booking confirmations, guide assignments, support replies, payment updates, and safety notices."
            )
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                hero
                    .staggeredAppear(index: 0)

                VStack(spacing: 20) {
                    // Quick access row
                    quickAccessRow
                        .staggeredAppear(index: 1)

                    if appModel.content.currentUser != nil && notificationPrompt.shouldShowPrompt {
                        notificationPermissionPanel
                            .staggeredAppear(index: 2)
                    }

                    // Next visit (if any)
                    if let nextBooking {
                        nextVisitCard(nextBooking)
                            .staggeredAppear(index: 3)
                    }

                    // Discover section
                    discoverSection
                        .staggeredAppear(index: 4)

                    // Stats
                    LazyVGrid(columns: VisitGrid.cardColumns, spacing: 12) {
                        StatCard(title: "Visitor stops", value: "\(appModel.content.pointsOfInterest.count)", systemImage: "mappin.and.ellipse", tint: VisitTheme.primary)
                        StatCard(title: "Meeting points", value: "\(appModel.content.meetingPoints.count)", systemImage: "person.2.badge.gearshape", tint: VisitTheme.green)
                    }
                    .staggeredAppear(index: 5)

                    // Notifications
                    if !appModel.content.notifications.isEmpty {
                        notificationsSection
                            .staggeredAppear(index: 6)
                    }

                    // Special offers
                    if !appModel.content.specialOffers.isEmpty {
                        specialOffersSection
                            .staggeredAppear(index: 7)
                    }

                    // Before you visit
                    LabeledDivider(label: "Before you visit")
                        .staggeredAppear(index: 8)

                    visitorGuidanceCard
                        .staggeredAppear(index: 9)

                    locationNavigationCard
                        .staggeredAppear(index: 10)
                }
                .padding(.horizontal)
                .padding(.top, 20)
                .padding(.bottom, 24)
            }
        }
        .visitScreenBackground()
        .navigationTitle("Visit Dzaleka")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appModel.refresh()
            await notificationPrompt.refresh()
        }
        .task {
            await notificationPrompt.refresh()
        }
    }

    // MARK: - Hero

    private var hero: some View {
        HeroPanel(
            title: appModel.content.publicContent["hero_title"] ?? "Visit Dzaleka",
            subtitle: appModel.content.publicContent["hero_subtitle"] ?? "Plan a respectful visit with local guides, clear meeting guidance, and staff-confirmed booking details.",
            systemImage: "heart.text.square",
            imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-hero.jpg")
        ) {
            HStack(spacing: 10) {
                NavigationLink {
                    BookingRequestView()
                } label: {
                    Label("Request visit", systemImage: "calendar.badge.plus")
                        .font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .foregroundStyle(VisitTheme.primaryDeep)

                NavigationLink {
                    MapAndZonesView()
                } label: {
                    Label("Explore map", systemImage: "map")
                        .font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.bordered)
                .tint(.white)
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Quick Access

    private var quickAccessRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                NavigationLink {
                    PlanYourTripView()
                } label: {
                    QuickLinkTile(title: "Plan Trip", systemImage: "airplane", tint: VisitTheme.primary)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    VisitorEssentialsView()
                } label: {
                    QuickLinkTile(title: "Essentials", systemImage: "checklist", tint: VisitTheme.accent)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    SafeTravelView()
                } label: {
                    QuickLinkTile(title: "Safety", systemImage: "cross.circle", tint: VisitTheme.rose)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    AboutDzalekaView()
                } label: {
                    QuickLinkTile(title: "About", systemImage: "building.2", tint: VisitTheme.blue)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DiscoverView()
                } label: {
                    QuickLinkTile(title: "Discover", systemImage: "sparkles", tint: VisitTheme.violet)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 4)
        }
    }

    // MARK: - Notification Permission

    private var notificationPermissionPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                IconBadge(systemImage: "bell.badge.fill", tint: VisitTheme.blue)

                VStack(alignment: .leading, spacing: 6) {
                    Text(notificationPromptCopy.title)
                        .visitHeadline()
                        .foregroundStyle(VisitTheme.ink)
                    Text(notificationPromptCopy.message)
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(spacing: 10) {
                Button {
                    VisitHaptic.selection()
                    Task {
                        let granted = await notificationPrompt.enableNotifications()
                        appModel.bannerMessage = granted
                            ? "Notifications enabled."
                            : "Notifications were not enabled. You can turn them on later in Settings."
                    }
                } label: {
                    PrimaryActionLabel(
                        isLoading: notificationPrompt.isRequesting,
                        loadingText: "Enabling",
                        text: "Enable Notifications",
                        systemImage: "bell.badge"
                    )
                }
                .buttonStyle(.borderedProminent)
                .disabled(notificationPrompt.isRequesting)

                Button {
                    VisitHaptic.selection()
                    notificationPrompt.dismissForNow()
                    appModel.bannerMessage = "Notification prompt dismissed for now."
                } label: {
                    Text("Not now")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(notificationPrompt.isRequesting)
            }
        }
        .visitFeaturedCard(tint: VisitTheme.blue)
    }

    // MARK: - Next Visit

    private func nextVisitCard(_ booking: Booking) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionTitle(
                    title: "Your next visit",
                    systemImage: "calendar.badge.clock"
                )
                Spacer()
                StatusPill(
                    text: booking.status?.label ?? "Pending",
                    systemImage: "circle.fill",
                    tint: statusTint(booking.status)
                )
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(booking.tourTitle)
                    .visitHeadline()
                    .foregroundStyle(VisitTheme.ink)

                HStack(spacing: 16) {
                    Label(booking.visitDate.visitAPIDate, systemImage: "calendar")
                    Label(booking.visitTime.visitAPITime, systemImage: "clock")
                    Label("\(booking.visitorCount)", systemImage: "person.2")
                }
                .font(.caption)
                .foregroundStyle(VisitTheme.secondaryText)
            }

            NavigationLink {
                MyTripsView()
            } label: {
                Label("Open my trips", systemImage: "ticket")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
        .visitFeaturedCard(tint: statusTint(booking.status))
    }

    // MARK: - Discover

    private var discoverSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionTitle(title: "Discover Dzaleka", subtitle: "Experiences and things to do", systemImage: "sparkles")
                Spacer()
                NavigationLink {
                    DiscoverView()
                } label: {
                    Text("See all")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(VisitTheme.primary)
                }
            }

            LazyVGrid(columns: VisitGrid.cardColumns, spacing: 12) {
                NavigationLink {
                    DiscoverView()
                } label: {
                    ImageCard(
                        title: "Arts & Culture",
                        subtitle: "Music, dance, and crafts",
                        systemImage: "paintpalette",
                        tint: VisitTheme.accent
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DiscoverView()
                } label: {
                    ImageCard(
                        title: "Food & Markets",
                        subtitle: "Local cuisine and shopping",
                        systemImage: "basket",
                        tint: VisitTheme.green
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DiscoverView()
                } label: {
                    ImageCard(
                        title: "Community",
                        subtitle: "Organizations and projects",
                        systemImage: "person.3",
                        tint: VisitTheme.blue
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DiscoverView()
                } label: {
                    ImageCard(
                        title: "Sports",
                        subtitle: "Recreation and outdoor",
                        systemImage: "sportscourt",
                        tint: VisitTheme.violet
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                title: "Notifications",
                subtitle: "Booking, support, and guide updates",
                systemImage: "bell.badge"
            )

            ForEach(appModel.content.notifications.prefix(4)) { notification in
                HStack(alignment: .top, spacing: 12) {
                    IconBadge(
                        systemImage: notification.isRead == true ? "bell" : "bell.badge.fill",
                        tint: notification.isRead == true ? .secondary : VisitTheme.accent
                    )
                    VStack(alignment: .leading, spacing: 4) {
                        Text(notification.title)
                            .font(.subheadline.weight(.semibold))
                        Text(notification.message)
                            .font(.caption)
                            .foregroundStyle(VisitTheme.secondaryText)
                            .lineLimit(3)
                        if let createdAt = notification.createdAt {
                            Text(createdAt.visitAPIDate)
                                .font(.caption2)
                                .foregroundStyle(VisitTheme.secondaryText)
                        }
                    }
                    Spacer(minLength: 0)
                    if notification.isRead != true {
                        Button {
                            VisitHaptic.selection()
                            Task { await appModel.markNotificationRead(notification) }
                        } label: {
                            Label("Mark read", systemImage: "checkmark.circle")
                                .labelStyle(.iconOnly)
                        }
                        .buttonStyle(.bordered)
                        .accessibilityLabel("Mark notification read")
                    }
                }
                .visitInset()
            }
        }
        .visitCard()
    }

    // MARK: - Special Offers

    private var specialOffersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Special offers", subtitle: "Limited-time discounts", systemImage: "tag")
            ForEach(appModel.content.specialOffers) { offer in
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(offer.name)
                                .font(.headline)
                            if let description = offer.description, !description.trimmed.isEmpty {
                                Text(description)
                                    .font(.subheadline)
                                    .foregroundStyle(VisitTheme.secondaryText)
                            }
                        }
                        Spacer(minLength: 0)
                        StatusPill(text: "\(offer.discountPercent)% off", systemImage: "tag.fill", tint: VisitTheme.green)
                    }
                    Text("\(offer.activityStartDate.visitAPIDate) to \(offer.activityEndDate.visitAPIDate)")
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                .visitInset()
            }
        }
        .visitCard()
    }

    // MARK: - Visitor Guidance

    private var visitorGuidanceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: appModel.content.publicContent["pricing_title"] ?? "Guided walking tour",
                subtitle: appModel.content.publicContent["pricing_desc"],
                systemImage: "figure.walk"
            )
            InfoRow(
                title: "Staff-confirmed booking",
                detail: "Availability, guide assignment, meeting point, and payment are verified before the visit.",
                systemImage: "checkmark.seal",
                tint: VisitTheme.green
            )
            InfoRow(
                title: "Community-aware route",
                detail: "Visitor stops come from approved public zones and points of interest.",
                systemImage: "map",
                tint: VisitTheme.primary
            )
            InfoRow(
                title: "Photography is permission-based",
                detail: "Ask before photographing people, homes, schools, health spaces, or organization areas.",
                systemImage: "camera.aperture",
                tint: VisitTheme.accent
            )
        }
        .visitCard()
    }

    // MARK: - Map Navigation

    private var locationNavigationCard: some View {
        NavigationLink {
            MapAndZonesView()
        } label: {
            HStack(alignment: .top, spacing: 12) {
                IconBadge(systemImage: "map", tint: VisitTheme.primary)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Map, zones, and visitor stops")
                        .visitHeadline()
                        .foregroundStyle(VisitTheme.ink)
                    Text("Review meeting points, photo guidance, mobility notes, and access rules.")
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
                    .padding(.top, 5)
            }
            .visitCard()
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func statusTint(_ status: BookingStatus?) -> Color {
        switch status {
        case .pending: return .orange
        case .confirmed, .inProgress: return VisitTheme.primary
        case .completed: return VisitTheme.green
        case .cancelled, .noShow: return .red
        case nil: return .secondary
        }
    }
}
