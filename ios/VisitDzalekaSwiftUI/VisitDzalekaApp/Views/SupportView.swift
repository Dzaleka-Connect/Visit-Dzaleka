import SwiftUI

struct SupportView: View {
    @EnvironmentObject private var appModel: AppViewModel
    @FocusState private var focusedField: Field?

    private enum Field {
        case subject
        case message
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                HeroPanel(
                    title: "Support",
                    subtitle: "Open a real support ticket for booking changes, payment verification, guide questions, safety, or accessibility.",
                    systemImage: "questionmark.bubble",
                    imageURL: nil
                ) {
                    if appModel.content.currentUser == nil {
                        StatusPill(text: "Sign in required", systemImage: "lock", tint: .white)
                    } else {
                        StatusPill(text: "\(appModel.content.supportTickets.count) tickets", systemImage: "tray.full", tint: .white)
                    }
                }

                if appModel.content.currentUser == nil {
                    SignInPanel(
                        title: "Sign in for support",
                        message: "Support tickets are connected to your Visit Dzaleka account."
                    )
                } else {
                    commonSupportCard
                    ticketFormCard
                    recentTicketsCard
                }

                helpfulLinksCard
            }
            .padding()
        }
        .visitScreenBackground()
        .navigationTitle("Support")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appModel.refresh()
        }
    }

    private var commonSupportCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                title: "Common requests",
                subtitle: "Choose a shortcut to prefill the ticket form.",
                systemImage: "bolt"
            )

            quickSupportTile(
                title: "Change or cancel a booking",
                detail: "Ask staff to review date, group size, refund, or guide changes.",
                category: "Booking",
                systemImage: "calendar.badge.exclamationmark"
            )
            quickSupportTile(
                title: "Payment verification",
                detail: "Report payment made. Staff will verify before marking the booking paid.",
                category: "Payment",
                systemImage: "checkmark.seal"
            )
            quickSupportTile(
                title: "Safety or accessibility",
                detail: "Share health, mobility, route, or arrival concerns before the visit.",
                category: "Safety",
                systemImage: "figure.roll"
            )
            quickSupportTile(
                title: "Guide question",
                detail: "Ask about guide assignment, languages, arrival contact, or route preparation.",
                category: "Guide",
                systemImage: "person.crop.circle.badge.questionmark"
            )
        }
        .visitCard()
    }

    private var ticketFormCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionTitle(
                title: "Create ticket",
                subtitle: "Include your booking reference if this is about an existing visit.",
                systemImage: "square.and.pencil"
            )

            HStack(spacing: 10) {
                IconBadge(systemImage: "tray.full", tint: VisitTheme.primary)
                Text("Category")
                    .font(.subheadline.weight(.semibold))
                Spacer(minLength: 0)
                Picker("Category", selection: $appModel.supportDraft.category) {
                    Text("Booking").tag("Booking")
                    Text("Payment").tag("Payment")
                    Text("Guide").tag("Guide")
                    Text("Safety").tag("Safety")
                    Text("General").tag("General")
                }
                .pickerStyle(.menu)
            }
            .visitInset()

            TextField("Subject", text: $appModel.supportDraft.subject)
                .focused($focusedField, equals: .subject)
                .textInputAutocapitalization(.sentences)
                .submitLabel(.next)
                .onSubmit { focusedField = .message }
                .textFieldStyle(.roundedBorder)

            TextField("Message", text: $appModel.supportDraft.message, axis: .vertical)
                .focused($focusedField, equals: .message)
                .lineLimit(5...8)
                .submitLabel(.send)
                .textFieldStyle(.roundedBorder)

            Button {
                VisitHaptic.impact(.medium)
                Task { await appModel.submitSupportTicket() }
            } label: {
                PrimaryActionLabel(
                    isLoading: appModel.isSubmittingSupport,
                    loadingText: "Sending support request",
                    text: "Send support request",
                    systemImage: "paperplane.fill"
                )
            }
            .buttonStyle(.borderedProminent)
            .disabled(appModel.isSubmittingSupport || !appModel.supportDraft.canSubmit)
        }
        .visitCard()
    }

    private var recentTicketsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(
                title: "Recent tickets",
                subtitle: appModel.content.supportTickets.isEmpty ? "Tickets you submit will appear here." : nil,
                systemImage: "tray.full"
            )

            if appModel.content.supportTickets.isEmpty {
                EmptyPanel(
                    title: "No tickets yet",
                    message: "Use the form above when you need help from the team.",
                    systemImage: "tray"
                )
            } else {
                ForEach(appModel.content.supportTickets) { ticket in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(ticket.subject)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(VisitTheme.ink)
                                if let createdAt = ticket.createdAt {
                                    Text(createdAt.visitAPIDate)
                                        .font(.caption2)
                                        .foregroundStyle(VisitTheme.secondaryText)
                                }
                            }
                            Spacer(minLength: 0)
                            StatusPill(
                                text: ticket.status?.titleCasedStatus ?? "Open",
                                systemImage: "circle.fill",
                                tint: ticketTint(ticket.status)
                            )
                        }

                        Text(ticket.message)
                            .font(.caption)
                            .foregroundStyle(VisitTheme.secondaryText)
                            .lineLimit(3)

                        if let adminNotes = ticket.adminNotes, !adminNotes.trimmed.isEmpty {
                            InfoRow(
                                title: "Team note",
                                detail: adminNotes,
                                systemImage: "text.bubble",
                                tint: VisitTheme.blue
                            )
                        }
                    }
                    .visitInset()
                }
            }
        }
        .visitCard()
    }

    private var helpfulLinksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(title: "Helpful links", systemImage: "link")

            Link(destination: URL(string: "https://visit.dzaleka.com")!) {
                InfoRow(
                    title: "Visit Dzaleka website",
                    detail: "Open the full web app for admin-only workflows and documents.",
                    systemImage: "safari",
                    tint: VisitTheme.primary
                )
            }
            .buttonStyle(.plain)

            Link(destination: URL(string: "https://services.dzaleka.com")!) {
                InfoRow(
                    title: "Dzaleka services directory",
                    detail: "Browse community organizations and services.",
                    systemImage: "building.2",
                    tint: VisitTheme.green
                )
            }
            .buttonStyle(.plain)
        }
        .visitCard()
    }

    private func quickSupportTile(title: String, detail: String, category: String, systemImage: String) -> some View {
        ActionTile(title: title, detail: detail, systemImage: systemImage, tint: VisitTheme.primary) {
            appModel.supportDraft.category = category
            appModel.supportDraft.subject = title
            focusedField = .message
        }
        .accessibilityHint("Fills the support form with this topic")
    }

    private func ticketTint(_ status: String?) -> Color {
        switch status {
        case "resolved", "closed": return VisitTheme.green
        case "in_progress": return VisitTheme.blue
        case "waiting": return .orange
        default: return VisitTheme.primary
        }
    }
}
