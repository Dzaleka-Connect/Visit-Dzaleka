import SwiftUI

struct MyTripsView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @State private var selectedTab = "Bookings"
    
    private let tabs = ["Bookings", "Plans", "Resources"]

    private var upcomingTrips: [Booking] {
        appModel.content.bookings
            .filter { $0.status != .completed && $0.status != .cancelled && $0.status != .noShow }
            .sorted { "\($0.visitDate) \($0.visitTime)" < "\($1.visitDate) \($1.visitTime)" }
    }

    private var pastTrips: [Booking] {
        appModel.content.bookings
            .filter { $0.status == .completed || $0.status == .cancelled || $0.status == .noShow }
            .sorted { "\($1.visitDate) \($1.visitTime)" < "\($0.visitDate) \($0.visitTime)" }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HeroPanel(
                    title: "My Trips",
                    subtitle: "Manage your bookings, saved itineraries, favorite guides, and pre-visit resources.",
                    systemImage: "person.crop.circle",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-community.jpg")
                ) {
                    if let user = appModel.content.currentUser {
                        StatusPill(text: user.fullName, systemImage: "person.circle", tint: .white)
                    } else {
                        StatusPill(text: "Sign in", systemImage: "lock", tint: .white)
                    }
                }
                .padding(.horizontal)
                .staggeredAppear(index: 0)

                if appModel.content.currentUser == nil {
                    SignInPanel(
                        title: "Sign in to view dashboard",
                        message: "Use the same account you use on the Visit Dzaleka web app."
                    )
                    .padding(.horizontal)
                    .staggeredAppear(index: 1)
                } else {
                    Picker("Dashboard Section", selection: $selectedTab) {
                        ForEach(tabs, id: \.self) { tab in
                            Text(tab).tag(tab)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    .staggeredAppear(index: 1)
                    .onChange(of: selectedTab) {
                        VisitHaptic.selection()
                    }

                    if selectedTab == "Bookings" {
                        bookingsContent
                    } else if selectedTab == "Plans" {
                        plansContent
                    } else if selectedTab == "Resources" {
                        resourcesContent
                    }
                }
            }
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if appModel.content.currentUser != nil {
                Button("Sign out") {
                    Task { await appModel.logout() }
                }
            }
        }
        .refreshable {
            await appModel.refresh()
        }
    }
    
    // MARK: - Bookings Content
    
    private var bookingsContent: some View {
        VStack(spacing: 18) {
            ProfileEditorCard()
                .padding(.horizontal)
                .staggeredAppear(index: 2)

            if let next = upcomingTrips.first {
                nextVisitCard(next)
                    .padding(.horizontal)
                    .staggeredAppear(index: 3)
            }

            VStack(alignment: .leading, spacing: 14) {
                SectionTitle(
                    title: "Upcoming bookings",
                    systemImage: "calendar.badge.clock"
                )

                if upcomingTrips.isEmpty {
                    EmptyPanel(
                        title: "No upcoming trips",
                        message: "Request a visit and it will appear here.",
                        systemImage: "ticket"
                    )
                } else {
                    ForEach(upcomingTrips) { trip in
                        tripCard(trip)
                    }
                }
            }
            .padding(.horizontal)
            .staggeredAppear(index: 4)

            if !pastTrips.isEmpty {
                VStack(alignment: .leading, spacing: 14) {
                    SectionTitle(title: "Past bookings", systemImage: "clock.arrow.circlepath")
                    ForEach(pastTrips) { trip in
                        tripCard(trip)
                    }
                }
                .padding(.horizontal)
                .staggeredAppear(index: 5)
            }
        }
    }
    
    // MARK: - Plans Content
    
    private var plansContent: some View {
        VStack(spacing: 18) {
            VStack(alignment: .leading, spacing: 14) {
                SectionTitle(title: "Saved itineraries", subtitle: "Your draft and shared trip plans", systemImage: "map")
                
                if appModel.content.savedItineraries.isEmpty {
                    EmptyPanel(
                        title: "No saved itineraries",
                        message: "Build a custom trip plan on the web platform.",
                        systemImage: "map"
                    )
                } else {
                    ForEach(appModel.content.savedItineraries) { itinerary in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(itinerary.name)
                                    .visitHeadline()
                                Spacer()
                                Button(role: .destructive) {
                                    Task { await appModel.deleteSavedItinerary(id: itinerary.id) }
                                } label: {
                                    Image(systemName: "trash")
                                }
                            }
                            HStack {
                                if let type = itinerary.tourType {
                                    StatusPill(text: type, systemImage: "tag", tint: VisitTheme.primary)
                                }
                                if let people = itinerary.numberOfPeople {
                                    StatusPill(text: "\(people) people", systemImage: "person.2", tint: VisitTheme.blue)
                                }
                            }
                        }
                        .visitCard()
                    }
                }
            }
            .padding(.horizontal)
            .staggeredAppear(index: 2)

            VStack(alignment: .leading, spacing: 14) {
                SectionTitle(title: "Favorite guides", subtitle: "Guides you've bookmarked", systemImage: "star.fill")
                
                if appModel.content.favoriteGuides.isEmpty {
                    EmptyPanel(
                        title: "No favorite guides",
                        message: "Bookmark guides you'd like to tour with.",
                        systemImage: "star"
                    )
                } else {
                    ForEach(appModel.content.favoriteGuides) { entry in
                        if let guide = entry.guide {
                            HStack {
                                IconBadge(systemImage: "person.crop.circle", tint: VisitTheme.green)
                                VStack(alignment: .leading) {
                                    Text(guide.fullName).font(.subheadline.weight(.semibold))
                                    Text((guide.languages ?? []).joined(separator: ", ")).font(.caption).foregroundStyle(VisitTheme.secondaryText)
                                }
                                Spacer()
                                Button {
                                    Task { await appModel.toggleFavoriteGuide(guideId: guide.id) }
                                } label: {
                                    Image(systemName: "star.fill")
                                        .foregroundStyle(.orange)
                                }
                            }
                            .visitInset()
                        }
                    }
                }
            }
            .padding(.horizontal)
            .staggeredAppear(index: 3)
        }
    }
    
    // MARK: - Resources Content
    
    private var resourcesContent: some View {
        VStack(spacing: 18) {
            VStack(alignment: .leading, spacing: 14) {
                SectionTitle(title: "Visitor resources", subtitle: "Pre-visit reading and orientation", systemImage: "books.vertical")
                
                if appModel.content.visitorResources.isEmpty {
                    EmptyPanel(
                        title: "No resources assigned",
                        message: "Check back closer to your visit date.",
                        systemImage: "doc.text"
                    )
                } else {
                    ForEach(appModel.content.visitorResources) { resource in
                        HStack(alignment: .top, spacing: 12) {
                            IconBadge(systemImage: "doc.text.fill", tint: VisitTheme.blue)
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(resource.title).font(.subheadline.weight(.semibold))
                                    Spacer()
                                    if resource.isRequired == true {
                                        StatusPill(text: "Required", systemImage: "exclamationmark.triangle.fill", tint: .orange)
                                    }
                                }
                                if let desc = resource.description {
                                    Text(desc).font(.caption).foregroundStyle(VisitTheme.secondaryText)
                                }
                            }
                        }
                        .visitCard()
                    }
                }
            }
            .padding(.horizontal)
            .staggeredAppear(index: 2)
        }
    }

    // MARK: - Card Helpers

    private func nextVisitCard(_ trip: Booking) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Next visit",
                subtitle: "\(trip.visitDate.visitAPIDate) at \(trip.visitTime.visitAPITime)",
                systemImage: "calendar.badge.clock"
            )

            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(trip.tourTitle)
                        .font(.headline)
                    Text("Ref: \(trip.referenceText)")
                        .font(.caption.monospaced())
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                Spacer(minLength: 0)
                StatusPill(
                    text: trip.status?.label ?? "Status pending",
                    systemImage: "circle.fill",
                    tint: statusTint(trip.status)
                )
            }

            Divider()

            HStack(spacing: 10) {
                NavigationLink {
                    BookingDetailView(booking: trip)
                } label: {
                    Label("Open details", systemImage: "doc.text.magnifyingglass")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                NavigationLink {
                    SupportView()
                } label: {
                    Label("Support", systemImage: "questionmark.circle")
                        .labelStyle(.iconOnly)
                        .frame(width: 44, height: 36)
                }
                .buttonStyle(.bordered)
                .accessibilityLabel("Open support")
            }
        }
        .visitFeaturedCard(tint: VisitTheme.primary)
    }

    private func tripCard(_ trip: Booking) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                IconBadge(systemImage: trip.status == .completed ? "checkmark.seal.fill" : "calendar", tint: statusTint(trip.status))

                VStack(alignment: .leading, spacing: 5) {
                    Text(trip.tourTitle)
                        .font(.headline)
                        .foregroundStyle(VisitTheme.ink)
                    Text("\(trip.visitDate.visitAPIDate) at \(trip.visitTime.visitAPITime)")
                        .font(.subheadline)
                        .foregroundStyle(VisitTheme.secondaryText)
                    Text(trip.referenceText)
                        .font(.caption.monospaced())
                        .foregroundStyle(VisitTheme.secondaryText)
                }

                Spacer(minLength: 0)

                StatusPill(
                    text: trip.status?.label ?? "Pending",
                    systemImage: "circle.fill",
                    tint: statusTint(trip.status)
                )
            }

            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                metaTile("Visitors", "\(trip.visitorCount)", "person.2", VisitTheme.primary)
                metaTile("Payment", trip.paymentStatus?.label ?? "Pending", "creditcard", paymentTint(trip.paymentStatus))
            }

            if let guide = trip.guide {
                InfoRow(
                    title: "Guide",
                    detail: guide.fullName,
                    systemImage: "person.crop.circle.badge.checkmark",
                    tint: VisitTheme.green
                )
            }

            if let requests = trip.specialRequests, !requests.trimmed.isEmpty {
                InfoRow(
                    title: "Notes",
                    detail: requests,
                    systemImage: "text.bubble",
                    tint: VisitTheme.blue
                )
            }

            NavigationLink {
                BookingDetailView(booking: trip)
            } label: {
                Label("Manage booking", systemImage: "slider.horizontal.3")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
        .visitCard()
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

    private func statusTint(_ status: BookingStatus?) -> Color {
        switch status {
        case .pending: return .orange
        case .confirmed, .inProgress: return VisitTheme.primary
        case .completed: return VisitTheme.green
        case .cancelled, .noShow: return .red
        case nil: return .secondary
        }
    }

    private func paymentTint(_ status: PaymentStatus?) -> Color {
        switch status {
        case .pending: return .orange
        case .paid: return VisitTheme.green
        case .refunded: return .purple
        case nil: return .secondary
        }
    }
}

