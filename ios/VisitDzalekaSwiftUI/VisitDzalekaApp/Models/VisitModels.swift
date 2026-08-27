import Foundation

struct AppContent: Codable, Equatable {
    var publicContent: [String: String]
    var currentUser: VisitUser?
    var bookings: [Booking]
    var guideProfile: Guide?
    var guideTours: [Booking]
    var guideEarnings: GuideEarnings?
    var trainingStats: TrainingStats?
    var zones: [Zone]
    var pointsOfInterest: [PointOfInterest]
    var meetingPoints: [MeetingPoint]
    var specialOffers: [SpecialOffer]
    var supportTickets: [SupportTicket]
    var notifications: [VisitNotification]
    var guideAvailability: GuideAvailabilitySettings?
    var trainingModules: [TrainingModule]
    var trainingProgress: [TrainingProgress]
    var blogPosts: [BlogPost]
    var events: [CampEvent]
    var publicReviews: [PublicReview]
    var savedItineraries: [SavedItinerary]
    var favoriteGuides: [FavoriteGuideEntry]
    var communityServices: [CommunityItem]
    var communityEvents: [CommunityItem]
    var communityNews: [CommunityItem]
    var visitorResources: [VisitorResource]

    static let empty = AppContent(
        publicContent: [:],
        currentUser: nil,
        bookings: [],
        guideProfile: nil,
        guideTours: [],
        guideEarnings: nil,
        trainingStats: nil,
        zones: [],
        pointsOfInterest: [],
        meetingPoints: [],
        specialOffers: [],
        supportTickets: [],
        notifications: [],
        guideAvailability: nil,
        trainingModules: [],
        trainingProgress: [],
        blogPosts: [],
        events: [],
        publicReviews: [],
        savedItineraries: [],
        favoriteGuides: [],
        communityServices: [],
        communityEvents: [],
        communityNews: [],
        visitorResources: []
    )
}

struct VisitUser: Identifiable, Codable, Equatable {
    let id: String
    var email: String
    var firstName: String?
    var lastName: String?
    var phone: String?
    var role: UserRole?
    var isActive: Bool?
    var emailVerified: Bool?
    var emailNotifications: Bool?

    var fullName: String {
        [firstName, lastName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }
}

enum UserRole: String, Codable, Equatable {
    case admin
    case coordinator
    case guide
    case security
    case visitor

    var label: String {
        rawValue.replacingOccurrences(of: "_", with: " ").capitalized
    }

    var canUseGuideWorkflow: Bool {
        self == .guide
    }
}

struct LoginDraft: Equatable {
    var email = ""
    var password = ""

    var canSubmit: Bool {
        email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@") && !password.isEmpty
    }
}

struct RegisterDraft: Equatable {
    var firstName = ""
    var lastName = ""
    var email = ""
    var password = ""

    var canSubmit: Bool {
        !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@") &&
        password.count >= 6
    }
}

struct PasswordHelpDraft: Equatable {
    var email = ""
    var resetToken = ""
    var newPassword = ""
    var verificationToken = ""

    var canRequestReset: Bool {
        email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@")
    }

    var canResetPassword: Bool {
        !resetToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && newPassword.count >= 6
    }

