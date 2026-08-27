import Foundation

protocol VisitDzalekaAPI {
    func fetchAppContent() async throws -> AppContent
    func login(email: String, password: String) async throws -> VisitUser
    func register(email: String, password: String, firstName: String, lastName: String) async throws -> VisitUser
    func requestPasswordReset(email: String) async throws -> String
    func resetPassword(token: String, password: String) async throws -> String
    func verifyEmail(token: String) async throws -> String
    func updateProfile(_ draft: ProfileDraft) async throws -> VisitUser
    func logout() async throws
    func submitBooking(_ draft: BookingDraft) async throws -> Booking
    func reportVisitorPayment(bookingId: String, draft: PaymentReportDraft) async throws -> Booking
    func cancelVisitorBooking(bookingId: String, reason: String) async throws -> Booking
    func rateGuide(bookingId: String, rating: Int) async throws -> String
    func fetchBookingItinerary(bookingId: String) async throws -> ItineraryRecord
    func fetchBookingActivity(bookingId: String) async throws -> [BookingActivity]
    func fetchBookingEmailTimeline(bookingId: String) async throws -> [EmailTimelineItem]
    func submitSupportTicket(_ draft: SupportTicketDraft) async throws -> SupportTicket
    func markNotificationRead(id: String) async throws -> VisitNotification
    func updateGuideAvailability(_ settings: GuideAvailabilitySettings) async throws -> GuideAvailabilitySettings
    func updateTrainingProgress(moduleId: String, status: String) async throws -> TrainingProgress
    func guideCheckIn(bookingId: String) async throws -> Booking
    func guideCheckOut(bookingId: String) async throws -> Booking
    func guideNoShow(bookingId: String) async throws -> Booking
    // Blog
    func fetchBlogPosts() async throws -> [BlogPost]
    func fetchBlogPost(slug: String) async throws -> BlogPost
    // Events
    func fetchEvents() async throws -> [CampEvent]
    // Public Reviews
    func fetchPublicReviews() async throws -> [PublicReview]
    func submitReview(_ submission: ReviewSubmission) async throws -> PublicReview
    // Saved Itineraries
    func fetchSavedItineraries() async throws -> [SavedItinerary]
    func createSavedItinerary(_ request: SavedItineraryCreateRequest) async throws -> SavedItinerary
    func deleteSavedItinerary(id: String) async throws
    // Favorite Guides
    func fetchFavoriteGuides() async throws -> [FavoriteGuideEntry]
    func addFavoriteGuide(guideId: String) async throws -> FavoriteGuideEntry
    func removeFavoriteGuide(guideId: String) async throws
    // Community
    func fetchCommunityServices() async throws -> [CommunityItem]
    func fetchCommunityEvents() async throws -> [CommunityItem]
    func fetchCommunityNews() async throws -> [CommunityItem]
    // Visitor Resources
    func fetchVisitorResources() async throws -> [VisitorResource]
}

struct VisitDzalekaAPIError: LocalizedError {
    var statusCode: Int
    var message: String

    var errorDescription: String? {
        message
    }
}