private struct ProfileEditorCard: View {
    @EnvironmentObject private var appModel: AppViewModel
    @State private var isExpanded = false

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            VStack(alignment: .leading, spacing: 12) {
                TextField("First name", text: $appModel.profileDraft.firstName)
                    .textContentType(.givenName)
                    .textInputAutocapitalization(.words)
                    .textFieldStyle(.roundedBorder)
                TextField("Last name", text: $appModel.profileDraft.lastName)
                    .textContentType(.familyName)
                    .textInputAutocapitalization(.words)
                    .textFieldStyle(.roundedBorder)
                TextField("Phone", text: $appModel.profileDraft.phone)
                    .textContentType(.telephoneNumber)
                    .keyboardType(.phonePad)
                    .textFieldStyle(.roundedBorder)
                Toggle("Email notifications", isOn: $appModel.profileDraft.emailNotifications)
                Button {
                    Task { await appModel.updateProfile() }
                } label: {
                    PrimaryActionLabel(
                        isLoading: appModel.isUpdatingProfile,
                        loadingText: "Saving profile",
                        text: "Save profile",
                        systemImage: "checkmark.circle"
                    )
                }
                .buttonStyle(.borderedProminent)
                .disabled(appModel.isUpdatingProfile)
            }
            .padding(.top, 12)
        } label: {
            HStack(spacing: 10) {
                IconBadge(systemImage: "person.text.rectangle", tint: VisitTheme.primary)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Profile and notifications")
                        .font(.subheadline.weight(.semibold))
                    Text(appModel.content.currentUser?.emailVerified == false ? "Email verification still needs attention." : "Keep your contact details current.")
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                Spacer()
            }
        }
        .visitCard()
    }
}