    var canVerifyEmail: Bool {
        !verificationToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

struct ProfileDraft: Equatable {
    var firstName = ""
    var lastName = ""
    var phone = ""
    var emailNotifications = true

    mutating func populate(from user: VisitUser) {
        firstName = user.firstName ?? ""
        lastName = user.lastName ?? ""
        phone = user.phone ?? ""
        emailNotifications = user.emailNotifications ?? true
    }
}

struct BookingDraft: Equatable {
    var visitorName = ""
    var email = ""
    var phone = ""
    var country = ""
    var preferredDate = Date()
    var groupSize = 1
    var language = "English"
    var purpose = "Community visit"
    var tourType = "standard"
    var paymentMethod = "cash"
    var meetingPointId = ""
    var notes = ""
    var acceptsGuidelines = false

    var canSubmit: Bool {
        !visitorName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@") &&
        !phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        acceptsGuidelines
    }
}

struct PaymentReportDraft: Equatable {
    var paymentMethod = "cash"
    var paymentReference = ""
    var note = ""
}

struct CancellationDraft: Equatable {
    var reason = ""
}

struct GuideRatingDraft: Equatable {
    var rating = 5
}

struct BookingCreateRequest: Encodable {
    var visitorName: String
    var visitorEmail: String
    var visitorPhone: String
    var visitDate: String
    var visitTime: String
    var groupSize: String
    var numberOfPeople: Int
    var tourType: String
    var paymentMethod: String
    var meetingPointId: String?
    var selectedZones: [String]
    var selectedInterests: [String]
    var specialRequests: String?
    var accessibilityNeeds: String?
    var referralSource: String?
    var source: String
}

struct Booking: Identifiable, Codable, Equatable {
    let id: String
    var bookingReference: String?
    var visitorName: String
    var visitorEmail: String?
    var visitorPhone: String?
    var visitDate: String
    var visitTime: String
    var groupSize: String?
    var numberOfPeople: Int?
    var tourType: String?
    var paymentMethod: String?
    var paymentStatus: PaymentStatus?
    var status: BookingStatus?
    var meetingPointId: String?
    var selectedZones: [String]?
    var selectedInterests: [String]?
    var specialRequests: String?
    var accessibilityNeeds: String?
    var totalAmount: Int?
    var assignedGuideId: String?
    var checkInTime: String?
    var checkOutTime: String?
    var guidePayment: Int?
    var visitorRating: Int?
    var guide: Guide?
    var createdAt: String?

    var referenceText: String {
        bookingReference ?? id
    }

    var visitorCount: Int {
        numberOfPeople ?? 1
    }

    var tourTitle: String {
        switch tourType {
        case "extended": return "Extended Walking Tour"
        case "custom": return "Custom Visit"
        default: return "Dzaleka Guided Walking Tour"
        }
    }
}

enum BookingStatus: String, Codable, Equatable {
    case pending
    case confirmed
    case inProgress = "in_progress"
    case completed
    case cancelled
    case noShow = "no_show"

    var label: String {
        switch self {
        case .pending: return "Request received"
        case .confirmed: return "Confirmed"
        case .inProgress: return "In progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .noShow: return "No-show"
        }
    }
}

enum PaymentStatus: String, Codable, Equatable {
    case pending
    case paid
    case refunded

    var label: String {
        switch self {
        case .pending: return "Pending verification"
        case .paid: return "Verified"
        case .refunded: return "Refunded"
        }
    }
}

struct Guide: Identifiable, Codable, Equatable {
    let id: String
    var userId: String?
    var firstName: String
    var lastName: String
    var email: String?
    var phone: String?
    var profileImageUrl: String?
    var bio: String?
    var languages: [String]?
    var specialties: [String]?
    var isActive: Bool?
    var totalTours: Int?
    var completedTours: Int?
    var totalEarnings: Int?
    var rating: Double?
    var totalRatings: Int?
    var preferredPaymentMethod: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}

struct GuideEarnings: Codable, Equatable {
    var totalEarnings: Int?
    var weeklyEarnings: Int?
    var monthlyEarnings: Int?
    var totalTours: Int?
    var payoutSummary: PayoutSummary?
}

struct PayoutSummary: Codable, Equatable {
    var pendingAmount: Int?
    var pendingCount: Int?
    var paidAmount: Int?
    var paidCount: Int?
    var lastPaidAt: String?
    var status: String?
}

struct TrainingStats: Codable, Equatable {
    var completed: Int
    var total: Int
    var percentage: Int
}

struct TrainingModule: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var description: String?
    var targetAudience: String?
    var isRequired: Bool?
    var estimatedDuration: Int?
    var orderIndex: Int?
}

struct TrainingProgress: Identifiable, Codable, Equatable {
    let id: String
    var guideId: String?
    var moduleId: String?
    var status: String?
    var completedAt: String?
}

struct GuideAvailabilitySettings: Codable, Equatable {
    var availability: [String: Bool]
    var workingHours: [String: String]?
}

struct Zone: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String?
    var zoneType: String?
    var icon: String?
}

struct PointOfInterest: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String?
    var category: String?
    var estimatedDurationMinutes: Int?
    var photoPolicy: PhotoPolicy?
    var mobilityLevel: MobilityLevel?
    var requiresPermission: Bool?
    var serviceDirectoryUrl: String?
}