struct URLSessionVisitDzalekaAPI: VisitDzalekaAPI {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(
        baseURL: URL = URL(string: Bundle.main.object(forInfoDictionaryKey: "VisitDzalekaAppURL") as? String ?? "https://visit.dzaleka.com")!,
        session: URLSession? = nil
    ) {
        self.baseURL = baseURL
        if let session {
            self.session = session
        } else {
            let configuration = URLSessionConfiguration.default
            configuration.httpCookieAcceptPolicy = .always
            configuration.httpCookieStorage = .shared
            configuration.httpShouldSetCookies = true
            configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
            self.session = URLSession(configuration: configuration)
        }
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    func fetchAppContent() async throws -> AppContent {
        // Public data (no auth needed)
        async let publicContent: [String: String] = request("/api/content")
        async let zones: [Zone] = request("/api/public/zones")
        async let points: [PointOfInterest] = request("/api/public/points-of-interest")
        async let meetingPoints: [MeetingPoint] = request("/api/public/meeting-points")
        async let specialOffers: [SpecialOffer] = request("/api/public/special-offers")
        async let blogPosts: [BlogPost] = request("/api/blog")
        async let events: [CampEvent] = request("/api/events")
        async let publicReviews: [PublicReview] = request("/api/public/reviews")
        async let communityServices: [CommunityItem] = request("/api/community/services")
        async let communityEvents: [CommunityItem] = request("/api/community/events")
        async let communityNews: [CommunityItem] = request("/api/community/news")

        let user = try? await currentUser()

        var bookings: [Booking] = []
        var guideProfile: Guide?
        var guideTours: [Booking] = []
        var guideEarnings: GuideEarnings?
        var trainingStats: TrainingStats?
        var supportTickets: [SupportTicket] = []
        var notifications: [VisitNotification] = []
        var guideAvailability: GuideAvailabilitySettings?
        var trainingModules: [TrainingModule] = []
        var trainingProgress: [TrainingProgress] = []
        var savedItineraries: [SavedItinerary] = []
        var favoriteGuides: [FavoriteGuideEntry] = []
        var visitorResources: [VisitorResource] = []

        if let user {
            supportTickets = (try? await request("/api/support/tickets")) ?? []
            let rawNotifications: [VisitNotification] = (try? await request("/api/notifications")) ?? []
            notifications = rawNotifications.filter { $0.isVisible(for: user.role) }
            savedItineraries = (try? await request("/api/visitors/saved-itineraries")) ?? []
            favoriteGuides = (try? await request("/api/visitors/favorite-guides")) ?? []
            visitorResources = (try? await request("/api/visitor-resources")) ?? []

            switch user.role {
            case .some(.guide):
                guideProfile = try? await request("/api/guides/me")
                guideTours = (try? await request("/api/guides/me/tours")) ?? []
                guideEarnings = try? await request("/api/guides/me/earnings")
                trainingStats = try? await request("/api/training/stats")
                guideAvailability = try? await request("/api/guides/me/availability")
                trainingModules = (try? await request("/api/training/modules")) ?? []
                trainingProgress = (try? await request("/api/training/progress")) ?? []
                bookings = guideTours
            case .some(.admin), .some(.coordinator), .some(.security):
                bookings = (try? await request("/api/bookings/today")) ?? []
            default:
                bookings = (try? await request("/api/bookings/my-bookings")) ?? []
            }
        }

        return AppContent(
            publicContent: try await publicContent,
            currentUser: user,
            bookings: bookings,
            guideProfile: guideProfile,
            guideTours: guideTours,
            guideEarnings: guideEarnings,
            trainingStats: trainingStats,
            zones: try await zones,
            pointsOfInterest: try await points,
            meetingPoints: try await meetingPoints,
            specialOffers: try await specialOffers,
            supportTickets: supportTickets,
            notifications: notifications,
            guideAvailability: guideAvailability,
            trainingModules: trainingModules,
            trainingProgress: trainingProgress,
            blogPosts: (try? await blogPosts) ?? [],
            events: (try? await events) ?? [],
            publicReviews: (try? await publicReviews) ?? [],
            savedItineraries: savedItineraries,
            favoriteGuides: favoriteGuides,
            communityServices: (try? await communityServices) ?? [],
            communityEvents: (try? await communityEvents) ?? [],
            communityNews: (try? await communityNews) ?? [],
            visitorResources: visitorResources
        )
    }

    func login(email: String, password: String) async throws -> VisitUser {
        try await request("/api/auth/login", method: "POST", body: LoginRequest(email: email, password: password))
    }

    func register(email: String, password: String, firstName: String, lastName: String) async throws -> VisitUser {
        try await request(
            "/api/auth/register",
            method: "POST",
            body: RegisterRequest(email: email, password: password, firstName: firstName, lastName: lastName)
        )
    }

    func requestPasswordReset(email: String) async throws -> String {
        let response: APIMessage = try await request(
            "/api/auth/forgot-password",
            method: "POST",
            body: ForgotPasswordRequest(email: email)
        )
        return response.message ?? "If an account exists, reset instructions have been sent."
    }

    func resetPassword(token: String, password: String) async throws -> String {
        let response: APIMessage = try await request(
            "/api/auth/reset-password",
            method: "POST",
            body: ResetPasswordRequest(token: token, password: password)
        )
        return response.message ?? "Password reset successful."
    }

    func verifyEmail(token: String) async throws -> String {
        let response: APIMessage = try await request(
            "/api/auth/verify-email",
            method: "POST",
            body: VerifyEmailRequest(token: token)
        )
        return response.message ?? "Email verified successfully."
    }

    func updateProfile(_ draft: ProfileDraft) async throws -> VisitUser {
        try await request(
            "/api/auth/profile",
            method: "PATCH",
            body: ProfileUpdateRequest(
                firstName: draft.firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                lastName: draft.lastName.trimmingCharacters(in: .whitespacesAndNewlines),
                phone: draft.phone.trimmingCharacters(in: .whitespacesAndNewlines),
                emailNotifications: draft.emailNotifications
            )
        )
    }

    func logout() async throws {
        let _: APIMessage = try await request("/api/auth/logout", method: "POST", body: EmptyBody())
    }

    func submitBooking(_ draft: BookingDraft) async throws -> Booking {
        let requestBody = BookingCreateRequest(
            visitorName: draft.visitorName.trimmingCharacters(in: .whitespacesAndNewlines),
            visitorEmail: draft.email.trimmingCharacters(in: .whitespacesAndNewlines),
            visitorPhone: draft.phone.trimmingCharacters(in: .whitespacesAndNewlines),
            visitDate: draft.preferredDate.apiDate,
            visitTime: draft.preferredDate.apiTime,
            groupSize: draft.groupSize.bookingGroupSize,
            numberOfPeople: draft.groupSize,
            tourType: draft.tourType,
            paymentMethod: draft.paymentMethod,
            meetingPointId: draft.meetingPointId.isEmpty ? nil : draft.meetingPointId,
            selectedZones: [],
            selectedInterests: [draft.purpose, draft.language, draft.country].filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty },
            specialRequests: draft.notes.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            accessibilityNeeds: nil,
            referralSource: "ios_app",
            source: "ios_app"
        )
        return try await request("/api/bookings", method: "POST", body: requestBody)
    }

