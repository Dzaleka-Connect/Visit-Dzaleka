import Foundation
import UserNotifications

@MainActor
final class AppViewModel: ObservableObject {
    @Published var content: AppContent = .empty
    @Published var loginDraft = LoginDraft()
    @Published var registerDraft = RegisterDraft()
    @Published var passwordHelpDraft = PasswordHelpDraft()
    @Published var profileDraft = ProfileDraft()
    @Published var bookingDraft = BookingDraft()
    @Published var supportDraft = SupportTicketDraft()
    @Published var paymentReportDraft = PaymentReportDraft()
    @Published var cancellationDraft = CancellationDraft()
    @Published var guideRatingDraft = GuideRatingDraft()
    @Published var availabilityDraft: [String: Bool] = [:]
    @Published var bookingActivities: [String: [BookingActivity]] = [:]
    @Published var bookingEmailTimelines: [String: [EmailTimelineItem]] = [:]
    @Published var bookingItineraries: [String: ItineraryRecord] = [:]
    @Published var isLoading = false
    @Published var isAuthenticating = false
    @Published var isSubmittingBooking = false
    @Published var isSubmittingSupport = false
    @Published var isUpdatingProfile = false
    @Published var isRunningVisitorAction = false
    @Published var reviewDraft = ReviewDraft()
    @Published var isSubmittingReview = false
    @Published var isSavingItinerary = false
    @Published var isSavingAvailability = false
    @Published var isLoadingBookingDetail = false
    @Published var isRunningGuideAction = false
    @Published var bannerMessage: String?

    private let api: any VisitDzalekaAPI