private struct BookingDetailView: View {
    @EnvironmentObject private var appModel: AppViewModel
    let booking: Booking

    private var currentBooking: Booking {
        appModel.content.bookings.first(where: { $0.id == booking.id }) ?? booking
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                detailHero
                    .staggeredAppear(index: 0)
                visitorActionsCard
                    .staggeredAppear(index: 1)
                
                if currentBooking.status == .completed && currentBooking.visitorRating == nil {
                    VisitorFeedbackCard(booking: currentBooking)
                        .staggeredAppear(index: 2)
                }
                
                guideCard
                    .staggeredAppear(index: 3)
                itineraryCard
                    .staggeredAppear(index: 4)
                timelineCard
                    .staggeredAppear(index: 5)
            }
            .padding()
            .padding(.bottom, 24)
        }
        .visitScreenBackground()
        .navigationTitle(currentBooking.referenceText)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await appModel.loadBookingDetails(bookingId: booking.id)
        }
        .refreshable {
            await appModel.loadBookingDetails(bookingId: booking.id)
            await appModel.refresh()
        }
    }

    private var detailHero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(currentBooking.tourTitle)
                        .font(.title2.weight(.bold))
                    Text(currentBooking.referenceText)
                        .font(.caption.monospaced())
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                Spacer(minLength: 0)
                StatusPill(
                    text: currentBooking.status?.label ?? "Pending",
                    systemImage: "circle.fill",
                    tint: statusTint(currentBooking.status)
                )
            }

            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                compactDetail("Date", currentBooking.visitDate.visitAPIDate, "calendar")
                compactDetail("Time", currentBooking.visitTime.visitAPITime, "clock")
                compactDetail("Visitors", "\(currentBooking.visitorCount)", "person.2")
                compactDetail("Payment", currentBooking.paymentStatus?.label ?? "Pending", "creditcard")
            }

            if let amount = currentBooking.totalAmount {
                InfoRow(
                    title: "Amount",
                    detail: amount.formatted(.currency(code: "MWK")),
                    systemImage: "banknote",
                    tint: VisitTheme.green
                )
            }
        }
        .visitCard()
    }

    private var visitorActionsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Actions",
                subtitle: "Visitor changes are recorded for staff review.",
                systemImage: "slider.horizontal.3"
            )

            if currentBooking.paymentStatus != .paid {
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 10) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Payment method")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(VisitTheme.secondaryText)
                            Picker("Payment method", selection: $appModel.paymentReportDraft.paymentMethod) {
                                Text("Cash").tag("cash")
                                Text("Airtel Money").tag("airtel_money")
                                Text("TNM Mpamba").tag("tnm_mpamba")
                                Text("Card").tag("card")
                            }
                            .pickerStyle(.menu)
                        }
                        .visitInset(padding: 10)

                        TextField("Reference or transaction note", text: $appModel.paymentReportDraft.paymentReference)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textFieldStyle(.roundedBorder)
                        TextField("Message for staff", text: $appModel.paymentReportDraft.note, axis: .vertical)
                            .lineLimit(2...4)
                            .textFieldStyle(.roundedBorder)

                        Button {
                            Task { await appModel.reportPayment(bookingId: currentBooking.id) }
                        } label: {
                            PrimaryActionLabel(
                                isLoading: appModel.isRunningVisitorAction,
                                loadingText: "Reporting payment",
                                text: "Report payment made",
                                systemImage: "checkmark.seal"
                            )
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(appModel.isRunningVisitorAction)
                    }
                    .padding(.top, 10)
                } label: {
                    InfoRow(
                        title: "Report payment made",
                        detail: "Staff will verify before marking this booking paid.",
                        systemImage: "checkmark.seal",
                        tint: .orange
                    )
                }
            }

            if currentBooking.status == .pending || currentBooking.status == .confirmed {
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 10) {
                        TextField("Reason for cancellation", text: $appModel.cancellationDraft.reason, axis: .vertical)
                            .lineLimit(2...4)
                            .textFieldStyle(.roundedBorder)
                        Button(role: .destructive) {
                            Task { await appModel.cancelBooking(bookingId: currentBooking.id) }
                        } label: {
                            Label("Cancel this booking", systemImage: "xmark.circle")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(appModel.isRunningVisitorAction)
                    }
                    .padding(.top, 10)
                } label: {
                    InfoRow(
                        title: "Cancel booking",
                        detail: "Use this when you can no longer attend.",
                        systemImage: "xmark.circle",
                        tint: .red
                    )
                }
            }
        }
        .visitCard()
    }

    private var guideCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Guide", systemImage: "person.crop.circle.badge.checkmark")

            if let guide = currentBooking.guide {
                InfoRow(title: guide.fullName, detail: (guide.languages ?? []).joined(separator: ", "), systemImage: "person.crop.circle", tint: VisitTheme.green)
                if let phone = guide.phone, !phone.trimmed.isEmpty {
                    Link(destination: URL(string: "tel:\(phone)")!) {
                        InfoRow(title: "Call guide", detail: phone, systemImage: "phone", tint: VisitTheme.primary)
                    }
                    .buttonStyle(.plain)
                }
                if let email = guide.email, !email.trimmed.isEmpty {
                    Link(destination: URL(string: "mailto:\(email)")!) {
                        InfoRow(title: "Email guide", detail: email, systemImage: "envelope", tint: VisitTheme.blue)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                EmptyPanel(
                    title: "Guide not assigned yet",
                    message: "Staff will add guide details after confirming the visit.",
                    systemImage: "person.crop.circle.badge.questionmark"
                )
            }
        }
        .visitCard()
    }

    private var itineraryCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Itinerary", systemImage: "map")

            if appModel.isLoadingBookingDetail {
                ShimmerCard()
            } else if let itinerary = appModel.bookingItineraries[currentBooking.id]?.content {
                if let version = itinerary.version {
                    StatusPill(text: "Version \(version)", systemImage: "doc.badge.clock", tint: VisitTheme.blue)
                }
                if let meetingPoint = itinerary.meetingPoint, !meetingPoint.trimmed.isEmpty {
                    InfoRow(title: "Meeting point", detail: meetingPoint, systemImage: "mappin.circle", tint: VisitTheme.green)
                }
                ForEach(itinerary.items ?? []) { item in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.time)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(VisitTheme.primary)
                        Text(item.activity)
                            .font(.subheadline.weight(.semibold))
                        if let description = item.description, !description.trimmed.isEmpty {
                            Text(description)
                                .font(.caption)
                                .foregroundStyle(VisitTheme.secondaryText)
                        }
                    }
                    .visitInset()
                }
                if let notes = itinerary.notes, !notes.trimmed.isEmpty {
                    InfoRow(title: "Notes", detail: notes, systemImage: "text.bubble", tint: VisitTheme.blue)
                }
            } else {
                EmptyPanel(
                    title: "No itinerary yet",
                    message: "Saved itineraries from staff will appear here.",
                    systemImage: "map"
                )
            }
        }
        .visitCard()
    }

    private var timelineCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Activity timeline", systemImage: "clock.arrow.circlepath")
            let activities = appModel.bookingActivities[currentBooking.id] ?? []
            let emails = appModel.bookingEmailTimelines[currentBooking.id] ?? []

            if activities.isEmpty && emails.isEmpty && appModel.isLoadingBookingDetail {
                ShimmerCard()
            } else if activities.isEmpty && emails.isEmpty {
                EmptyPanel(
                    title: "No timeline yet",
                    message: "Booking activity and email delivery events will appear here.",
                    systemImage: "clock"
                )
            } else {
                ForEach(activities) { item in
                    timelineRow(title: item.action.titleCasedStatus, detail: item.description, date: item.createdAt, systemImage: "clock.arrow.circlepath", tint: VisitTheme.primary)
                }
                ForEach(emails) { email in
                    timelineRow(title: email.templateType?.titleCasedStatus ?? email.subject ?? "Email", detail: email.status?.titleCasedStatus, date: email.createdAt, systemImage: "envelope", tint: VisitTheme.blue)
                }
            }
        }
        .visitCard()
    }

    private func compactDetail(_ title: String, _ value: String, _ systemImage: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .foregroundStyle(VisitTheme.primary)
                .frame(width: 22)
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitInset(padding: 10)
    }

    private func timelineRow(title: String, detail: String?, date: String?, systemImage: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            IconBadge(systemImage: systemImage, tint: tint)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                if let detail, !detail.trimmed.isEmpty {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
                if let date, !date.trimmed.isEmpty {
                    Text(date.visitAPIDate)
                        .font(.caption2)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
            }
            Spacer(minLength: 0)
        }
        .visitInset()
    }

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