struct MeetingPoint: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String?
    var address: String?
    var googleMapsUrl: String?
    var meetingInstructions: String?
    var guideIdentificationNote: String?
    var arrivalBufferMinutes: Int?
    var isDefault: Bool?
}

struct SpecialOffer: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var description: String?
    var discountPercent: Int
    var activityStartDate: String
    var activityEndDate: String
    var tourTypes: [String]?
    var groupSizes: [String]?
}

struct SupportTicketDraft: Equatable {
    var subject = ""
    var category = "Booking"
    var message = ""

    var canSubmit: Bool {
        !subject.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

struct SupportTicketCreateRequest: Encodable {
    var subject: String
    var message: String
    var priority: String
}

struct SupportTicket: Identifiable, Codable, Equatable {
    let id: String
    var subject: String
    var message: String
    var status: String?
    var priority: String?
    var adminNotes: String?
    var createdAt: String?
}

struct VisitNotification: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var message: String
    var type: String?
    var link: String?
    var isRead: Bool?
    var relatedId: String?
    var createdAt: String?

    func isVisible(for role: UserRole?) -> Bool {
        let notificationType = type ?? "system"
        let path = normalizedPath(link)
        let internalTypes: Set<String> = ["booking_created", "check_in", "check_out", "incident_reported", "payment_received"]
        let internalPaths = [
            "/admin", "/analytics", "/audit-logs", "/bookings", "/calendar", "/cms",
            "/dashboard", "/developer-settings", "/email-history", "/email-settings",
            "/getyourguide", "/guide-certificates", "/guide-performance", "/guides",
            "/help-admin", "/live-ops", "/operations-manual", "/payments",
            "/recurring-bookings", "/reports", "/revenue", "/security", "/security-admin",
            "/settings", "/task-admin", "/training-admin", "/users", "/zones"
        ]

        switch role {
        case .admin, .coordinator:
            return true
        case .security:
            return notificationType == "incident_reported" ||
                notificationType == "system" ||
                pathMatches(path, prefixes: ["/security", "/security-admin", "/live-ops", "/support"])
        case .guide:
            let allowedTypes: Set<String> = ["booking_cancelled", "booking_completed", "guide_assigned", "system"]
            guard allowedTypes.contains(notificationType) else { return false }
            if path.isEmpty { return true }
            return !pathMatches(path, prefixes: internalPaths) ||
                pathMatches(path, prefixes: ["/calendar", "/guide-training", "/my-availability", "/my-earnings", "/my-tours", "/support", "/tasks"])
        default:
            let allowedTypes: Set<String> = ["booking_cancelled", "booking_completed", "booking_confirmed", "payment_verified", "system"]
            guard allowedTypes.contains(notificationType), !internalTypes.contains(notificationType) else { return false }
            return !pathMatches(path, prefixes: internalPaths)
        }
    }

    private func normalizedPath(_ link: String?) -> String {
        guard let link, !link.isEmpty else { return "" }
        if let url = URL(string: link), let host = url.host, !host.isEmpty {
            return url.path
        }
        return link.components(separatedBy: "?")[0].components(separatedBy: "#")[0]
    }

    private func pathMatches(_ path: String, prefixes: [String]) -> Bool {
        prefixes.contains { prefix in
            path == prefix || path.hasPrefix("\(prefix)/")
        }
    }
}

struct BookingActivity: Identifiable, Codable, Equatable {
    let id: String
    var action: String
    var description: String?
    var oldStatus: String?
    var newStatus: String?
    var createdAt: String?
}

struct EmailTimelineItem: Identifiable, Codable, Equatable {
    let id: String
    var subject: String?
    var templateType: String?
    var status: String?
    var recipientEmail: String?
    var createdAt: String?
}

struct ItineraryRecord: Codable, Equatable {
    var id: String?
    var content: ItineraryContent?
    var createdAt: String?
    var updatedAt: String?
}

struct ItineraryContent: Codable, Equatable {
    var recipientName: String?
    var bookingReference: String?
    var date: String?
    var duration: String?
    var version: Int?
    var guideName: String?
    var paymentStatus: String?
    var meetingPoint: String?
    var items: [ItineraryItem]?
    var pois: [String]?
    var organizationStops: String?
    var notes: String?
}

struct ItineraryItem: Codable, Equatable, Identifiable {
    var id: String { "\(time)-\(activity)" }
    var time: String
    var activity: String
    var description: String?
}

enum PhotoPolicy: String, Codable, Equatable {
    case allowed
    case askFirst = "ask_first"
    case restricted

