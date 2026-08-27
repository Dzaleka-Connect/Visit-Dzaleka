import SwiftUI

struct BookingRequestView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @FocusState private var focusedField: Field?

    private enum Field {
        case name
        case email
        case phone
        case country
        case purpose
        case notes
    }

    private var selectedMeetingPoint: MeetingPoint? {
        appModel.content.meetingPoints.first { $0.id == appModel.bookingDraft.meetingPointId }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HeroPanel(
                    title: "Request a guided visit",
                    subtitle: "Share your preferred date, group size, and access needs. Staff confirm the final guide, route, meeting point, and payment status.",
                    systemImage: "calendar.badge.plus",
                    imageURL: URL(string: "https://services.dzaleka.com/images/dzaleka-tour.jpg")
                ) {
                    HStack(spacing: 10) {
                        StatusPill(text: "2-3 hours", systemImage: "clock", tint: .white)
                        StatusPill(text: "Staff confirmed", systemImage: "checkmark.seal", tint: .white)
                    }
                }
                .staggeredAppear(index: 0)

                visitorDetailsCard
                    .staggeredAppear(index: 1)
                visitDetailsCard
                    .staggeredAppear(index: 2)
                meetingAndNotesCard
                    .staggeredAppear(index: 3)
                submitCard
                    .staggeredAppear(index: 4)
            }
            .padding()
        }
        .visitScreenBackground()
        .navigationTitle("Request Visit")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if appModel.bookingDraft.meetingPointId.isEmpty,
               let defaultPoint = appModel.content.meetingPoints.first(where: { $0.isDefault == true }) {
                appModel.bookingDraft.meetingPointId = defaultPoint.id
            }
        }
    }

    private var visitorDetailsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Visitor details",
                subtitle: "Use the same contact details staff should use for confirmations.",
                systemImage: "person.text.rectangle"
            )

            VStack(spacing: 10) {
                TextField("Full name", text: $appModel.bookingDraft.visitorName)
                    .textContentType(.name)
                    .textInputAutocapitalization(.words)
                    .focused($focusedField, equals: .name)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .email }
                    .textFieldStyle(.roundedBorder)

                TextField("Email", text: $appModel.bookingDraft.email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focusedField, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .phone }
                    .textFieldStyle(.roundedBorder)

                TextField("Phone", text: $appModel.bookingDraft.phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .focused($focusedField, equals: .phone)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .country }
                    .textFieldStyle(.roundedBorder)

                TextField("Country", text: $appModel.bookingDraft.country)
                    .textInputAutocapitalization(.words)
                    .focused($focusedField, equals: .country)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .purpose }
                    .textFieldStyle(.roundedBorder)
            }
        }
        .visitCard()
    }

    private var visitDetailsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionTitle(
                title: "Visit details",
                subtitle: "Routes may shift based on weather, events, community permission, and guide judgement.",
                systemImage: "figure.walk"
            )

            DatePicker(
                "Preferred date and time",
                selection: $appModel.bookingDraft.preferredDate,
                in: Date()...,
                displayedComponents: [.date, .hourAndMinute]
            )
            .datePickerStyle(.compact)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label("Group size", systemImage: "person.2")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text("\(appModel.bookingDraft.groupSize)")
                        .font(.headline.monospacedDigit())
                }
                Stepper("Adjust group size", value: $appModel.bookingDraft.groupSize, in: 1...30)
                    .labelsHidden()
            }
            .visitInset()

            Picker("Tour type", selection: $appModel.bookingDraft.tourType) {
                Text("Standard").tag("standard")
                Text("Extended").tag("extended")
                Text("Custom").tag("custom")
            }
            .pickerStyle(.segmented)

            VStack(spacing: 10) {
                labeledMenu(title: "Language", systemImage: "textformat") {
                    Picker("Language", selection: $appModel.bookingDraft.language) {
                        Text("English").tag("English")
                        Text("French").tag("French")
                        Text("Swahili").tag("Swahili")
                    }
                    .pickerStyle(.menu)
                }

                labeledMenu(title: "Payment", systemImage: "creditcard") {
                    Picker("Payment", selection: $appModel.bookingDraft.paymentMethod) {
                        Text("Cash").tag("cash")
                        Text("Airtel Money").tag("airtel_money")
                        Text("TNM Mpamba").tag("tnm_mpamba")
                        Text("Card").tag("card")
                    }
                    .pickerStyle(.menu)
                }
            }
        }
        .visitCard()
    }

    private var meetingAndNotesCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Meeting and needs",
                subtitle: "Staff will review the details before confirming the route.",
                systemImage: "mappin.and.ellipse"
            )

            if !appModel.content.meetingPoints.isEmpty {
                Picker("Meeting point", selection: $appModel.bookingDraft.meetingPointId) {
                    Text("Staff recommendation").tag("")
                    ForEach(appModel.content.meetingPoints) { point in
                        Text(point.name).tag(point.id)
                    }
                }
                .pickerStyle(.navigationLink)

                if let selectedMeetingPoint {
                    InfoRow(
                        title: selectedMeetingPoint.name,
                        detail: selectedMeetingPoint.meetingInstructions ?? selectedMeetingPoint.address ?? "Staff will confirm arrival instructions.",
                        systemImage: "mappin.circle",
                        tint: VisitTheme.green
                    )
                    .visitInset()
                }
            }

            TextField("Purpose of visit", text: $appModel.bookingDraft.purpose)
                .textInputAutocapitalization(.sentences)
                .focused($focusedField, equals: .purpose)
                .submitLabel(.next)
                .onSubmit { focusedField = .notes }
                .textFieldStyle(.roundedBorder)

            TextField("Accessibility, interests, or notes", text: $appModel.bookingDraft.notes, axis: .vertical)
                .lineLimit(4...7)
                .focused($focusedField, equals: .notes)
                .textFieldStyle(.roundedBorder)

            Toggle(isOn: $appModel.bookingDraft.acceptsGuidelines) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Visitor guidelines")
                        .font(.subheadline.weight(.semibold))
                    Text("I understand routes may change and I will follow guide instructions.")
                        .font(.caption)
                        .foregroundStyle(VisitTheme.secondaryText)
                }
            }
            .toggleStyle(.switch)
            .visitInset()
        }
        .visitCard()
    }

    private var submitCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Request summary",
                subtitle: "This creates a real booking request in the Visit Dzaleka system.",
                systemImage: "doc.text.magnifyingglass"
            )

            LazyVGrid(columns: VisitGrid.compactColumns, spacing: 10) {
                summaryTile("Date", appModel.bookingDraft.preferredDate.visitShortDate, "calendar")
                summaryTile("Time", appModel.bookingDraft.preferredDate.visitTime, "clock")
                summaryTile("Visitors", "\(appModel.bookingDraft.groupSize)", "person.2")
                summaryTile("Payment", appModel.bookingDraft.paymentMethod.titleCasedStatus, "creditcard")
            }

            Button {
                VisitHaptic.impact(.medium)
                Task { await appModel.submitBooking() }
            } label: {
                PrimaryActionLabel(
                    isLoading: appModel.isSubmittingBooking,
                    loadingText: "Submitting request",
                    text: "Submit booking request",
                    systemImage: "paperplane.fill"
                )
            }
            .buttonStyle(.borderedProminent)
            .disabled(appModel.isSubmittingBooking || !appModel.bookingDraft.canSubmit)

            if !appModel.bookingDraft.canSubmit {
                Text("Add your name, email, phone, and accept the visitor guidelines to submit.")
                    .font(.caption)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
        }
        .visitFeaturedCard(tint: VisitTheme.primary)
    }

    private func summaryTile(_ title: String, _ value: String, _ systemImage: String) -> some View {
        HStack(spacing: 9) {
            IconBadge(systemImage: systemImage, tint: VisitTheme.primary)
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(VisitTheme.secondaryText)
            }
            Spacer(minLength: 0)
        }
        .visitInset(padding: 10)
    }

    private func labeledMenu<Content: View>(
        title: String,
        systemImage: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        HStack(spacing: 10) {
            IconBadge(systemImage: systemImage, tint: VisitTheme.primary)
            Text(title)
                .font(.subheadline.weight(.semibold))
            Spacer(minLength: 0)
            content()
        }
        .visitInset(padding: 10)
    }
}