private struct VisitorFeedbackCard: View {
    @EnvironmentObject private var appModel: AppViewModel
    let booking: Booking

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(title: "Post-visit feedback", subtitle: "Help us improve Visit Dzaleka.", systemImage: "star.bubble")

            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Overall rating")
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: 12) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= appModel.reviewDraft.rating ? "star.fill" : "star")
                                .font(.title)
                                .foregroundStyle(.orange)
                                .onTapGesture {
                                    VisitHaptic.selection()
                                    appModel.reviewDraft.rating = star
                                }
                        }
                    }
                }

                TextField("What did you enjoy most?", text: $appModel.reviewDraft.enjoyedMost, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)

                TextField("Any suggestions for improvement?", text: $appModel.reviewDraft.improvementSuggestions, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
                
                Toggle(isOn: $appModel.reviewDraft.consentDataProcessing) {
                    Text("I consent to data processing for internal review.")
                        .font(.caption)
                }

                Button {
                    VisitHaptic.impact(.medium)
                    appModel.reviewDraft.bookingReference = booking.id
                    Task { await appModel.submitReview() }
                } label: {
                    PrimaryActionLabel(
                        isLoading: appModel.isSubmittingReview,
                        loadingText: "Submitting",
                        text: "Submit feedback",
                        systemImage: "paperplane"
                    )
                }
                .buttonStyle(.borderedProminent)
                .disabled(!appModel.reviewDraft.canSubmit || appModel.isSubmittingReview)
            }
            .visitInset()
        }
        .visitFeaturedCard(tint: .orange)
    }
}