    var label: String {
        switch self {
        case .allowed: return "Allowed"
        case .askFirst: return "Ask first"
        case .restricted: return "Restricted"
        }
    }
}

enum MobilityLevel: String, Codable, Equatable {
    case easy
    case moderate
    case difficult

    var label: String {
        switch self {
        case .easy: return "Easy"
        case .moderate: return "Moderate"
        case .difficult: return "Difficult"
        }
    }
}

// MARK: - Blog

struct BlogPost: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var slug: String?
    var content: String?
    var excerpt: String?
    var coverImage: String?
    var author: String?
    var published: Bool?
    var tags: [String]?
    var createdAt: String?
    var updatedAt: String?
}

// MARK: - Events

struct CampEvent: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var description: String?
    var date: String?
    var time: String?
    var location: String?
    var image: String?
    var link: String?
    var category: String?
    var isFeatured: Bool?
}

// MARK: - Public Reviews

struct PublicReview: Identifiable, Codable, Equatable {
    let id: String
    var rating: Int?
    var title: String?
    var comment: String?
    var visitorName: String?
    var source: String?
    var submittedAt: String?
    var responseText: String?
}

struct ReviewSubmission: Encodable {
    var bookingReference: String
    var rating: Int
    var title: String?
    var comment: String?
    var visitorName: String?
    var overallExperience: String?
    var guideExperience: String?
    var enjoyedMost: String?
    var improvementSuggestions: String?
    var wouldRecommend: Bool?
    var wouldVisitAgain: Bool?
    var consentTestimonial: Bool
    var consentDataProcessing: Bool
}

struct ReviewDraft: Equatable {
    var bookingReference = ""
    var rating = 5
    var title = ""
    var comment = ""
    var overallExperience = ""
    var guideExperience = ""
    var enjoyedMost = ""
    var improvementSuggestions = ""
    var wouldRecommend = true
    var wouldVisitAgain = true
    var consentTestimonial = true
    var consentDataProcessing = true

    var canSubmit: Bool {
        !bookingReference.trimmed.isEmpty && rating > 0 && !comment.trimmed.isEmpty && consentDataProcessing
    }
}

// MARK: - Saved Itineraries

struct SavedItinerary: Identifiable, Codable, Equatable {
    let id: String
    var userId: String?
    var name: String
    var tourType: String?
    var groupSize: String?
    var numberOfPeople: Int?
    var selectedZones: [String]?
    var selectedInterests: [String]?
    var customDuration: String?
    var meetingPointId: String?
    var specialRequests: String?
    var createdAt: String?
}

struct SavedItineraryCreateRequest: Encodable {
    var name: String
    var tourType: String?
    var groupSize: String?
    var numberOfPeople: Int?
    var selectedZones: [String]?
    var selectedInterests: [String]?
    var customDuration: String?
    var meetingPointId: String?
    var specialRequests: String?
}

// MARK: - Favorite Guides

struct FavoriteGuideEntry: Identifiable, Codable, Equatable {
    let id: String
    var userId: String?
    var guideId: String?
    var guide: Guide?
    var createdAt: String?
}

// MARK: - Community Hub

struct CommunityItem: Identifiable, Codable, Equatable {
    let id: String
    var title: String?
    var description: String?
    var content: String?
    var image: String?
    var url: String?
    var category: String?
    var date: String?
    var source: String?
}

// MARK: - Visitor Resources

struct VisitorResource: Identifiable, Codable, Equatable {
    let id: String
    var title: String
    var description: String?
    var targetAudience: String?
    var isRequired: Bool?
    var estimatedDuration: Int?
    var orderIndex: Int?
}