    init(api: any VisitDzalekaAPI) {
        self.api = api
        Task { await refresh() }
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        do {
            content = try await api.fetchAppContent()
            prefillBookingFromUser()
            prefillProfileFromUser()
            prefillAvailability()
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func login() async {
        guard loginDraft.canSubmit else {
            bannerMessage = "Enter a valid email and password."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            _ = try await api.login(
                email: loginDraft.email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: loginDraft.password
            )
            loginDraft = LoginDraft()
            await refresh()
            bannerMessage = "Signed in."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func register() async {
        guard registerDraft.canSubmit else {
            bannerMessage = "Add your name, a valid email, and a password with at least 6 characters."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            _ = try await api.register(
                email: registerDraft.email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: registerDraft.password,
                firstName: registerDraft.firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                lastName: registerDraft.lastName.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            registerDraft = RegisterDraft()
            await refresh()
            bannerMessage = "Account created. Welcome to Visit Dzaleka."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func requestPasswordReset() async {
        guard passwordHelpDraft.canRequestReset else {
            bannerMessage = "Enter the email address on your account."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            bannerMessage = try await api.requestPasswordReset(
                email: passwordHelpDraft.email.trimmingCharacters(in: .whitespacesAndNewlines)
            )
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func resetPassword() async {
        guard passwordHelpDraft.canResetPassword else {
            bannerMessage = "Paste the reset token and enter a new password."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            bannerMessage = try await api.resetPassword(
                token: passwordHelpDraft.resetToken.trimmingCharacters(in: .whitespacesAndNewlines),
                password: passwordHelpDraft.newPassword
            )
            passwordHelpDraft.resetToken = ""
            passwordHelpDraft.newPassword = ""
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func verifyEmail() async {
        guard passwordHelpDraft.canVerifyEmail else {
            bannerMessage = "Paste the email verification token first."
            return
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            bannerMessage = try await api.verifyEmail(
                token: passwordHelpDraft.verificationToken.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            passwordHelpDraft.verificationToken = ""
            await refresh()
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func updateProfile() async {
        isUpdatingProfile = true
        defer { isUpdatingProfile = false }

        do {
            let user = try await api.updateProfile(profileDraft)
            content.currentUser = user
            prefillBookingFromUser()
            bannerMessage = "Profile updated."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func logout() async {
        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            try await api.logout()
            content = .empty
            await refresh()
            bannerMessage = "Signed out."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func submitBooking() async {
        guard bookingDraft.canSubmit else {
            bannerMessage = "Add your name, a valid email, and accept the visitor guidelines."
            return
        }

        isSubmittingBooking = true
        defer { isSubmittingBooking = false }

        do {
            let booking = try await api.submitBooking(bookingDraft)
            content.bookings.insert(booking, at: 0)
            bookingDraft = BookingDraft()
            prefillBookingFromUser()
            bannerMessage = "Booking request received."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func reportPayment(bookingId: String) async {
        await runVisitorAction {
            try await self.api.reportVisitorPayment(bookingId: bookingId, draft: self.paymentReportDraft)
        }
        paymentReportDraft = PaymentReportDraft()
    }

    func cancelBooking(bookingId: String) async {
        await runVisitorAction {
            try await self.api.cancelVisitorBooking(bookingId: bookingId, reason: self.cancellationDraft.reason)
        }
        cancellationDraft = CancellationDraft()
    }

    func rateGuide(bookingId: String) async {
        isRunningVisitorAction = true
        defer { isRunningVisitorAction = false }

        do {
            bannerMessage = try await api.rateGuide(bookingId: bookingId, rating: guideRatingDraft.rating)
            await refresh()
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func loadBookingDetails(bookingId: String) async {
        isLoadingBookingDetail = true
        defer { isLoadingBookingDetail = false }

        async let activitiesResult = try? api.fetchBookingActivity(bookingId: bookingId)
        async let emailsResult = try? api.fetchBookingEmailTimeline(bookingId: bookingId)
        async let itineraryResult = try? api.fetchBookingItinerary(bookingId: bookingId)

        bookingActivities[bookingId] = await activitiesResult ?? []
        bookingEmailTimelines[bookingId] = await emailsResult ?? []
        if let itinerary = await itineraryResult {
            bookingItineraries[bookingId] = itinerary
        }
    }

    func submitSupportTicket() async {
        guard supportDraft.canSubmit else {
            bannerMessage = "Add a subject and message before sending."
            return
        }

        isSubmittingSupport = true
        defer { isSubmittingSupport = false }

        do {
            let ticket = try await api.submitSupportTicket(supportDraft)
            content.supportTickets.insert(ticket, at: 0)
            supportDraft = SupportTicketDraft()
            bannerMessage = "Support request sent."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func markNotificationRead(_ notification: VisitNotification) async {
        guard notification.isRead != true else { return }
        do {
            let updated = try await api.markNotificationRead(id: notification.id)
            if let index = content.notifications.firstIndex(where: { $0.id == notification.id }) {
                content.notifications[index] = updated
            }
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func saveGuideAvailability() async {
        isSavingAvailability = true
        defer { isSavingAvailability = false }

        do {
            let saved = try await api.updateGuideAvailability(
                GuideAvailabilitySettings(
                    availability: availabilityDraft,
                    workingHours: content.guideAvailability?.workingHours
                )
            )
            content.guideAvailability = saved
            availabilityDraft = saved.availability
            bannerMessage = "Availability updated."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func markTrainingModuleComplete(_ module: TrainingModule) async {
        isRunningGuideAction = true
        defer { isRunningGuideAction = false }

        do {
            let progress = try await api.updateTrainingProgress(moduleId: module.id, status: "completed")
            if let index = content.trainingProgress.firstIndex(where: { $0.moduleId == module.id }) {
                content.trainingProgress[index] = progress
            } else {
                content.trainingProgress.append(progress)
            }
            await refresh()
            bannerMessage = "Training progress updated."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func guideCheckIn(bookingId: String) async {
        await runGuideAction { try await self.api.guideCheckIn(bookingId: bookingId) }
    }

    func guideCheckOut(bookingId: String) async {
        await runGuideAction { try await self.api.guideCheckOut(bookingId: bookingId) }
    }

    func guideNoShow(bookingId: String) async {
        await runGuideAction { try await self.api.guideNoShow(bookingId: bookingId) }
    }

    // MARK: - Reviews

    func submitReview() async {
        guard reviewDraft.canSubmit else {
            bannerMessage = "Please complete all required fields."
            return
        }

        isSubmittingReview = true
        defer { isSubmittingReview = false }

        do {
            let submission = ReviewSubmission(
                bookingReference: reviewDraft.bookingReference,
                rating: reviewDraft.rating,
                title: reviewDraft.title,
                comment: reviewDraft.comment,
                visitorName: content.currentUser?.fullName,
                overallExperience: reviewDraft.overallExperience,
                guideExperience: reviewDraft.guideExperience,
                enjoyedMost: reviewDraft.enjoyedMost,
                improvementSuggestions: reviewDraft.improvementSuggestions,
                wouldRecommend: reviewDraft.wouldRecommend,
                wouldVisitAgain: reviewDraft.wouldVisitAgain,
                consentTestimonial: reviewDraft.consentTestimonial,
                consentDataProcessing: reviewDraft.consentDataProcessing
            )
            let newReview = try await api.submitReview(submission)
            content.publicReviews.insert(newReview, at: 0)
            reviewDraft = ReviewDraft()
            bannerMessage = "Review submitted successfully."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    // MARK: - Saved Itineraries

    func saveItinerary(name: String, tourType: String? = nil, selectedZones: [String]? = nil, selectedInterests: [String]? = nil, customDuration: String? = nil, specialRequests: String? = nil) async {
        isSavingItinerary = true
        defer { isSavingItinerary = false }

        do {
            let request = SavedItineraryCreateRequest(
                name: name,
                tourType: tourType,
                groupSize: nil,
                numberOfPeople: nil,
                selectedZones: selectedZones,
                selectedInterests: selectedInterests,
                customDuration: customDuration,
                meetingPointId: nil,
                specialRequests: specialRequests
            )
            let saved = try await api.createSavedItinerary(request)
            content.savedItineraries.insert(saved, at: 0)
            bannerMessage = "Itinerary saved."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    func deleteSavedItinerary(id: String) async {
        do {
            try await api.deleteSavedItinerary(id: id)
            content.savedItineraries.removeAll { $0.id == id }
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    // MARK: - Favorite Guides

    func toggleFavoriteGuide(guideId: String) async {
        let isFavorited = content.favoriteGuides.contains { $0.guideId == guideId }
        do {
            if isFavorited {
                try await api.removeFavoriteGuide(guideId: guideId)
                content.favoriteGuides.removeAll { $0.guideId == guideId }
            } else {
                let favorite = try await api.addFavoriteGuide(guideId: guideId)
                content.favoriteGuides.append(favorite)
            }
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    private func runGuideAction(_ action: () async throws -> Booking) async {
        isRunningGuideAction = true
        defer { isRunningGuideAction = false }

        do {
            _ = try await action()
            await refresh()
            bannerMessage = "Booking updated."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    private func runVisitorAction(_ action: () async throws -> Booking) async {
        isRunningVisitorAction = true
        defer { isRunningVisitorAction = false }

        do {
            let booking = try await action()
            updateBooking(booking)
            await refresh()
            bannerMessage = "Booking updated."
        } catch {
            bannerMessage = error.localizedDescription
        }
    }

    private func updateBooking(_ booking: Booking) {
        if let index = content.bookings.firstIndex(where: { $0.id == booking.id }) {
            content.bookings[index] = booking
        }
        if let index = content.guideTours.firstIndex(where: { $0.id == booking.id }) {
            content.guideTours[index] = booking
        }
    }

    private func prefillBookingFromUser() {
        guard let user = content.currentUser else { return }
        if bookingDraft.visitorName.isEmpty {
            bookingDraft.visitorName = user.fullName
        }
        if bookingDraft.email.isEmpty {
            bookingDraft.email = user.email
        }
        if bookingDraft.phone.isEmpty, let phone = user.phone {
            bookingDraft.phone = phone
        }
    }

    private func prefillProfileFromUser() {
        guard let user = content.currentUser else { return }
        if profileDraft.firstName.isEmpty && profileDraft.lastName.isEmpty && profileDraft.phone.isEmpty {
            profileDraft.populate(from: user)
        }
    }

    private func prefillAvailability() {
        guard let settings = content.guideAvailability else { return }
        availabilityDraft = settings.availability
    }
}

@MainActor
final class NotificationPermissionPromptModel: ObservableObject {
    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var dismissedUntil: Date?
    @Published var isRequesting = false

    private let dismissedUntilKey = "visit_dzaleka_notification_dismissed_until"

    init() {
        dismissedUntil = UserDefaults.standard.object(forKey: dismissedUntilKey) as? Date
    }

    var shouldShowPrompt: Bool {
        authorizationStatus == .notDetermined && (dismissedUntil ?? .distantPast) <= Date()
    }

    func refresh() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }

    func enableNotifications() async -> Bool {
        isRequesting = true
        defer { isRequesting = false }

        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            await refresh()
            return granted
        } catch {
            await refresh()
            return false
        }
    }

    func dismissForNow() {
        let nextPromptDate = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date().addingTimeInterval(259_200)
        dismissedUntil = nextPromptDate
        UserDefaults.standard.set(nextPromptDate, forKey: dismissedUntilKey)
    }
}
