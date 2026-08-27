import SwiftUI

struct AdminDashboardView: View {
    @EnvironmentObject private var appModel: AppViewModel
    
    private var todayBookings: [Booking] {
        // AppViewModel fetches `/api/bookings/today` for admin/coordinator roles and puts them in `bookings`
        appModel.content.bookings.sorted { "\($0.visitTime)" < "\($1.visitTime)" }
    }
    
    private var inProgressCount: Int {
        todayBookings.filter { $0.status == .inProgress || $0.status == .completed }.count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HeroPanel(
                    title: "Live Ops",
                    subtitle: "Manage today's tours, active guides, and visitor check-ins.",
                    systemImage: "shield.lefthalf.filled",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-community.jpg")
                ) {
                    if let user = appModel.content.currentUser {
                        StatusPill(text: user.role?.label ?? "Admin", systemImage: "star.fill", tint: .white)
                    }
                }
                .padding(.horizontal)
                .staggeredAppear(index: 0)
                
                statsRow
                    .padding(.horizontal)
                    .staggeredAppear(index: 1)
                
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(
                        title: "Today's Schedule",
                        subtitle: "\(todayBookings.count) active bookings today.",
                        systemImage: "calendar.badge.clock"
                    )
                    
                    if todayBookings.isEmpty {
                        EmptyPanel(
                            title: "No tours today",
                            message: "There are no confirmed tours scheduled for today.",
                            systemImage: "cup.and.saucer"
                        )
                    } else {
                        ForEach(todayBookings) { booking in
                            AdminBookingCard(booking: booking)
                        }
                    }
                }
                .padding(.horizontal)
                .staggeredAppear(index: 2)
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Platform Admin")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appModel.refresh()
        }
    }
    
    private var statsRow: some View {
        LazyVGrid(columns: VisitGrid.compactColumns, spacing: 12) {
            statTile(
                title: "Today's Tours",
                value: "\(todayBookings.count)",
                systemImage: "calendar",
                tint: VisitTheme.primary
            )
            
            statTile(
                title: "In Progress",
                value: "\(inProgressCount)",
                systemImage: "play.circle.fill",
                tint: VisitTheme.green
            )
        }
    }
    
    private func statTile(title: String, value: String, systemImage: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                IconBadge(systemImage: systemImage, tint: tint)
                Spacer()
                Text(value)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(VisitTheme.ink)
            }
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(VisitTheme.secondaryText)
        }
        .visitInset()
    }
}

private struct AdminBookingCard: View {
    let booking: Booking
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                IconBadge(systemImage: statusIcon, tint: statusTint)
                
                VStack(alignment: .leading, spacing: 5) {
                    Text(booking.tourTitle)
                        .font(.headline)
                        .foregroundStyle(VisitTheme.ink)
                    
                    HStack(spacing: 4) {
                        Text(booking.visitTime.visitAPITime)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(VisitTheme.primary)
                        Text("•")
                        Text("\(booking.visitorCount) pax")
                    }
                    .font(.subheadline)
                    .foregroundStyle(VisitTheme.secondaryText)
                }
                
                Spacer(minLength: 0)
                
                StatusPill(
                    text: booking.status?.label ?? "Pending",
                    systemImage: "circle.fill",
                    tint: statusTint
                )
            }
            
            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                metaTile("Visitor", booking.visitorName, "person.circle", VisitTheme.blue)
                metaTile("Guide", booking.guide?.fullName ?? "Unassigned", "person.crop.circle.badge.checkmark", booking.guide == nil ? .orange : VisitTheme.green)
            }
            
            if let requests = booking.specialRequests, !requests.trimmed.isEmpty {
                InfoRow(
                    title: "Notes",
                    detail: requests,
                    systemImage: "text.bubble",
                    tint: .orange
                )
            }
            
            DisclosureGroup(isExpanded: $isExpanded) {
                VStack(alignment: .leading, spacing: 10) {
                    InfoRow(
                        title: "Payment",
                        detail: booking.paymentStatus?.label ?? "Pending",
                        systemImage: "creditcard",
                        tint: booking.paymentStatus == .paid ? VisitTheme.green : .orange
                    )
                    
                    InfoRow(
                        title: "Reference",
                        detail: booking.referenceText,
                        systemImage: "number",
                        tint: VisitTheme.secondaryText
                    )
                    
                    if let phone = booking.visitorPhone {
                        Link(destination: URL(string: "tel:\(phone)")!) {
                            Label("Call Visitor", systemImage: "phone")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .padding(.top, 4)
                    }
                }
                .padding(.top, 10)
            } label: {
                Text(isExpanded ? "Hide Details" : "View Details")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(VisitTheme.primary)
            }
        }
        .visitCard()
    }
    
    private var statusIcon: String {
        switch booking.status {
        case .completed: return "checkmark.seal.fill"
        case .inProgress: return "play.circle.fill"
        case .cancelled, .noShow: return "xmark.octagon.fill"
        default: return "calendar"
        }
    }
    
    private var statusTint: Color {
        switch booking.status {
        case .pending: return .orange
        case .confirmed: return VisitTheme.primary
        case .inProgress, .completed: return VisitTheme.green
        case .cancelled, .noShow: return .red
        case nil: return .secondary
        }
    }
    
    private func metaTile(_ title: String, _ value: String, _ systemImage: String, _ tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundStyle(tint)
                .frame(width: 24, height: 24)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitInset(padding: 10)
    }
}