    func reportVisitorPayment(bookingId: String, draft: PaymentReportDraft) async throws -> Booking {
        try await request(
            "/api/bookings/\(bookingId)/visitor-payment",
            method: "PATCH",
            body: VisitorPaymentRequest(
                paymentMethod: draft.paymentMethod,
                paymentReference: draft.paymentReference.trimmingCharacters(in: .whitespacesAndNewlines),
                note: draft.note.trimmingCharacters(in: .whitespacesAndNewlines)
            )
        )
    }

    func cancelVisitorBooking(bookingId: String, reason: String) async throws -> Booking {
        try await request(
            "/api/bookings/\(bookingId)/visitor-cancel",
            method: "POST",
            body: VisitorCancelRequest(reason: reason.trimmingCharacters(in: .whitespacesAndNewlines))
        )
    }

    func rateGuide(bookingId: String, rating: Int) async throws -> String {
        let response: APIMessage = try await request(
            "/api/bookings/\(bookingId)/rate-guide",
            method: "POST",
            body: GuideRatingRequest(rating: rating)
        )
        return response.message ?? "Guide rated successfully."
    }

    func fetchBookingItinerary(bookingId: String) async throws -> ItineraryRecord {
        try await request("/api/bookings/\(bookingId)/itinerary")
    }

    func fetchBookingActivity(bookingId: String) async throws -> [BookingActivity] {
        try await request("/api/bookings/\(bookingId)/activity")
    }

    func fetchBookingEmailTimeline(bookingId: String) async throws -> [EmailTimelineItem] {
        try await request("/api/bookings/\(bookingId)/email-timeline")
    }

    func submitSupportTicket(_ draft: SupportTicketDraft) async throws -> SupportTicket {
        let body = SupportTicketCreateRequest(
            subject: draft.subject.trimmingCharacters(in: .whitespacesAndNewlines),
            message: "[\(draft.category)] \(draft.message.trimmingCharacters(in: .whitespacesAndNewlines))",
            priority: "normal"
        )
        return try await request("/api/support/tickets", method: "POST", body: body)
    }

    func markNotificationRead(id: String) async throws -> VisitNotification {
        try await request("/api/notifications/\(id)/read", method: "PATCH", body: EmptyBody())
    }

    func updateGuideAvailability(_ settings: GuideAvailabilitySettings) async throws -> GuideAvailabilitySettings {
        try await request("/api/guides/me/availability", method: "PATCH", body: settings)
    }

    func updateTrainingProgress(moduleId: String, status: String) async throws -> TrainingProgress {
        try await request(
            "/api/training/progress/\(moduleId)",
            method: "POST",
            body: TrainingProgressUpdateRequest(status: status)
        )
    }

    func guideCheckIn(bookingId: String) async throws -> Booking {
        try await request("/api/bookings/\(bookingId)/guide-check-in", method: "POST", body: EmptyBody())
    }

    func guideCheckOut(bookingId: String) async throws -> Booking {
        try await request("/api/bookings/\(bookingId)/guide-check-out", method: "POST", body: EmptyBody())
    }

    func guideNoShow(bookingId: String) async throws -> Booking {
        try await request("/api/bookings/\(bookingId)/guide-no-show", method: "POST", body: EmptyBody())
    }

    // MARK: - Blog

    func fetchBlogPosts() async throws -> [BlogPost] {
        try await request("/api/blog")
    }

    func fetchBlogPost(slug: String) async throws -> BlogPost {
        try await request("/api/blog/\(slug)")
    }

    // MARK: - Events

    func fetchEvents() async throws -> [CampEvent] {
        try await request("/api/events")
    }

    // MARK: - Public Reviews

    func fetchPublicReviews() async throws -> [PublicReview] {
        try await request("/api/public/reviews")
    }

    func submitReview(_ submission: ReviewSubmission) async throws -> PublicReview {
        try await request("/api/public/reviews/request", method: "POST", body: submission)
    }

    // MARK: - Saved Itineraries

    func fetchSavedItineraries() async throws -> [SavedItinerary] {
        try await request("/api/visitors/saved-itineraries")
    }

    func createSavedItinerary(_ body: SavedItineraryCreateRequest) async throws -> SavedItinerary {
        try await request("/api/visitors/saved-itineraries", method: "POST", body: body)
    }

    func deleteSavedItinerary(id: String) async throws {
        let _: APIMessage = try await request("/api/visitors/saved-itineraries/\(id)", method: "DELETE")
    }

    // MARK: - Favorite Guides

    func fetchFavoriteGuides() async throws -> [FavoriteGuideEntry] {
        try await request("/api/visitors/favorite-guides")
    }

    func addFavoriteGuide(guideId: String) async throws -> FavoriteGuideEntry {
        try await request("/api/visitors/favorite-guides/\(guideId)", method: "POST", body: EmptyBody())
    }

    func removeFavoriteGuide(guideId: String) async throws {
        let _: APIMessage = try await request("/api/visitors/favorite-guides/\(guideId)", method: "DELETE")
    }

    // MARK: - Community

    func fetchCommunityServices() async throws -> [CommunityItem] {
        try await request("/api/community/services")
    }

    func fetchCommunityEvents() async throws -> [CommunityItem] {
        try await request("/api/community/events")
    }

    func fetchCommunityNews() async throws -> [CommunityItem] {
        try await request("/api/community/news")
    }

    // MARK: - Visitor Resources

    func fetchVisitorResources() async throws -> [VisitorResource] {
        try await request("/api/visitor-resources")
    }

    private func currentUser() async throws -> VisitUser {
        try await request("/api/auth/user")
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET") async throws -> T {
        var urlRequest = URLRequest(url: url(for: path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.setValue("VisitDzaleka-iOS/1.0", forHTTPHeaderField: "User-Agent")
        return try await perform(urlRequest)
    }

    private func request<T: Decodable>(_ path: String, method: String, body: some Encodable) async throws -> T {
        var urlRequest = URLRequest(url: url(for: path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("VisitDzaleka-iOS/1.0", forHTTPHeaderField: "User-Agent")
        urlRequest.httpBody = try encoder.encode(body)
        return try await perform(urlRequest)
    }

    private func perform<T: Decodable>(_ urlRequest: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: urlRequest)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw VisitDzalekaAPIError(statusCode: -1, message: "Invalid server response.")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let apiMessage = try? decoder.decode(APIMessage.self, from: data)
            throw VisitDzalekaAPIError(
                statusCode: httpResponse.statusCode,
                message: apiMessage?.message ?? "Request failed with status \(httpResponse.statusCode)."
            )
        }

        if T.self == EmptyResponse.self {
            return EmptyResponse() as! T
        }
        return try decoder.decode(T.self, from: data)
    }

    private func url(for path: String) -> URL {
        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }
        return URL(string: path, relativeTo: baseURL)!.absoluteURL
    }
}

private struct LoginRequest: Encodable {
    var email: String
    var password: String
}

private struct RegisterRequest: Encodable {
    var email: String
    var password: String
    var firstName: String
    var lastName: String
}

private struct ForgotPasswordRequest: Encodable {
    var email: String
}

private struct ResetPasswordRequest: Encodable {
    var token: String
    var password: String
}

private struct VerifyEmailRequest: Encodable {
    var token: String
}

private struct ProfileUpdateRequest: Encodable {
    var firstName: String
    var lastName: String
    var phone: String
    var emailNotifications: Bool
}

private struct VisitorPaymentRequest: Encodable {
    var paymentMethod: String
    var paymentReference: String
    var note: String
}

private struct VisitorCancelRequest: Encodable {
    var reason: String
}

private struct GuideRatingRequest: Encodable {
    var rating: Int
}

private struct TrainingProgressUpdateRequest: Encodable {
    var status: String
}

private struct EmptyBody: Encodable {}
private struct EmptyResponse: Decodable {}
private struct APIMessage: Decodable {
    var message: String?
}

private extension Int {
    var bookingGroupSize: String {
        switch self {
        case 1: return "individual"
        case 2...5: return "small_group"
        case 6...10: return "large_group"
        default: return "custom"
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}

private extension Date {
    var apiDate: String {
        Self.apiDateFormatter.string(from: self)
    }

    var apiTime: String {
        Self.apiTimeFormatter.string(from: self)
    }

    static let apiDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static let apiTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "HH:mm"
        return formatter
    }()
}
